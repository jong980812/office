// Renderer, lights, pointer interaction, camera and the frame loop.
import { THREE } from './three.js';
import { OVERVIEW, KEEP_IN_VIEW, CAMERA_BOUNDS, reduceMotion, canHover } from './config.js';
import { UP, setMaxAnisotropy } from './util.js';
import { seoulNow, onDaylight } from './clock.js';
import { skyTexture, calendarTexture } from './textures.js';
import { buildRoom } from './room.js';
import { state, view, markers, measureLabels, openPanel, closePanel, showSceneError, canvas, panel, tooltip } from './ui.js';
import { exitOffice } from './lobby.js';

async function fontsReady() {
    if (!document.fonts) return;
    const loads = ['700 64px Sora', '600 28px Inter', 'italic 500 26px Inter', '700 64px Caveat', '500 48px Caveat']
        .map((f) => document.fonts.load(f));
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]);
}

export async function initScene() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping;
    setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

    await fontsReady();

    const scene = new THREE.Scene();
    const world = new THREE.Group();
    scene.add(world);
    const camera = new THREE.PerspectiveCamera(OVERVIEW.fov, innerWidth / innerHeight, 0.1, 100);

    /* ---------- lights ---------- */
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd9ccb6, 2.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(5, 9, 6);
    sun.target.position.set(-0.5, 0, -1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 4;
    scene.add(sun, sun.target);

    /* ---------- registry of interactive objects ---------- */
    const entries = new Map();
    function register(def, group) {
        const entry = { def, group, glow: false };
        group.userData.entry = entry;
        entries.set(def.id, entry);
        world.add(group);
        return entry;
    }

    const { skyMat, calendarPage, robot, door, lights } = buildRoom({ scene, world, register, entries });

    /* ---------- time of day ---------- */
    // Night is a late study session: the room goes dim and cool, and the warm lamps take over.
    // The ambient light never drops far enough to make the whiteboard or the frames hard to read.
    const LIGHTING = {
        day:   { hemi: 2.0,  sky: 0xffffff, ground: 0xd9ccb6, sun: 2.4,  tint: 0xffffff, lamp: 0,    mood: 0, ceiling: 0xe9eef5, panels: 0xffffff, wallGlow: 0.3 },
        dawn:  { hemi: 1.8,  sky: 0xffffff, ground: 0xd9ccb6, sun: 2.1,  tint: 0xffe6d2, lamp: 0.35, mood: 0, ceiling: 0xe9e6e6, panels: 0xfff3e2, wallGlow: 0.25 },
        dusk:  { hemi: 1.7,  sky: 0xffffff, ground: 0xd9ccb6, sun: 2.0,  tint: 0xffdcc0, lamp: 0.6,  mood: 0, ceiling: 0xe6e0e2, panels: 0xffecd6, wallGlow: 0.25 },
        night: { hemi: 1.15, sky: 0xa9b9ee, ground: 0x4a4460, sun: 0.35, tint: 0xb9c8ff, lamp: 2.6,  mood: 1, ceiling: 0x2b3450, panels: 0x46507a, wallGlow: 0.05 },
    };
    let clockLabel = '';
    setInterval(() => { clockLabel = seoulNow().label; }, 20_000);
    onDaylight(({ now, phase }) => {
        clockLabel = now.label;
        skyMat.map?.dispose();
        skyMat.map = skyTexture(phase);
        skyMat.needsUpdate = true;
        calendarPage.material.map?.dispose();
        calendarPage.material.map = calendarTexture(now);
        calendarPage.material.needsUpdate = true;
        const L = LIGHTING[phase];
        hemi.intensity = L.hemi;
        hemi.color.set(L.sky);
        hemi.groundColor.set(L.ground);
        sun.intensity = L.sun;
        sun.color.set(L.tint);
        lights.lamp.light.intensity = L.lamp;
        lights.lamp.bulb.emissiveIntensity = L.lamp > 0 ? 2.5 : 0.15;
        lights.ceiling.color.set(L.ceiling);
        lights.panels.color.set(L.panels);
        lights.rightWall.emissiveIntensity = L.wallGlow;
        for (const m of lights.mood) {
            m.light.intensity = m.power * L.mood;
            m.glow.color.set(L.mood ? m.on : m.off);
        }
    });

    /* =====================================================
       Interaction
       ===================================================== */

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pointer = { nx: 0, ny: 0, sx: 0, sy: 0, cx: 0, cy: 0, over: false, moved: false };
    let drag = null;
    let hover3D = null, hoverUI = null, glowing = null;
    let needsPick = false;

    function pickAt(x, y) {
        ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObject(world, true)[0];
        let o = hit?.object;
        while (o && !o.userData.entry) o = o.parent;
        return o ? o.userData.entry : null;
    }

    function setGlow(entry, on) {
        if (!entry || entry.def.kind === 'tooltip') return;
        entry.group.traverse((o) => {
            if (!o.isMesh) return;
            for (const m of [].concat(o.material)) {
                if (!m.emissive) continue;
                if (m.userData.e0 === undefined) { m.userData.e0 = m.emissive.getHex(); m.userData.i0 = m.emissiveIntensity; }
                if (on) { m.emissive.setHex(0x3d7bd0); m.emissiveIntensity = 0.38; }
                else { m.emissive.setHex(m.userData.e0); m.emissiveIntensity = m.userData.i0; }
            }
        });
    }

    function refreshHover() {
        let entry = hoverUI ? entries.get(hoverUI) : hover3D;
        if (entry && entry.def.id === state.current?.id) entry = null;  // already in focus
        if (entry !== glowing) {
            setGlow(glowing, false);
            setGlow(entry, true);
            glowing = entry;
            markers.forEach((m) => m.el.classList.toggle('is-hover', entry?.def.id === m.def.id));
        }
        const pointable = hover3D && hover3D.def.kind !== 'tooltip' && hover3D.def.id !== state.current?.id;
        canvas.classList.toggle('hovering', !!pointable);
        if (hover3D?.def.kind === 'tooltip') {
            tooltip.textContent = `Seoul · ${clockLabel} KST`;
            tooltip.style.transform = `translate(${pointer.cx + 14}px, ${pointer.cy + 16}px)`;
            tooltip.classList.add('show');
        } else {
            tooltip.classList.remove('show');
        }
    }

    view.hover = (id) => { hoverUI = id; refreshHover(); };

    addEventListener('pointermove', (e) => {
        pointer.nx = (e.clientX / innerWidth) * 2 - 1;
        pointer.ny = -(e.clientY / innerHeight) * 2 + 1;
        pointer.cx = e.clientX;
        pointer.cy = e.clientY;
        pointer.over = e.target === canvas;
        pointer.moved = true;
        needsPick = true;
        if (drag) {
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (Math.hypot(dx, dy) > 5) drag.moved = true;
            if (drag.moved && !state.current) {
                // Looking around on the spot (portrait) may turn much further than orbiting does.
                const [lo, hi] = cam.fit.look ? [-1.3, 0.6] : [-0.6, 0.6];
                cam.yawGoal = THREE.MathUtils.clamp(drag.yaw - dx * 0.004, lo, hi);
                cam.pitchGoal = THREE.MathUtils.clamp(drag.pitch - dy * 0.003, -0.2, 0.14);
                canvas.classList.add('dragging');
            }
        }
    });
    canvas.addEventListener('pointerdown', (e) => {
        dragged = false;  // a touch drag ends without a click, so clear the flag here too
        drag = { x: e.clientX, y: e.clientY, yaw: cam.yawGoal, pitch: cam.pitchGoal, moved: false };
    });
    let dragged = false;
    const endDrag = () => {
        if (!drag) return;
        dragged = drag.moved;
        drag = null;
        canvas.classList.remove('dragging');
    };
    addEventListener('pointerup', endDrag);
    // Touch browsers cancel the pointer when a system gesture takes over; without this the drag sticks.
    addEventListener('pointercancel', endDrag);
    // Taps are handled on `click`, not `pointerup`: on touch screens the browser fires a follow-up
    // click after pointerup, and if the UI changed in between (panel closed, intro card back) that
    // click would land on whatever just appeared under the finger.
    canvas.addEventListener('click', (e) => {
        if (dragged) { dragged = false; return; }
        const entry = pickAt(e.clientX, e.clientY);
        const kind = entry?.def.kind;
        if (kind === 'panel') {
            if (state.current?.id === entry.def.id) return;
            openPanel(entry.def.id);
            if (entry.def.id === 'physical-ai') robot.wave = 0;
        } else if (kind === 'exit') {
            exitOffice();
        } else if (kind === 'tooltip' && !canHover) {
            pointer.cx = e.clientX;
            pointer.cy = e.clientY;
            hover3D = entry;
            refreshHover();
            setTimeout(() => { hover3D = null; refreshHover(); }, 1800);
        } else if (!kind && state.current) {
            closePanel();
        }
    });
    canvas.addEventListener('pointerleave', () => { pointer.over = false; hover3D = null; refreshHover(); });

    /* ---------- camera ---------- */

    const cam = {
        pos: new THREE.Vector3(), target: new THREE.Vector3(),
        goalPos: new THREE.Vector3(), goalTarget: new THREE.Vector3(),
        ox: 0, oy: 0, goalOx: 0, goalOy: 0,
        yaw: 0, pitch: 0, yawGoal: 0, pitchGoal: 0,
        region: null, fit: null,
    };

    function remeasure() {
        cam.region = measureRegion();
        if (!state.current) cam.fit = fitOverview(cam.region);
    }

    function measureRegion() {
        const W = innerWidth, H = innerHeight;
        if (W <= 820) return { left: 0, right: W, top: 52, bottom: H - (state.current ? panel.offsetHeight : 62) };
        return { left: 0, right: W - (state.current ? panel.offsetWidth + 12 : 0), top: 64, bottom: H - 72 };
    }

    const fitCam = new THREE.PerspectiveCamera();
    function fitOverview(R) {
        fitCam.fov = camera.fov;
        fitCam.aspect = camera.aspect;
        fitCam.updateProjectionMatrix();
        const shape = camera.aspect < 0.9 ? 'narrow' : 'wide';
        const O = OVERVIEW[shape];
        const dir = new THREE.Vector3().setFromSpherical(new THREE.Spherical(1, O.phi, O.theta));
        // Farthest the camera can back away along `dir` before it leaves the room.
        const dMax = Math.min((CAMERA_BOUNDS.max.x - O.target.x) / dir.x, (CAMERA_BOUNDS.max.z - O.target.z) / dir.z);
        const fw = (R.right - R.left) / innerWidth, fh = (R.bottom - R.top) / innerHeight;
        const p = new THREE.Vector3();
        let d = dMax, box;
        for (let i = 0; i < 8; i++) {
            fitCam.position.copy(O.target).addScaledVector(dir, d);
            fitCam.lookAt(O.target);
            fitCam.updateMatrixWorld();
            box = [Infinity, -Infinity, Infinity, -Infinity];
            for (const c of KEEP_IN_VIEW[shape]) {
                p.copy(c).project(fitCam);
                box = [Math.min(box[0], p.x), Math.max(box[1], p.x), Math.min(box[2], p.y), Math.max(box[3], p.y)];
            }
            if (i < 7) d = Math.min(dMax, d * Math.max((box[1] - box[0]) / (2 * fw), (box[3] - box[2]) / (2 * fh)) / 0.97);
        }
        const px = (innerWidth / 2) * (1 + (box[0] + box[1]) / 2);
        const py = (innerHeight / 2) * (1 - (box[2] + box[3]) / 2);
        return { ...O, dist: d, ox: px - (R.left + R.right) / 2, oy: py - (R.top + R.bottom) / 2 };
    }

    function fitDistance(size, R) {
        const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const fh = Math.max(0.2, (R.bottom - R.top) / innerHeight);
        const fw = Math.max(0.2, (R.right - R.left) / innerWidth);
        return size / (t * Math.min(fh, fw * camera.aspect));
    }

    const tmpV = new THREE.Vector3(), camRight = new THREE.Vector3(), camUp = new THREE.Vector3();
    function updateGoal() {
        const R = cam.region;
        if (state.current) {
            cam.goalOx = innerWidth / 2 - (R.left + R.right) / 2;
            cam.goalOy = innerHeight / 2 - (R.top + R.bottom) / 2;
            const t = new THREE.Vector3(...state.current.target);
            const dist = fitDistance(state.current.size, R);
            cam.goalTarget.copy(t);
            cam.goalPos.copy(t).addScaledVector(tmpV.set(...state.current.dir).normalize(), dist);
        } else {
            cam.goalOx = cam.fit.ox;
            cam.goalOy = cam.fit.oy;
            // Out in the lobby the camera waits a few steps back, so entering reads as walking in.
            const look = cam.fit.look;
            const s = new THREE.Spherical(cam.fit.dist + (state.inside ? 0 : 2.4),
                cam.fit.phi + (look ? 0 : cam.pitch), cam.fit.theta + (look ? 0 : cam.yaw));
            cam.goalTarget.copy(cam.fit.target);
            cam.goalPos.copy(cam.fit.target).add(tmpV.setFromSpherical(s));
            if (look) {
                // Stand still and turn the head: dragging right swings the view to the left wall.
                tmpV.subVectors(cam.goalTarget, cam.goalPos);
                const reach = tmpV.length();
                tmpV.applyAxisAngle(UP, -cam.yaw);
                tmpV.y -= cam.pitch * reach;
                cam.goalTarget.copy(cam.goalPos).add(tmpV);
            }
        }
        // gentle parallax
        const amp = cam.goalPos.distanceTo(cam.goalTarget) * (state.current ? 0.006 : 0.014);
        camRight.setFromMatrixColumn(camera.matrixWorld, 0);
        camUp.setFromMatrixColumn(camera.matrixWorld, 1);
        cam.goalPos.addScaledVector(camRight, pointer.sx * amp).addScaledVector(camUp, pointer.sy * amp * 0.6);
        cam.goalPos.clamp(CAMERA_BOUNDS.min, CAMERA_BOUNDS.max);
    }

    function relayout() {
        const W = innerWidth, H = innerHeight;
        renderer.setSize(W, H);
        measureLabels();
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        remeasure();
    }
    addEventListener('resize', relayout);
    relayout();

    view.focus = (def) => {
        remeasure();
        if (!def) { cam.yawGoal = 0; cam.pitchGoal = 0; }
        if (def?.id === 'physical-ai') robot.wave = 0;
    };

    updateGoal();
    cam.pos.copy(cam.goalPos);
    cam.target.copy(cam.goalTarget);
    cam.ox = cam.goalOx;
    cam.oy = cam.goalOy;

    /* ---------- per-frame ---------- */

    const robotPlane = new THREE.Plane();
    const robotLook = new THREE.Vector3(0, 1.2, 0);
    const robotBase = new THREE.Vector3(1.55, 1.05, -2.4);
    const projected = new THREE.Vector3();
    const angleLerp = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

    function updateRobot(dt, t) {
        const k = 1 - Math.exp(-dt * 5);
        let targetYaw, lift;
        if (canHover && pointer.moved) {
            const n = tmpV.subVectors(camera.position, robotBase).setY(0).normalize();
            robotPlane.setFromNormalAndCoplanarPoint(n, projected.copy(robotBase).addScaledVector(n, 0.9));
            ndc.set(pointer.nx, pointer.ny);
            raycaster.setFromCamera(ndc, camera);
            if (raycaster.ray.intersectPlane(robotPlane, robotLook) === null) robotLook.copy(camera.position);
            targetYaw = Math.atan2(robotLook.x - robotBase.x, robotLook.z - robotBase.z);
            lift = THREE.MathUtils.clamp((robotLook.y - 1.2) * 0.8, -0.5, 0.5);
        } else {
            const face = Math.atan2(camera.position.x - robotBase.x, camera.position.z - robotBase.z);
            targetYaw = face + Math.sin(t * 0.5) * 0.7;
            lift = Math.sin(t * 0.8) * 0.15;
        }
        if (reduceMotion) { targetYaw = robot.ang; lift = 0; }
        robot.ang = angleLerp(robot.ang, targetYaw, k);
        robot.pitch += (lift - robot.pitch) * k;
        robot.yaw.rotation.y = robot.ang;

        let wave = 0, grip = 0;
        if (robot.wave >= 0) {
            robot.wave += dt;
            const env = Math.sin(Math.min(robot.wave / 1.8, 1) * Math.PI);
            wave = Math.sin(robot.wave * 11) * env;
            grip = Math.abs(Math.sin(robot.wave * 8)) * env;
            if (robot.wave > 1.8) robot.wave = -1;
        }
        const breathe = reduceMotion ? 0 : Math.sin(t * 1.4) * 0.03;
        robot.shoulder.rotation.x = 0.25 + breathe - wave * 0.15;
        robot.elbow.rotation.x = 0.85 - robot.pitch * 0.6;
        robot.wrist.rotation.x = 0.35 - robot.pitch * 0.8;
        robot.wrist.rotation.z = wave * 0.6;
        robot.fingers[0].position.x = -0.03 - grip * 0.012;
        robot.fingers[1].position.x = 0.03 + grip * 0.012;
    }

    function updateMarkers() {
        const W = innerWidth, H = innerHeight;
        const visible = [];
        for (const m of markers) {
            projected.copy(m.anchor).project(camera);
            m.x = (projected.x + 1) / 2 * W;
            m.y = (1 - projected.y) / 2 * H;
            const off = projected.z > 1 || m.x < 8 || m.x > W - 8 || m.y < 56 || m.y > H - 64;
            m.el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px)`;
            m.el.classList.toggle('is-hidden', off);
            if (!off) visible.push(m);
        }
        if (state.current) return;

        // Put each label on its preferred side, then push it down past any dot or label it would cover.
        const taken = visible.map((m) => ({ owner: m, x: m.x - 12, y: m.y - 12, w: 24, h: 24 }));
        const gap = 14;
        for (const m of markers) if (!visible.includes(m)) m.line.setAttribute('visibility', 'hidden');
        for (const m of [...visible].sort((a, b) => a.y - b.y)) {
            const { lw: w, lh: h } = m;
            const minX = cam.region.left + 4, maxX = W - w - 8;
            let x = m.side === 'right' ? m.x + gap : m.side === 'left' ? m.x - gap - w : m.x - w / 2;
            let y = m.side === 'top' ? m.y - gap - h : m.y - h / 2;
            // flip to the other side rather than run off screen
            if (m.side === 'left' && x < minX) x = m.x + gap;
            if (m.side === 'right' && x > maxX) x = m.x - gap - w;
            x = THREE.MathUtils.clamp(x, minX, maxX);
            for (let n = 0; n < 12; n++) {
                const hit = taken.find((b) => b.owner !== m && x < b.x + b.w && b.x < x + w && y < b.y + b.h + 3 && b.y < y + h + 3);
                if (!hit) break;
                y = hit.y + hit.h + 4;
            }
            taken.push({ x, y, w, h });
            const k = m.placed ? 0.3 : 1;
            m.lx += (x - m.x - m.lx) * k;
            m.ly += (y - m.y - m.ly) * k;
            m.placed = true;
            m.label.style.transform = `translate(${m.lx.toFixed(1)}px, ${m.ly.toFixed(1)}px)`;

            // leader line from the dot's edge to the nearest point of the label
            const lx = m.x + m.lx, ly = m.y + m.ly;
            const px = THREE.MathUtils.clamp(m.x, lx, lx + w), py = THREE.MathUtils.clamp(m.y, ly, ly + h);
            const dist = Math.hypot(px - m.x, py - m.y);
            if (dist > 20) {
                const ux = (px - m.x) / dist, uy = (py - m.y) / dist;
                m.line.setAttribute('x1', (m.x + ux * 10).toFixed(1));
                m.line.setAttribute('y1', (m.y + uy * 10).toFixed(1));
                m.line.setAttribute('x2', px.toFixed(1));
                m.line.setAttribute('y2', py.toFixed(1));
                m.line.setAttribute('visibility', 'visible');
            } else {
                m.line.setAttribute('visibility', 'hidden');
            }
        }
    }

    const clock = new THREE.Clock();
    let lastInside = 0;
    renderer.setAnimationLoop(() => {
        try { frame(); } catch (err) {
            renderer.setAnimationLoop(null);
            showSceneError(err);
        }
    });

    function frame() {
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;

        // Behind the closed lobby door nothing is visible, so don't spend the GPU on it.
        if (state.inside) lastInside = t;
        else if (t - lastInside > 2) return;

        const kp = 1 - Math.exp(-dt * 4);
        pointer.sx += ((canHover ? pointer.nx : 0) - pointer.sx) * kp;
        pointer.sy += ((canHover ? pointer.ny : 0) - pointer.sy) * kp;
        cam.yaw += (cam.yawGoal - cam.yaw) * kp;
        cam.pitch += (cam.pitchGoal - cam.pitch) * kp;

        updateGoal();
        const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 3.2);
        cam.pos.lerp(cam.goalPos, k);
        cam.target.lerp(cam.goalTarget, k);
        cam.ox += (cam.goalOx - cam.ox) * k;
        cam.oy += (cam.goalOy - cam.oy) * k;
        camera.position.copy(cam.pos);
        camera.lookAt(cam.target);
        camera.setViewOffset(innerWidth, innerHeight, cam.ox, cam.oy, innerWidth, innerHeight);
        camera.updateMatrixWorld();

        // re-pick periodically too, since the camera can move under a still cursor
        if (!drag && (needsPick || (pointer.over && renderer.info.render.frame % 6 === 0))) {
            needsPick = false;
            hover3D = canHover && pointer.over ? pickAt(pointer.cx, pointer.cy) : null;
            refreshHover();
        }

        updateRobot(dt, t);
        const doorGoal = glowing?.def.id === 'door' ? -0.55 : 0;
        door.open += (doorGoal - door.open) * (1 - Math.exp(-dt * 6));
        door.hinge.rotation.y = door.open;

        updateMarkers();
        renderer.render(scene, camera);
    }

    canvas.classList.add('ready');
}
