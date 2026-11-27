/* Original schematic of a fork-mounted reflecting telescope. Three.js is loaded locally. */
(() => {
  'use strict';
  const labels = {tube: '反射式镜筒', mount: '跟踪机架', camera: '科学相机', finder: '导星镜'};
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const TAU = Math.PI * 2;

  function randomSeed(seed) {
    return () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  }

  // A fixed, synthetic blue-hour landscape keeps the instrument legible as it rotates.
  function landscape() {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const {width: w, height: h} = canvas;
    const rng = randomSeed(4295);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    [[0, '#121d37'], [.36, '#2d4261'], [.58, '#61738b'], [.75, '#a39aa0'], [.87, '#7b8190'], [1, '#394458']].forEach(
        ([pos, col]) => sky.addColorStop(pos, col));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    const lastLight = ctx.createRadialGradient(.86 * w, .72 * h, 1, .86 * w, .72 * h, .60 * w);
    lastLight.addColorStop(0, 'rgba(246,171,137,.30)');
    lastLight.addColorStop(1, 'rgba(212,142,111,0)');
    ctx.fillStyle = lastLight;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 440; i++) {
      const x = rng() * w, y = rng() * h * .72, r = .3 + (rng() ** 5) * 1.32;
      ctx.fillStyle = 'rgba(224,235,255,' + ((.16 + rng() * .62) * (1 - y / (h * .76))) + ')';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    const layers = [
      [.67, .072, '#59657b', 17], [.73, .069, '#454f65', 65], [.79, .065, '#333e53', 98], [.865, .082, '#273245', 721],
      [.96, .048, '#1d293a', 6]
    ];
    for (const [base, amplitude, color, seed] of layers) {
      const rand = randomSeed(seed), peaks = [];
      let x = -150;
      while (x < w + 170) {
        peaks.push([x, h * (base - amplitude * rand())]);
        x += 30 + rand() * 135;
      }
      const edge = [];
      for (let i = 0; i < peaks.length - 1; i++) {
        const [x0, y0] = peaks[i], [x1, y1] = peaks[i + 1];
        for (let j = x0; j < x1; j += 3) {
          const f = (j - x0) / (x1 - x0);
          edge.push([
            j,
            y0 + (y1 - y0) * f + (Math.sin(j * .15 + seed) + Math.sin(j * .076)) * 2.2 * Math.sin(f * Math.PI) +
                (rand() - .5) * 1.6
          ]);
        }
      }
      ctx.beginPath();
      ctx.moveTo(-150, h);
      edge.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(w + 150, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Thin ravines interrupted by the near ridges give the skyline a sense of distance.
      ctx.save();
      ctx.clip();
      for (let i = 3; i < edge.length; i += 4) {
        const [px, py] = edge[i], length = 4 + rand() ** 2 * 42;
        ctx.strokeStyle = 'rgba(197,196,201,' + (rand() * .065) + ')';
        ctx.lineWidth = .7 + rand() * 2;
        ctx.beginPath();
        ctx.moveTo(px, py + .2);
        ctx.quadraticCurveTo(px + length * .36, py + length * .42, px + length * .20, py + length);
        ctx.stroke();
      }
      ctx.restore();
    }
    // The concrete observing apron gives the pier a fixed contact surface in the foreground.
    const apron = ctx.createLinearGradient(0, h * .865, 0, h);
    apron.addColorStop(0, '#303b4a');
    apron.addColorStop(.07, '#394352');
    apron.addColorStop(1, '#25303f');
    ctx.beginPath();
    ctx.moveTo(0, h * .91);
    ctx.lineTo(w * .40, h * .865);
    ctx.lineTo(w * .76, h * .875);
    ctx.lineTo(w, h * .915);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = apron;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(194,192,191,.035)' : 'rgba(12,19,26,.10)';
      ctx.fillRect(rng() * w, h * (.865 + rng() * .135), .4 + rng() * 2, .7);
    }
    ctx.strokeStyle = 'rgba(17,24,34,.43)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * .14, h);
    ctx.lineTo(w * .48, h * .87);
    ctx.moveTo(w * .96, h);
    ctx.lineTo(w * .67, h * .87);
    ctx.stroke();
    ctx.restore();
    const vignette = ctx.createRadialGradient(w * .52, h * .47, w * .20, w * .52, h * .47, w * .70);
    vignette.addColorStop(0, 'rgba(9,15,29,0)');
    vignette.addColorStop(1, 'rgba(8,12,26,.47)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    return canvas;
  }

  function buildInstrument(T, scene) {
    const v = (x, y, z) => new T.Vector3(x, y, z);
    const group = (parent) => {
      const g = new T.Group();
      parent.add(g);
      return g;
    };
    const mat = (color, metalness = .25, roughness = .38, opts = {}) =>
        new T.MeshStandardMaterial({color, metalness, roughness, ...opts});
    const enamel = mat(0xdbe0df, .34, .31), white = mat(0xf0efeb, .25, .34);
    const navy = mat(0x293642, .64, .32), grey = mat(0x64737d, .74, .32);
    const steel = mat(0xa9b4b9, .84, .25), black = mat(0x18242b, .42, .37);
    const carbon = mat(0x27343b, .40, .37), copper = mat(0xb77945, .58, .29);
    const red = mat(0xa34d3b, .67, .31), rubber = mat(0x151c22, .06, .76);
    const azure = mat(0x41667a, .6, .24);
    const tubeGroup = group(scene), mount = group(scene);
    const tube = group(tubeGroup), camera = group(tubeGroup), finder = group(tubeGroup);
    tubeGroup.position.set(0, 2.30, 0);
    tubeGroup.rotation.x = .83;
    const pickables = [];
    const groupIds = new Map([[tube, 'tube'], [mount, 'mount'], [camera, 'camera'], [finder, 'finder']]);
    function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
      const item = new T.Mesh(geometry, material);
      item.position.set(x, y, z);
      parent.add(item);
      let root = parent;
      while (root && !groupIds.has(root)) root = root.parent;
      if (root) {
        item.userData.part = groupIds.get(root);
        pickables.push(item);
      }
      return item;
    }
    const cyl = (p, x, y, z, top, bottom, height, material, segments = 64) =>
        mesh(p, new T.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
    const box = (p, x, y, z, w, h, d, m) => mesh(p, new T.BoxGeometry(w, h, d), m, x, y, z);
    function ring(p, x, y, z, outer, inner, height, m) {
      const profile = [
        [inner, -height / 2], [outer - .008, -height / 2], [outer, -height / 2 + .007], [outer, height / 2 - .007],
        [outer - .008, height / 2], [inner, height / 2], [inner, -height / 2]
      ];
      return mesh(p, new T.LatheGeometry(profile.map(([r, l]) => new T.Vector2(r, l)), 80), m, x, y, z);
    }
    function strut(p, a, b, r, m, r2 = r, segments = 12) {
      const start = v(...a), end = v(...b), d = end.clone().sub(start);
      const s = cyl(p, 0, 0, 0, r2, r, d.length(), m, segments);
      s.position.copy(start).lerp(end, .5);
      s.quaternion.setFromUnitVectors(v(0, 1, 0), d.normalize());
      return s;
    }
    function cable(p, points, r, m) {
      const curve = new T.CatmullRomCurve3(points.map(a => v(...a)));
      return mesh(p, new T.TubeGeometry(curve, 40, r, 8, false), m);
    }
    function panel(p, coords, shape, thickness, m, hole) {
      const path = new T.Shape();
      shape.forEach(([z, y], i) => i ? path.lineTo(z, y) : path.moveTo(z, y));
      path.closePath();
      if (hole) {
        const cut = new T.Path();
        hole.forEach(([z, y], i) => i ? cut.lineTo(z, y) : cut.moveTo(z, y));
        cut.closePath();
        path.holes.push(cut);
      }
      const geometry = new T.ExtrudeGeometry(
          path, {depth: thickness, bevelEnabled: true, bevelSegments: 2, bevelSize: .024, bevelThickness: .024, steps: 1});
      geometry.rotateY(-Math.PI / 2);
      return mesh(p, geometry, m, ...coords);
    }
    // Alt-azimuth pier and two cheeks of the elevation fork.
    cyl(mount, 0, .085, 0, .82, .89, .17, grey, 12);
    cyl(mount, 0, .18, 0, .56, .66, .12, navy);
    cyl(mount, 0, .48, 0, .45, .53, .58, enamel, 48);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      cyl(mount, Math.cos(a) * .74, .184, Math.sin(a) * .74, .05, .06, .057, steel, 6);
      const x = Math.cos(a), z = Math.sin(a);
      strut(mount, [.49 * x, .22, .49 * z], [.43 * x, .72, .43 * z], .018, grey);
    }
    cyl(mount, 0, .81, 0, .62, .59, .12, grey);
    cyl(mount, 0, .89, 0, .65, .64, .105, navy);
    cyl(mount, 0, .96, 0, .63, .64, .045, copper);
    cyl(mount, 0, 1.06, 0, .68, .64, .19, enamel);
    box(mount, 0, 1.14, 0, 1.92, .24, .70, enamel);
    const fork =
        [[-.32, 1.12], [.32, 1.12], [.37, 1.38], [.31, 2.33], [.22, 2.50], [-.21, 2.50], [-.31, 2.35], [-.43, 1.38]];
    const slot = [[-.17, 1.48], [-.10, 2.15], [.09, 2.15], [.15, 1.48]];
    for (const sign of [-1, 1]) {
      panel(mount, [sign * .92 + .09, 0, 0], fork, .18, enamel, slot);
      strut(mount, [sign * .73, 2.30, 0], [sign * 1.04, 2.30, 0], .28, grey, .28, 64);
      strut(mount, [sign * 1.05, 2.30, 0], [sign * 1.10, 2.30, 0], .265, navy, .265, 64);
      strut(mount, [sign * 1.101, 2.30, 0], [sign * 1.13, 2.30, 0], .187, steel, .187, 64);
      strut(mount, [sign * 1.132, 2.30, 0], [sign * 1.145, 2.30, 0], .128, navy, .128, 48);
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12, y = 2.30 + .228 * Math.sin(a), z = .228 * Math.cos(a);
        strut(mount, [sign * 1.099, y, z], [sign * 1.113, y, z], .015, steel, .015, 6);
      }
    }
    box(mount, .07, .48, .48, .34, .26, .053, navy);
    for (let i = 0; i < 4; i++) box(mount, .02 + (i - 1.5) * .05, .53, .51, .025, .025, .012, steel);
    box(mount, .06, .443, .513, .19, .021, .012, black);
    // Closed lower cell and lightweight open truss around a Cassegrain light path.
    ring(tube, 0, -.52, 0, .717, .674, 1.14, enamel);
    cyl(tube, 0, -1.12, 0, .735, .65, .17, navy);
    ring(tube, 0, -1.03, 0, .742, .675, .105, grey);
    ring(tube, 0, -.20, 0, .729, .67, .054, steel);
    ring(tube, 0, .038, 0, .744, .663, .11, white);
    ring(tube, 0, .105, 0, .737, .659, .043, navy);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      strut(
          tube, [.717 * Math.cos(a), -.98, .717 * Math.sin(a)], [.717 * Math.cos(a), -.23, .717 * Math.sin(a)], .013, grey);
      const b = a + TAU / 16;
      const lo = [Math.cos(a) * .68, .11, Math.sin(a) * .68], hi = [Math.cos(b) * .70, 1.34, Math.sin(b) * .70];
      strut(tube, lo, hi, .033, carbon);
      strut(tube, [Math.cos(a + TAU / 8) * .68, .11, Math.sin(a + TAU / 8) * .68], hi, .033, carbon);
      strut(tube, [hi[0], 1.31, hi[2]], [hi[0], 1.43, hi[2]], .05, steel);
    }
    ring(tube, 0, 1.43, 0, .762, .640, .20, enamel);
    ring(tube, 0, 1.55, 0, .775, .638, .062, navy);
    ring(tube, 0, 1.326, 0, .770, .651, .055, grey);
    ring(tube, 0, 1.581, 0, .758, .676, .013, steel);
    const mirror = mat(0x8eaec1, .87, .09, {side: T.DoubleSide});
    const dishProfile = [];
    for (let i = 0; i <= 16; i++) {
      const r = .127 + .537 * i / 16;
      dishProfile.push(new T.Vector2(r, .12 * r * r));
    }
    mesh(tube, new T.LatheGeometry(dishProfile, 80), mirror, 0, -.37, 0);
    cyl(tube, 0, -.22, 0, .102, .141, .43, black);
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3 + .23;
      strut(tube, [Math.cos(a) * .68, 1.43, Math.sin(a) * .68], [Math.cos(a) * .11, 1.41, Math.sin(a) * .11], .015, grey);
    }
    cyl(tube, 0, 1.40, 0, .139, .116, .19, navy);
    cyl(tube, 0, 1.50, 0, .121, .139, .027, steel);
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      cyl(tube, .714 * Math.cos(a), 1.588, .714 * Math.sin(a), .015, .020, .010, black, 8);
    }
    // Rear corrector, cooled science detector and flexible service loom.
    cyl(camera, 0, -1.255, 0, .275, .238, .16, grey);
    cyl(camera, 0, -1.37, 0, .235, .232, .080, black);
    cyl(camera, 0, -1.436, 0, .252, .252, .072, copper);
    cyl(camera, 0, -1.566, 0, .218, .204, .21, red);
    cyl(camera, 0, -1.702, 0, .205, .183, .080, navy);
    for (let i = 0; i < 6; i++) ring(camera, 0, -1.47 - .034 * i, 0, .223, .201, .014, black);
    cyl(camera, 0, -1.755, 0, .138, .138, .025, black, 48);
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      cyl(camera, .16 * Math.cos(a), -1.755, .16 * Math.sin(a), .014, .014, .023, steel, 8);
    }
    box(camera, .21, -1.55, 0, .075, .095, .102, steel);
    cable(
        camera, [[.23, -1.55, 0], [.38, -1.60, 0], [.52, -1.47, -.04], [.54, -1.21, -.13], [.57, -1.08, -.225]], .018,
        rubber);
    // A parallel guidescope attached at two stiff mounting rings, with its own guide detector.
    const fx = .42, fz = -.78;
    cyl(finder, fx, .18, fz, .137, .137, 1.08, white);
    cyl(finder, fx, .76, fz, .155, .145, .18, navy);
    ring(finder, fx, .875, fz, .158, .108, .07, grey);
    cyl(finder, fx, .872, fz, .112, .112, .009, azure);
    cyl(finder, fx, -.41, fz, .119, .093, .13, navy);
    cyl(finder, fx, -.527, fz, .088, .089, .11, copper);
    cyl(finder, fx, -.60, fz, .084, .084, .06, black);
    for (const y of [-.16, .47]) {
      strut(finder, [.31, y, -.52], [fx, y, fz], .067, grey);
      ring(finder, fx, y, fz, .155, .129, .083, navy);
    }
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 512;
    textCanvas.height = 128;
    const c = textCanvas.getContext('2d');
    c.fillStyle = '#253746';
    c.font = 'bold 76px Arial';
    c.fillText('ST-01', 16, 85);
    c.fillStyle = '#926644';
    c.fillRect(16, 101, 213, 6);
    const tex = new T.CanvasTexture(textCanvas);
    tex.colorSpace = T.SRGBColorSpace;
    const decal = new T.MeshBasicMaterial(
        {map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: T.DoubleSide});
    for (const a of [Math.PI * .34, Math.PI * 1.34]) {
      const label = mesh(tube, new T.CylinderGeometry(.721, .721, .23, 40, 1, true, a, .92), decal, 0, -.55, 0);
      label.userData.part = 'tube';
    }
    const markers = {
      tube: [tube, v(.55, 1.46, .39)],
      mount: [mount, v(1.13, 2.30, 0)],
      camera: [camera, v(.19, -1.61, .04)],
      finder: [finder, v(fx, .77, fz)]
    };
    function setExpansion(t) {
      tubeGroup.position.y = 2.30 + t * .43;
      camera.position.set(.34 * t, -.35 * t, .34 * t);
      finder.position.set(.54 * t, .14 * t, -.55 * t);
    }
    return {markers, pickables, setExpansion};
  }

  window.createTelescopeViewer = function(host, {onSelect, onFallback} = {}) {
    const T = window.THREE;
    const initialYaw = .98, initialPitch = .23;
    let yaw = initialYaw, pitch = initialPitch, magnification = 1, exploded = false, selected = null;
    let frame = 0, width = 0, height = 0, expansion = 0, prevTime = 0, lost = false;
    let renderer, scene, camera, instrument, picture, backdrop;
    const marker = document.createElement('div');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText =
        'position:absolute;left:0;top:0;width:11px;height:11px;border:1.5px solid white;border-radius:50%;box-shadow:0 0 0 3px #c1a3ff6b,0 1px 6px #181628;pointer-events:none;z-index:1;background:#a48ae2;display:none';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sceneWrap = document.createElement('div');
    sceneWrap.style.cssText =
        'position:absolute;inset:0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none';
    host.append(sceneWrap);
    if (!host.hasAttribute('tabindex')) host.tabIndex = 0;
    if (!host.hasAttribute('aria-label'))
      host.setAttribute('aria-label', '望远镜三维视图。拖动或使用方向键转动，按加减键缩放，Home 键复位。');
    sceneWrap.append(marker);
    const imgPaths = ['../assets/telescope.webp', 'exploded.webp'];
    const fallbackPositions = [
      {tube: [.4098, .3321], mount: [.5723, .4593], camera: [.6223, .6164], finder: [.5238, .2121]},
      {tube: [.4215, .3064], mount: [.5637, .4950], camera: [.6285, .6536], finder: [.5730, .1264]}
    ];
    function fallback() {
      if (lost) return;
      lost = true;
      if (renderer) renderer.domElement.style.display = 'none';
      if (backdrop) backdrop.style.display = 'none';
      picture = document.createElement('img');
      picture.alt = '暮色山脊前的反射式天文望远镜，叉式机架托起镜筒，镜后连接科学相机，侧边装有导星镜。';
      picture.src = imgPaths[Number(exploded)];
      picture.style.cssText = 'width:100%;height:100%;display:block;object-fit:cover;pointer-events:none';
      sceneWrap.prepend(picture);
      host.setAttribute('aria-label', '望远镜静态图。选择组件可查看其位置，加减键缩放，Home 键复位。');
      onFallback?.();
      requestDraw();
    }
    try {
      if (!T) throw new Error('Three.js unavailable');
      renderer = new T.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
      renderer.setClearColor(0, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = .99;
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      backdrop = landscape();
      backdrop.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none';
      backdrop.setAttribute('aria-hidden', 'true');
      sceneWrap.prepend(backdrop);
      sceneWrap.insertBefore(renderer.domElement, marker);
      scene = new T.Scene();
      camera = new T.OrthographicCamera(-4, 4, 3, -3, .1, 40);
      scene.add(new T.HemisphereLight(0xc6ddff, 0x666374, 1.85));
      for (const [color, intensity, pos] of [
               [0xf4dfc8, 3.0, [3, 6, 5]], [0x9bc9ff, 1.14, [-4, 4, 1]], [0xffcbae, 2.40, [1, 3, -5]]]) {
        const light = new T.DirectionalLight(color, intensity);
        light.position.set(...pos);
        scene.add(light);
      }
      // Broad sky illumination and two reflection cards for metal hardware and optical coatings.
      const environment = document.createElement('canvas');
      environment.width = 256;
      environment.height = 128;
      const ec = environment.getContext('2d');
      const eg = ec.createLinearGradient(0, 0, 0, 128);
      [[0, '#8babc9'], [.46, '#c6d3df'], [.51, '#c2b1a6'], [.59, '#4a5360'], [1, '#3b4552']].forEach(
          ([stop, col]) => eg.addColorStop(stop, col));
      ec.fillStyle = eg;
      ec.fillRect(0, 0, 256, 128);
      ec.fillStyle = '#fff5db';
      ec.fillRect(164, 29, 42, 24);
      ec.fillStyle = '#d8eafd';
      ec.fillRect(43, 30, 57, 16);
      const env = new T.CanvasTexture(environment);
      env.mapping = T.EquirectangularReflectionMapping;
      env.colorSpace = T.SRGBColorSpace;
      scene.environment = env;
      instrument = buildInstrument(T, scene);
      const plinth = new T.Mesh(
          new T.CylinderGeometry(1.29, 1.35, .095, 12), new T.MeshStandardMaterial({color: 0x505968, roughness: .85}));
      plinth.position.y = -.052;
      scene.add(plinth);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const ctx = shadowCanvas.getContext('2d'), shadow = ctx.createRadialGradient(128, 128, 15, 128, 128, 127);
      shadow.addColorStop(0, 'rgba(10,15,25,.66)');
      shadow.addColorStop(.45, 'rgba(10,15,25,.44)');
      shadow.addColorStop(1, 'rgba(10,15,25,0)');
      ctx.fillStyle = shadow;
      ctx.fillRect(0, 0, 256, 256);
      const floorShadow = new T.Mesh(
          new T.PlaneGeometry(4, 3.3),
          new T.MeshBasicMaterial({map: new T.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false}));
      floorShadow.rotation.x = -Math.PI / 2;
      floorShadow.position.y = -.104;
      scene.add(floorShadow);
      renderer.domElement.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        fallback();
      });
    } catch {
      fallback();
    }

    function requestDraw() {
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function resize() {
      const rect = sceneWrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!lost && width > 0 && height > 0) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
      }
      requestDraw();
    }
    function placeMarker(x, y) {
      marker.style.display = (selected && x >= 2 && x < width - 2 && y >= 2 && y < height - 2) ? 'block' : 'none';
      marker.style.transform = 'translate(' + Math.round(x - 5) + 'px,' + Math.round(y - 5) + 'px)';
    }
    function imagePoint(id) {
      const [u, v] = fallbackPositions[Number(exploded)][id];
      const scale = Math.max(width / 1280, height / 700) * magnification;
      return [width * .5 + (u - .5) * 1280 * scale, height * .5 + (v - .5) * 700 * scale];
    }
    function positionImage() {
      if (!picture) return;
      picture.style.transform = 'scale(' + magnification + ')';
      if (!selected) return placeMarker(0, 0);
      placeMarker(...imagePoint(selected));
    }
    function draw(now) {
      frame = 0;
      if (!width || !height) return;
      if (lost) {
        positionImage();
        return;
      }
      const target = Number(exploded);
      const elapsed = Math.min(80, Math.max(16, now - prevTime));
      prevTime = now;
      expansion = reduced.matches ? target : expansion + (target - expansion) * (1 - Math.exp(-elapsed / 92));
      if (Math.abs(target - expansion) < .002) expansion = target;
      instrument.setExpansion(expansion);
      const aspect = width / height;
      const halfHeight = Math.max(2.42, 2.22 / aspect) * (1 + expansion * .14) / magnification;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      const cy = 1.87 + .17 * expansion;
      camera.position.set(
          Math.sin(yaw) * Math.cos(pitch) * 10, cy + Math.sin(pitch) * 10, Math.cos(yaw) * Math.cos(pitch) * 10);
      camera.lookAt(0, cy, 0);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      if (selected) {
        const [part, point] = instrument.markers[selected], screen = part.localToWorld(point.clone()).project(camera);
        placeMarker((screen.x + 1) * width * .5, (1 - screen.y) * height * .5);
      } else
        placeMarker(0, 0);
      if (expansion !== target) requestDraw();
    }
    function select(id) {
      selected = Object.hasOwn(labels, id) ? id : null;
      requestDraw();
    }
    function zoom(factor) {
      if (!Number.isFinite(factor) || factor <= 0) return;
      magnification = clamp(magnification * factor, lost ? 1 : .68, 1.85);
      requestDraw();
    }
    function reset() {
      yaw = initialYaw;
      pitch = initialPitch;
      magnification = 1;
      requestDraw();
    }
    function setExploded(on) {
      exploded = Boolean(on);
      if (picture) picture.src = imgPaths[Number(exploded)];
      requestDraw();
    }

    const pointers = new Map();
    let moved = false, startX, startY;
    function span() {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
    sceneWrap.addEventListener('click', e => {
      if (!lost) return;
      const r = sceneWrap.getBoundingClientRect();
      let nearest = null, tolerance = Math.max(22, Math.min(width, height) * .10);
      for (const id of Object.keys(labels)) {
        const [x, y] = imagePoint(id), distance = Math.hypot(e.clientX - r.left - x, e.clientY - r.top - y);
        if (distance < tolerance) {
          nearest = id;
          tolerance = distance;
        }
      }
      if (nearest) {
        select(nearest);
        onSelect?.(nearest);
      }
    });
    sceneWrap.addEventListener('pointerdown', e => {
      if (e.button !== 0 || lost) return;
      if (!pointers.size) {
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
      } else
        moved = true;
      pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
      sceneWrap.setPointerCapture(e.pointerId);
      sceneWrap.style.cursor = 'grabbing';
      host.focus({preventScroll: true});
    });
    sceneWrap.addEventListener('pointermove', e => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y, oldSpan = pointers.size === 2 ? span() : 0;
      p.x = e.clientX;
      p.y = e.clientY;
      if (Math.hypot(p.x - startX, p.y - startY) > 4) moved = true;
      if (pointers.size === 2 && oldSpan > 1) {
        zoom(span() / oldSpan);
        return;
      }
      if (moved && pointers.size === 1) {
        yaw -= dx * .009;
        pitch = clamp(pitch + dy * .006, .02, 1.20);
        requestDraw();
      }
    });
    function release(e) {
      if (!pointers.has(e.pointerId)) return;
      const pick = !moved && pointers.size === 1 && e.type === 'pointerup';
      pointers.delete(e.pointerId);
      if (sceneWrap.hasPointerCapture(e.pointerId)) sceneWrap.releasePointerCapture(e.pointerId);
      if (!pointers.size) sceneWrap.style.cursor = lost ? 'default' : 'grab';
      if (!pick || lost) return;
      const r = sceneWrap.getBoundingClientRect();
      const ray = new T.Raycaster();
      ray.setFromCamera(
          new T.Vector2((e.clientX - r.left) * 2 / r.width - 1, 1 - (e.clientY - r.top) * 2 / r.height), camera);
      const hit = ray.intersectObjects(instrument.pickables, false)[0];
      if (hit) {
        select(hit.object.userData.part);
        onSelect?.(hit.object.userData.part);
      }
    }
    sceneWrap.addEventListener('pointerup', release);
    sceneWrap.addEventListener('pointercancel', release);
    sceneWrap.style.cursor = lost ? 'default' : 'grab';
    sceneWrap.addEventListener('wheel', e => {
      e.preventDefault();
      zoom(Math.exp(-e.deltaY * .0015));
    }, {passive: false});
    host.addEventListener('keydown', e => {
      if (e.key === 'Home')
        reset();
      else if (['+', '='].includes(e.key))
        zoom(1.14);
      else if (['-', '_'].includes(e.key))
        zoom(1 / 1.14);
      else if (e.key === 'ArrowLeft' && !lost)
        yaw -= .13;
      else if (e.key === 'ArrowRight' && !lost)
        yaw += .13;
      else if (e.key === 'ArrowUp' && !lost)
        pitch = clamp(pitch + .10, .02, 1.20);
      else if (e.key === 'ArrowDown' && !lost)
        pitch = clamp(pitch - .10, .02, 1.20);
      else
        return;
      e.preventDefault();
      requestDraw();
    });
    new ResizeObserver(resize).observe(host);
    resize();
    return {select, zoom, reset, setExploded, resize};
  };
})();
