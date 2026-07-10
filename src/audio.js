// audio.js — placeholder synthesized SFX (Phase 1). No files, no network.
// HARD RULE (§5.8): nothing plays before the first user tap/keypress.
// The AudioContext is only created inside unlock(), which is bound to input events.

window.SFX = (function () {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('pootmonkeys.muted') === '1'; } catch (e) {}

  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  }
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  function tone(o) {
    if (muted || !ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + (o.delay || 0);
    const dur = o.dur || 0.12;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.freq || 440, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(o.end || o.freq || 440, 1), t + dur);
    g.gain.setValueAtTime(o.vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // Filtered noise burst — the poot. Unmistakable by decree (§5.4).
  function noise(o) {
    if (muted || !ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + (o.delay || 0);
    const dur = o.dur || 0.25;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(o.from || 900, t);
    f.frequency.exponentialRampToValueAtTime(o.to || 150, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t); src.stop(t + dur);
  }

  return {
    unlock: unlock,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('pootmonkeys.muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    jump()    { tone({ freq: 330, end: 660, dur: 0.1, type: 'square', vol: 0.06 }); },
    poot()    { noise({ dur: 0.28, vol: 0.22, from: 700, to: 110 });
                tone({ freq: 170, end: 65, dur: 0.26, type: 'sawtooth', vol: 0.09 }); },
    banana()  { tone({ freq: 880, end: 1320, dur: 0.09, type: 'triangle', vol: 0.08 }); },
    beans()   { tone({ freq: 220, end: 440, dur: 0.14, type: 'sine', vol: 0.09 });
                tone({ freq: 440, end: 560, dur: 0.1, delay: 0.11, type: 'sine', vol: 0.07 }); },
    hit()     { tone({ freq: 200, end: 75, dur: 0.2, type: 'sawtooth', vol: 0.11 }); },
    stun()    { tone({ freq: 520, end: 240, dur: 0.16, type: 'square', vol: 0.07 }); },
    bounce()  { tone({ freq: 380, end: 900, dur: 0.12, type: 'square', vol: 0.09 }); },
    respawn() { tone({ freq: 300, end: 600, dur: 0.15, type: 'triangle', vol: 0.07 }); },
    victory() { [523, 659, 784, 1047].forEach((f, i) =>
                  tone({ freq: f, end: f, dur: 0.16, delay: i * 0.13, type: 'square', vol: 0.08 })); },
  };
})();
