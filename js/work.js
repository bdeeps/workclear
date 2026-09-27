// Shared parts for WorkClear: constants, energy and power formatting, chart boards, arrows that point
// anywhere, a coil spring that can change length, a looping progress timer, and simple models (person,
// car, bucket, rice sack, horse). Chart and arrow helpers follow ForceClear's, so the two boxes look alike.
// Scenes are built in metres unless a chapter says otherwise: +x to the right, +y up, +z towards you.
import { THREE, M, box, beam, sphere, torus, arrow, clamp } from './kit.js';

// ---------------------------------------------------------------- constants
export const G = 9.81;                 // m/s², Earth's surface gravity (standard gravity 9.80665)
export const RHO_AIR = 1.2;            // kg/m³, air at about 20 °C at sea level
export const KMH = 3.6;
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;

export const fmt = (v, d = 1) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-IN') : v.toFixed(d));
// Forces with sensible units: 0.52 N, 18 N, 1,340 N, 7.5 kN, 2.5 MN.
export function fmtN(F, big = 1e4) {
  const a = Math.abs(F), s = F < 0 ? '−' : '';
  if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + ' MN';
  if (a >= big) return s + (a / 1000).toFixed(a >= 1e5 ? 0 : 1) + ' kN';
  if (a >= 100) return s + Math.round(a).toLocaleString('en-IN') + ' N';
  if (a >= 10) return s + a.toFixed(0) + ' N';
  return s + a.toFixed(a >= 1 ? 1 : 2) + ' N';
}

// ---------------------------------------------------------------- boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function title(g, text, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
// Axes with a grid. Returns X(x) and Y(y) for the plot area.
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', log = false }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = log ? (y) => y0 - ((Math.log10(y) - yMin) / (yMax - yMin)) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
// A flat 2D arrow on a canvas from (x, y) by (dx, dy) pixels, with an optional label at its tip.
export function arrow2d(g, x, y, dx, dy, col, label = '', { w = 6, dash = null, head = 16, font = 'bold 19px sans-serif', lx = 8, ly = 0 } = {}) {
  const L = Math.hypot(dx, dy);
  if (L < 2) return;
  const ux = dx / L, uy = dy / L, hl = Math.min(head, L * 0.6);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.setLineDash(dash || []);
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx - ux * hl * 0.8, y + dy - uy * hl * 0.8); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - ux * hl - uy * hl * 0.55, y + dy - uy * hl + ux * hl * 0.55); g.lineTo(x + dx - ux * hl + uy * hl * 0.55, y + dy - uy * hl - ux * hl * 0.55); g.closePath(); g.fill();
  if (label) { g.font = font; g.fillText(label, x + dx + (ux >= -0.3 ? lx : -lx - g.measureText(label).width), y + dy + (uy > 0.3 ? 20 : uy < -0.3 ? -6 : 6) + ly); }
}
export const COL = { push: '#ffb547', pull: '#8ef0ff', net: '#ff5a8a', fric: '#ff7a59', weight: '#c49bff', normal: '#7be08c', acc: '#5ce1a9', soft: 'rgba(255,255,255,.55)' };
export const HEX = { push: 0xffb547, pull: 0x8ef0ff, net: 0xff5a8a, fric: 0xff7a59, weight: 0xc49bff, normal: 0x7be08c, acc: 0x5ce1a9 };

// ---------------------------------------------------------------- stage helpers
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage: hide the minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen. In the tall reel video they move to 'reelPos'.
// A chapter that moves a board between scenes calls homeBoard(b, pos, rotY, scale) to set its wide-screen spot.
export function homeBoard(b, pos, rotY = 0, scale = 1) {
  b.home = { p: new THREE.Vector3(...pos), r: rotY, s: scale };
  if (!inReel()) { b.mesh.position.set(...pos); b.mesh.rotation.set(0, rotY, 0); b.mesh.scale.setScalar(scale); }
}
export function reelBoards(list) {
  const r = inReel();
  list.forEach(([b, pos, scale = 1]) => {
    if (!b.home) b.home = { p: b.mesh.position.clone(), r: b.mesh.rotation.y, s: b.mesh.scale.x };
    if (r) { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); b.mesh.rotation.set(0, 0, 0); }
    else { b.mesh.position.copy(b.home.p); b.mesh.scale.setScalar(b.home.s); b.mesh.rotation.set(0, b.home.r, 0); }
  });
}
// Set a chapter control from code (after dragging, say) so its slider and every readout follow.
export function setControl(label, value) {
  const el = [...document.querySelectorAll('#panel .controls input[type=range]')].find((i) => i.getAttribute('aria-label') === label);
  if (!el) return false;
  el.value = value; el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

// ---------------------------------------------------------------- arrows
// A kit arrow that can point any way: aim(from, dir, len). dir is a unit-ish [x, y, z].
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function force(color, r = 0.035, head = 0.2) {
  const a = arrow(color, 1, head, r);
  a.renderOrder = 10;
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.material.transparent = true; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.03) a.visible = false;
  };
  return a;
}

// ---------------------------------------------------------------- springs and scales
// A helical spring along +Y from its origin. setLength(L) re-shapes the same mesh every frame.
export function makeCoil({ turns = 10, R = 0.05, r = 0.007, mat, seg = 16, rs = 6 } = {}) {
  const N = turns * seg + 1;
  const pos = new Float32Array(N * rs * 3), nor = new Float32Array(N * rs * 3), idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < rs; j++) {
    const a = i * rs + j, b = i * rs + ((j + 1) % rs), c = (i + 1) * rs + j, d = (i + 1) * rs + ((j + 1) % rs);
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat || M.metal(0xc9ced8, { roughness: 0.3 }));
  mesh.castShadow = true; mesh.frustumCulled = false;
  const w = turns * TAU;
  let last = -1;
  mesh.setLength = (L) => {
    L = Math.max(turns * r * 2.05, L);
    if (Math.abs(L - last) < 1e-5) return; last = L;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), th = w * t, c = Math.cos(th), s = Math.sin(th);
      const px = R * c, py = L * t, pz = R * s;
      for (let j = 0; j < rs; j++) {
        const f = (j / rs) * TAU, cf = Math.cos(f), sf = Math.sin(f);
        // ring round the wire: radial direction (c, 0, s) and the axis direction (0, 1, 0)
        const ox = cf * c, oy = sf, oz = cf * s, k = (i * rs + j) * 3;
        pos[k] = px + r * ox; pos[k + 1] = py + r * oy; pos[k + 2] = pz + r * oz;
        nor[k] = ox; nor[k + 1] = oy; nor[k + 2] = oz;
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  };
  mesh.setLength(0.2);
  return mesh;
}

// ---------------------------------------------------------------- people and machines
// A person standing with feet at the origin, facing +x. pose({ arm, lean, stride }).
export function makePerson({ shirt = 0x3b6fd8, pants = 0x2b3242, skin = 0xc68b64, hair = 0x1b1410, s = 1 } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const cloth = M.matte(shirt), jeans = M.matte(pants), sk = M.matte(skin);
  const hipY = 0.92 * s;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * s, 0.38 * s, 6, 14), cloth); torso.position.y = 0.3 * s; torso.scale.z = 1.25; torso.castShadow = true; body.add(torso);
  const head = sphere(0.11 * s, sk, 24); head.position.y = 0.74 * s; body.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.115 * s, 20, 10, 0, Math.PI * 2, 0, 1.3), M.matte(hair)); hairM.position.copy(head.position); hairM.rotation.z = 0.35; body.add(hairM);
  const limb = (len, r, mat) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 4, 10), mat); m.position.y = -len / 2; m.castShadow = true; p.add(m); return p; };
  const arms = [-1, 1].map((z) => { const a = limb(0.62 * s, 0.05 * s, cloth); a.position.set(0, 0.52 * s, z * 0.22 * s); body.add(a); const hand = sphere(0.05 * s, sk, 12); hand.position.y = -0.62 * s; a.add(hand); return a; });
  const legs = [-1, 1].map((z) => { const l = limb(0.88 * s, 0.065 * s, jeans); l.position.set(0, hipY, z * 0.1 * s); g.add(l); const shoe = box(0.22 * s, 0.07 * s, 0.1 * s, M.matte(0x1b1d22)); shoe.position.set(0.05 * s, -0.88 * s, 0); l.add(shoe); return l; });
  body.position.y = hipY;
  g.pose = ({ arm = 0, lean = 0, stride = 0 } = {}) => {
    arms.forEach((a) => { a.rotation.z = arm; });
    body.rotation.z = -lean;
    legs[0].rotation.z = stride; legs[1].rotation.z = -stride;
  };
  g.arms = arms; g.legs = legs; g.body = body;
  return g;
}
// A family hatchback, 4.2 m long, from an extruded side profile. g.paint lets a chapter fade it.
export function makeCar(color = 0xd8332f) {
  const g = new THREE.Group();
  const prof = [[-2.1, 0.3], [2.08, 0.3], [2.12, 0.62], [2.02, 0.82], [1.1, 0.96], [0.35, 1.42], [-1.35, 1.44], [-2.0, 1.05], [-2.12, 0.85]];
  const sh = new THREE.Shape(); prof.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
  const W = 1.72;
  const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 4 });
  geo.translate(0, 0, -W / 2);
  const paint = M.plastic(color, { roughness: 0.3, metalness: 0.3, transparent: true, opacity: 1 });
  const shell = new THREE.Mesh(geo, paint); shell.castShadow = true; g.add(shell);
  const glass = M.plastic(0x0e1420, { roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const side = [[1.02, 1.0], [0.4, 1.36], [-1.28, 1.38], [-1.85, 1.04]];
  const gs = new THREE.Shape(); side.forEach(([x, y], i) => (i ? gs.lineTo(x, y) : gs.moveTo(x, y))); gs.closePath();
  for (const z of [-1, 1]) { const w = new THREE.Mesh(new THREE.ShapeGeometry(gs), glass); w.position.z = z * (W / 2 + 0.07); g.add(w); }
  const wheels = [];
  for (const x of [-1.3, 1.32]) for (const z of [-1, 1]) {
    const t = torus(0.24, 0.085, M.matte(0x16181d), 32); t.position.set(x, 0.32, z * (W / 2 - 0.05)); g.add(t);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 20), M.metal(0xb7bfcc)); rim.rotation.x = Math.PI / 2; t.add(rim);
    const spoke = box(0.36, 0.05, 0.13, M.metal(0x8c95a3)); t.add(spoke);
    wheels.push(t);
  }
  const lamp = box(0.04, 0.1, 0.34, M.glow(0xfff2c8)); for (const z of [-0.6, 0.6]) { const l = lamp.clone(); l.position.set(2.1, 0.74, z); g.add(l); }
  const tail = box(0.04, 0.12, 0.3, M.glow(0xff3b30)); for (const z of [-0.62, 0.62]) { const l = tail.clone(); l.position.set(-2.14, 0.92, z); g.add(l); }
  g.paint = paint; g.shell = shell; g.wheels = wheels; g.W = W; g.tails = [];
  g.roll = (dx) => wheels.forEach((w) => { w.rotation.z -= dx / 0.33; });
  return g;
}
// Many small glowing dots. place(i, x, y, z, s) then done().
export function dots(n, r, color = 0xffffff, seg = 8) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0.8 }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D();
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; };
  return mesh;
}
// Deterministic pseudo-random numbers so every run (and every video frame) looks the same.
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- energy and power
// Work and energy with sensible units: 12 J, 1,000 J, 24.5 kJ, 8.4 MJ.
export function fmtJ(E, big = 1e4) {
  const a = Math.abs(E), s = E < 0 ? '−' : '';
  if (a >= 1e9) return s + (a / 1e9).toFixed(1) + ' GJ';
  if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + ' MJ';
  if (a >= big) return s + (a / 1000).toFixed(a >= 1e5 ? 0 : 1) + ' kJ';
  if (a >= 100) return s + Math.round(a).toLocaleString('en-IN') + ' J';
  if (a >= 10) return s + a.toFixed(0) + ' J';
  return s + a.toFixed(a >= 1 ? 1 : 2) + ' J';
}
// Power: 9 W, 353 W, 1.5 kW, 67 kW, 2.1 MW.
export function fmtW(P) {
  const a = Math.abs(P), s = P < 0 ? '−' : '';
  if (a >= 1e6) return s + (a / 1e6).toFixed(1) + ' MW';
  if (a >= 1e4) return s + (a / 1000).toFixed(0) + ' kW';
  if (a >= 1000) return s + (a / 1000).toFixed(a >= 1e4 ? 0 : 2).replace(/\.?0+$/, '') + ' kW';
  if (a >= 10) return s + Math.round(a) + ' W';
  return s + a.toFixed(1) + ' W';
}
export const rupees = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
export const HP = 745.7;               // W in one mechanical horsepower: 33,000 ft·lbf per minute (Watt, 1783)
export const KWH = 3.6e6;              // J in one kilowatt-hour: 1,000 W × 3,600 s
export const KCAL = 4184;              // J in one food Calorie (kilocalorie, thermochemical)

// Power of people, animals and machines, in watts, for the comparison board.
// Sources: resting metabolism about 80 W (a 2,000 kcal day averages 97 W); a commuter cyclist 100–150 W;
// Bryan Allen held about 300 W for nearly 3 hours flying the Gossamer Albatross (1979); Watt's horse
// 745.7 W; a 750 W mixer grinder (Bajaj, Preethi, Philips spec sheets; see MixerClear); Hero Splendor+
// 5.9 kW and Bajaj Pulsar 150 10.3 kW (maker specs; see MotorcycleClear); a 1.2 L petrol hatchback about
// 90 hp; CarClear's 2.0 L engine about 110 kW.
export const POWERS = [
  { name: 'LED bulb', W: 9 },
  { name: 'you, resting', W: 80 },
  { name: 'cycling to school', W: 120 },
  { name: 'Gossamer Albatross pilot', W: 300 },
  { name: '1 horsepower', W: HP },
  { name: 'mixer grinder', W: 750 },
  { name: 'Splendor motorcycle', W: 5900 },
  { name: 'Pulsar 150', W: 10300 },
  { name: 'hatchback, 90 hp', W: 90 * HP },
  { name: 'CarClear 2.0 L engine', W: 110000 },
];

// A looping clock for "do it, pause, do it again": returns progress 0→1 over dur seconds, then holds 1.
export function looper(dur = 4, pause = 1.4) {
  let t = 0;
  const L = {
    k: 0, speed: 1,
    reset() { t = 0; L.k = 0; },
    tick(dt, d = dur) { t += dt; if (t > d + pause) t = 0; L.k = clamp(t / d, 0, 1); return L.k; },
  };
  return L;
}

// A metal bucket with a handle, about 10 litres; its base sits at the origin. fill(k) sets the water level.
export function makeBucket(color = 0x9aa3b2) {
  const g = new THREE.Group();
  const prof = [[0, 0], [0, 0.1], [0.26, 0.15], [0.265, 0.152]];            // [height, radius]
  const shell = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([y, r]) => new THREE.Vector2(r, y)), 32), M.metal(color, { side: THREE.DoubleSide, roughness: 0.4 }));
  shell.castShadow = true; g.add(shell);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.1, 1, 32), M.plastic(0x3b82f6, { transparent: true, opacity: 0.85, roughness: 0.1 }));
  g.add(water);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.007, 8, 32, Math.PI), M.metal(0x6b7280)); handle.position.y = 0.26; g.add(handle);
  g.fill = (k) => { const h = 0.23 * clamp(k, 0.02, 1); water.scale.y = h; water.position.y = 0.012 + h / 2; };
  g.fill(0.8);
  g.top = 0.41;
  return g;
}

// A jute sack of rice, about 50 kg, sitting on the origin.
export function makeSack(color = 0xd8c28a) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 6, 16), M.matte(color));
  body.scale.set(1, 1, 0.75); body.position.y = 0.34; body.castShadow = true; g.add(body);
  const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.1, 12), M.matte(0xb89c62)); tie.position.y = 0.72; g.add(tie);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 32), M.matte(0x3a6fd8)); band.rotation.x = Math.PI / 2; band.scale.set(1, 0.75, 1); band.position.y = 0.4; g.add(band);
  g.h = 0.77;
  return g;
}

// A stylised horse facing +x, hooves at y = 0, about 1.6 m at the withers. walk(phase) swings its legs.
export function makeHorse(color = 0x8a5a36) {
  const g = new THREE.Group(), coat = M.matte(color), dark = M.matte(0x2a1c14);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 8, 16), coat); body.rotation.z = Math.PI / 2; body.position.y = 1.2; body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 6, 12), coat); neck.position.set(0.72, 1.58, 0); neck.rotation.z = -0.75; neck.castShadow = true; g.add(neck);
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.38, 6, 12), coat); head.position.set(1.0, 1.72, 0); head.rotation.z = -1.95; head.castShadow = true; g.add(head);
  const mane = box(0.5, 0.06, 0.05, dark); mane.position.set(0.62, 1.78, 0); mane.rotation.z = -0.75; g.add(mane);
  for (const z of [-0.07, 0.07]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 8), coat); ear.position.set(0.9, 1.97, z); g.add(ear); }
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.5, 4, 8), dark); tail.position.set(-0.85, 1.05, 0); tail.rotation.z = -0.35; g.add(tail);
  const legs = [];
  for (const [x, z, ph] of [[0.5, -0.17, 0], [0.5, 0.17, Math.PI], [-0.52, -0.17, Math.PI], [-0.52, 0.17, 0]]) {
    const hip = new THREE.Group(); hip.position.set(x, 1.05, z); g.add(hip);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.86, 4, 10), coat); leg.position.y = -0.5; leg.castShadow = true; hip.add(leg);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.08, 12), dark); hoof.position.y = -1.01; hip.add(hoof);
    legs.push([hip, ph]);
  }
  g.walk = (p) => legs.forEach(([hip, ph]) => { hip.rotation.z = 0.35 * Math.sin(p + ph); });
  return g;
}

// A rope or rod that can be re-aimed every frame: between([x,y,z], [x,y,z]).
export function stick(r, mat, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, seg), mat);
  m.castShadow = true;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  m.between = (a, b) => {
    A.set(...a); B.set(...b);
    const L = A.distanceTo(B); m.visible = L > 1e-3; if (!m.visible) return;
    m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, L, 1);
    m.quaternion.setFromUnitVectors(Y, B.sub(A).normalize());
  };
  return m;
}
// A round number at or above v for a chart axis: 1, 2, 2.5, 5 × 10ⁿ.
export function niceMax(v) {
  v = Math.max(1e-9, v); const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= v * 0.999) return k * p;
  return 10 * p;
}

export { clamp, THREE, M, box, beam, sphere, torus };
