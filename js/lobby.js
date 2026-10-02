// The entrance: a hallway wall with the office door, a profile plate and a notice board.
// Opening the door zooms through the doorway into the 3D room that is already running behind it.
import { HOTSPOTS, reduceMotion, canHover } from './config.js';
import { state, body, openPanel, closePanel } from './ui.js';

const lobby = document.getElementById('lobby');
const doorway = lobby.querySelector('.doorway');
const leaf = lobby.querySelector('.door-leaf');
const ENTER_MS = 1300;  // door swing + zoom, matches the transitions in office.css

// Latest news is read from the News panel's own template, so there is one place to edit it.
const newsList = document.getElementById('lobby-news');
const news = document.getElementById('tpl-news').content.querySelectorAll('.news:not(.pinned)');
for (const item of [...news].slice(0, 3)) {
    const title = item.querySelector('h3').cloneNode(true);
    title.querySelectorAll('.chip').forEach((c) => c.remove());
    const li = document.createElement('li');
    li.innerHTML = '<button data-enter="news"><time></time><span></span></button>';
    li.querySelector('time').textContent = item.querySelector('.news-date').textContent;
    li.querySelector('span').textContent = title.textContent.trim();
    newsList.append(li);
}

const directory = document.getElementById('lobby-directory');
for (const h of HOTSPOTS) {
    const b = document.createElement('button');
    b.dataset.enter = h.id;
    b.innerHTML = `<span class="num">${h.index + 1}</span>${h.label}`;
    directory.append(b);
}

if (!canHover) document.getElementById('hint').textContent = 'Tap a numbered object · drag to look around';

let timer;

// Walk in. `id` opens that section once inside; `instant` skips the door animation (deep links).
export function enterOffice(id, { instant = false } = {}) {
    if (state.inside) {
        if (id) openPanel(id);
        return;
    }
    state.inside = true;
    const r = doorway.getBoundingClientRect();
    lobby.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height * 0.45}px`;
    lobby.classList.toggle('no-anim', instant);
    lobby.inert = true;
    document.activeElement?.blur();
    body.classList.add('inside');
    if (!id) history.replaceState(null, '', '#office');
    clearTimeout(timer);
    timer = setTimeout(() => {
        body.classList.add('labels-in');
        if (id) openPanel(id);
    }, instant || reduceMotion ? 0 : ENTER_MS);
}

export function exitOffice() {
    if (!state.inside) return;
    clearTimeout(timer);
    closePanel();
    state.inside = false;
    lobby.classList.remove('no-anim');
    lobby.inert = false;
    body.classList.remove('inside', 'labels-in');
    history.replaceState(null, '', location.pathname + location.search);
    leaf.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action="enter"], [data-action="exit"], [data-enter]');
    if (!el) return;
    if (el.dataset.action === 'exit') exitOffice();
    else enterOffice(el.dataset.enter);
});
