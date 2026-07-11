// TitleScene (§5.9). First tap/keypress also unlocks the audio context (§5.8).

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const cx = 480;
    this.add.text(cx, 150, 'POOTMONKEYS', {
      fontFamily: 'monospace', fontSize: '64px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 215, 'BANANA BLAST', {
      fontFamily: 'monospace', fontSize: '36px', color: '#8fdf70',
    }).setOrigin(0.5);
    this.add.text(cx, 265, 'A Poppy Studios Production', {
      fontFamily: 'monospace', fontSize: '16px', color: '#8ea2bd',
    }).setOrigin(0.5);
    this.add.text(cx, 330, '[ v1.0 - the family release ]', {
      fontFamily: 'monospace', fontSize: '14px', color: '#5a7292',
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, 410, 'TAP OR PRESS ANY KEY', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 550, yoyo: true, repeat: -1 });

    // a base monkey jogs across the bottom, forever
    const cameo = this.add.sprite(-40, 500, 'monkey_idle0');
    cameo.play('monkey_run');
    this.tweens.add({ targets: cameo, x: 1010, duration: 7000, repeat: -1 });

    const go = () => {
      window.SFX.unlock();
      window.Voice.init();
      this.scene.start('Select');
    };
    this.input.once('pointerdown', go);
    this.input.keyboard.once('keydown', go);
  }
}
