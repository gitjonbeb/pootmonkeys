// SelectScene — pick your pootmonkey (§5.7). Tap a card, or arrows + Enter,
// or number keys 1-5. Remembers the last pick per device.

class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    window.Voice.init();
    this.chosen = false;

    // static jungle backdrop
    this.cameras.main.setBackgroundColor('#4b7b8f');
    this.add.tileSprite(480, 300, 480, 280, 'bg_far').setScale(2).setDepth(-20);
    this.add.tileSprite(480, 320, 480, 282, 'bg_near').setScale(2).setDepth(-15);

    this.add.text(480, 52, 'PICK YOUR POOTMONKEY', {
      fontFamily: 'monospace', fontSize: '34px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(0.5);

    const saved = window.CharUtil.savedCharId();
    this.cursor = Math.max(0, window.CHARACTERS.findIndex((c) => c.id === saved));

    this.cards = [];
    window.CHARACTERS.forEach((c, i) => {
      const x = 480 + (i - 2) * 176;
      const card = this.add.image(x, 280, 'btnPad').setDisplaySize(152, 200).setAlpha(0.45);
      card.setInteractive({ useHandCursor: true });
      const monkey = this.add.sprite(x, 268, c.id + '_idle0').setScale(2);
      monkey.play(c.id + '_idle');
      const name = this.add.text(x, 352, c.name, {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      card.on('pointerdown', () => { this.cursor = i; this.choose(); });
      this.cards.push({ card, monkey, name, char: c, x });
    });

    this.ring = this.add.graphics();
    this.updateCursor();

    this.add.text(480, 470, 'TAP A MONKEY  ·  or arrows + Enter', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cfe0ee',
    }).setOrigin(0.5).setAlpha(0.8);

    this.input.keyboard.on('keydown-LEFT', () => this.move(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.move(1));
    this.input.keyboard.on('keydown-ENTER', () => this.choose());
    this.input.keyboard.on('keydown-SPACE', () => this.choose());
    for (let n = 1; n <= 5; n++) {
      this.input.keyboard.on('keydown-' + ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][n - 1],
        () => { this.cursor = n - 1; this.choose(); });
    }
  }

  move(d) {
    if (this.chosen) return;
    this.cursor = (this.cursor + d + this.cards.length) % this.cards.length;
    this.updateCursor();
  }

  updateCursor() {
    this.ring.clear();
    const x = this.cards[this.cursor].x;
    this.ring.lineStyle(4, 0xffd83d, 1);
    this.ring.strokeRoundedRect(x - 80, 172, 160, 212, 14);
    this.cards.forEach((cd, i) => {
      cd.monkey.setScale(i === this.cursor ? 2.3 : 2);
      cd.card.setAlpha(i === this.cursor ? 0.7 : 0.45);
    });
  }

  choose() {
    if (this.chosen) return;
    this.chosen = true;
    this.updateCursor();
    const cd = this.cards[this.cursor];
    window.CharUtil.saveCharId(cd.char.id);
    this.registry.set('charId', cd.char.id);
    window.CharUtil.bubble(this, cd.x, 168, cd.char.lines.select);
    window.Voice.say(cd.char.id, 'select');
    window.SFX.checkpoint();
    this.tweens.add({ targets: cd.monkey, scale: 2.6, duration: 150, yoyo: true });
    this.time.delayedCall(1000, () => this.scene.start('Game'));
  }
}
