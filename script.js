/*
  THE LITTLE JOURNEY
  Vanilla JavaScript story engine.
  No frameworks. No backend. GitHub Pages friendly.
*/

const scene = document.getElementById("scene");
const sceneVisual = document.getElementById("sceneVisual");
const companion = document.getElementById("companion");
const eyebrow = document.getElementById("eyebrow");
const title = document.getElementById("title");
const dialogue = document.getElementById("dialogue");
const choices = document.getElementById("choices");
const primaryAction = document.getElementById("primaryAction");
const textInputWrap = document.getElementById("textInputWrap");
const futureMessage = document.getElementById("futureMessage");
const saveMessage = document.getElementById("saveMessage");
const progress = document.getElementById("progress");
const chapterIndicator = document.getElementById("chapterIndicator");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");

const state = {
  chapter: 0,
  door: null,
  burden: null,
  proudOf: null,
  kindness: null,
  futureMessage: "",
  sound: true
};

const chapters = [
  {
    eyebrow: "A tiny invitation",
    title: "There's a little place I want to show you.",
    dialogue: [
      "Don't worry. There's no test here.",
      "Just a short journey. You can take it at your own pace.",
      "And honestly... I think you might find something interesting along the way."
    ],
    action: "Follow the light →",
    mood: "warm"
  },
  {
    eyebrow: "Chapter one · The Door",
    title: "Every journey begins with a choice.",
    dialogue: [
      "There are three doors in front of you.",
      "Don't overthink it. Pick the one that feels right."
    ],
    choices: [
      { id: "warm", icon: "☀️", label: "The golden door", hint: "It feels warm somehow." },
      { id: "calm", icon: "🌊", label: "The blue door", hint: "It feels strangely peaceful." },
      { id: "growth", icon: "🌿", label: "The green door", hint: "Something beyond it feels alive." }
    ],
    mood: "warm"
  },
  {
    eyebrow: "Chapter two · The Invisible Backpack",
    title: "Everyone carries something nobody sees.",
    dialogue: [
      "Imagine you are walking along a quiet path.",
      "There's a backpack beside you. You can only put one thing inside."
    ],
    choices: [
      { id: "memories", icon: "❤️", label: "Memories", hint: "The good ones are worth keeping." },
      { id: "difficult", icon: "🌧️", label: "Difficult moments", hint: "You learned something from them." },
      { id: "dreams", icon: "🌱", label: "Dreams", hint: "Some things are still waiting for you." },
      { id: "lessons", icon: "⭐", label: "Lessons", hint: "The past has a few things to teach." }
    ],
    mood: "forest"
  },
  {
    eyebrow: "Chapter three · The Mirror",
    title: "This mirror doesn't show your face.",
    dialogue: [
      "It shows the things people sometimes forget about themselves.",
      "Take a second. What are you quietly proud of?"
    ],
    choices: [
      { id: "never-gave-up", icon: "🔥", label: "I never gave up", hint: "Even when it was hard." },
      { id: "care", icon: "❤️", label: "I care about people", hint: "It matters to me." },
      { id: "grown", icon: "🌱", label: "I've grown", hint: "I'm not who I used to be." },
      { id: "trying", icon: "✨", label: "I'm still trying", hint: "And that counts." }
    ],
    mood: "blue"
  },
  {
    eyebrow: "Chapter four · The Letter",
    title: "If you could send one message to your future self...",
    dialogue: [
      "What would you want them to remember?",
      "It doesn't have to sound wise. It doesn't have to be perfect.",
      "Just make it honest."
    ],
    mood: "blue",
    input: true
  },
  {
    eyebrow: "Chapter five · The Kindness Challenge",
    title: "You have the power to make someone's day better.",
    dialogue: [
      "Not with anything huge.",
      "Sometimes the smallest things land the deepest.",
      "What would you give?"
    ],
    choices: [
      { id: "compliment", icon: "🌹", label: "A compliment", hint: "Something they might need to hear." },
      { id: "smile", icon: "☀️", label: "A smile", hint: "Just a little warmth." },
      { id: "help", icon: "🤝", label: "A hand", hint: "Help when it is needed." },
      { id: "time", icon: "🕯️", label: "My time", hint: "Really being there." }
    ],
    mood: "warm"
  },
  {
    eyebrow: "The final message",
    title: "You made it.",
    dialogue: [
      "But this journey was never really about discovering who you are.",
      "You already knew.",
      "Maybe you just needed a quiet moment to remember."
    ],
    mood: "sunrise",
    final: true
  }
];

const responses = {
  door: {
    warm: "You chose warmth. Maybe you're someone who notices the little things — a good conversation, a familiar laugh, a moment that makes an ordinary day feel better.",
    calm: "You chose calm. Maybe you notice things other people rush past. There's something good about being able to slow down and actually see what is around you.",
    growth: "You chose growth. Maybe part of you believes tomorrow can be better than today. That's a pretty good thing to carry with you."
  },
  burden: {
    memories: "Your memories are part of your story. Keep the ones that make you smile, and let the painful ones teach you without letting them run your life.",
    difficult: "The difficult moments are real, but they are not the whole story. The fact that you kept moving says more about you than you might give yourself credit for.",
    dreams: "There is something lovely about people who still have dreams. It means some part of you still believes there is more to discover.",
    lessons: "The past can teach you a lot. But it doesn't get to decide who you become next."
  },
  proud: {
    "never-gave-up": "That's worth being proud of. Not everyone sees the battles you've had to get through. You do — and you kept going.",
    care: "Caring about people is not a small thing. The world genuinely needs people who still notice when someone needs a little kindness.",
    grown: "Growth can be quiet. Sometimes you only notice it when you look back and realize you're handling life differently now.",
    trying: "Trying counts. Seriously. You don't have to have everything figured out for your effort to mean something."
  },
  kindness: {
    compliment: "A kind sentence can stay with someone for a surprisingly long time. You never really know when someone needs to hear something good.",
    smile: "A smile sounds small, but sometimes it is exactly enough to make a difficult day feel a little lighter.",
    help: "Small acts of help are how people make life easier for each other. It doesn't have to be dramatic to matter.",
    time: "Giving someone your attention is a real gift. Being fully there for someone is rarer than it should be."
  }
};

const saved = localStorage.getItem("littleJourneyProgress");
if (saved) {
  try {
    Object.assign(state, JSON.parse(saved));
  } catch (_) {}
}

function saveState() {
  localStorage.setItem("littleJourneyProgress", JSON.stringify(state));
}

function buildProgress() {
  progress.innerHTML = "";
  chapters.slice(0, 7).forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "progress-dot" + (i <= state.chapter ? " active" : "");
    progress.appendChild(dot);
  });
}

function setText(element, value) {
  element.textContent = value;
}

function renderChapter(index, transition = true) {
  state.chapter = index;
  saveState();

  const data = chapters[index];
  if (transition) {
    scene.classList.add("leaving");
    setTimeout(() => renderContent(data), 420);
  } else {
    renderContent(data);
  }
}

function renderContent(data) {
  scene.classList.remove("leaving");
  scene.classList.remove("arriving");
  void scene.offsetWidth;
  scene.classList.add("arriving");

  eyebrow.textContent = data.eyebrow;
  title.textContent = data.title;
  dialogue.innerHTML = data.dialogue.map(text => `<p>${escapeHTML(text)}</p>`).join("");
  choices.innerHTML = "";
  textInputWrap.classList.add("hidden");
  primaryAction.classList.remove("hidden");
  primaryAction.textContent = data.action || "Continue →";

  scene.dataset.mood = data.mood || "warm";
  chapterIndicator.textContent = data.final ? "A little reminder" : `Chapter ${state.chapter} of 6`;

  if (data.choices) {
    primaryAction.classList.add("hidden");
    data.choices.forEach(choice => {
      const button = document.createElement("button");
      button.className = "choice";
      button.type = "button";
      button.innerHTML = `<strong>${choice.icon} ${escapeHTML(choice.label)}</strong><small>${escapeHTML(choice.hint)}</small>`;
      button.addEventListener("click", () => choose(data, choice, button));
      choices.appendChild(button);
    });
  }

  if (data.input) {
    primaryAction.classList.add("hidden");
    textInputWrap.classList.remove("hidden");
    futureMessage.value = state.futureMessage || "";
    setTimeout(() => futureMessage.focus(), 300);
  }

  if (data.final) renderFinal();
  buildProgress();
}

function choose(data, choice, button) {
  [...choices.children].forEach(el => el.classList.remove("selected"));
  button.classList.add("selected");
  softChime();

  let response = "";

  if (state.chapter === 1) {
    state.door = choice.id;
    response = responses.door[choice.id];
  } else if (state.chapter === 2) {
    state.burden = choice.id;
    response = responses.burden[choice.id];
  } else if (state.chapter === 3) {
    state.proudOf = choice.id;
    response = responses.proud[choice.id];
  } else if (state.chapter === 5) {
    state.kindness = choice.id;
    response = responses.kindness[choice.id];
  }

  saveState();

  setTimeout(() => {
    dialogue.innerHTML = `<p>${escapeHTML(response)}</p><p class="choice-followup">Interesting choice. Keep walking.</p>`;
    primaryAction.classList.remove("hidden");
    primaryAction.textContent = state.chapter === 5 ? "See where this leads →" : "Keep going →";
  }, 450);
}

primaryAction.addEventListener("click", () => {
  if (state.chapter === 0) {
    startJourneyAudio();
  }
  if (state.chapter < chapters.length - 1) {
    renderChapter(state.chapter + 1);
  }
});

saveMessage.addEventListener("click", () => {
  const value = futureMessage.value.trim();
  if (!value) {
    futureMessage.focus();
    futureMessage.placeholder = "Write something honest. Even one sentence is enough.";
    return;
  }

  state.futureMessage = value;
  saveState();
  softChime();

  textInputWrap.classList.add("hidden");
  primaryAction.classList.remove("hidden");
  primaryAction.textContent = "Continue →";

  dialogue.innerHTML = `
    <p>Keep that somewhere safe.</p>
    <p>One day, you might read it again and realize how far you've come.</p>
  `;
});

function renderFinal() {
  const future = state.futureMessage
    ? `<div class="letter"><strong>A little note from you, to you:</strong><br><br>“${escapeHTML(state.futureMessage)}”</div>`
    : "";

  const combined = getFinalReflection();

  dialogue.innerHTML = `
    <p class="final-message">${escapeHTML(combined)}</p>
    ${future}
  `;

  choices.innerHTML = "";
  primaryAction.textContent = "Take the journey again ↻";
  primaryAction.classList.remove("hidden");
  primaryAction.onclick = restartJourney;
  scene.classList.add("celebrate");

  burstConfetti();
}

function getFinalReflection() {
  const parts = [];

  if (state.door === "warm") {
    parts.push("You seem to notice warmth in small things.");
  } else if (state.door === "calm") {
    parts.push("You seem to value quiet moments and the things that are easy to miss.");
  } else {
    parts.push("You seem to have a part of you that still believes in becoming something better.");
  }

  if (state.proudOf === "care") {
    parts.push("And you care about people — don't let the world convince you that softness is weakness.");
  } else if (state.proudOf === "never-gave-up") {
    parts.push("You've kept going through things other people may never know about.");
  } else if (state.proudOf === "grown") {
    parts.push("You've changed, and that's a good thing.");
  } else if (state.proudOf === "trying") {
    parts.push("You're still trying, and that matters more than having all the answers.");
  }

  if (state.kindness === "time") {
    parts.push("You chose to give time, too. That's one of the most human things you can give.");
  } else if (state.kindness === "compliment") {
    parts.push("You chose words that could make somebody feel seen.");
  }

  parts.push("So keep your curiosity. Keep your kindness. Keep becoming.");
  parts.push("You don't need to have everything figured out to be doing okay.");

  return parts.join(" ");
}

function restartJourney() {
  Object.assign(state, {
    chapter: 0,
    door: null,
    burden: null,
    proudOf: null,
    kindness: null,
    futureMessage: ""
  });
  saveState();
  scene.classList.remove("celebrate");
  primaryAction.onclick = null;
  renderChapter(0);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------
   Lightweight ambient particles
---------------------------- */
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function seedParticles() {
  particles = Array.from({ length: Math.min(70, Math.floor(innerWidth / 15)) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.8 + .3,
    a: Math.random() * .45 + .08,
    speed: Math.random() * .22 + .05,
    drift: (Math.random() - .5) * .12
  }));
}

function animateParticles() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles.forEach(p => {
    p.y -= p.speed;
    p.x += p.drift;
    if (p.y < -10) {
      p.y = innerHeight + 10;
      p.x = Math.random() * innerWidth;
    }
    if (p.x < -10) p.x = innerWidth + 10;
    if (p.x > innerWidth + 10) p.x = -10;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 241, 190, ${p.a})`;
    ctx.fill();
  });
  requestAnimationFrame(animateParticles);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  seedParticles();
});

resizeCanvas();
seedParticles();
animateParticles();

/* ---------------------------
   Tiny Web Audio layer
   Starts only after user interaction.
---------------------------- */
let audioContext = null;
let masterGain = null;

function ensureAudio() {
  if (!state.sound) return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.055;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function softChime() {
  const ac = ensureAudio();
  if (!ac) return;
  const now = ac.currentTime;
  [523.25, 659.25].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * .05);
    gain.gain.exponentialRampToValueAtTime(.35, now + i * .05 + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + i * .05 + .5);
    osc.connect(gain).connect(masterGain);
    osc.start(now + i * .05);
    osc.stop(now + i * .05 + .55);
  });
}

function startJourneyAudio() {
  ensureAudio();
  softChime();
}

soundToggle.addEventListener("click", () => {
  state.sound = !state.sound;
  soundIcon.textContent = state.sound ? "♪" : "×";
  saveState();
  if (state.sound) {
    ensureAudio();
    softChime();
  }
});

function burstConfetti() {
  const colors = ["#ffd166", "#ffb7c5", "#ffffff", "#a7e8b2", "#9fd8ff"];
  for (let i = 0; i < 34; i++) {
    const piece = document.createElement("span");
    piece.style.position = "fixed";
    piece.style.left = `${50 + (Math.random() - .5) * 16}%`;
    piece.style.top = "45%";
    piece.style.width = "7px";
    piece.style.height = "11px";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = "2px";
    piece.style.zIndex = "30";
    piece.style.pointerEvents = "none";
    document.body.appendChild(piece);

    const dx = (Math.random() - .5) * 420;
    const dy = 250 + Math.random() * 420;
    const rot = Math.random() * 720 - 360;

    piece.animate([
      { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${rot}deg)`, opacity: 0 }
    ], {
      duration: 1200 + Math.random() * 800,
      easing: "cubic-bezier(.2,.8,.2,1)"
    }).onfinish = () => piece.remove();
  }
}

/* First render */
renderChapter(Math.min(state.chapter, chapters.length - 1), false);
