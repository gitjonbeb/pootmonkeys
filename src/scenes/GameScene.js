// GameScene — Phase 1 gray-box (brief §4 Phase 1, §5, §6).
// Rectangles and circles only. All feel values read live from window.TUNING.
//
// Level strip (tile units, tile = 48px, ground on row 10):
//   flat intro -> 2-tile gap -> 3-tile gap -> 3-tile gap -> beans + mud pit
//   -> 6-tile POOT gap -> enemy patrol -> 2-tile gap -> step-up climb -> door

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  // Our own clock: freezes during pause; all timestamps below use it.
  now() { return this.tnow; }

  create() {
    const T = window.TUNING;

    // Safety: a restart can happen mid hit-stop or mid pause.
    this.physics.world.resume();

    // ---- state ----
    this.tnow = 0;
    this.userPaused = false;
    this.finished = false;
    this.hitStopCount = 0;
    this.score = 0;
    this.bananaCount = 0;
    this.bananaPts = 0;
    this.enemyPts = 0;
    this.hits = 0;
    this.charges = T.pootCharges;
    this.pootReadyAt = 0;
    this.lastGroundedAt = -99999;
    this.lastJumpPressedAt = -99999;
    this.invulnUntil = 0;
    this.controlLockUntil = 0;
    this.meterFlashUntil = 0;
    this.boostVx = 0;
    this.facing = 1;
    this.lastLaunch = 'none'; // 'jump' | 'poot' | 'none' — jump-cut applies to jumps only
    this.onMud = false;
    this.touch = { left: false, right: false, jump: false };

    // ---- world ----
    const TILE = T.TILE;
    const WORLD_W = 84 * TILE; // 4032 px gray-box strip
    this.physics.world.setBounds(0, -300, WORLD_W, 1140);
    this.cameras.main.setBounds(0, 0, WORLD_W, 540);

    // ---- platforms ----
    this.platforms = this.physics.add.staticGroup();
    const addPlatform = (tileX, row, tiles) => {
      const w = tiles * TILE;
      const p = this.platforms.create(tileX * TILE + w / 2, row * TILE + TILE / 2, 'tile');
      p.setDisplaySize(w, TILE);
      p.refreshBody();
      return p;
    };
    // ground segments [startTile, lengthTiles] on row 10 (top at y=480)
    [[0, 20], [22, 8], [33, 7], [43, 14], [63, 10], [75, 9]].forEach((s) => addPlatform(s[0], 10, s[1]));
    // final climb steps
    addPlatform(77, 9, 2);
    addPlatform(80, 8, 2);

    // ---- mud pit (tiles 46-53, §5.5 #3) ----
    this.mudZones = this.physics.add.staticGroup();
    const mud = this.mudZones.create(46 * TILE + (8 * TILE) / 2, 10 * TILE - 15, 'mud');
    mud.setDisplaySize(8 * TILE, 30);
    mud.refreshBody();

    // ---- player ----
    this.spawnX = 120; this.spawnY = 450;
    this.player = this.physics.add.image(this.spawnX, this.spawnY, 'player');
    this.player.body.setSize(T.hurtW, T.hurtH); // hurtbox smaller than sprite (§6)
    this.player.body.setOffset((T.playerW - T.hurtW) / 2, T.playerH - T.hurtH);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(2000, T.maxFall);
    this.physics.add.collider(this.player, this.platforms);

    // ---- bananas (points) and beans (fuel) ----
    this.bananas = this.physics.add.group({ allowGravity: false, immovable: true });
    const bananaAt = (tx, row) => this.bananas.create(tx * TILE, row * TILE, 'banana');
    [
      [8, 8.5], [9.5, 8.5], [11, 8.5], [12.5, 8.5],            // intro line
      [20.5, 8], [21.5, 8],                                     // gap 1 arc
      [24, 8.5], [26, 8.5], [28, 8.5],                          // seg 2
      [30.5, 8], [31.5, 8],                                     // gap 2 arc
      [34, 8.5], [36, 8.5], [38, 8.5],                          // seg 3
      [40.5, 8], [41.5, 8],                                     // gap 3 arc
      [46.5, 8], [48.5, 8], [50.5, 8], [52.5, 8],               // over the mud
      [58, 6.5], [59.5, 6], [61, 6.5],                          // poot-gap high arc
      [65, 8.5], [69, 8.5], [71, 8.5],                          // enemy stretch
      [73.5, 8], [77.5, 7.5], [80.5, 6.5],                      // climb
    ].forEach((b) => bananaAt(b[0], b[1]));

    this.beansGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.beansGroup.create(44 * TILE, 8.8 * TILE, 'beans');  // just before the mud (§5.4)
    this.beansGroup.create(66 * TILE, 8.8 * TILE, 'beans');

    this.physics.add.collider(this.bananas, this.platforms);
    this.physics.add.overlap(this.player, this.bananas, (pl, b) => this.collectBanana(b));
    this.physics.add.overlap(this.player, this.beansGroup, (pl, b) => this.collectBeans(b));

    // ---- enemy: one patrolling rectangle ----
    this.enemies = this.physics.add.group();
    const e = this.enemies.create(67 * TILE, 462, 'enemy');
    e.body.setSize(40, 32);
    e.patrolMin = 64.5 * TILE; e.patrolMax = 70.5 * TILE;
    e.dirX = 1; e.stunnedUntil = 0; e.wasStunned = false; e.wobble = null;
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, (pl, en) => this.enemyTouch(en));

    // ---- finish door ----
    this.door = this.physics.add.staticImage(81 * TILE, 342, 'door');
    this.physics.add.overlap(this.player, this.door, () => this.reachFinish());

    // ---- camera ----
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // ---- input ----
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,X,SHIFT,ENTER,R,M');
    this.createHUD();
    if (this.sys.game.device.input.touch || /[?&]touch=1/.test(location.search)) {
      this.createTouchControls();
    }
  }

  // ------------------------------------------------------------- input helpers
  inputDir() {
    const k = this.keys;
    let d = 0;
    if (k.LEFT.isDown || k.A.isDown || this.touch.left) d -= 1;
    if (k.RIGHT.isDown || k.D.isDown || this.touch.right) d += 1;
    return d;
  }

  jumpHeld() {
    const k = this.keys;
    return k.SPACE.isDown || k.UP.isDown || k.W.isDown || this.touch.jump;
  }

  isGrounded() { return this.player.body.blocked.down; }

  // ------------------------------------------------------------------- update
  update(time, delta) {
    const T = window.TUNING;
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;

    // meta keys work even while paused
    if (J(k.ENTER)) this.togglePause();
    if (J(k.R)) { this.scene.restart(); return; }
    if (J(k.M)) { window.SFX.toggleMute(); }

    if (this.userPaused) { this.updateHUD(); return; }

    this.tnow += delta;
    const dt = delta / 1000;
    const now = this.tnow;

    // live-tunable world values (§7)
    this.physics.world.gravity.y = T.gravity;
    this.player.body.maxVelocity.y = T.maxFall;
    if (this.charges > T.pootCharges) this.charges = T.pootCharges;

    if (this.finished) { this.updateHUD(); return; }

    // ---- ground / mud state ----
    const grounded = this.isGrounded();
    if (grounded) { this.lastGroundedAt = now; this.lastLaunch = 'none'; }
    this.onMud = this.physics.overlap(this.player, this.mudZones);

    // ---- jump input (coyote + buffer, §5.3/§6) ----
    if (J(k.SPACE) || J(k.UP) || J(k.W)) this.lastJumpPressedAt = now;
    if (now - this.lastJumpPressedAt <= T.jumpBufferMs &&
        now - this.lastGroundedAt <= T.coyoteMs) {
      this.doJump();
    }
    // jump-cut (release early = shorter hop) — applies to jumps, never to poots
    if (this.lastLaunch === 'jump' && !this.jumpHeld()) {
      const cap = -T.jumpVelocity * T.jumpCutMultiplier;
      if (this.player.body.velocity.y < cap) this.player.body.velocity.y = cap;
    }

    // ---- poot input ----
    if (J(k.X) || J(k.SHIFT)) this.tryPoot();

    // ---- horizontal movement ----
    const dir = this.inputDir();
    if (dir !== 0) { this.facing = dir; this.player.setFlipX(dir < 0); }
    this.boostVx *= Math.exp(-3.5 * dt);
    if (Math.abs(this.boostVx) < 5) this.boostVx = 0;
    if (now >= this.controlLockUntil) {
      const slow = (grounded && this.onMud) ? T.mudSlowPct / 100 : 1;
      this.player.body.setVelocityX(dir * T.moveSpeed * slow + this.boostVx);
    }

    // ---- banana magnet (§6) + dropped-banana lifecycle (§5.5) ----
    this.bananas.children.each((b) => {
      if (!b.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
      const grabbable = !b.dropped || now >= b.collectibleAt;
      if (grabbable && d <= T.magnetRadius) {
        this.physics.moveToObject(b, this.player, 340);
      } else if (!b.dropped) {
        b.body.setVelocity(0, 0);
      }
      if (b.dropped) {
        if (now >= b.expireAt) { this.puff(b.x, b.y, 0xffd83d, 3); b.destroy(); }
        else if (now >= b.expireAt - 1000) b.setAlpha(Math.floor(now / 100) % 2 ? 0.3 : 1);
      }
    });

    // ---- enemy patrol + stun expiry ----
    this.enemies.children.each((e) => {
      if (!e.active) return;
      const stunned = now < e.stunnedUntil;
      if (stunned) {
        e.body.setVelocityX(0);
        if (!e.wasStunned) {
          e.wasStunned = true;
          e.setTint(0x7ec8ff);
          e.wobble = this.tweens.add({
            targets: e, angle: { from: -8, to: 8 }, duration: 120, yoyo: true, repeat: -1,
          });
        }
      } else {
        if (e.wasStunned) {
          e.wasStunned = false;
          if (e.wobble) { e.wobble.stop(); e.wobble = null; }
          e.setAngle(0); e.clearTint();
        }
        if (e.x <= e.patrolMin || e.body.blocked.left) e.dirX = 1;
        if (e.x >= e.patrolMax || e.body.blocked.right) e.dirX = -1;
        e.body.setVelocityX(T.enemySpeed * e.dirX);
      }
    });

    // ---- fell into a pit (§5.5: respawn fast, keep score, refill poots) ----
    if (this.player.y > 620) this.respawn();

    this.updateHUD();
  }

  // ------------------------------------------------------------------ actions
  doJump() {
    const T = window.TUNING;
    this.player.body.setVelocityY(-T.jumpVelocity);
    this.lastJumpPressedAt = -99999;
    this.lastGroundedAt = -99999;
    this.lastLaunch = 'jump';
    window.SFX.jump();
    this.player.setScale(0.9, 1.12);
    this.tweens.add({ targets: this.player, scaleX: 1, scaleY: 1, duration: 140 });
  }

  tryPoot() {
    const T = window.TUNING;
    const now = this.now();
    if (this.finished || this.userPaused) return;
    if (now < this.pootReadyAt) return;
    if (this.charges <= 0) { this.meterFlashUntil = now + 250; return; }

    this.charges -= 1;
    this.pootReadyAt = now + T.pootCooldownMs;

    if (!this.isGrounded()) {
      // The double-jump replacement (§5.4). Upward velocity is SET (not added)
      // so the boost is predictable whether rising or falling.
      this.player.body.setVelocityY(-T.pootVertical);
      const dir = this.inputDir() || this.facing;
      this.boostVx = dir * T.pootHorizontal;
      this.lastLaunch = 'poot';
    }

    // any use stuns nearby enemies (§5.4)
    this.enemies.children.each((e) => {
      if (!e.active) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) <= T.pootStunRadius) {
        this.stunEnemy(e);
      }
    });

    // the joke — do not make it subtle (§5.4)
    this.puff(this.player.x, this.player.y + 18, 0x8fdf70, 7);
    this.cameras.main.shake(80, 0.004);
    this.hitStop(45);
    window.SFX.poot();
  }

  stunEnemy(e) {
    const T = window.TUNING;
    const already = this.now() < e.stunnedUntil;
    e.stunnedUntil = this.now() + T.stunDurationMs;
    if (!already) {
      this.score += 100;
      this.enemyPts += 100;
      window.SFX.stun();
      this.puff(e.x, e.y - 20, 0x7ec8ff, 4);
    }
  }

  enemyTouch(e) {
    if (this.finished || !e.active) return;
    const now = this.now();
    const stunned = now < e.stunnedUntil;
    if (stunned) {
      // bounce-defeat: falling onto a stunned enemy (§5.5, §5.6)
      const falling = this.player.body.velocity.y > 40;
      const above = this.player.body.bottom < e.body.top + 20;
      if (falling && above) {
        this.score += 250;
        this.enemyPts += 250;
        window.SFX.bounce();
        this.puff(e.x, e.y, 0x7d4fa0, 6);
        if (e.wobble) e.wobble.stop();
        e.destroy();
        this.player.body.setVelocityY(-0.6 * window.TUNING.jumpVelocity);
      }
      return; // stunned enemies are harmless to touch
    }
    if (now >= this.invulnUntil) this.takeHit(e.x);
  }

  takeHit(srcX) {
    const T = window.TUNING;
    const now = this.now();
    this.hits += 1;
    this.invulnUntil = now + T.invulnMs;
    this.controlLockUntil = now + 220;

    const away = Math.sign(this.player.x - srcX) || -1;
    this.player.body.setVelocity(away * T.knockbackX, -T.knockbackY);

    // blink for the invulnerability window (§5.5)
    this.tweens.add({
      targets: this.player, alpha: 0.25, duration: 80, yoyo: true,
      repeat: Math.floor(T.invulnMs / 160),
      onComplete: () => this.player.setAlpha(1),
    });

    // drop up to two bananas that scatter and stay grabbable ~3s (§5.5)
    const n = Math.min(2, this.bananaCount);
    for (let i = 0; i < n; i++) {
      this.bananaCount -= 1;
      this.score = Math.max(0, this.score - 100);
      this.bananaPts = Math.max(0, this.bananaPts - 100);
      const b = this.bananas.create(this.player.x, this.player.y - 10, 'banana');
      b.dropped = true;
      b.collectibleAt = now + 400;
      b.expireAt = now + T.droppedBananaLifeMs;
      b.body.setAllowGravity(true);
      b.setBounce(0.45);
      b.body.setVelocity((i === 0 ? -1 : 1) * Phaser.Math.Between(90, 160), -260);
    }

    window.SFX.hit();
    this.cameras.main.shake(90, 0.006);
    this.hitStop(60);
  }

  collectBanana(b) {
    if (!b.active) return;
    if (b.dropped && this.now() < b.collectibleAt) return;
    this.score += 100;
    this.bananaPts += 100;
    this.bananaCount += 1;
    window.SFX.banana();
    this.puff(b.x, b.y, 0xffd83d, 3);
    b.destroy();
  }

  collectBeans(b) {
    if (!b.active) return;
    const T = window.TUNING;
    if (this.charges < T.pootCharges) this.charges += 1;
    window.SFX.beans();
    this.puff(b.x, b.y, 0x6ab55c, 4);
    b.destroy();
  }

  respawn() {
    const T = window.TUNING;
    this.player.setPosition(this.spawnX, this.spawnY);
    this.player.body.setVelocity(0, 0);
    this.boostVx = 0;
    this.charges = T.pootCharges;          // meter refills on respawn — be kind (§5.5)
    this.invulnUntil = this.now() + 600;
    this.cameras.main.flash(160, 30, 20, 20);
    window.SFX.respawn();
  }

  reachFinish() {
    if (this.finished) return;
    const T = window.TUNING;
    this.finished = true;

    const timeMs = this.tnow;
    const timeBonus = Math.max(0, 5000 - 20 * Math.floor(timeMs / 1000));
    const noHit = this.hits === 0;
    this.score += 500 + timeBonus + (noHit ? 1000 : 0);

    this.player.body.setVelocity(0, 0);
    window.SFX.victory();
    this.puff(this.player.x, this.player.y - 30, 0xffd83d, 10);
    this.tweens.add({ targets: this.player, scaleX: 1.15, scaleY: 1.15, duration: 160, yoyo: true, repeat: 2 });

    const payload = {
      score: this.score, bananas: this.bananaCount, bananaPts: this.bananaPts,
      enemyPts: this.enemyPts, timeMs: timeMs, timeBonus: timeBonus, noHit: noHit,
    };
    const go = () => { if (this.scene.isActive('Game')) this.scene.start('Finish', payload); };
    this.time.delayedCall(750, go);           // short beat, and…
    this.input.once('pointerdown', go);       // …skippable immediately (§6)
  }

  // -------------------------------------------------------------------- feel
  hitStop(ms) {
    if (this.userPaused) return;
    this.hitStopCount += 1;
    this.physics.world.pause();
    this.time.delayedCall(ms, () => {
      this.hitStopCount -= 1;
      if (this.hitStopCount <= 0 && !this.userPaused) this.physics.world.resume();
    });
  }

  togglePause() {
    if (this.finished) return;
    this.userPaused = !this.userPaused;
    if (this.userPaused) {
      this.physics.world.pause();
      this.pauseText.setVisible(true);
    } else {
      this.pauseText.setVisible(false);
      if (this.hitStopCount <= 0) this.physics.world.resume();
    }
  }

  puff(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const c = this.add.image(
        x + Phaser.Math.Between(-14, 14), y + Phaser.Math.Between(-10, 10), 'cloud');
      c.setTint(color).setAlpha(0.9).setScale(0.5).setDepth(20);
      this.tweens.add({
        targets: c, alpha: 0, scale: 1.7,
        x: c.x + Phaser.Math.Between(-18, 18), y: c.y + Phaser.Math.Between(-24, 6),
        duration: 350, onComplete: () => c.destroy(),
      });
    }
  }

  // --------------------------------------------------------------------- HUD
  createHUD() {
    const style = { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' };
    this.scoreText = this.add.text(16, 10, 'SCORE 0', style).setScrollFactor(0).setDepth(90);

    this.add.image(28, 56, 'banana').setScrollFactor(0).setDepth(90);
    this.bananaText = this.add.text(44, 45, 'x 0', style).setScrollFactor(0).setDepth(90);

    this.cloudIcons = [];
    for (let i = 0; i < 5; i++) {
      this.cloudIcons.push(
        this.add.image(28 + i * 30, 92, 'cloud').setScrollFactor(0).setDepth(90));
    }

    this.timerText = this.add.text(480, 10, '0:00.0', style)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(90);

    this.mutedText = this.add.text(944, 10, 'MUTED', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff8888',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(90);

    this.add.text(944, 34, '(R)estart (Enter)pause (M)ute', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8ea2bd',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(90).setAlpha(0.6);

    this.pauseText = this.add.text(480, 250, 'PAUSED\n\nEnter to resume', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ffe066', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(95).setVisible(false);
  }

  updateHUD() {
    const T = window.TUNING;
    this.scoreText.setText('SCORE ' + this.score);
    this.bananaText.setText('x ' + this.bananaCount);

    const secs = Math.floor(this.tnow / 1000);
    const tenths = Math.floor((this.tnow % 1000) / 100);
    this.timerText.setText(Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0') + '.' + tenths);

    const flashing = this.now() < this.meterFlashUntil;
    this.cloudIcons.forEach((c, i) => {
      if (i >= T.pootCharges) { c.setVisible(false); return; }
      c.setVisible(true);
      c.setAlpha(i < this.charges ? 1 : 0.22);
      if (flashing) c.setTint(0xff6666);
      else c.clearTint();
    });

    this.mutedText.setVisible(window.SFX.muted);
  }

  // ----------------------------------------------------------- touch controls
  createTouchControls() {
    const bind = (img, onDown, onUp) => {
      img.setScrollFactor(0).setDepth(100).setAlpha(0.4).setInteractive();
      img.ptrId = null;
      img.on('pointerdown', (p) => { img.ptrId = p.id; img.setAlpha(0.75); onDown(); });
      const release = (p) => {
        if (img.ptrId !== p.id) return;
        img.ptrId = null; img.setAlpha(0.4);
        if (onUp) onUp();
      };
      img.on('pointerup', release);
      img.on('pointerout', release);
    };
    const label = (x, y, s, size) => this.add.text(x, y, s, {
      fontFamily: 'monospace', fontSize: (size || 30) + 'px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.85);

    const L = this.add.image(70, 468, 'btnPad');
    bind(L, () => { this.touch.left = true; }, () => { this.touch.left = false; });
    label(70, 468, '<', 44);

    const R = this.add.image(186, 468, 'btnPad');
    bind(R, () => { this.touch.right = true; }, () => { this.touch.right = false; });
    label(186, 468, '>', 44);

    const P = this.add.image(748, 470, 'btnPoot');
    bind(P, () => this.tryPoot());
    label(748, 470, 'POOT', 24);

    const Jb = this.add.image(878, 462, 'btnJump');
    bind(Jb,
      () => { this.touch.jump = true; this.lastJumpPressedAt = this.now(); },
      () => { this.touch.jump = false; });
    label(878, 462, 'JUMP', 26);
  }
}
