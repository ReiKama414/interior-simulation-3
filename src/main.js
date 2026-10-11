import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createMaterials, PALETTE } from './materials.js';
import { createFurniture } from './furniture.js';
import { buildRoom } from './room.js';

/* ------------------------------------------------------------------ renderer */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const BG = '#140e1f';
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BG, 40, 90);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const HOME = { pos: new THREE.Vector3(15.5, 12.5, 17.5), target: new THREE.Vector3(0, 0.6, 0) };
camera.position.copy(HOME.pos);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.4, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME.target);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 3; controls.maxDistance = 70;
controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.5;
controls.zoomToCursor = true;

/* ------------------------------------------------------------------ world */
const M = createMaterials();
const lamps = [];
const room = buildRoom(M, lamps);
scene.add(room.group);

const hemi = new THREE.HemisphereLight('#fff1e4', '#3a3028', 0.6); scene.add(hemi);
function dirLight(size = 4096) {
  const l = new THREE.DirectionalLight('#fff', 1); l.castShadow = true;
  l.shadow.mapSize.set(size, size);
  const c = l.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 80;
  l.shadow.bias = -0.0004; l.shadow.normalBias = 0.035; l.shadow.radius = 4;
  l.target.position.set(0, 0.5, 0); scene.add(l, l.target); return l;
}
const sun = dirLight(4096), moon = dirLight(2048);
const fill = new THREE.DirectionalLight('#fff', 0); fill.position.set(12, 14, 16); scene.add(fill);

/* ------------------------------------------------------------------ furniture */
const defs = createFurniture(M, lamps);
const pieces = defs.map((d) => {
  const g = new THREE.Group();
  d.build(g);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = !d.rug && !o.material.transparent && o.material !== M.neonHot && o.material !== M.ledWarm && !o.material.isMeshBasicMaterial; o.receiveShadow = true; } });
  g.userData.piece = d;
  d.group = g; d.pos = new THREE.Vector2(...d.pos); d.home = { pos: d.pos.clone(), rot: d.rot };
  d.rotT = d.rot * Math.PI / 2; d.rotCur = d.rotT; d.target = d.pos.clone(); d.lift = 0;
  g.position.set(d.pos.x, 0, d.pos.y); g.rotation.y = d.rotCur;
  scene.add(g); return d;
});

const half = (p) => (p.rot % 2 ? [p.d / 2, p.w / 2] : [p.w / 2, p.d / 2]);
const BOUNDS = { x0: -5, x1: 5, z0: -4, z1: 4 };
const GRID = 0.25;

function clampPos(p, v) {
  const [hx, hz] = half(p);
  return new THREE.Vector2(
    THREE.MathUtils.clamp(v.x, BOUNDS.x0 + hx, BOUNDS.x1 - hx),
    THREE.MathUtils.clamp(v.y, BOUNDS.z0 + hz, BOUNDS.z1 - hz));
}
function snap(v) { return new THREE.Vector2(Math.round(v.x / GRID) * GRID, Math.round(v.y / GRID) * GRID); }
function collides(p, v) {
  if (p.rug) return false;
  const [hx, hz] = half(p);
  return pieces.some((o) => {
    if (o === p || o.rug) return false;
    const [ox, oz] = half(o);
    return Math.abs(v.x - o.pos.x) < hx + ox - 0.02 && Math.abs(v.y - o.pos.y) < hz + oz - 0.02;
  });
}
function fitSnap(p, v) { return clampPos(p, snap(v)); }

/* ------------------------------------------------------------------ ghost footprint */
const ghostTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  g.shadowColor = '#fff'; g.shadowBlur = 14; g.strokeStyle = '#fff'; g.lineWidth = 6; rr(14, 14, 228, 228, 26); g.stroke();
  g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.26)'; rr(18, 18, 220, 220, 22); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const OK_COL = '#ffa6d8', BAD_COL = '#ff6a6a';
const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: ghostTex, transparent: true, depthWrite: false, color: OK_COL, toneMapped: false }));
ghost.rotation.x = -Math.PI / 2; ghost.position.y = 0.05; ghost.visible = false; ghost.renderOrder = 5; scene.add(ghost);
function updateGhost(p, v, ok) {
  const [hx, hz] = half(p);
  ghost.scale.set(hx * 2 + 0.16, hz * 2 + 0.16, 1);
  ghost.position.x = v.x; ghost.position.z = v.y;
  ghost.material.color.set(ok ? OK_COL : BAD_COL);
}

/* ------------------------------------------------------------------ pointer interaction */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tip = document.getElementById('tip');
let drag = null, hover = null, lastTap = { p: null, t: 0 };

function setNdc(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pick() {
  const hit = ray.intersectObjects(pieces.map((p) => p.group), true)
    .find((h) => h.object.visible && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.5));
  if (!hit) return null;
  let o = hit.object; while (o && !o.userData.piece) o = o.parent;
  return o ? o.userData.piece : null;
}
function floorPoint() { const v = new THREE.Vector3(); return ray.ray.intersectPlane(floorPlane, v) ? v : null; }

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  setNdc(e);
  const p = pick(); if (!p) return;
  const fp = floorPoint(); if (!fp) return;
  drag = { p, offset: new THREE.Vector2(p.pos.x - fp.x, p.pos.y - fp.z), start: p.pos.clone(), startRot: p.rot, ok: true, cand: p.pos.clone() };
  controls.enabled = false; canvas.setPointerCapture(e.pointerId);
  ghost.visible = true; updateGhost(p, p.pos, true);
  canvas.style.cursor = 'grabbing';
}, true);

canvas.addEventListener('pointermove', (e) => {
  if (sw) return;
  setNdc(e);
  if (drag) {
    const fp = floorPoint(); if (!fp) return;
    const cand = fitSnap(drag.p, new THREE.Vector2(fp.x + drag.offset.x, fp.z + drag.offset.y));
    drag.cand = cand; drag.ok = !collides(drag.p, cand);
    drag.p.target.copy(cand); updateGhost(drag.p, cand, drag.ok);
    showTip(e, drag.p, drag.ok);
  } else {
    hover = pick();
    canvas.style.cursor = hover ? 'grab' : '';
    showTip(e, hover, true);
  }
});
function endDrag() {
  if (!drag) return;
  const { p } = drag;
  const moved = drag.ok && !drag.cand.equals(p.pos);
  const now = performance.now();
  if (!moved && p.rot === drag.startRot) { if (lastTap.p === p && now - lastTap.t < 380) { lastTap.p = null; rotate(p); } else lastTap = { p, t: now }; }
  if (drag.ok) { p.pos.copy(drag.cand); } else { p.target.copy(p.pos); }
  p.target.copy(p.pos);
  if (moved || p.rot !== drag.startRot) commit();
  drag = null; ghost.visible = false; controls.enabled = true; canvas.style.cursor = hover ? 'grab' : '';
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => { tip.style.opacity = 0; });

function rotate(p) {
  const old = p.rot; p.rot = (p.rot + 1) % 4; p.rotT += Math.PI / 2;
  const base = drag && drag.p === p ? drag.cand : p.pos;
  const c = clampPos(p, base);
  if (drag && drag.p === p) { drag.cand = c; drag.ok = !collides(p, c); p.target.copy(c); updateGhost(p, c, drag.ok); }
  else if (collides(p, c)) { p.rot = old; p.rotT -= Math.PI / 2; }
  else { p.pos.copy(c); p.target.copy(c); }
  if (!drag) commit();
}
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'r') return;
  const p = drag ? drag.p : hover; if (p) rotate(p);
});
canvas.addEventListener('dblclick', (e) => { setNdc(e); const p = pick(); if (p) rotate(p); });

function showTip(e, p, ok) {
  if (!p) { tip.style.opacity = 0; return; }
  tip.classList.toggle('bad', !ok);
  tip.innerHTML = `${p.name}<small>${ok ? '拖曳移動 · R 旋轉' : '這裡放不下'}</small>`;
  tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.style.opacity = 1;
}

function resetLayout() {
  pieces.forEach((p) => { p.rot = p.home.rot; p.rotT = p.rot * Math.PI / 2; p.pos.copy(p.home.pos); p.target.copy(p.home.pos); });
  applyMood(MOODS[0]);
  commit();
}

/* ------------------------------------------------------------------ palette tweening */
const tw = new Map(); // material -> target color
const paletteState = {};
function setSlot(slot, hex) {
  paletteState[slot] = hex;
  const c = new THREE.Color(hex);
  tw.set(M[slot], c);
  if (slot === 'wall') tw.set(M.wallAccent, c.clone().multiplyScalar(0.94).lerp(new THREE.Color('#b07a9a'), 0.06));
  if (slot === 'wood') tw.set(M.paint, c.clone().lerp(new THREE.Color('#ffffff'), 0.35));
  refreshSwatchState();
}

/* ------------------------------------------------------------------ daylight */
const C = (h) => new THREE.Color(h);
const KF = [
  { h: 0,    sky: C('#0a0a1e'), sun: C('#000'),    sunI: 0,   moonI: 0.45, hemi: 0.3,  ex: 1.1,  lamp: 1 },
  { h: 5,    sky: C('#171634'), sun: C('#000'),    sunI: 0,   moonI: 0.4,  hemi: 0.32, ex: 1.1,  lamp: 1 },
  { h: 6.3,  sky: C('#f0a08a'), sun: C('#ff9d7a'), sunI: 0.5, moonI: 0.1,  hemi: 0.36, ex: 1.05, lamp: 0.55 },
  { h: 8,    sky: C('#c8d8f2'), sun: C('#ffe2c8'), sunI: 2.4, moonI: 0,    hemi: 0.55, ex: 1,    lamp: 0.05 },
  { h: 12,   sky: C('#a9cff4'), sun: C('#fff4ea'), sunI: 3.1, moonI: 0,    hemi: 0.62, ex: 1,    lamp: 0 },
  { h: 16,   sky: C('#b8d0ee'), sun: C('#ffe4c8'), sunI: 2.8, moonI: 0,    hemi: 0.58, ex: 1,    lamp: 0.05 },
  { h: 18,   sky: C('#f4a08e'), sun: C('#ff8f6a'), sunI: 1.8, moonI: 0,    hemi: 0.42, ex: 1.0,  lamp: 0.6 },
  { h: 19.5, sky: C('#4a3470'), sun: C('#ff6a6a'), sunI: 0.3, moonI: 0.2,  hemi: 0.32, ex: 1.08, lamp: 0.95 },
  { h: 21,   sky: C('#15112e'), sun: C('#000'),    sunI: 0,   moonI: 0.42, hemi: 0.3,  ex: 1.1,  lamp: 1 },
  { h: 24,   sky: C('#0a0a1e'), sun: C('#000'),    sunI: 0,   moonI: 0.45, hemi: 0.3,  ex: 1.1,  lamp: 1 },
];
function sample(t) {
  let i = 0; while (i < KF.length - 2 && t >= KF[i + 1].h) i++;
  const a = KF[i], b = KF[i + 1], f = THREE.MathUtils.clamp((t - a.h) / (b.h - a.h), 0, 1), s = f * f * (3 - 2 * f);
  const n = (k) => a[k] + (b[k] - a[k]) * s;
  return { sky: a.sky.clone().lerp(b.sky, s), sun: a.sun.clone().lerp(b.sun, s), sunI: n('sunI'), moonI: n('moonI'), hemi: n('hemi'), ex: n('ex'), lamp: n('lamp') };
}
const bg = new THREE.Color(BG);
let lamState = 0, neonGain = 2;
function applyTime(t) {
  const k = sample(t);
  const el = THREE.MathUtils.degToRad(6 + 50 * Math.max(0, Math.sin(Math.PI * (t - 6) / 12)));
  const phi = THREE.MathUtils.degToRad(THREE.MathUtils.clamp((t - 12) / 6, -1.1, 1.1) * 80);
  const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(el), Math.sin(el), -Math.cos(phi) * Math.cos(el));
  sun.position.copy(dir).multiplyScalar(35).add(sun.target.position);
  sun.color.copy(k.sun); sun.intensity = k.sunI; sun.visible = k.sunI > 0.01;
  moon.position.set(-10, 20, -14).add(moon.target.position);
  moon.color.set('#8f86d8'); moon.intensity = k.moonI; moon.visible = k.moonI > 0.01;
  hemi.color.copy(k.sky).lerp(new THREE.Color('#fff1e4'), 0.55); hemi.groundColor.set('#3a3028').lerp(k.sky, 0.15); hemi.intensity = k.hemi;
  fill.color.copy(k.sky).lerp(new THREE.Color('#fff4ea'), 0.6); fill.intensity = 0.35 + 0.75 * Math.min(1, k.sunI / 2.6) + 0.12 * k.moonI;
  renderer.toneMappingExposure = k.ex;
  bg.set(BG).lerp(k.sky.clone().lerp(new THREE.Color('#3a2a4c'), 0.6), 0.16);
  scene.background = bg; scene.fog.color.copy(bg);
  M.ground.color.copy(bg).multiplyScalar(1.25);
  M.sky.color.copy(k.sky);
  M.city.emissiveIntensity = k.lamp * 1.2;
  M.city.color.set('#ffffff').lerp(new THREE.Color('#6a6a90'), k.lamp);
  M.paper.emissiveIntensity = 0.05 + k.lamp * 0.5;
  M.bulb.emissiveIntensity = 0.2 + k.lamp * 0.55;
  M.bulbSoft.emissiveIntensity = 0.1 + k.lamp * 0.25;
  M.bulbCool.emissiveIntensity = 0.3 + k.lamp * 0.6;
  M.water.emissiveIntensity = 0.2 + k.lamp * 0.5;
  M.screens.forEach((m) => m.color.setScalar(0.72 + 0.2 * k.lamp));
  M.ledWarm.color.set('#ffb070').multiplyScalar(0.35 + 1.1 * k.lamp);
  neonGain = 0.85 + 0.6 * k.lamp;
  bloom.strength = 0.2 + 0.3 * k.lamp;
  lamps.forEach((l) => { l.light.intensity = l.base * Math.max(l.min || 0, k.lamp); });
  lamState = k.lamp;
}

/* ------------------------------------------------------------------ UI */
const $ = (id) => document.getElementById(id);
const timeEl = $('time'); let time = 21.5, timeGoal = 21.5;
const fmt = (t) => { const h = Math.floor(t) % 24, m = Math.floor((t % 1) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };
timeEl.oninput = () => { timeGoal = time = +timeEl.value; applyTime(time); syncTimeUI(); };
function syncTimeUI() {
  $('clock').textContent = fmt(time); timeEl.value = time;
  $('lampState').textContent = lamState > 0.7 ? '全亮' : lamState > 0.25 ? '微亮' : lamState > 0.02 ? '漸亮' : '熄滅';
  [...$('times').children].forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.t - time) < 1.2));
}
const ICONS = {
  sunrise: '<path d="M12 3v5"/><path d="m8.5 5.5 3.5-3 3.5 3"/><path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M4 14l1.5 1M20 14l-1.5 1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sunset: '<path d="M12 8V3"/><path d="m8.5 5.5 3.5 3 3.5-3"/><path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M4 14l1.5 1M20 14l-1.5 1"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
};
[['早晨', 8, 'sunrise'], ['正午', 12, 'sun'], ['傍晚', 17.8, 'sunset'], ['夜晚', 22, 'moon']].forEach(([n, t, ic]) => {
  const b = document.createElement('button'); b.title = n; b.setAttribute('aria-label', n); b.dataset.t = t;
  b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic]}</svg>`;
  b.onclick = () => { timeGoal = t; }; $('times').appendChild(b);
});

const pickHex = (slot, i) => PALETTE[slot].items[i][1];
const MOODS = [
  { id: 'sakura', en: 'SAKURA', t: 21.5, note: '奶油白牆與淺木地板，暖燈下貓咪在打盹',
    set: { wall: 1, floor: 0, fabric: 0, accent: 0, wood: 0, rug: 0, neon: 0 } },
  { id: 'lilac', en: 'LILAC', t: 22.5, note: '芋泥紫與電光霓虹，熬夜打遊戲的房間',
    set: { wall: 2, floor: 1, fabric: 2, accent: 2, wood: 3, rug: 2, neon: 1 } },
  { id: 'peach', en: 'PEACH', t: 15, note: '蜜桃奶油的午後，陽光灑在懶骨頭上',
    set: { wall: 3, floor: 3, fabric: 3, accent: 1, wood: 2, rug: 3, neon: 4 } },
];
let moodId = null;
function applyMood(m) {
  moodId = m.id;
  Object.entries(m.set).forEach(([slot, i]) => setSlot(slot, pickHex(slot, i)));
  timeGoal = m.t;
  $('moodNote').textContent = m.note;
  [...$('moods').children].forEach((el) => el.classList.toggle('on', el.dataset.id === m.id));
  if (typeof commit === 'function' && hist.length) commit();
}
MOODS.forEach((m) => {
  const el = document.createElement('button'); el.className = 'mood'; el.dataset.id = m.id;
  el.innerHTML = `<b>${m.en}</b><div class="dots">${['wall', 'fabric', 'accent', 'neon'].map((s) => `<i style="background:${pickHex(s, m.set[s])}"></i>`).join('')}</div>`;
  el.onclick = () => applyMood(m); $('moods').appendChild(el);
});

let tab = 'wall';
Object.entries(PALETTE).forEach(([slot, v]) => {
  const b = document.createElement('button'); b.textContent = v.label; b.dataset.slot = slot;
  b.onclick = () => { tab = slot; renderSwatches(); }; $('tabs').appendChild(b);
});
const slotOf = new Map([[M.floor, 'floor'], [M.wall, 'wall'], [M.wallAccent, 'wall'], [M.wood, 'wood'], [M.paint, 'wood'], [M.fabric, 'fabric'],
  [M.accent, 'accent'], [M.rug, 'rug'], [M.neonHot, 'neon'], ...M.neonSigns.map((m) => [m, 'neon'])]);
const SLOT_MATS = { floor: [M.floor], wall: [M.wall, M.wallAccent], wood: [M.wood, M.paint], fabric: [M.fabric], accent: [M.accent], rug: [M.rug] };
const pickTargets = [room.group, ...pieces.map((p) => p.group)];
let flashSlot = null;
function slotAt(e) {
  setNdc(e);
  const hit = ray.intersectObjects(pickTargets, true).find((h) => slotOf.has(h.object.material) && h.object.visible);
  return hit ? slotOf.get(hit.object.material) : null;
}
function clearManualMood() { moodId = null; [...$('moods').children].forEach((el) => el.classList.remove('on')); }

let sw = null;
function swDown(e, hex, name) {
  if (e.button !== 0) return;
  sw = { hex, name, x: e.clientX, y: e.clientY, moved: false, chip: null };
}
window.addEventListener('pointermove', (e) => {
  if (!sw) return;
  if (!sw.moved && Math.hypot(e.clientX - sw.x, e.clientY - sw.y) > 6) {
    sw.moved = true; sw.chip = document.createElement('div'); sw.chip.className = 'chip'; sw.chip.style.background = sw.hex; document.body.appendChild(sw.chip);
    controls.enabled = false;
  }
  if (!sw.moved) return;
  sw.chip.style.left = e.clientX + 'px'; sw.chip.style.top = e.clientY + 'px';
  const over = document.elementFromPoint(e.clientX, e.clientY);
  const s = over === canvas ? slotAt(e) : null;
  flashSlot = s;
  if (s) { tip.classList.remove('bad'); tip.innerHTML = `${PALETTE[s].label}<small>放開套用「${sw.name}」</small>`; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.style.opacity = 1; }
  else tip.style.opacity = 0;
});
window.addEventListener('pointerup', (e) => {
  if (!sw) return;
  const s = sw; sw = null; flashSlot = null; tip.style.opacity = 0;
  if (!s.moved) { setSlot(tab, s.hex); clearManualMood(); commit(); return; }
  s.chip.remove(); controls.enabled = true;
  if (document.elementFromPoint(e.clientX, e.clientY) === canvas) { const slot = slotAt(e); if (slot) { setSlot(slot, s.hex); tab = slot; renderSwatches(); clearManualMood(); commit(); } }
});

function renderSwatches() {
  [...$('tabs').children].forEach((b) => b.classList.toggle('on', b.dataset.slot === tab));
  $('swatches').innerHTML = '';
  PALETTE[tab].items.forEach(([name, hex]) => {
    const b = document.createElement('button'); b.className = 'sw'; b.dataset.hex = hex;
    b.innerHTML = `<i style="background:${hex}"></i>${name}`;
    b.onpointerdown = (e) => swDown(e, hex, name);
    $('swatches').appendChild(b);
  });
  refreshSwatchState();
}
function refreshSwatchState() {
  [...$('swatches').children].forEach((b) => b.classList.toggle('on', b.dataset.hex === paletteState[tab]));
}

const CAMS = {
  '全景': HOME,
  '床鋪': { pos: new THREE.Vector3(0.6, 3.4, 1.8), target: new THREE.Vector3(-3.3, 0.8, -2.6) },
  '衣帽＋化妝': { pos: new THREE.Vector3(1.2, 2.8, 1.6), target: new THREE.Vector3(0.2, 1.1, -3.3) },
  '直播桌': { pos: new THREE.Vector3(1.6, 2.6, 0.4), target: new THREE.Vector3(3.8, 1.0, -3.4) },
  '遊戲區': { pos: new THREE.Vector3(-1.2, 3.2, 4.6), target: new THREE.Vector3(3.4, 0.6, 1.8) },
  '客廳': { pos: new THREE.Vector3(2.6, 3.4, 4.4), target: new THREE.Vector3(-1.2, 0.3, 0.8) },
  '零食角': { pos: new THREE.Vector3(-1.4, 2.6, 4.2), target: new THREE.Vector3(-4.4, 0.6, 2.6) },
};
let camGoal = null;
let zf = 1, userMoved = false;
const scaled = (v, k) => ({ target: v.target, pos: v.target.clone().add(v.pos.clone().sub(v.target).multiplyScalar(k)) });
const goTo = (v) => { camGoal = scaled(v, v === HOME ? zf : 1 + (zf - 1) * 0.55); };
Object.entries(CAMS).forEach(([n, v]) => {
  const b = document.createElement('button'); b.textContent = n; b.onclick = () => { userMoved = true; goTo(v); }; $('cams').appendChild(b);
});
controls.addEventListener('start', () => { camGoal = null; userMoved = true; });


/* ------------------------------------------------------------------ history / share / capture */
const hist = []; let hi = -1;
const snap0 = () => JSON.stringify({ p: pieces.map((p) => [p.key, +p.pos.x.toFixed(2), +p.pos.y.toFixed(2), p.rot]), c: paletteState });
function commit() {
  const s = snap0(); if (hist[hi] === s) return;
  hist.splice(hi + 1); hist.push(s); hi = hist.length - 1; syncHist();
}
function restore(str, instant = false) {
  const o = JSON.parse(str);
  for (const [key, x, z, rot] of o.p) {
    const p = pieces.find((q) => q.key === key); if (!p) continue;
    p.pos.set(x, z); p.target.set(x, z); p.rot = rot;
    const want = rot * Math.PI / 2, diff = ((want - p.rotCur) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    p.rotT = p.rotCur + diff;
    if (instant) { p.group.position.set(x, 0, z); p.rotCur = p.rotT; }
  }
  Object.entries(o.c).forEach(([slot, hex]) => { if (PALETTE[slot]) setSlot(slot, hex); });
  if (instant) tw.forEach((c, m) => m.color.copy(c));
}
function syncHist() { $('t-undo').disabled = hi <= 0; $('t-redo').disabled = hi >= hist.length - 1; }
$('t-undo').onclick = () => { if (hi > 0) { hi--; restore(hist[hi]); clearManualMood(); syncHist(); } };
$('t-redo').onclick = () => { if (hi < hist.length - 1) { hi++; restore(hist[hi]); clearManualMood(); syncHist(); } };
addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? $('t-redo') : $('t-undo')).click(); }
});
$('t-reset').onclick = () => { resetLayout(); toast('佈置與配色已重設'); };

let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

$('t-shot').onclick = () => {
  composer.render();
  canvas.toBlob((b) => { download(b, 'neko-room.png'); toast('圖片已儲存'); }, 'image/png');
};
$('t-link').onclick = async () => {
  const st = { p: pieces.map((p) => [p.key, +p.pos.x.toFixed(2), +p.pos.y.toFixed(2), p.rot]), c: paletteState, t: +time.toFixed(2) };
  const url = location.origin + location.pathname + '#s=' + btoa(unescape(encodeURIComponent(JSON.stringify(st))));
  history.replaceState(null, '', url);
  try { await navigator.clipboard.writeText(url); toast('連結已複製，貼給朋友就能看到你的房間'); } catch { toast('已更新網址列，請直接複製網址'); }
};
$('t-eye').onclick = (e) => { const on = document.body.classList.toggle('clean'); e.currentTarget.classList.toggle('on', on); };
$('t-help').onclick = (e) => { const on = $('help').classList.toggle('show'); e.currentTarget.classList.toggle('on', on); };
addEventListener('pointerdown', (e) => { if (!e.target.closest('#help, #t-help')) { $('help').classList.remove('show'); $('t-help').classList.remove('on'); } });

let recording = false;
$('t-rec').onclick = () => {
  if (recording || !window.MediaRecorder) { if (!window.MediaRecorder) toast('此瀏覽器不支援錄影'); return; }
  recording = true; $('t-rec').classList.add('rec'); toast('錄製中，約 8 秒');
  camGoal = scaled(HOME, zf); controls.autoRotate = true; controls.autoRotateSpeed = 3.2;
  const type = ['video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 8e6 }); const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => { controls.autoRotate = false; recording = false; $('t-rec').classList.remove('rec'); download(new Blob(chunks, { type: 'video/webm' }), 'neko-room.webm'); toast('影片已儲存'); };
  rec.start(); setTimeout(() => rec.stop(), 8000);
};

/* ------------------------------------------------------------------ loop */
function resize() {
  const w = innerWidth, h = innerHeight, a = w / h;
  renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  camera.aspect = a;
  camera.fov = a < 1 ? 50 : a < 1.3 ? 38 : 30; camera.updateProjectionMatrix();
  const base = HOME.pos.distanceTo(HOME.target);
  const fit = 15.5 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * a);
  zf = Math.max(1, fit / base);
  if (!userMoved && !camGoal) { camera.position.copy(scaled(HOME, zf).pos); controls.target.copy(HOME.target); }
}
addEventListener('resize', resize); resize();

renderSwatches();
applyMood(MOODS[0]);
time = timeGoal = MOODS[0].t;
try {
  const m = location.hash.match(/#s=(.+)/);
  if (m) { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); restore(JSON.stringify({ p: o.p, c: o.c }), true); if (o.t != null) time = timeGoal = o.t; }
} catch (e) { /* ignore bad share links */ }
tw.forEach((c, m) => m.color.copy(c));                 // start on the target palette, no fade-in
applyTime(time); syncTimeUI(); commit();
setTimeout(() => toast('拖曳家具移動，拖曳色票到房間換色'), 900);

const clock = new THREE.Clock();
const neonLamps = lamps.filter((l) => l.neon);
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const k = 1 - Math.exp(-dt * 9);

  tw.forEach((c, m) => m.color.lerp(c, 1 - Math.exp(-dt * 6)));
  for (const [slot, ms] of Object.entries(SLOT_MATS)) for (const m of ms) {
    const want = slot === flashSlot ? 0.22 + 0.08 * Math.sin(performance.now() / 120) : 0;
    m.emissive.setRGB(1, 0.72, 0.85).multiplyScalar(m.userData.fl = (m.userData.fl || 0) + (want - (m.userData.fl || 0)) * k);
  }
  // neon follows the palette colour; pulses while a swatch hovers it
  const pulse = flashSlot === 'neon' ? 1.35 + 0.35 * Math.sin(performance.now() / 120) : 1;
  M.neonHot.color.copy(M.neon.color).multiplyScalar(neonGain * pulse);
  for (const m of M.neonSigns) m.color.copy(M.neonHot.color);
  for (const l of neonLamps) l.light.color.copy(M.neon.color);

  if (Math.abs(timeGoal - time) > 0.005) {
    time += (timeGoal - time) * (1 - Math.exp(-dt * 3.2)); applyTime(time); syncTimeUI();
  }
  if (camGoal) {
    const f = 1 - Math.exp(-dt * 3.5);
    camera.position.lerp(camGoal.pos, f); controls.target.lerp(camGoal.target, f);
    if (camera.position.distanceTo(camGoal.pos) < 0.02) camGoal = null;
  }
  for (const p of pieces) {
    const dragging = drag && drag.p === p;
    const g = p.group;
    g.position.x += (p.target.x - g.position.x) * k; g.position.z += (p.target.y - g.position.z) * k;
    p.rotCur += (p.rotT - p.rotCur) * k; g.rotation.y = p.rotCur;
    p.lift += ((dragging && !p.rug ? 0.14 : 0) - p.lift) * k; g.position.y = p.lift;
  }
  controls.update();
  composer.render();
});

window.__app = { scene, camera, controls, pieces, applyMood, MOODS, setTime: (t) => { timeGoal = t; } };
