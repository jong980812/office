// Visitor counter on the lobby plate. GitHub Pages has no server, so the number lives in Abacus
// (https://abacus.jasoncameron.dev), a free public counter API. If it is unreachable the line
// simply stays hidden.
import { VISITOR_COUNTER } from './config.js';

const el = document.getElementById('visitors');
const API = 'https://abacus.jasoncameron.dev';

async function showVisitors() {
    if (!VISITOR_COUNTER) return;
    const { namespace, key } = VISITOR_COUNTER;
    // Count each browser session once, and never count local previews.
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    const seen = sessionStorage.getItem('office-counted');
    const action = local || seen ? 'get' : 'hit';
    const res = await fetch(`${API}/${action}/${namespace}/${key}`);
    if (!res.ok) return;
    const { value } = await res.json();
    if (!Number.isFinite(value)) return;
    if (action === 'hit') sessionStorage.setItem('office-counted', '1');
    el.querySelector('b').textContent = `#${value.toLocaleString('en-US')}`;
    el.hidden = false;
}

showVisitors().catch(() => {});
