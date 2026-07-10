// BootScene — generates all gray-box textures at runtime (rectangles and circles
// only, brief Phase 1). No file loads: the gray-box runs even from file://.

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const T = window.TUNING;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    function tex(key, w, h, draw) {
      g.clear();
      draw(g);
      g.generateTexture(key, w, h);
    }

    // ground tile
    tex('tile', T.TILE, T.TILE, (g) => {
      g.fillStyle(0x7a5230); g.fillRect(0, 0, T.TILE, T.TILE);
      g.fillStyle(0x94683f); g.fillRect(0, 0, T.TILE, 6);
    });

    // mud strip (drawn on top of ground)
    tex('mud', T.TILE, 30, (g) => {
      g.fillStyle(0x4a3520); g.fillRect(0, 0, T.TILE, 30);
      g.fillStyle(0x5d442a); g.fillCircle(12, 6, 5); g.fillCircle(34, 10, 6);
    });

    // player: monkey-brown box, lighter belly, one circle eye (reads facing)
    tex('player', T.playerW, T.playerH, (g) => {
      g.fillStyle(0x9c6b3c); g.fillRect(0, 0, T.playerW, T.playerH);
      g.fillStyle(0xc99e6a); g.fillRect(8, 18, T.playerW - 16, T.playerH - 22);
      g.fillStyle(0xffffff); g.fillCircle(T.playerW - 11, 12, 6);
      g.fillStyle(0x22222a); g.fillCircle(T.playerW - 9, 12, 3);
    });

    // enemy: surly purple rectangle with an eye
    tex('enemy', 44, 36, (g) => {
      g.fillStyle(0x7d4fa0); g.fillRect(0, 0, 44, 36);
      g.fillStyle(0xffffff); g.fillCircle(12, 12, 6);
      g.fillStyle(0x22222a); g.fillCircle(12, 12, 3);
    });

    // banana: yellow circle
    tex('banana', 18, 18, (g) => {
      g.fillStyle(0xffd83d); g.fillCircle(9, 9, 8);
      g.fillStyle(0xfff3b0); g.fillCircle(6, 6, 3);
    });

    // beans: green pod rectangle with dots (fuel, not points — §5.4)
    tex('beans', 26, 18, (g) => {
      g.fillStyle(0x3f7d34); g.fillRect(0, 0, 26, 18);
      g.fillStyle(0x6ab55c); g.fillCircle(6, 9, 3); g.fillCircle(13, 9, 3); g.fillCircle(20, 9, 3);
    });

    // poot cloud (FX + HUD meter icon)
    tex('cloud', 22, 22, (g) => {
      g.fillStyle(0x8fdf70); g.fillCircle(11, 11, 10);
    });

    // treehouse door (finish)
    tex('door', 60, 84, (g) => {
      g.fillStyle(0x5d3f22); g.fillRect(0, 0, 60, 84);
      g.fillStyle(0x8a6236); g.fillRect(6, 6, 48, 72);
      g.fillStyle(0xffd83d); g.fillCircle(46, 44, 4);
    });

    // 1x1 white pixel for flashes/particles
    tex('px', 2, 2, (g) => {
      g.fillStyle(0xffffff); g.fillRect(0, 0, 2, 2);
    });

    // touch buttons (§5.2): ≥88 px targets
    tex('btnPad', 96, 96, (g) => {
      g.fillStyle(0x2c3a4f); g.fillRoundedRect(0, 0, 96, 96, 18);
      g.lineStyle(3, 0x5a7292); g.strokeRoundedRect(1, 1, 94, 94, 18);
    });
    tex('btnJump', 116, 116, (g) => {
      g.fillStyle(0xcf7a29); g.fillCircle(58, 58, 56);
      g.lineStyle(3, 0xffc06a); g.strokeCircle(58, 58, 56);
    });
    tex('btnPoot', 104, 104, (g) => {
      g.fillStyle(0x3f8f3a); g.fillCircle(52, 52, 50);
      g.lineStyle(3, 0x8fdf70); g.strokeCircle(52, 52, 50);
    });

    g.destroy();
    this.scene.start('Title');
  }
}
