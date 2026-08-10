/* ==========================================================================
   THE LITTLE JOURNEY — SCENE ENGINE
   1. State  2. DOM refs  3. Dialogue reveal helper  4. Audio (bg pad + sfx)
   5. Particle system (canvas, per-world modes)  6. Companion
   7. World transition helper  8. World: Room  9. World: Forest
   10. World: Bridge  11. World: House  12. World: Night  13. World: Sunrise
   14. Restart  15. Init
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- 1. STATE ---------- */
  const state = { path: null, pride: null, letter: '' };

  const PATH_FLAVOR = {
    gold: ['You chose warmth.', 'Maybe you are someone who finds happiness in small moments.'],
    blue: ['You chose calm.', 'Maybe you notice things others often miss.'],
    green: ['You chose growth.', 'Maybe you believe tomorrow can always be better.']
  };
  const PRIDE_FLAVOR = {
    'never-gave-up': 'Not everyone sees the battles you have won.',
    'care': 'The world needs more people who still choose kindness.',
    'grown': 'Growth is not always visible, but it is always meaningful.',
    'still-trying': 'Trying is underrated. Every change starts with someone refusing to quit.'
  };
  const PRIDE_KEYWORD = {
    'never-gave-up': 'kept going, even when it was hard',
    'care': 'showed up for the people around you',
    'grown': 'grew, quietly, in ways you rarely gave yourself credit for',
    'still-trying': 'kept trying, which counts for more than people admit'
  };
  const PATH_KEYWORD = { gold: 'warmth', blue: 'quiet noticing', green: 'a belief that things can get better' };

  const WORLD_ORDER = ['room', 'forest', 'bridge', 'house', 'night', 'sunrise'];

  /* ---------- 2. DOM REFS ---------- */
  const body = document.body;
  const worlds = {};
  WORLD_ORDER.forEach(id => worlds[id] = document.getElementById(`world-${id}`));
  const companion = document.getElementById('companion');
  const progressDots = document.getElementById('progressDots');
  const progressNav = document.getElementById('progress');

  function buildProgress(){
    WORLD_ORDER.forEach(() => {
      const dot = document.createElement('span');
      progressDots.appendChild(dot);
    });
  }
  function updateProgress(worldId){
    const idx = WORLD_ORDER.indexOf(worldId);
    [...progressDots.children].forEach((d, i) => d.classList.toggle('is-active', i === idx));
  }

  /* ---------- 3. DIALOGUE REVEAL HELPER ---------- */
  function revealLines(lines, startDelay = 300, stagger = 550){
    return new Promise(resolve => {
      const arr = [...lines];
      if (!arr.length){ resolve(); return; }
      arr.forEach((line, i) => setTimeout(() => line.classList.add('is-visible'), startDelay + i * stagger));
      setTimeout(resolve, startDelay + (arr.length - 1) * stagger + 800);
    });
  }
  function resetLines(container){
    container.querySelectorAll('.is-visible').forEach(l => l.classList.remove('is-visible'));
  }

  /* ---------- 4. AUDIO ---------- */
  let audioCtx, muted = false, padNodes = null;
  function ctx(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function startAmbientPad(){
    if (muted || padNodes) return;
    const c = ctx();
    const master = c.createGain();
    master.gain.value = 0.05;
    master.connect(c.destination);

    const freqs = [110, 164.8, 220]; // soft, slow drone
    padNodes = { master, oscs: [] };
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.value = 0.5 / (i + 1);
      osc.connect(gain); gain.connect(master);
      osc.start();
      padNodes.oscs.push(osc);

      // slow LFO drift on frequency for a "breathing" ambient feel
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      padNodes.oscs.push(lfo);
    });
  }
  function stopAmbientPad(){
    if (!padNodes) return;
    padNodes.master.gain.setTargetAtTime(0, ctx().currentTime, 0.3);
    setTimeout(() => {
      padNodes.oscs.forEach(o => { try{ o.stop(); }catch(e){} });
      padNodes = null;
    }, 500);
  }

  function tone(freq, dur, type = 'sine', vol = 0.06, delay = 0){
    if (muted) return;
    const c = ctx();
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + dur + 0.05);
  }
  function playClick(){ tone(660, 0.18, 'sine', 0.06); }
  function playWhoosh(){
    if (muted) return;
    const c = ctx(); const now = c.currentTime;
    const osc = c.createOscillator(); const gain = c.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.9);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.95);
  }
  function playFootsteps(kind = 'soft', count = 3){
    const freqMap = { soft: 180, wood: 260, stone: 140, glass: 500 };
    for (let i = 0; i < count; i++){
      tone(freqMap[kind] || 180, 0.09, 'triangle', 0.035, i * 0.22);
    }
  }
  function playChime(){
    [523.25, 659.25, 784].forEach((f, i) => tone(f, 1.1, 'sine', 0.05, i * 0.16));
  }

  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  soundToggle.addEventListener('click', () => {
    muted = !muted;
    soundToggle.classList.toggle('is-muted', muted);
    soundIcon.textContent = muted ? '✕' : '♪';
    if (muted) stopAmbientPad(); else startAmbientPad();
  });

  /* ---------- 5. PARTICLE SYSTEM ---------- */
  const canvas = document.getElementById('particles');
  const g = canvas.getContext('2d');
  let particles = [];
  let mode = 'none';
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  window.addEventListener('resize', () => { resize(); setMode(mode, true); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  function setMode(next, force){
    if (mode === next && !force) return;
    mode = next;
    const w = canvas.width, h = canvas.height;
    if (mode === 'dust'){
      particles = Array.from({ length: 14 }, () => ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.2+.3, s: Math.random()*.15+.03, a: Math.random()*.3+.1 }));
    } else if (mode === 'fireflies'){
      particles = Array.from({ length: 16 }, (_, i) => ({
        x: Math.random()*w, y: h*0.4 + Math.random()*h*0.5, r: Math.random()*2+1,
        vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, a: Math.random()*.6+.3, leader: i === 0
      }));
    } else if (mode === 'stars'){
      particles = Array.from({ length: 60 }, () => ({ x: Math.random()*w, y: Math.random()*h*0.7, r: Math.random()*1.4+.3, a: Math.random()*.8+.2, tw: Math.random()*0.02+0.005 }));
    } else if (mode === 'motes'){
      particles = Array.from({ length: 22 }, () => ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.5+.4, s: Math.random()*.25+.05, a: Math.random()*.4+.1 }));
    } else {
      particles = [];
    }
  }

  let shootingStar = null;
  function maybeSpawnShootingStar(){
    if (mode !== 'stars' || reduceMotion) return;
    if (Math.random() < 0.002 && !shootingStar){
      shootingStar = { x: Math.random()*canvas.width*0.6, y: Math.random()*canvas.height*0.2, vx: 6, vy: 3, life: 60 };
    }
  }

  function drawParticles(){
    g.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === 'dust' || mode === 'motes'){
      particles.forEach(p => {
        p.y -= p.s; if (p.y < -5) p.y = canvas.height + 5;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI*2);
        g.fillStyle = `rgba(255,214,166,${p.a})`; g.fill();
      });
    } else if (mode === 'fireflies'){
      particles.forEach(p => {
        if (p.leader){
          p.x += (mouse.x - p.x) * 0.02;
          p.y += (mouse.y - p.y) * 0.02;
        } else {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < canvas.height*0.35 || p.y > canvas.height) p.vy *= -1;
        }
        const flicker = p.a * (0.7 + Math.sin(Date.now()/300 + p.x) * 0.3);
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI*2);
        g.fillStyle = `rgba(255,214,120,${flicker})`;
        g.shadowBlur = 8; g.shadowColor = 'rgba(255,214,120,.8)';
        g.fill(); g.shadowBlur = 0;
      });
    } else if (mode === 'stars'){
      particles.forEach(p => {
        p.a += (Math.random() - 0.5) * p.tw;
        p.a = Math.max(0.15, Math.min(1, p.a));
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI*2);
        g.fillStyle = `rgba(255,255,255,${p.a})`; g.fill();
      });
      maybeSpawnShootingStar();
      if (shootingStar){
        const s = shootingStar;
        g.strokeStyle = 'rgba(255,255,255,.9)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx*6, s.y - s.vy*6); g.stroke();
        s.x += s.vx; s.y += s.vy; s.life--;
        if (s.life <= 0 || s.x > canvas.width || s.y > canvas.height) shootingStar = null;
      }
    }

    if (!reduceMotion) requestAnimationFrame(drawParticles);
  }

  /* ---------- 6. COMPANION ---------- */
  function companionTurn(){
    companion.classList.add('is-turning');
    setTimeout(() => companion.classList.remove('is-turning'), 900);
  }
  setInterval(() => { if (Math.random() < 0.4) companionTurn(); }, 9000);

  /* ---------- 7. WORLD TRANSITION HELPER ---------- */
  let currentWorldId = 'room';

  function transitionTo(nextId, { camClass = 'world--pan-forward', footstep = 'soft', camDuration = 1400 } = {}){
    const outgoing = worlds[currentWorldId];
    const incoming = worlds[nextId];
    playWhoosh();
    playFootsteps(footstep);
    outgoing.classList.add(camClass);

    setTimeout(() => {
      outgoing.classList.remove('is-active', camClass);
      body.setAttribute('data-world', nextId);
      incoming.classList.add('is-active');
      currentWorldId = nextId;
      updateProgress(nextId);
      enterWorld(nextId);
    }, camDuration);
  }

  function enterWorld(id){
    if (id === 'forest') setMode('fireflies');
    else if (id === 'night') setMode('stars');
    else if (id === 'sunrise') setMode('motes');
    else if (id === 'room') setMode('dust');
    else setMode('none');

    if (id === 'forest') return enterForest();
    if (id === 'bridge') return enterBridge();
    if (id === 'house') return enterHouse();
    if (id === 'night') return enterNight();
    if (id === 'sunrise') return enterSunrise();
  }

  /* ---------- 8. WORLD: ROOM ---------- */
  function enterRoom(){
    setMode('dust');
    const lines = document.querySelectorAll('#dialogue-room [data-line]');
    revealLines(lines).then(() => {
      const door = document.getElementById('roomDoor');
      door.classList.add('is-visible');
      tone(440, 1.2, 'sine', 0.03);
      setTimeout(() => { document.getElementById('choices-room').hidden = false; }, 900);
    });
  }

  document.querySelector('[data-action="open-door"]').addEventListener('click', () => {
    playClick();
    document.getElementById('choices-room').hidden = true;
    transitionTo('forest', { camClass: 'world--zoom-out', footstep: 'soft', camDuration: 1500 });
  });

  /* ---------- 9. WORLD: FOREST ---------- */
  function enterForest(){
    const lines = document.querySelectorAll('#dialogue-forest [data-line]');
    revealLines(lines).then(() => { document.getElementById('choices-forest').hidden = false; });
  }
  document.querySelectorAll('[data-action="choose-path"]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      const value = btn.dataset.value;
      state.path = value;
      document.querySelectorAll('[data-action="choose-path"]').forEach(b => {
        b.classList.toggle('is-chosen', b === btn);
        b.classList.toggle('is-faded', b !== btn);
      });
      const [l1, l2] = PATH_FLAVOR[value];
      document.getElementById('forestResponse1').textContent = l1;
      document.getElementById('forestResponse2').textContent = l2;
      const resp = document.getElementById('response-forest');
      resp.hidden = false;
      revealLines(resp.querySelectorAll('.dialogue__line--reveal'), 100, 400);
      // recolor the path glow to match the choice
      const pathEl = document.getElementById('forestPath');
      const colorMap = { gold: 'rgba(255,209,102,.35)', blue: 'rgba(127,176,255,.35)', green: 'rgba(127,224,167,.35)' };
      pathEl.style.background = `linear-gradient(180deg, transparent, ${colorMap[value]})`;
    });
  });
  document.querySelector('[data-action="follow-path"]').addEventListener('click', () => {
    playClick();
    document.getElementById('choices-forest').hidden = true;
    document.getElementById('response-forest').hidden = true;
    transitionTo('bridge', { camClass: 'world--pan-forward', footstep: 'soft', camDuration: 1500 });
  });

  /* ---------- 10. WORLD: BRIDGE ---------- */
  function enterBridge(){
    const lines = document.querySelectorAll('#dialogue-bridge [data-line]');
    revealLines(lines).then(() => {
      const box = document.getElementById('choices-bridge');
      box.hidden = false;
      revealLines(box.querySelectorAll('.dialogue__line--reveal'), 100, 0);
    });
  }
  document.querySelector('[data-action="look-back"]').addEventListener('click', () => {
    playClick();
    tone(300, 1.4, 'sine', 0.03);
    document.getElementById('bridgeCamera').classList.add('world--rotate-back');
    document.getElementById('bridgeRearview').hidden = false;
    requestAnimationFrame(() => document.getElementById('bridgeRearview').classList.add('is-visible'));
    setTimeout(() => {
      document.getElementById('choices-bridge').hidden = true;
      const resp = document.getElementById('response-bridge');
      resp.hidden = false;
      revealLines(resp.querySelectorAll('.dialogue__line--reveal'), 100, 0);
    }, 1600);
  });
  document.querySelector('[data-action="cross-bridge"]').addEventListener('click', () => {
    playClick();
    document.getElementById('bridgeRearview').classList.remove('is-visible');
    document.getElementById('bridgeCamera').classList.remove('world--rotate-back');
    document.getElementById('response-bridge').hidden = true;
    transitionTo('house', { camClass: 'world--pan-forward', footstep: 'wood', camDuration: 1500 });
  });

  /* ---------- 11. WORLD: HOUSE ---------- */
  function enterHouse(){
    const lines = document.querySelectorAll('#dialogue-house [data-line]');
    revealLines(lines).then(() => { document.getElementById('choices-house').hidden = false; });
  }
  document.querySelectorAll('[data-action="choose-mirror"]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      const value = btn.dataset.value;
      state.pride = value;
      document.querySelectorAll('[data-action="choose-mirror"]').forEach(b => {
        b.classList.toggle('is-chosen', b === btn);
        b.classList.toggle('is-faded', b !== btn);
      });
      const ripple = document.getElementById('mirrorRipple');
      ripple.classList.remove('is-active'); void ripple.offsetWidth; ripple.classList.add('is-active');
      tone(520, 1, 'sine', 0.04);
      document.getElementById('mirrorPrompt').textContent = PRIDE_FLAVOR[value];
      document.getElementById('choices-house').hidden = true;
      const resp = document.getElementById('response-house');
      document.getElementById('houseResponse').textContent = PRIDE_FLAVOR[value];
      resp.hidden = false;
      revealLines(resp.querySelectorAll('.dialogue__line--reveal'), 200, 0);
    });
  });
  document.querySelector('[data-action="leave-house"]').addEventListener('click', () => {
    playClick();
    document.getElementById('response-house').hidden = true;
    transitionTo('night', { camClass: 'world--rise', footstep: 'stone', camDuration: 1600 });
  });

  /* ---------- 12. WORLD: NIGHT ---------- */
  function enterNight(){
    const lines = document.querySelectorAll('#dialogue-night [data-line]');
    revealLines(lines).then(() => { document.getElementById('lanternInput').hidden = false; });
  }
  document.getElementById('letterSubmit').addEventListener('click', () => {
    playClick();
    const val = document.getElementById('letterText').value.trim();
    state.letter = val;
    document.getElementById('lanternInput').hidden = true;
    document.getElementById('lanternScene').hidden = false;
  });
  document.getElementById('releaseLantern').addEventListener('click', (e) => {
    playChime();
    const lantern = document.getElementById('lantern');
    lantern.classList.add('is-released');
    e.target.hidden = true;
    setTimeout(() => {
      const box = document.getElementById('choices-night');
      box.hidden = false;
    }, 3800);
  });
  document.querySelector('[data-action="descend"]').addEventListener('click', () => {
    playClick();
    document.getElementById('choices-night').hidden = true;
    document.getElementById('lanternScene').hidden = true;
    transitionTo('sunrise', { camClass: 'world--descend', footstep: 'soft', camDuration: 1700 });
  });

  /* ---------- 13. WORLD: SUNRISE ---------- */
  function enterSunrise(){
    const lines = document.querySelectorAll('#dialogue-sunrise [data-line]');
    revealLines(lines).then(() => {
      document.getElementById('recap').hidden = false;
      setTimeout(showFinalWords, 5 * 220 + 900);
    });
  }
  function showFinalWords(){
    const box = document.getElementById('finalWords');
    box.hidden = false;
    const pathWord = state.path ? PATH_KEYWORD[state.path] : 'the path you chose';
    const prideWord = state.pride ? PRIDE_KEYWORD[state.pride] : 'more than you give yourself credit for';
    const reflection = `Somewhere in there: ${pathWord}. And the quiet fact that you ${prideWord}.`;
    document.getElementById('finalReflection').textContent = reflection;
    revealLines(box.querySelectorAll('.dialogue__line--reveal'), 200, 700);
    playChime();
    const totalDelay = 200 + 3 * 700 + 900;
    setTimeout(() => { document.getElementById('restartRow').hidden = false; }, totalDelay);
  }

  /* ---------- 14. RESTART ---------- */
  document.getElementById('restartBtn').addEventListener('click', () => {
    playClick();
    // reset state
    state.path = null; state.pride = null; state.letter = '';

    // reset all worlds' UI
    Object.values(worlds).forEach(w => { w.classList.remove('is-active'); w.querySelectorAll('[class*="world--"]').forEach(()=>{}); });
    ['choices-room','choices-forest','response-forest','choices-bridge','response-bridge',
     'choices-house','response-house','lanternInput','lanternScene','choices-night',
     'recap','finalWords','restartRow'].forEach(id => {
      const el = document.getElementById(id); if (el) el.hidden = true;
    });
    document.querySelectorAll('.dialogue__line').forEach(l => l.classList.remove('is-visible'));
    document.getElementById('roomDoor').classList.remove('is-visible');
    document.querySelectorAll('.path-choice, .choice-card').forEach(c => c.classList.remove('is-chosen','is-faded'));
    document.getElementById('bridgeRearview').hidden = true;
    document.getElementById('bridgeRearview').classList.remove('is-visible');
    document.getElementById('lantern').classList.remove('is-released');
    document.getElementById('letterText').value = '';
    document.getElementById('lanternScene').querySelector('#releaseLantern').hidden = false;

    body.setAttribute('data-world', 'room');
    worlds.room.classList.add('is-active');
    currentWorldId = 'room';
    updateProgress('room');

    document.getElementById('titleCard').classList.remove('is-hidden');
  });

  /* ---------- 15. INIT ---------- */
  document.getElementById('startBtn').addEventListener('click', () => {
    playClick();
    startAmbientPad();
    document.getElementById('titleCard').classList.add('is-hidden');
    progressNav.hidden = false;
    updateProgress('room');
    enterRoom();
  }, { once: false });

  function init(){
    buildProgress();
    resize();
    if (!reduceMotion) requestAnimationFrame(drawParticles);
  }

  init();
})();
