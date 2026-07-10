// main.js — Phaser config and scene registration (brief §3).
// Canvas 960x540, Scale.FIT + CENTER_BOTH, pixelArt on, landscape.

(function () {
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 960,
    height: 540,
    backgroundColor: '#16202e',
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: window.TUNING.gravity },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 4, // ≥3 simultaneous pointers (§5.2); move+jump+poot must overlap
    },
    scene: [BootScene, TitleScene, SelectScene, GameScene, FinishScene],
  };

  window.game = new Phaser.Game(config);
})();
