// characters.js — the roster (CHARACTERS.md, approved by Jon).
// Cosmetic only: palette swap + accessory patches + tinted poot cloud +
// victory flourish + voice settings. Abilities identical (§5.7, non-negotiable).

window.CHARACTERS = [
  {
    id: 'mason', name: 'MASON',
    pal: { b: 0xe8862d, d: 0xb05f1a },            // basketball orange
    pootTint: 0xffb060,
    lines: { select: 'Nothing but net!', victory: 'Touchdown!', golden: 'Slam dunk!' },
    voice: { pitch: 1.1, rate: 1.0 },
    flourish: 'dunk',
    patches: ['headband', 'chest1'],
  },
  {
    id: 'emmy', name: 'EMMY',
    pal: { b: 0xf08bb0, d: 0xc75f8b, c: 0xc9a0ea }, // pink, royal-purple belly
    pootTint: 0xffa0d0,
    lines: { select: 'A royal toot indeed!', victory: 'The princess wins!', golden: 'It\'s beautiful!' },
    voice: { pitch: 1.5, rate: 0.95 },
    flourish: 'sparkle',
    patches: ['tiara'],
  },
  {
    id: 'brooks', name: 'BROOKS',
    pal: { b: 0xd23b2f, d: 0x9c2a20, c: 0x6aa7e0 }, // red with blue accents
    pootTint: 0xff8070,
    lines: { select: 'My spidey-sense smells bananas!', victory: 'Superhero landing!', golden: 'WHOA!' },
    voice: { pitch: 1.2, rate: 1.05 },
    flourish: 'hero',
    patches: ['mask'],
  },
  {
    id: 'lilah', name: 'LILAH',
    pal: { b: 0x3f9f4a, d: 0x2e7a36, c: 0xffffff }, // pitch green, white jersey
    pootTint: 0x8fdf70,
    lines: { select: 'GOOOOAL!', victory: 'GOOOOOOOAL!', golden: 'Golden goal!' },
    voice: { pitch: 1.35, rate: 1.0 },
    flourish: 'soccer',
    patches: ['ponytail', 'stripe'],
  },
  {
    id: 'ellie', name: 'ELLIE',
    pal: { b: 0xf0c030, d: 0xc89a20 },              // sunshine yellow
    pootTint: 0xffe066,
    lines: { select: 'Again! Again!', victory: 'Again! Again!', golden: 'Oooooh!' },
    voice: { pitch: 1.7, rate: 1.1 },
    flourish: 'bounce',
    patches: ['pigtails'],
  },
];

window.CharUtil = {
  byId(id) {
    for (var i = 0; i < window.CHARACTERS.length; i++) {
      if (window.CHARACTERS[i].id === id) return window.CHARACTERS[i];
    }
    return window.CHARACTERS[0];
  },
  savedCharId() {
    try { return localStorage.getItem('pootmonkeys.char') || 'mason'; } catch (e) { return 'mason'; }
  },
  saveCharId(id) {
    try { localStorage.setItem('pootmonkeys.char', id); } catch (e) {}
  },
  // speech bubble that fades out on its own; returns the container
  bubble(scene, x, y, text) {
    var t = scene.add.text(0, 0, text, {
      fontFamily: 'monospace', fontSize: '16px', color: '#222831',
      align: 'center', wordWrap: { width: 220 },
    }).setOrigin(0.5);
    var w = t.width + 20, h = t.height + 14;
    var g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.fillTriangle(-6, h / 2 - 1, 6, h / 2 - 1, 0, h / 2 + 10);
    var c = scene.add.container(x, y, [g, t]).setDepth(80);
    scene.tweens.add({
      targets: c, alpha: 0, delay: 1500, duration: 350,
      onComplete: function () { c.destroy(); },
    });
    return c;
  },
};
