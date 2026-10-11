import * as THREE from 'three';
import { artMesh, posterGirl, posterCat, neonCat, neonStar, neonHeart, city } from './art.js';
import { neonSignMat } from './materials.js';

// scale a BoxGeometry's UVs so textures keep a constant world size (metres per tile)
function worldUV(geo, w, h, d, tile) {
  const uv = geo.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile);
  }
  return geo;
}
function slab(group, mat, x0, x1, y0, y1, z0, z1, tile = 3) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const m = new THREE.Mesh(worldUV(new THREE.BoxGeometry(w, h, d), w, h, d, tile), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; group.add(m); return m;
}
const glow = (group, M, x0, x1, y0, y1, z0, z1) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), M.neonHot);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); group.add(m); return m;
};
const rng = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const PHOTO = ['#9fc8f0', '#f5b8cc', '#ffd9a0', '#bfe3c8', '#d8c4f0', '#ffb8a0', '#f7e0b0'];

export function buildRoom(M, lamps) {
  const group = new THREE.Group();
  const T = 0.2, H = 3.3;                        // wall thickness / height
  const X0 = -5, X1 = 5, Z0 = -4, Z1 = 4;        // interior
  const std = (c, r = 0.6) => new THREE.MeshStandardMaterial({ color: c, roughness: r });

  // ground + plinth
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), M.ground);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.95; ground.receiveShadow = true; group.add(ground);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.65, 9.0), M.plinth);
  plinth.position.y = -0.62; plinth.castShadow = plinth.receiveShadow = true; group.add(plinth);
  // neon outline around the base (the diorama frame)
  const bx = 5.52, bz = 4.52, e = 0.03;
  for (const y of [-0.3, -0.94]) {
    glow(group, M, -bx, bx, y - e, y + e, bz - e, bz + e); glow(group, M, -bx, bx, y - e, y + e, -bz - e, -bz + e);
    glow(group, M, bx - e, bx + e, y - e, y + e, -bz, bz); glow(group, M, -bx - e, -bx + e, y - e, y + e, -bz, bz);
  }
  for (const [x, z] of [[bx, bz], [-bx, bz], [bx, -bz]]) glow(group, M, x - e, x + e, -0.94, -0.3, z - e, z + e);

  // label on the plinth front (+z) — tinted by the neon colour
  const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 128; const g = lc.getContext('2d');
  g.fillStyle = '#fff'; g.font = '800 58px "M PLUS Rounded 1c", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#fff'; g.shadowBlur = 10; g.fillText('にゃ  NEKO  ·  ROOM', 512, 68);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 0.75), neonSignMat(M, lc));
  label.position.set(0, -0.62, 4.505); group.add(label);
  const label2 = label.clone(); label2.rotation.y = Math.PI / 2; label2.position.set(5.505, -0.62, 0); group.add(label2);

  // floor slab (top surface at y = 0)
  slab(group, M.floor, X0 - T, X1 + 0.1, -0.3, 0, Z0 - T, Z1 + 0.1, 2.2);

  // back wall (z = Z0), window above the bed
  const bw = { x0: -4.2, x1: -2.6, y0: 1.2, y1: 2.85 };
  const back = (x0, x1, y0, y1) => slab(group, M.wall, x0, x1, y0, y1, Z0 - T, Z0, 3);
  back(X0 - T, bw.x0, 0, H); back(bw.x1, X1, 0, H); back(bw.x0, bw.x1, 0, bw.y0); back(bw.x0, bw.x1, bw.y1, H);
  slab(group, M.wallAccent, X0 - T, X0, 0, H, Z0, Z1, 3);                    // left wall (x = X0)

  // baseboards + a thin wood picture rail
  const sb = (x0, x1, z0, z1) => slab(group, M.paint, x0, x1, 0, 0.1, z0, z1, 1);
  sb(X0, X1, Z0, Z0 + 0.025); sb(X0, X0 + 0.025, Z0, Z1);

  // neon wall caps + outer vertical edges (frame only — the room itself is lit warm)
  glow(group, M, X0 - T, X1, H, H + 0.035, Z0 - T, Z0);
  glow(group, M, X0 - T, X0, H, H + 0.035, Z0, Z1);
  glow(group, M, X1 - 0.03, X1 + 0.005, 0, H, Z0 - T, Z0);
  glow(group, M, X0 - T, X0, 0, H, Z1 - 0.03, Z1 + 0.005);

  // warm-white ceiling lighting over each zone
  for (const [x, z, i] of [[-3.2, -2.3, 3.2], [0.4, -2.6, 3.0], [-0.4, 1.1, 4.0], [3.3, 1.8, 3.0], [-3.8, 2.6, 2.4]]) {
    const l = new THREE.PointLight('#ffe4c4', 0, 7.5, 2); l.position.set(x, 3.05, z); group.add(l);
    lamps.push({ light: l, base: i });
  }

  // window: night city outside, frame, sill, curtains, fairy lights
  {
    const w = bw.x1 - bw.x0, h = bw.y1 - bw.y0, cx = (bw.x0 + bw.x1) / 2, cy = (bw.y0 + bw.y1) / 2, z = Z0 - T / 2;
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.5), M.sky); sky.position.set(cx, cy, Z0 - 1.2); group.add(sky);
    M.city = city();
    const town = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.25), M.city); town.position.set(cx, cy - 0.15, Z0 - 1.0); group.add(town);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass); gl.position.set(cx, cy, z); gl.renderOrder = 3; group.add(gl);
    const fr = (x, y, fw, fh) => { const m = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.08), M.white); m.position.set(x, y, z); m.castShadow = true; group.add(m); };
    fr(bw.x0, cy, 0.06, h + 0.06); fr(bw.x1, cy, 0.06, h + 0.06); fr(cx, cy, 0.04, h); fr(cx, bw.y0, w, 0.06); fr(cx, bw.y1, w, 0.06);
    slab(group, M.paint, bw.x0 - 0.06, bw.x1 + 0.06, bw.y0 - 0.04, bw.y0, Z0 - T, Z0 + 0.1, 1);
    // cute tied-back curtains: pink with white dots + tiny hearts, ruffled valance, ribbon tie-backs
    const ct = document.createElement('canvas'); ct.width = ct.height = 256; const cg = ct.getContext('2d');
    cg.fillStyle = '#f6bfd0'; cg.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 16; x < 256; x += 32) {
      cg.fillStyle = '#fff'; cg.beginPath(); cg.arc(x, y, 4.5, 0, 7); cg.fill();
    }
    cg.fillStyle = '#ee6a9c';
    for (const [x, y] of [[16, 16], [80, 80], [144, 16], [208, 80], [48, 144], [176, 144], [112, 208], [240, 208]]) {
      cg.beginPath(); cg.moveTo(x, y + 3); cg.bezierCurveTo(x, y - 3, x - 7, y - 3, x - 7, y + 2); cg.bezierCurveTo(x - 7, y + 6, x, y + 9, x, y + 11);
      cg.bezierCurveTo(x, y + 9, x + 7, y + 6, x + 7, y + 2); cg.bezierCurveTo(x + 7, y - 3, x, y - 3, x, y + 3); cg.fill();
    }
    const cTex = new THREE.CanvasTexture(ct); cTex.colorSpace = THREE.SRGBColorSpace; cTex.wrapS = cTex.wrapT = THREE.RepeatWrapping; cTex.repeat.set(1.5, 5);
    const cMat = new THREE.MeshStandardMaterial({ map: cTex, roughness: 0.95, side: THREE.DoubleSide });
    const lace = new THREE.MeshStandardMaterial({ color: '#fffaf6', roughness: 0.9, side: THREE.DoubleSide });
    const CH = 1.9, CY = 3.05 - CH / 2, TIE = 0.3;             // curtain height, centre, tie-back height (fraction from bottom)
    const curtain = (x, cw, side) => {                       // side = -1: outer edge on the left
      const geo = new THREE.PlaneGeometry(cw, CH, 28, 24); const p = geo.attributes.position, outer = side * cw / 2;
      for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) + CH / 2) / CH, s = (v) => v * v * (3 - 2 * v);
        const f = t >= TIE ? 0.32 + 0.68 * s((t - TIE) / (1 - TIE)) : 0.32 + 0.4 * s((TIE - t) / TIE);
        const nx = outer + (p.getX(i) - outer) * f;
        p.setX(i, nx); p.setZ(i, Math.sin(p.getX(i) * 30 / Math.max(f, 0.4)) * 0.035 * Math.min(1.8, 1 / f));
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, cMat); m.position.set(x, CY, Z0 + 0.13); m.castShadow = true; group.add(m);
      // lace trim along the inner edge is implied by a thin hem at the bottom
      const hem = new THREE.Mesh(new THREE.BoxGeometry(cw * 0.72, 0.035, 0.05), lace); hem.position.set(x + outer * 0.28, CY - CH / 2 + 0.02, Z0 + 0.13); group.add(hem);
      // ribbon tie-back with a bow
      const ty = CY - CH / 2 + CH * TIE, tx = x + outer * (1 - 0.32);
      const band = new THREE.Mesh(new THREE.TorusGeometry(cw * 0.2, 0.014, 8, 24), M.accent); band.position.set(tx, ty, Z0 + 0.13); band.rotation.x = Math.PI / 2; band.scale.set(1, 0.6, 1); group.add(band);
      for (const s of [-1, 1]) {
        const loop = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), M.accent); loop.position.set(tx + s * 0.045, ty, Z0 + 0.2); loop.rotation.set(0, 0, s * Math.PI / 2); group.add(loop);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.1, 0.006), M.accent); tail.position.set(tx + s * 0.02, ty - 0.06, Z0 + 0.2); tail.rotation.z = s * 0.3; group.add(tail);
      }
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), M.accent); knot.position.set(tx, ty, Z0 + 0.2); group.add(knot);
    };
    curtain(bw.x0 - 0.18, 0.62, -1); curtain(bw.x1 + 0.18, 0.62, 1);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, w + 1.1, 8), M.gold); rod.rotation.z = Math.PI / 2; rod.position.set(cx, 3.08, Z0 + 0.12); group.add(rod);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.gold); f.position.set(cx + s * (w / 2 + 0.56), 3.08, Z0 + 0.12); group.add(f); }
    // scalloped ruffle valance
    const VW = w + 0.9, n = 13;
    const val = new THREE.Mesh(new THREE.BoxGeometry(VW, 0.1, 0.03), cMat); val.position.set(cx, 3.05, Z0 + 0.15); group.add(val);
    for (let i = 0; i < n; i++) {
      const sc = new THREE.Mesh(new THREE.SphereGeometry(VW / n / 2 + 0.01, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), cMat);
      sc.position.set(cx - VW / 2 + (i + 0.5) * VW / n, 3.005, Z0 + 0.15); sc.scale.set(1, 0.8, 0.3); group.add(sc);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), lace); dot.position.set(sc.position.x, 2.93, Z0 + 0.165); group.add(dot);
    }
    for (let i = 0; i <= 18; i++) {
      const t = i / 18, x = bw.x0 - 0.35 + t * (w + 0.7), y = 2.86 - Math.sin(t * Math.PI * 3) ** 2 * 0.1;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), M.bulb); b.position.set(x, y, Z0 + 0.22); group.add(b);
    }
  }
  // fairy lights along the left wall
  for (let i = 0; i <= 44; i++) {
    const t = i / 44, z = Z0 + 0.4 + t * 7.4, y = 3.05 - Math.sin(t * Math.PI * 7) ** 2 * 0.14;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.bulb); m.position.set(X0 + 0.06, y, z); group.add(m);
  }

  /* ---------------- wall helpers ---------------- */
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; group.add(m); return m; };
  // shelf along the back wall (alongZ=false) or left wall (alongZ=true)
  const shelf = (x, y, z, w, alongZ = false) => {
    add(new THREE.BoxGeometry(alongZ ? 0.22 : w, 0.03, alongZ ? w : 0.22), M.white, x, y, z);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(alongZ ? 0.12 : 0.02, 0.1, alongZ ? 0.02 : 0.12), M.gold, x + (alongZ ? -0.04 : s * (w / 2 - 0.08)), y - 0.06, z + (alongZ ? s * (w / 2 - 0.08) : -0.04));
  };
  const figColors = ['#f5a9c8', '#b8a6e8', '#2e2839', '#fff', '#8fd0c0', '#ffd27a'];
  let fc = 0;
  const figure = (x, y, z) => {
    const mat = std(figColors[fc++ % figColors.length], 0.5);
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 16), M.white, x, y + 0.006, z);
    add(new THREE.ConeGeometry(0.035, 0.1, 12), mat, x, y + 0.06, z);
    add(new THREE.SphereGeometry(0.03, 14, 10), std('#ffe8de'), x, y + 0.13, z);
    add(new THREE.SphereGeometry(0.033, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), mat, x, y + 0.135, z);
  };
  const pot = (x, y, z, trail = 0, alongZ = false) => {
    add(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 16), M.ceramic, x, y + 0.05, z);
    for (let i = 0; i < 6; i++) { const l = add(new THREE.SphereGeometry(0.05, 8, 6), i % 2 ? M.leaf : M.leaf2, x + Math.cos(i) * 0.05, y + 0.12 + (i % 3) * 0.02, z + Math.sin(i) * 0.05); l.scale.set(1, 0.6, 1); }
    for (let k = 0; k < trail; k++) for (let i = 0; i < 8 + k * 3; i++) {
      const off = (k - 0.5) * 0.08 + Math.sin(i * 1.3) * 0.02;
      const l = add(new THREE.SphereGeometry(0.028, 6, 5), i % 2 ? M.leaf : M.leaf2, x + (alongZ ? 0.07 : off), y + 0.06 - i * 0.07, z + (alongZ ? off : 0.07)); l.scale.set(1, 0.5, 1);
    }
  };
  const blk = (x, y, z, w, h, d, mat) => add(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
  const gameBoxes = (x, y, z, n, alongZ = false) => { for (let i = 0; i < n; i++) blk(x + (alongZ ? 0 : i * 0.035), y, z + (alongZ ? i * 0.035 : 0), alongZ ? 0.14 : 0.025, 0.17, alongZ ? 0.025 : 0.14, std(PHOTO[i % PHOTO.length], 0.5)); };
  const photo = (x, y, z, c, ry = 0, rz = 0, s = 1) => {
    const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.set(0, ry, rz); group.add(p);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.1 * s, 0.004), std('#fbf8f4', 0.8)); p.add(f);
    const i = new THREE.Mesh(new THREE.PlaneGeometry(0.066 * s, 0.066 * s), std(c, 0.5)); i.position.set(0, 0.01 * s, 0.003); p.add(i);
  };
  const hang = (canvas, w, x, y, z, ry = 0) => { const a = artMesh(canvas, w, w * 1.25, M.white); a.position.set(x, y, z); a.rotation.y = ry; group.add(a); };
  const sign = (canvas, w, h, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), neonSignMat(M, canvas)); m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 4; group.add(m);
  };
  const R = Math.PI / 2, BZ = Z0 + 0.11, LX = X0 + 0.11;

  /* ---------------- back wall ---------------- */
  // makeup corner: small shelf + macrame hanging
  shelf(-0.95, 2.3, BZ, 0.6); pot(-1.12, 2.315, BZ, 2); blk(-0.9, 2.315, BZ, 0.1, 0.14, 0.1, std('#f5b8cc', 0.3)); figure(-0.76, 2.315, BZ);
  {
    const ring = add(new THREE.TorusGeometry(0.13, 0.008, 8, 32), M.gold, -1.55, 2.55, Z0 + 0.03);
    for (let i = 0; i < 7; i++) { const s = add(new THREE.CylinderGeometry(0.004, 0.004, 0.22 + (i % 3) * 0.06, 4), M.cream, -1.55 - 0.12 + i * 0.04, 2.32 - (i % 3) * 0.03, Z0 + 0.03); s.castShadow = false; }
    add(new THREE.SphereGeometry(0.02, 8, 6), M.accent, -1.55, 2.55, Z0 + 0.04);
    ring.castShadow = false;
  }
  // wardrobe: neon cat + polaroid string
  sign(neonCat(), 0.62, 0.48, -0.15, 2.72, Z0 + 0.02);
  {
    const a = new THREE.Vector3(0.45, 2.85, Z0 + 0.03), b = new THREE.Vector3(2.05, 2.8, Z0 + 0.03);
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * 0.12;
      photo(p.x, p.y - 0.07, p.z, PHOTO[i % PHOTO.length], 0, (i % 2 ? 1 : -1) * 0.08);
      add(new THREE.SphereGeometry(0.01, 6, 4), M.bulb, p.x, p.y, p.z + 0.005);
    }
    const line = add(new THREE.CylinderGeometry(0.003, 0.003, 1.62, 4), M.dark, 1.25, 2.77, Z0 + 0.02); line.rotation.z = Math.PI / 2 + 0.03; line.castShadow = false;
  }
  hang(posterGirl({ hair: '#3b3442', shade: '#241f2c', eye: '#ff5a8a', outfit: '#f5afc6', ribbon: '#ee6a9c' }, ['#ffd6e4', '#fff'], 'GG!', 5), 0.34, 2.45, 2.3, Z0 + 0.03);
  // PC wall: irregular shelves, game collection, figures, plants
  shelf(3.25, 2.05, BZ, 0.8); for (let i = 0; i < 4; i++) figure(2.95 + i * 0.13, 2.065, BZ); pot(3.55, 2.065, BZ, 2);
  shelf(4.35, 2.4, BZ, 0.9); gameBoxes(3.97, 2.415, BZ, 8); figure(4.35, 2.415, BZ); figure(4.48, 2.415, BZ); blk(4.66, 2.415, BZ, 0.12, 0.1, 0.12, M.wood);
  shelf(3.6, 2.8, BZ, 0.6); pot(3.4, 2.815, BZ, 3); figure(3.62, 2.815, BZ); photo(3.8, 2.87, BZ, '#b8a6e8', 0, 0.05, 1.3);
  hang(posterGirl({ hair: '#e9e4f7', shade: '#b8aee0', eye: '#7a5cff', outfit: '#2a2440', ribbon: '#b56cff' }, ['#e6e0ff', '#ffd6ec'], 'LOVE', 7), 0.36, 4.62, 1.78, Z0 + 0.03);
  sign(neonStar(), 0.22, 0.22, 2.8, 2.6, Z0 + 0.02);

  /* ---------------- left wall ---------------- */
  hang(posterGirl({}, ['#ffe1ee', '#e6c8ff'], 'NYA~', 3), 0.56, X0 + 0.03, 2.1, -2.55, R);
  // polaroid grid by the bed
  for (let i = 0; i < 7; i++) photo(X0 + 0.02, 1.55 + (i % 3) * 0.14 + (i > 2 ? 0.03 : 0), -2.1 + Math.floor(i / 3) * 0.12 + (i % 2) * 0.02, PHOTO[i], R, ((i * 37) % 7 - 3) * 0.04);
  // cat clock
  {
    const c = add(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32), M.white, X0 + 0.02, 2.6, -1.55); c.rotation.z = R;
    for (const s of [-1, 1]) { const e = add(new THREE.ConeGeometry(0.05, 0.08, 4), M.white, X0 + 0.02, 2.77, -1.55 + s * 0.09); e.rotation.set(s * 0.35, Math.PI / 4, 0); }
    const h1 = add(new THREE.BoxGeometry(0.01, 0.09, 0.012), M.dark, X0 + 0.04, 2.63, -1.55); h1.rotation.x = 0.6;
    const h2 = add(new THREE.BoxGeometry(0.01, 0.12, 0.01), M.accent, X0 + 0.045, 2.64, -1.55); h2.rotation.x = -1.2;
  }
  // above the bookshelf: two staggered shelves
  shelf(LX, 2.3, -0.55, 0.7, true); pot(LX, 2.315, -0.78, 3, true); figure(LX, 2.315, -0.55); figure(LX, 2.315, -0.42); gameBoxes(LX, 2.315, -0.32, 3, true);
  shelf(LX, 2.62, 0.2, 0.55, true); blk(LX, 2.635, 0.1, 0.16, 0.14, 0.2, M.wood); pot(LX, 2.635, 0.35, 1, true);
  sign(neonStar(), 0.22, 0.22, X0 + 0.02, 2.95, -0.1, R);
  // above the figure case
  hang(posterCat(), 0.42, X0 + 0.03, 2.38, 1.05, R);
  {
    const dz = 1.72, dy = 2.35;           // dream-catcher
    const ring = add(new THREE.TorusGeometry(0.11, 0.008, 8, 28), M.cream, X0 + 0.03, dy, dz); ring.rotation.y = R;
    for (let i = 0; i < 3; i++) {
      add(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 4), M.cream, X0 + 0.03, dy - 0.2, dz - 0.06 + i * 0.06);
      const f = add(new THREE.SphereGeometry(0.03, 8, 6), i === 1 ? M.accent : M.plush, X0 + 0.03, dy - 0.3, dz - 0.06 + i * 0.06); f.scale.set(0.3, 1.4, 0.6);
    }
  }
  // snack corner: shelf with mugs + jars, heart neon, small illustration
  shelf(LX, 1.5, 2.55, 0.7, true);
  for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 14), std(PHOTO[i + 1], 0.3), LX, 1.56, 2.3 + i * 0.1);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), M.glass, LX, 1.585, 2.7); pot(LX, 1.515, 2.82, 2, true);
  sign(neonHeart(), 0.32, 0.32, X0 + 0.02, 2.35, 3.25, R);
  // photo wall above the snack shelf: mixed frames, polaroids and mini posters, deliberately uneven
  hang(posterGirl({ hair: '#b5d2f1', shade: '#86a8d8', eye: '#4a7ad8', outfit: '#fff', ribbon: '#7ab8ff' }, ['#e4f0ff', '#ffe6f0'], 'HI!', 13), 0.22, X0 + 0.03, 2.62, 2.18, R);
  hang(posterCat(), 0.2, X0 + 0.03, 2.28, 2.52, R);
  for (const [z, y, s, rz, c] of [
    [2.45, 2.74, 2.0, 0.04, 0], [2.7, 2.62, 1.6, -0.06, 1], [2.93, 2.76, 1.8, 0.05, 2],
    [2.2, 2.28, 1.5, -0.08, 3], [2.8, 2.32, 2.1, 0.03, 4], [3.02, 2.08, 1.4, -0.1, 5],
    [2.35, 1.98, 1.6, 0.07, 6], [2.62, 2.0, 1.3, -0.04, 1], [2.86, 1.95, 1.5, 0.08, 3],
  ]) photo(X0 + 0.02, y, z, PHOTO[c], R, rz, s);
  for (const [z, y] of [[2.3, 2.9], [2.72, 2.9], [3.0, 2.5]]) add(new THREE.SphereGeometry(0.012, 6, 4), M.accent, X0 + 0.025, y, z);   // pins
  // poster above the floor mirror
  hang(posterGirl({ hair: '#2e2839', shade: '#1c1822', eye: '#f4cf57', outfit: '#f5afc6', ribbon: '#f4cf57' }, ['#fff4d8', '#ffd6e4'], 'NEKO', 17), 0.34, X0 + 0.03, 2.15, -1.12, R);
  hang(posterGirl({ hair: '#ffd3a8', shade: '#e9a071', eye: '#3fae9a', outfit: '#fff', ribbon: '#ff8a65' }, ['#fff1dc', '#ffd6e4'], 'MEOW', 11), 0.3, X0 + 0.03, 1.8, 3.62, R);

  return { group, bounds: { X0, X1, Z0, Z1 } };
}
