// Chapter 2: the power of people, bikes and horses.
// Stairs: lifting your own weight m g up a height h in time t takes P = m g h ÷ t. A floor is about
// 3 m (18 risers of about 167 mm; the National Building Code of India allows risers up to 190 mm in
// homes). A 60 kg student up 3 m in 5 s: 60 × 9.81 × 3 ÷ 5 ≈ 353 W.
// Cycling: at a steady speed the legs push against rolling resistance, gravity on a slope and air drag:
// P = (Crr m g cos α + m g sin α + ½ ρ CdA v²) × v ÷ η. Crr ≈ 0.006 (commuter tyres on asphalt),
// CdA ≈ 0.5 m² sitting upright, rider plus bike 80 kg, chain drive η ≈ 97% (see CycleClear).
// That gives about 80 W at 20 km/h and about 140 W at 25 km/h on the flat, in line with the 100–250 W
// that everyday riders hold. Muscles turn food into work at about 20–25% (gross efficiency), so the body
// burns about four times the power at the pedals.
// Horsepower: James Watt watched mill horses turning a wheel of 12 ft radius 144 times an hour while
// pulling with 180 lbf. 180 lbf × 2π × 12 ft × 144 ÷ 60 min = 32,572 ft·lbf/min, which Watt and Boulton
// rounded up to 33,000 ft·lbf/min (1783) = 745.7 W, one mechanical horsepower.
import { THREE, M, box, beam, torus, clamp } from '../kit.js';
import {
  G, D2R, TAU, KMH, RHO_AIR, HP, POWERS, board, panelBg, title, axes, dot, line, COL, HEX, force, makePerson, makeHorse,
  fitNarrow, reelBoards, homeBoard, inReel, fmtN, fmtW, looper,
} from '../work.js';

const BX = 40, HX = 80;
const RISE = 3, STEPS = 18, TREAD = 0.28, RUN = STEPS * TREAD, WIDTH = 1.1;
const BIKE = { m: 80, crr: 0.006, cda: 0.5, eta: 0.97, R: 0.34, muscle: 0.24 };
const LBF = 4.44822, FT = 0.3048, R_MILL = 12 * FT;
const stairsView = (n) => ({ pos: [RUN / 2 + 1.4, 1.5 * n + 2.6, 6.8 + 3.0 * n], target: [RUN / 2 + 0.3, 1.5 * n + 1.5, -0.6] });
const VIEWS = {
  bike: { pos: [BX + 1.0, 1.8, 5.6], target: [BX + 0.9, 1.25, 0] },
  horse: { pos: [HX + 1.6, 4.6, 10.5], target: [HX + 1.4, 2.0, 0] },
};

export function bikePower(v, slope) {
  const a = Math.atan(slope / 100), roll = BIKE.crr * BIKE.m * G * Math.cos(a), hill = BIKE.m * G * Math.sin(a), air = 0.5 * RHO_AIR * BIKE.cda * v * v;
  return { roll, hill, air, F: roll + hill + air, P: ((roll + hill + air) * v) / BIKE.eta };
}
const horseP = (F, n) => { const v = (TAU * R_MILL * n) / 3600; return { v, P: F * v }; };

export default {
  id: 'people',
  short: 'People and horses',
  title: 'Stairs, pedals and horsepower',
  subtitle: 'How many watts can a person, a cyclist and a horse put out?',
  view: stairsView(1),
  learn: `<p>You are a machine too. <b>Run up a flight of stairs</b> and you lift your own weight: the work is m g h, and your power is that work divided by the time. A 60 kg student climbing 3 m in 5 s does about 1,770 J of work at about <b>350 W</b>. Few people can keep that up for more than a minute.</p>
    <p>On a <b>bicycle</b> the legs push against rolling resistance, the slope and the air. Power is also <b>force × speed</b>, P = F v, and air drag grows with the square of the speed, so the power needed climbs steeply. Riding to school at 20 km/h takes about 80 W; most people can hold <b>100 to 250 W</b> for an hour (see CycleClear). Your muscles are only about a quarter efficient, so your body burns about four times that.</p>
    <p>In the 1780s <b>James Watt</b> needed a way to sell his steam engines, so he measured mill horses. A horse walking round a 12 ft arm, 144 times an hour, pulling with 180 pounds-force, did about 32,600 foot-pounds of work a minute. He rounded it up to 33,000: <b>1 horsepower = 745.7 W</b>. The unit of power is named after him.</p>
    <p>Machines put horses to shame. A 750 W mixer grinder is about 1 hp (see MixerClear). A Splendor motorcycle makes about 8 hp and a Pulsar 150 about 14 hp (see MotorcycleClear). A 1.2 litre hatchback makes about <b>90 hp</b>, some 67 kW, and CarClear's 2.0 litre engine about 110 kW.</p>
    <p class="tip"><b>Try it:</b> race up the stairs in 3 s, then take your time. Ride up an 8% hill and watch the watts climb. Then make Watt's horse walk faster and see how many horsepower it makes.</p>`,
  terms: [
    { t: 'Power', d: 'The rate of doing work: joules per second, or watts.' },
    { t: 'P = F × v', d: 'Power is also force times speed: the push needed, times how fast you go.' },
    { t: 'Horsepower (hp)', d: 'An old unit of power from James Watt: 33,000 foot-pounds per minute, 745.7 W.' },
    { t: 'Metric horsepower (PS)', d: 'A slightly smaller horsepower used in Europe and India: 735.5 W.' },
    { t: 'Rolling resistance', d: 'The small drag of tyres squashing as they roll, about 0.6% of the weight for a bicycle.' },
    { t: 'Gross efficiency', d: 'The share of the food energy you burn that comes out as work at the pedals: about 20–25%.' },
  ],
  defaults: { focus: 'stairs', m: 60, floors: 1, t: 5, v: 20, slope: 0, F: 180 * LBF, n: 144 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'stairs', label: 'Stairs' }, { v: 'bike', label: 'Bicycle' }, { v: 'horse', label: 'Watt’s horse' }] },
    { key: 'm', type: 'range', label: 'Stairs: your mass', min: 30, max: 100, step: 1, ends: ['30 kg', '100 kg'], fmt: (v) => v + ' kg' },
    { key: 'floors', type: 'seg', label: 'Stairs: floors (3 m each)', options: [{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }] },
    { key: 't', type: 'range', label: 'Stairs: time taken', min: 2, max: 30, step: 0.5, ends: ['2 s', '30 s'], fmt: (v) => v + ' s' },
    { key: 'v', type: 'range', label: 'Bike: speed', min: 5, max: 40, step: 1, ends: ['5 km/h', '40 km/h'], fmt: (v) => v + ' km/h' },
    { key: 'slope', type: 'range', label: 'Bike: hill', min: 0, max: 10, step: 0.5, ends: ['flat', '10%'], fmt: (v) => v + '%' },
    { key: 'F', type: 'range', label: 'Horse: pull on the arm', min: 300, max: 1200, step: 10, ends: ['300 N', '1,200 N'], fmt: (v) => Math.round(v) + ' N' },
    { key: 'n', type: 'range', label: 'Horse: rounds per hour', min: 60, max: 240, step: 1, ends: ['60', '240'], fmt: (v) => v + ' per hour' },
    { key: 'go', type: 'buttons', label: 'Try these', items: [
      { label: '60 kg, 3 m, 5 s', act: (s) => Object.assign(s, { focus: 'stairs', m: 60, floors: 1, t: 5 }) },
      { label: 'Cycle to school', act: (s) => Object.assign(s, { focus: 'bike', v: 18, slope: 0 }) },
      { label: 'Race up a hill', act: (s) => Object.assign(s, { focus: 'bike', v: 20, slope: 6 }) },
      { label: 'Watt’s horse', act: (s) => Object.assign(s, { focus: 'horse', F: 180 * LBF, n: 144 }) },
    ] },
  ],
  onChange(s, key) {
    if (['m', 'floors', 't'].includes(key)) s.focus = 'stairs';
    if (['v', 'slope'].includes(key)) s.focus = 'bike';
    if (['F', 'n'].includes(key)) s.focus = 'horse';
  },
  quiz: [
    { q: 'A 50 kg girl runs up 6 m of stairs in 10 s. About how much power does she need?', options: ['30 W', '300 W', '3,000 W', '50 W'], answer: 1, why: 'Work = m g h = 50 × 9.81 × 6 ≈ 2,940 J. Power = 2,940 J ÷ 10 s ≈ 294 W.' },
    { q: 'Why does riding a bicycle twice as fast take far more than twice the power?', options: ['The chain slips', 'Air drag grows with the square of the speed, and power is force × speed', 'The tyres get heavier', 'It doesn’t: it takes exactly twice'], answer: 1, why: 'Drag ∝ v², and P = F × v, so the power to beat the air grows with v³. Twice as fast takes about eight times the power against the air.' },
    { q: 'What is 1 horsepower in watts?', options: ['100 W', '745.7 W', '1,000 W', '33,000 W'], answer: 1, why: 'Watt fixed 1 hp at 33,000 foot-pounds per minute, which is 745.7 W. A 750 W mixer grinder is about 1 hp.' },
  ],
  reel: [
    { ms: 5200, caption: 'A 60 kg student running up 3 metres in 5 seconds works at about 350 watts.', set: { focus: 'stairs', m: 60, floors: 1, t: 5 }, view: { pos: [RUN / 2 + 0.9, 4.6, 5.0], target: [RUN / 2 + 0.1, 3.6, -0.5] }, spin: 0 },
    { ms: 5600, caption: 'Watt timed mill horses: 33,000 foot-pounds a minute. One horsepower is 746 watts.', set: { focus: 'horse', F: 180 * LBF, n: 144 }, view: { pos: [HX + 1.1, 6.5, 7.5], target: [HX + 0.7, 3.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gS = new THREE.Group(), gB = new THREE.Group(), gH = new THREE.Group();
    gB.position.x = BX; gH.position.x = HX; root.add(gS, gB, gH);

    // ================================================================ stairs (switchback flights)
    const treadM = M.matte(0xb9c0cc), sideM = M.clear(0xcfe8ff, 0.12), railM = M.metal(0x9aa3b2);
    const flights = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(); gS.add(g); flights.push(g);
      const dir = i % 2 ? -1 : 1, x0 = i % 2 ? RUN : 0, z = i % 2 ? -1.25 : 0;
      for (let k = 0; k < STEPS; k++) { const st = box(TREAD, RISE / STEPS, WIDTH, treadM); st.position.set(x0 + dir * (k + 0.5) * TREAD, RISE * i + (k + 0.5) * RISE / STEPS, z); g.add(st); }
      const stringer = box(RUN + 0.1, 0.06, 0.05, M.matte(0x5b6270)); stringer.position.set(RUN / 2, RISE * i + RISE / 2, z + WIDTH / 2 + 0.03); stringer.rotation.z = dir * Math.atan2(RISE, RUN); g.add(stringer);
      g.add(beam([x0, RISE * i + 1.0, z + WIDTH / 2], [x0 + dir * RUN, RISE * (i + 1) + 1.0, z + WIDTH / 2], 0.02, railM));
      const land = box(1.2, 0.1, 2.5, sideM); land.position.set(i % 2 ? -0.6 : RUN + 0.6, RISE * (i + 1) - 0.05, -0.62); g.add(land);
    }
    const ground = box(1.2, 0.1, 2.5, sideM); ground.position.set(-0.6, 0.05, -0.62); gS.add(ground);
    const kid = makePerson({ shirt: 0xe0663a, pants: 0x2b3242, s: 0.95 }); gS.add(kid);
    const hBar = force(HEX.acc, 0.03, 0.18); gS.add(hBar);
    const aWt = force(HEX.weight, 0.03, 0.15); gS.add(aWt);
    const lHs = stage.label('', [0, 0, 0], gS, 'hot'), lKid = stage.label('', [0, 0, 0], gS), lClock = stage.label('', [0, 0, 0], gS);
    lHs.element.style.setProperty('--c', COL.acc);
    const Ls = looper(5, 1.6);

    // ================================================================ bicycle on a road
    const tilt = new THREE.Group(); gB.add(tilt);
    const road = box(24, 0.04, 2.4, M.matte(0x2b2f36)); road.position.y = -0.02; tilt.add(road);
    const dashes = []; for (let i = 0; i < 12; i++) { const d = box(1, 0.01, 0.1, M.matte(0xe8e2c8)); d.position.set(-12 + i * 2, 0.005, 0.9); tilt.add(d); dashes.push(d); }
    const bike = new THREE.Group(); tilt.add(bike);
    const paint = M.plastic(0x5ce1a9, { roughness: 0.3 }), black = M.matte(0x16181d), steel = M.metal(0xc9ced8);
    const wheels = [-0.52, 0.52].map((x) => { const w = new THREE.Group(); w.position.set(x, BIKE.R, 0); bike.add(w); w.add(torus(BIKE.R - 0.015, 0.018, black, 40)); for (let i = 0; i < 12; i++) { const sp = box(0.64, 0.004, 0.004, steel); sp.rotation.z = (i / 12) * Math.PI; w.add(sp); } return w; });
    const BBp = [0, 0.3, 0], seat = [-0.18, 0.88, 0], head = [0.4, 0.86, 0];
    for (const [a, b] of [[BBp, seat], [seat, head], [BBp, head], [BBp, [-0.52, BIKE.R, 0]], [seat, [-0.52, BIKE.R, 0]], [head, [0.52, BIKE.R, 0]]]) bike.add(beam(a, b, 0.018, paint));
    const sad = box(0.24, 0.04, 0.1, black); sad.position.set(-0.2, 0.93, 0); bike.add(sad);
    bike.add(beam(head, [0.36, 1.02, 0], 0.016, steel), beam([0.36, 1.02, -0.22], [0.36, 1.02, 0.22], 0.014, steel));
    const crank = new THREE.Group(); crank.position.set(0, 0.3, 0.07); bike.add(crank);
    const cArm = box(0.03, 0.34, 0.015, M.metal(0x5b6270)); crank.add(cArm);
    const rider = makePerson({ shirt: 0x3b6fd8, s: 0.95 }); rider.position.set(-0.24, 0.93 - 0.92 * 0.95, 0); bike.add(rider);
    rider.body.rotation.z = -0.55; rider.arms.forEach((a) => { a.rotation.z = 1.25; });
    const aDrag = force(HEX.fric, 0.03, 0.14), aPush = force(HEX.push, 0.03, 0.14); tilt.add(aDrag, aPush);
    const lBike = stage.label('', [0, 0, 0], gB, 'hot'), lDrag = stage.label('', [0, 0, 0], gB);
    lBike.element.style.setProperty('--c', COL.push);
    let wheelA = 0, crankA = 0;
    let curB = null;
    const bBoard = board(gB, 2.1, 1.3, 800, 500, (g, w, h) => {
      panelBg(g, w, h); if (!curB) return;
      const { s } = curB;
      title(g, 'Power at the pedals', `on a ${s.slope}% slope`);
      const { X, Y } = axes(g, w, h, { x0: 96, y1: 90, xMax: 40, yMax: 800, xTicks: [0, 10, 20, 30, 40], yTicks: [0, 200, 400, 600, 800], xFmt: (v) => v + '', yFmt: (v) => v + ' W', xLabel: 'speed, km/h →' });
      g.fillStyle = 'rgba(92,225,169,.14)'; g.fillRect(X(0), Y(250), X(40) - X(0), Y(100) - Y(250));
      g.fillStyle = 'rgba(92,225,169,.9)'; g.font = '16px sans-serif'; g.fillText('most riders can hold 100–250 W', X(0.8), Y(250) - 8);
      const pts = [], air = []; for (let v = 0; v <= 40; v += 1) { pts.push([v, Math.min(800, bikePower(v / KMH, s.slope).P)]); air.push([v, Math.min(800, bikePower(v / KMH, 0).air * v / KMH / BIKE.eta)]); }
      line(g, air, X, Y, 'rgba(255,122,89,.6)', 3, [6, 6]);
      line(g, pts, X, Y, COL.push, 5);
      const P = bikePower(s.v / KMH, s.slope).P; if (P <= 800) dot(g, X(s.v), Y(P), COL.push, 9);
      g.fillStyle = 'rgba(255,122,89,.8)'; g.font = '15px sans-serif'; g.fillText('air drag alone', X(33), Y(Math.min(780, bikePower(33 / KMH, 0).air * 33 / KMH / BIKE.eta)) + 22);
    }, [2.2, 1.75, -1.4]);
    bBoard.mesh.rotation.y = -0.2; bBoard.mesh.scale.setScalar(0.8);

    // ================================================================ Watt's horse mill
    const floorH = new THREE.Mesh(new THREE.CircleGeometry(R_MILL + 1.2, 64), M.matte(0x6e5a3e)); floorH.rotation.x = -Math.PI / 2; floorH.position.y = 0.005; floorH.receiveShadow = true; gH.add(floorH);
    const track = new THREE.Mesh(new THREE.RingGeometry(R_MILL - 0.25, R_MILL + 0.25, 96), M.matte(0x57472f)); track.rotation.x = -Math.PI / 2; track.position.y = 0.01; gH.add(track);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 16), M.matte(0x8a6a48)); post.position.y = 1.1; gH.add(post);
    const stoneW = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.35, 32), M.matte(0x9b9385)); stoneW.position.y = 0.2; gH.add(stoneW);
    const sweep = new THREE.Group(); sweep.position.y = 1.55; gH.add(sweep);
    const bar = box(R_MILL, 0.1, 0.1, M.matte(0xa97a42)); bar.position.x = R_MILL / 2; sweep.add(bar);
    const horse = makeHorse(); sweep.add(horse); horse.position.set(R_MILL, -1.55, 0.55); horse.rotation.y = Math.PI / 2; horse.scale.setScalar(0.95);
    const trace = stage.label('', [0, 0, 0], gH);
    const aPull = force(HEX.push, 0.04, 0.2); gH.add(aPull);
    const lPull = stage.label('', [0, 0, 0], gH, 'hot'), lR = stage.label(`arm 12 ft = ${R_MILL.toFixed(2)} m`, [0, 0, 0], gH);
    lPull.element.style.setProperty('--c', COL.push);
    let millA = -1.2, gait = 0;

    // ================================================================ comparison board (stairs and horse)
    let curC = null;
    const cmp = board(root, 2.8, 2.1, 760, 570, (g, w, h) => {
      panelBg(g, w, h); if (!curC) return;
      title(g, 'Who makes how many watts?', 'log scale');
      const list = [...POWERS, { name: curC.name, W: curC.W, me: true }].sort((a, b) => a.W - b.W);
      const x0 = 270, x1 = w - 30, lo = 0, hi = 5.3, X = (W) => x0 + ((Math.log10(Math.max(1, W)) - lo) / (hi - lo)) * (x1 - x0);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.font = '15px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
      for (const [v, l] of [[1, '1 W'], [10, '10 W'], [100, '100 W'], [1000, '1 kW'], [1e4, '10 kW'], [1e5, '100 kW']]) { g.beginPath(); g.moveTo(X(v), 58); g.lineTo(X(v), h - 34); g.stroke(); g.fillText(l, X(v) - g.measureText(l).width / 2, h - 12); }
      const rowH = (h - 110) / list.length;
      list.forEach((it, i) => {
        const y = 66 + i * rowH;
        g.fillStyle = it.me ? COL.push : 'rgba(255,255,255,.72)'; g.font = (it.me ? 'bold ' : '') + '17px sans-serif';
        g.fillText(it.name, 16, y + rowH * 0.62);
        g.fillStyle = it.me ? COL.push : 'rgba(142,240,255,.55)'; g.fillRect(x0, y + 4, Math.max(3, X(it.W) - x0), rowH - 9);
        g.fillStyle = '#fff'; g.font = '14px sans-serif'; const t = fmtW(it.W); const tx = X(it.W) + 6; g.fillText(t, Math.min(tx, w - 8 - g.measureText(t).width), y + rowH * 0.62);
      });
    }, [0, 0, 0]);

    let focus = '', kB = '', kC = '', lastFloors = 0;
    const placeCmp = (s) => {
      if (s.focus === 'stairs') homeBoard(cmp, [RUN + 1.9, 1.5 * s.floors + 2.4, -2.4], -0.3, 0.9 + 0.35 * s.floors);
      else homeBoard(cmp, [HX + R_MILL - 0.4, 3.3, -3.2], -0.25, 1.3);
    };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lKid, lDrag, lR, lClock]);
        const moved = s.focus !== focus || (s.focus === 'stairs' && s.floors !== lastFloors);
        if (moved) {
          focus = s.focus; lastFloors = s.floors; Ls.reset();
          gS.visible = focus === 'stairs'; gB.visible = focus === 'bike'; gH.visible = focus === 'horse'; cmp.mesh.visible = focus !== 'bike';
          placeCmp(s);
          if (!inReel()) { const v = focus === 'stairs' ? stairsView(s.floors) : VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); }
        }
        reelBoards([[cmp, focus === 'stairs' ? [RUN / 2 + 1.0, 5.6, -1.2] : [HX + 0.7, 6.4, -1.2], focus === 'stairs' ? 1.45 : 1.9], [bBoard, [0.9, 2.55, -0.6], 0.8]]);

        if (focus === 'stairs') {
          flights.forEach((f, i) => { f.visible = i < s.floors; });
          const dur = Math.min(s.t, 8), k = Ls.tick(dt, dur), u = k * s.floors;
          const i = Math.min(s.floors - 1, Math.floor(u)), f = u - i, dir = i % 2 ? -1 : 1, x0 = i % 2 ? RUN : 0, z = i % 2 ? -1.25 : 0;
          const y = RISE * (i + f);
          kid.position.set(x0 + dir * f * RUN, y, z); kid.rotation.y = dir > 0 ? 0 : Math.PI;
          const ph = k < 1 ? u * STEPS * Math.PI : 0;
          kid.pose({ arm: 0.4 * Math.sin(ph), lean: k < 1 ? 0.18 : 0, stride: k < 1 ? 0.45 * Math.sin(ph) : 0 });
          hBar.aim([-0.9, 0, 0.6], [0, 1, 0], Math.max(0.001, y)); hBar.visible = y > 0.05;
          aWt.aim([kid.position.x, y + 1.0, z + 0.45], [0, -1, 0], s.m * G * 0.0012);
          const W = s.m * G * y;
          lHs.position.set(-1.35, y / 2 + 0.2, 0.6); lHs.element.innerHTML = `h = <b>${y.toFixed(1)} m</b>`;
          lKid.position.set(kid.position.x, y + 2.0, z); lKid.element.innerHTML = `m g = ${fmtN(s.m * G)} · work so far <b>${Math.round(W).toLocaleString('en-IN')} J</b>`;
          lClock.position.set(RUN / 2, -0.35, 1.0); lClock.element.innerHTML = `${(k * s.t).toFixed(1)} s of ${s.t} s${s.t > 8 ? ' (sped up)' : ''}`;
          const P = (s.m * G * RISE * s.floors) / s.t;
          curC = { name: 'you on the stairs', W: P };
          const kk = `st|${Math.round(P)}`; if (kk !== kC) { kC = kk; cmp.redraw(); }
        }

        if (focus === 'bike') {
          const v = s.v / KMH, b = bikePower(v, s.slope), a = Math.atan(s.slope / 100);
          tilt.rotation.z = a;
          dashes.forEach((d) => { d.position.x -= v * dt; if (d.position.x < -12) d.position.x += 24; });
          wheelA += (v / BIKE.R) * dt; wheels.forEach((w) => { w.rotation.z = -wheelA; });
          // gear: about 5.4 m per crank turn (44/16 on a 700c wheel)
          crankA += (v / 5.4) * TAU * dt; crank.rotation.z = -crankA;
          rider.legs[0].rotation.z = 0.45 + 0.4 * Math.sin(crankA); rider.legs[1].rotation.z = 0.45 - 0.4 * Math.sin(crankA);
          aDrag.aim([0.9, 1.25, 0], [-1, 0, 0], b.air * 0.02);
          aPush.aim([-0.1, 0.03, 0.3], [1, 0, 0], b.F * 0.012);
          lBike.position.set(0.1, -0.35, 0.6); lBike.element.innerHTML = `push needed <b>${fmtN(b.F)}</b> × ${v.toFixed(1)} m/s = <b>${fmtW(b.P * BIKE.eta)}</b>`;
          lDrag.position.set(1.55, 1.35, 0); lDrag.element.innerHTML = `air ${fmtN(b.air)}`;
          curB = { s };
          const kk = `${s.v}|${s.slope}`; if (kk !== kB) { kB = kk; bBoard.redraw(); }
        }

        if (focus === 'horse') {
          const { v, P } = horseP(s.F, s.n);
          millA += (v / R_MILL) * dt * 2.5; gait += (v / 0.9) * dt * 2.5 * 2.2;
          sweep.rotation.y = millA; horse.walk(gait); stoneW.rotation.y = millA;
          const c = Math.cos(millA), sn = Math.sin(millA);
          // the horse walks the circle; its pull on the arm is along its path (tangent)
          const px = R_MILL * c, pz = -R_MILL * sn, tx = -sn, tz = -c;
          aPull.aim([px + 0.3 * c, 1.55, pz - 0.3 * sn], [tx, 0, tz], s.F * 0.0016);
          lPull.position.set(px, 2.9, pz); lPull.element.innerHTML = `pull <b>${fmtN(s.F)}</b> at ${v.toFixed(2)} m/s`;
          lR.position.set(R_MILL * 0.5 * c, 1.9, -R_MILL * 0.5 * sn);
          trace.visible = false;
          curC = { name: 'this horse', W: P };
          const kk = `h|${Math.round(P)}`; if (kk !== kC) { kC = kk; cmp.redraw(); }
        }
      },
      readout: (s) => {
        if (s.focus === 'bike') {
          const v = s.v / KMH, b = bikePower(v, s.slope);
          return `<div class="big">Power = F × v = ${fmtW(b.P)}</div>
            <div class="row"><span>Rolling resistance</span><b>${fmtN(b.roll)}</b></div>
            <div class="row"><span>Climbing the ${s.slope}% hill</span><b>${fmtN(b.hill)}</b></div>
            <div class="row"><span>Air drag, ½ ρ CdA v²</span><b>${fmtN(b.air)}</b></div>
            <div class="row"><span>Total push × speed</span><b>${fmtN(b.F)} × ${v.toFixed(2)} m/s</b></div>
            <div class="row"><span>At the pedals (chain 97%)</span><b>${fmtW(b.P)}</b></div>
            <div class="row"><span>Your body burns about</span><b>${fmtW(b.P / BIKE.muscle)}</b></div>
            <small>Rider and bike 80 kg, sitting upright. Muscles turn about a quarter of food energy into work.</small>`;
        }
        if (s.focus === 'horse') {
          const { v, P } = horseP(s.F, s.n), ftlb = (P / (LBF * FT)) * 60;
          return `<div class="big">${fmtW(P)} = ${(P / HP).toFixed(2)} hp</div>
            <div class="row"><span>Pull on the arm</span><b>${fmtN(s.F)} (${Math.round(s.F / LBF)} lbf)</b></div>
            <div class="row"><span>Walking speed, 2π r × rounds</span><b>${v.toFixed(2)} m/s</b></div>
            <div class="row"><span>Power, F × v</span><b>${fmtW(P)}</b></div>
            <div class="row"><span>In Watt’s units</span><b>${Math.round(ftlb).toLocaleString('en-US')} ft·lbf/min</b></div>
            <small>Watt measured about 32,600 and rounded up to 33,000 ft·lbf/min: 1 hp = 745.7 W. Real horses can briefly make much more, over 10 hp in a sprint.</small>`;
        }
        const h = RISE * s.floors, W = s.m * G * h, P = W / s.t;
        return `<div class="big">Power = m g h ÷ t = ${fmtW(P)}</div>
          <div class="row"><span>Your weight, m g</span><b>${fmtN(s.m * G)}</b></div>
          <div class="row"><span>Height climbed</span><b>${h} m</b></div>
          <div class="row"><span>Work, m g h</span><b>${Math.round(W).toLocaleString('en-IN')} J</b></div>
          <div class="row"><span>Time</span><b>${s.t} s</b></div>
          <div class="row"><span>In horsepower</span><b>${(P / HP).toFixed(2)} hp</b></div>
          <small>That is only the work of lifting you. Your body burns about four times as much, and the rest becomes heat.</small>`;
      },
    };
  },
};
