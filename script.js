/* ==========================================================================
   THE LITTLE JOURNEY — SCRIPT
   Sections: 1. State  2. Scene order + progress  3. Scene transitions
   4. Loading sequence  5. Typewriter helpers  6. Chapter wiring
   7. Ambient toasts  8. Sound  9. Particles  10. Memory tree  11. Init
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- 1. STATE ---------- */
  // Central place to store every choice the player makes.
  // Keeping this in one object makes it easy to add new chapters later:
  // just add a key here and read/write it the same way the others do.
  const state = {
    ch1: null,   // door: gold | blue | green
    ch2: null,   // backpack item
    ch3: null,   // mirror answer
    ch4: '',     // letter text
    ch5: null    // kindness gift
  };

  /* ---------- 2. SCENE ORDER + PROGRESS ---------- */
  const SCENE_ORDER = [
    'scene-title', 'scene-ch1', 'scene-ch2', 'scene-ch3',
    'scene-ch4', 'scene-ch5', 'scene-final'
  ];
  // Chapters shown in the progress dots (title screen excluded).
  const PROGRESS_SCENES = ['scene-ch1', 'scene-ch2', 'scene-ch3', 'scene-ch4', 'scene-ch5', 'scene-final'];

  const progressEl = document.getElementById('progress');
  const progressLabel = document.getElementById('progressLabel');
  const progressDots = document.getElementById('progressDots');

  function buildProgressDots(){
    progressDots.innerHTML = '';
    PROGRESS_SCENES.forEach(() => {
      const dot = document.createElement('span');
      progressDots.appendChild(dot);
    });
  }

  function updateProgress(sceneId){
    const idx = PROGRESS_SCENES.indexOf(sceneId);
    if (idx === -1){
      progressEl.hidden = true;
      return;
    }
    progressEl.hidden = false;
    progressLabel.textContent = `Chapter ${idx + 1} of ${PROGRESS_SCENES.length}`;
    [...progressDots.children].forEach((dot, i) => {
      dot.classList.toggle('is-active', i === idx);
    });
  }

  /* ---------- 3. SCENE TRANSITIONS ---------- */
  let currentScene = 'scene-loading';

  function goTo(sceneId){
    const outgoing = document.getElementById(currentScene);
    const incoming = document.getElementById(sceneId);
    if (!incoming || sceneId === currentScene) return;

    playSound('whoosh');

    if (outgoing){
      outgoing.classList.add('is-leaving');
      outgoing.classList.remove('is-entering');
      setTimeout(() => {
        outgoing.classList.remove('is-active', 'is-leaving');
      }, 480);
    }

    setTimeout(() => {
      incoming.classList.add('is-active', 'is-entering');
      currentScene = sceneId;
      updateProgress(sceneId);
      runSceneEnter(sceneId);
      maybeShowAmbientToast();
    }, outgoing ? 380 : 0);
  }

  // Wire every [data-next] button once, up front.
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      goTo(btn.dataset.next);
    });
  });

  /* ---------- 4. LOADING SEQUENCE ---------- */
  const loadingText = document.getElementById('loadingText');
  const startBtn = document.getElementById('startBtn');

  const loadingLines = ['Preparing your journey...', 'Take your time.', "Let's begin."];

  function typeLine(el, text, speed = 38){
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const timer = setInterval(() => {
        el.textContent += text[i];
        i++;
        if (i >= text.length){
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  async function runLoadingSequence(){
    for (const line of loadingLines){
      await typeLine(loadingText, line);
      await wait(650);
      loadingText.textContent = '';
      await wait(150);
    }
    startBtn.hidden = false;
    startBtn.addEventListener('click', () => {
      playSound('click');
      document.getElementById('scene-loading').classList.remove('is-active');
      const title = document.getElementById('scene-title');
      title.classList.add('is-active', 'is-entering');
      currentScene = 'scene-title';
    });
  }

  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  /* ---------- 5. TYPEWRITER / REVEAL HELPERS ---------- */
  // Story lines fade in one after another whenever a scene becomes active,
  // giving each chapter a gentle narrative rhythm instead of dumping all
  // text on screen at once.
  function revealStoryText(root){
    const lines = root.querySelectorAll('[data-typewrite], [data-typewrite-final]');
    lines.forEach((line, i) => {
      line.classList.remove('is-visible');
      setTimeout(() => line.classList.add('is-visible'), 300 + i * 550);
    });
  }

  function runSceneEnter(sceneId){
    const scene = document.getElementById(sceneId);
    revealStoryText(scene);

    if (sceneId === 'scene-final'){
      const totalDelay = 300 + 3 * 550 + 700;
      setTimeout(showFinalMessage, totalDelay);
    }
  }

  function showFinalMessage(){
    const msg = document.getElementById('finalMessage');
    const actions = document.getElementById('finalActions');
    msg.hidden = false;
    msg.querySelectorAll('p').forEach((p, i) => {
      p.style.animationDelay = `${i * 260}ms`;
    });
    playSound('chime');
    setTimeout(() => { actions.hidden = false; }, msg.querySelectorAll('p').length * 260 + 500);
  }

  /* ---------- 6. CHAPTER WIRING ---------- */

  // --- Chapter 1: The Door ---
  const ch1Responses = {
    gold: ['You chose warmth.', 'Maybe you are someone who finds happiness in small moments.'],
    blue: ['You chose calm.', 'Maybe you notice things others often miss.'],
    green: ['You chose growth.', 'Maybe you believe tomorrow can always be better.']
  };

  document.querySelectorAll('.door').forEach(door => {
    door.addEventListener('click', () => {
      const value = door.dataset.value;
      state.ch1 = value;
      playSound('click');

      document.querySelectorAll('.door').forEach(d => {
        d.classList.toggle('is-chosen', d === door);
        d.classList.toggle('is-faded', d !== door);
      });

      const [line1, line2] = ch1Responses[value];
      document.getElementById('ch1-response-1').textContent = line1;
      document.getElementById('ch1-response-2').textContent = line2;
      const resp = document.getElementById('ch1-response');
      resp.hidden = false;
      resp.querySelectorAll('.response__line').forEach(l => {
        l.style.animation = 'none'; l.offsetHeight; l.style.animation = null;
      });
    });
  });

  // --- Chapter 2: The Invisible Backpack ---
  const ch2Responses = {
    memories: 'Your memories are part of your story. They helped create who you are.',
    difficult: 'The difficult moments did not define you. The fact that you kept moving says a lot.',
    dreams: 'There is something beautiful about people who still believe something better is possible.',
    lessons: 'The past teaches us, but it does not decide our future.'
  };
  wireChoiceGroup('ch2-choices', 'ch2', ch2Responses, 'ch2-response', 'ch2-response-text');

  // --- Chapter 3: The Mirror ---
  const ch3Responses = {
    'never-gave-up': 'Not everyone sees the battles you have won.',
    'care': 'The world needs more people who still choose kindness.',
    'grown': 'Growth is not always visible, but it is always meaningful.',
    'still-trying': 'Trying is underrated. Every change starts with someone refusing to quit.'
  };
  wireChoiceGroup('ch3-choices', 'ch3', ch3Responses, 'ch3-response', 'ch3-response-text');

  // --- Chapter 5: The Kindness Challenge ---
  const ch5Responses = {
    compliment: 'Sometimes one kind sentence stays with someone longer than we realize.',
    smile: "A smile is small, but it can change someone's entire day.",
    help: 'Small acts of kindness are how the world becomes softer.',
    time: 'Giving someone your attention is one of the most valuable gifts.'
  };
  wireChoiceGroup('ch5-choices', 'ch5', ch5Responses, 'ch5-response', 'ch5-response-text');

  function wireChoiceGroup(gridId, stateKey, responses, responseBoxId, responseTextId){
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const value = card.dataset.value;
        state[stateKey] = value;
        playSound('click');

        grid.querySelectorAll('.choice-card').forEach(c => {
          c.classList.toggle('is-chosen', c === card);
          c.classList.toggle('is-faded', c !== card);
        });

        const box = document.getElementById(responseBoxId);
        document.getElementById(responseTextId).textContent = responses[value];
        box.hidden = false;
      });
    });
  }

  // --- Chapter 4: The Letter ---
  const letterSubmit = document.getElementById('letterSubmit');
  const letterText = document.getElementById('letterText');
  const letterInputWrap = document.getElementById('letter-input');
  const letterEcho = document.getElementById('letterEcho');

  letterSubmit.addEventListener('click', () => {
    const value = letterText.value.trim();
    state.ch4 = value;
    playSound('click');

    letterEcho.textContent = value || "I hope you're proud of how far you've come.";
    letterInputWrap.hidden = true;
    document.getElementById('ch4-response').hidden = false;
  });

  /* ---------- 7. AMBIENT TOASTS ---------- */
  const AMBIENT_MESSAGES = [
    'Someone is lucky to know you.',
    'Your effort matters.',
    'Keep your heart soft.',
    'You are doing better than you think.'
  ];
  const toastEl = document.getElementById('ambientToast');
  let toastCount = 0;

  function maybeShowAmbientToast(){
    // Show an ambient message on roughly every other transition, so it
    // feels like a passing thought rather than a repeating notification.
    toastCount++;
    if (toastCount % 2 !== 0) return;
    const msg = AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)];
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  }

  /* ---------- 8. SOUND ---------- */
  // Tiny, dependency-free tones generated with the Web Audio API so the
  // project needs no external audio files to feel alive. Real ambient
  // music/sfx can be dropped into assets/audio and swapped in later
  // (see README "Suggested assets").
  let audioCtx;
  function getCtx(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function playSound(kind){
    try{
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if (kind === 'click'){
        osc.type = 'sine'; osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now); osc.stop(now + 0.2);
      } else if (kind === 'whoosh'){
        osc.type = 'sine'; osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.42);
      } else if (kind === 'chime'){
        [523.25, 659.25, 784].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, now + i * 0.16);
          g.gain.setValueAtTime(0.0001, now + i * 0.16);
          g.gain.linearRampToValueAtTime(0.05, now + i * 0.16 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 1.1);
          o.start(now + i * 0.16); o.stop(now + i * 0.16 + 1.2);
        });
      }
    } catch(e){ /* audio not available — fail silently */ }
  }

  /* ---------- 9. FLOATING PARTICLES ---------- */
  const canvas = document.getElementById('particles');
  const ctx2d = canvas.getContext('2d');
  let particles = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function makeParticles(){
    const count = window.innerWidth < 600 ? 18 : 34;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.6,
      speed: Math.random() * 0.35 + 0.08,
      drift: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.2
    }));
  }
  function animateParticles(){
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10){ p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx2d.fillStyle = `rgba(255, 209, 102, ${p.alpha})`;
      ctx2d.fill();
    });
    requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', () => { resizeCanvas(); makeParticles(); });

  /* ---------- 10. MEMORY TREE (Final Chapter) ---------- */
  // The player's choices shape the tree: kindness → flowers,
  // growth-flavoured choices → leaves, dream/reflective choices → stars.
  function decorateTree(){
    const decorGroup = document.getElementById('treeDecor');
    decorGroup.innerHTML = '';

    const branchTips = [
      { x: 80, y: 118 }, { x: 220, y: 118 }, { x: 150, y: 78 },
      { x: 110, y: 150 }, { x: 190, y: 150 }, { x: 150, y: 130 }
    ];

    const decorTypes = [];
    if (state.ch5) decorTypes.push('flower', 'flower');
    if (state.ch1 === 'green' || state.ch3 === 'grown' || state.ch3 === 'still-trying') decorTypes.push('leaf', 'leaf');
    if (state.ch2 === 'dreams' || state.ch1 === 'blue') decorTypes.push('star', 'star');
    if (state.ch3) decorTypes.push('leaf');
    if (state.ch2) decorTypes.push('leaf');
    if (state.ch4) decorTypes.push('star');
    // Always guarantee a few decorations even on a minimal playthrough.
    while (decorTypes.length < 6) decorTypes.push('leaf');

    decorTypes.slice(0, branchTips.length + 3).forEach((type, i) => {
      const tip = branchTips[i % branchTips.length];
      const jitterX = tip.x + (Math.random() - 0.5) * 30;
      const jitterY = tip.y + (Math.random() - 0.5) * 26;
      const el = document.createElementNS('http://www.w3.org/2000/svg', type === 'star' ? 'text' : 'circle');

      if (type === 'star'){
        el.setAttribute('x', jitterX);
        el.setAttribute('y', jitterY);
        el.setAttribute('font-size', '14');
        el.setAttribute('fill', '#FFD166');
        el.textContent = '✦';
      } else {
        el.setAttribute('cx', jitterX);
        el.setAttribute('cy', jitterY);
        el.setAttribute('r', type === 'flower' ? 5 : 4);
        el.setAttribute('fill', type === 'flower' ? '#FFB7C5' : '#8fd39a');
      }
      el.classList.add('decor');
      el.style.animationDelay = `${1.4 + i * 0.15}s`;
      decorGroup.appendChild(el);
    });
  }

  /* ---------- 11. RESTART ---------- */
  document.getElementById('restartBtn').addEventListener('click', () => {
    Object.keys(state).forEach(k => state[k] = typeof state[k] === 'string' ? '' : null);

    document.querySelectorAll('.door, .choice-card').forEach(el => el.classList.remove('is-chosen', 'is-faded'));
    document.querySelectorAll('.response').forEach(el => el.hidden = true);
    document.getElementById('letter-input').hidden = false;
    document.getElementById('letterText').value = '';
    document.getElementById('finalMessage').hidden = true;
    document.getElementById('finalActions').hidden = true;
    document.getElementById('treeDecor').innerHTML = '';

    document.querySelectorAll('.scene').forEach(s => s.classList.remove('is-active', 'is-entering'));
    const title = document.getElementById('scene-title');
    title.classList.add('is-active', 'is-entering');
    currentScene = 'scene-title';
    updateProgress('scene-title');
    toastCount = 0;
  });

  // Rebuild the tree the moment the final scene is reached.
  const finalObserver = new MutationObserver(() => {
    if (document.getElementById('scene-final').classList.contains('is-active')){
      decorateTree();
    }
  });
  finalObserver.observe(document.getElementById('scene-final'), { attributes: true, attributeFilter: ['class'] });

  /* ---------- 12. INIT ---------- */
  function init(){
    buildProgressDots();
    resizeCanvas();
    makeParticles();
    if (!reduceMotion) requestAnimationFrame(animateParticles);
    runLoadingSequence();
  }

  init();
})();
