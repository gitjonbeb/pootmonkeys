// BootScene — renders all pixel art (src/pixelart.js) into textures and
// registers animations. ?gallery=1 shows every sprite for art review.

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    var T = window.TUNING;
    var PA = window.PixelArt;
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    // ---- pixel sprites ----
    PA.monkeyFrames(this, 'monkey', 2);              // 20x24 grid -> 40x48
    PA.render(this, 'banana', PA.GRIDS.banana, 2);   // 20x18
    PA.render(this, 'golden', PA.GRIDS.golden, 3, { y: 0xf2b632, Y: 0xfff8d0, W: 0x8a6236 }); // gold banana, big
    PA.render(this, 'beans', PA.GRIDS.beans, 2);
    PA.render(this, 'coconut', PA.GRIDS.coconut, 2);
    PA.render(this, 'bees0', PA.GRIDS.bees0, 2);
    PA.render(this, 'bees1', PA.GRIDS.bees1, 2);
    PA.render(this, 'snake0', PA.GRIDS.snake0, 2);
    PA.render(this, 'snake1', PA.GRIDS.snake1, 2);
    PA.render(this, 'flag_off', PA.GRIDS.flag_off, 3);
    PA.render(this, 'flag_on', PA.GRIDS.flag_on, 3);
    PA.render(this, 'grass', PA.GRIDS.grass, 2);     // 48x24 -> tile
    PA.render(this, 'mud', PA.GRIDS.mud, 2);         // 48x16
    PA.render(this, 'palm', PA.GRIDS.palm, 3);       // 72x90 tall palm
    PA.render(this, 'door', PA.GRIDS.door, 3);       // 60x54
    PA.parallax(this);

    // ---- flat helpers (buttons, fx) ----
    function tex(key, w, h, draw) { g.clear(); draw(g); g.generateTexture(key, w, h); }
    tex('cloud', 22, 22, function (gg) { gg.fillStyle(0x8fdf70); gg.fillCircle(11, 11, 10); });
    tex('px', 2, 2, function (gg) { gg.fillStyle(0xffffff); gg.fillRect(0, 0, 2, 2); });
    tex('btnPad', 96, 96, function (gg) {
      gg.fillStyle(0x2c3a4f); gg.fillRoundedRect(0, 0, 96, 96, 18);
      gg.lineStyle(3, 0x5a7292); gg.strokeRoundedRect(1, 1, 94, 94, 18);
    });
    tex('btnJump', 116, 116, function (gg) {
      gg.fillStyle(0xcf7a29); gg.fillCircle(58, 58, 56);
      gg.lineStyle(3, 0xffc06a); gg.strokeCircle(58, 58, 56);
    });
    tex('btnPoot', 104, 104, function (gg) {
      gg.fillStyle(0x3f8f3a); gg.fillCircle(52, 52, 50);
      gg.lineStyle(3, 0x8fdf70); gg.strokeCircle(52, 52, 50);
    });
    g.destroy();

    // ---- animations ----
    var A = this.anims;
    function mk(key, frames, rate, repeat) {
      if (A.exists(key)) return;
      A.create({ key: key, frames: frames.map(function (f) { return { key: f }; }),
                 frameRate: rate, repeat: repeat });
    }
    mk('m_idle', ['monkey_idle0', 'monkey_idle1'], 2, -1);
    mk('m_run', ['monkey_run0', 'monkey_run1', 'monkey_run2', 'monkey_run3'], 10, -1);
    mk('m_jump', ['monkey_jump'], 1, 0);
    mk('m_fall', ['monkey_fall'], 1, 0);
    mk('m_poot', ['monkey_poot0', 'monkey_poot1'], 12, 0);
    mk('m_hit', ['monkey_hit'], 1, 0);
    mk('m_vic', ['monkey_vic0', 'monkey_vic1'], 4, -1);
    mk('a_bees', ['bees0', 'bees1'], 8, -1);
    mk('a_snake', ['snake0', 'snake1'], 6, -1);

    // ---- gallery mode for art review ----
    if (/[?&]gallery=1/.test(location.search)) {
      this.cameras.main.setBackgroundColor('#3a4a5c');
      var keys = ['monkey_idle0', 'monkey_idle1', 'monkey_run0', 'monkey_run1', 'monkey_run2',
        'monkey_jump', 'monkey_fall', 'monkey_poot0', 'monkey_hit', 'monkey_vic0', 'monkey_vic1',
        'banana', 'golden', 'beans', 'coconut', 'bees0', 'snake0', 'flag_on',
        'grass', 'mud', 'palm', 'door'];
      var x = 60, y = 80;
      for (var i = 0; i < keys.length; i++) {
        this.add.image(x, y, keys[i]).setOrigin(0.5, 1);
        this.add.text(x, y + 8, keys[i].replace('monkey_', ''), {
          fontFamily: 'monospace', fontSize: '10px', color: '#cde',
        }).setOrigin(0.5, 0);
        x += 80;
        if (x > 900) { x = 60; y += 130; }
      }
      var demo = this.add.sprite(480, 430, 'monkey_idle0').setScale(2);
      demo.play('m_run');
      this.add.text(480, 500, 'run cycle x2', { fontFamily: 'monospace', fontSize: '12px', color: '#cde' }).setOrigin(0.5);
      return; // stay here for review
    }

    this.scene.start('Title');
  }
}
