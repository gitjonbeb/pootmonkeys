// voices.js — voice slots (§5.8) with the decided fallback chain:
// real recording file -> built-in browser speech -> silence.
// Missing files skip silently; file:// (no fetch) degrades to speech-only.
// Never plays before first user input (SFX.unlock gates the whole session),
// and always respects mute.

window.Voice = (function () {
  var files = {};   // 'mason_select' -> HTMLAudioElement (only if it loaded)
  var started = false;

  function init() {
    if (started) return;
    started = true;
    try {
      fetch('assets/voices/manifest.json')
        .then(function (r) { return r.json(); })
        .then(function (manifest) {
          Object.keys(manifest).forEach(function (charId) {
            Object.keys(manifest[charId]).forEach(function (event) {
              var url = 'assets/voices/' + manifest[charId][event];
              var a = new Audio();
              a.preload = 'auto';
              a.addEventListener('canplaythrough', function () {
                files[charId + '_' + event] = a;
              }, { once: true });
              a.addEventListener('error', function () { /* skip silently */ });
              a.src = url;
            });
          });
        })
        .catch(function () { /* no manifest (file:// or missing): speech only */ });
    } catch (e) { /* ancient browser: speech only */ }
  }

  function say(charId, event, opts) {
    opts = opts || {};
    if (window.SFX.muted) return;
    var a = files[charId + '_' + event];
    if (a) {
      try { a.currentTime = 0; a.play().catch(function () {}); } catch (e) {}
      return;
    }
    if (opts.fileOnly) return; // poots stay snappy: no speech latency
    if (!window.SPEECH_FALLBACK_ENABLED) return; // Jon's verdict: too synthetic
    var c = window.CharUtil.byId(charId);
    var line = c.lines[event];
    if (!line || !window.speechSynthesis) return;
    try {
      var u = new SpeechSynthesisUtterance(line);
      u.pitch = c.voice.pitch;
      u.rate = c.voice.rate;
      u.volume = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  return { init: init, say: say };
})();
