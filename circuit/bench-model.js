// Original educational electronics bench. All dimensions are schematic.
(() => {
  const mount = document.querySelector("#model-mount");
  const marker = document.querySelector("#marker");
  let T, renderer;
  try {
    T = window.THREE;
    renderer = new T.WebGLRenderer({antialias: true, alpha: false, powerPreference: "low-power"});
  } catch (error) {
    mount.classList.add("fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color(0x142c30);
  scene.fog = new T.Fog(0x142b30, 10.8, 25);
  const camera = new T.OrthographicCamera(-4, 4, 2.5, -2.5, .1, 70);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const mat = (color, metalness = 0, roughness = .55) => new T.MeshStandardMaterial({color, metalness, roughness});
  const metal = mat(0xbec6c8, .64, .27), black = mat(0x243239, .12, .45), rubber = mat(0x20282b, .02, .88);
  const body = new T.Group();
  scene.add(body);
  const picks = [];
  function mesh(geometry, material, x, y, z, parent = body, part) {
    const item = new T.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    if (part) {
      item.userData.part = part;
      picks.push(item);
    }
    return item;
  }
  const box = (w, h, d, m, x, y, z, part) => mesh(new T.BoxGeometry(w, h, d), m, x, y, z, body, part);
  function rounded(w, h, d, r, m, x, y, front, part) {
    const s = new T.Shape(), a = -w / 2, b = -h / 2;
    s.moveTo(a + r, b);
    s.lineTo(-a - r, b);
    s.quadraticCurveTo(-a, b, -a, b + r);
    s.lineTo(-a, -b - r);
    s.quadraticCurveTo(-a, -b, -a - r, -b);
    s.lineTo(a + r, -b);
    s.quadraticCurveTo(a, -b, a, -b - r);
    s.lineTo(a, b + r);
    s.quadraticCurveTo(a, b, a + r, b);
    return mesh(new T.ExtrudeGeometry(s, {depth: d, bevelEnabled: false, curveSegments: 6}), m, x, y, front - d, body, part);
  }
  function cylinder(r1, r2, height, m, x, y, z, part, front = false) {
    const item = mesh(new T.CylinderGeometry(r1, r2, height, 28), m, x, y, z, body, part);
    if (front) item.rotation.x = Math.PI / 2;
    return item;
  }
  function wire(points, radius, material, parent = body, part) {
    const curve = new T.CatmullRomCurve3(points, false, "centripetal");
    return mesh(new T.TubeGeometry(curve, 48, radius, 10, false), material, 0, 0, 0, parent, part);
  }
  function canvasTexture(w, h, draw) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    draw(cv.getContext("2d"), w, h);
    const tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }
  function panel(w, h, texture, x, y, z, flat = false, part) {
    const item = mesh(
        new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: texture, metalness: 0, roughness: .8}), x, y, z, body,
        part);
    if (flat) item.rotation.x = -Math.PI / 2;
    item.castShadow = false;
    return item;
  }
  function letters(ctx, txt, x, y, size, color, weight = 500) {
    ctx.font = weight + " " + size + "px Menlo, Consolas, monospace";
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }
  const hemi = new T.HemisphereLight(0xf1feff, 0xc1c9b7, 1.65);
  scene.add(hemi);
  const key = new T.DirectionalLight(0xfff1dc, 2.65);
  key.position.set(-3, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -5, right: 5, top: 4.5, bottom: -4.5});
  key.shadow.normalBias = .018;
  key.shadow.bias = -.00018;
  scene.add(key);
  const rim = new T.DirectionalLight(0xb5e4ff, 1.2);
  rim.position.set(5, 4, -4);
  scene.add(rim);
  const matMap = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = "#244747";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i <= 512; i += 32) {
      c.strokeStyle = i % 128 === 0 ? "#486764" : "#365552";
      c.lineWidth = i % 128 === 0 ? 1.7 : 1;
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, h);
      c.moveTo(0, i);
      c.lineTo(w, i);
      c.stroke();
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        c.fillStyle = "#516d64";
        c.fillRect(i * 64 - 1, j * 64 - 1, 2, 2);
      }
    }
  });
  matMap.wrapS = matMap.wrapT = T.RepeatWrapping;
  matMap.repeat.set(18, 18);
  panel(65, 65, matMap, 0, -.012, 0, true);
  // Bench power supply. The rendered front panel has its own display and binding posts.
  const sx = -2.14, front = .53;
  for (const x of [sx - .72, sx + .72])
    for (const z of [-1.15, .27]) box(.26, .17, .28, rubber, x, .085, z);
  rounded(2.12, 1.68, 1.9, .12, mat(0xc2cfce, .2, .49), sx, 1.00, front - .055, "supply");
  rounded(2.16, 1.71, .14, .12, mat(0x89999c, .24, .47), sx, 1.00, front, "supply");
  rounded(2.06, 1.60, .045, .09, mat(0xdde0d8, .08, .59), sx, 1.00, front + .015, "supply");
  const face = canvasTexture(960, 740, (c, w, h) => {
    c.fillStyle = "#d9ded8";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#213838";
    c.fillRect(28, 30, 18, 47);
    letters(c, "CIRCUIT LAB", 62, 68, 44, "#2b4242", 700);
    letters(c, "DC POWER SUPPLY", 58, 105, 21, "#49605e");
    letters(c, "VOLTAGE", 710, 166, 23, "#304947", 700);
    letters(c, "CURRENT", 706, 418, 23, "#304947", 700);
    letters(c, "OUTPUT", 330, 508, 23, "#546966", 700);
    letters(c, "+", 222, 539, 44, "#aa3933", 700);
    letters(c, "−", 485, 539, 44, "#2e3d40", 700);
    c.strokeStyle = "#aebcb5";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(58, 470);
    c.lineTo(900, 470);
    c.stroke();
    for (const x of [57, 885])
      for (const y of [30, 682]) {
        c.fillStyle = "#879592";
        c.beginPath();
        c.arc(x, y, 8, 0, 7);
        c.fill();
        c.fillStyle = "#525f5e";
        c.fillRect(x - 4, y - 1, 8, 2);
      }
    letters(c, "DC-05", 724, 674, 23, "#536864", 700);
  });
  panel(1.98, 1.52, face, sx, 1.0, front + .04, false, "supply");
  const display = new T.MeshBasicMaterial();
  const screen = mesh(new T.PlaneGeometry(1.29, .59), display, sx - .27, 1.22, front + .075, body, "supply");
  screen.castShadow = false;
  rounded(1.37, .69, .045, .035, black, sx - .27, 1.22, front + .061, "supply");
  for (const y of [1.35, .93]) {
    cylinder(.184, .19, .12, black, sx + .59, y, front + .10, "supply", true);
    cylinder(.155, .16, .1, mat(0x50605c, .3, .52), sx + .59, y, front + .16, "supply", true);
    const line = box(.015, .09, .005, mat(0xd5e7d5), sx + .59 - .018, y + .063, front + .214, "supply");
    line.rotation.z = -.22;
  }
  for (let i = 0; i < 14; i++) box(.022, .037, 1.05, mat(0x75878a, .1, .53), sx - .71 + i * .107, 1.845, -.45, "supply");
  for (let i = 0; i < 10; i++) box(.012, .055, .50, black, sx + 1.063, .46 + i * .10, -.65, "supply");
  const pinLocations = {p: V(sx - .48, .46, front + .24), n: V(sx + .09, .46, front + .24)};
  for (const [pin, x, col] of [["p", sx - .48, 0xd14e42], ["n", sx + .09, 0x333e41]]) {
    cylinder(.148, .147, .15, mat(col, .08, .43), x, .46, front + .125, "supply", true);
    cylinder(.065, .065, .04, metal, x, .46, front + .21, "supply", true);
    cylinder(.039, .039, .01, black, x, .46, front + .236, "supply", true);
  }
  // A terminal strip with five holes in each connected column on each side of the gutter.
  const bx = 1.30, bz = .42, bw = 4.17, bd = 2.50, top = .238;
  box(bw, .19, bd, mat(0xccd8d2, .04, .67), bx, .12, bz, "board");
  box(bw + .03, .06, bd + .03, mat(0x586861, .16, .7), bx, .033, bz, "board");
  const firstX = -.48, pitch = .147, cols = 25;
  const rows = [-.65, -.50, -.22, -.08, .06, .20, .34, .62, .76, .90, 1.04, 1.18, 1.40, 1.54];
  const boardMap = canvasTexture(1800, 1080, (c, w, h) => {
    const px = x => (x - bx + bw / 2) * w / bw, py = z => (z - bz + bd / 2) * h / bd;
    c.fillStyle = "#e6e8dc";
    c.fillRect(0, 0, w, h);
    for (const [z, col] of [[-.74, "#bf514b"], [-.40, "#5588ae"], [1.30, "#bf514b"], [1.63, "#5588ae"]]) {
      c.fillStyle = col;
      c.fillRect(55, py(z), w - 110, 4);
    }
    c.fillStyle = "#bac5bb";
    c.fillRect(0, py(.43), w, py(.54) - py(.43));
    c.fillStyle = "#cbd3c8";
    c.fillRect(0, py(.46), w, py(.54) - py(.46));
    for (let i = 0; i < cols; i++) {
      let x = px(firstX + i * pitch);
      if (i % 5 === 4 || i === 0) {
        letters(c, String(i + 1), x - 7, py(-.30), 23, "#778278");
      }
      for (let j = 0; j < rows.length; j++) {
        const y = py(rows[j]), side = 16;
        c.fillStyle = "#c4c8b9";
        c.fillRect(x - side / 2 - 2, y - side / 2 - 2, side + 4, side + 5);
        c.fillStyle = "#7b827b";
        c.fillRect(x - side / 2, y - side / 2, side, side);
        c.fillStyle = "#39433f";
        c.fillRect(x - side / 2 + 3, y - side / 2 + 4, side - 6, side - 7);
      }
    }
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].forEach((letter, i) => {
      let y = py(rows[i + 2]) + 6;
      letters(c, letter, 36, y, 20, "#687a70");
      letters(c, letter, w - 48, y, 20, "#687a70");
    });
    for (const z of [-.65, 1.40]) letters(c, "+", 28, py(z) + 9, 30, "#ad4740", 700);
    for (const z of [-.50, 1.54]) letters(c, "−", 28, py(z) + 9, 30, "#3e7192", 700);
  });
  panel(bw, bd, boardMap, bx, top, bz, true, "board");
  const pos = i => firstX + i * pitch, R1 = pos(2), R2 = pos(11), anode = pos(18), cathode = pos(20), rx = (R1 + R2) / 2,
        rz = .62;
  for (const [id, x] of [["r1", R1], ["r2", R2], ["a", anode], ["k", cathode]]) pinLocations[id] = V(x, top + .012, 1.04);
  const silver = mat(0xc1c8c5, .69, .28);
  wire([V(R1, top, rz), V(R1, .51, rz), V(R1 + .06, .60, rz), V(rx - .23, .60, rz)], .017, silver, body, "resistor");
  wire([V(rx + .23, .60, rz), V(R2 - .06, .60, rz), V(R2, .51, rz), V(R2, top, rz)], .017, silver, body, "resistor");
  const resistorBody = mesh(
      new T.LatheGeometry(
          [
            [0, -.34], [.08, -.34], [.126, -.28], [.127, -.19], [.117, -.14], [.117, .15], [.128, .20], [.124, .275],
            [.078, .34], [0, .34]
          ].map(([a, b]) => new T.Vector2(a, b)),
          40),
      mat(0xd2bb81, .10, .44), rx, .6, rz, body, "resistor");
  resistorBody.rotation.z = -Math.PI / 2;
  const bands = [-.233, -.085, .061, .228].map((delta, i) => {
    const r = i === 0 || i === 3 ? .129 : .119;
    const band = cylinder(r, r, .042, mat(i === 3 ? 0xb89436 : 0xb93321, .14, .5), rx + delta, .60, rz, "resistor");
    band.rotation.z = -Math.PI / 2;
    return band;
  });
  const lx = (anode + cathode) / 2, lz = .76;
  for (const [px, dx] of [[anode, -.061], [cathode, .061]])
    wire([V(px, top, lz), V(px, .43, lz), V(lx + dx, .58, lz), V(lx + dx, .64, lz)], .019, silver, body, "led");
  const lens = mat(0xc52720, .15, .20);
  lens.emissive = new T.Color(0xff5130);
  const ledShape = [
    [0, .59], [.176, .59], [.176, .645], [.155, .65], [.155, .845], [.149, .904], [.132, .947], [.10, .985], [.052, 1.011],
    [0, 1.021]
  ];
  mesh(new T.LatheGeometry(ledShape.map(([a, b]) => new T.Vector2(a, b)), 44), lens, lx, 0, lz, body, "led");
  const highlight = mesh(
      new T.SphereGeometry(.04, 16, 10), new T.MeshBasicMaterial({color: 0xffc3ad}), lx - .060, .920, lz + .095, body,
      "led");
  highlight.scale.set(.6, 1.1, .5);
  const haloTex = canvasTexture(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 63);
    g.addColorStop(0, "rgba(255,94,39,.8)");
    g.addColorStop(.32, "rgba(255,65,22,.33)");
    g.addColorStop(1, "rgba(255,43,20,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
  const halo =
      new T.Sprite(new T.SpriteMaterial({map: haloTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending}));
  halo.position.set(lx, .84, lz);
  halo.scale.set(1.9, 1.9, 1);
  body.add(halo);
  const glow = new T.PointLight(0xff4b23, 0, 2.0, 2);
  glow.position.set(lx, .64, lz);
  body.add(glow);
  const wireGroup = new T.Group();
  body.add(wireGroup);
  const centers = {supply: V(sx - .25, 1.25, .66), board: V(bx, top, -.22), resistor: V(rx, .68, rz), led: V(lx, 1.03, lz)};
  let selectedPart = "supply", yaw = .21, pitchAngle = .57, zoom = 1, wiredKey = "", readoutKey = "", enabled = true;
  const raycaster = new T.Raycaster();
  let pending = 0;
  function paint() {
    pending = 0;
    if (!enabled || mount.hidden || !mount.clientWidth) return;
    const w = mount.clientWidth, h = mount.clientHeight, aspect = w / h;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    const halfHeight = Math.max(2.28, 3.72 / aspect) / zoom;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    const center = V(.08, .60, .12), dist = 10;
    camera.position.copy(center).add(
        V(Math.sin(yaw) * Math.cos(pitchAngle) * dist, Math.sin(pitchAngle) * dist,
          Math.cos(yaw) * Math.cos(pitchAngle) * dist));
    camera.lookAt(center);
    renderer.render(scene, camera);
    if (selectedPart) {
      const p = centers[selectedPart].clone().project(camera), x = (p.x + 1) * w / 2, y = (1 - p.y) * h / 2;
      marker.hidden = x < 12 || x > w - 9 || y < 50 || y > h - 30;
      marker.style.left = x + "px";
      marker.style.top = y + "px";
      marker.classList.toggle("left", x > w * .68);
    } else
      marker.hidden = true;
  }
  function draw() {
    if (!pending) pending = requestAnimationFrame(paint);
  }
  function changeZoom(delta) {
    zoom = Math.max(.8, Math.min(1.85, zoom * delta));
    draw();
  }
  function reset() {
    yaw = .21;
    pitchAngle = .57;
    zoom = 1;
    draw();
  }
  function update({connections, resistance, current, powered, part, label, active}) {
    enabled = active;
    selectedPart = part;
    marker.querySelector(".marker-label").textContent = label || "";
    if (!enabled || !part) marker.hidden = true;
    const key = JSON.stringify(connections);
    if (wiredKey !== key) {
      wiredKey = key;
      for (const old of [...wireGroup.children]) {
        old.geometry.dispose();
        old.material.dispose();
        wireGroup.remove(old);
      }
      for (const pair of connections) {
        const order = ["p", "n", "r1", "r2", "a", "k"];
        const [a, b] = [...pair].sort((a, b) => order.indexOf(a) - order.indexOf(b)), P = pinLocations[a],
                  Q = pinLocations[b], supply = a === "p" || a === "n";
        const lane = a === "p" ? 1.68 : 2.05;
        const path = supply ?
            [
              P, V(P.x, P.y, lane - .22), V(P.x + .35, .32, lane + .2), V(Q.x - .17, .43, lane + .2), V(Q.x, .48, Q.z + .14),
              Q
            ] :
            [P, V(P.x, .51, P.z), V((P.x + Q.x) / 2, .70, 1.37), V(Q.x, .51, Q.z), Q];
        const col = a === "p" ? 0xc23d32 : a === "n" ? 0x30404a : 0xd39a3c;
        wire(path, .037, mat(col, .09, .4), wireGroup);
      }
    }
    const digits = String(resistance),
          colors = [0x201e20, 0x764128, 0xc83e31, 0xea8530, 0xe7bc37, 0x528342, 0x467dab, 0x7d519b, 0x919292, 0xd4d8ca];
    [Number(digits[0]), Number(digits[1]), digits.length - 2].forEach(
        (number, i) => bands[i].material.color.setHex(colors[number]));
    halo.visible = current > 0;
    halo.material.opacity = Math.min(.88, current / 15);
    lens.emissiveIntensity = current > 0 ? Math.min(.91, .22 + current / 20) : .02;
    glow.intensity = current > 0 ? Math.min(1.15, current / 11) : 0;
    const displayKey = powered + "-" + current.toFixed(2);
    if (readoutKey !== displayKey) {
      readoutKey = displayKey;
      if (display.map) display.map.dispose();
      display.map = canvasTexture(620, 280, (ctx, w, h) => {
        ctx.fillStyle = "#142c29";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#1e3b33";
        ctx.fillRect(9, 9, w - 18, h - 18);
        letters(ctx, "VOLTAGE", 26, 46, 22, "#89ac96", 600);
        letters(ctx, powered ? "5.00" : "0.00", 23, 139, 94, "#b4f1be", 600);
        letters(ctx, "V", 292, 128, 47, "#9cd9af");
        letters(ctx, powered ? "OUTPUT ON" : "STANDBY", 368, 48, 25, "#c7d997", 650);
        ctx.fillStyle = "#37584a";
        ctx.fillRect(24, 164, w - 48, 2);
        letters(ctx, String(current.toFixed(1)).padStart(4, " "), 25, 236, 54, "#93d9ae", 600);
        letters(ctx, "mA", 184, 229, 28, "#a4d9b2");
        letters(ctx, "DC", 510, 226, 30, "#94b99d");
      });
      display.needsUpdate = true;
    }
    draw();
  }
  const held = new Map();
  let drift = 0, startX = 0, startY = 0, lastGap = 0;
  const gap = () => {
    const [a, b] = [...held.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  mount.addEventListener("pointerdown", e => {
    mount.setPointerCapture(e.pointerId);
    held.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (held.size === 1) {
      drift = 0;
      startX = e.clientX;
      startY = e.clientY;
    } else if (held.size === 2) {
      lastGap = gap();
      drift = 99;
    }
  });
  mount.addEventListener("pointermove", e => {
    const old = held.get(e.pointerId);
    if (!old) return;
    held.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (held.size === 2) {
      const g = gap();
      if (lastGap > 0) changeZoom(g / lastGap);
      lastGap = g;
      return;
    }
    drift = Math.max(drift, Math.hypot(e.clientX - startX, e.clientY - startY));
    yaw -= (e.clientX - old.x) * .007;
    pitchAngle = Math.max(.18, Math.min(1.42, pitchAngle + (e.clientY - old.y) * .006));
    draw();
  });
  mount.addEventListener("pointerup", e => {
    held.delete(e.pointerId);
    if (drift > 5 || held.size || !selectedPart) return;
    const b = mount.getBoundingClientRect();
    raycaster.setFromCamera(
        new T.Vector2((e.clientX - b.left) / b.width * 2 - 1, 1 - (e.clientY - b.top) / b.height * 2), camera);
    const hit = raycaster.intersectObjects(picks)[0];
    if (hit) mount.dispatchEvent(new CustomEvent("benchpick", {detail: hit.object.userData.part}));
  });
  mount.addEventListener("pointercancel", e => held.delete(e.pointerId));
  mount.addEventListener("wheel", e => {
    e.preventDefault();
    changeZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
  }, {passive: false});
  mount.addEventListener("keydown", e => {
    switch (e.key) {
      case "ArrowLeft":
        yaw -= .12;
        break;
      case "ArrowRight":
        yaw += .12;
        break;
      case "ArrowUp":
        pitchAngle = Math.min(1.42, pitchAngle + .11);
        break;
      case "ArrowDown":
        pitchAngle = Math.max(.18, pitchAngle - .11);
        break;
      case "+":
      case "=":
        changeZoom(1.12);
        break;
      case "-":
        changeZoom(1 / 1.12);
        break;
      case "Home":
        reset();
        break;
      default:
        return;
    }
    e.preventDefault();
    draw();
  });
  new ResizeObserver(draw).observe(mount);
  window.benchModel = {update, changeZoom, reset, draw};
})();
