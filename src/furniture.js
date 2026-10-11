import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { screenMat } from './materials.js';
import { monitorMain, monitorSide, tvScreen, laptopScreen } from './art.js';

const rbGeo = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, Math.max(0.002, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)));

function add(g, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m;
}
const box = (g, mat, w, h, d, x, y, z, r = 0.02) => add(g, rbGeo(w, h, d, r), mat, x, y, z);
const cyl = (g, mat, rt, rb, h, x, y, z, seg = 28) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
const sph = (g, mat, r, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = add(g, new THREE.SphereGeometry(r, 24, 16), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
const cone = (g, mat, r, h, x, y, z, seg = 12) => add(g, new THREE.ConeGeometry(r, h, seg), mat, x, y, z);
const grp = (g, x = 0, y = 0, z = 0, ry = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
const matCache = new Map();
const col = (c, rough = 0.5) => { const k = c + rough; if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: rough })); return matCache.get(k); };
const glow = (c) => { const k = 'glow' + c; if (!matCache.has(k)) matCache.set(k, new THREE.MeshBasicMaterial({ color: c })); return matCache.get(k); };
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const PASTEL = ['#f59bb8', '#ffd27a', '#8fd0c0', '#c8b0e6', '#ff8a65', '#fff', '#7ab8ff', '#e0344e', '#f6efe6', '#3b3442'];

// small anime figure on a round base
const figMats = ['#f5a9c8', '#b8a6e8', '#2e2839', '#fff', '#8fd0c0', '#ffd27a', '#ff8a65'].map((c) => col(c, 0.45));
const skin = col('#ffe8de', 0.6);
function figure(g, M, x, y, z, i, s = 1) {
  const m = figMats[i % figMats.length];
  cyl(g, M.white, 0.035 * s, 0.035 * s, 0.012 * s, x, y + 0.006 * s, z, 16);
  cone(g, m, 0.035 * s, 0.1 * s, x, y + 0.06 * s, z);
  sph(g, skin, 0.03 * s, x, y + 0.13 * s, z);
  add(g, new THREE.SphereGeometry(0.033 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), m, x, y + 0.135 * s, z);
}

// ---------- cats ----------
function makeCat(M, parent, fur, { x = 0, y = 0, z = 0, s = 1, ry = 0, pose = 'sleep', patch = null } = {}) {
  const c = grp(parent, x, y, z, ry); c.scale.setScalar(s);
  const ear = (hx, hy, hz, side, mat = fur) => {
    const e = cone(c, mat, 0.042, 0.08, hx, hy, hz, 4); e.rotation.set(-0.15, Math.PI / 4, side * 0.3);
    const i = cone(c, M.catPink, 0.022, 0.05, hx, hy - 0.01, hz + 0.014, 4); i.rotation.copy(e.rotation);
  };
  const face = (hx, hy, hz, open) => {
    for (const sx of [-1, 1]) {
      if (open) { sph(c, M.catEye, 0.019, hx + sx * 0.042, hy + 0.012, hz, 1, 1.1, 0.6); sph(c, M.ink, 0.008, hx + sx * 0.042, hy + 0.012, hz + 0.009, 0.6, 1.5, 0.5); }
      else { const l = box(c, M.ink, 0.032, 0.006, 0.006, hx + sx * 0.042, hy + 0.01, hz, 0.002); l.rotation.z = sx * 0.25; }
    }
    sph(c, M.catPink, 0.011, hx, hy - 0.018, hz + 0.004, 1.2, 0.8, 1);
  };
  if (pose === 'sleep') {
    sph(c, fur, 0.2, 0, 0.1, 0, 1.15, 0.5, 0.95);
    if (patch) { sph(c, patch, 0.13, -0.09, 0.14, -0.05, 1, 0.45, 1); sph(c, patch, 0.07, 0.1, 0.13, -0.1, 1, 0.5, 1); }
    const hx = 0.1, hy = 0.15, hz = 0.1;
    sph(c, fur, 0.1, hx, hy, hz, 1.1, 0.9, 1);
    ear(hx - 0.055, hy + 0.08, hz - 0.02, -1, patch || fur); ear(hx + 0.055, hy + 0.08, hz - 0.02, 1);
    face(hx, hy, hz + 0.092, false);
    const tail = add(c, new THREE.TorusGeometry(0.2, 0.035, 8, 20, Math.PI * 0.95), fur, 0, 0.045, 0);
    tail.rotation.set(-Math.PI / 2, 0, Math.PI * 0.55);
  } else if (pose === 'sit') {
    sph(c, fur, 0.13, 0, 0.14, 0, 1, 1.15, 0.95);
    sph(c, fur, 0.09, 0, 0.2, 0.06, 1, 1.1, 0.8);
    for (const sx of [-1, 1]) sph(c, fur, 0.035, sx * 0.05, 0.025, 0.1, 1, 0.8, 1.4);
    sph(c, fur, 0.1, 0, 0.34, 0.04, 1.1, 0.95, 1);
    ear(-0.058, 0.42, 0.02, -1); ear(0.058, 0.42, 0.02, 1);
    face(0, 0.34, 0.132, true);
    const tail = add(c, new THREE.TorusGeometry(0.13, 0.025, 8, 18, Math.PI), fur, 0.02, 0.03, 0.0);
    tail.rotation.set(-Math.PI / 2, 0, Math.PI * 0.1);
  } else { // loaf
    sph(c, fur, 0.18, 0, 0.11, 0, 0.9, 0.62, 1.25);
    if (patch) sph(c, patch, 0.12, 0.05, 0.16, -0.05, 1, 0.5, 1.2);
    sph(c, fur, 0.1, 0, 0.2, 0.2, 1.1, 0.95, 1);
    ear(-0.058, 0.28, 0.18, -1); ear(0.058, 0.28, 0.18, 1);
    face(0, 0.2, 0.292, false);
  }
  return c;
}

// kawaii plush cat: big round head, tiny body
function plushCat(M, parent, fur, { x = 0, y = 0, z = 0, s = 1, ry = 0, yellow = false } = {}) {
  const c = grp(parent, x, y, z, ry); c.scale.setScalar(s);
  sph(c, fur, 0.1, 0, 0.08, -0.03, 1.1, 0.85, 1);
  for (const sx of [-1, 1]) sph(c, fur, 0.04, sx * 0.06, 0.03, 0.07);
  sph(c, fur, 0.14, 0, 0.2, 0, 1.18, 0.95, 0.92);
  for (const sx of [-1, 1]) {
    const e = cone(c, fur, 0.055, 0.09, sx * 0.1, 0.32, 0, 4); e.rotation.set(0, Math.PI / 4, -sx * 0.35);
    const i = cone(c, M.catPink, 0.03, 0.055, sx * 0.1, 0.31, 0.02, 4); i.rotation.copy(e.rotation);
    if (yellow) { sph(c, M.catEye, 0.03, sx * 0.058, 0.21, 0.115, 1, 1.1, 0.5); sph(c, M.ink, 0.013, sx * 0.058, 0.21, 0.128, 0.7, 1.3, 0.4); }
    else sph(c, M.ink, 0.017, sx * 0.058, 0.21, 0.12, 1, 1.2, 0.6);
    sph(c, M.catPink, 0.022, sx * 0.1, 0.17, 0.105, 1, 0.6, 0.4);
  }
  sph(c, M.catPink, 0.01, 0, 0.18, 0.13);
  return c;
}

// long cat body pillow lying along x
function catPillow(M, g, x, y, z, len, ry = 0) {
  const c = grp(g, x, y, z, ry);
  const body = add(c, new THREE.CapsuleGeometry(0.12, len, 8, 16), M.plush, 0, 0, 0); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.8);
  const hx = len / 2 + 0.05;
  sph(c, M.plush, 0.15, hx, 0.03, 0, 1, 0.95, 0.85);
  for (const sz of [-1, 1]) {
    const e = cone(c, M.plush, 0.05, 0.09, hx + 0.02, 0.17, sz * 0.07, 4); e.rotation.set(sz * 0.3, Math.PI / 4, 0);
    sph(c, M.ink, 0.016, hx + 0.1, 0.06, sz * 0.05, 0.6, 1.2, 1);
    sph(c, M.catPink, 0.02, hx + 0.1, 0.0, sz * 0.09, 0.5, 0.6, 1);
  }
  sph(c, M.plush, 0.04, -len / 2 - 0.13, -0.02, 0.02, 1.6, 0.8, 0.8);   // tail tip
  return c;
}

// generic small props
const phone = (M, g, x, y, z, ry = 0) => { const p = box(g, M.dark, 0.075, 0.009, 0.15, x, y + 0.005, z, 0.004); p.rotation.y = ry; return p; };
const book = (g, x, y, z, w, h, d, c, ry = 0) => { const b = box(g, col(c, 0.8), w, h, d, x, y + h / 2, z, 0.004); b.rotation.y = ry; return b; };
const cupStraw = (M, g, x, y, z, drink = '#f59bb8', straw = '#8fd0c0') => {
  cyl(g, M.glass, 0.035, 0.03, 0.12, x, y + 0.06, z, 14); cyl(g, col(drink, 0.3), 0.031, 0.028, 0.08, x, y + 0.045, z, 14);
  const s = cyl(g, col(straw, 0.4), 0.005, 0.005, 0.16, x + 0.01, y + 0.13, z, 6); s.rotation.z = -0.2;
};
const polaroid = (g, x, y, z, c, ry = 0) => { const p = grp(g, x, y, z, ry); box(p, col('#fbf8f4', 0.8), 0.07, 0.003, 0.085, 0, 0.0015, 0, 0.001); box(p, col(c, 0.5), 0.058, 0.001, 0.058, 0, 0.0035, -0.008, 0.0005); };
const bottle = (g, x, y, z, c, h = 0.22, r = 0.03) => { cyl(g, col(c, 0.2), r, r, h * 0.7, x, y + h * 0.35, z, 14); cyl(g, col(c, 0.2), r * 0.4, r, h * 0.2, x, y + h * 0.8, z, 14); cyl(g, col('#fff', 0.4), r * 0.45, r * 0.45, h * 0.1, x, y + h * 0.95, z, 10); };
const can = (g, x, y, z, c) => { cyl(g, col(c, 0.3), 0.028, 0.028, 0.1, x, y + 0.05, z, 14); cyl(g, col('#d8d8de', 0.3), 0.024, 0.028, 0.008, x, y + 0.104, z, 14); };
const chips = (g, x, y, z, c, ry = 0) => { const b = box(g, col(c, 0.35), 0.14, 0.2, 0.05, x, y + 0.1, z, 0.02); b.rotation.set(0.12, ry, 0); b.scale.z = 1.3; };
const candyJar = (M, g, x, y, z) => { cyl(g, M.glass, 0.05, 0.05, 0.12, x, y + 0.06, z, 16); const r = seeded((x * 999 | 0) + 7); for (let i = 0; i < 8; i++) sph(g, col(PASTEL[i % 8], 0.4), 0.014, x + (r() - .5) * 0.06, y + 0.02 + r() * 0.06, z + (r() - .5) * 0.06); cyl(g, M.gold, 0.052, 0.052, 0.015, x, y + 0.125, z, 16); };

// ---------- the pieces (origin = floor centre, front faces +z) ----------
export function createFurniture(M, lamps) {
  const lamp = (g, x, y, z, intensity, color = '#ffc88a', dist = 6, extra = {}) => {
    const l = new THREE.PointLight(color, 0, dist, 2); l.position.set(x, y, z); g.add(l);
    lamps.push({ light: l, base: intensity, ...extra }); return l;
  };
  const warmStrip = (g, w, y, z, x = 0) => box(g, M.ledWarm, w, 0.012, 0.012, x, y, z, 0.003);

  const defs = [];
  const def = (key, name, w, d, build, pos, rot = 0, opts = {}) => defs.push({ key, name, w, d, build, pos, rot, ...opts });

  /* ================================================================ 睡眠區（左後） */
  def('bed', '雙人床', 2.1, 2.4, (g) => {
    box(g, M.wood, 2.1, 0.3, 2.3, 0, 0.19, 0.05, 0.03);
    for (const zz of [-0.45, 0.55]) { box(g, M.paint, 0.02, 0.2, 0.85, 1.055, 0.18, zz, 0.008); box(g, M.gold, 0.015, 0.02, 0.18, 1.07, 0.24, zz, 0.005); }
    warmStrip(g, 2.0, 0.03, 1.19); box(g, M.ledWarm, 0.012, 0.012, 2.2, 1.04, 0.03, 0.05, 0.003);
    box(g, M.wood, 2.14, 1.1, 0.1, 0, 0.55, -1.14, 0.04);
    for (const xx of [-0.68, 0, 0.68]) box(g, M.fabric, 0.62, 0.5, 0.08, xx, 0.82, -1.06, 0.07);
    box(g, M.white, 1.96, 0.24, 2.12, 0, 0.46, 0.08, 0.08);
    box(g, M.fabric, 2.02, 0.1, 1.45, 0, 0.6, 0.45, 0.05);
    for (const sx of [-1, 1]) box(g, M.fabric, 0.03, 0.3, 1.4, sx * 1.0, 0.47, 0.45, 0.012);
    box(g, M.plaid, 1.9, 0.06, 0.45, 0, 0.68, 0.98, 0.025);
    for (const sx of [-0.46, 0.46]) { const p = box(g, M.white, 0.8, 0.15, 0.42, sx, 0.66, -0.82, 0.07); p.rotation.x = -0.2; }
    const p1 = box(g, M.accent, 0.4, 0.38, 0.12, 0.72, 0.8, -0.62, 0.06); p1.rotation.set(-0.35, -0.2, 0);
    catPillow(M, g, 0.05, 0.74, -0.3, 0.8, 0.1);
    plushCat(M, g, M.catBlack, { x: -0.72, y: 0.66, z: -0.55, s: 0.9, ry: 0.3, yellow: true });
    book(g, -0.45, 0.65, 0.35, 0.18, 0.03, 0.24, '#8fd0c0', 0.4); phone(M, g, -0.1, 0.65, 0.6, -0.3);
  }, [-3.4, -2.75], 0);

  const nightstand = (g, variant) => {
    box(g, M.wood, 0.45, 0.54, 0.45, 0, 0.3, 0, 0.025);
    for (const y of [0.18, 0.41]) { box(g, M.paint, 0.4, 0.18, 0.02, 0, y, 0.235, 0.01); sph(g, M.gold, 0.014, 0, y, 0.255); }
    for (const sx of [-0.19, 0.19]) for (const sz of [-0.19, 0.19]) cyl(g, M.gold, 0.012, 0.01, 0.04, sx, 0.02, sz, 8);
    cyl(g, M.ceramic, 0.05, 0.07, 0.2, -0.08, 0.67, -0.08, 20);
    add(g, new THREE.CylinderGeometry(0.09, 0.13, 0.16, 24, 1, true), M.paper, -0.08, 0.85, -0.08);
    lamp(g, 0.05, 1.1, 0.35, 1.3, '#ffc07a', 4);
    phone(M, g, 0.1, 0.57, 0.1, 0.3);
    const cable = box(g, M.white, 0.006, 0.004, 0.2, 0.12, 0.574, -0.05, 0.001); cable.rotation.y = 0.5;
    if (variant) {
      sph(g, M.bulbSoft, 0.05, 0.12, 0.62, -0.1, 1, 0.9, 1);                // cat night light
      for (const sx of [-1, 1]) { const e = cone(g, M.bulbSoft, 0.02, 0.035, 0.12 + sx * 0.03, 0.675, -0.1, 4); e.rotation.y = Math.PI / 4; }
      cupStraw(M, g, -0.12, 0.57, 0.14, '#fff4e0', '#f59bb8');
    } else { book(g, 0.08, 0.57, -0.1, 0.15, 0.025, 0.21, '#f59bb8', 0.2); book(g, 0.08, 0.595, -0.1, 0.14, 0.02, 0.2, '#c8b0e6', 0.35); }
  };
  def('nightL', '床頭櫃', 0.45, 0.5, (g) => nightstand(g, false), [-4.75, -3.72], 0);
  def('nightR', '床頭櫃', 0.45, 0.5, (g) => nightstand(g, true), [-2.05, -3.72], 0);

  def('bench', '床尾凳', 1.5, 0.42, (g) => {
    box(g, M.wood, 1.5, 0.05, 0.42, 0, 0.36, 0, 0.015);
    box(g, M.fabric, 1.44, 0.08, 0.38, 0, 0.42, 0, 0.03);
    for (const sx of [-0.68, 0.68]) for (const sz of [-0.16, 0.16]) cyl(g, M.gold, 0.018, 0.014, 0.34, sx, 0.17, sz, 8);
    box(g, M.cream, 0.5, 0.1, 0.36, -0.4, 0.51, 0, 0.03); box(g, M.plaid, 0.46, 0.06, 0.34, -0.4, 0.59, 0, 0.02);
    plushCat(M, g, M.catWhite, { x: 0.35, y: 0.46, z: 0, s: 0.8, ry: 0.2 });
  }, [-3.4, -1.22], 0);

  def('bedRug', '床邊小地毯', 2.4, 1.1, (g) => {
    box(g, M.plush, 2.4, 0.025, 1.1, 0, 0.0125, 0, 0.012);
    for (let i = 0; i < 10; i++) sph(g, M.plush, 0.06, -1.1 + i * 0.245, 0.01, 0.55, 1, 0.2, 1);
  }, [-3.4, -0.95], 0, { rug: true });

  def('slippers', '貓咪拖鞋', 0.5, 0.35, (g) => {
    for (const sx of [-1, 1]) {
      const s = grp(g, sx * 0.11, 0, 0, sx * 0.15);
      box(s, M.white, 0.1, 0.02, 0.28, 0, 0.01, 0, 0.008);
      sph(s, M.accent, 0.07, 0, 0.04, 0.06, 0.8, 0.6, 1.2);
      for (const ex of [-1, 1]) { const e = cone(s, M.accent, 0.018, 0.035, ex * 0.03, 0.09, 0.07, 4); e.rotation.y = Math.PI / 4; }
      for (const ex of [-1, 1]) sph(s, M.ink, 0.006, ex * 0.02, 0.07, 0.135);
    }
  }, [-2.2, -1.1], 0);

  /* ---------------- 床邊地板彩蛋 ---------------- */
  // belly-up kitten napping on the rug
  def('bellyCat', '翻肚睡的小橘貓', 0.45, 0.35, (g) => {
    const fur = M.catOrange;
    sph(g, fur, 0.14, 0, 0.08, 0, 1.3, 0.55, 0.9);
    sph(g, M.catWhite, 0.1, 0.02, 0.12, 0, 1.2, 0.35, 0.75);                 // white belly
    sph(g, fur, 0.085, 0.2, 0.08, 0, 1, 0.9, 1);                              // head, lying sideways
    for (const sz of [-1, 1]) { const e = cone(g, fur, 0.035, 0.06, 0.28, 0.07, sz * 0.05, 4); e.rotation.set(0, Math.PI / 4, -Math.PI / 2); }
    for (const sz of [-1, 1]) { const l = box(g, M.ink, 0.004, 0.02, 0.005, 0.2, 0.155, sz * 0.03, 0.002); l.rotation.x = sz * 0.3; }
    sph(g, M.catPink, 0.009, 0.215, 0.16, 0);
    for (const [x, sz] of [[0.1, -1], [0.1, 1], [-0.1, -1], [-0.1, 1]]) {           // paws in the air
      const leg = cyl(g, fur, 0.022, 0.022, 0.1, x, 0.17, sz * 0.05, 8); leg.rotation.x = sz * 0.35;
      sph(g, M.catWhite, 0.026, x, 0.22, sz * 0.068);
      sph(g, M.catPink, 0.011, x, 0.24, sz * 0.07);
    }
    const tail = add(g, new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI * 0.8), fur, -0.2, 0.03, 0.02); tail.rotation.set(-Math.PI / 2, 0, 1.4);
  }, [-3.95, -0.7], 0, { round: true });

  // trail of pink paw prints walking out from the bed
  const pawMat = M.paw.clone(); pawMat.color = new THREE.Color('#e88aa8'); pawMat.opacity = 0.85;
  def('pawTrail', '貓腳印', 1.6, 0.6, (g) => {
    for (let i = 0; i < 8; i++) {
      const t = i / 7, p = add(g, new THREE.PlaneGeometry(0.1, 0.1), pawMat, -0.7 + t * 1.4, 0.032, -0.18 + t * 0.3 + (i % 2 ? 0.06 : -0.06));
      p.rotation.set(-Math.PI / 2, 0, -1.35); p.renderOrder = 2;
    }
  }, [-2.75, -0.6], 0, { rug: true });

  def('heartPillow', '愛心抱枕', 0.45, 0.45, (g) => {
    const h = grp(g, 0, 0.2, 0, 0); h.rotation.x = -0.35;
    for (const sx of [-1, 1]) sph(h, M.accent, 0.11, sx * 0.08, 0.05, 0, 1, 1, 0.5);
    const tip = add(h, rbGeo(0.19, 0.19, 0.11, 0.05), M.accent, 0, -0.04, 0); tip.rotation.z = Math.PI / 4;
    sph(h, M.white, 0.02, 0.07, 0.1, 0.045, 1, 1, 0.4);
    box(g, M.plush, 0.34, 0.06, 0.3, 0, 0.03, 0.05, 0.03);                      // small fluffy cushion under it
  }, [-2.95, -0.1], 0, { round: true });

  def('yarnToys', '毛線球與逗貓玩具', 0.45, 0.5, (g) => {
    const yarn = sph(g, M.accent, 0.07, -0.08, 0.07, -0.1);
    for (let i = 0; i < 4; i++) { const w = add(g, new THREE.TorusGeometry(0.07, 0.004, 4, 24), M.pawPink, -0.08, 0.07, -0.1); w.rotation.set(i * 0.8, i * 0.5, 0); }
    yarn.castShadow = true;
    for (let i = 0; i < 6; i++) { const s = cyl(g, M.accent, 0.004, 0.004, 0.09, -0.02 + i * 0.05, 0.005, -0.05 + Math.sin(i * 1.4) * 0.05, 4); s.rotation.set(0, 0, Math.PI / 2); s.rotation.y = Math.sin(i) * 0.8; }
    // toy mouse
    sph(g, M.catGray, 0.035, 0.14, 0.03, 0.12, 1.5, 0.8, 1); sph(g, M.catPink, 0.012, 0.19, 0.035, 0.12);
    for (const sz of [-1, 1]) sph(g, M.catGray, 0.013, 0.16, 0.06, 0.12 + sz * 0.02, 1, 1, 0.4);
    cyl(g, M.ink, 0.002, 0.002, 0.08, 0.07, 0.01, 0.13, 4).rotation.z = Math.PI / 2;
    // feather wand
    const wand = cyl(g, M.wood, 0.005, 0.005, 0.4, -0.05, 0.01, 0.12, 6); wand.rotation.set(0, 0.5, Math.PI / 2);
    for (let i = 0; i < 3; i++) { const f = sph(g, [M.pawPink, M.plush, M.accent][i], 0.03, -0.24 + i * 0.015, 0.015, 0.03 + i * 0.03, 2, 0.3, 0.6); f.rotation.y = 0.5 + i * 0.3; }
    // love letter peeking out beside the bed
    const env = box(g, col('#ffe0ea', 0.8), 0.14, 0.006, 0.1, 0.1, 0.004, -0.14, 0.002); env.rotation.y = -0.3;
    sph(g, col('#e0344e', 0.4), 0.014, 0.1, 0.009, -0.14, 1, 0.3, 1);
  }, [-2.05, -2.6], 0);

  /* ================================================================ 化妝區 */
  def('vanity', '化妝桌', 1.0, 0.5, (g) => {
    box(g, M.wood, 1.0, 0.04, 0.5, 0, 0.74, 0, 0.012);
    box(g, M.wood, 0.36, 0.7, 0.46, -0.3, 0.37, 0, 0.015);
    for (let i = 0; i < 3; i++) { box(g, M.paint, 0.32, 0.19, 0.02, -0.3, 0.14 + i * 0.22, 0.235, 0.008); sph(g, M.gold, 0.012, -0.3, 0.14 + i * 0.22, 0.255); }
    for (const z of [-0.2, 0.2]) cyl(g, M.gold, 0.018, 0.014, 0.72, 0.45, 0.36, z, 10);
    warmStrip(g, 0.9, 0.715, 0.23);
    const mz = -0.18, my0 = 0.8, mh = 0.6, mr = 0.28;
    box(g, M.wood, (mr + 0.05) * 2, mh, 0.03, 0, my0 + mh / 2, mz - 0.02, 0.008);
    add(g, new THREE.CircleGeometry(mr + 0.05, 32, 0, Math.PI), M.wood, 0, my0 + mh, mz - 0.004);
    add(g, new THREE.PlaneGeometry(mr * 2, mh), M.mirror, 0, my0 + mh / 2, mz + 0.001);
    add(g, new THREE.CircleGeometry(mr, 32, 0, Math.PI), M.mirror, 0, my0 + mh, mz + 0.001);
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) sph(g, M.bulbSoft, 0.014, sx * (mr + 0.025), my0 + 0.06 + i * 0.13, mz + 0.01);
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI; sph(g, M.bulbSoft, 0.014, Math.cos(a) * (mr + 0.025), my0 + mh + Math.sin(a) * (mr + 0.025), mz + 0.01); }
    lamp(g, 0, 1.3, 0.45, 0.6, '#ffe2c0', 3);
    // perfumes
    for (const [x, z, c, h] of [[0.13, 0.08, '#f5b8cc', 0.1], [0.2, 0.0, '#c8b0e6', 0.08], [0.27, 0.1, '#ffe2a8', 0.12]]) {
      cyl(g, M.glass, 0.028, 0.028, h, x, 0.76 + h / 2, z, 12); cyl(g, col(c, 0.2), 0.024, 0.024, h * 0.7, x, 0.76 + h * 0.36, z, 12); cyl(g, M.gold, 0.012, 0.012, 0.025, x, 0.76 + h + 0.012, z, 10);
    }
    // lipsticks + compact
    for (let i = 0; i < 4; i++) { cyl(g, M.gold, 0.01, 0.01, 0.05, 0.36 + (i % 2) * 0.03, 0.785, -0.05 + Math.floor(i / 2) * 0.04, 8); cyl(g, col(['#e0344e', '#f59bb8', '#b0306e', '#ff8a65'][i], 0.3), 0.008, 0.008, 0.02, 0.36 + (i % 2) * 0.03, 0.82, -0.05 + Math.floor(i / 2) * 0.04, 8); }
    cyl(g, M.pawPink, 0.035, 0.035, 0.012, 0.05, 0.766, 0.15, 20);
    // brush cup
    cyl(g, M.ceramic, 0.035, 0.03, 0.09, -0.2, 0.805, 0.05, 16);
    for (let i = 0; i < 5; i++) { const b = cyl(g, i % 2 ? M.dark : M.pawPink, 0.005, 0.005, 0.16, -0.2 + (i - 2) * 0.012, 0.88, 0.05, 6); b.rotation.z = (i - 2) * 0.12; cyl(g, col('#f3e1cf', 0.9), 0.009, 0.004, 0.03, -0.2 + (i - 2) * 0.012 - (i - 2) * 0.012, 0.965, 0.05, 6); }
    // jewelry box + hair accessories
    box(g, M.accent, 0.14, 0.07, 0.1, -0.36, 0.795, 0.12, 0.01); box(g, M.gold, 0.145, 0.012, 0.105, -0.36, 0.836, 0.12, 0.004);
    for (const [x, c] of [[-0.12, '#f59bb8'], [-0.04, '#fff']]) { const s = add(g, new THREE.TorusGeometry(0.025, 0.011, 8, 16), col(c, 0.9), x, 0.772, 0.16); s.rotation.x = Math.PI / 2; }
    for (const sx of [-1, 1]) { const b = cone(g, M.accent, 0.025, 0.05, 0.3 + sx * 0.025, 0.772, 0.18, 4); b.rotation.set(0, 0, sx * Math.PI / 2); }
    // small acrylic organiser
    box(g, M.glass, 0.12, 0.08, 0.08, -0.36, 0.8, -0.1, 0.004); for (let i = 0; i < 4; i++) cyl(g, col(PASTEL[i], 0.3), 0.008, 0.008, 0.07, -0.4 + i * 0.025, 0.8, -0.1, 6);
  }, [-1.25, -3.72], 0);

  def('vanityStool', '化妝圓凳', 0.45, 0.45, (g) => {
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cyl(g, M.gold, 0.012, 0.01, 0.1, Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14, 8); }
    cyl(g, M.fabric, 0.21, 0.19, 0.3, 0, 0.25, 0, 28);
    sph(g, M.fabric, 0.215, 0, 0.4, 0, 1, 0.3, 1);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sph(g, M.accent, 0.011, Math.cos(a) * 0.11, 0.46, Math.sin(a) * 0.11); }
  }, [-1.25, -2.95], 0, { round: true });

  /* ================================================================ 衣帽區（後方中央） */
  const cloth = [M.fabric, M.cream, M.dark, M.accent, M.plaid, col('#c8b0e6', 0.9), M.white, col('#8fa8c8', 0.9), col('#e8d4b8', 0.9), col('#3b3442', 0.9)];
  const rack = (g, variant, seed) => {
    const W = 1.35, H = 2.1, r = seeded(seed);
    for (const sx of [-0.65, 0.65]) for (const sz of [-0.27, 0.27]) cyl(g, M.chrome, 0.015, 0.015, H, sx, H / 2, sz, 10);
    box(g, M.wood, W, 0.03, 0.58, 0, H - 0.015, 0, 0.008);
    const rod = cyl(g, M.chrome, 0.012, 0.012, W - 0.04, 0, 1.82, 0, 10); rod.rotation.z = Math.PI / 2;
    // top shelf: hat box, folded sweaters, basket
    cyl(g, M.accent, 0.16, 0.16, 0.2, -0.45, H + 0.1, 0, 24); cyl(g, M.white, 0.165, 0.165, 0.02, -0.45, H + 0.2, 0, 24);
    for (let i = 0; i < 4; i++) box(g, cloth[(i + seed) % cloth.length], 0.34, 0.06, 0.3, 0.05, H + 0.03 + i * 0.062, 0, 0.02);
    box(g, M.sisal, 0.3, 0.18, 0.3, 0.45, H + 0.09, 0, 0.02);
    // hanging garments of varied type / length
    let x = -0.58;
    while (x < 0.6) {
      const kind = r(), m = cloth[(r() * cloth.length) | 0];
      const len = kind < 0.25 ? 1.05 + r() * 0.08 : kind < 0.5 ? 0.85 + r() * 0.1 : kind < 0.8 ? 0.5 + r() * 0.1 : 0.4;
      const th = kind < 0.25 ? 0.07 : 0.045;
      const hook = add(g, new THREE.TorusGeometry(0.02, 0.004, 4, 10, Math.PI), M.chrome, x, 1.84, 0); hook.rotation.y = Math.PI / 2;
      const ry = (r() - 0.5) * 0.14, hang = grp(g, x, 0, 0, ry);
      if (kind >= 0.8) { // skirt on a clip hanger
        box(hang, M.chrome, 0.01, 0.01, 0.34, 0, 1.78, 0, 0.003);
        const s = cyl(hang, m, 0.12, 0.2, 0.4, 0, 1.56, 0, 16); s.scale.x = 0.2;
      } else {
        box(hang, m, th + 0.01, 0.08, 0.42, 0, 1.78, 0, 0.02);
        box(hang, m, th, len * (kind < 0.5 && kind >= 0.25 ? 0.45 : 1), 0.38, 0, 1.78 - len * (kind < 0.5 && kind >= 0.25 ? 0.225 : 0.5), 0, 0.02);
        if (kind >= 0.25 && kind < 0.5) { const sk = cyl(hang, m, 0.19, 0.25, len * 0.55, 0, 1.78 - len * 0.45 - len * 0.275, 0, 16); sk.scale.x = th * 3.2; }   // dress
      }
      x += th + 0.035 + r() * 0.03;
    }
    if (variant === 'drawers') {
      box(g, M.white, 1.3, 0.52, 0.55, 0, 0.27, 0, 0.02);
      for (const sx of [-0.33, 0.33]) for (const y of [0.15, 0.39]) { box(g, M.paint, 0.6, 0.2, 0.02, sx, y, 0.28, 0.008); box(g, M.gold, 0.12, 0.014, 0.012, sx, y + 0.05, 0.295, 0.004); }
    } else {
      for (const y of [0.04, 0.3]) box(g, M.wood, 1.3, 0.025, 0.55, 0, y, 0, 0.006);
      for (let i = 0; i < 4; i++) { const bx = box(g, [M.pawPink, M.white, M.card, M.accent][i], 0.28, 0.14, 0.34, -0.47 + i * 0.31, 0.123, 0.02, 0.01); bx.rotation.y = (r() - 0.5) * 0.1; }
      const shoeCols = ['#fff', '#e0344e', '#3b3442', '#f59bb8', '#d9b48f'];
      for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
        const s = box(g, col(shoeCols[i], 0.5), 0.08, 0.07 + (i % 2) * 0.05, 0.24, -0.5 + i * 0.25 + sx * 0.045, 0.35 + (i % 2) * 0.025, 0.05, 0.03); s.rotation.y = sx * 0.05;
      }
    }
  };
  def('rackA', '開放衣架（抽屜）', 1.35, 0.6, (g) => rack(g, 'drawers', 5), [0.0, -3.65], 0);
  def('rackB', '開放衣架（鞋櫃）', 1.35, 0.6, (g) => rack(g, 'shoes', 11), [1.425, -3.65], 0);

  def('bagShelf', '包包展示架', 0.6, 0.4, (g) => {
    for (const sx of [-0.29, 0.29]) box(g, M.white, 0.025, 1.85, 0.4, sx, 0.925, 0, 0.006);
    box(g, M.white, 0.58, 1.85, 0.015, 0, 0.925, -0.19, 0.004);
    const ys = [0.03, 0.47, 0.92, 1.37, 1.835];
    for (const y of ys) box(g, M.white, 0.58, 0.03, 0.4, 0, y, 0, 0.006);
    const bag = (x, y, w, h, c, ry) => {
      const b = grp(g, x, y + 0.015, 0.02, ry); box(b, col(c, 0.45), w, h, 0.12, 0, h / 2, 0, 0.03);
      add(b, new THREE.TorusGeometry(w * 0.3, 0.008, 6, 18, Math.PI), col(c, 0.45), 0, h, 0);
      box(b, M.gold, 0.03, 0.02, 0.01, 0, h * 0.7, 0.062, 0.004);
    };
    bag(-0.1, ys[0], 0.26, 0.24, '#3b3442', 0.1); bag(0.15, ys[0], 0.18, 0.16, '#f59bb8', -0.2);
    bag(0, ys[1], 0.3, 0.22, '#f3e6da', 0.05);
    bag(-0.13, ys[2], 0.18, 0.18, '#e0344e', 0.15); bag(0.13, ys[2], 0.2, 0.15, '#c8b0e6', -0.1);
    bag(0, ys[3], 0.34, 0.2, '#d9b48f', 0);
    // hats on top
    cyl(g, col('#e8d4b8', 0.9), 0.2, 0.2, 0.01, -0.05, 1.86, 0, 28); sph(g, col('#e8d4b8', 0.9), 0.1, -0.05, 1.86, 0, 1, 0.8, 1);
    cyl(g, M.accent, 0.12, 0.12, 0.05, 0.1, 1.92, 0.05, 20).rotation.z = 0.2;
  }, [2.45, -3.75], 0);

  def('floorMirror', '全身落地鏡', 0.7, 0.45, (g) => {
    const W = 0.56, Hs = 1.25, R = W / 2, y0 = 0.08;          // straight part height, arch radius
    const m = grp(g, 0, 0, 0.04); m.rotation.x = -0.06;        // leans back slightly
    // wooden back panel (rect + half disc)
    box(m, M.wood, W + 0.06, Hs, 0.025, 0, y0 + Hs / 2, -0.02, 0.008);
    const cap = add(m, new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.025, 40, 1, false, Math.PI / 2, Math.PI), M.wood, 0, y0 + Hs, -0.02); cap.rotation.x = Math.PI / 2;
    // mirror face
    add(m, new THREE.PlaneGeometry(W, Hs), M.mirror, 0, y0 + Hs / 2, 0.0);
    add(m, new THREE.CircleGeometry(R, 40, 0, Math.PI), M.mirror, 0, y0 + Hs, 0.0);
    // slim gold frame
    for (const sx of [-1, 1]) box(m, M.gold, 0.03, Hs, 0.035, sx * (R + 0.012), y0 + Hs / 2, -0.005, 0.01);
    box(m, M.gold, W + 0.055, 0.03, 0.035, 0, y0, -0.005, 0.01);
    add(m, new THREE.TorusGeometry(R + 0.012, 0.016, 10, 40, Math.PI), M.gold, 0, y0 + Hs, -0.005);
    // feet + rear kickstand
    for (const sx of [-1, 1]) box(g, M.gold, 0.05, 0.03, 0.16, sx * 0.24, 0.015, 0.02, 0.01);
    const leg = cyl(g, M.gold, 0.012, 0.012, 0.8, 0, 0.39, -0.17, 8); leg.rotation.x = 0.4;
    box(g, M.gold, 0.08, 0.02, 0.04, 0, 0.01, -0.33, 0.006);
  }, [-4.62, -1.2], 1);

  def('closetRug', '衣帽區圓地毯', 1.9, 1.9, (g) => {
    cyl(g, M.cream, 0.95, 0.95, 0.022, 0, 0.011, 0, 48);
    const ring = add(g, new THREE.TorusGeometry(0.78, 0.018, 6, 48), M.accent, 0, 0.024, 0); ring.rotation.x = -Math.PI / 2; ring.scale.z = 0.3;
  }, [0.75, -2.35], 0, { rug: true, round: true });

  def('ottoman', '試穿軟凳', 0.6, 0.6, (g) => {
    cyl(g, M.fabric, 0.28, 0.26, 0.36, 0, 0.2, 0, 32);
    sph(g, M.fabric, 0.285, 0, 0.38, 0, 1, 0.22, 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sph(g, M.gold, 0.012, Math.cos(a) * 0.16, 0.435, Math.sin(a) * 0.16); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cyl(g, M.gold, 0.014, 0.012, 0.04, Math.cos(a) * 0.2, 0.02, Math.sin(a) * 0.2, 8); }
    const c = box(g, M.cream, 0.34, 0.04, 0.26, 0.05, 0.46, -0.02, 0.015); c.rotation.set(0.05, 0.4, 0.04);      // folded cardigan
    const hat = cyl(g, col('#e8d4b8', 0.9), 0.17, 0.17, 0.01, -0.1, 0.49, 0.1, 24); hat.rotation.z = 0.1; sph(g, col('#e8d4b8', 0.9), 0.08, -0.1, 0.5, 0.1, 1, 0.7, 1);
  }, [0.7, -2.4], 0, { round: true });

  /* ================================================================ PC＋直播區（右後） */
  def('desk', '直播電腦桌', 2.0, 0.8, (g) => {
    box(g, M.wood, 2.0, 0.05, 0.8, 0, 0.74, 0, 0.015);
    box(g, M.wood, 0.42, 0.7, 0.72, -0.76, 0.36, -0.02, 0.015);
    for (let i = 0; i < 3; i++) { box(g, M.paint, 0.38, 0.19, 0.02, -0.76, 0.14 + i * 0.22, 0.345, 0.008); box(g, M.gold, 0.1, 0.015, 0.012, -0.76, 0.2 + i * 0.22, 0.36, 0.004); }
    box(g, M.wood, 0.05, 0.71, 0.72, 0.97, 0.355, -0.02, 0.01);
    box(g, M.neonHot, 1.9, 0.012, 0.012, 0, 0.705, 0.385, 0.003);
    // PC tower under desk
    box(g, M.white, 0.24, 0.48, 0.46, 0.66, 0.26, -0.08, 0.02);
    for (const y of [0.16, 0.34]) add(g, new THREE.TorusGeometry(0.06, 0.008, 8, 28), M.neonHot, 0.66, y, 0.152);
    // monitors
    const mon = (x, ry, w, h, mat) => {
      const o = grp(g, x, 1.1, -0.2, ry);
      box(o, M.dark, w + 0.03, h + 0.03, 0.03, 0, 0, 0, 0.008); add(o, new THREE.PlaneGeometry(w, h), mat, 0, 0, 0.017);
      box(o, M.dark, 0.04, 0.3, 0.03, 0, -h / 2 - 0.08, -0.04, 0.008);
      box(o, M.dark, 0.22, 0.012, 0.16, 0, -0.325, -0.02, 0.004);
      return o;
    };
    const c = mon(0, 0, 0.8, 0.44, screenMat(M, monitorMain()));
    mon(-0.68, 0.35, 0.5, 0.3, screenMat(M, monitorSide(2)));
    mon(0.68, -0.35, 0.5, 0.3, screenMat(M, monitorSide(5)));
    // stream camera on the main monitor
    box(c, M.dark, 0.1, 0.035, 0.04, 0, 0.26, 0.0, 0.01); cyl(c, M.ink, 0.012, 0.012, 0.01, 0, 0.26, 0.022, 12).rotation.x = Math.PI / 2;
    // keyboard, mouse, pad
    box(g, M.accent, 1.0, 0.006, 0.36, 0.0, 0.768, 0.18, 0.003);
    box(g, M.white, 0.44, 0.022, 0.14, -0.08, 0.782, 0.18, 0.008);
    box(g, M.neonHot, 0.42, 0.006, 0.006, -0.08, 0.772, 0.252, 0.001);
    sph(g, M.white, 0.032, 0.3, 0.785, 0.19, 0.8, 0.5, 1.2);
    // stream deck
    const sd = grp(g, 0.5, 0.78, 0.24, -0.2); sd.rotation.x = -0.3; box(sd, M.dark, 0.13, 0.025, 0.085, 0, 0, 0, 0.006);
    for (let i = 0; i < 15; i++) box(sd, glow(['#ff7ac0', '#7ad8ff', '#b58cff', '#8ff0c8', '#ffd27a'][i % 5]), 0.016, 0.006, 0.016, -0.044 + (i % 5) * 0.022, 0.014, -0.022 + Math.floor(i / 5) * 0.022, 0.002);
    // speakers
    for (const [x, z] of [[-0.89, 0.12], [0.64, 0.02]]) { box(g, M.white, 0.1, 0.18, 0.12, x, 0.855, z, 0.01); cyl(g, M.dark, 0.03, 0.03, 0.005, x, 0.83, z + 0.062, 16).rotation.x = Math.PI / 2; }
    // headphone stand
    const HX = 0.9, HZ = 0.14;
    cyl(g, M.white, 0.05, 0.06, 0.01, HX, 0.77, HZ); cyl(g, M.white, 0.008, 0.008, 0.26, HX, 0.9, HZ, 8);
    add(g, new THREE.TorusGeometry(0.08, 0.014, 8, 20, Math.PI), M.fabric, HX, 0.98, HZ).rotation.y = Math.PI / 2;
    for (const sz of [-1, 1]) { sph(g, M.fabric, 0.045, HX, 0.97, HZ + sz * 0.08, 1, 1, 0.55); const e = cone(g, M.fabric, 0.02, 0.04, HX, 1.07, HZ + sz * 0.055, 4); e.rotation.x = sz * 0.4; }
    // mic boom arm
    cyl(g, M.dark, 0.02, 0.02, 0.05, -0.45, 0.79, -0.33, 10);
    const a1 = cyl(g, M.dark, 0.008, 0.008, 0.42, -0.45, 1.0, -0.26, 8); a1.rotation.x = 0.35;
    const a2 = cyl(g, M.dark, 0.008, 0.008, 0.4, -0.38, 1.18, -0.0, 8); a2.rotation.set(1.2, 0, 0.35);
    cyl(g, M.dark, 0.028, 0.028, 0.14, -0.3, 1.1, 0.14, 14).rotation.x = 0.4; sph(g, M.accent, 0.034, -0.3, 1.16, 0.12, 1, 1.1, 1);
    // ring light
    cyl(g, M.white, 0.07, 0.08, 0.015, -0.93, 0.772, -0.34); cyl(g, M.white, 0.008, 0.008, 0.66, -0.93, 1.1, -0.34, 8);
    add(g, new THREE.TorusGeometry(0.16, 0.018, 10, 40), M.bulbCool, -0.93, 1.6, -0.32).rotation.y = 0.3;
    lamp(g, -0.8, 1.5, 0.2, 1.0, '#fff4f8', 4);
    plushCat(M, g, M.catWhite, { x: -0.66, y: 0.765, z: 0.3, s: 0.5, ry: 0.3 });
    cupStraw(M, g, -0.45, 0.765, 0.3, '#c79a74', '#fff');
    lamp(g, 0, 1.5, 0.5, 1.2, '#b9a4ff', 4, { neon: true, min: 0.35 });
  }, [3.85, -3.6], 0);

  def('gameCabinet', '遊戲收藏矮櫃', 0.8, 0.4, (g) => {
    const H = 0.78, r = seeded(41);
    for (const sx of [-0.39, 0.39]) box(g, M.white, 0.025, H, 0.4, sx, H / 2, 0, 0.006);   // open back: see-through
    const ys = [0.03, 0.4, 0.765];
    for (const y of ys) box(g, M.white, 0.8, 0.03, 0.4, 0, y, 0, 0.006);
    for (const y of ys.slice(1)) box(g, M.neonHot, 0.74, 0.008, 0.008, 0, y - 0.018, 0.17, 0.002);
    // bottom: storage bin + game case row
    box(g, M.fabric, 0.3, 0.28, 0.32, -0.2, 0.185, 0.02, 0.02);
    let x = 0.0;
    while (x < 0.34) { const w = 0.018 + r() * 0.006; book(g, x + w / 2, ys[0] + 0.015, 0.02, w, 0.19, 0.14, PASTEL[(r() * 10) | 0]); x += w + 0.002; }
    // middle: mini console, retro handheld, controller
    box(g, M.white, 0.2, 0.06, 0.16, -0.2, ys[1] + 0.045, 0.02, 0.012);
    box(g, col('#c8b0e6', 0.4), 0.09, 0.14, 0.025, 0.02, ys[1] + 0.085, 0.03, 0.01);
    const pad = grp(g, 0.24, ys[1] + 0.03, 0.03, 0.4); box(pad, M.dark, 0.14, 0.025, 0.06, 0, 0, 0, 0.012); for (const sx of [-1, 1]) sph(pad, M.dark, 0.03, sx * 0.06, -0.002, 0.03, 1, 0.6, 1.2);
    // top: small figures, plant, plush
    for (let i = 0; i < 3; i++) figure(g, M, -0.3 + i * 0.1, ys[2] + 0.015, 0.03 - (i % 2) * 0.06, i + 4, 1.2);
    cyl(g, M.ceramic, 0.06, 0.05, 0.1, 0.05, ys[2] + 0.065, 0, 16);
    for (let i = 0; i < 7; i++) sph(g, i % 2 ? M.leaf : M.leaf2, 0.045, 0.05 + Math.cos(i) * 0.05, ys[2] + 0.15 + (i % 3) * 0.025, Math.sin(i) * 0.05, 1, 0.6, 1);
    plushCat(M, g, M.catGray, { x: 0.25, y: ys[2] + 0.015, z: 0.02, s: 0.55, ry: -0.2 });
  }, [4.78, -1.6], 3);

  def('floorDoll', '大貓咪娃娃', 0.4, 0.4, (g) => {
    plushCat(M, g, M.plush, { x: 0, y: 0, z: -0.02, s: 1.6 });
    for (const sx of [-1, 1]) { const b = cone(g, M.accent, 0.045, 0.09, 0.1 + sx * 0.045, 0.49, 0.02, 4); b.rotation.set(0, Math.PI / 4, sx * Math.PI / 2); }
    sph(g, M.accent, 0.022, 0.1, 0.49, 0.03);                                   // bow on the ear
    cyl(g, M.accent, 0.1, 0.1, 0.03, 0, 0.19, 0.02, 20).scale.z = 0.85;          // little collar
  }, [4.75, -2.22], 3, { round: true });

  def('chair', '貓耳電競椅', 0.7, 0.7, (g) => {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5; const leg = box(g, M.dark, 0.3, 0.04, 0.05, Math.cos(a) * 0.15, 0.07, Math.sin(a) * 0.15, 0.01); leg.rotation.y = -a;
      sph(g, M.dark, 0.03, Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3);
    }
    cyl(g, M.chrome, 0.025, 0.025, 0.34, 0, 0.26, 0, 10);
    box(g, M.white, 0.54, 0.12, 0.52, 0, 0.48, 0.02, 0.05);
    box(g, M.fabric, 0.36, 0.03, 0.44, 0, 0.55, 0.02, 0.015);
    const back = grp(g, 0, 0.5, -0.24); back.rotation.x = -0.14;
    box(back, M.white, 0.52, 0.85, 0.12, 0, 0.45, 0, 0.06);
    box(back, M.fabric, 0.3, 0.6, 0.02, 0, 0.42, 0.06, 0.01);
    box(back, M.accent, 0.28, 0.14, 0.08, 0, 0.76, 0.09, 0.04);
    for (const sx of [-1, 1]) {
      const e = cone(back, M.white, 0.08, 0.14, sx * 0.17, 0.93, 0, 4); e.rotation.set(0, Math.PI / 4, -sx * 0.25);
      const ie = cone(back, M.pawPink, 0.045, 0.08, sx * 0.17, 0.92, 0.04, 4); ie.rotation.copy(e.rotation);
    }
    for (const sx of [-0.3, 0.3]) { box(g, M.dark, 0.04, 0.2, 0.04, sx, 0.62, 0.0, 0.01); box(g, M.white, 0.07, 0.03, 0.28, sx, 0.73, 0.02, 0.012); }
  }, [3.85, -2.75], 2, { round: true });

  def('cattree', '貓跳台', 0.6, 0.6, (g) => {
    box(g, M.cream, 0.6, 0.06, 0.6, 0, 0.03, 0, 0.02);
    box(g, M.cream, 0.42, 0.36, 0.42, -0.06, 0.24, -0.06, 0.04);
    add(g, new THREE.CircleGeometry(0.1, 24), M.ink, -0.06, 0.24, 0.152);
    cyl(g, M.sisal, 0.045, 0.045, 0.9, 0.18, 0.5, 0.18, 14);
    cyl(g, M.sisal, 0.045, 0.045, 1.35, -0.14, 1.09, -0.12, 14);
    cyl(g, M.cream, 0.2, 0.2, 0.05, 0.14, 0.97, 0.12, 24);
    cyl(g, M.cream, 0.2, 0.2, 0.05, -0.05, 1.35, -0.05, 24);
    cyl(g, M.cream, 0.25, 0.19, 0.1, -0.1, 1.8, -0.1, 24);
    makeCat(M, g, M.catOrange, { x: -0.1, y: 1.82, z: -0.1, s: 0.8, pose: 'sleep', ry: 0.6 });
    cyl(g, M.ink, 0.003, 0.003, 0.2, 0.26, 0.85, 0.22, 4); sph(g, M.accent, 0.035, 0.26, 0.74, 0.22);
  }, [4.65, 0.25], 0);

  def('scratcher', '貓抓板', 0.75, 0.3, (g) => {
    box(g, M.card, 0.75, 0.05, 0.3, 0, 0.025, 0, 0.01);
    for (let i = 0; i < 12; i++) { const t = i / 11, h = 0.05 + Math.sin(t * Math.PI) * 0.1; box(g, M.card, 0.058, h, 0.28, -0.33 + i * 0.06, 0.05 + h / 2, 0, 0.01); }
    sph(g, M.catGray, 0.03, 0.2, 0.2, 0.08, 1.5, 0.8, 1); cyl(g, M.ink, 0.002, 0.002, 0.08, 0.13, 0.19, 0.08, 4).rotation.z = Math.PI / 2;
  }, [4.72, -0.55], 1);

  /* ================================================================ 遊戲休閒區（右前） */
  def('tv', '電視櫃＋70吋電視', 2.4, 0.5, (g) => {
    box(g, M.wood, 2.4, 0.04, 0.48, 0, 0.43, 0, 0.012); box(g, M.wood, 2.4, 0.04, 0.48, 0, 0.09, 0, 0.012);
    for (const x of [-0.8, 0.8]) { box(g, M.wood, 0.8, 0.3, 0.48, x, 0.26, 0, 0.012); box(g, M.paint, 0.76, 0.28, 0.02, x, 0.26, 0.245, 0.01); box(g, M.gold, 0.12, 0.015, 0.012, x, 0.36, 0.26, 0.004); }
    box(g, M.wood, 0.8, 0.3, 0.02, 0, 0.26, -0.23, 0.004);
    for (const sx of [-1.12, 1.12]) for (const sz of [-0.18, 0.18]) cyl(g, M.gold, 0.018, 0.014, 0.07, sx, 0.035, sz, 8);
    for (let i = 0; i < 8; i++) book(g, -0.3 + i * 0.028, 0.11, 0.02, 0.015, 0.17, 0.13, PASTEL[i + 1]);   // game cases in the open cubby
    const pad0 = grp(g, 0.2, 0.125, 0.05, 0.3); box(pad0, M.dark, 0.14, 0.025, 0.06, 0, 0, 0, 0.012);
    warmStrip(g, 2.3, 0.07, 0.235);
    // 70" TV on feet
    for (const sx of [-0.6, 0.6]) { const f = box(g, M.dark, 0.04, 0.08, 0.2, sx, 0.49, -0.08, 0.008); f.rotation.z = sx * 0.3; }
    box(g, M.dark, 1.6, 0.92, 0.05, 0, 0.99, -0.1, 0.012);
    add(g, new THREE.PlaneGeometry(1.55, 0.87), screenMat(M, tvScreen()), 0, 0.99, -0.074);
    // PS5
    for (const sx of [-1, 1]) box(g, M.white, 0.03, 0.42, 0.3, 1.0 + sx * 0.035, 0.66, -0.05, 0.015);
    box(g, M.dark, 0.04, 0.39, 0.26, 1.0, 0.66, -0.05, 0.008);
    // Switch dock + joycons
    box(g, M.dark, 0.18, 0.11, 0.05, -0.85, 0.505, 0.1, 0.01);
    box(g, M.dark, 0.16, 0.09, 0.012, -0.85, 0.53, 0.13, 0.005);
    box(g, col('#e0344e', 0.4), 0.03, 0.09, 0.015, -0.955, 0.53, 0.13, 0.008); box(g, col('#40b0ff', 0.4), 0.03, 0.09, 0.015, -0.745, 0.53, 0.13, 0.008);
    // controllers + game stack
    const pad = (x, z, ry, m) => { const p = grp(g, x, 0.465, z, ry); box(p, m, 0.14, 0.025, 0.06, 0, 0, 0, 0.012); for (const sx of [-1, 1]) sph(p, m, 0.03, sx * 0.06, -0.002, 0.03, 1, 0.6, 1.2); };
    pad(0.6, 0.12, -0.3, M.white); pad(0.82, 0.14, 0.4, M.dark);
    for (let i = 0; i < 4; i++) box(g, col(PASTEL[i + 2], 0.5), 0.13, 0.015, 0.17, -0.55, 0.46 + i * 0.016, 0.1, 0.003).rotation.y = i * 0.12;
    plushCat(M, g, M.catWhite, { x: -1.1, y: 0.45, z: 0.05, s: 0.55, ry: 0.3 });
    lamp(g, 0, 1.0, 0.5, 0.8, '#cdd6ff', 3);
  }, [4.7, 1.9], 3);

  def('sofa', '雙人沙發', 1.7, 0.85, (g) => {
    for (const sx of [-0.75, 0.75]) for (const sz of [-0.32, 0.32]) cyl(g, M.gold, 0.02, 0.015, 0.1, sx, 0.05, sz, 8);
    box(g, M.fabric, 1.7, 0.25, 0.82, 0, 0.225, 0, 0.05);
    for (const sx of [-0.39, 0.39]) box(g, M.fabric, 0.76, 0.13, 0.62, sx, 0.41, 0.07, 0.05);
    box(g, M.fabric, 1.7, 0.5, 0.22, 0, 0.6, -0.3, 0.08);
    for (const sx of [-0.77, 0.77]) box(g, M.fabric, 0.16, 0.5, 0.82, sx, 0.4, 0, 0.07);
    const p1 = box(g, M.cream, 0.42, 0.4, 0.13, -0.45, 0.62, -0.12, 0.06); p1.rotation.set(-0.25, 0.25, 0.08);
    const p2 = box(g, M.accent, 0.38, 0.36, 0.12, 0.45, 0.6, -0.12, 0.06); p2.rotation.set(-0.25, -0.2, -0.06);
    const th = box(g, M.plaid, 0.2, 0.52, 0.7, 0.72, 0.5, 0.05, 0.02); th.rotation.z = -0.05;
    const pad = grp(g, 0.1, 0.49, 0.2, 0.5); box(pad, M.white, 0.14, 0.025, 0.06, 0, 0, 0, 0.012); for (const sx of [-1, 1]) sph(pad, M.white, 0.03, sx * 0.06, -0.002, 0.03, 1, 0.6, 1.2);
  }, [2.35, 1.9], 1);

  def('gameRug', '遊戲區地毯', 1.5, 2.1, (g) => {
    box(g, M.cream, 1.5, 0.02, 2.1, 0, 0.01, 0, 0.01);
    for (const sx of [-1, 1]) box(g, M.accent, 0.04, 0.022, 2.1, sx * 0.68, 0.011, 0, 0.004);
  }, [3.55, 1.9], 0, { rug: true });

  def('catBed', '甜甜圈貓窩', 0.6, 0.6, (g) => {
    const ring = add(g, new THREE.TorusGeometry(0.21, 0.09, 14, 32), M.plush, 0, 0.09, 0); ring.rotation.x = -Math.PI / 2;
    cyl(g, M.accent, 0.22, 0.22, 0.05, 0, 0.035, 0, 28);
    makeCat(M, g, M.catWhite, { x: 0, y: 0.06, z: -0.02, s: 0.85, pose: 'sleep', patch: M.catOrange, ry: 0.8 });
  }, [2.35, 3.4], 0, { round: true });

  /* ================================================================ 中央客廳 */
  def('pawRug', '貓爪地毯', 2.6, 2.3, (g) => {
    const pad = cyl(g, M.rug, 1.0, 1.0, 0.03, 0, 0.015, 0.25, 48); pad.scale.set(1.15, 1, 0.82);
    for (const [x, z] of [[-0.98, -0.5], [-0.36, -0.88], [0.36, -0.88], [0.98, -0.5]]) { cyl(g, M.rug, 0.3, 0.3, 0.03, x, 0.015, z, 32); cyl(g, M.pawPink, 0.17, 0.17, 0.034, x, 0.017, z, 24); }
    const inner = cyl(g, M.pawPink, 0.55, 0.55, 0.034, 0, 0.017, 0.4, 40); inner.scale.set(1.2, 1, 0.75);
  }, [-0.4, 0.65], 0, { rug: true });

  def('coffeeTable', '低矮茶几', 1.1, 0.65, (g) => {
    box(g, M.wood, 1.1, 0.05, 0.65, 0, 0.36, 0, 0.02);
    for (const sx of [-0.48, 0.48]) for (const sz of [-0.26, 0.26]) cyl(g, M.wood, 0.025, 0.02, 0.34, sx, 0.17, sz, 12);
    box(g, M.wood, 0.98, 0.02, 0.52, 0, 0.1, 0, 0.006);
    for (let i = 0; i < 6; i++) book(g, -0.35 + i * 0.045, 0.11, 0.05, 0.04, 0.17, 0.12, PASTEL[(i * 3) % 9], 0).rotation.z = i === 5 ? 0.3 : 0;
    book(g, 0.2, 0.11, 0.0, 0.2, 0.03, 0.28, '#f59bb8', 0.2); book(g, 0.2, 0.14, 0.0, 0.18, 0.025, 0.26, '#fff', 0.1);
    // instant camera + polaroids
    const cam = grp(g, -0.32, 0.385, -0.12, 0.4); box(cam, M.pawPink, 0.13, 0.1, 0.08, 0, 0.05, 0, 0.02); cyl(cam, M.dark, 0.03, 0.03, 0.02, 0, 0.05, 0.045, 18).rotation.x = Math.PI / 2; box(cam, M.white, 0.03, 0.015, 0.01, 0.04, 0.085, 0.041, 0.003);
    polaroid(g, -0.12, 0.385, -0.05, '#9fc8f0', 0.3); polaroid(g, -0.05, 0.387, 0.02, '#f5b8cc', -0.4); polaroid(g, 0.03, 0.385, -0.1, '#ffd9a0', 0.9);
    cupStraw(M, g, 0.18, 0.385, 0.12); cupStraw(M, g, 0.3, 0.385, 0.05, '#ffe2a8', '#f59bb8');
    cyl(g, M.ceramic, 0.09, 0.07, 0.03, 0.34, 0.4, -0.15, 20); for (let i = 0; i < 4; i++) cyl(g, col('#d9a066', 0.8), 0.028, 0.028, 0.01, 0.31 + (i % 2) * 0.05, 0.42 + (i > 1 ? 0.01 : 0), -0.17 + (i % 3) * 0.02, 14);
    phone(M, g, -0.2, 0.385, 0.2, 0.8); chips(g, 0.45, 0.385, 0.2, '#ffd27a', 0.3);
  }, [-0.4, 0.65], 0);

  def('catCushion', '貓臉大抱枕', 0.8, 0.8, (g) => {
    sph(g, M.plush, 0.38, 0, 0.13, 0.02, 1.05, 0.34, 0.95);
    for (const sx of [-1, 1]) { const e = cone(g, M.plush, 0.12, 0.2, sx * 0.24, 0.12, -0.3, 4); e.rotation.set(-1.1, Math.PI / 4, 0); const i = cone(g, M.catPink, 0.06, 0.12, sx * 0.24, 0.14, -0.3, 4); i.rotation.copy(e.rotation); }
    for (const sx of [-1, 1]) { sph(g, M.ink, 0.035, sx * 0.13, 0.25, 0.02, 1, 0.3, 1.2); sph(g, M.catPink, 0.05, sx * 0.21, 0.24, 0.13, 1, 0.2, 0.7); }
    sph(g, M.catPink, 0.025, 0, 0.26, 0.1, 1.2, 0.3, 1);
  }, [-1.35, 0.75], 0, { round: true });

  def('bigPlush', '大黑貓玩偶', 0.8, 0.8, (g) => {
    sph(g, M.cream, 0.34, 0, 0.08, 0, 1, 0.24, 1);
    plushCat(M, g, M.catBlack, { x: 0, y: 0.12, z: -0.05, s: 2.0, ry: 0, yellow: true });
  }, [0.55, 1.4], 3, { round: true });

  const zabuton = (g) => {
    box(g, M.fabric, 0.5, 0.08, 0.5, 0, 0.045, 0, 0.035);
    for (const [x, z] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) sph(g, M.accent, 0.015, x, 0.06, z);
    sph(g, M.accent, 0.015, 0, 0.09, 0);
  };
  def('zabutonA', '坐墊', 0.55, 0.55, zabuton, [-0.4, 1.5], 0);
  def('zabutonB', '坐墊', 0.55, 0.55, zabuton, [-0.45, -0.23], 0);

  def('mangaStack', '漫畫與充電中的手機', 0.45, 0.35, (g) => {
    const r = seeded(21); let y = 0;
    for (let i = 0; i < 7; i++) { const h = 0.025 + r() * 0.015; book(g, -0.08 + (r() - 0.5) * 0.03, y, 0, 0.13, h, 0.19, PASTEL[(i * 7) % 10], (r() - 0.5) * 0.4); y += h; }
    phone(M, g, 0.12, 0, 0.05, 0.4); const c = box(g, M.white, 0.006, 0.004, 0.25, 0.14, 0.003, -0.08, 0.001); c.rotation.y = 0.2;
    box(g, M.white, 0.04, 0.04, 0.03, 0.15, 0.02, -0.18, 0.006);
  }, [0.6, -0.1], 0);

  /* ================================================================ 零食角（左前） */
  def('fridge', '透明門小冰箱', 0.55, 0.55, (g) => {
    for (const sx of [-1, 1]) box(g, M.white, 0.04, 0.85, 0.52, sx * 0.255, 0.44, 0, 0.012);
    box(g, M.white, 0.55, 0.06, 0.52, 0, 0.84, 0, 0.012); box(g, M.white, 0.55, 0.07, 0.52, 0, 0.05, 0, 0.012);
    box(g, col('#eef4fa', 0.3), 0.47, 0.74, 0.02, 0, 0.44, -0.24, 0.004);          // bright interior back
    for (const y of [0.3, 0.55]) box(g, M.glass, 0.47, 0.01, 0.42, 0, y, 0.0, 0.002);
    const r = seeded(5);
    for (let i = 0; i < 5; i++) can(g, -0.18 + i * 0.09, 0.08, 0.05 + (r() - 0.5) * 0.05, PASTEL[(i * 3 + 1) % 8]);
    for (let i = 0; i < 4; i++) bottle(g, -0.16 + i * 0.1 + (r() - 0.5) * 0.02, 0.31, 0.03, ['#8fd0c0', '#ffd27a', '#7ab8ff', '#f59bb8'][i], 0.2 + r() * 0.04, 0.028);
    for (let i = 0; i < 3; i++) can(g, -0.12 + i * 0.12, 0.56, 0.02, PASTEL[(i + 5) % 8]); bottle(g, 0.18, 0.56, 0.0, '#fff4e0', 0.16, 0.035);
    box(g, M.glass, 0.51, 0.8, 0.015, 0, 0.44, 0.265, 0.004);
    box(g, M.chrome, 0.02, 0.35, 0.03, 0.22, 0.5, 0.285, 0.006);
    // top: cups, straws, candy jar, microwave-free clutter
    candyJar(M, g, -0.15, 0.865, -0.05);
    cyl(g, M.ceramic, 0.04, 0.04, 0.12, 0.05, 0.925, -0.1, 14); for (let i = 0; i < 5; i++) { const s = cyl(g, col(PASTEL[i], 0.4), 0.004, 0.004, 0.2, 0.05 + (i - 2) * 0.01, 1.0, -0.1, 6); s.rotation.z = (i - 2) * 0.1; }
    for (let i = 0; i < 3; i++) cyl(g, M.glass, 0.035, 0.03, 0.1, 0.16, 0.915 + i * 0.03, 0.08, 14);
  }, [-4.72, 2.55], 1);

  def('cart', '三層零食推車', 0.7, 0.45, (g) => {
    for (const sx of [-0.32, 0.32]) for (const sz of [-0.19, 0.19]) { cyl(g, M.white, 0.012, 0.012, 0.8, sx, 0.44, sz, 8); sph(g, M.dark, 0.025, sx, 0.025, sz); }
    const r = seeded(17);
    const tiers = [0.12, 0.44, 0.76];
    for (const y of tiers) {
      box(g, M.paint, 0.66, 0.02, 0.4, 0, y, 0, 0.005);
      box(g, M.paint, 0.66, 0.06, 0.012, 0, y + 0.03, 0.2, 0.004); box(g, M.paint, 0.66, 0.06, 0.012, 0, y + 0.03, -0.2, 0.004);
      box(g, M.paint, 0.012, 0.06, 0.4, 0.33, y + 0.03, 0, 0.004); box(g, M.paint, 0.012, 0.06, 0.4, -0.33, y + 0.03, 0, 0.004);
    }
    // bottom: chips bags + cookie box
    chips(g, -0.2, 0.13, 0.02, '#ffd27a', 0.1); chips(g, -0.05, 0.13, -0.05, '#e0344e', -0.2); chips(g, 0.08, 0.13, 0.06, '#7ab8ff', 0.3);
    box(g, col('#d9a066', 0.7), 0.16, 0.08, 0.14, 0.22, 0.17, 0.0, 0.01).rotation.y = 0.2;
    // middle: cans, bottles, candy
    for (let i = 0; i < 4; i++) can(g, -0.24 + i * 0.07 + r() * 0.01, 0.45, -0.08 + r() * 0.05, PASTEL[(i + 2) % 8]);
    bottle(g, 0.08, 0.45, 0.07, '#8fd0c0', 0.24); bottle(g, 0.16, 0.45, -0.05, '#f59bb8', 0.2);
    for (let i = 0; i < 6; i++) sph(g, col(PASTEL[i], 0.3), 0.018, 0.22 + (r() - 0.5) * 0.12, 0.47, 0.08 + (r() - 0.5) * 0.08, 1.4, 0.7, 1);
    // top: cups with straws, candy jar, cookies
    cupStraw(M, g, -0.2, 0.77, 0.05); cupStraw(M, g, -0.08, 0.77, -0.06, '#ffe2a8', '#f59bb8');
    candyJar(M, g, 0.08, 0.77, 0.04);
    cyl(g, M.ceramic, 0.07, 0.06, 0.02, 0.22, 0.78, -0.05, 18); for (let i = 0; i < 3; i++) cyl(g, col('#d9a066', 0.8), 0.025, 0.025, 0.008, 0.2 + i * 0.02, 0.795 + i * 0.008, -0.06, 12);
  }, [-4.35, 3.5], 0);

  def('snackBox', '零食紙箱', 0.45, 0.45, (g) => {
    box(g, M.card, 0.4, 0.02, 0.36, 0, 0.01, 0, 0.004);
    for (const sz of [-1, 1]) { box(g, M.card, 0.4, 0.26, 0.012, 0, 0.13, sz * 0.18, 0.003); const f = box(g, M.card, 0.4, 0.012, 0.14, 0, 0.26, sz * 0.25, 0.003); f.rotation.x = sz * 0.5; }
    for (const sx of [-1, 1]) box(g, M.card, 0.012, 0.26, 0.36, sx * 0.2, 0.13, 0, 0.003);
    chips(g, -0.1, 0.1, -0.05, '#ff8a65', 0.2); chips(g, 0.07, 0.12, 0.04, '#c8b0e6', -0.3);
    for (let i = 0; i < 3; i++) can(g, -0.12 + i * 0.1, 0.2, 0.11, PASTEL[i + 4]);
  }, [-3.55, 3.55], 0);

  def('pumpkin', '南瓜坐墩', 0.6, 0.6, (g) => {
    cyl(g, M.fabric, 0.18, 0.18, 0.32, 0, 0.19, 0, 24);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const l = sph(g, M.fabric, 0.18, Math.cos(a) * 0.13, 0.19, Math.sin(a) * 0.13, 0.7, 0.95, 1); l.rotation.y = -a; }
    sph(g, M.accent, 0.03, 0, 0.36, 0, 1, 0.5, 1);
  }, [-3.45, 2.6], 0, { round: true });

  /* ================================================================ 左牆收納 */
  def('bookshelf', '書櫃（漫畫＋收藏）', 1.3, 0.35, (g) => {
    const H = 1.9, r = seeded(77);
    for (const sx of [-0.635, 0, 0.635]) box(g, M.white, 0.03, H, 0.35, sx, H / 2, 0, 0.006);
    box(g, M.white, 1.3, H, 0.015, 0, H / 2, -0.17, 0.004);
    const ys = [0.03, 0.4, 0.78, 1.16, 1.54, 1.885];
    for (const y of ys) box(g, M.white, 1.3, 0.03, 0.35, 0, y, 0, 0.006);
    for (let s = 0; s < 5; s++) for (const half of [-1, 1]) {
      const y0 = ys[s] + 0.015, x0 = half < 0 ? -0.6 : 0.03, x1 = half < 0 ? -0.03 : 0.6;
      const kind = (s * 2 + (half > 0)) % 4;
      if (kind === 0 || kind === 2) {          // books, some leaning
        let x = x0 + 0.01;
        while (x < x1 - (kind === 2 ? 0.2 : 0.05)) { const w = 0.025 + r() * 0.02, h = 0.2 + r() * 0.1; book(g, x + w / 2, y0, 0.02, w, h, 0.2, PASTEL[(r() * 10) | 0]); x += w + 0.003; }
        if (kind === 2) { const b = book(g, x1 - 0.08, y0, 0.02, 0.03, 0.27, 0.2, '#f59bb8'); b.rotation.z = 0.35; b.position.x -= 0.04; }
      } else if (kind === 1) {                 // storage bin + plush
        box(g, M.sisal, 0.3, 0.2, 0.28, x0 + 0.17, y0 + 0.1, 0.02, 0.02);
        plushCat(M, g, M.catWhite, { x: x1 - 0.12, y: y0, z: 0.02, s: 0.55, ry: -0.2 });
      } else {                                  // figures, camera, plant
        for (let i = 0; i < 3; i++) figure(g, M, x0 + 0.08 + i * 0.09, y0, 0.03, i + s, 1.2);
        const pot = cyl(g, M.ceramic, 0.05, 0.04, 0.08, x1 - 0.1, y0 + 0.04, 0, 14); pot.castShadow = true;
        for (let i = 0; i < 5; i++) sph(g, i % 2 ? M.leaf : M.leaf2, 0.045, x1 - 0.1 + Math.cos(i) * 0.04, y0 + 0.11 + (i % 2) * 0.02, Math.sin(i) * 0.04, 1, 0.6, 1);
      }
    }
    const cam = grp(g, 0.3, ys[5] + 0.015, 0.02, -0.3); box(cam, M.dark, 0.14, 0.09, 0.07, 0, 0.045, 0, 0.012); cyl(cam, M.chrome, 0.03, 0.03, 0.05, 0, 0.045, 0.05, 16).rotation.x = Math.PI / 2;
    box(g, M.wood, 0.28, 0.18, 0.25, -0.35, ys[5] + 0.105, 0, 0.02);
  }, [-4.82, -0.2], 1);

  def('figcase', '公仔展示櫃', 0.9, 0.4, (g) => {
    const H = 1.9;
    for (const sx of [-0.435, 0, 0.435]) box(g, M.wood, 0.03, H, 0.4, sx, H / 2, 0, 0.008);
    box(g, M.wood, 0.9, 0.03, 0.4, 0, H - 0.015, 0, 0.008); box(g, M.wood, 0.9, 0.06, 0.4, 0, 0.03, 0, 0.008);
    box(g, M.wood, 0.88, H, 0.02, 0, H / 2, -0.19, 0.004);
    let n = 0;
    for (const y of [0.06, 0.44, 0.82, 1.2, 1.56]) {
      if (y > 0.1) box(g, M.white, 0.84, 0.015, 0.36, 0, y, 0, 0.004);
      for (const cx of [-0.22, 0.22]) for (const k of [-1, 0, 1]) figure(g, M, cx + k * 0.1, y + 0.008, k ? 0.04 : -0.06, n++, 1.3);
    }
    for (const y of [0.44, 0.82, 1.2, 1.56, 1.875]) warmStrip(g, 0.8, y - 0.016, 0.16);
    box(g, M.glass, 0.86, H - 0.1, 0.01, 0, H / 2, 0.2, 0.003);
  }, [-4.8, 1.2], 1);

  def('laundry', '收納籃', 0.5, 0.5, (g) => {
    cyl(g, M.sisal, 0.23, 0.2, 0.36, 0, 0.18, 0, 24);
    const rim = add(g, new THREE.TorusGeometry(0.23, 0.018, 8, 32), M.sisal, 0, 0.36, 0); rim.rotation.x = Math.PI / 2;
    const c1 = box(g, M.fabric, 0.3, 0.1, 0.26, -0.02, 0.38, 0.0, 0.04); c1.rotation.set(0.2, 0.3, 0.1);
    const c2 = box(g, M.cream, 0.34, 0.03, 0.2, 0.12, 0.34, 0.1, 0.012); c2.rotation.set(0.3, -0.4, -0.6);
  }, [-4.2, 0.95], 0, { round: true });

  /* ================================================================ 散落生活細節 */
  def('bags', '購物袋', 0.5, 0.35, (g) => {
    for (const [x, mat, h, ry] of [[-0.14, M.pawPink, 0.34, 0.1], [0.05, M.white, 0.28, -0.15], [0.19, col('#c8b0e6', 0.7), 0.22, 0.2]]) {
      const b = grp(g, x, 0, 0, ry);
      box(b, mat, 0.16, h, 0.1, 0, h / 2, 0, 0.008);
      add(b, new THREE.TorusGeometry(0.04, 0.006, 6, 16, Math.PI), M.dark, 0, h, 0);
      box(b, M.ink, 0.06, 0.03, 0.002, 0, h * 0.6, 0.051, 0.001);
    }
  }, [-0.35, -2.95], 0);

  def('cloudLamp', '雲朵落地燈', 0.45, 0.45, (g) => {
    cyl(g, M.white, 0.15, 0.17, 0.03, 0, 0.015, 0); cyl(g, M.white, 0.012, 0.012, 1.3, 0, 0.68, 0, 8);
    for (const [x, y, z, r] of [[0, 1.42, 0, 0.16], [-0.14, 1.38, 0.02, 0.12], [0.14, 1.37, 0, 0.13], [0.06, 1.5, -0.02, 0.12], [-0.07, 1.48, 0.04, 0.1]]) sph(g, M.bulbSoft, r, x, y, z);
    lamp(g, 0, 1.0, 0.55, 0.7, '#ffe2bc', 4);
  }, [2.35, 0.55], 0, { round: true });

  def('monstera', '龜背芋', 0.6, 0.6, (g) => {
    cyl(g, M.ceramic, 0.2, 0.16, 0.36, 0, 0.18, 0, 28); cyl(g, M.soil, 0.19, 0.19, 0.02, 0, 0.355, 0);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + i, tilt = 0.35 + (i % 3) * 0.25, len = 0.55 + (i % 4) * 0.15;
      const arm = grp(g, 0, 0.36, 0, a);
      const st = cyl(arm, M.leaf, 0.008, 0.012, len, Math.sin(tilt) * len / 2, Math.cos(tilt) * len / 2, 0, 6); st.rotation.z = -tilt;
      const lf = sph(arm, i % 2 ? M.leaf : M.leaf2, 0.17, Math.sin(tilt) * len, Math.cos(tilt) * len + 0.02, 0, 1.2, 0.07, 1); lf.rotation.z = -tilt * 0.8;
    }
  }, [-2.0, -0.3], 0, { round: true });

  const potPlant = (g, h, seed) => {
    cyl(g, M.ceramic, 0.18, 0.14, 0.3, 0, 0.15, 0, 28); cyl(g, M.soil, 0.17, 0.17, 0.02, 0, 0.295, 0);
    cyl(g, M.trunk, 0.02, 0.03, h, 0, 0.3 + h / 2, 0, 8);
    const r = seeded(seed);
    for (let i = 0; i < 16; i++) {
      const y = 0.5 + r() * (h - 0.1), a = r() * 7, d = 0.08 + r() * 0.16;
      const lf = sph(g, i % 2 ? M.leaf : M.leaf2, 0.1, Math.cos(a) * d, y, Math.sin(a) * d, 1, 0.35, 1.4); lf.rotation.set(r() - 0.5, a, 0.5);
    }
  };
  def('plantA', '琴葉榕', 0.55, 0.55, (g) => potPlant(g, 1.1, 3), [4.6, 3.6], 0, { round: true });
  def('plantB', '小盆栽', 0.5, 0.5, (g) => potPlant(g, 0.55, 9), [-2.85, 3.6], 0, { round: true });

  def('cubeShelf', '格子矮櫃（隔間）', 1.2, 0.36, (g) => {
    const W = 1.2, H = 0.8;
    for (const sx of [-0.59, -0.2, 0.2, 0.59]) box(g, M.white, 0.025, H, 0.36, sx, H / 2, 0, 0.006);
    for (const y of [0.02, 0.4, 0.785]) box(g, M.white, W, 0.03, 0.36, 0, y, 0, 0.006);
    box(g, M.white, W, H, 0.012, 0, H / 2, -0.17, 0.004);
    box(g, M.sisal, 0.34, 0.33, 0.3, -0.395, 0.2, 0.01, 0.02); box(g, M.fabric, 0.34, 0.33, 0.3, 0.395, 0.2, 0.01, 0.02);
    for (let i = 0; i < 7; i++) book(g, -0.16 + i * 0.045, 0.035, 0.0, 0.035, 0.24 + (i % 3) * 0.04, 0.2, PASTEL[(i * 3 + 2) % 10]);
    plushCat(M, g, M.catWhite, { x: -0.39, y: 0.415, z: 0.02, s: 0.65, ry: 0.2 });
    box(g, M.pawPink, 0.3, 0.3, 0.3, 0.0, 0.565, 0.01, 0.02); box(g, M.white, 0.3, 0.3, 0.3, 0.395, 0.565, 0.01, 0.02);
    // top: plant, framed photo, speaker, candle
    cyl(g, M.ceramic, 0.07, 0.055, 0.12, -0.45, 0.86, 0, 16); for (let i = 0; i < 7; i++) sph(g, i % 2 ? M.leaf : M.leaf2, 0.06, -0.45 + Math.cos(i) * 0.06, 0.96 + (i % 3) * 0.03, Math.sin(i) * 0.06, 1, 0.6, 1);
    const fr = box(g, M.wood, 0.14, 0.18, 0.02, -0.15, 0.89, -0.05, 0.005); fr.rotation.x = -0.15; add(g, new THREE.PlaneGeometry(0.1, 0.13), col('#9fc8f0', 0.5), -0.15, 0.895, -0.035).rotation.x = -0.15;
    box(g, M.white, 0.16, 0.1, 0.1, 0.12, 0.85, 0, 0.03);
    cyl(g, M.cream, 0.04, 0.04, 0.07, 0.4, 0.835, 0.05, 14); sph(g, M.bulbSoft, 0.012, 0.4, 0.885, 0.05, 1, 1.6, 1);
  }, [-2.25, 2.5], 1);

  def('plushPile', '玩偶抱枕堆', 0.8, 0.6, (g) => {
    const p1 = box(g, M.cream, 0.5, 0.14, 0.45, -0.1, 0.07, 0, 0.06); p1.rotation.y = 0.3;
    const p2 = box(g, M.fabric, 0.42, 0.12, 0.38, 0.08, 0.19, 0.02, 0.05); p2.rotation.y = -0.4;
    const p3 = box(g, M.accent, 0.3, 0.28, 0.1, -0.22, 0.3, -0.14, 0.05); p3.rotation.set(-0.4, 0.3, 0);
    plushCat(M, g, M.catGray, { x: 0.12, y: 0.25, z: 0.04, s: 0.95, ry: -0.3 });
    plushCat(M, g, M.catWhite, { x: 0.26, y: 0.0, z: 0.14, s: 0.75, ry: -0.6 });
  }, [-1.1, 2.6], 0);

  def('gifts', '禮物盒', 0.6, 0.5, (g) => {
    const gift = (x, z, s, mat, rib, ry, y = 0) => {
      const b = grp(g, x, y, z, ry);
      box(b, mat, s, s * 0.8, s, 0, s * 0.4, 0, 0.01);
      box(b, rib, s + 0.004, s * 0.8 + 0.004, 0.03, 0, s * 0.4, 0, 0.004); box(b, rib, 0.03, s * 0.8 + 0.004, s + 0.004, 0, s * 0.4, 0, 0.004);
      for (const sx of [-1, 1]) sph(b, rib, 0.035, sx * 0.035, s * 0.8 + 0.02, 0, 1.2, 0.7, 0.6);
    };
    gift(-0.12, 0, 0.3, M.pawPink, M.white, 0.2);
    gift(0.17, 0.06, 0.22, M.white, M.accent, -0.3);
    gift(-0.1, 0.0, 0.17, col('#c8b0e6', 0.6), M.white, 0.6, 0.24);
  }, [-0.1, 3.45], 0);

  def('plantC', '天堂鳥', 0.55, 0.55, (g) => potPlant(g, 0.9, 15), [0.85, 3.5], 0, { round: true });

  // cats
  def('catBlack', '黑貓', 0.35, 0.35, (g) => makeCat(M, g, M.catBlack, { pose: 'sit', s: 1.1 }), [1.55, -1.45], 3, { round: true });
  def('catGray', '灰貓', 0.45, 0.55, (g) => makeCat(M, g, M.catGray, { pose: 'loaf', s: 1.0 }), [-3.2, 1.6], 1, { round: true });

  return defs;
}
