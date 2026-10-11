import * as THREE from 'three';

// Procedural kawaii artworks: anime posters, screen contents, neon signs, night city.
function rng(seed) { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; }
function make(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); return c;
}
const heart = (g, x, y, s) => {
  g.beginPath(); g.moveTo(x, y + s * 0.3);
  g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3); g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  g.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3); g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3); g.fill();
};
const sparkle = (g, x, y, s) => {
  g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
};

// ---------- anime cat-girl portrait (512 x 640) ----------
export function drawGirl(g, { hair = '#f5a9c8', shade = '#d9789f', eye = '#a257c9', outfit = '#2e2839', ribbon = '#ee6a9c', ears = true } = {}) {
  const cx = 256;
  // back hair
  g.fillStyle = shade;
  g.beginPath(); g.moveTo(80, 640); g.bezierCurveTo(40, 420, 70, 150, cx, 132); g.bezierCurveTo(442, 150, 472, 420, 432, 640); g.closePath(); g.fill();
  // cat ears
  if (ears) for (const s of [-1, 1]) {
    g.fillStyle = hair; g.beginPath(); g.moveTo(cx + s * 70, 170); g.lineTo(cx + s * 150, 62); g.lineTo(cx + s * 170, 200); g.closePath(); g.fill();
    g.fillStyle = '#ffc2d6'; g.beginPath(); g.moveTo(cx + s * 92, 168); g.lineTo(cx + s * 146, 94); g.lineTo(cx + s * 156, 186); g.closePath(); g.fill();
  }
  // shoulders + hoodie
  g.fillStyle = '#ffe6da'; g.fillRect(cx - 32, 420, 64, 80);
  g.fillStyle = outfit; g.beginPath(); g.moveTo(70, 640); g.quadraticCurveTo(90, 500, cx - 40, 480); g.lineTo(cx + 40, 480); g.quadraticCurveTo(422, 500, 442, 640); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - 44, 478); g.lineTo(cx, 530); g.lineTo(cx + 44, 478); g.lineTo(cx + 30, 474); g.lineTo(cx, 510); g.lineTo(cx - 30, 474); g.closePath(); g.fill();
  g.fillStyle = ribbon; g.beginPath(); g.moveTo(cx, 520); g.lineTo(cx - 44, 500); g.lineTo(cx - 44, 548); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx, 520); g.lineTo(cx + 44, 500); g.lineTo(cx + 44, 548); g.closePath(); g.fill();
  g.beginPath(); g.arc(cx, 522, 11, 0, 7); g.fill();
  // face
  g.fillStyle = '#ffeee5';
  g.beginPath(); g.moveTo(cx - 116, 290); g.bezierCurveTo(cx - 118, 380, cx - 60, 450, cx, 462); g.bezierCurveTo(cx + 60, 450, cx + 118, 380, cx + 116, 290);
  g.bezierCurveTo(cx + 110, 180, cx - 110, 180, cx - 116, 290); g.fill();
  // blush
  g.fillStyle = 'rgba(255,140,170,.45)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 70, 380, 26, 12, 0, 0, 7); g.fill(); }
  // eyes
  for (const s of [-1, 1]) {
    const ex = cx + s * 54, ey = 330;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, 34, 42, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, ey - 38, 0, ey + 38); gr.addColorStop(0, '#2a1840'); gr.addColorStop(0.55, eye); gr.addColorStop(1, '#ffd0f0');
    g.fillStyle = gr; g.beginPath(); g.ellipse(ex, ey + 4, 27, 37, 0, 0, 7); g.fill();
    g.fillStyle = '#1d1030'; g.beginPath(); g.ellipse(ex, ey + 2, 11, 16, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex - s * 9 - 2, ey - 14, 10, 12, 0, 0, 7); g.fill();
    g.beginPath(); g.arc(ex + 10, ey + 18, 5, 0, 7); g.fill();
    g.strokeStyle = '#2a1a2a'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.ellipse(ex, ey + 4, 36, 44, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(ex + s * 34, ey - 22); g.lineTo(ex + s * 46, ey - 32); g.stroke();
  }
  // cat mouth (ω)
  g.strokeStyle = '#b8505e'; g.lineWidth = 3.5;
  g.beginPath(); g.arc(cx - 9, 410, 9, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.arc(cx + 9, 410, 9, 0.1, Math.PI - 0.1); g.stroke();
  // bangs
  g.fillStyle = hair;
  g.beginPath(); g.moveTo(cx - 132, 300);
  const tips = [[-118, 250], [-96, 300], [-70, 236], [-40, 290], [-10, 230], [18, 286], [48, 236], [80, 296], [104, 244], [124, 300]];
  g.bezierCurveTo(cx - 150, 160, cx - 60, 110, cx, 112); g.bezierCurveTo(cx + 60, 110, cx + 150, 160, cx + 132, 300);
  for (let i = tips.length - 1; i >= 0; i--) g.lineTo(cx + tips[i][0], tips[i][1] - (i % 2 ? 0 : 30));
  g.closePath(); g.fill();
  // side locks
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 120, 230); g.quadraticCurveTo(cx + s * 150, 380, cx + s * 118, 520); g.quadraticCurveTo(cx + s * 110, 400, cx + s * 96, 300); g.closePath(); g.fill(); }
  // shine
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 6;
  g.beginPath(); g.arc(cx, 250, 100, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
  // hair clip
  g.fillStyle = ribbon; sparkle(g, cx + 96, 214, 16);
}

export function posterGirl(opts = {}, bg = ['#ffe1ee', '#e6c8ff'], title = 'NYA~', seed = 3) {
  return make(512, 640, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = rng(seed);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`; (i % 2 ? heart : sparkle)(g, r() * W, r() * H, 8 + r() * 18); }
    drawGirl(g, opts);
    g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '900 64px "M PLUS Rounded 1c", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.lineWidth = 10; g.strokeStyle = opts.ribbon || '#ee6a9c'; g.strokeText(title, 26, 22); g.fillText(title, 26, 22);
  });
}

export function posterCat() {
  return make(512, 640, (g, W, H) => {
    g.fillStyle = '#ffeef3'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffd3e1'; for (let y = 0; y < H; y += 64) for (let x = (y / 64) % 2 * 32; x < W; x += 64) heart(g, x, y, 22);
    g.fillStyle = '#2b2730';
    g.beginPath(); g.ellipse(256, 360, 170, 150, 0, 0, 7); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256 + s * 150, 300); g.lineTo(256 + s * 150, 150); g.lineTo(256 + s * 50, 230); g.fill(); }
    for (const s of [-1, 1]) {
      g.fillStyle = '#f4cf57'; g.beginPath(); g.ellipse(256 + s * 66, 350, 40, 44, 0, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.ellipse(256 + s * 66, 352, 16, 36, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(256 + s * 66 - 12, 334, 10, 0, 7); g.fill();
    }
    g.fillStyle = '#f39ab4'; g.beginPath(); g.moveTo(244, 410); g.lineTo(268, 410); g.lineTo(256, 424); g.fill();
    g.fillStyle = 'rgba(255,120,160,.5)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(256 + s * 110, 420, 26, 12, 0, 0, 7); g.fill(); }
    g.fillStyle = '#ee6a9c'; g.font = '900 72px "M PLUS Rounded 1c", sans-serif'; g.textAlign = 'center'; g.fillText('にゃん', 256, 580);
  });
}

// ---------- screens ----------
const girlSprite = (opts) => make(512, 640, (g) => drawGirl(g, opts));
export function monitorMain() {
  const girl = girlSprite({ hair: '#e9e4f7', shade: '#b8aee0', eye: '#7a5cff', outfit: '#2a2440', ribbon: '#b56cff' });
  return make(768, 400, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#1a0f33'); gr.addColorStop(1, '#6b3aa8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = rng(8); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,220,255,${r() * .8})`; g.fillRect(r() * W, r() * H * .6, 2, 2); }
    g.drawImage(girl, 230, 10, 320, 400);
    g.fillStyle = 'rgba(20,10,40,.7)'; g.fillRect(0, H - 60, W, 60);
    g.fillStyle = '#ff7ac0'; g.fillRect(24, H - 42, 200, 10); g.fillStyle = '#7ad8ff'; g.fillRect(24, H - 24, 150, 8);
    g.fillStyle = '#fff'; g.font = '700 22px sans-serif'; g.fillText('Lv.99  NEKO', 560, H - 26);
  });
}
export function monitorSide(seed = 2) {
  return make(400, 300, (g, W, H) => {
    g.fillStyle = '#16121f'; g.fillRect(0, 0, W, H);
    const r = rng(seed); const cols = ['#ff7ac0', '#b58cff', '#7ad8ff', '#8ff0c8', '#ffd27a', '#9a93aa'];
    for (let y = 16; y < H - 10; y += 16) { let x = 14 + (r() * 3 | 0) * 16; while (x < W - 30 && r() > 0.12) { const w = 16 + r() * 60; g.fillStyle = cols[r() * 6 | 0]; g.fillRect(x, y, w, 7); x += w + 8; } }
    g.fillStyle = 'rgba(255,122,192,.18)'; g.fillRect(0, 0, W, 22);
  });
}
export function tvScreen() {
  const girl = girlSprite({ hair: '#ffd3e6', shade: '#f09ac2', eye: '#ff6aa8', outfit: '#fff', ribbon: '#ff6aa8' });
  return make(768, 432, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2b1a57'); gr.addColorStop(0.6, '#b85ca8'); gr.addColorStop(1, '#ffb08a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = rng(12); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${r() * .9})`; g.fillRect(r() * W, r() * H * .5, 2, 2); }
    g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(600, 110, 58, 0, 7); g.fill();
    g.fillStyle = '#3a2350'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, 330); for (let x = 0; x <= W; x += 48) g.lineTo(x, 300 + ((x * 37) % 60)); g.lineTo(W, H); g.fill();
    g.drawImage(girl, 60, 40, 330, 412);
  });
}
export function laptopScreen() {
  return make(320, 200, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#ffd1e4'); gr.addColorStop(1, '#c9b2ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(160, 110, 56, 48, 0, 0, 7); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(160 + s * 50, 90); g.lineTo(160 + s * 48, 44); g.lineTo(160 + s * 14, 70); g.fill(); }
    g.fillStyle = '#3b3442'; for (const s of [-1, 1]) { g.beginPath(); g.arc(160 + s * 20, 108, 6, 0, 7); g.fill(); }
    g.fillStyle = '#ee6a9c'; g.font = '800 20px sans-serif'; g.textAlign = 'center'; g.fillText('PLAY ▶', 160, 185);
  });
}

// ---------- neon signs (white on transparent; tinted by material colour) ----------
function neon(w, h, draw) {
  return make(w, h, (g) => {
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
    g.shadowColor = '#fff'; g.shadowBlur = 18; g.lineWidth = 14; draw(g); g.shadowBlur = 0; g.lineWidth = 6; draw(g);
  });
}
export const neonCat = () => neon(512, 400, (g) => {
  g.beginPath(); g.moveTo(110, 200); g.lineTo(120, 60); g.lineTo(200, 130); g.quadraticCurveTo(256, 112, 312, 130); g.lineTo(392, 60); g.lineTo(402, 200);
  g.bezierCurveTo(420, 330, 320, 360, 256, 360); g.bezierCurveTo(192, 360, 92, 330, 110, 200); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.arc(256 + s * 62, 225, 22, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  g.beginPath(); g.arc(240, 280, 16, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.arc(272, 280, 16, 0.2, Math.PI - 0.2); g.stroke();
  for (const s of [-1, 1]) for (const k of [-1, 1]) { g.beginPath(); g.moveTo(256 + s * 120, 270 + k * 12); g.lineTo(256 + s * 190, 262 + k * 26); g.stroke(); }
});
export const neonStar = () => neon(256, 256, (g) => {
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 44 : 100; g.lineTo(128 + Math.cos(a) * rr, 134 + Math.sin(a) * rr); } g.closePath(); g.stroke();
});
export const neonHeart = () => neon(256, 256, (g) => {
  g.beginPath(); g.moveTo(128, 80); g.bezierCurveTo(128, 40, 40, 40, 40, 100); g.bezierCurveTo(40, 150, 100, 180, 128, 215); g.bezierCurveTo(156, 180, 216, 150, 216, 100); g.bezierCurveTo(216, 40, 128, 40, 128, 80); g.stroke();
});

// ---------- night city behind the window ----------
export function city() {
  const W = 1024, H = 768, r = rng(21);
  const blds = []; let x = -10;
  while (x < W) { const w = 50 + r() * 90, h = 180 + r() * 420; blds.push([x, w, h, r()]); x += w + 4; }
  const base = make(W, H, (g) => {
    for (const [bx, w, h, t] of blds) {
      g.fillStyle = t < .5 ? '#1c1a38' : '#25214a'; g.fillRect(bx, H - h, w, h);
      if (t > .82) { g.fillRect(bx + w / 2 - 2, H - h - 50, 4, 50); }
    }
    for (const [bx, w, h] of blds) { g.fillStyle = 'rgba(60,50,100,.9)'; for (let y = H - h + 14; y < H - 8; y += 22) for (let xx = bx + 8; xx < bx + w - 10; xx += 16) g.fillRect(xx, y, 8, 11); }
  });
  const lights = make(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const [bx, w, h, t] of blds) {
      for (let y = H - h + 14; y < H - 8; y += 22) for (let xx = bx + 8; xx < bx + w - 10; xx += 16) if (r() < .38) { g.fillStyle = r() < .8 ? '#ffd9a0' : '#ff9ad6'; g.fillRect(xx, y, 8, 11); }
      if (t > .82) { g.fillStyle = '#ff4060'; g.beginPath(); g.arc(bx + w / 2, H - h - 52, 5, 0, 7); g.fill(); }
    }
  });
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  return new THREE.MeshStandardMaterial({ map: tex(base), emissiveMap: tex(lights), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1, transparent: true, alphaTest: 0.01, roughness: 1 });
}

export function artMesh(canvas, w, h, frameMat) {
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const g = new THREE.Group();
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  pic.position.z = 0.012;
  const t = 0.03, fw = w + t * 2, fh = h + t * 2;
  const back = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.02), frameMat); back.position.z = 0; g.add(back);
  [[fw, t, 0, (fh - t) / 2], [fw, t, 0, -(fh - t) / 2], [t, fh, (fw - t) / 2, 0], [t, fh, -(fw - t) / 2, 0]].forEach(([pw, ph, x, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.04), frameMat); m.position.set(x, y, 0.01); m.castShadow = m.receiveShadow = true; g.add(m);
  });
  pic.receiveShadow = true; g.add(pic);
  return g;
}
