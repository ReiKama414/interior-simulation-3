import * as THREE from 'three';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function canvasTex(w, h, draw, { repeat = [1, 1], color = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const gray = (v) => `rgb(${v | 0},${v | 0},${v | 0})`;

// ---- procedural textures (near-white so material.color tints them) ----
function plankTexture() {
  const r = rng(7);
  return canvasTex(1024, 1024, (g, w, h) => {
    const rows = 12, ph = h / rows;
    for (let i = 0; i < rows; i++) {
      const y = i * ph; let x = -r() * w * 0.6;
      while (x < w) {
        const len = w * (0.45 + r() * 0.5), base = 222 + r() * 30;
        g.fillStyle = gray(base); g.fillRect(x, y, len, ph);
        for (let k = 0; k < 18; k++) {
          const yy = y + r() * ph; g.strokeStyle = `rgba(90,60,40,${0.02 + r() * 0.04})`; g.lineWidth = 0.6 + r() * 1.4;
          g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * .3, yy + (r() - .5) * 6, x + len * .6, yy + (r() - .5) * 6, x + len, yy); g.stroke();
        }
        g.fillStyle = 'rgba(80,50,40,.35)'; g.fillRect(x, y, 2, ph);
        x += len;
      }
      g.fillStyle = 'rgba(80,50,40,.4)'; g.fillRect(0, y, w, 2);
    }
  });
}
function lacquerTexture() {
  const r = rng(21);
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = gray(244); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.025})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  });
}
function plasterTexture() {
  const r = rng(3);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = gray(246); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = 225 + r() * 30; g.fillStyle = `rgba(${v},${v},${v},${0.06 + r() * 0.08})`;
      g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 20, 0, 7); g.fill();
    }
  });
}
function knitTexture() {
  const r = rng(11);
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = gray(236); g.fillRect(0, 0, w, h);
    const cw = 16, ch = 12;
    for (let y = 0; y < h; y += ch) for (let x = 0; x < w; x += cw) {
      const v = 205 + r() * 30;
      g.fillStyle = gray(v);
      g.beginPath(); g.ellipse(x + cw * 0.3, y + ch / 2, cw * 0.28, ch * 0.55, 0.5, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x + cw * 0.7, y + ch / 2, cw * 0.28, ch * 0.55, -0.5, 0, 7); g.fill();
    }
  }, { repeat: [4, 4] });
}
function furTexture(seed = 5, repeat = [2, 2]) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = gray(236); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = r() < .5 ? 200 : 255; g.strokeStyle = `rgba(${v},${v},${v},${0.12 + r() * .2})`; g.lineWidth = 1 + r() * 1.5;
      const x = r() * w, y = r() * h, a = r() * 7, l = 3 + r() * 7;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }, { repeat });
}
function plaidTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e9e4ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(80,70,110,.55)';
    for (let i = 0; i < 4; i++) { g.fillRect(i * 64 + 20, 0, 24, h); g.fillRect(0, i * 64 + 20, w, 24); }
    g.fillStyle = 'rgba(60,50,90,.35)';
    for (let i = 0; i < 4; i++) { g.fillRect(i * 64 + 50, 0, 4, h); g.fillRect(0, i * 64 + 50, w, 4); }
  }, { repeat: [2, 2] });
}
// silver-blue gradient with soft diagonal highlight streaks so a flat plane reads as a mirror
function mirrorTexture() {
  return canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#eef2f8'); gr.addColorStop(0.5, '#c9d3e2'); gr.addColorStop(1, '#dfe4ee');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(-0.5);
    for (const [x, bw, a] of [[-40, 46, 0.55], [30, 16, 0.4], [70, 8, 0.3]]) { g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, -h, bw, h * 2); }
    g.restore();
  });
}
function pawTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(128, 160, 58, 50, 0, 0, 7); g.fill();
  for (const [x, y, rot] of [[62, 92, -0.4], [104, 58, -0.15], [152, 58, 0.15], [194, 92, 0.4]]) { g.beginPath(); g.ellipse(x, y, 22, 28, rot, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---- palette: what the user can choose per material slot ----
export const PALETTE = {
  wall: { label: '牆面', items: [
    ['櫻花粉', '#f3c3d0'], ['奶油白', '#f4e6dc'], ['薰衣草', '#d5c5ee'], ['蜜桃', '#f7cbb6'], ['薄荷', '#c4e5da']] },
  floor: { label: '地板', items: [
    ['淺橡木', '#e2c29e'], ['雪白', '#f3ece8'], ['櫻木', '#e6b9a8'], ['蜂蜜', '#d8a472'], ['可可', '#8e6150']] },
  fabric: { label: '織品', items: [
    ['草莓牛奶', '#f5afc6'], ['棉花白', '#f6efec'], ['芋泥', '#c8b0e6'], ['蜜桃', '#f7bea2'], ['天空藍', '#b5d2f1']] },
  accent: { label: '點綴', items: [
    ['桃紅', '#ee6a9c'], ['奶茶', '#e2bf9f'], ['紫丁香', '#a887d8'], ['薄荷', '#86d0ba'], ['黑貓', '#3b3442']] },
  wood: { label: '家具', items: [
    ['珍珠白', '#f7efec'], ['粉漆', '#f3c8d4'], ['奶油', '#f0e1cd'], ['淡紫', '#ddd0f0'], ['原木', '#d8b38e']] },
  rug: { label: '地毯', items: [
    ['雲朵粉', '#f7c1d2'], ['奶白', '#f5ede8'], ['淡紫', '#dac8f2'], ['蜜桃', '#f9ccb7'], ['薄荷', '#c9e9de']] },
  neon: { label: '霓虹', items: [
    ['霓虹粉', '#ff4fb5'], ['電光紫', '#a95cff'], ['賽博藍', '#40bfff'], ['螢光綠', '#3fffbf'], ['夕陽橘', '#ff9a45']] },
};

export function createMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const fur = (color, seed) => std({ color, map: furTexture(seed, [1, 1]), roughness: 1 });
  const M = {
    floor: std({ map: plankTexture(), roughness: 0.45, metalness: 0 }),
    wall: std({ map: plasterTexture(), bumpMap: plasterTexture(), bumpScale: 0.3, roughness: 0.9 }),
    wallAccent: std({ map: plasterTexture(), roughness: 0.9 }),
    wood: std({ map: lacquerTexture(), roughness: 0.38 }),
    fabric: std({ map: knitTexture(), bumpMap: knitTexture(), bumpScale: 0.8, roughness: 0.95 }),
    accent: std({ map: furTexture(13, [1, 1]), roughness: 0.9 }),
    rug: std({ map: furTexture(5, [3, 3]), bumpMap: furTexture(6, [3, 3]), bumpScale: 1.4, roughness: 1 }),
    neon: new THREE.MeshBasicMaterial({ color: '#ff4fb5' }),          // palette holder; meshes use neonHot
    neonHot: new THREE.MeshBasicMaterial({ color: '#ff4fb5', toneMapped: false }),
    neonSigns: [],
    ledWarm: new THREE.MeshBasicMaterial({ color: '#ffb070', toneMapped: false }),   // indirect under-furniture light
    cream: std({ color: '#f4e9dc', roughness: 0.9 }),
    card: std({ color: '#c9a27a', roughness: 0.9 }),
    white: std({ color: '#f8f4f5', roughness: 0.35 }),
    plush: std({ map: furTexture(17, [1, 1]), color: '#fbf6f4', roughness: 1 }),
    plaid: std({ map: plaidTexture(), roughness: 0.95 }),
    paw: new THREE.MeshStandardMaterial({ map: pawTexture(), transparent: true, depthWrite: false, color: '#fbe9ef', roughness: 1 }),
    pawPink: std({ color: '#f59bb8', roughness: 0.8 }),
    dark: std({ color: '#25212b', roughness: 0.45, metalness: 0.3 }),
    chrome: std({ color: '#e8e4ec', roughness: 0.2, metalness: 0.85 }),
    gold: std({ color: '#e6c07a', roughness: 0.3, metalness: 0.8 }),
    ceramic: std({ color: '#fbf5f2', roughness: 0.25 }),
    leaf: std({ color: '#4f8a52', roughness: 0.7, flatShading: true, side: THREE.DoubleSide }),
    leaf2: std({ color: '#79a95a', roughness: 0.7, flatShading: true, side: THREE.DoubleSide }),
    trunk: std({ color: '#6b5040', roughness: 0.9 }),
    soil: std({ color: '#3a2c26', roughness: 1 }),
    sisal: std({ map: furTexture(31, [1, 3]), color: '#dcc49c', roughness: 1 }),
    paper: std({ color: '#fff1e6', roughness: 0.9, emissive: new THREE.Color('#ffc7a0'), emissiveIntensity: 0.05, side: THREE.DoubleSide }),
    bulb: std({ color: '#fff2e0', emissive: new THREE.Color('#ffd9a8'), emissiveIntensity: 1.2 }),
    bulbSoft: std({ color: '#fff4ea', emissive: new THREE.Color('#ffd9b8'), emissiveIntensity: 0.3 }),
    bulbCool: std({ color: '#ffffff', emissive: new THREE.Color('#fff4fa'), emissiveIntensity: 1.6 }),
    sheer: std({ color: '#fbdde6', roughness: 1, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
    glass: new THREE.MeshStandardMaterial({ color: '#d8e6f5', roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: '#8fd8ff', transparent: true, opacity: 0.45, roughness: 0.1, depthWrite: false,
      emissive: new THREE.Color('#4fb8ff'), emissiveIntensity: 0.6 }),
    mirror: std({ map: mirrorTexture(), roughness: 0.12, metalness: 0.2, emissive: new THREE.Color('#ffffff'), emissiveMap: mirrorTexture(), emissiveIntensity: 0.18 }),
    screens: [],
    sky: new THREE.MeshBasicMaterial({ color: '#10152a' }),
    city: null,
    paint: std({ color: '#f8f2f2', roughness: 0.6 }),
    plinth: std({ color: '#1d1628', roughness: 0.5, metalness: 0.2 }),
    ground: std({ color: '#150f1e', roughness: 0.75 }),
    // cats
    catWhite: fur('#f7f3ef', 41), catBlack: fur('#2b2730', 42), catOrange: fur('#e7a364', 43), catGray: fur('#b9b2ae', 44),
    catPink: std({ color: '#f3a7b6', roughness: 0.8 }),
    catEye: std({ color: '#f4cf57', emissive: new THREE.Color('#f4cf57'), emissiveIntensity: 0.35, roughness: 0.3 }),
    ink: std({ color: '#1c1a20', roughness: 0.6 }),
  };
  return M;
}

// helper for screen-like materials whose brightness follows the time of day
export function screenMat(M, canvas) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshBasicMaterial({ map: t }); M.screens.push(m); return m;
}
// neon sign (white strokes on transparent canvas, tinted by the neon slot)
export function neonSignMat(M, canvas) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }); M.neonSigns.push(m); return m;
}
