// Chapter 3: simple machines trade force for distance.
// Every machine here lifts the same sack by h = 0.5 m, so the work out is always m g h. With no friction,
// work in = work out, so F_in × d_in = m g h: a smaller force must move further (Galileo, Le Mecaniche,
// c. 1600). Friction is folded into one efficiency η = work out ÷ work in, so F_in = m g h ÷ (η d_in).
//  - lever: load arm 0.5 m, effort arm = ratio × 0.5 m. The plank turns ±30°, so the load rises
//    2 × 0.5 × sin 30° = 0.5 m and the effort end moves ratio times as far.
//  - pulley block (block and tackle): n rope strands hold the lower block, so each carries m g ÷ n and
//    the free end must be pulled n × h. The free end runs round a foot pulley so you pull sideways.
//  - ramp: a slope of length L up to a 0.5 m step: push m g h ÷ L along it (the rest of the weight is
//    held by the ramp, which does no work because it does not move).
// Reference efficiencies (typical, rounded): bicycle chain 95–98% (see CycleClear); electric car motor and
// inverter about 90% (CarClear models 88% battery to wheel); universal motor in a mixer about 65%
// (MixerClear); petrol car engine about 30% at its best (CarClear); human muscle about 25% (gross
// efficiency in cycling, e.g. Ettema & Lorås 2009).
import { THREE, M, box, beam, clamp } from '../kit.js';
import {
  G, D2R, board, panelBg, title, axes, COL, HEX, force, makeSack, makePerson, stick, looper,
  fitNarrow, reelBoards, homeBoard, inReel, fmtN, fmtJ,
} from '../work.js';

const PX = 30, RX = 60, H = 0.5, ARM = 0.5, S = 1 / 500;
const VIEWS = {
  lever: { pos: [1.3, 2.3, 6.4], target: [1.2, 1.35, 0] },
  pulley: { pos: [PX + 1.4, 2.7, 7.6], target: [PX + 1.3, 2.0, 0] },
  ramp: { pos: [RX + 0.5, 2.0, 5.6], target: [RX + 0.2, 1.15, 0] },
};
const REFS = [
  { name: 'bicycle chain', e: 0.97 },
  { name: 'EV motor', e: 0.9 },
  { name: 'mixer motor', e: 0.65 },
  { name: 'petrol engine', e: 0.3 },
  { name: 'your muscles', e: 0.25 },
];

// Distance your hand moves for the chosen machine, in metres.
export function machine(s) {
  const Wout = s.m * G * H, eta = s.eta / 100;
  const din = s.focus === 'lever' ? s.ratio * H : s.focus === 'pulley' ? s.ropes * H : s.L;
  const Fin = Wout / (eta * din), Win = Fin * din;
  return { Wout, Win, Fin, din, lost: Win - Wout, MA: (s.m * G) / Fin, eta };
}

export default {
  id: 'machines',
  short: 'Machines',
  title: 'Machines trade force for distance',
  subtitle: 'Levers, pulleys and ramps make the push smaller, never the work.',
  view: VIEWS.lever,
  learn: `<p>A <b>simple machine</b> lets a small force do a big job. But it can’t make work out of nothing. If it halves the force you need, you must push <b>twice as far</b>. With no friction, <b>work in = work out</b>: F<sub>in</sub> × d<sub>in</sub> = F<sub>out</sub> × d<sub>out</sub>. Galileo spelled this out around 1600: what you gain in force, you lose in distance.</p>
    <p>A <b>lever</b> with a long handle lets you lift a sack with a fraction of its weight, but your end swings much further. A <b>pulley block</b> hangs the load on several strands of rope, so each carries a share, and you pull out that many times more rope. A <b>ramp</b> lets you push a load up gradually instead of lifting it straight. Bicycle <b>gears</b> do the same: a low gear makes hills easier by making you pedal more turns (see CycleClear).</p>
    <p>The force a machine multiplies by is its <b>mechanical advantage</b>. Real machines lose some work to <b>friction</b>, which ends up as heat. <b>Efficiency</b> = useful work out ÷ work in. A bicycle chain is about 97% efficient and an electric car’s motor about 90%, but a petrol engine turns only about 30% of its fuel into work (see CarClear). That lost energy is not destroyed: it heats things up, as EnergyClear shows.</p>
    <p class="tip"><b>Try it:</b> lengthen the lever and watch your force shrink while your hand moves further. The two rectangles on the board always have the same area. Then add friction and watch your rectangle grow bigger than the job.</p>`,
  terms: [
    { t: 'Simple machine', d: 'A lever, pulley, ramp, wedge, wheel and axle or screw: a device that changes the size or direction of a force.' },
    { t: 'Mechanical advantage', d: 'Load ÷ effort: how many times a machine multiplies your force.' },
    { t: 'Work in = work out', d: 'An ideal machine cannot make work. Less force always means more distance.' },
    { t: 'Efficiency', d: 'Useful work out ÷ work in, as a percentage. The rest is lost, mostly as heat.' },
    { t: 'Friction', d: 'Rubbing that turns some of the work you put in into heat instead of useful work.' },
  ],
  defaults: { focus: 'lever', m: 50, ratio: 4, ropes: 4, L: 2, eta: 100 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Machine', options: [{ v: 'lever', label: 'Lever' }, { v: 'pulley', label: 'Pulley block' }, { v: 'ramp', label: 'Ramp' }] },
    { key: 'm', type: 'range', label: 'Sack of rice', min: 10, max: 100, step: 5, ends: ['10 kg', '100 kg'], fmt: (v) => v + ' kg', hint: 'Every machine lifts it 0.5 m.' },
    { key: 'ratio', type: 'range', label: 'Lever: handle ÷ load arm', min: 1, max: 6, step: 0.5, ends: ['1 : 1', '6 : 1'], fmt: (v) => v + ' : 1' },
    { key: 'ropes', type: 'seg', label: 'Pulley: strands holding the load', options: [1, 2, 3, 4, 6].map((v) => ({ v, label: String(v) })) },
    { key: 'L', type: 'range', label: 'Ramp: length', min: 0.6, max: 4, step: 0.1, ends: ['0.6 m, steep', '4 m, gentle'], fmt: (v) => v.toFixed(1) + ' m' },
    { key: 'eta', type: 'range', label: 'Efficiency (friction)', min: 50, max: 100, step: 1, ends: ['50%, rusty', '100%, ideal'], fmt: (v) => v + '%' },
    { key: 'go', type: 'buttons', label: 'Try these', items: [
      { label: 'No machine', act: (s) => Object.assign(s, { focus: 'pulley', ropes: 1, eta: 100 }) },
      { label: 'Crowbar, 6 : 1', act: (s) => Object.assign(s, { focus: 'lever', ratio: 6, eta: 100 }) },
      { label: 'Real pulley block', act: (s) => Object.assign(s, { focus: 'pulley', ropes: 4, eta: 80 }) },
      { label: 'Long ramp', act: (s) => Object.assign(s, { focus: 'ramp', L: 4, eta: 90 }) },
    ] },
  ],
  onChange(s, key) {
    if (key === 'ratio') s.focus = 'lever';
    if (key === 'ropes') s.focus = 'pulley';
    if (key === 'L') s.focus = 'ramp';
  },
  quiz: [
    { q: 'A pulley block has 4 strands holding a 400 N load. With no friction, how hard must you pull, and how much rope do you pull to lift it 1 m?', options: ['400 N, 1 m', '100 N, 4 m', '100 N, 1 m', '1,600 N, 0.25 m'], answer: 1, why: 'Each strand carries a quarter: 100 N. But all four strands must shorten by 1 m, so you pull out 4 m of rope. 100 N × 4 m = 400 N × 1 m.' },
    { q: 'Why can’t any machine give out more work than you put in?', options: ['Machines are too heavy', 'Energy can’t be created: work in = work out, minus friction', 'Friction adds extra work', 'It can, with enough gears'], answer: 1, why: 'Work is energy handed over, and energy is conserved. The best a machine can do is pass all of it on; friction always takes a little as heat.' },
    { q: 'A petrol engine is about 30% efficient. Out of 100 J of fuel energy, how much becomes work?', options: ['30 J', '70 J', '100 J', '130 J'], answer: 0, why: 'Efficiency = work out ÷ energy in, so 30% of 100 J is 30 J. The other 70 J leaves as heat in the exhaust and the radiator.' },
  ],
  reel: [
    { ms: 5600, caption: 'A lever trades force for distance: push a fifth as hard, but five times as far.', set: { focus: 'lever', m: 50, eta: 100 }, anim: { ratio: [1, 5] }, view: { pos: [1.4, 2.8, 3.6], target: [1.2, 2.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gL = new THREE.Group(), gP = new THREE.Group(), gR = new THREE.Group();
    gP.position.x = PX; gR.position.x = RX; root.add(gL, gP, gR);
    const wood = M.matte(0xc8995a, { roughness: 0.7 }), steel = M.metal(0x9aa3b2), ropeM = M.matte(0xd8c28a), dark = M.matte(0x3a3f4b);
    const step = (g, x, w) => { const b = box(w, H, 1.0, M.matte(0x6b7280)); b.position.set(x, H / 2, -0.1); g.add(b); return b; };

    // ================================================================ lever
    const PIV = [0, 0.55, 0];
    const fulcrum = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.3, 0.5, 3), dark); fulcrum.rotation.y = Math.PI / 6; fulcrum.position.set(0, 0.25, 0); gL.add(fulcrum);
    const plank = new THREE.Group(); plank.position.set(...PIV); gL.add(plank);
    const board3 = box(1, 0.06, 0.3, wood); plank.add(board3);
    const sackL = makeSack(); sackL.scale.setScalar(0.8); plank.add(sackL);
    const aEffL = force(HEX.push, 0.03, 0.14), aLoadL = force(HEX.weight, 0.03, 0.14); gL.add(aEffL, aLoadL);
    const lEffL = stage.label('', [0, 0, 0], gL, 'hot'), lLoadL = stage.label('', [0, 0, 0], gL), lArm = stage.label('', [0, 0, 0], gL);
    lEffL.element.style.setProperty('--c', COL.push);
    const trackL = stick(0.012, M.glow(0xffb547, { transparent: true, opacity: 0.6 })); gL.add(trackL);

    // ================================================================ pulley block
    for (const x of [-0.9, 0.9]) { const p = box(0.1, 3.1, 0.1, M.matte(0x5b6270)); p.position.set(x, 1.55, 0); gP.add(p); }
    const beamTop = box(2.0, 0.12, 0.14, M.matte(0x5b6270)); beamTop.position.set(0, 3.1, 0); gP.add(beamTop);
    const upper = box(0.44, 0.22, 0.16, steel); upper.position.set(0, 2.82, 0); gP.add(upper);
    const hookU = stick(0.015, steel); hookU.between([0, 2.93, 0], [0, 3.05, 0]); gP.add(hookU);
    const lower = box(0.44, 0.2, 0.16, steel); gP.add(lower);
    const sackP = makeSack(); gP.add(sackP);
    const strands = Array.from({ length: 6 }, () => { const r = stick(0.011, ropeM); gP.add(r); return r; });
    const freeA = stick(0.011, ropeM), freeB = stick(0.011, ropeM); gP.add(freeA, freeB);
    const foot = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 20), steel); foot.position.set(0.9, 0.12, 0.12); gP.add(foot);
    const puller = makePerson({ shirt: 0x7a4fd8, s: 0.95 }); gP.add(puller);
    const aEffP = force(HEX.push, 0.03, 0.14), aLoadP = force(HEX.weight, 0.03, 0.14); gP.add(aEffP, aLoadP);
    const lEffP = stage.label('', [0, 0, 0], gP, 'hot'), lLoadP = stage.label('', [0, 0, 0], gP), lRope = stage.label('', [0, 0, 0], gP);
    lEffP.element.style.setProperty('--c', COL.push);
    const pulled = box(1, 0.012, 0.12, M.glow(0xffb547, { transparent: true, opacity: 0.5 })); gP.add(pulled);

    // ================================================================ ramp
    let rampMesh = null, rampL = -1;
    const topStep = step(gR, 0, 0.9);
    const sackR = makeSack(); gR.add(sackR);
    const aEffR = force(HEX.push, 0.03, 0.14), aLoadR = force(HEX.weight, 0.03, 0.14); gR.add(aEffR, aLoadR);
    const lEffR = stage.label('', [0, 0, 0], gR, 'hot'), lLoadR = stage.label('', [0, 0, 0], gR), lSlope = stage.label('', [0, 0, 0], gR);
    lEffR.element.style.setProperty('--c', COL.push);
    const buildRamp = (L) => {
      if (rampMesh) { gR.remove(rampMesh); rampMesh.geometry.dispose(); }
      const run = Math.sqrt(Math.max(0.01, L * L - H * H));
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(run, 0); sh.lineTo(run, H); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: false }); geo.translate(-run, 0, -0.4);
      rampMesh = new THREE.Mesh(geo, M.matte(0xa97a42, { roughness: 0.8 })); rampMesh.castShadow = true; rampMesh.receiveShadow = true; gR.add(rampMesh);
      topStep.position.x = 0.45; rampL = L;
      return run;
    };
    let run = buildRamp(2);

    // ================================================================ board: same area, and efficiency
    let cur = null;
    const bd = board(root, 3.4, 1.6, 1100, 520, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      const { s, r } = cur;
      title(g, 'Work in = work out', 'the areas match, unless friction steals some');
      const Fw = s.m * G, xMax = Math.max(1, Math.ceil(r.din + 0.2)), yMax = Math.ceil((Fw * 1.1) / 100) * 100;
      const { X, Y } = axes(g, w, h, { x0: 100, x1: 640, y1: 90, xMax, yMax, xTicks: Array.from({ length: xMax + 1 }, (_, i) => i), yTicks: [0, yMax / 2, yMax], xFmt: (v) => v + ' m', yFmt: (v) => fmtN(v), xLabel: 'distance moved →', yLabel: 'force ↑' });
      // lifting straight up: tall, thin
      g.fillStyle = 'rgba(196,155,255,.45)'; g.fillRect(X(0), Y(Fw), X(H) - X(0), Y(0) - Y(Fw));
      g.strokeStyle = COL.weight; g.lineWidth = 3; g.strokeRect(X(0), Y(Fw), X(H) - X(0), Y(0) - Y(Fw));
      // with the machine: short, wide (useful part, then friction)
      const Fuse = r.Wout / r.din;
      g.fillStyle = 'rgba(255,181,71,.45)'; g.fillRect(X(0), Y(Fuse), X(r.din) - X(0), Y(0) - Y(Fuse));
      if (r.lost > 1) { g.fillStyle = 'rgba(255,90,90,.5)'; g.fillRect(X(0), Y(r.Fin), X(r.din) - X(0), Y(Fuse) - Y(r.Fin)); }
      g.strokeStyle = COL.push; g.lineWidth = 3; g.strokeRect(X(0), Y(r.Fin), X(r.din) - X(0), Y(0) - Y(r.Fin));
      g.font = 'bold 18px sans-serif'; g.fillStyle = COL.weight; g.fillText(`lift straight up: ${fmtN(Fw)} × ${H} m`, X(H) + 10, Y(Fw) + 20);
      g.fillStyle = COL.push; g.fillText(`with the machine: ${fmtN(r.Fin)} × ${r.din.toFixed(1)} m`, Math.min(X(r.din * 0.1), X(H) + 10), Math.max(Y(r.Fin) - 10, Y(Fw) + 48));
      g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.fillText(`job: ${fmtJ(r.Wout)}`, 110, h - 90);
      if (r.lost > 1) { g.fillStyle = '#ff8a8a'; g.font = '18px sans-serif'; g.fillText(`+ ${fmtJ(r.lost)} lost to friction`, 110, h - 70 + 0); }
      // efficiency bars
      const bx = 700, bw = w - bx - 30;
      g.fillStyle = 'rgba(255,255,255,.8)'; g.font = 'bold 20px sans-serif'; g.fillText('Efficiency: work out ÷ energy in', bx, 92);
      const rows = [{ name: 'this machine', e: r.eta, me: true }, ...REFS];
      rows.forEach((it, i) => {
        const y = 118 + i * 58;
        g.fillStyle = it.me ? COL.push : 'rgba(255,255,255,.7)'; g.font = (it.me ? 'bold ' : '') + '17px sans-serif'; g.fillText(it.name, bx, y + 16);
        g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(bx, y + 24, bw, 18);
        g.fillStyle = it.me ? COL.push : 'rgba(92,225,169,.8)'; g.fillRect(bx, y + 24, bw * it.e, 18);
        g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.fillText(Math.round(it.e * 100) + '%', bx + bw - 44, y + 16);
      });
    }, [0, 0, 0]);

    const Lp = looper(3.6, 1.2);
    let focus = '', key = '';
    const placeBoard = () => {
      const p = { lever: [2.7, 2.55, -1.6], pulley: [PX + 2.4, 3.35, -1.6], ramp: [RX + 1.3, 2.05, -1.5] }[focus];
      homeBoard(bd, p, -0.1, focus === 'pulley' ? 0.95 : 0.8);
    };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lLoadL, lLoadP, lLoadR, lArm, lRope, lSlope]);
        if (s.focus !== focus) {
          focus = s.focus; Lp.reset();
          gL.visible = focus === 'lever'; gP.visible = focus === 'pulley'; gR.visible = focus === 'ramp';
          placeBoard();
          if (!inReel()) { const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); }
        }
        reelBoards([[bd, { lever: [1.2, 3.5, -1.0], pulley: [PX + 0.6, 4.3, -1.0], ramp: [RX + 0.8, 2.9, -1.0] }[focus], 1.05]]);
        const r = machine(s), k = Lp.tick(dt), Fw = s.m * G;
        const sc = Math.cbrt(s.m / 50);

        if (focus === 'lever') {
          const b = s.ratio * ARM, a0 = 30 * D2R, phi = a0 - 2 * a0 * k;       // +30° (load end down) → −30°
          plank.rotation.z = phi;
          board3.scale.x = ARM + b + 0.25; board3.position.x = (b - ARM) / 2;
          sackL.scale.setScalar(0.75 * sc); sackL.position.set(-ARM, 0.03, 0);
          const c = Math.cos(phi), sn = Math.sin(phi);
          const eff = [PIV[0] + b * c, PIV[1] + b * sn, 0], load = [PIV[0] - ARM * c, PIV[1] - ARM * sn, 0];
          aEffL.aim([eff[0], eff[1] + 0.08 + r.Fin * S, 0.2], [0, -1, 0], r.Fin * S);
          aLoadL.aim([load[0], load[1] + 0.2, 0.3], [0, -1, 0], Fw * S);
          const e0 = PIV[1] + b * Math.sin(a0), e1 = PIV[1] - b * Math.sin(a0);
          trackL.between([eff[0] + 0.12, e0, 0.25], [eff[0] + 0.12, eff[1], 0.25]);
          lEffL.position.set(eff[0] + 0.2, eff[1] + 0.3 + r.Fin * S, 0.2); lEffL.element.innerHTML = `you push <b>${fmtN(r.Fin)}</b>`;
          lLoadL.position.set(load[0] - 0.4, load[1] + 0.9 * sc, 0.2); lLoadL.element.innerHTML = `sack ${fmtN(Fw)}`;
          lArm.position.set(eff[0] + 0.55, (e0 + e1) / 2, 0.25); lArm.element.innerHTML = `hand moves ${(e0 - e1).toFixed(1)} m`;
        }

        if (focus === 'pulley') {
          const n = s.ropes, y = 0.02 + H * k;                                  // sack bottom
          sackP.scale.setScalar(sc); sackP.position.set(0, y, 0);
          const lowY = y + sackP.h * sc + 0.28; lower.position.set(0, lowY, 0);
          strands.forEach((st, i) => { st.visible = i < n; if (i < n) { const x = (i - (n - 1) / 2) * 0.07; st.between([x, lowY + 0.1, 0], [x, 2.71, 0]); } });
          freeA.between([0.2, 2.8, 0.12], [0.9, 0.2, 0.12]);
          const hx = 1.35 + n * H * k;
          freeB.between([0.98, 0.12, 0.12], [hx, 0.95, 0.12]);
          puller.position.set(hx + 0.25, 0, 0.12); puller.rotation.y = Math.PI; puller.pose({ arm: 1.2, lean: -0.2, stride: 0.25 });
          aEffP.aim([hx + 0.05, 1.15, 0.3], [1, 0, 0], r.Fin * S * 1.2);
          aLoadP.aim([0.35, y + 0.4, 0.3], [0, -1, 0], Fw * S);
          pulled.scale.x = Math.max(0.001, n * H * k); pulled.position.set(1.35 + (n * H * k) / 2, 0.01, 0.5); pulled.visible = k > 0.01;
          lEffP.position.set(hx + 0.3, 2.1, 0.3); lEffP.element.innerHTML = `you pull <b>${fmtN(r.Fin)}</b>`;
          lLoadP.position.set(-0.6, y + 0.5, 0.3); lLoadP.element.innerHTML = `${n} strands × ${fmtN(Fw / n)}`;
          lRope.position.set(1.35 + n * H * 0.5, -0.2, 0.6); lRope.element.innerHTML = `rope pulled ${(n * H * k).toFixed(1)} of ${(n * H).toFixed(1)} m`;
        }

        if (focus === 'ramp') {
          if (s.L !== rampL) run = buildRamp(s.L);
          const al = Math.asin(H / s.L), u = s.L * k;
          const x = -run + u * Math.cos(al), y = u * Math.sin(al);
          sackR.scale.setScalar(0.85 * sc); sackR.rotation.z = al; sackR.position.set(x - 0.05, y, 0);
          const dir = [Math.cos(al), Math.sin(al), 0];
          aEffR.aim([x - 0.55 * Math.cos(al), y + 0.3, 0.45], [...dir], r.Fin * S * 1.5);
          aLoadR.aim([x, y + 0.35, 0.45], [0, -1, 0], Fw * S);
          lEffR.position.set(x - 0.6, y + 0.75, 0.45); lEffR.element.innerHTML = `you push <b>${fmtN(r.Fin)}</b>`;
          lLoadR.position.set(x + 0.35, y + 0.95 * sc, 0.2); lLoadR.element.innerHTML = `sack ${fmtN(Fw)}`;
          lSlope.position.set(-run / 2, -0.15, 0.6); lSlope.element.innerHTML = `ramp ${s.L.toFixed(1)} m up to a ${H} m step`;
        }

        cur = { s, r };
        const kk = `${focus}|${s.m}|${s.ratio}|${s.ropes}|${s.L}|${s.eta}`;
        if (kk !== key) { key = kk; bd.redraw(); }
        void narrow;
      },
      readout: (s) => {
        const r = machine(s);
        const name = { lever: 'the lever', pulley: 'the pulley block', ramp: 'the ramp' }[s.focus];
        return `<div class="big">Push ${fmtN(r.Fin)} for ${r.din.toFixed(1)} m</div>
          <div class="row"><span>Job: lift ${s.m} kg by ${H} m, m g h</span><b>${fmtJ(r.Wout)}</b></div>
          <div class="row"><span>Your force with ${name}</span><b>${fmtN(r.Fin)}</b></div>
          <div class="row"><span>Your distance</span><b>${r.din.toFixed(2)} m</b></div>
          <div class="row"><span>Work you put in, F × d</span><b>${fmtJ(r.Win)}</b></div>
          <div class="row"><span>Lost to friction (heat)</span><b>${fmtJ(r.lost)}</b></div>
          <div class="row"><span>Mechanical advantage</span><b>× ${r.MA.toFixed(1)}</b></div>
          <small>Less force, more distance. The work never gets smaller than the job.</small>`;
      },
    };
  },
};
