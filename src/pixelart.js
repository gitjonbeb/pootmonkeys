// pixelart.js — ASCII-grid pixel art, rendered to textures at runtime.
// No image files: keeps file:// double-click, Pages, and the standalone
// build all working with zero loaders. Phase 4 palette-swaps reuse these
// grids with per-character palettes.

window.PixelArt = (function () {
  // ---- master palette ----------------------------------------------------
  var PAL = {
    'o': 0x452c12, // outline dark brown
    'b': 0x9c6b3c, // monkey body brown
    'd': 0x7a5230, // shade brown
    'c': 0xeccf9e, // cream muzzle/belly
    'e': 0xffffff, // eye white
    'k': 0x1c1410, // black
    'r': 0xd96a5a, // mouth pink
    'y': 0xffd83d, // banana yellow
    'Y': 0xfff3b0, // banana highlight
    'G': 0xf2b632, // gold
    'g': 0x3f8f3a, // green mid
    'n': 0x2e5d2a, // green dark
    'N': 0x6ab55c, // green light
    'w': 0x8a6236, // wood
    'W': 0x5d3f22, // wood dark
    'u': 0x7ec8ff, // pale blue (wings)
    't': 0x9aa4ad, // grey
    'm': 0x4a3520, // mud dark
    'M': 0x5d442a, // mud light
    'D': 0x6b4a26, // dirt
    'E': 0x8a6a3e, // dirt light speck
    'R': 0xc0392b, // ripe red (flowers)
  };

  // ---- renderer ----------------------------------------------------------
  // Draws grid rows (strings) at integer scale; ragged rows tolerated.
  function render(scene, key, rows, scale, palOverride) {
    if (scene.textures.exists(key)) return;
    var pal = palOverride ? Object.assign({}, PAL, palOverride) : PAL;
    var h = rows.length, w = 0, x, y, ch;
    for (y = 0; y < h; y++) w = Math.max(w, rows[y].length);
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    for (y = 0; y < h; y++) {
      for (x = 0; x < rows[y].length; x++) {
        ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        if (pal[ch] === undefined) continue;
        g.fillStyle(pal[ch]);
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    g.generateTexture(key, w * scale, h * scale);
    g.destroy();
  }

  // Merge a patch grid onto a base grid at (px, py); '.' is transparent.
  function overlay(base, patch, px, py) {
    var out = base.map(function (r) { return r; });
    for (var y = 0; y < patch.length; y++) {
      var ty = py + y;
      if (ty < 0 || ty >= out.length) continue;
      var row = out[ty].split('');
      while (row.length < px + patch[y].length) row.push('.');
      for (var x = 0; x < patch[y].length; x++) {
        if (patch[y][x] !== '.') row[px + x] = patch[y][x];
      }
      out[ty] = row.join('');
    }
    return out;
  }

  // ---- monkey: head (14 rows) + body poses (10 rows) = 20x24 -------------
  var HEAD = [
    '....................',
    '.......oooooo.......',
    '.....oobbbbbboo.....',
    '....obbbbbbbbbbo....',
    '.oo.obbbbbbbbbbbo...',
    'obbookbbbbbbbbbbo...',
    'obcbobbbbboeeoeeo...',
    'obcbobbbbboekoeko...',
    '.oboobbbbboeeoeeo...',
    '..o.obbbboccccccco..',
    '....obbbbocccccccco.',
    '....obbbboccokocco..',
    '.....obbbbocccrco...',
    '......oobbboooooo...',
  ];
  var BODY_STAND = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo..obbbbbbbo......',
    '..oo.obbo.obbo......',
    '...o.obbo.obbo......',
    '.....oddo.oddo......',
    '.....ooo...ooo......',
  ];
  var BODY_BREATHE = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.oo.obbbcccbbbo.....',
    '..o..obbbbbbbo......',
    '..oo.obbo.obbo......',
    '...o.obbo.obbo......',
    '.....oddo.oddo......',
    '.....ooo...ooo......',
  ];
  var BODY_RUN0 = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo..obbbbbbo.......',
    '..o.obbo..obbo......',
    '....obo....obbo.....',
    '...oddo.....oddo....',
    '...oo........ooo....',
  ];
  var BODY_RUN1 = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo..obbbbbbo.......',
    '..o..obbobbo........',
    '.....obbobbo........',
    '.....oddoddo........',
    '......oo.oo.........',
  ];
  var BODY_RUN2 = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo..obbbbbbo.......',
    '..o..obbo.obbo......',
    '....obbo....obo.....',
    '...oddo......oddo...',
    '...oo.........oo....',
  ];
  var BODY_JUMP = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo.obbbbbbbbo......',
    '..o.obbo.obbo.......',
    '....oddo.oddo.......',
    '....oo...oo.........',
    '....................',
  ];
  var BODY_FALL = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo..obbbbbbbo......',
    '..o.obbo...obbo.....',
    '...obbo.....obbo....',
    '...oddo......oddo...',
    '...oo.........oo....',
  ];
  var BODY_SQUAT = [
    '....................',
    '....................',
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbbcccbbbbo....',
    '.oo.obbbbbbbbbo.....',
    '..o.obbboobbbo......',
    '....odddo.oddo......',
    '....ooo...ooo.......',
  ];
  var BODY_HIT = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    '....obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    'o...obbbcccbbbo.....',
    '.oo.obbbbbbbbbo.....',
    '..oobbo.....obbo....',
    '...obo.......obo....',
    '...oddo......oddo...',
    '....oo........oo....',
  ];
  var ARMS_UP = [
    'obo..............obo',
    'obbo............obbo',
    '.obo............obo.',
  ];
  var BODY_CHEER = [
    '.....obbbbbbbbo.....',
    '....obbcccccbbbo....',
    'o...obbcccccbbbo....',
    'oo..obbcccccbbbo....',
    '.o..obbbcccbbbo.....',
    '.oo..obbbbbbbo......',
    '..o..obbo.obbo......',
    '.....obbo.obbo......',
    '.....oddo.oddo......',
    '.....ooo...ooo......',
  ];

  // accessory patches: {g, x, y, head} — head patches ride the head bob
  var PATCHES = {
    headband: { head: true, x: 6, y: 4, g: ['eeeeeeeeee', 'eeeeeeeeee'] },
    chest1:   { head: false, x: 8, y: 15, g: ['kk', '.k', '.k'] },
    tiara:    { head: true, x: 7, y: 0, g: ['.G.G.G', 'GGGGGG'] },
    mask:     { head: true, x: 5, y: 6, g: ['RRRRRReeRee', 'RRRRRRekRek', 'RRRRRReeRee'] },
    ponytail: { head: true, x: 0, y: 1, g: ['...nn', '..nnn', '.nnn.', 'nnn..', '.nn..', '..nn.', '...n.'] },
    stripe:   { head: false, x: 7, y: 16, g: ['ggggg'] },
    pigtails: { head: true, x: 0, y: 2, g: ['.bb', 'Rbb', 'bbb', '.bb'] },
    pigtailR: { head: true, x: 17, y: 2, g: ['bb.', 'bbR', 'bbb', 'bb.'] },
  };

  function monkeyFrames(scene, prefix, scale, pal, patchNames) {
    var names = (patchNames || []).slice();
    if (names.indexOf('pigtails') !== -1) names.push('pigtailR');
    var patchList = names.map(function (n) { return PATCHES[n]; }).filter(Boolean);
    function full(body, headDy) {
      var head = HEAD.map(function (r) { return r; });
      if (headDy === 1) head = [''].concat(head.slice(0, 13));
      var grid = head.concat(body);
      patchList.forEach(function (pt) {
        grid = overlay(grid, pt.g, pt.x, pt.y + (pt.head ? headDy : 0));
      });
      return grid;
    }
    render(scene, prefix + '_idle0', full(BODY_STAND, 0), scale, pal);
    render(scene, prefix + '_idle1', full(BODY_BREATHE, 1), scale, pal);
    render(scene, prefix + '_run0', full(BODY_RUN0, 0), scale, pal);
    render(scene, prefix + '_run1', full(BODY_RUN1, 1), scale, pal);
    render(scene, prefix + '_run2', full(BODY_RUN2, 0), scale, pal);
    render(scene, prefix + '_run3', full(BODY_RUN1, 1), scale, pal);
    render(scene, prefix + '_jump', full(BODY_JUMP, 0), scale, pal);
    render(scene, prefix + '_fall', full(BODY_FALL, 1), scale, pal);
    render(scene, prefix + '_poot0', full(BODY_SQUAT, 1), scale, pal);
    render(scene, prefix + '_poot1', full(BODY_JUMP, 0), scale, pal);
    render(scene, prefix + '_hit', full(BODY_HIT, 0), scale, pal);
    var cheer0 = overlay(full(BODY_CHEER, 0), ARMS_UP, 0, 3);
    var cheer1 = overlay(full(BODY_CHEER, 1), ARMS_UP, 0, 5);
    render(scene, prefix + '_vic0', cheer0, scale, pal);
    render(scene, prefix + '_vic1', cheer1, scale, pal);
  }

  // ---- items --------------------------------------------------------------
  var BANANA = [
    '..oo..........oo',
    '..oWo........oyo',
    '...oyo.......oyo',
    '...oyyo.....oyyo',
    '....oyyo...oyyo.',
    '....oyyyo.oyyyo.',
    '.....oyyyyyyyo..',
    '.....oyYYYyyo...',
    '......oYYYyo....',
    '.......oooo.....',
  ];
  var GOLDEN = BANANA; // same silhouette, gold palette override at render time
  var BEANS = [
    '...oooooooo...',
    '..otttttttto..',
    '.otttttttttto.',
    '.oooooooooooo.',
    '.oRRRRRRRRRRo.',
    '.oeeeeeeeeeeo.',
    '.oeddeddeddeo.',
    '.oeddeddeddeo.',
    '.oeeeeeeeeeeo.',
    '.oRRRRRRRRRRo.',
    '.oooooooooooo.',
    '.otttttttttto.',
    '..oooooooooo..',
  ];
  var COCONUT = [
    '..oooo..',
    '.oddddo.',
    'odWddddo',
    'odddkkdo',
    'odddkkdo',
    'oddddddo',
    '.oddddo.',
    '..oooo..',
  ];
  var BEES0 = [
    '..u..........u..',
    '.uu..oyko..uuu..',
    '..oyko.......u..',
    '......u.oky.....',
    '.oky.uu......u..',
    '......oyko..uu..',
    '..u.........u...',
    '...oyk..oyko....',
  ];
  var BEES1 = [
    '.u...........u..',
    '..u..oyko..u....',
    '..oyko......uu..',
    '.....uu.oky.....',
    '.oky.........u..',
    '.....oyko...u...',
    '.u..........uu..',
    '...oyk..oyko....',
  ];
  var SNAKE0 = [
    '..............ooo...',
    '.oo..........onNno..',
    'onno.oooo...onNeko..',
    'onnoonnnnooonnNnnor.',
    '.onnnnggnnnnnngno.r.',
    '..oooognnooooooo....',
    '......ooo...........',
  ];
  var SNAKE1 = [
    '..............ooo...',
    '.............onNno..',
    '.ooo..oooo..onNeko..',
    'onnnoonnnnoonnNnno..',
    'onggnnnggnnnnngnor..',
    '.oooonnnoooooooo.r..',
    '.....ooo............',
  ];
  var FLAG_OFF = [
    '.tt.......',
    '.ttttttt..',
    '.tttttttt.',
    '.ttttttt..',
    '.tt.......',
    '.tt.......',
    '.tt.......',
    '.tt.......',
    '.tt.......',
    '.tt.......',
  ];
  var FLAG_ON = [
    '.tt.......',
    '.ttNNNNN..',
    '.ttNgNgNN.',
    '.ttNNNNN..',
    '.tt.......',
    '.tt.......',
    '.tt.......',
    '.tt.......',
    '.tt.......',
    '.tt.......',
  ];

  // ---- environment --------------------------------------------------------
  var GRASS = [
    'NgNNgggNNgNNggNNgNgg....',
    'gggnnggnngggnngggnng....',
    'DDDDDDDDDDDDDDDDDDDD....',
    'DDEDDDDEDDDDDEDDDDED....',
    'DDDDDEDDDDEDDDDDDDDD....',
    'DDDDDDDDDDDDDDDEDDDD....',
    'DEDDDDDEDDDDDDDDDDDE....',
    'DDDDEDDDDDDDEDDDDDDD....',
    'DDDDDDDDDDDDDDDDDDDD....',
    'DDDDDDEDDDDDDDDEDDDD....',
    'DDEDDDDDDDEDDDDDDDDD....',
    'DDDDDDDDDDDDDDDDDDDD....',
      'DDDDEDDDDDDDDDDDDDDD....',
    'DDDDDDDDDEDDDDDDDDDD....',
    'DEDDDDDDDDDDDDEDDDDD....',
    'DDDDDDDEDDDDDDDDDDDD....',
    'DDDDEDDDDDDEDDDDDDED....',
    'DDDDDDDDDDDDDDDDDDDD....',
    'DDEDDDDDDDDDDDEDDDDD....',
    'DDDDDDDDEDDDDDDDDDDD....',
    'DDDDDEDDDDDDDDDDDEDD....',
    'DDDDDDDDDDDEDDDDDDDD....',
    'DDDDDDEDDDDDDDDDDDDD....',
    'DDDDDDDDDDDDDDDDDDDD....',
].map(function (r, i) { return r.slice(0, 24).replace(/\./g, i < 2 ? 'g' : 'D'); });
  var MUD = [
    'mmMmmmMMmmmMmmMMmmmMmmMm',
    'mMMmmmmmMMmmmmmMMmmmmMMm',
    'mmmmMmmmmmmMmmmmmmMmmmmm',
    'mmmMMmmmMmmmmMMmmmmmMmmm',
    'mMmmmmmmmMmmmmmmMmmmmmMm',
    'mmmmmMmmmmmmMmmmmmmmMmmm',
    'mmmmmmmmmmmmmmmmmmmmmmmm',
    'mmmmmmmMmmmmmmmmMmmmmmmm',
  ];
  var PALM = [
    '......NNNN..NNNN........',
    '...NNNNnnNNNNnnNNNN.....',
    '.NNnnnnNNNNNNNNnnnnNN...',
    'NNnnN..NNnnnnNN..NnnNN..',
    'Nnn..NNnnNNNNnnNN..nnN..',
    '.....NnnN.WW.NnnN.......',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
      '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwW...........',
    '.........WwwWW..........',
    '........WWwwwWW.........',
];
  var DOOR = [
    '....nnnnnnnnnnnn....',
    '..nnNNNNNNNNNNNNnn..',
    '.nNNNNNNNNNNNNNNNNn.',
    'oWWWWWWWWWWWWWWWWWWo',
    'oWwwwwwwwwwwwwwwwWo.',
    'oWwWWWWWWWWWWWWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWwwwwwwGwwwWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWwwwwwwwwwwWwWo..',
    'oWwWWWWWWWWWWWWwWo..',
    'oWwwwwwwwwwwwwwwWo..',
    'oWWWWWWWWWWWWWWWWWo.',
    'oooooooooooooooooooo',
  ];

  // procedural parallax layer textures
  function parallax(scene) {
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    // far canopy: dark humps on transparent
    g.fillStyle(0x1e3d22);
    for (var i = 0; i < 14; i++) {
      var x = i * 38 + ((i * 53) % 17), r = 26 + ((i * 31) % 22);
      g.fillCircle(x, 250 - ((i * 47) % 60), r);
    }
    g.fillRect(0, 240, 480, 40);
    g.generateTexture('bg_far', 480, 280);
    g.clear();
    // near foliage: lighter shapes lower down
    g.fillStyle(0x2b5230);
    for (var j = 0; j < 10; j++) {
      var x2 = j * 52 + ((j * 29) % 23), r2 = 20 + ((j * 41) % 18);
      g.fillCircle(x2, 268 - ((j * 37) % 34), r2);
    }
    g.fillRect(0, 262, 480, 20);
    g.generateTexture('bg_near', 480, 282);
    g.destroy();
  }

  return {
    render: render, overlay: overlay, monkeyFrames: monkeyFrames, parallax: parallax,
    GRIDS: {
      banana: BANANA, golden: GOLDEN, beans: BEANS, coconut: COCONUT,
      bees0: BEES0, bees1: BEES1, snake0: SNAKE0, snake1: SNAKE1,
      flag_off: FLAG_OFF, flag_on: FLAG_ON,
      grass: GRASS, mud: MUD, palm: PALM, door: DOOR,
    },
  };
})();
