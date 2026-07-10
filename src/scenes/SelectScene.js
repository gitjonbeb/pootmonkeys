// SelectScene — Phase 4 builds the real character select (§5.7).
// Gray-box: pass straight through to the game.

class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    this.scene.start('Game');
  }
}
