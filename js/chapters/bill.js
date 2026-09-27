// Chapter 4: paying for work. Energy = power × time. The electricity board sells energy by the
// kilowatt-hour (the "unit"): 1 kWh = 1,000 W for 3,600 s = 3.6 MJ.
// Appliance powers (typical Indian homes; BEE star-label data and maker spec sheets):
//  - ceiling fan: about 75 W for an ordinary 1,200 mm fan, about 30 W for a BLDC fan (see FanClear);
//  - 1.5 ton split AC: about 1.5 kW while the compressor runs (see ACClear);
//  - storage geyser: 2 kW heating element (see WaterHeaterClear);
//  - LED bulb 9 W (five of them); LED TV about 70 W; mixer grinder 750 W (see MixerClear);
//  - 250 L frost-free fridge: its compressor cycles on and off; about 0.8 kWh a day on average, i.e. 33 W
//    (a 5-star model needs under about 163 kWh a year; see FridgeClear).
// Tariff: Indian home tariffs are roughly ₹3 to ₹9 per unit depending on the state and slab; ₹7 is used
// as a round example. A month is taken as 30 days.
// Electricity meter: older induction meters turn their aluminium disc a fixed number of times per kWh
// (the meter constant printed on the face, e.g. 600 rev/kWh). Modern meters blink an LED instead.
// Food: 1 kcal = 4,184 J, so 2,000 kcal = 8.37 MJ = 2.32 kWh, spread over 86,400 s ≈ 97 W.
// Petrol: about 32 MJ per litre = 8.9 kWh (CarClear). A 5,000 mAh phone battery at 3.85 V ≈ 19 Wh.
import { THREE, M, box, sphere, clamp } from '../kit.js';
import {
  G, TAU, KWH, KCAL, board, panelBg, title, COL, makePerson, fitNarrow, reelBoards, homeBoard, inReel, fmtW, rupees,
} from '../work.js';

const FX = 40, REV_PER_KWH = 600;
const VIEWS = {
  home: { pos: [0.9, 3.6, 7.6], target: [0.4, 2.0, -0.6] },
  food: { pos: [FX + 1.0, 2.0, 5.0], target: [FX + 0.9, 1.4, 0] },
};
// [key, name, watts or null, hours from settings, colour]
export function loads(s) {
  return [
    { k: 'fan', name: s.fanType === 30 ? 'BLDC ceiling fan' : 'ceiling fan', W: s.fanType, h: s.fanH, col: '#8ef0ff' },
    { k: 'ac', name: '1.5 ton AC', W: 1500, h: s.acH, col: '#7aa2ff' },
    { k: 'gey', name: 'geyser', W: 2000, h: s.geyH, col: '#ff7a59' },
    { k: 'led', name: '5 LED bulbs', W: 45, h: s.ledH, col: '#f5d547' },
    { k: 'tv', name: 'TV', W: 70, h: s.tvH, col: '#c49bff' },
    { k: 'mix', name: 'mixer grinder', W: 750, h: s.mixMin / 60, col: '#ffb547' },
    { k: 'fridge', name: 'fridge (average)', W: 33, h: 24, col: '#5ce1a9' },
  ].map((a) => ({ ...a, kwhDay: (a.W * a.h) / 1000, kwhMonth: (a.W * a.h * 30) / 1000 }));
}
export function bill(s) {
  const L = loads(s), day = L.reduce((t, a) => t + a.kwhDay, 0), on = L.filter((a) => a.h > 0).reduce((t, a) => t + a.W, 0);
  return { L, day, month: day * 30, cost: day * 30 * s.tariff, on };
}

export default {
  id: 'bill',
  short: 'Paying for work',
  title: 'Paying for work: watts, units and food',
  subtitle: 'Your electricity bill and your lunch are both counted in energy.',
  view: VIEWS.home,
  learn: `<p>The electricity board doesn’t charge you for power. It charges for <b>energy</b>: how many joules your appliances use. Energy = <b>power × time</b>. Joules are tiny, so the bill counts <b>kilowatt-hours</b> (kWh), the “units” on your bill: 1,000 W running for one hour. <b>1 kWh = 3.6 MJ</b>, 3.6 million joules.</p>
    <p>A <b>ceiling fan</b> draws about 75 W (a BLDC fan about 30 W, see FanClear). A <b>1.5 ton AC</b> draws about 1,500 W, twenty fans’ worth (see ACClear). A <b>geyser</b> heats with a 2,000 W element (see WaterHeaterClear), so half an hour a day uses as much as a fan running for 13 hours. What decides the bill is <b>watts × hours</b>.</p>
    <p>The meter measures it. In an older meter an aluminium <b>disc</b> spins faster the more power you draw, turning a fixed number of times for every kWh. Modern meters blink a light instead. BEE’s <b>star labels</b> tell you how many units a year an appliance needs.</p>
    <p><b>Food</b> is energy too. The food Calorie on a packet is a kilocalorie: 4,184 J. A 2,000 kcal day is <b>8.4 MJ</b>, about 2.3 kWh. Spread over 24 hours, that is about <b>97 W</b>: you run on roughly the power of an old light bulb.</p>
    <p class="tip"><b>Try it:</b> run the AC longer and watch the meter disc speed up and the bill climb. Swap to a BLDC fan. Then switch to Food and see how many units of electricity your meals are worth.</p>`,
  terms: [
    { t: 'Kilowatt-hour (kWh)', d: 'The energy used by 1,000 W in one hour: 3.6 MJ. One “unit” on an electricity bill.' },
    { t: 'Energy = power × time', d: 'Watts times seconds gives joules; kilowatts times hours gives kWh.' },
    { t: 'Tariff', d: 'The price of one unit of electricity, in rupees per kWh.' },
    { t: 'Electricity meter', d: 'Counts the energy you use, in kWh, by adding up power over time.' },
    { t: 'Kilocalorie (kcal)', d: 'The “Calorie” on food labels: 4,184 J of energy.' },
    { t: 'BEE star label', d: 'India’s energy label: more stars means fewer units a year for the same job.' },
  ],
  defaults: { focus: 'home', fanType: 75, fanH: 12, acH: 6, geyH: 0.5, ledH: 6, tvH: 3, mixMin: 10, tariff: 7, kcal: 2000 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'home', label: 'Home bill' }, { v: 'food', label: 'Food' }] },
    { key: 'fanType', type: 'seg', label: 'Ceiling fan', options: [{ v: 75, label: 'Ordinary, 75 W' }, { v: 30, label: 'BLDC, 30 W' }] },
    { key: 'fanH', type: 'range', label: 'Fan: hours a day', min: 0, max: 24, step: 1, ends: ['off', '24 h'], fmt: (v) => v + ' h' },
    { key: 'acH', type: 'range', label: 'AC: hours a day', min: 0, max: 16, step: 0.5, ends: ['off', '16 h'], fmt: (v) => v + ' h' },
    { key: 'geyH', type: 'range', label: 'Geyser: hours a day', min: 0, max: 3, step: 0.25, ends: ['off', '3 h'], fmt: (v) => v + ' h' },
    { key: 'ledH', type: 'range', label: 'Lights: hours a day', min: 0, max: 12, step: 1, ends: ['off', '12 h'], fmt: (v) => v + ' h' },
    { key: 'tvH', type: 'range', label: 'TV: hours a day', min: 0, max: 10, step: 0.5, ends: ['off', '10 h'], fmt: (v) => v + ' h' },
    { key: 'mixMin', type: 'range', label: 'Mixer: minutes a day', min: 0, max: 30, step: 1, ends: ['off', '30 min'], fmt: (v) => v + ' min' },
    { key: 'tariff', type: 'range', label: 'Price per unit', min: 3, max: 12, step: 0.5, ends: ['₹3', '₹12'], fmt: (v) => '₹' + v + ' per kWh' },
    { key: 'kcal', type: 'range', label: 'Food: what you eat in a day', min: 1200, max: 3500, step: 50, ends: ['1,200 kcal', '3,500 kcal'], fmt: (v) => v.toLocaleString('en-IN') + ' kcal' },
  ],
  onChange(s, key) {
    if (['fanType', 'fanH', 'acH', 'geyH', 'ledH', 'tvH', 'mixMin', 'tariff'].includes(key)) s.focus = 'home';
    if (key === 'kcal') s.focus = 'food';
  },
  quiz: [
    { q: 'How many joules are there in 1 kWh?', options: ['1,000 J', '3,600 J', '3.6 million J', '60,000 J'], answer: 2, why: '1 kWh = 1,000 W × 3,600 s = 3,600,000 J = 3.6 MJ.' },
    { q: 'A 2,000 W geyser runs for 30 minutes a day. How many units does it use in a 30-day month?', options: ['1 unit', '30 units', '60 units', '2,000 units'], answer: 1, why: '2 kW × 0.5 h = 1 kWh a day, and 30 days make 30 kWh, or 30 units.' },
    { q: 'You eat about 2,000 kcal a day. What is your average power?', options: ['About 2 W', 'About 97 W', 'About 2,000 W', 'About 8,400 W'], answer: 1, why: '2,000 × 4,184 J = 8.4 MJ, divided by 86,400 seconds in a day ≈ 97 W.' },
  ],
  reel: [
    { ms: 5600, caption: 'A 1.5 kW AC running 6 hours a day uses 270 units a month: about ₹1,900 at ₹7 a unit.', set: { focus: 'home', acH: 6, tariff: 7 }, view: { pos: [0.3, 4.0, 5.4], target: [0, 2.4, 0] }, spin: 0 },
    { ms: 5400, caption: 'Your 2,000 kcal of food a day is 8.4 megajoules: you run at about 97 watts.', set: { focus: 'food', kcal: 2000 }, view: { pos: [FX + 0.3, 2.6, 2.9], target: [FX + 0.2, 2.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gH = new THREE.Group(), gF = new THREE.Group(); gF.position.x = FX; root.add(gH, gF);
    const white = M.plastic(0xeef1f5, { roughness: 0.4 }), grey = M.plastic(0x9aa3b2), wallM = M.clear(0xcfd6e2, 0.14);

    // ================================================================ a room
    const floorR = box(6, 0.04, 4, M.matte(0x4a4f5b)); floorR.position.set(0, 0.02, 0); gH.add(floorR);
    const back = box(6, 3, 0.06, wallM); back.position.set(0, 1.5, -2); gH.add(back);
    const left = box(0.06, 3, 4, wallM); left.position.set(-3, 1.5, 0); gH.add(left);
    // ceiling fan
    const fan = new THREE.Group(); fan.position.set(0.6, 2.75, -0.2); gH.add(fan);
    const rod = box(0.03, 0.3, 0.03, grey); rod.position.y = 0.15; fan.add(rod);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.1, 24), white); fan.add(hub);
    const blades = new THREE.Group(); fan.add(blades);
    for (let i = 0; i < 3; i++) { const b = box(0.55, 0.012, 0.1, M.plastic(0xd8dde6)); b.position.x = 0.38; const h = new THREE.Group(); h.rotation.y = (i / 3) * TAU; h.add(b); b.rotation.x = 0.12; blades.add(h); }
    // split AC indoor unit
    const ac = box(0.95, 0.3, 0.22, white); ac.position.set(1.6, 2.4, -1.86); gH.add(ac);
    const acLed = box(0.04, 0.02, 0.01, M.glow(0x5ce1a9)); acLed.position.set(2.0, 2.3, -1.745); gH.add(acLed);
    const vane = box(0.85, 0.02, 0.06, grey); vane.position.set(1.6, 2.26, -1.73); vane.rotation.x = 0.5; gH.add(vane);
    // geyser on the left wall
    const gey = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 24), white); gey.position.set(-2.72, 2.05, -1.2); gey.castShadow = true; gH.add(gey);
    const geyLamp = sphere(0.025, M.glow(0xff3b30), 12); geyLamp.position.set(-2.52, 1.95, -1.2); gH.add(geyLamp);
    // fridge, counter with mixer, TV, bulbs
    const fridge = box(0.62, 1.6, 0.62, M.plastic(0xc9ced8)); fridge.position.set(-2.55, 0.8, 0.4); gH.add(fridge);
    const fh = box(0.02, 0.4, 0.04, grey); fh.position.set(-2.22, 1.1, 0.6); gH.add(fh);
    const counter = box(1.3, 0.85, 0.55, M.matte(0x8a6a48)); counter.position.set(-1.2, 0.425, -1.7); gH.add(counter);
    const mixer = new THREE.Group(); mixer.position.set(-1.0, 0.85, -1.7); gH.add(mixer);
    const mBase = box(0.25, 0.18, 0.2, white); mBase.position.y = 0.09; mixer.add(mBase);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.2, 16), M.clear(0xdfefff, 0.5)); jar.position.y = 0.28; mixer.add(jar);
    const tv = box(1.0, 0.58, 0.04, M.matte(0x111318)); tv.position.set(0.1, 1.55, -1.95); gH.add(tv);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.52), M.glow(0x4a78c8)); screen.position.set(0.1, 1.55, -1.925); gH.add(screen);
    const bulbs = [[-1.8, 0.6], [1.8, 0.6], [-0.9, -1.2], [2.3, -1.3], [0, 1.5]].map(([x, z]) => { const b = sphere(0.05, M.glow(0xfff2c8), 12); b.position.set(x, 2.93, z); gH.add(b); return b; });
    // the meter, on the left wall
    const meter = new THREE.Group(); meter.position.set(-2.93, 1.55, 1.3); meter.rotation.y = Math.PI / 2; gH.add(meter);
    const mBox = box(0.3, 0.42, 0.12, M.plastic(0x2a2f39)); mBox.position.z = 0.06; meter.add(mBox);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), M.clear(0xdfefff, 0.25)); win.position.set(0, -0.08, 0.125); meter.add(win);
    const disc = new THREE.Group(); disc.position.set(0, -0.1, 0.1); meter.add(disc);
    const discM = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.006, 32), M.metal(0xc9ced8)); disc.add(discM);
    const mark = box(0.03, 0.008, 0.012, M.glow(0xff3b30)); mark.position.set(0, 0.004, 0.08); disc.add(mark);
    const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), M.glow(0x5ce1a9, { transparent: true, opacity: 0.9 })); dial.position.set(0, 0.1, 0.125); meter.add(dial);
    const lMeter = stage.label('', [-2.85, 2.0, 1.3], gH, 'hot'), lAC = stage.label('', [1.6, 2.75, -1.8], gH), lGey = stage.label('', [-2.5, 2.5, -1.2], gH), lFan = stage.label('', [0.6, 2.55, 0.4], gH);
    lMeter.element.style.setProperty('--c', COL.acc);

    // ================================================================ food: you are a 97 W machine
    const kid = makePerson({ shirt: 0xe0663a, s: 1 }); kid.position.set(0, 0, 0.1); kid.rotation.y = -0.35; gF.add(kid);
    kid.arms[1].rotation.z = 1.0;
    const table = box(1.0, 0.75, 0.6, M.matte(0x8a6a48)); table.position.set(1.0, 0.375, -0.1); gF.add(table);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.03, 32), M.metal(0xd8dde6)); plate.position.set(0.9, 0.77, -0.05); gF.add(plate);
    const foodBits = [[0.84, -0.1, 0xf2e3b3], [0.96, 0.0, 0xe8b04a], [0.92, -0.14, 0x6aa84f], [0.82, 0.04, 0xd8c28a]].map(([x, z, c]) => { const m = sphere(0.045, M.matte(c), 12); m.scale.y = 0.5; m.position.set(x, 0.8, z); gF.add(m); return m; });
    const lampPole = box(0.04, 1.9, 0.04, grey); lampPole.position.set(-0.9, 0.95, -0.4); gF.add(lampPole);
    const oldBulb = sphere(0.12, M.glow(0xffd98a), 24); oldBulb.position.set(-0.9, 2.0, -0.4); gF.add(oldBulb);
    const glowL = new THREE.PointLight(0xffc870, 2.5, 4); glowL.position.copy(oldBulb.position); gF.add(glowL);
    const lYou = stage.label('', [0, 2.05, 0.1], gF, 'hot'), lBulb = stage.label('old 100 W bulb', [-0.9, 2.35, -0.4], gF);
    lYou.element.style.setProperty('--c', COL.push);

    // ================================================================ boards
    let cur = null;
    const bd = board(root, 2.9, 1.9, 820, 540, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      const { s } = cur;
      if (s.focus === 'food') {
        const kwh = (s.kcal * KCAL) / KWH;
        title(g, 'Energy in kilowatt-hours', '1 kWh = 3.6 MJ');
        const rows = [
          { name: `your food, ${s.kcal.toLocaleString('en-IN')} kcal`, v: kwh, col: COL.push },
          { name: 'AC for 1 hour', v: 1.5, col: '#7aa2ff' },
          { name: 'geyser for 30 minutes', v: 1.0, col: '#ff7a59' },
          { name: 'fan all day (75 W, 24 h)', v: 1.8, col: '#8ef0ff' },
          { name: 'a litre of petrol', v: 8.9, col: '#c49bff' },
          { name: 'charging a phone', v: 0.019, col: '#5ce1a9' },
        ];
        const max = 9, x0 = 330, x1 = w - 90;
        rows.forEach((r, i) => {
          const y = 78 + i * 72;
          g.fillStyle = 'rgba(255,255,255,.8)'; g.font = (i ? '' : 'bold ') + '19px sans-serif'; g.fillText(r.name, 18, y + 28);
          g.fillStyle = r.col; g.fillRect(x0, y + 8, Math.max(3, (r.v / max) * (x1 - x0)), 32);
          g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.fillText(r.v < 0.1 ? r.v.toFixed(3) + ' kWh' : r.v.toFixed(1) + ' kWh', x0 + Math.max(3, (r.v / max) * (x1 - x0)) + 8, y + 31);
        });
        return;
      }
      const b = bill(s);
      title(g, 'Units a month', `at ₹${s.tariff} per kWh`);
      const max = Math.max(50, ...b.L.map((a) => a.kwhMonth)), x0 = 240, x1 = w - 170;
      b.L.forEach((a, i) => {
        const y = 66 + i * 58;
        g.fillStyle = a.h > 0 ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.35)'; g.font = '18px sans-serif'; g.fillText(a.name, 18, y + 26);
        g.fillStyle = a.col; g.fillRect(x0, y + 8, Math.max(2, (a.kwhMonth / max) * (x1 - x0)), 28);
        g.fillStyle = '#fff'; g.font = 'bold 17px sans-serif'; g.fillText(`${Math.round(a.kwhMonth)} kWh · ${rupees(a.kwhMonth * s.tariff)}`, x0 + Math.max(2, (a.kwhMonth / max) * (x1 - x0)) + 8, y + 29);
      });
      g.fillStyle = COL.acc; g.font = 'bold 30px sans-serif'; g.fillText(`${Math.round(b.month)} units a month = ${rupees(b.cost)}`, 18, h - 22);
    }, [0, 0, 0]);

    let focus = '', key = '', discA = 0, t = 0;
    const place = () => {
      if (focus === 'home') homeBoard(bd, [3.3, 3.55, -2.2], -0.2, 0.85);
      else homeBoard(bd, [FX + 2.3, 1.75, -1.2], -0.3, 0.8);
    };
    return {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const narrow = fitNarrow(stage, [lAC, lGey, lFan, lBulb]);
        if (s.focus !== focus) {
          focus = s.focus; gH.visible = focus === 'home'; gF.visible = focus === 'food'; place();
          if (!inReel()) { const v = VIEWS[focus]; stage.setView(v.pos, v.target, 1.0); }
        }
        reelBoards([[bd, focus === 'home' ? [0, 4.7, -1.2] : [FX + 0.2, 3.3, -0.6], focus === 'home' ? 1.45 : 0.95]]);
        if (focus === 'home') {
          const b = bill(s), on = Object.fromEntries(b.L.map((a) => [a.k, a.h > 0]));
          if (on.fan) blades.rotation.y += dt * (s.fanType === 30 ? 5.5 : 6);
          acLed.visible = on.ac; vane.rotation.x = on.ac ? 0.9 : 0.1;
          geyLamp.visible = on.gey; screen.visible = on.tv; bulbs.forEach((x) => { x.visible = on.led; });
          if (on.mix) jar.rotation.y += dt * 20;
          // disc: REV_PER_KWH turns per kWh → rev/s = kW × REV_PER_KWH / 3600
          discA += ((b.on / 1000) * REV_PER_KWH / 3600) * TAU * dt; disc.rotation.y = discA;
          lMeter.element.innerHTML = `meter: <b>${fmtW(b.on)}</b> now · disc ${(b.on / 1000 * REV_PER_KWH / 60).toFixed(1)} turns a minute`;
          lAC.element.innerHTML = on.ac ? 'AC 1,500 W' : 'AC off'; lGey.element.innerHTML = on.gey ? 'geyser 2,000 W' : 'geyser off';
          lFan.element.innerHTML = on.fan ? `fan ${s.fanType} W` : 'fan off';
        } else {
          const P = (s.kcal * KCAL) / 86400;
          lYou.element.innerHTML = `you: <b>${fmtW(P)}</b> on average`;
          glowL.intensity = 2 + 0.3 * Math.sin(t * 3);
          kid.arms[1].rotation.z = 0.9 + 0.25 * Math.max(0, Math.sin(t * 2));
          foodBits.forEach((f) => { f.visible = true; });
        }
        cur = { s };
        const kk = JSON.stringify(s);
        if (kk !== key) { key = kk; bd.redraw(); }
        void narrow; void clamp; void G;
      },
      readout: (s) => {
        if (s.focus === 'food') {
          const J = s.kcal * KCAL, kwh = J / KWH, P = J / 86400;
          return `<div class="big">${s.kcal.toLocaleString('en-IN')} kcal ≈ ${(J / 1e6).toFixed(1)} MJ ≈ ${fmtW(P)}</div>
            <div class="row"><span>In joules, × 4,184</span><b>${(J / 1e6).toFixed(2)} MJ</b></div>
            <div class="row"><span>In units, ÷ 3.6 MJ</span><b>${kwh.toFixed(2)} kWh</b></div>
            <div class="row"><span>Average power, ÷ 86,400 s</span><b>${fmtW(P)}</b></div>
            <div class="row"><span>Same energy as the AC for</span><b>${(kwh / 1.5).toFixed(1)} h</b></div>
            <div class="row"><span>Bought as electricity at ₹${s.tariff}</span><b>${rupees(kwh * s.tariff)}</b></div>
            <small>Most of it keeps you warm and alive. Muscles turn only about a quarter of what they burn into work.</small>`;
        }
        const b = bill(s);
        return `<div class="big">${Math.round(b.month)} units ≈ ${rupees(b.cost)} a month</div>
          <div class="row"><span>Everything on at once</span><b>${fmtW(b.on)}</b></div>
          <div class="row"><span>Energy a day</span><b>${b.day.toFixed(1)} kWh = ${(b.day * 3.6).toFixed(0)} MJ</b></div>
          <div class="row"><span>Energy a month (30 days)</span><b>${Math.round(b.month)} kWh</b></div>
          <div class="row"><span>Biggest user</span><b>${[...b.L].sort((x, y) => y.kwhMonth - x.kwhMonth)[0].name}</b></div>
          <div class="row"><span>Price per unit</span><b>₹${s.tariff}</b></div>
          <small>Energy = power × time. A 2 kW geyser for half an hour uses as much as a 75 W fan for 13 hours.</small>`;
      },
    };
  },
};
