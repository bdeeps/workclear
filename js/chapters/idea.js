// Chapter 1: work and power as quantities.
// Work W = F × d × cos θ: the force times the distance moved along the force (SI unit the joule,
// 1 J = 1 N × 1 m; SI Brochure, BIPM, 9th ed. 2019). Power P = W ÷ t (the watt, 1 W = 1 J/s).
// Three experiments, each with a force–distance graph whose area is the work:
//  - drag: a crate pulled along the floor by a rope at angle θ. Only F cos θ acts along the motion.
//    The upward part, F sin θ, lightens the crate on the floor but moves nothing, so it does no work.
//  - lift: a bucket of water wound up a well at steady speed. The rope pulls up with its weight m g,
//    so W = m g h. "Stop and hold" freezes it halfway: the force stays, the distance stops, the work
//    stops, yet the person holding it still tires (chapter 5 explains why).
//  - spring: stretching a spring, F = k x grows as you go (Hooke's law, see HookeClear), so the graph
//    is a triangle and W = ½ k x². k = 200 N/m, a stiff chest-expander style spring.
// The time slider sets how long the job takes; the model plays it in real time up to 8 s, then speeds up.
import { THREE, M, box, clamp, approach } from '../kit.js';
import {
  G, D2R, board, panelBg, title, axes, dot, COL, HEX, force, makeCoil, makeBucket, stick, looper,
  fitNarrow, reelBoards, homeBoard, inReel, fmtN, fmtJ, fmtW, niceMax,
} from '../work.js';

const LX = 40, SX = 80, S = 1 / 200, K = 200, L0 = 0.7;
const VIEWS = {
  drag: { pos: [3.3, 2.7, 6.2], target: [2.9, 1.25, 0] },
  spring: { pos: [SX + 1.4, 2.0, 4.6], target: [SX + 0.9, 1.15, 0] },
};
const liftView = (D) => ({ pos: [LX + 2.0 + D * 0.3, D * 0.95 + 2.8, 7 + D * 1.3], target: [LX + 0.6, D * 0.78 + 1.2, 0] });
const MODES = { drag: 'Drag a crate', lift: 'Lift a bucket', spring: 'Stretch a spring' };

// The physics of each experiment: working force along the motion at the start and end, distance, work.
export function job(s) {
  if (s.mode === 'lift') { const F = s.m * G; return { F0: F, F1: F, Fall: F, d: s.D, W: F * s.D }; }
  if (s.mode === 'spring') { const F = K * s.x; return { F0: 0, F1: F, Fall: F, d: s.x, W: 0.5 * K * s.x * s.x }; }
  const Fp = s.F * Math.cos(s.th * D2R);
  return { F0: Fp, F1: Fp, Fall: s.F, d: s.d, W: Fp * s.d };
}
const dispDur = (t) => Math.min(t, 8);

export default {
  id: 'idea',
  short: 'Force × distance',
  title: 'Work is force times distance',
  subtitle: 'Pull, lift and stretch, and watch the joules pile up under a graph.',
  view: VIEWS.drag,
  learn: `<p>In physics, <b>work</b> has a precise meaning: you do work on something when you push or pull it <b>and it moves along the direction of your push</b>. Work = <b>force × distance</b>, W = F × d.</p>
    <p>Work is measured in <b>joules</b> (J). One joule is a push of 1 newton over 1 metre: about lifting an apple from the floor onto a table. Drag a crate 5 m with 200 N and you do 1,000 J of work.</p>
    <p>Pull at an <b>angle</b> and only the part of the force along the motion counts: <b>W = F d cos θ</b>. The upward part of a slanting pull moves nothing, so it does no work. And if nothing moves, <b>no work</b> is done at all, however hard you strain.</p>
    <p>Draw the force against the distance and the work is the <b>area under the graph</b>. For a steady force it is a rectangle; for a spring, whose force grows as you stretch it, a triangle, W = ½ k x².</p>
    <p><b>Power</b> is how fast you do work: <b>P = W ÷ t</b>, measured in <b>watts</b> (W). One watt is one joule every second. The same job done in half the time needs twice the power. Work is the energy you hand over, so this is the start of the story in EnergyClear.</p>
    <p class="tip"><b>Try it:</b> raise the rope angle and watch the green arrow and the shaded area shrink. Then lift the bucket, press “stop and hold”, and see the work counter freeze while you still hold the full weight.</p>`,
  terms: [
    { t: 'Work', d: 'Energy handed over by a force that moves something: force × distance moved along the force.' },
    { t: 'Joule (J)', d: 'The unit of work and energy: a force of 1 newton acting over 1 metre.' },
    { t: 'W = F d cos θ', d: 'For a force at angle θ to the motion, only the part F cos θ along the motion does work.' },
    { t: 'Power', d: 'How fast work is done: work ÷ time.' },
    { t: 'Watt (W)', d: 'The unit of power: one joule every second.' },
    { t: 'Force–distance graph', d: 'A plot of force against distance moved. The area under it is the work done.' },
  ],
  defaults: { mode: 'drag', F: 200, th: 0, d: 5, m: 10, D: 6, hold: false, x: 0.6, t: 5 },
  controls: [
    { key: 'mode', type: 'seg', label: 'Experiment', options: Object.entries(MODES).map(([v, label]) => ({ v, label })) },
    { key: 'F', type: 'range', label: 'Crate: pull on the rope', min: 0, max: 400, step: 5, ends: ['0 N', '400 N'], fmt: (v) => v + ' N' },
    { key: 'th', type: 'range', label: 'Crate: rope angle θ', min: 0, max: 85, step: 1, ends: ['flat', 'nearly straight up'], fmt: (v) => v + '°' },
    { key: 'd', type: 'range', label: 'Crate: distance', min: 1, max: 8, step: 0.5, ends: ['1 m', '8 m'], fmt: (v) => v + ' m' },
    { key: 'm', type: 'range', label: 'Bucket: mass with water', min: 2, max: 20, step: 1, ends: ['2 kg', '20 kg'], fmt: (v) => v + ' kg' },
    { key: 'D', type: 'range', label: 'Bucket: depth of the well', min: 2, max: 10, step: 0.5, ends: ['2 m', '10 m'], fmt: (v) => v + ' m' },
    { key: 'hold', type: 'toggle', label: 'Bucket: stop and hold it halfway', hint: 'The force stays. The distance stops.' },
    { key: 'x', type: 'range', label: 'Spring: stretch', min: 0.1, max: 1, step: 0.05, ends: ['10 cm', '1 m'], fmt: (v) => (v * 100).toFixed(0) + ' cm' },
    { key: 't', type: 'range', label: 'Time taken', min: 1, max: 30, step: 0.5, ends: ['1 s', '30 s'], fmt: (v) => v + ' s', hint: 'Same job, less time: more power.' },
    { key: 'go', type: 'buttons', label: 'Try these', items: [
      { label: '200 N for 5 m', act: (s) => Object.assign(s, { mode: 'drag', F: 200, th: 0, d: 5, t: 5 }) },
      { label: 'Same pull at 60°', act: (s) => Object.assign(s, { mode: 'drag', F: 200, th: 60, d: 5, t: 5 }) },
      { label: '10 kg up a 6 m well', act: (s) => Object.assign(s, { mode: 'lift', m: 10, D: 6, hold: false, t: 10 }) },
      { label: 'Just hold it', act: (s) => Object.assign(s, { mode: 'lift', hold: true }) },
    ] },
  ],
  onChange(s, key) {
    if (['F', 'th', 'd'].includes(key)) s.mode = 'drag';
    if (['m', 'D', 'hold'].includes(key)) s.mode = 'lift';
    if (key === 'x') s.mode = 'spring';
  },
  quiz: [
    { q: 'You push a box 4 m across the floor with a steady 50 N. How much work do you do?', options: ['12.5 J', '54 J', '200 J', '2,000 J'], answer: 2, why: 'Work = force × distance = 50 N × 4 m = 200 J.' },
    { q: 'You pull a suitcase 10 m with 100 N along a handle that slants up at 60°. How much work goes into moving it along?', options: ['1,000 J', '500 J', '866 J', '0 J'], answer: 1, why: 'Only the part along the motion counts: 100 × cos 60° = 50 N, and 50 N × 10 m = 500 J. The upward part does no work.' },
    { q: 'A student lifts a 10 kg bucket 2 m in 4 s. What is her power?', options: ['5 W', '49 W', '196 W', '80 W'], answer: 1, why: 'Work = m g h = 10 × 9.81 × 2 ≈ 196 J. Power = 196 J ÷ 4 s ≈ 49 W.' },
  ],
  reel: [
    { ms: 5200, caption: 'Work is force times distance: pull 200 newtons for 5 metres and you do 1,000 joules.', set: { mode: 'drag', F: 200, th: 0, d: 5, t: 4 }, view: { pos: [2.6, 3.9, 6.0], target: [2.6, 2.5, 0] }, spin: 0 },
    { ms: 5200, caption: 'Pull at an angle and only the part along the motion counts: W = F d cos θ.', set: { mode: 'drag', F: 200, d: 5, t: 4 }, anim: { th: [0, 60] }, view: { pos: [2.6, 3.9, 6.0], target: [2.6, 2.5, 0] }, spin: 0 },
    { ms: 5400, caption: 'Hold a bucket still and you do no work on it, however tired your arm gets.', set: { mode: 'lift', m: 10, D: 4, t: 4, hold: true }, view: { pos: [LX + 0.9, 4.9, 4.4], target: [LX + 0.4, 4.1, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gD = new THREE.Group(), gL = new THREE.Group(), gS = new THREE.Group();
    gL.position.x = LX; gS.position.x = SX; root.add(gD, gL, gS);
    const ropeM = M.matte(0xd8c28a), wood = M.matte(0xc8995a, { roughness: 0.7 }), stone = M.matte(0x8c8577), steel = M.metal(0xb9bec8);

    // ================================================================ drag a crate
    const floor = box(10.5, 0.02, 1.8, M.matte(0x3a3f4b)); floor.position.set(4, 0.01, 0); gD.add(floor);
    const tapeC = document.createElement('canvas'); tapeC.width = 2048; tapeC.height = 64;
    { const x = tapeC.getContext('2d'); x.fillStyle = '#f2d24b'; x.fillRect(0, 0, 2048, 64); x.fillStyle = '#222'; x.strokeStyle = '#222'; x.font = 'bold 26px sans-serif';
      for (let c = 0; c <= 90; c++) { const px = (c / 90) * 2048 * (9 / 9); x.lineWidth = c % 10 === 0 ? 4 : 1.5; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c % 10 === 0 ? 34 : c % 5 === 0 ? 24 : 14); x.stroke(); if (c % 10 === 0 && c < 90) x.fillText((c / 10) + ' m', px + 6, 56); } }
    const tapeT = new THREE.CanvasTexture(tapeC); tapeT.colorSpace = THREE.SRGBColorSpace; tapeT.anisotropy = 4;
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.2), new THREE.MeshBasicMaterial({ map: tapeT, toneMapped: false })); tape.rotation.x = -Math.PI / 2; tape.position.set(4.5 - 0.3, 0.025, 0.72); gD.add(tape);
    const trail = box(1, 0.012, 0.5, M.glow(0x5ce1a9, { transparent: true, opacity: 0.45 })); trail.position.y = 0.03; gD.add(trail);
    const crate = new THREE.Group(); gD.add(crate);
    const cb = box(0.6, 0.6, 0.6, wood); cb.position.y = 0.3; crate.add(cb);
    for (const y of [0.08, 0.52]) { const slat = box(0.62, 0.07, 0.62, M.matte(0xa97a42)); slat.position.y = y; crate.add(slat); }
    const rope = stick(0.014, ropeM); gD.add(rope);
    const grip = box(0.06, 0.06, 0.26, M.matte(0x22252c)); gD.add(grip);
    const aF = force(HEX.push, 0.03, 0.14), aPar = force(HEX.acc, 0.036, 0.16), aUp = force(HEX.weight, 0.022, 0.1);
    gD.add(aF, aPar, aUp);
    const lF = stage.label('', [0, 0, 0], gD), lPar = stage.label('', [0, 0, 0], gD, 'hot'), lUp = stage.label('', [0, 0, 0], gD), lD = stage.label('', [0, 0, 0], gD);
    lPar.element.style.setProperty('--c', COL.acc);

    // ================================================================ lift a bucket up a well
    const earth = box(3.2, 1, 2.2, M.clear(0x8a6a48, 0.18)); gL.add(earth);
    const earthTop = box(3.2, 0.04, 2.2, M.matte(0x6e5a3e, { transparent: true, opacity: 0.55, depthWrite: false })); gL.add(earthTop);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 1, true), M.clear(0x6b6458, 0.4)); gL.add(shaft);
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.3, 32), M.plastic(0x2f6fd8, { transparent: true, opacity: 0.75, roughness: 0.1 })); pool.position.y = 0.15; gL.add(pool);
    const top = new THREE.Group(); gL.add(top);
    const wallM = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 32, 1, true), M.matte(0x9b9385, { side: THREE.DoubleSide })); wallM.position.y = 0.35; wallM.castShadow = true; top.add(wallM);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 40), stone); lip.rotation.x = Math.PI / 2; lip.position.y = 0.7; top.add(lip);
    for (const z of [-0.72, 0.72]) { const post = box(0.1, 1.7, 0.1, wood); post.position.set(0, 0.85, z); top.add(post); }
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 20), wood); drum.rotation.x = Math.PI / 2; drum.position.y = 1.4; top.add(drum);
    const crank = new THREE.Group(); crank.position.set(0, 1.4, 0.8); top.add(crank);
    const arm = box(0.05, 0.36, 0.04, steel); arm.position.y = 0.18; crank.add(arm);
    const knob = box(0.05, 0.05, 0.2, M.matte(0x22252c)); knob.position.set(0, 0.36, 0.1); crank.add(knob);
    const bucket = makeBucket(); gL.add(bucket);
    const bRope = stick(0.012, ropeM); gL.add(bRope);
    const aUpL = force(HEX.push, 0.035, 0.16), aWt = force(HEX.weight, 0.035, 0.16); gL.add(aUpL, aWt);
    const lUpL = stage.label('', [0, 0, 0], gL, 'hot'), lWt = stage.label('', [0, 0, 0], gL), lH = stage.label('', [0, 0, 0], gL), lHold = stage.label('', [0, 0, 0], gL, 'hot');
    lUpL.element.style.setProperty('--c', COL.push); lHold.element.style.setProperty('--c', COL.net);
    const hLine = stick(0.008, M.glow(0x5ce1a9)); gL.add(hLine);

    // ================================================================ stretch a spring
    const wallS = box(0.12, 1.4, 1.0, M.matte(0x5b6270)); wallS.position.set(0, 0.8, 0); gS.add(wallS);
    const coil = makeCoil({ turns: 16, R: 0.07, r: 0.009 }); coil.rotation.z = -Math.PI / 2; coil.position.set(0.06, 0.8, 0); gS.add(coil);
    const hook = box(0.05, 0.22, 0.05, steel); gS.add(hook);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 12), M.matte(0x22252c)); handle.rotation.x = Math.PI / 2; gS.add(handle);
    const aSp = force(HEX.push, 0.03, 0.14); gS.add(aSp);
    const lSp = stage.label('', [0, 0, 0], gS, 'hot'); lSp.element.style.setProperty('--c', COL.push);
    const ruler = box(1.2, 0.01, 0.06, M.matte(0xf2d24b)); ruler.position.set(0.06 + L0 + 0.6, 0.35, 0.3); gS.add(ruler);
    const lX = stage.label('', [0, 0, 0], gS);

    // ================================================================ force–distance board
    let cur = null;
    const fd = board(root, 3.0, 1.75, 900, 520, (g, w, h) => {
      panelBg(g, w, h);
      if (!cur) return;
      const { s, J, k, holding } = cur;
      title(g, 'Force–distance graph', 'the area is the work');
      const xMax = niceMax(J.d * 1.05), yMax = niceMax(J.Fall * 1.1);
      const { X, Y } = axes(g, w, h, { x0: 96, y1: 92, xMax, yMax, xTicks: [0, xMax / 4, xMax / 2, (3 * xMax) / 4, xMax], yTicks: [0, yMax / 2, yMax], xFmt: (v) => (+v.toFixed(2)) + ' m', yFmt: (v) => fmtN(v), xLabel: 'distance moved →', yLabel: s.mode === 'drag' ? 'force along the motion, N ↑' : 'force, N ↑' });
      const xs = J.d * k, Fx = J.F0 + (J.F1 - J.F0) * k;
      // shaded area = work done so far
      g.fillStyle = 'rgba(92,225,169,.35)'; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(J.F0)); g.lineTo(X(xs), Y(Fx)); g.lineTo(X(xs), Y(0)); g.closePath(); g.fill();
      // the whole job, outlined
      g.strokeStyle = 'rgba(92,225,169,.9)'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(X(0), Y(J.F0)); g.lineTo(X(J.d), Y(J.F1)); g.lineTo(X(J.d), Y(0)); g.stroke(); g.setLineDash([]);
      g.strokeStyle = COL.acc; g.lineWidth = 5; g.beginPath(); g.moveTo(X(0), Y(J.F0)); g.lineTo(X(xs), Y(Fx)); g.stroke();
      if (s.mode === 'drag' && s.th > 0) {
        g.strokeStyle = COL.push; g.lineWidth = 3; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(X(0), Y(s.F)); g.lineTo(X(J.d), Y(s.F)); g.stroke(); g.setLineDash([]);
        g.fillStyle = COL.push; g.font = '17px sans-serif'; g.fillText(`rope pull ${fmtN(s.F)}`, X(J.d * 0.03), Y(s.F) - 8);
        g.fillStyle = COL.acc; g.fillText(`along the floor: F cos θ = ${fmtN(J.F0)}`, X(J.d * 0.03), Y(J.F0) + (Y(J.F0) - Y(s.F) < 30 ? 24 : -8));
      }
      dot(g, X(xs), Y(Fx), holding ? COL.net : COL.acc, 9);
      const done = s.mode === 'spring' ? 0.5 * K * xs * xs : J.F0 * xs;
      g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif';
      const txt = `${fmtJ(done)}`; const tx = Math.max(X(0) + 10, Math.min(X(xs * 0.5) - g.measureText(txt).width / 2, w - 30 - g.measureText(txt).width));
      g.fillText(txt, tx, Math.min(Y(0) - 16, Y(Math.max(J.F0, J.F1) * 0.35)));
      g.font = '19px sans-serif'; g.fillStyle = holding ? COL.net : 'rgba(255,255,255,.75)';
      const pw = J.W / s.t;
      g.fillText(holding ? 'Holding still: no distance, so no new area and no work.' : `Power = ${fmtJ(J.W)} ÷ ${s.t} s = ${fmtW(pw)}`, 96, 66 + 0);
    }, [0, 0, 0]);

    const L = looper(4, 1.4);
    let mode = '', key = '', Dnow = 6, heldT = 0, crankA = 0, lastD = -1, viewT = 0;
    const place = (s) => {
      if (s.mode === 'drag') homeBoard(fd, [4.6, 2.2, -1.2], -0.12, 1.45);
      else if (s.mode === 'lift') homeBoard(fd, [LX + 2.6 + s.D * 0.3, s.D * 0.5 + 0.9, -1.0], -0.25, 0.75 + s.D * 0.1);
      else homeBoard(fd, [SX + 2.3, 1.55, -0.9], -0.3, 0.75);
    };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lUp, lWt, lH, lX]);
        if (s.mode !== mode) {
          mode = s.mode; L.reset(); heldT = 0;
          gD.visible = mode === 'drag'; gL.visible = mode === 'lift'; gS.visible = mode === 'spring';
          place(s);
          if (!inReel()) { const v = mode === 'lift' ? liftView(s.D) : VIEWS[mode]; stage.setView(v.pos, v.target, 1.0); lastD = s.D; }
        }
        if (mode === 'lift' && s.D !== lastD && !inReel()) { viewT += dt; if (viewT > 0.35) { viewT = 0; lastD = s.D; place(s); const v = liftView(s.D); stage.setView(v.pos, v.target, 0.8); } } else viewT = 0;
        const reelPos = mode === 'drag' ? [2.6, 3.4, -0.3] : mode === 'lift' ? [LX + 0.4, s.D + 2.6, -0.3] : [SX + 0.95, 2.2, -0.3];
        reelBoards([[fd, reelPos, mode === 'lift' ? 0.95 : mode === 'spring' ? 0.62 : 1.75]]);
        const J = job(s);
        const holding = mode === 'lift' && s.hold;
        let k;
        if (holding) { k = approach(L.k, 0.5, 4, dt); L.k = k; heldT += dt; } else { heldT = 0; k = L.tick(dt * (s.t > 8 ? 1 : 1), dispDur(s.t)); }

        if (mode === 'drag') {
          const x = s.d * k, c = Math.cos(s.th * D2R), sn = Math.sin(s.th * D2R);
          crate.position.x = x;
          trail.scale.x = Math.max(0.001, x); trail.position.x = x / 2; trail.visible = x > 0.02;
          const a = [x + 0.3, 0.42, 0], e = [a[0] + 1.3 * c, a[1] + 1.3 * sn, 0];
          rope.between(a, e); grip.position.set(...e); grip.rotation.z = s.th * D2R;
          aF.aim(a, [c, sn, 0], s.F * S);
          aPar.aim([x, 0.95, 0], [1, 0, 0], s.F * c * S);
          aUp.aim([x, 0.95, 0], [0, 1, 0], s.F * sn * S);
          lF.position.set(a[0] + (s.F * S + 0.2) * c, a[1] + (s.F * S + 0.2) * sn + 0.12, 0); lF.element.innerHTML = `pull F <b>${fmtN(s.F)}</b>`; lF.visible = s.F > 1;
          lPar.position.set(x + s.F * c * S * 0.5, 0.78, 0.3); lPar.element.innerHTML = `F cos θ <b>${fmtN(s.F * c)}</b> does work`; lPar.visible = s.F * c > 1;
          lUp.position.set(x - 0.15, 1.1 + s.F * sn * S, 0); lUp.element.innerHTML = `F sin θ ${fmtN(s.F * sn)}: no work`; lUp.visible = !narrow && s.F * sn > 5;
          lD.position.set(x / 2, 0.1, 1.05); lD.element.innerHTML = `moved <b>${x.toFixed(1)} m</b>`;
        }
        if (mode === 'lift') {
          Dnow = s.D;
          earth.scale.y = s.D; earth.position.y = s.D / 2; earthTop.position.y = s.D + 0.02;
          shaft.scale.y = s.D; shaft.position.y = s.D / 2; top.position.y = s.D;
          const y = 0.2 + s.D * k;
          bucket.position.set(0, y, 0);
          bRope.between([0, y + bucket.top, 0], [0, s.D + 1.4 - 0.1, 0]);
          if (!holding && k < 1) crankA += dt * (s.D / dispDur(s.t)) / 0.1;
          crank.rotation.z = -crankA; drum.rotation.y = crankA;
          const W = s.m * G;
          aUpL.aim([0.32, y + 0.3, 0.2], [0, 1, 0], W * S * 2);
          aWt.aim([0.32, y + 0.12, 0.2], [0, -1, 0], W * S * 2);
          lUpL.position.set(0.95, y + 0.55 + W * S, 0.2); lUpL.element.innerHTML = `rope pulls up <b>${fmtN(W)}</b>`;
          lWt.position.set(0.9, y - 0.2, 0.2); lWt.element.innerHTML = `weight m g ${fmtN(W)}`;
          hLine.between([-0.75, 0.2, 0.3], [-0.75, y, 0.3]);
          lH.position.set(-1.2, y / 2 + 0.1, 0.3); lH.element.innerHTML = `raised <b>${(y - 0.2).toFixed(1)} m</b>`;
          lHold.position.set(-1.1, y + 0.9, 0.6); lHold.element.innerHTML = `holding for ${heldT.toFixed(0)} s: work <b>0 J</b>`; lHold.visible = holding;
          bucket.fill(Math.min(1, s.m / 14));
        }
        if (mode === 'spring') {
          const x = s.x * k, len = L0 + x, F = K * x;
          coil.setLength(len);
          hook.position.set(0.06 + len + 0.02, 0.8, 0); handle.position.set(0.06 + len + 0.07, 0.8, 0);
          aSp.aim([0.06 + len + 0.12, 0.8, 0], [1, 0, 0], Math.max(0.001, F * S * 1.5));
          lSp.position.set(0.06 + len + 0.35 + F * S * 1.5, 1.0, 0); lSp.element.innerHTML = `pull = k x = <b>${fmtN(F)}</b>`;
          lX.position.set(0.06 + L0 + x / 2, 0.42, 0.35); lX.element.innerHTML = `stretched ${(x * 100).toFixed(0)} cm`;
        }
        cur = { s, J, k, holding };
        const kk = `${mode}|${s.F}|${s.th}|${s.d}|${s.m}|${s.D}|${s.x}|${s.t}|${holding}|${Math.round(k * 60)}`;
        if (kk !== key) { key = kk; fd.redraw(); }
      },
      readout: (s) => {
        const J = job(s), P = J.W / s.t;
        const tail = `<div class="row"><span>Time taken</span><b>${s.t} s</b></div>
          <div class="row"><span>Power, P = W ÷ t</span><b>${fmtW(P)}</b></div>`;
        if (s.mode === 'lift') {
          if (s.hold) return `<div class="big">Holding still: work = 0 J</div>
            <div class="row"><span>Force on the bucket</span><b>${fmtN(J.F0)}, all the time</b></div>
            <div class="row"><span>Distance moved while holding</span><b>0 m</b></div>
            <div class="row"><span>Work on the bucket, F × 0</span><b>0 J</b></div>
            <div class="row"><span>Power into the bucket</span><b>0 W</b></div>
            <small>Your arm still tires. Muscles burn energy just to keep pulling, and all of it becomes heat, not work. Chapter 5 shows why.</small>`;
          return `<div class="big">Work = m g h = ${fmtJ(J.W)}</div>
            <div class="row"><span>Bucket's weight, m × g</span><b>${s.m} kg × 9.81 = ${fmtN(J.F0)}</b></div>
            <div class="row"><span>Height raised</span><b>${s.D} m</b></div>${tail}
            <small>Lifting at a steady speed, the rope pulls up exactly as hard as gravity pulls down.</small>`;
        }
        if (s.mode === 'spring') return `<div class="big">Work = ½ k x² = ${fmtJ(J.W)}</div>
          <div class="row"><span>Stiffness k</span><b>${K} N/m</b></div>
          <div class="row"><span>Stretch x</span><b>${(s.x * 100).toFixed(0)} cm</b></div>
          <div class="row"><span>Force at the end, k x</span><b>${fmtN(J.F1)}</b></div>
          <div class="row"><span>Average force, ½ k x</span><b>${fmtN(J.F1 / 2)}</b></div>${tail}
          <small>The force grows as you pull, so the graph is a triangle: half of force × distance.</small>`;
        return `<div class="big">Work = F d cos θ = ${fmtJ(J.W)}</div>
          <div class="row"><span>Pull on the rope, F</span><b>${fmtN(s.F)} at ${s.th}°</b></div>
          <div class="row"><span>Along the floor, F cos θ</span><b>${fmtN(J.F0)}</b></div>
          <div class="row"><span>Upwards, F sin θ (no work)</span><b>${fmtN(s.F * Math.sin(s.th * D2R))}</b></div>
          <div class="row"><span>Distance moved, d</span><b>${s.d} m</b></div>${tail}
          ${s.t > 8 ? '<small>The model plays long jobs sped up.</small>' : ''}`;
      },
    };
  },
};
