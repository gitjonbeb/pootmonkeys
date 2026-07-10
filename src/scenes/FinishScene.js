// FinishScene — gray-box score breakdown (§5.6). Ranks, initials entry and
// high-score table arrive in Phase 4. Instant replay, no unskippable anything.

class FinishScene extends Phaser.Scene {
  constructor() { super('Finish'); }

  init(data) { this.result = data || {}; }

  create() {
    const r = this.result;
    const cx = 480;

    this.add.text(cx, 70, 'YOU MADE IT TO THE TREEHOUSE!', {
      fontFamily: 'monospace', fontSize: '30px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(0.5);

    const secs = Math.floor((r.timeMs || 0) / 1000);
    const tenths = Math.floor(((r.timeMs || 0) % 1000) / 100);
    const mm = Math.floor(secs / 60);
    const ss = String(secs % 60).padStart(2, '0');

    const lines = [
      ['Bananas x ' + (r.bananas || 0), (r.bananaPts || 0)],
      ['Enemy stuns & bounces', (r.enemyPts || 0)],
      ['Reached the treehouse', 500],
      ['No-hit bonus', r.noHit ? 1000 : 0],
      ['Time bonus  (' + mm + ':' + ss + '.' + tenths + ')', (r.timeBonus || 0)],
    ];

    let y = 145;
    lines.forEach(function (l) {
      this.add.text(300, y, l[0], { fontFamily: 'monospace', fontSize: '20px', color: '#cde' });
      this.add.text(660, y, String(l[1]), { fontFamily: 'monospace', fontSize: '20px', color: '#8fdf70' })
        .setOrigin(1, 0);
      y += 34;
    }, this);

    y += 12;
    this.add.text(300, y, 'TOTAL', { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(660, y, String(r.score || 0), {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(1, 0);

    const prompt = this.add.text(cx, 470, 'TAP OR PRESS R TO PLAY AGAIN', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 550, yoyo: true, repeat: -1 });

    const again = () => this.scene.start('Game');
    this.input.once('pointerdown', again);
    this.input.keyboard.once('keydown-R', again);
    this.input.keyboard.once('keydown-SPACE', again);
    this.input.keyboard.once('keydown-ENTER', again);
  }
}
