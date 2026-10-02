// Everything with text or a pattern on it is drawn on a canvas at load time — no image assets.
import { canvasTex, rng, setFit, wobble, sketchRect, sketchArrow, roundRect, star, TAU } from './util.js';
import { MONTHS } from './clock.js';

export function plankTexture() {
    return canvasTex(1024, 1024, (c, W, H) => {
        const r = rng(7);
        const rows = 12;
        const rh = H / rows;
        for (let i = 0; i < rows; i++) {
            let x = -r() * 300;
            while (x < W) {
                const len = 260 + r() * 320;
                c.fillStyle = `hsl(33, 40%, ${73 + r() * 6}%)`;
                c.fillRect(x, i * rh, len, rh);
                c.strokeStyle = 'rgba(120, 85, 45, 0.08)';
                c.lineWidth = 1.5;
                for (let g = 0; g < 4; g++) {
                    const gy = i * rh + 8 + r() * (rh - 16);
                    c.beginPath();
                    c.moveTo(x + 6, gy);
                    c.bezierCurveTo(x + len * 0.3, gy + (r() - 0.5) * 6, x + len * 0.7, gy + (r() - 0.5) * 6, x + len - 6, gy);
                    c.stroke();
                }
                c.fillStyle = 'rgba(110, 75, 40, 0.28)';
                c.fillRect(x, i * rh, 2, rh);
                x += len;
            }
            c.fillStyle = 'rgba(110, 75, 40, 0.3)';
            c.fillRect(0, i * rh, W, 2);
        }
    });
}

export function whiteboardTexture() {
    return canvasTex(2048, 1144, (c, W, H) => {
        const r = rng(11);
        c.fillStyle = '#fbfcfd';
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 7; i++) {
            c.fillStyle = 'rgba(140, 155, 175, 0.045)';
            c.beginPath();
            c.ellipse(r() * W, r() * H, 120 + r() * 220, 40 + r() * 60, r() * 3, 0, TAU);
            c.fill();
        }
        c.lineCap = 'round';
        c.lineJoin = 'round';
        const NAVY = '#163a6b', BLUE = '#2a63ad', CORAL = '#d9463b', INK = '#3a4a5c';

        c.fillStyle = NAVY;
        c.font = '700 96px Caveat';
        c.fillText('Research roadmap', 96, 150);
        c.strokeStyle = NAVY;
        c.lineWidth = 5;
        wobble(c, 96, 174, 700, 168, r, 3);

        // top-right corner: a note of thanks to my advisor
        c.textAlign = 'right';
        c.fillStyle = INK;
        c.font = '500 46px Caveat';
        c.fillText('with gratitude to my advisor', 1952, 78);
        c.fillStyle = NAVY;
        c.font = '700 68px Caveat';
        c.fillText('Prof. Jinwoo Choi', 1952, 142);
        c.lineWidth = 4;
        wobble(c, 1560, 158, 1952, 154, r, 2);
        c.textAlign = 'left';

        const boxes = [
            { x: 96,   color: NAVY,  n: '01', title: ['Trustworthy', 'Multimodal Video'], lines: ['vision · language · audio', 'grounded reasoning', 'fewer hallucinations'] },
            { x: 764,  color: BLUE,  n: '02', title: ['How Models', 'Learn'],             lines: ['how they are trained', 'what they represent', 'why they succeed / fail'] },
            { x: 1432, color: CORAL, n: '03', title: ['Video for', 'Physical AI'],        lines: ['perceive', '→ reason', '→ act in the world'] },
        ];
        const bw = 520, by = 290, bh = 480;
        boxes.forEach((b, i) => {
            c.strokeStyle = b.color;
            c.lineWidth = i === 2 ? 9 : 7;
            sketchRect(c, b.x, by, bw, bh, r);
            c.fillStyle = b.color;
            c.font = '700 56px Caveat';
            c.fillText(b.n, b.x + 30, by + 72);
            b.title.forEach((t, j) => { setFit(c, t, bw - 60, 76, 700, 'Caveat'); c.fillText(t, b.x + 30, by + 160 + j * 74); });
            c.fillStyle = INK;
            b.lines.forEach((t, j) => { setFit(c, `– ${t}`, bw - 60, 50, 500, 'Caveat'); c.fillText(`– ${t}`, b.x + 32, by + 336 + j * 54); });
            if (i < 2) {
                c.strokeStyle = INK;
                c.lineWidth = 6;
                sketchArrow(c, b.x + bw + 26, by + bh / 2, b.x + bw + 128, by + bh / 2 + 4, r);
            }
        });

        // "next!" callout over box 03
        c.fillStyle = CORAL;
        c.font = '700 66px Caveat';
        c.fillText('next!', 1790, 222);
        c.strokeStyle = CORAL;
        c.lineWidth = 6;
        sketchArrow(c, 1860, 236, 1830, 300, r);
        star(c, 1745, 196, 26, 11, CORAL);

        c.fillStyle = NAVY;
        c.font = '700 58px Caveat';
        c.fillText('video = our window into the physical world', 96, 900);
        c.fillStyle = INK;
        c.font = '500 50px Caveat';
        c.fillText('trustworthy → grounded · interpretable · reliable', 96, 980);

        // doodle: film strip → robot
        c.strokeStyle = NAVY;
        c.lineWidth = 6;
        sketchRect(c, 1340, 860, 190, 120, r);
        for (let k = 0; k < 5; k++) {
            c.strokeRect(1356 + k * 36, 872, 16, 12);
            c.strokeRect(1356 + k * 36, 956, 16, 12);
        }
        sketchArrow(c, 1560, 922, 1680, 922, r);
        c.strokeStyle = CORAL;
        sketchRect(c, 1712, 860, 150, 124, r);
        c.beginPath(); c.arc(1756, 912, 13, 0, TAU); c.stroke();
        c.beginPath(); c.arc(1818, 912, 13, 0, TAU); c.stroke();
        wobble(c, 1760, 952, 1816, 952, r, 1.5);
        wobble(c, 1787, 860, 1787, 820, r, 1.5);
        c.beginPath(); c.arc(1787, 810, 10, 0, TAU); c.stroke();
    });
}

export function awardTexture({ venue, year, badge, color, paper }) {
    return canvasTex(512, 400, (c, W, H) => {
        c.fillStyle = '#fbf8f0';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#d8c28a';
        c.lineWidth = 4;
        c.strokeRect(18, 18, W - 36, H - 36);
        c.lineWidth = 1.5;
        c.strokeRect(30, 30, W - 60, H - 60);
        c.textAlign = 'center';
        star(c, W / 2, 80, 24, 10, color);
        c.fillStyle = '#0f2a52';
        setFit(c, venue, W - 90, 64, 700, 'Sora');
        c.fillText(venue, W / 2, 170);
        c.fillStyle = '#52657a';
        c.font = '600 28px Inter';
        c.fillText(year, W / 2, 210);
        c.fillStyle = color;
        roundRect(c, W / 2 - 118, 236, 236, 50, 25);
        c.fill();
        c.fillStyle = '#fff';
        c.font = '700 26px Inter';
        c.fillText(badge, W / 2, 270);
        c.fillStyle = '#52657a';
        c.font = 'italic 500 26px Inter';
        c.fillText(paper, W / 2, 334);
    });
}

export function calendarTexture(now) {
    return canvasTex(512, 640, (c, W) => {
        const r = rng(now.day);
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, W, 640);
        c.fillStyle = '#e2574c';
        c.fillRect(0, 0, W, 140);
        c.textAlign = 'center';
        c.fillStyle = '#fff';
        setFit(c, MONTHS[now.month - 1].toUpperCase(), W - 60, 56, 700, 'Sora');
        c.fillText(MONTHS[now.month - 1].toUpperCase(), W / 2, 82);
        c.font = '600 28px Inter';
        c.fillText(String(now.year), W / 2, 120);

        const gx = 30, cw = (W - 60) / 7;
        c.fillStyle = '#8a99ab';
        c.font = '700 22px Inter';
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => c.fillText(d, gx + cw * i + cw / 2, 186));
        const first = new Date(Date.UTC(now.year, now.month - 1, 1)).getUTCDay();
        const nDays = new Date(Date.UTC(now.year, now.month, 0)).getUTCDate();
        c.font = '600 28px Inter';
        for (let d = 1; d <= nDays; d++) {
            const idx = first + d - 1;
            const x = gx + cw * (idx % 7) + cw / 2;
            const y = 244 + Math.floor(idx / 7) * 68;
            c.fillStyle = idx % 7 === 0 ? '#e2574c' : '#1c2b3a';
            c.fillText(String(d), x, y);
            if (d === now.day) {
                c.strokeStyle = '#e2574c';
                c.lineWidth = 4;
                c.beginPath();
                for (let k = 0; k <= 26; k++) {
                    const a = (k / 24) * TAU - 0.4;
                    const rad = 30 + (r() - 0.5) * 3;
                    c.lineTo(x + Math.cos(a) * rad * 1.1, y - 10 + Math.sin(a) * rad);
                }
                c.stroke();
            }
        }
    });
}

export function stickyTexture(lines) {
    return canvasTex(256, 256, (c, W, H) => {
        c.fillStyle = '#ffe27a';
        c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,0.05)';
        c.fillRect(0, 0, W, 34);
        c.fillStyle = '#163a6b';
        c.textAlign = 'center';
        lines.forEach((t, i) => { setFit(c, t, W - 30, 50, 700, 'Caveat'); c.fillText(t, W / 2, 92 + i * 54); });
    });
}

export function spineTexture(text, bg) {
    return canvasTex(128, 576, (c, W, H) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.fillRect(0, 40, W, 6);
        c.fillRect(0, H - 46, W, 6);
        c.save();
        c.translate(W / 2, H / 2);
        c.rotate(Math.PI / 2);
        c.fillStyle = '#fff';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        setFit(c, text, H - 130, 52, 700, 'Sora');
        c.fillText(text, 0, 2);
        c.restore();
    });
}

export function envelopeTexture() {
    return canvasTex(512, 360, (c, W, H) => {
        c.fillStyle = '#fbf6ea';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(120, 100, 70, 0.35)';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(8, 8);
        c.lineTo(W / 2, 200);
        c.lineTo(W - 8, 8);
        c.stroke();
        c.fillStyle = '#e2574c';
        c.beginPath();
        c.arc(W / 2, 200, 40, 0, TAU);
        c.fill();
        c.fillStyle = '#fff';
        c.font = '700 44px Sora';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('@', W / 2, 198);
    });
}

export function keyboardTexture() {
    return canvasTex(512, 168, (c, W, H) => {
        c.fillStyle = '#d7dee7';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fdfefe';
        const cols = 14, pad = 12, gap = 5;
        const kw = (W - pad * 2 - gap * (cols - 1)) / cols, kh = 24;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < cols; col++) {
                roundRect(c, pad + col * (kw + gap), pad + row * (kh + gap), kw, kh, 4);
                c.fill();
            }
        }
        roundRect(c, pad + 4 * (kw + gap), pad + 4 * (kh + gap), kw * 6 + gap * 5, kh, 4);
        c.fill();
    });
}

export function signTexture() {
    return canvasTex(320, 110, (c, W, H) => {
        c.fillStyle = '#ffffff';
        roundRect(c, 0, 0, W, H, 18);
        c.fill();
        c.fillStyle = '#163a6b';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        setFit(c, '← LOBBY', W - 40, 38, 700, 'Sora');
        c.fillText('← LOBBY', W / 2, H / 2 + 2);
    });
}

export function skyTexture(phase) {
    return canvasTex(512, 640, (c, W, H) => {
        const r = rng(3);
        const G = {
            day:   ['#7fbcef', '#d6ebfb', '#9fb3c9'],
            dawn:  ['#9fb7e3', '#fbd9c0', '#8f8aa3'],
            dusk:  ['#4f5f9f', '#f3a37b', '#5b4f6e'],
            night: ['#0a1631', '#253c69', '#18233d'],
        }[phase];
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, G[0]);
        g.addColorStop(1, G[1]);
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);

        if (phase === 'night') {
            for (let i = 0; i < 70; i++) {
                c.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.6})`;
                c.fillRect(r() * W, r() * H * 0.62, 2 + r() * 2, 2 + r() * 2);
            }
            c.fillStyle = '#fdf3cf';
            c.beginPath(); c.arc(360, 130, 42, 0, TAU); c.fill();
            c.fillStyle = G[0];
            c.beginPath(); c.arc(380, 118, 38, 0, TAU); c.fill();
        } else if (phase === 'day') {
            c.fillStyle = '#fff6c9';
            c.beginPath(); c.arc(380, 120, 40, 0, TAU); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.85)';
            for (const [x, y, s] of [[120, 170, 1], [330, 260, 0.8], [60, 330, 0.6]]) {
                for (const [dx, dy, rr] of [[0, 0, 36], [40, -14, 44], [86, 0, 34], [44, 12, 38]]) {
                    c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s, 0, TAU); c.fill();
                }
            }
        } else {
            c.fillStyle = phase === 'dusk' ? '#ffb46b' : '#ffd2a1';
            c.beginPath(); c.arc(150, 400, 54, 0, TAU); c.fill();
        }

        // Skyline with N Seoul Tower on Namsan
        c.fillStyle = G[2];
        c.beginPath();
        c.moveTo(0, H);
        c.quadraticCurveTo(250, 380, 512, 520);
        c.lineTo(512, H);
        c.fill();
        c.fillRect(252, 262, 10, 150);
        c.beginPath(); c.ellipse(257, 290, 24, 13, 0, 0, TAU); c.fill();
        c.fillRect(255, 200, 4, 70);
        const bld = [[0, 470, 70], [64, 430, 58], [118, 500, 64], [178, 450, 50], [226, 520, 80], [300, 470, 60], [356, 430, 70], [424, 490, 88]];
        const dark = phase === 'night' ? '#141d33' : phase === 'day' ? '#8aa0b8' : '#4e4462';
        for (const [x, y, w] of bld) {
            c.fillStyle = dark;
            c.fillRect(x, y, w, H - y);
            if (phase !== 'day') {
                for (let wy = y + 14; wy < H - 10; wy += 22) {
                    for (let wx = x + 8; wx < x + w - 10; wx += 16) {
                        if (r() < (phase === 'night' ? 0.45 : 0.2)) {
                            c.fillStyle = '#ffd98a';
                            c.fillRect(wx, wy, 7, 9);
                        }
                    }
                }
            }
        }
    });
}
