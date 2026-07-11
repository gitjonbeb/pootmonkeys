// GameScene — Phase 3: full jungle level (brief §5.5), pixel art, checkpoints.
//
// Sections (tile = 48px, ground row 10, world ~220 tiles):
//   1 intro 0-29 · 2 gaps 32-67 · 3 mud 70-94 + 6-tile poot gap
//   4 coconuts 115-146 · 5 bees 149-164 · 6 high path (2 poots, golden banana)
//   7 snake 167-192 · 8 climb 195-220 -> treehouse door
// Checkpoints: 103 (after mud), 168 (after bees), 196 (before climb).

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  now() { return this.tnow; }

  create() {
    const T = window.TUNING;
    this.physics.world.resume(); // restart can happen mid hit-stop

    // ---- state ----
    this.tnow = 0;
    this.userPaused = false;
    this.finished = false;
    this.hitStopCount = 0;
    this.score = 0;
    this.bananaCount = 0;
    this.bananaPts = 0;
    this.enemyPts = 0;
    this.goldenPts = 0;
    this.hits = 0;
    this.charges = T.pootCharges;
    this.pootReadyAt = 0;
    this.lastGroundedAt = -99999;
    this.lastJumpPressedAt = -99999;
    this.invulnUntil = 0;
    this.controlLockUntil = 0;
    this.meterFlashUntil = 0;
    this.respawnGraceUntil = 0;
    this.pootAnimUntil = 0;
    this.hitAnimUntil = 0;
    this.curAnim = '';
    this.boostVx = 0;
    this.facing = 1;
    this.lastLaunch = 'none';
    this.onMud = false;
    this.touch = { left: false, right: false, jump: false };

    const TILE = T.TILE;
    const WORLD_W = 220 * TILE;
    this.physics.world.setBounds(0, -300, WORLD_W, 1140);
    this.cameras.main.setBounds(0, 0, WORLD_W, 540);
    this.cameras.main.setBackgroundColor('#4b7b8f');

    // ---- parallax jungle ----
    this.bgFar = this.add.tileSprite(480, 300, 480, 280, 'bg_far')
      .setScale(2).setScrollFactor(0).setDepth(-20);
    this.bgNear = this.add.tileSprite(480, 320, 480, 282, 'bg_near')
      .setScale(2).setScrollFactor(0).setDepth(-15);

    // ---- terrain ----
    this.platforms = this.physics.add.staticGroup();
    const groundRow = 10;
    const solid = (tileX, row, tiles) => {
      const w = tiles * TILE;
      const p = this.platforms.create(tileX * TILE + w / 2, row * TILE + TILE / 2, 'px');
      p.setDisplaySize(w, TILE).setVisible(false);
      p.refreshBody();
      // one TileSprite per platform instead of per-tile images (iPad draw-call budget)
      this.add.tileSprite(tileX * TILE + w / 2, row * TILE + 24, w, TILE, 'grass').setDepth(0);
    };
    const SEGS = [[0, 30], [32, 10], [45, 10], [58, 10], [70, 25], [101, 12],
                  [115, 32], [149, 16], [167, 26], [195, 25]];
    SEGS.forEach((s) => solid(s[0], groundRow, s[1]));
    // floating platforms: high path (2 poots) + final climb steps
    const STEPS = [[172, 3, 7], [176, 3, 5],
                   [201, 2, 9], [204, 2, 8], [207, 2, 7], [210, 3, 6]];
    STEPS.forEach((s) => solid(s[0], s[2], s[1]));

    // ---- mud pit (§5.5 #3) ----
    this.mudZones = this.physics.add.staticGroup();
    const mudFrom = 74, mudTiles = 11;
    const mz = this.mudZones.create(mudFrom * TILE + (mudTiles * TILE) / 2, groundRow * TILE - 8, 'px');
    mz.setDisplaySize(mudTiles * TILE, 26).setVisible(false);
    mz.refreshBody();
    this.add.tileSprite(mudFrom * TILE + (mudTiles * TILE) / 2, groundRow * TILE - 8,
      mudTiles * TILE, 16, 'mud').setDepth(1);

    // ---- player ----
    this.spawnX = 300; this.spawnY = 450;
    this.checkpointX = this.spawnX; this.checkpointY = this.spawnY;
    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'monkey_idle0');
    this.player.body.setSize(T.hurtW, T.hurtH);
    this.player.body.setOffset((T.playerW - T.hurtW) / 2, T.playerH - T.hurtH);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(2000, T.maxFall);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.platforms);

    // ---- bananas & beans ----
    this.bananas = this.physics.add.group({ allowGravity: false, immovable: true });
    const bAt = (tx, row) => this.bananas.create(tx * TILE, row * TILE, 'banana');
    [[6, 9], [8, 9], [10, 8.5], [12, 8.5], [14, 8.5], [17, 8.5], [20, 8], [23, 8.5], [26, 8.5],
     [30.5, 8], [31.5, 8], [34, 8.5], [37, 8.5], [40, 8.5], [42.5, 8], [44, 8],
     [48, 8.5], [51, 8.5], [55.5, 8], [57, 8], [60, 8.5], [63, 8.5], [66, 8.5],
     [75, 8], [78, 8], [81, 8], [84, 8],
     [96, 6.5], [97.5, 6], [99, 6.5], [104, 8.5], [108, 8.5],
     [117, 8.5], [122, 8.5], [125, 8], [130, 8.5], [133, 8], [138, 8.5], [141, 8], [145, 8.5],
     [151, 8.5], [154, 8], [158, 8], [161, 8.5],
     [171, 8.5], [180, 8.5], [186, 8.5], [190, 8.5],
     [172.5, 6], [176.5, 3.5], [178, 3.5],
     [198, 8.5], [201.5, 7.5], [204.5, 6.5], [207.5, 5.5], [210.5, 4.5],
    ].forEach((b) => bAt(b[0], b[1]));

    this.golden = this.physics.add.image(177.5 * TILE, 3.5 * TILE, 'golden');
    this.golden.body.setAllowGravity(false); this.golden.body.immovable = true;
    this.golden.setDepth(6);
    this.goldenGlow = this.add.image(this.golden.x, this.golden.y, 'cloud')
      .setTint(0xffd83d).setAlpha(0.45).setScale(2.6).setDepth(5);
    this.tweens.add({ targets: this.goldenGlow, scale: 3.6, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.goldenSparks = [];
    for (let gi = 0; gi < 3; gi++) {
      const sp = this.add.image(this.golden.x + [-26, 24, 2][gi], this.golden.y + [-18, -8, 24][gi], 'px')
        .setTint(0xfff3b0).setDepth(7).setScale(2);
      this.goldenSparks.push(sp);
      this.tweens.add({ targets: sp, alpha: 0.1, scale: 0.6, duration: 380 + gi * 140, yoyo: true, repeat: -1 });
    }
    this.tweens.add({ targets: [this.golden, this.goldenGlow], y: '-=10', duration: 700, yoyo: true, repeat: -1 });

    this.beansGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    [[35, 8.8], [72, 8.8], [90, 8.8], [111, 8.8], [128, 8.8], [155, 8.8],
     [169, 8.8], [170.5, 8.8], [173, 6.3], [197, 8.8]]
      .forEach((b) => this.beansGroup.create(b[0] * TILE, b[1] * TILE, 'beans'));

    this.physics.add.collider(this.bananas, this.platforms);
    this.physics.add.overlap(this.player, this.bananas, (pl, b) => this.collectBanana(b));
    this.physics.add.overlap(this.player, this.beansGroup, (pl, b) => this.collectBeans(b));
    this.physics.add.overlap(this.player, this.golden, () => this.collectGolden());

    // ---- checkpoints (§5.5): after mud, after bees, before climb ----
    this.flags = [];
    [[103, 'cp1'], [168, 'cp2'], [196, 'cp3']].forEach((c) => {
      const f = this.physics.add.staticImage(c[0] * TILE, groundRow * TILE - 30, 'flag_off');
      f.cpActive = false;
      this.flags.push(f);
      this.physics.add.overlap(this.player, f, () => this.hitCheckpoint(f));
    });

    // ---- coconut palms (§5.5 #4) ----
    this.palms = [];
    this.coconuts = this.physics.add.group();
    [119, 127, 135, 143].forEach((tx) => {
      const palm = this.add.image(tx * TILE + 24, groundRow * TILE - 45, 'palm').setDepth(2);
      palm.cooldownUntil = 0;
      this.palms.push(palm);
    });
    this.physics.add.collider(this.coconuts, this.platforms, (c) => this.breakCoconut(c));
    this.physics.add.overlap(this.player, this.coconuts, (pl, c) => {
      if (this.now() >= this.invulnUntil && !this.finished) this.takeHit(c.x);
      this.breakCoconut(c);
    });

    // ---- bee swarm (§5.5 #5) ----
    this.beeSwarms = [];
    const bees = this.physics.add.sprite(156 * TILE, groundRow * TILE - 58, 'bees0');
    bees.play('a_bees');
    bees.body.setAllowGravity(false); bees.body.immovable = true;
    bees.dispersedUntil = 0; bees.setDepth(5);
    this.tweens.add({ targets: bees, y: bees.y - 12, duration: 900, yoyo: true, repeat: -1 });
    this.beeSwarms.push(bees);
    this.physics.add.overlap(this.player, bees, () => {
      if (this.now() < bees.dispersedUntil) return;
      if (this.now() >= this.invulnUntil && !this.finished) this.takeHit(bees.x);
    });

    // ---- snake (§5.5 #7) ----
    this.snakes = this.physics.add.group();
    const snake = this.snakes.create(178 * TILE, groundRow * TILE - 8, 'snake0');
    snake.play('a_snake');
    snake.body.setSize(34, 12); snake.body.setOffset(3, 2);
    snake.patrolMin = 172 * TILE; snake.patrolMax = 188 * TILE;
    snake.dirX = 1; snake.stunnedUntil = 0; snake.wasStunned = false; snake.wobble = null;
    snake.setDepth(4);
    this.physics.add.collider(this.snakes, this.platforms);
    this.physics.add.overlap(this.player, this.snakes, (pl, sn) => this.enemyTouch(sn));

    // ---- treehouse door ----
    this.door = this.physics.add.staticImage(211.5 * TILE, 6 * TILE - 27, 'door');
    this.door.setDepth(3);
    this.physics.add.overlap(this.player, this.door, () => this.reachFinish());

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,X,SHIFT,ENTER,R,M');
    this.createHUD();
    if (this.sys.game.device.input.touch || /[?&]touch=1/.test(location.search)) {
      this.createTouchControls();
    }
  }

  // ---------------------------------------------------------------- helpers
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

  // ----------------------------------------------------------------- update
  update(time, delta) {
    const T = window.TUNING;
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;

    if (J(k.ENTER)) this.togglePause();
    if (J(k.R)) { this.scene.restart(); return; }
    if (J(k.M)) { window.SFX.toggleMute(); }
    if (this.userPaused) { this.updateHUD(); return; }

    this.tnow += delta;
    const dt = delta / 1000;
    const now = this.tnow;

    this.physics.world.gravity.y = T.gravity;
    this.player.body.maxVelocity.y = T.maxFall;
    if (this.charges > T.pootCharges) this.charges = T.pootCharges;

    // parallax
    const sx = this.cameras.main.scrollX;
    this.bgFar.tilePositionX = sx * 0.08;
    this.bgNear.tilePositionX = sx * 0.2;

    if (this.finished) { this.updateAnim(now, 0, false); this.updateHUD(); return; }

    const grounded = this.isGrounded();
    if (grounded) { this.lastGroundedAt = now; this.lastLaunch = 'none'; }
    this.onMud = this.physics.overlap(this.player, this.mudZones);

    if (J(k.SPACE) || J(k.UP) || J(k.W)) this.lastJumpPressedAt = now;
    if (now - this.lastJumpPressedAt <= T.jumpBufferMs &&
        now - this.lastGroundedAt <= T.coyoteMs) {
      this.doJump();
    }
    if (this.lastLaunch === 'jump' && !this.jumpHeld()) {
      const cap = -T.jumpVelocity * T.jumpCutMultiplier;
      if (this.player.body.velocity.y < cap) this.player.body.velocity.y = cap;
    }
    if (J(k.X) || J(k.SHIFT)) this.tryPoot();

    const dir = this.inputDir();
    if (dir !== 0) { this.facing = dir; this.player.setFlipX(dir < 0); }
    this.boostVx *= Math.exp(-3.5 * dt);
    if (Math.abs(this.boostVx) < 5) this.boostVx = 0;
    if (now >= this.controlLockUntil) {
      const slow = (grounded && this.onMud) ? T.mudSlowPct / 100 : 1;
      this.player.body.setVelocityX(dir * T.moveSpeed * slow + this.boostVx);
    }

    // bananas: magnet + dropped lifecycle
    this.bananas.children.each((b) => {
      if (!b.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
      const grabbable = !b.dropped || now >= b.collectibleAt;
      if (grabbable && d <= T.magnetRadius) this.physics.moveToObject(b, this.player, 340);
      else if (!b.dropped) b.body.setVelocity(0, 0);
      if (b.dropped) {
        if (now >= b.expireAt) { this.puff(b.x, b.y, 0xffd83d, 3); b.destroy(); }
        else if (now >= b.expireAt - 1000) b.setAlpha(Math.floor(now / 100) % 2 ? 0.3 : 1);
      }
    });

    // palms drop coconuts when the player wanders near (§5.5: telegraphed)
    this.palms.forEach((palm) => {
      if (now < palm.cooldownUntil) return;
      if (Math.abs(this.player.x - palm.x) > 150) return;
      palm.cooldownUntil = now + 2600;
      this.tweens.add({ targets: palm, angle: { from: -3, to: 3 }, duration: 100, yoyo: true, repeat: 5,
        onComplete: () => {
          palm.setAngle(0);
          if (this.finished) return;
          const c = this.coconuts.create(palm.x + 6, palm.y - 30, 'coconut');
          c.body.setSize(14, 14);
        } });
    });

    // bee swarms recover
    this.beeSwarms.forEach((bees) => {
      const dispersed = now < bees.dispersedUntil;
      if (dispersed && bees.body.enable) {
        bees.body.enable = false;
        this.tweens.add({ targets: bees, alpha: 0.12, duration: 250 });
      } else if (!dispersed && !bees.body.enable) {
        bees.body.enable = true;
        this.tweens.add({ targets: bees, alpha: 1, duration: 400 });
      }
    });

    // snake patrol + stun expiry
    this.snakes.children.each((e) => {
      if (!e.active) return;
      const stunned = now < e.stunnedUntil;
      if (stunned) {
        e.body.setVelocityX(0);
        if (!e.wasStunned) {
          e.wasStunned = true;
          e.setTint(0x7ec8ff);
          e.anims.pause();
          e.wobble = this.tweens.add({ targets: e, angle: { from: -6, to: 6 }, duration: 120, yoyo: true, repeat: -1 });
        }
      } else {
        if (e.wasStunned) {
          e.wasStunned = false;
          if (e.wobble) { e.wobble.stop(); e.wobble = null; }
          e.setAngle(0); e.clearTint(); e.anims.resume();
        }
        if (e.x <= e.patrolMin || e.body.blocked.left) e.dirX = 1;
        if (e.x >= e.patrolMax || e.body.blocked.right) e.dirX = -1;
        e.setFlipX(e.dirX < 0);
        e.body.setVelocityX(T.enemySpeed * e.dirX);
      }
    });

    if (this.player.y > 620) this.respawn();

    // janitor: stray coconuts never outlive the screen
    this.coconuts.children.each((c) => { if (c.active && c.y > 700) c.destroy(); });

    this.updateAnim(now, dir, grounded);
    this.updateHUD();
  }

  updateAnim(now, dir, grounded) {
    let name;
    if (this.finished) name = 'm_vic';
    else if (now < this.hitAnimUntil) name = 'm_hit';
    else if (now < this.pootAnimUntil) name = 'm_poot';
    else if (!grounded) name = this.player.body.velocity.y < -40 ? 'm_jump' : 'm_fall';
    else if (dir !== 0) name = 'm_run';
    else name = 'm_idle';
    if (this.curAnim !== name) { this.curAnim = name; this.player.play(name); }
  }

  // ----------------------------------------------------------------- actions
  doJump() {
    const T = window.TUNING;
    this.player.body.setVelocityY(-T.jumpVelocity);
    this.lastJumpPressedAt = -99999;
    this.lastGroundedAt = -99999;
    this.lastLaunch = 'jump';
    window.SFX.jump();
  }

  tryPoot() {
    const T = window.TUNING;
    const now = this.now();
    if (this.finished || this.userPaused) return;
    if (now < this.pootReadyAt) return;
    if (this.charges <= 0) { this.meterFlashUntil = now + 250; return; }

    this.charges -= 1;
    this.pootReadyAt = now + T.pootCooldownMs;
    this.pootAnimUntil = now + 220;

    if (!this.isGrounded()) {
      this.player.body.setVelocityY(-T.pootVertical);
      const dir = this.inputDir() || this.facing;
      this.boostVx = dir * T.pootHorizontal;
      this.lastLaunch = 'poot';
    }
    this.snakes.children.each((e) => {
      if (!e.active) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) <= T.pootStunRadius) {
        this.stunEnemy(e);
      }
    });
    this.beeSwarms.forEach((bees) => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, bees.x, bees.y) <= T.pootStunRadius) {
        const fresh = now >= bees.dispersedUntil;
        bees.dispersedUntil = now + T.beeDisperseMs;
        window.SFX.buzz();
        this.puff(bees.x, bees.y, 0xffd83d, 5);
        if (fresh) { // dispersing pays like a stun — the poot earns its keep
          this.score += 100;
          this.enemyPts += 100;
          this.floatText(bees.x, bees.y - 20, '+100', '#8fdf70');
        }
      }
    });
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
    const falling = this.player.body.velocity.y > 40;
    const above = this.player.body.bottom < e.body.top + 16;
    if (falling && above) {
      // Mario's law, per the grandkids: bouncing works whether or not it's stunned
      this.score += 250;
      this.enemyPts += 250;
      window.SFX.bounce();
      this.puff(e.x, e.y, 0x3f8f3a, 6);
      if (e.wobble) e.wobble.stop();
      e.destroy();
      this.player.body.setVelocityY(-0.6 * window.TUNING.jumpVelocity);
      return;
    }
    if (now < e.stunnedUntil) return; // stunned: harmless from the side
    if (now >= this.invulnUntil) this.takeHit(e.x);
  }

  breakCoconut(c) {
    if (!c.active) return;
    this.puff(c.x, c.y, 0x7a5230, 4);
    window.SFX.coconut();
    c.destroy();
  }

  takeHit(srcX) {
    const T = window.TUNING;
    const now = this.now();
    this.hits += 1;
    this.invulnUntil = now + T.invulnMs;
    this.controlLockUntil = now + 220;
    this.hitAnimUntil = now + 350;

    const away = Math.sign(this.player.x - srcX) || -1;
    this.player.body.setVelocity(away * T.knockbackX, -T.knockbackY);
    this.tweens.add({
      targets: this.player, alpha: 0.25, duration: 80, yoyo: true,
      repeat: Math.floor(T.invulnMs / 160),
      onComplete: () => this.player.setAlpha(1),
    });
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

  collectGolden() {
    if (!this.golden.active) return;
    this.score += 1000;
    this.goldenPts = 1000;
    window.SFX.golden();
    this.puff(this.golden.x, this.golden.y, 0xf2b632, 12);
    this.cameras.main.flash(180, 70, 58, 12);
    this.hitStop(70);
    const t = this.add.text(this.golden.x, this.golden.y - 20, '+1000!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffd83d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    this.goldenGlow.destroy();
    this.goldenSparks.forEach((sp) => sp.destroy());
    this.golden.destroy();
  }

  collectBeans(b) {
    if (!b.active) return;
    const T = window.TUNING;
    if (this.charges < T.pootCharges) this.charges += 1;
    window.SFX.beans();
    this.puff(b.x, b.y, 0x6ab55c, 4);
    b.destroy();
  }

  hitCheckpoint(f) {
    if (f.cpActive) return;
    f.cpActive = true;
    f.setTexture('flag_on');
    this.checkpointX = f.x;
    this.checkpointY = f.y - 20;
    window.SFX.checkpoint();
    this.puff(f.x, f.y - 20, 0x6ab55c, 5);
  }

  respawn() {
    const T = window.TUNING;
    if (this.now() < this.respawnGraceUntil) return;
    this.respawnGraceUntil = this.now() + 400;
    this.player.body.reset(this.checkpointX, this.checkpointY);
    this.boostVx = 0;
    this.charges = T.pootCharges;
    this.invulnUntil = this.now() + 600;
    this.cameras.main.flash(160, 30, 20, 20);
    window.SFX.respawn();
  }

  reachFinish() {
    if (this.finished) return;
    this.finished = true;
    const timeMs = this.tnow;
    const timeBonus = Math.max(0, 5000 - 20 * Math.floor(timeMs / 1000));
    const noHit = this.hits === 0;
    this.score += 500 + timeBonus + (noHit ? 1000 : 0);
    this.player.body.setVelocity(0, 0);
    window.SFX.victory();
    this.puff(this.player.x, this.player.y - 30, 0xffd83d, 10);
    const payload = {
      score: this.score, bananas: this.bananaCount, bananaPts: this.bananaPts,
      enemyPts: this.enemyPts, goldenPts: this.goldenPts,
      timeMs: timeMs, timeBonus: timeBonus, noHit: noHit,
    };
    const go = () => { if (this.scene.isActive('Game')) this.scene.start('Finish', payload); };
    this.time.delayedCall(1100, go);
    this.input.once('pointerdown', go);
  }

  // ------------------------------------------------------------------- feel
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

  floatText(x, y, str, color) {
    const t = this.add.text(x, y, str, {
      fontFamily: 'monospace', fontSize: '22px', color: color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
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

  // -------------------------------------------------------------------- HUD
  createHUD() {
    const style = { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' };
    this.scoreText = this.add.text(16, 10, 'SCORE 0', style).setScrollFactor(0).setDepth(90);
    this.add.image(30, 58, 'banana').setScrollFactor(0).setDepth(90);
    this.bananaText = this.add.text(48, 45, 'x 0', style).setScrollFactor(0).setDepth(90);
    this.cloudIcons = [];
    for (let i = 0; i < 5; i++) {
      this.cloudIcons.push(this.add.image(28 + i * 30, 96, 'cloud').setScrollFactor(0).setDepth(90));
    }
    this.timerText = this.add.text(480, 10, '0:00.0', style).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90);
    this.mutedText = this.add.text(944, 10, 'MUTED', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff8888',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(90);
    this.add.text(944, 34, '(R)estart (Enter)pause (M)ute', {
      fontFamily: 'monospace', fontSize: '12px', color: '#cfe0ee',
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
      if (flashing) c.setTint(0xff6666); else c.clearTint();
    });
    this.mutedText.setVisible(window.SFX.muted);
  }

  // ------------------------------------------------------------------ touch
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
