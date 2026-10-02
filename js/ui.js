// 2D layer: chips, markers and the detail panel. Works even without WebGL.
import { THREE } from './three.js';
import { HOTSPOTS, DOOR, byId } from './config.js';

const $ = (s) => document.querySelector(s);

export const body = document.body;
export const canvas = $('#scene');
const chips = $('#chips');
export const panel = $('#panel');
const panelBody = $('#panel-body');
const panelTitle = $('#panel-title');
const panelEyebrow = $('#panel-eyebrow');
const footPrev = $('#foot-prev');
const footNext = $('#foot-next');
const footCount = $('#foot-count');
export const tooltip = $('#tooltip');
export const markerLayer = $('#markers');

// `inside` is false while the visitor is still at the lobby door.
// `current` is the hotspot whose panel is open (null in the overview).
export const state = { inside: false, current: null };

// The 3D view plugs into these once it's ready.
export const view = { focus() {}, hover() {}, layout() {} };

for (const h of HOTSPOTS) {
    const b = document.createElement('button');
    b.className = 'chip-btn';
    b.dataset.id = h.id;
    b.innerHTML = `<span class="num">${h.index + 1}</span>${h.label}`;
    b.addEventListener('click', () => (state.current?.id === h.id ? closePanel() : openPanel(h.id)));
    b.addEventListener('pointerenter', () => view.hover(h.id));
    b.addEventListener('pointerleave', () => view.hover(null));
    chips.append(b);
}

export const markers = [...HOTSPOTS, DOOR].map((h, i) => {
    const el = document.createElement('button');
    el.className = 'marker is-hidden';
    el.dataset.kind = h.kind;
    el.dataset.side = h.side;
    el.style.setProperty('--i', i);
    el.setAttribute('aria-label', h.kind === 'exit' ? 'Leave the office, back to the lobby' : `Open ${h.label}: ${h.desc}`);
    // Panel markers carry their tour number, matching the numbered chips at the bottom.
    const num = h.kind === 'panel' ? `<span class="num">${h.index + 1}</span>` : '';
    el.innerHTML = `<span class="marker-dot"></span><span class="marker-label">${num}${h.label}<span class="marker-desc">${h.desc}</span></span>`;
    if (h.kind === 'exit') el.dataset.action = 'exit';  // handled in lobby.js
    else el.addEventListener('click', () => openPanel(h.id));
    el.addEventListener('pointerenter', () => view.hover(h.id));
    el.addEventListener('pointerleave', () => view.hover(null));
    el.addEventListener('focus', () => view.hover(h.id));
    el.addEventListener('blur', () => view.hover(null));
    markerLayer.append(el);
    return { def: h, el, label: el.querySelector('.marker-label'), side: h.side, anchor: new THREE.Vector3(...h.anchor),
             x: 0, y: 0, lx: 0, ly: 0, lw: 0, lh: 0, placed: false };
});
// Thin leader lines keep a label tied to its dot when it has to move away from it.
const SVG_NS = 'http://www.w3.org/2000/svg';
const leaders = document.createElementNS(SVG_NS, 'svg');
leaders.id = 'leaders';
markerLayer.prepend(leaders);
for (const m of markers) {
    m.line = document.createElementNS(SVG_NS, 'line');
    leaders.append(m.line);
}
export function measureLabels() {
    for (const m of markers) { m.lw = m.label.offsetWidth; m.lh = m.label.offsetHeight; }
}

export function openPanel(id) {
    const def = byId[id];
    if (!def) return;
    state.current = def;
    panelEyebrow.textContent = def.object;
    panelTitle.textContent = def.label;
    panelBody.replaceChildren(document.getElementById(`tpl-${id}`).content.cloneNode(true));
    panelBody.scrollTop = 0;
    panelBody.querySelectorAll('video').forEach((v) => { v.muted = true; v.play().catch(() => {}); });

    const n = HOTSPOTS.length;
    const prev = HOTSPOTS[(def.index + n - 1) % n];
    const next = HOTSPOTS[(def.index + 1) % n];
    footPrev.textContent = `← ${prev.label}`;
    footPrev.dataset.target = prev.id;
    footNext.textContent = `${next.label} →`;
    footNext.dataset.target = next.id;
    footCount.textContent = `${def.index + 1} / ${n}`;

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    body.classList.add('is-focused');
    chips.querySelectorAll('[data-id]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
    history.replaceState(null, '', `#${id}`);
    panelTitle.focus({ preventScroll: true });
    view.focus(def);
}

export function closePanel() {
    if (!state.current) return;
    state.current = null;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    body.classList.remove('is-focused');
    chips.querySelectorAll('[data-id]').forEach((b) => b.setAttribute('aria-current', 'false'));
    panelBody.querySelectorAll('video').forEach((v) => v.pause());
    history.replaceState(null, '', '#office');
    view.focus(null);
}

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'tour') openPanel(HOTSPOTS[0].id);
    else if (action === 'close') closePanel();
    else if (action === 'prev' || action === 'next') openPanel(el.dataset.target);
    else if (action === 'home') { e.preventDefault(); closePanel(); }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
    if (!state.current || e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') footNext.click();
    if (e.key === 'ArrowLeft') footPrev.click();
});

export function showSceneError(err) {
    console.error('[office] 3D scene unavailable:', err);
    body.classList.add('no-webgl');
    markerLayer.remove();
    canvas.classList.remove('ready');
    const el = $('#scene-error');
    el.innerHTML = 'The 3D office isn\u2019t available on this device — use the sections below, or visit the ' +
        '<a href="https://jong980812.github.io/">classic homepage</a>.<small></small>';
    el.querySelector('small').textContent = String(err?.message || err);
    el.hidden = false;
}
