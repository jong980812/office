// jsDelivr's +esm builds resolve `three` to one shared URL, so no import map is needed
// (import maps only exist on iOS 16.4+). This is the only file that names the CDN.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/RoundedBoxGeometry.js/+esm';

export { THREE, RoundedBoxGeometry };
