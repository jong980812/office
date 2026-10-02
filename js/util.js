// Small helpers for building meshes and drawing on canvas textures.
import { THREE, RoundedBoxGeometry } from './three.js';

export const TAU = Math.PI * 2;

export function rng(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...o });

export function rbox(w, h, d, r = 0.015) {
    const rr = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    return rr > 0.002 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d);
}

export function add(parent, geo, material, pos = [0, 0, 0], { cast = true, receive = true } = {}) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(...pos);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
}

export const UP = new THREE.Vector3(0, 1, 0);
export function rod(parent, a, b, r, material) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = add(parent, new THREE.CylinderGeometry(r, r, dir.length(), 12), material);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
}

let maxAniso = 1;
export function setMaxAnisotropy(v) { maxAniso = v; }
export function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
}

// Shrinks `size` until `text` fits in `maxW`, then sets ctx.font.
export function setFit(c, text, maxW, size, weight, family) {
    let s = size;
    do { c.font = `${weight} ${s}px ${family}`; s -= 2; } while (c.measureText(text).width > maxW && s > 10);
}

export function wobble(c, x1, y1, x2, y2, r, amp = 2.4) {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 36));
    c.beginPath();
    c.moveTo(x1 + (r() - 0.5) * amp, y1 + (r() - 0.5) * amp);
    for (let i = 1; i <= n; i++) {
        const t = i / n;
        c.lineTo(x1 + (x2 - x1) * t + (r() - 0.5) * amp, y1 + (y2 - y1) * t + (r() - 0.5) * amp);
    }
    c.stroke();
}
export function sketchRect(c, x, y, w, h, r) {
    wobble(c, x - 6, y, x + w + 4, y + 2, r);
    wobble(c, x + w, y - 4, x + w - 2, y + h + 6, r);
    wobble(c, x + w + 5, y + h, x - 3, y + h - 2, r);
    wobble(c, x, y + h + 4, x + 2, y - 5, r);
}
export function sketchArrow(c, x1, y1, x2, y2, r) {
    wobble(c, x1, y1, x2, y2, r);
    const a = Math.atan2(y2 - y1, x2 - x1);
    for (const s of [-1, 1]) wobble(c, x2, y2, x2 - 30 * Math.cos(a + s * 0.5), y2 - 30 * Math.sin(a + s * 0.5), r, 1.5);
}
export function roundRect(c, x, y, w, h, rad) {
    c.beginPath();
    if (c.roundRect) { c.roundRect(x, y, w, h, rad); return; }
    // ctx.roundRect is Safari 16+
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
}
export function star(c, cx, cy, R, r, fill) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
        const rad = i % 2 ? r : R;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    c.closePath();
    c.fillStyle = fill;
    c.fill();
}
