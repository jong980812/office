// What's in the room and how the camera frames it. Edit this file to add, move or rename sections.
import { THREE } from './three.js';


// Tour order. anchor = marker position; target/dir/size = camera framing when focused.
export const HOTSPOTS = [
    { id: 'about',        label: 'About',        object: 'The bookshelf',
      anchor: [-2.2, 2.28, -2.72],  target: [-2.2, 1.08, -2.8],  dir: [0.45, 0.22, 1],  size: 1.2 },
    { id: 'research',     label: 'Research',     object: 'The whiteboard',
      anchor: [-2.93, 2.42, -1.4],  target: [-3.0, 1.7, -1.4],  dir: [1, 0.1, 0.2],    size: 1.18 },
    { id: 'publications', label: 'Publications', object: 'The monitor',
      anchor: [1.13, 1.84, -2.7],   target: [0.45, 1.4, -2.7],   dir: [0.2, 0.2, 1],    size: 0.9 },
    { id: 'recognition',  label: 'Recognition',  object: 'The wall of frames',
      anchor: [0.4, 2.72, -2.95],   target: [0.4, 2.4, -3.0],    dir: [0.1, -0.02, 1],  size: 1.1 },
    { id: 'news',         label: 'News',         object: 'The calendar',
      anchor: [-1.32, 2.05, -2.93], target: [-1.2, 1.55, -3.0],  dir: [0.15, 0.06, 1],  size: 0.76 },
    { id: 'physical-ai',  label: 'Physical AI',  object: 'The robot arm',
      anchor: [1.62, 1.5, -2.4],    target: [1.55, 1.22, -2.4],  dir: [0.5, 0.3, 1],    size: 0.64 },
    { id: 'contact',      label: 'Contact',      object: 'The letter tray',
      anchor: [-0.47, 1.06, -2.36], target: [-0.42, 0.88, -2.38], dir: [0.25, 0.65, 1], size: 0.5 },
];
// side = where the always-on label sits next to its dot; desc = hover summary.
const LABELS = {
    'about':        { side: 'top',   desc: 'Who I am · bio & education' },
    'research':     { side: 'top',   desc: 'My three research directions' },
    'publications': { side: 'right', desc: '12 publications · NeurIPS, ICCV, TPAMI' },
    'recognition':  { side: 'top',   desc: 'Spotlights, highlights & stats' },
    'news':         { side: 'top',   desc: 'Latest: 2 papers at NeurIPS 2026' },
    'physical-ai':  { side: 'right', desc: "What's next + my PhD search" },
    'contact':      { side: 'left',  desc: 'Email, GitHub, LinkedIn & CV' },
};
HOTSPOTS.forEach((h, i) => { h.index = i; h.kind = 'panel'; Object.assign(h, LABELS[h.id]); });
export const DOOR = { id: 'door', label: '← Lobby', kind: 'exit', side: 'top', desc: 'Step back out to the entrance',
               anchor: [-2.93, 2.35, 0.32] };
export const byId = Object.fromEntries(HOTSPOTS.map((h) => [h.id, h]));

// Interior of the room: walls at x = ±3, back wall at z = back. It runs far toward +z (behind the
// camera) so there is always floor, wall and ceiling at the edges of the screen.
export const ROOM = { height: 2.9, back: -3, front: 7, depth: 10 };

// The overview camera stands inside the room near the front-right corner, looking at the back-left
// one, so the back wall (where most objects live) faces it more than the left wall does.
export const OVERVIEW = {
    fov: 46,
    wide:   { target: new THREE.Vector3(-0.35, 1.3, -1.9), theta: 0.6, phi: 1.44 },
    // Portrait screens can't hold both walls, so they face the desk; the rest is a drag away.
    // `look` makes a drag turn the camera on the spot instead of orbiting the target.
    narrow: { target: new THREE.Vector3(0.45, 1.3, -2.6), theta: 0.22, phi: 1.44, look: true },
};
// How far the camera may wander; keeps it inside the walls when dragging or on narrow screens.
export const CAMERA_BOUNDS = { min: new THREE.Vector3(-2.7, 0.5, -2.2), max: new THREE.Vector3(2.75, 2.6, 6.5) };
// Points the overview keeps in frame: the objects, not the walls.
export const KEEP_IN_VIEW = { narrow: [
    [-0.95, 0.7, -2.4], [2.0, 0.7, -2.4],   // desk
    [0.4, 2.78, -3.0],                      // frames
].map((p) => new THREE.Vector3(...p)), wide: [
    [-3.0, 2.3, 0.8], [-3.0, 0.2, 0.8],    // door on the left wall
    [-3.0, 2.5, -1.4],                      // whiteboard
    [0.4, 2.78, -3.0],                      // frames
    [2.85, 2.5, -3.0], [2.8, 0.1, -2.2],    // window, plant
    [0.45, 0.05, -0.9],                     // chair on the rug
].map((p) => new THREE.Vector3(...p)) };

// Visitor counter shown in the lobby (see visitors.js). Pick a namespace nobody else uses; null turns it off.
export const VISITOR_COUNTER = { namespace: 'jong980812-office', key: 'visits' };

// Environment
export const params = new URLSearchParams(location.search);
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const canHover = matchMedia('(hover: hover)').matches;
