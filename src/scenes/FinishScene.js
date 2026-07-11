// FinishScene — score breakdown, rank (§5.6), high scores (top 10 per device,
// three-letter initials, localStorage). Instant replay always one tap away.

class FinishScene extends Phaser.Scene {
  constructor() { super('Finish'); }

  init(data) { this.result = data || {}; }

  loadScores() {
    try { return JSON.parse(localStorage.getItem('pootmonkeys.hiscores') || '[]'); }
    catch (e) { return []; }
  }
  saveScores(list) {
    try { localStorage.setItem('pootmonkeys.hiscores', JSON.stringify(list)); } catch (e) {}
  }
  rankFor(score) {
    const R = window.RANKS;
    for (let i = 0; i < R.length; i++) if (score >= R[i][0]) return R[i][1];
    return R[R.length - 1][1];
  }

  create() {
    const r = this.result;
    this.charId = this.registry.get('charId') || window.CharUtil.savedCharId();
    this.char = window.CharUtil.byId(this.charId);
    this.typing = false;
    this.saved = false;

    this.cameras.main.setBackgroundColor('#31414f');
    this.add.tileSprite(480, 330, 480, 280, 'bg_far').setScale(2).setAlpha(0.5).setDepth(-20);

    this.add.text(480, 40, 'YOU MADE IT TO THE TREEHOUSE!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(0.5);

    // the champion, celebrating
    const m = this.add.sprite(150, 260, this.charId + '_idle0').setScale(3);
    m.play(this.charId + '_vic');
    this.add.text(150, 345, this.char.name, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // breakdown
    const secs = Math.floor((r.timeMs || 0) / 1000);
    const tenths = Math.floor(((r.timeMs || 0) % 1000) / 100);
    const mm = Math.floor(secs / 60);
    const ss = String(secs % 60).padStart(2, '0');
    const lines = [
      ['Bananas x ' + (r.bananas || 0), (r.bananaPts || 0)],
      ['Stuns, bounces & bees', (r.enemyPts || 0)],
    ];
    if (r.goldenPts) lines.push(['GOLDEN BANANA!', r.goldenPts]);
    lines.push(['Reached the treehouse', 500]);
    lines.push(['No-hit bonus', r.noHit ? 1000 : 0]);
    lines.push(['Time bonus (' + mm + ':' + ss + '.' + tenths + ')', (r.timeBonus || 0)]);

    this.summary = [];
    let y = 86;
    lines.forEach((l) => {
      this.summary.push(this.add.text(330, y, l[0], { fontFamily: 'monospace', fontSize: '17px', color: '#cde' }));
      this.summary.push(this.add.text(800, y, String(l[1]), { fontFamily: 'monospace', fontSize: '17px', color: '#8fdf70' }).setOrigin(1, 0));
      y += 26;
    });
    y += 8;
    this.summary.push(this.add.text(330, y, 'TOTAL', { fontFamily: 'monospace', fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }));
    this.summary.push(this.add.text(800, y, String(r.score || 0), { fontFamily: 'monospace', fontSize: '26px', color: '#ffd83d', fontStyle: 'bold' }).setOrigin(1, 0));

    this.add.text(565, y + 44, 'RANK: ' + this.rankFor(r.score || 0), {
      fontFamily: 'monospace', fontSize: '20px', color: '#f2b632', fontStyle: 'bold',
    }).setOrigin(0.5);

    // high-score flow
    const list = this.loadScores();
    const qualifies = (r.score || 0) > 0 && (list.length < 10 || r.score > list[list.length - 1].s);
    if (qualifies) this.buildInitialsUI(y + 78);
    else this.buildTableLink(y + 78);

    // PLAY AGAIN — always one tap away
    const pb = this.add.image(480, 494, 'btnJump').setDisplaySize(320, 64).setAlpha(0.9);
    pb.setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this.again());
    this.add.text(480, 494, 'PLAY AGAIN!', {
      fontFamily: 'monospace', fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown', (e) => this.onKey(e));
  }

  again() { this.scene.start('Select'); }

  onKey(e) {
    if (this.typing) {
      if (/^[a-zA-Z]$/.test(e.key)) {
        this.initials[this.slot] = e.key.toUpperCase();
        this.slot = Math.min(2, this.slot + 1);
        this.refreshSlots();
      } else if (e.key === 'Backspace') {
        this.slot = Math.max(0, this.slot - 1);
        this.refreshSlots();
      } else if (e.key === 'Enter') {
        this.commitScore();
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') this.again();
  }

  buildInitialsUI(y) {
    this.typing = true;
    this.slot = 0;
    let last = 'AAA';
    try { last = localStorage.getItem('pootmonkeys.initials') || 'AAA'; } catch (e) {}
    this.initials = last.split('').slice(0, 3);
    while (this.initials.length < 3) this.initials.push('A');

    this.ui = [];
    this.ui.push(this.add.text(565, y, 'HIGH SCORE! Tap letters, then OK', {
      fontFamily: 'monospace', fontSize: '16px', color: '#8fdf70',
    }).setOrigin(0.5));

    this.slotTexts = [];
    for (let i = 0; i < 3; i++) {
      const x = 480 + (i - 1) * 60;
      const bg = this.add.image(x, y + 44, 'btnPad').setDisplaySize(52, 56).setAlpha(0.5);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.slot = i;
        const code = this.initials[i].charCodeAt(0);
        this.initials[i] = String.fromCharCode(code >= 90 ? 65 : code + 1);
        this.refreshSlots();
      });
      const t = this.add.text(x, y + 44, this.initials[i], {
        fontFamily: 'monospace', fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.slotTexts.push(t);
      this.ui.push(bg, t);
    }
    const ok = this.add.image(660, y + 44, 'btnPoot').setDisplaySize(70, 56).setAlpha(0.85);
    ok.setInteractive({ useHandCursor: true });
    ok.on('pointerdown', () => this.commitScore());
    const okT = this.add.text(660, y + 44, 'OK', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.ui.push(ok, okT);
    this.refreshSlots();
  }

  refreshSlots() {
    this.slotTexts.forEach((t, i) => {
      t.setText(this.initials[i]);
      t.setColor(i === this.slot ? '#ffd83d' : '#ffffff');
    });
  }

  commitScore() {
    if (this.saved) return;
    this.saved = true;
    this.typing = false;
    const initials = this.initials.join('');
    try { localStorage.setItem('pootmonkeys.initials', initials); } catch (e) {}
    const list = this.loadScores();
    list.push({ i: initials, s: this.result.score || 0, c: this.charId });
    list.sort((a, b) => b.s - a.s);
    this.saveScores(list.slice(0, 10));
    this.ui.forEach((o) => o.destroy());
    window.SFX.checkpoint();
    this.showTable();
  }

  buildTableLink(y) {
    const link = this.add.text(565, y + 30, '[ view best scores ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cfe0ee',
    }).setOrigin(0.5).setAlpha(0.85);
    link.setInteractive({ useHandCursor: true });
    link.on('pointerdown', () => { link.destroy(); this.showTable(); });
  }

  showTable() {
    this.summary.forEach((o) => o.destroy());
    const list = this.loadScores();
    this.add.text(565, 86, 'BEST POOTMONKEYS (this tablet)', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(0.5);
    let y = 118;
    list.forEach((e, idx) => {
      const mine = !this.tableMarked && e.s === (this.result.score || 0) && e.i === (this.initials || []).join('');
      if (mine) this.tableMarked = true;
      const color = mine ? '#ffd83d' : '#cde';
      const name = window.CharUtil.byId(e.c).name;
      this.add.text(360, y, String(idx + 1).padStart(2, ' ') + '. ' + e.i, { fontFamily: 'monospace', fontSize: '16px', color: color });
      this.add.text(560, y, name, { fontFamily: 'monospace', fontSize: '16px', color: color });
      this.add.text(790, y, String(e.s), { fontFamily: 'monospace', fontSize: '16px', color: color }).setOrigin(1, 0);
      y += 24;
    });
  }
}
