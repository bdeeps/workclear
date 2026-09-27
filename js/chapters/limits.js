// Chapter 5: myths and surprises.
//  - Carrying a bag level: your hand pulls up (m g), the bag moves sideways. The angle is 90°, cos 90° = 0,
//    so you do no work on the bag (at steady walking speed). Lifting it 1 m onto a shelf is + m g × 1 m;
//    lowering it back is − m g × 1 m: negative work, the bag hands energy back to you.
//  - Rate is not amount: two winches lift the same 20 kg bucket 3 m. Same work (588.6 J), but done in
//    30 s that is about 20 W and in 3 s about 196 W.
//  - Braking: the road's friction on the tyres points backwards while the car moves forwards, so it does
//    negative work, −½ m v², all of which becomes heat, mostly in the brake discs. Hard braking on a dry
//    road at about 0.7 g. Car 1,200 kg. The front brakes take about 70% of it; two cast-iron front discs
//    of about 6 kg each (c ≈ 460 J/kg·K) warm by roughly 0.7 × ½ m v² ÷ (12 kg × 460), ignoring the pads
//    and cooling. (Energy bookkeeping: see EnergyClear.)
//  - Muscles: in each sarcomere, myosin heads grab actin, pull (the power stroke) and let go, using one ATP
//    per cycle. ATP gives about 8 × 10⁻²⁰ J in a cell (ΔG ≈ −50 kJ/mol ÷ 6.02 × 10²³). One stroke moves the
//    actin about 5–10 nm with a few piconewtons (optical-trap measurements, Finer, Simmons & Spudich,
//    Nature 1994). Holding still, the heads keep cycling while the filaments cannot slide: energy is used,
//    no work is done on the load, and it all becomes heat. The model is in micrometres.
import { THREE, M, box, sphere, clamp, approach } from '../kit.js';
import {
  G, KMH, board, panelBg, title, arrow2d, COL, HEX, force, makePerson, makeCar, makeBucket, stick, looper,
  fitNarrow, reelBoards, homeBoard, inReel, fmtN, fmtJ, fmtW, dots, rng,
} from '../work.js';

const RX = 30, BX = 60, MX = 90;
const CAR = { m: 1200, a: 0.7 * G, front: 0.7, disc: 12, c: 460 };
const VIEWS = {
  bag: { pos: [0.3, 2.2, 5.6], target: [0.2, 1.1, 0] },
  rate: { pos: [RX + 0.8, 3.7, 8.4], target: [RX + 0.8, 2.8, 0] },
  brake: { pos: [BX + 1.6, 2.8, 8.0], target: [BX + 1.4, 1.6, 0] },
  muscle: { pos: [MX + 0.1, 1.6, 3.7], target: [MX + 0.1, 1.0, 0] },
};
const bagWork = (s) => { const F = s.bm * G; return s.bagMode === 'carry' ? { F, d: 3, th: 90, W: 0 } : s.bagMode === 'lift' ? { F, d: 1, th: 0, W: F } : { F, d: 1, th: 180, W: -F }; };

export default {
  id: 'limits',
  short: 'Myths and limits',
  title: 'When work isn’t what it seems',
  subtitle: 'Carrying a bag, fast and slow lifts, braking, and tired muscles.',
  view: VIEWS.bag,
  learn: `<p><b>Myth: carrying a bag across a room is work.</b> Not on the bag! Your hand pulls <b>up</b>, but the bag moves <b>sideways</b>. The force is at 90° to the motion, cos 90° = 0, so the work on the bag is zero. Lift it onto a shelf and you do work; lower it and you do <b>negative work</b>: the bag hands energy back to you.</p>
    <p><b>Myth: more power means more work.</b> Power is a <b>rate</b>, not an amount. A hand winch and an electric hoist lifting the same bucket to the same height do exactly the same work. The hoist just does it faster, so its power is higher.</p>
    <p><b>Negative work.</b> When a force points against the motion, its work is negative: it takes energy away. <b>Brakes</b> do this. The road pushes the tyres backwards while the car rolls forwards, removing all of the car’s kinetic energy, ½ m v², and turning it into heat in the brake discs. Twice the speed means four times the energy to get rid of (see CarClear and EnergyClear).</p>
    <p><b>Why does holding still make you tired?</b> Inside each muscle fibre, millions of tiny <b>myosin heads</b> grab a thin filament called <b>actin</b>, pull, let go and grab again. Every cycle burns one molecule of <b>ATP</b>. When you hold a bucket still, the heads keep cycling to keep up the pull, but nothing moves. You burn energy without doing any work on the bucket, and it all becomes heat.</p>
    <p class="tip"><b>Try it:</b> carry the bag, then lift and lower it, and watch the angle and the sign of the work. Brake from 100 km/h and compare the disc temperature with 50 km/h. Then zoom into a muscle and switch from lifting to holding.</p>`,
  terms: [
    { t: 'Zero work', d: 'No work is done when nothing moves, or when the force is at right angles to the motion.' },
    { t: 'Negative work', d: 'Work by a force that points against the motion. It takes energy away from the moving thing.' },
    { t: 'Kinetic energy', d: 'The energy of motion, ½ m v². Brakes must remove all of it to stop a car.' },
    { t: 'Myosin and actin', d: 'The two protein filaments in muscle. Myosin heads pull on actin to make a muscle contract.' },
    { t: 'ATP', d: 'The fuel molecule of cells. Each pull of a myosin head uses one ATP.' },
    { t: 'Rate vs amount', d: 'Power is how fast work is done; work is how much. They are different things.' },
  ],
  defaults: { focus: 'bag', bagMode: 'carry', bm: 5, t1: 30, t2: 3, v: 50, mus: 'hold' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'bag', label: 'The bag' }, { v: 'rate', label: 'Fast vs slow' }, { v: 'brake', label: 'Brakes' }, { v: 'muscle', label: 'Inside a muscle' }] },
    { key: 'bagMode', type: 'seg', label: 'Bag', options: [{ v: 'carry', label: 'Carry it level' }, { v: 'lift', label: 'Lift it 1 m' }, { v: 'lower', label: 'Lower it 1 m' }] },
    { key: 'bm', type: 'range', label: 'Bag: mass', min: 1, max: 15, step: 0.5, ends: ['1 kg', '15 kg'], fmt: (v) => v + ' kg' },
    { key: 't1', type: 'range', label: 'Hand winch: time', min: 5, max: 60, step: 1, ends: ['5 s', '60 s'], fmt: (v) => v + ' s' },
    { key: 't2', type: 'range', label: 'Electric hoist: time', min: 1, max: 10, step: 0.5, ends: ['1 s', '10 s'], fmt: (v) => v + ' s' },
    { key: 'v', type: 'range', label: 'Brakes: speed before braking', min: 20, max: 120, step: 5, ends: ['20 km/h', '120 km/h'], fmt: (v) => v + ' km/h' },
    { key: 'mus', type: 'seg', label: 'Muscle', options: [{ v: 'relax', label: 'Relaxed' }, { v: 'hold', label: 'Holding still' }, { v: 'lift', label: 'Lifting' }] },
  ],
  onChange(s, key) {
    if (['bagMode', 'bm'].includes(key)) s.focus = 'bag';
    if (['t1', 't2'].includes(key)) s.focus = 'rate';
    if (key === 'v') s.focus = 'brake';
    if (key === 'mus') s.focus = 'muscle';
  },
  quiz: [
    { q: 'You carry a 5 kg bag 10 m along a level corridor at a steady pace. How much work does your hand do on the bag?', options: ['490 J', '49 J', '0 J', '50 J'], answer: 2, why: 'Your hand pulls straight up, but the bag moves sideways. At 90°, cos θ = 0, so the work on the bag is zero.' },
    { q: 'A car brakes to a stop. What work do the brakes (through the road) do on the car?', options: ['Positive work, adding energy', 'Negative work, taking away its kinetic energy as heat', 'No work, because the car stops', 'It depends on the colour of the discs'], answer: 1, why: 'The friction force points backwards while the car moves forwards, so its work is negative: −½ m v². That energy ends up as heat in the discs and pads.' },
    { q: 'Why does your arm tire when you hold a heavy bag perfectly still?', options: ['You are doing lots of work on the bag', 'Myosin heads keep cycling and burning ATP to keep up the pull, even though nothing moves', 'Gravity is doing work on your arm', 'The bag gets heavier'], answer: 1, why: 'The muscle has to keep pulling, and it does that by constantly grabbing and releasing. Each cycle uses ATP. No work is done on the bag; the energy becomes heat.' },
  ],
  reel: [
    { ms: 5600, caption: 'Brakes do negative work: they take away the car’s kinetic energy and turn it into heat.', set: { focus: 'brake', v: 100 }, act: (s, inst) => inst.restart?.(), view: { pos: [BX + 0.6, 3.2, 4.5], target: [BX + 0.3, 2.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gB = new THREE.Group(), gR = new THREE.Group(), gK = new THREE.Group(), gM = new THREE.Group();
    gR.position.x = RX; gK.position.x = BX; gM.position.set(MX, 1.3, 0); root.add(gB, gR, gK, gM);
    const ropeM = M.matte(0xd8c28a), steel = M.metal(0x9aa3b2);

    // ================================================================ the bag
    const floorB = box(6, 0.02, 1.6, M.matte(0x3a3f4b)); floorB.position.y = 0.01; gB.add(floorB);
    const shelf = box(0.7, 0.04, 0.4, M.matte(0xa97a42)); shelf.position.set(0.75, 1.72, -0.1); gB.add(shelf);
    const shelfLeg = box(0.04, 1.72, 0.04, M.matte(0x5b6270)); shelfLeg.position.set(1.05, 0.86, -0.25); gB.add(shelfLeg);
    const walker = makePerson({ shirt: 0x3b6fd8, s: 1 }); gB.add(walker);
    const bag = new THREE.Group(); gB.add(bag);
    const bagBody = box(0.32, 0.36, 0.14, M.matte(0xd8332f)); bagBody.position.y = -0.2; bag.add(bagBody);
    const strap = stick(0.012, M.matte(0x22252c)); bag.add(strap); strap.between([0, -0.02, 0], [0, 0.05, 0]);
    const aHand = force(HEX.push, 0.03, 0.14), aVel = force(HEX.acc, 0.03, 0.14); gB.add(aHand, aVel);
    const lHand = stage.label('', [0, 0, 0], gB, 'hot'), lVel = stage.label('', [0, 0, 0], gB), lW = stage.label('', [0, 0, 0], gB, 'hot');
    lHand.element.style.setProperty('--c', COL.push); lW.element.style.setProperty('--c', COL.net);
    const Lb = looper(3, 1.0);

    // ================================================================ fast vs slow: two winches
    const rateBits = [-1.2, 1.2].map((x, i) => {
      const g = new THREE.Group(); g.position.x = x; gR.add(g);
      const beamT = box(1.2, 0.1, 0.2, M.matte(0x5b6270)); beamT.position.y = 3.9; g.add(beamT);
      for (const px of [-0.55, 0.55]) { const p = box(0.08, 3.9, 0.08, M.matte(0x5b6270)); p.position.set(px, 1.95, 0); g.add(p); }
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 24), steel); wheel.position.set(0, 3.72, 0.12); g.add(wheel);
      const drive = i === 0 ? makePerson({ shirt: 0x7a4fd8, s: 0.9 }) : box(0.4, 0.3, 0.3, M.plastic(0xf2c230));
      if (i === 0) { drive.position.set(0.95, 0, 0.2); drive.rotation.y = Math.PI; drive.pose({ arm: 1.6 }); } else drive.position.set(0.8, 0.15, 0.1);
      g.add(drive);
      const bk = makeBucket(); g.add(bk);
      const r1 = stick(0.01, ropeM), r2 = stick(0.01, ropeM); g.add(r1, r2);
      const lab = stage.label('', [0, 4.25, 0], g, 'hot'); lab.element.style.setProperty('--c', i ? COL.push : COL.pull);
      return { g, bk, r1, r2, lab, wheel, drive, Lp: looper(4, 1.2) };
    });

    // ================================================================ brakes
    const roadK = box(40, 0.04, 5, M.matte(0x2b2f36)); roadK.position.y = -0.02; gK.add(roadK);
    const dashes = []; for (let i = 0; i < 12; i++) { const d = box(2, 0.01, 0.15, M.matte(0xe8e2c8)); d.position.set(-20 + i * 4, 0.005, 1.6); gK.add(d); dashes.push(d); }
    const car = makeCar(0x2f6fd8); gK.add(car);
    const discMat = M.glow(0x3a3f4b), discs = [];
    for (const x of [-1.3, 1.32]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 24), discMat); d.rotation.x = Math.PI / 2; d.position.set(x, 0.32, car.W / 2 + 0.03); gK.add(d); discs.push(d); }
    const aFr = [0, 1].map(() => force(HEX.fric, 0.04, 0.2)), aV = force(HEX.acc, 0.04, 0.2); aFr.forEach((a) => gK.add(a)); gK.add(aV);
    const lFr = stage.label('', [0, 0, 0], gK, 'hot'), lV = stage.label('', [0, 0, 0], gK), lDisc = stage.label('', [0, 0, 0], gK);
    lFr.element.style.setProperty('--c', COL.fric);
    const cs = { v: 50 / KMH, t: 0, wait: 0, d: 0, E0: 0, heat: 0 };
    const restart = (s) => { cs.v = (s ? s.v : 50) / KMH; cs.t = 0; cs.wait = 0; cs.d = 0; cs.heat = 0; cs.E0 = 0.5 * CAR.m * cs.v * cs.v; };

    // ================================================================ inside a muscle (units: µm)
    const SL = 2.5, ROWS = [-0.3, -0.1, 0.1, 0.3];
    const zdiscs = [-1, 1].map(() => { const z = box(0.05, 0.9, 0.5, M.plastic(0x8ef0ff, { transparent: true, opacity: 0.6 })); gM.add(z); return z; });
    const actins = [];
    for (const side of [-1, 1]) for (const y of [-0.4, -0.2, 0, 0.2, 0.4]) { const a = box(0.95, 0.018, 0.018, M.plastic(0xff7a90)); a.userData = { side, y }; gM.add(a); actins.push(a); }
    const myosins = ROWS.map((y) => { const m = box(1.6, 0.05, 0.05, M.plastic(0xc49bff)); m.position.y = y; gM.add(m); return m; });
    const HEADS = [];
    ROWS.forEach((y, r) => { for (let i = 0; i < 12; i++) { const side = i < 6 ? -1 : 1, x = side * (0.18 + (i % 6) * 0.11), up = (i + r) % 2 ? 1 : -1; HEADS.push({ x, y, side, up, ph: (i * 0.37 + r * 0.23) % 1 }); } });
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 10, 8), M.plastic(0xe7d2ff), HEADS.length); heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage); heads.frustumCulled = false; gM.add(heads);
    const necks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), M.plastic(0xc49bff), HEADS.length); necks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); necks.frustumCulled = false; gM.add(necks);
    const sparks = dots(HEADS.length, 0.02, 0xfff2a8); gM.add(sparks);
    const load = force(HEX.weight, 0.02, 0.07); gM.add(load);
    const lMus = stage.label('', [0, 0.72, 0], gM, 'hot'), lAct = stage.label('actin', [0, 0, 0], gM), lMyo = stage.label('myosin', [0, -0.55, 0.2], gM);
    lMus.element.style.setProperty('--c', COL.push);
    const o3 = new THREE.Object3D(), Yv = new THREE.Vector3(0, 1, 0);
    let slide = 0, musT = 0, cycles = 0;

    // ================================================================ board
    let cur = null;
    const bd = board(root, 2.6, 1.5, 800, 460, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      const { s } = cur;
      if (s.focus === 'bag') {
        const b = bagWork(s);
        title(g, 'Work on the bag', 'W = F d cos θ');
        const cx = 200, cy = 260;
        g.fillStyle = '#d8332f'; g.fillRect(cx - 30, cy - 30, 60, 60);
        arrow2d(g, cx, cy - 30, 0, -120, COL.push, `F = ${fmtN(b.F)}`);
        const dx = b.th === 90 ? 150 : 0, dy = b.th === 0 ? -150 : b.th === 180 ? 150 : 0;
        arrow2d(g, cx + (b.th === 90 ? 30 : 60), cy + (b.th === 180 ? 30 : 0), dx, dy, COL.acc, b.th === 90 ? 'moves sideways' : b.th === 0 ? 'moves up' : 'moves down', { lx: 10 });
        g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif';
        g.fillText(`θ = ${b.th}°`, 440, 150); g.fillText(`cos θ = ${Math.round(Math.cos(b.th * Math.PI / 180))}`, 440, 196);
        g.fillStyle = b.W === 0 ? '#fff' : b.W > 0 ? COL.acc : COL.net; g.font = 'bold 40px sans-serif';
        g.fillText(`W = ${b.W === 0 ? '0 J' : fmtJ(b.W)}`, 440, 270);
        g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '19px sans-serif';
        g.fillText(b.W === 0 ? 'force ⟂ motion: no work' : b.W > 0 ? 'you give the bag energy' : 'the bag gives energy back', 440, 310);
        return;
      }
      if (s.focus === 'rate') {
        const W = 20 * G * 3, P1 = W / s.t1, P2 = W / s.t2;
        title(g, 'Same work, different power', '20 kg lifted 3 m');
        const col = [COL.pull, COL.push], names = ['hand winch', 'electric hoist'];
        [[W, W], [P1, P2]].forEach((pair, j) => {
          const max = j ? Math.max(P1, P2) * 1.15 : W * 1.15, x0 = 40 + j * 390, bh = 290;
          g.fillStyle = 'rgba(255,255,255,.8)'; g.font = 'bold 22px sans-serif'; g.fillText(j ? 'Power (W ÷ t)' : 'Work (m g h)', x0, 90);
          pair.forEach((v, i) => {
            const hh = (v / max) * bh, x = x0 + i * 170, y = 410 - hh;
            g.fillStyle = col[i]; g.fillRect(x, y, 120, hh);
            g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.fillText(j ? fmtW(v) : fmtJ(v), x, y - 10);
            g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '17px sans-serif'; g.fillText(names[i], x, 440);
          });
        });
        return;
      }
      if (s.focus === 'brake') {
        const E = 0.5 * CAR.m * (s.v / KMH) ** 2;
        title(g, 'Kinetic energy → heat', `${CAR.m.toLocaleString('en-IN')} kg car`);
        const left = cur.E0 > 0 ? 0.5 * CAR.m * cs.v * cs.v : E, used = E - left;
        const x0 = 40, x1 = w - 40, y = 130, bw = x1 - x0;
        g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '20px sans-serif'; g.fillText('energy of motion, ½ m v²', x0, y - 12);
        g.fillStyle = COL.acc; g.fillRect(x0, y, bw * (left / E), 44);
        g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText('work done by the brakes (negative) → heat', x0, y + 100);
        g.fillStyle = COL.fric; g.fillRect(x0, y + 112, bw * (used / E), 44);
        g.fillStyle = '#fff'; g.font = 'bold 28px sans-serif'; g.fillText(`${fmtJ(left)} left`, x0, y + 220);
        g.fillStyle = COL.fric; g.fillText(`brakes: −${fmtJ(used)}`, x0 + 360, y + 220);
        g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '18px sans-serif'; g.fillText(`At ${s.v} km/h the car carries ${fmtJ(E)}: double the speed, four times the energy.`, x0, h - 30);
        return;
      }
      title(g, 'Muscle: energy used vs work done', 'per contraction, not to scale');
      const rows = [['Relaxed', 0, 0], ['Holding still', 1, 0], ['Lifting', 1.2, 0.3]];
      rows.forEach(([name, used, work], i) => {
        const y = 110 + i * 110, me = ['relax', 'hold', 'lift'][i] === s.mus, bw = 440;
        g.fillStyle = me ? COL.push : 'rgba(255,255,255,.7)'; g.font = (me ? 'bold ' : '') + '22px sans-serif'; g.fillText(name, 30, y + 34);
        g.fillStyle = 'rgba(255,90,138,.8)'; g.fillRect(260, y + 4, bw * used / 1.2, 26);
        g.fillStyle = 'rgba(92,225,169,.9)'; g.fillRect(260, y + 38, Math.max(used ? 3 : 0, bw * work / 1.2), 26);
        g.fillStyle = '#fff'; g.font = '16px sans-serif'; g.fillText(used ? 'ATP burned' : 'no ATP', 268 + bw * used / 1.2, y + 24); g.fillText(work ? 'work on the load' : '0 J on the load', 268 + bw * work / 1.2, y + 58);
      });
    }, [0, 0, 0]);

    let focus = '', key = '', walkPh = 0;
    const place = () => {
      const P = { bag: [[2.2, 2.3, -1.2], 1.0], rate: [[RX + 3.6, 2.4, -1.0], 1.2], brake: [[BX + 3.3, 2.5, -2.2], 1.1], muscle: [[MX + 0.1, 0.42, 0.2], 0.5] }[focus];
      homeBoard(bd, P[0], focus === 'muscle' ? 0 : -0.3, P[1]);
    };
    return {
      restart() { restart(cur?.s); },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lVel, lDisc, lAct, lMyo]);
        if (s.focus !== focus) {
          focus = s.focus; gB.visible = focus === 'bag'; gR.visible = focus === 'rate'; gK.visible = focus === 'brake'; gM.visible = focus === 'muscle';
          place(); if (focus === 'brake') restart(s);
          if (!inReel()) { const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); }
        }
        reelBoards([[bd, { bag: [0.2, 3.0, -1], rate: [RX + 0.4, 5.4, -1], brake: [BX + 0.3, 4.1, -1.2], muscle: [MX + 0.1, 2.55, -0.4] }[focus], { bag: 0.9, rate: 1.1, brake: 1.55, muscle: 0.5 }[focus]]]);
        let redraw = false;

        if (focus === 'bag') {
          const b = bagWork(s), k = Lb.tick(dt);
          let x = 0, handY = 0.73;
          if (s.bagMode === 'carry') { x = -1.5 + 3 * k; walkPh += dt * 7 * (k < 1 ? 1 : 0); walker.pose({ stride: k < 1 ? 0.4 * Math.sin(walkPh) : 0, arm: 0 }); }
          else { const up = s.bagMode === 'lift' ? k : 1 - k; handY = 0.73 + up * 1.2; x = 0.2; const a = Math.acos(clamp((1.44 - handY) / 0.62, -1, 1)); walker.pose({ arm: a, stride: 0 }); }
          walker.position.set(x, 0, 0.1);
          const hx = x + (s.bagMode === 'carry' ? 0 : 0.62 * Math.sin(walker.arms[0].rotation.z)), hz = 0.32;
          bag.position.set(hx, handY, hz); bag.scale.setScalar(0.8 + 0.04 * s.bm);
          aHand.aim([hx + 0.25, handY + 0.05, hz], [0, 1, 0], b.F * 0.004);
          const dir = s.bagMode === 'carry' ? [1, 0, 0] : s.bagMode === 'lift' ? [0, 1, 0] : [0, -1, 0];
          aVel.aim([hx + (s.bagMode === 'carry' ? 0.25 : 0.45), handY - 0.25, hz], dir, k < 1 ? 0.5 : 0);
          lHand.position.set(hx + 0.25, handY + 0.3 + b.F * 0.004, hz); lHand.element.innerHTML = `hand pulls up <b>${fmtN(b.F)}</b>`;
          lVel.position.set(hx + 0.9, handY - 0.35, hz); lVel.element.innerHTML = 'motion'; lVel.visible = !narrow && k < 1;
          lW.position.set(hx, handY - 0.75, hz); lW.element.innerHTML = `work on the bag: <b>${b.W === 0 ? '0 J' : fmtJ(b.W * k)}</b>`;
          const kk = `bag|${s.bagMode}|${s.bm}`; if (kk !== key) { key = kk; redraw = true; }
        }

        if (focus === 'rate') {
          const tmax = Math.max(s.t1, s.t2), sp = 5 / tmax;           // play both at the same speed-up
          rateBits.forEach((r, i) => {
            const T = i ? s.t2 : s.t1, dur = T * sp, k = r.Lp.tick(dt, dur);
            const y = 0.1 + 3 * k;
            r.bk.position.set(0, y, 0); r.bk.fill(0.9);
            r.r1.between([0, y + r.bk.top, 0], [0, 3.72, 0]); r.r2.between([0.14, 3.72, 0.12], [0.8, 1.3, 0.12]);
            r.wheel.rotation.z -= (k < 1 ? (3 / dur) / 0.14 : 0) * dt;
            if (i === 0) r.drive.pose({ arm: 1.3 + 0.3 * Math.sin(r.Lp.k * 30), stride: 0 });
            r.lab.element.innerHTML = `${i ? 'electric hoist' : 'hand winch'}: ${T} s → <b>${fmtW((20 * G * 3) / T)}</b>`;
          });
          const kk = `rate|${s.t1}|${s.t2}`; if (kk !== key) { key = kk; redraw = true; }
        }

        if (focus === 'brake') {
          let braking = false;
          if (cs.wait > 0) { cs.wait -= dt; if (cs.wait <= 0) restart(s); }
          else {
            cs.t += dt;
            if (cs.t > 0.8) { braking = cs.v > 0; const dv = Math.min(cs.v, CAR.a * dt); cs.d += (cs.v - dv / 2) * dt; cs.v -= dv; if (cs.v <= 0) { cs.v = 0; cs.wait = 2.2; } }
          }
          if (cs.t <= 0.8 && cs.wait <= 0) { cs.v = s.v / KMH; cs.E0 = 0.5 * CAR.m * cs.v * cs.v; }
          dashes.forEach((d) => { d.position.x -= cs.v * dt * 0.5; if (d.position.x < -20) d.position.x += 48; });
          car.roll(cs.v * dt * 0.5);
          const Ev = 0.5 * CAR.m * cs.v * cs.v, used = cs.E0 - Ev;
          const dT = (CAR.front * used) / (CAR.disc * CAR.c);
          discMat.color.setRGB(clamp(0.23 + dT / 60, 0, 1), clamp(0.25 + dT / 200, 0, 0.6), clamp(0.3 - dT / 150, 0.05, 0.3));
          const F = braking ? CAR.m * CAR.a : 0;
          aFr[0].aim([1.32, 0.05, 1.1], [-1, 0, 0], F * CAR.front * 0.00012);
          aFr[1].aim([-1.3, 0.05, 1.1], [-1, 0, 0], F * (1 - CAR.front) * 0.00012);
          aV.aim([0.2, 1.75, 0], [1, 0, 0], cs.v * 0.05);
          lFr.position.set(0.3, -0.25, 1.4); lFr.element.innerHTML = braking ? `friction backwards <b>${fmtN(F)}</b>` : cs.wait > 0 ? 'stopped' : 'driving';
          lV.position.set(1.4, 2.0, 0); lV.element.innerHTML = `${(cs.v * KMH).toFixed(0)} km/h · ½ m v² = ${fmtJ(Ev)}`;
          lDisc.position.set(1.32, 0.9, 1.1); lDisc.element.innerHTML = `front discs +${dT.toFixed(0)} °C`;
          cur = { s, E0: cs.E0 };
          const kk = `br|${s.v}|${Math.round(cs.v * 4)}`; if (kk !== key) { key = kk; redraw = true; }
        }

        if (focus === 'muscle') {
          musT += dt;
          const active = s.mus !== 'relax', lifting = s.mus === 'lift';
          if (lifting) { slide += dt * 0.12; if (slide > 0.25) slide = 0; } else slide = approach(slide, s.mus === 'hold' ? 0.12 : 0, 3, dt);
          const half = SL / 2 - slide;
          zdiscs[0].position.x = -half; zdiscs[1].position.x = half;
          actins.forEach((a) => { const sd = a.userData.side; a.position.set(sd * (half - 0.475), a.userData.y, 0); });
          let n = 0;
          HEADS.forEach((hd, i) => {
            const rate = 1.6, ph = active ? (hd.ph + musT * rate) % 1 : 0;
            const before = Math.floor((hd.ph + (musT - dt) * rate)), after = Math.floor(hd.ph + musT * rate);
            if (active && after > before) n++;
            // bound during 0–0.55 (the power stroke swings the neck towards the centre), free after
            const bound = active && ph < 0.55;
            const swing = bound ? -0.5 + (ph / 0.55) * 1.0 : 0.5 - ((ph - 0.55) / 0.45) * 1.0;
            const ang = active ? swing : 0.9;
            const baseY = hd.y + hd.up * 0.025, reach = active && bound ? 0.075 : 0.055;
            const tipX = hd.x - hd.side * Math.sin(ang) * 0.04 * (active ? 1 : 0) + (active ? 0 : hd.side * 0.03), tipY = baseY + hd.up * reach * Math.cos(active ? ang * 0.5 : 1.2);
            o3.position.set(tipX, tipY, 0); o3.rotation.set(0, 0, 0); o3.scale.setScalar(1); o3.updateMatrix(); heads.setMatrixAt(i, o3.matrix);
            const A = new THREE.Vector3(hd.x, baseY, 0), B = new THREE.Vector3(tipX, tipY, 0), L = A.distanceTo(B);
            o3.position.copy(A).add(B).multiplyScalar(0.5); o3.quaternion.setFromUnitVectors(Yv, B.sub(A).normalize()); o3.scale.set(1, L, 1); o3.updateMatrix(); necks.setMatrixAt(i, o3.matrix);
            const fl = active && ph > 0.55 && ph < 0.63;
            sparks.place(i, tipX, tipY, 0.03, fl ? 1 : 0);
          });
          heads.instanceMatrix.needsUpdate = true; necks.instanceMatrix.needsUpdate = true; sparks.done();
          cycles = approach(cycles, n / Math.max(dt, 1e-3), 2, dt);
          load.aim([half + 0.12, 0, 0.1], [1, 0, 0], active ? 0.25 : 0.001);
          lMus.element.innerHTML = s.mus === 'relax' ? 'relaxed: heads let go, no ATP used' : lifting ? 'lifting: filaments slide, <b>work is done</b>' : 'holding: heads keep cycling, <b>nothing slides</b>';
          lAct.position.set(-half + 0.5, 0.52, 0);
          const kk = `mus|${s.mus}`; if (kk !== key) { key = kk; redraw = true; }
        }
        if (focus !== 'brake') cur = { s, E0: 0 };
        if (redraw) bd.redraw();
      },
      readout: (s) => {
        if (s.focus === 'bag') {
          const b = bagWork(s);
          return `<div class="big">Work on the bag = ${b.W === 0 ? '0 J' : fmtJ(b.W)}</div>
            <div class="row"><span>Your hand pulls up</span><b>${fmtN(b.F)}</b></div>
            <div class="row"><span>The bag moves</span><b>${s.bagMode === 'carry' ? 'sideways, 3 m' : s.bagMode === 'lift' ? 'up, 1 m' : 'down, 1 m'}</b></div>
            <div class="row"><span>Angle between them</span><b>${b.th}°</b></div>
            <div class="row"><span>W = F d cos θ</span><b>${b.W === 0 ? '0 J' : fmtJ(b.W)}</b></div>
            <small>${s.bagMode === 'carry' ? 'Your legs do work moving you, and your arm burns energy holding on, but no work goes into the bag.' : s.bagMode === 'lower' ? 'Negative work: the bag hands its energy back to your muscles, which turn it into heat.' : 'Now the force and the motion point the same way.'}</small>`;
        }
        if (s.focus === 'rate') {
          const W = 20 * G * 3;
          return `<div class="big">Same work: ${fmtJ(W)}</div>
            <div class="row"><span>Hand winch: ${s.t1} s</span><b>${fmtW(W / s.t1)}</b></div>
            <div class="row"><span>Electric hoist: ${s.t2} s</span><b>${fmtW(W / s.t2)}</b></div>
            <div class="row"><span>Power ratio</span><b>× ${(s.t1 / s.t2).toFixed(1)}</b></div>
            <small>More power doesn’t mean more work. It means the same work in less time.</small>`;
        }
        if (s.focus === 'brake') {
          const v = s.v / KMH, E = 0.5 * CAR.m * v * v, d = (v * v) / (2 * CAR.a), dT = (CAR.front * E) / (CAR.disc * CAR.c);
          return `<div class="big">Brakes do −${fmtJ(E)} of work</div>
            <div class="row"><span>Kinetic energy, ½ m v²</span><b>${fmtJ(E)}</b></div>
            <div class="row"><span>Friction force, m × 0.7 g</span><b>${fmtN(CAR.m * CAR.a)}</b></div>
            <div class="row"><span>Stopping distance, v² ÷ 2a</span><b>${d.toFixed(1)} m</b></div>
            <div class="row"><span>Check: F × d</span><b>${fmtJ(CAR.m * CAR.a * d)}</b></div>
            <div class="row"><span>Front discs warm by about</span><b>${dT.toFixed(0)} °C</b></div>
            <small>The force points backwards, the car moves forwards: cos 180° = −1. Electric cars can catch some of this energy back with regenerative braking.</small>`;
        }
        const tail = s.mus === 'relax' ? 'Relaxed: the heads stay unbound and use almost no ATP.' : s.mus === 'hold' ? 'Holding: the heads pull, let go and grab again. Each cycle burns an ATP, but the filaments do not slide, so no work is done on the load. It all becomes heat.' : 'Lifting: the filaments slide and the sarcomere shortens. Some of the ATP energy becomes work, and most becomes heat.';
        return `<div class="big">${s.mus === 'lift' ? 'Work on the load: yes' : 'Work on the load: 0 J'}</div>
          <div class="row"><span>Energy in one ATP</span><b>≈ 8 × 10⁻²⁰ J</b></div>
          <div class="row"><span>One power stroke</span><b>≈ 4 pN × 8 nm</b></div>
          <div class="row"><span>Cross-bridge cycles in this view</span><b>${Math.round(cycles)} a second</b></div>
          <div class="row"><span>Sarcomere length</span><b>${(SL - 2 * slide).toFixed(2)} µm</b></div>
          <small>${tail}</small>`;
      },
    };
  },
};
