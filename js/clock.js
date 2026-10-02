// Seoul clock. It drives the clock badge, the page theme (day / night) and, in 3D, the window sky
// and the lamps. Preview another time with ?hour=22, or click the clock badge to flip day and night.
import { params } from './config.js';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function seoulNow() {
    const p = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(new Date()).map((x) => [x.type, x.value])
    );
    const hour = params.has('hour') ? Number(params.get('hour')) : Number(p.hour) + Number(p.minute) / 60;
    return { year: +p.year, month: +p.month, day: +p.day, hour, label: `${p.hour}:${p.minute}` };
}

export function skyPhase(h) {
    if (h >= 7 && h < 17) return 'day';
    if (h >= 17 && h < 19.5) return 'dusk';
    if (h >= 5.5 && h < 7) return 'dawn';
    return 'night';
}

const badge = document.getElementById('clock');
const listeners = [];
let override = null;  // 'day' | 'night' once the visitor flips the badge
let last = '';

function read() {
    const now = seoulNow();
    const phase = override ?? skyPhase(now.hour);
    return { now, phase, theme: phase === 'night' ? 'night' : 'day' };
}

function tick() {
    const state = read();
    document.body.dataset.theme = state.theme;
    badge.querySelector('.clock-time').textContent = `${state.now.label} KST`;
    badge.setAttribute('aria-label',
        `It is ${state.now.label} in Seoul. Switch to ${state.theme === 'night' ? 'day' : 'night'} mode`);
    const key = `${state.phase}/${state.now.day}`;
    if (key === last) return;
    last = key;
    for (const fn of listeners) fn(state);
}

// Calls `fn({ now, phase, theme })` now and whenever the phase (or the date) changes.
export function onDaylight(fn) {
    listeners.push(fn);
    fn(read());
}

badge.addEventListener('click', () => {
    override = document.body.dataset.theme === 'night' ? 'day' : 'night';
    tick();
});

tick();
setInterval(tick, 20_000);
