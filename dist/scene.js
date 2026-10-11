import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const canvas = document.getElementById('roomCanvas');
const area = document.getElementById('sceneArea');
const loader = document.getElementById('sceneLoader');
const hoverLabel = document.getElementById('hoverLabel');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 100);
camera.position.set(9.4, 8.2, 11.2);
const initialPosition = camera.position.clone();
const target = new THREE.Vector3(0, 1.85, 0);
camera.lookAt(target);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(target);
controls.enableDamping = true;
controls.dampingFactor = .09;
controls.enablePan = false;
controls.enableZoom = false; // The mouse wheel controls the title's exit.
controls.minPolarAngle = .62;
controls.maxPolarAngle = 1.25;
controls.minAzimuthAngle = -.46;
controls.maxAzimuthAngle = 1.55;
controls.rotateSpeed = .55;
controls.update();

scene.add(new THREE.HemisphereLight(0xffebd2, 0x6a5880, 2.25));
const sun = new THREE.DirectionalLight(0xffd2a3, 1.55);
sun.position.set(-4, 8, 7);
sun.castShadow = false;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xb7c4df, .48);
fill.position.set(6, 5, -4);
scene.add(fill);

const room = new THREE.Group();
scene.add(room);
const materialCache = new Map();
function material(color, emissive = false) {
  const key = `${color}:${emissive}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshLambertMaterial({ color, emissive: emissive ? color : 0x000000, emissiveIntensity: emissive ? .24 : 0, flatShading: true, side: THREE.DoubleSide }));
  return materialCache.get(key);
}
function block(parent, size, color, position, radius = .035) {
  const [w, h, d] = size;
  const geometry = radius ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(...position); parent.add(mesh); return mesh;
}
function cylinder(parent, rt, rb, height, color, position, sides = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, height, sides), material(color));
  mesh.position.set(...position); parent.add(mesh); return mesh;
}
function ball(parent, radius, color, position, detail = 0) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), material(color));
  mesh.position.set(...position); parent.add(mesh); return mesh;
}
function labelGroup(action, label) {
  const group = new THREE.Group();
  group.userData.action = action;
  group.userData.label = label;
  room.add(group);
  return group;
}

// The floor and the two rear walls form a real open-front room.
block(room, [10.2, .34, 7.8], '#8f647d', [0, -.22, 0], .12);
block(room, [10.08, .14, 7.68], '#c68b7a', [0, -.01, 0], .025);
for (let row = 0; row < 18; row++) {
  const z = -3.68 + row * .43;
  block(room, [10.0, .012, .41], row % 3 === 0 ? '#db9d7e' : row % 2 ? '#d49a7c' : '#d9a082', [0, .065, z], .006);
  for (let seam = -4; seam <= 4; seam += 2) {
    const x = seam + (row % 2 ? .6 : -.3);
    block(room, [.012, .014, .40], '#ba7f75', [x, .073, z], 0);
  }
}
block(room, [10.2, 3.68, .22], '#e7ad95', [0, 1.86, -3.81], .05);
block(room, [.22, 3.68, 7.8], '#e8ae99', [-5.0, 1.86, 0], .05);
block(room, [10.0, .24, .18], '#d28e82', [0, .18, -3.66], .02);
block(room, [.18, .24, 7.55], '#d28e82', [-4.86, .18, 0], .02);
block(room, [10.35, .20, .26], '#f5c19e', [0, 3.72, -3.81], .03);
block(room, [.26, .20, 7.92], '#f5c19e', [-5.0, 3.72, 0], .03);

// Window: an emissive-looking flat sky panel. Nothing casts a window shadow.
const windowGroup = new THREE.Group(); room.add(windowGroup);
block(windowGroup, [.08, 2.06, 2.8], '#a96f78', [-4.78, 2.28, -.94], .015);
block(windowGroup, [.09, 1.80, 2.55], '#d8d4ce', [-4.72, 2.28, -.94], .012);
block(windowGroup, [.025, 1.68, 2.41], '#bdd7dc', [-4.66, 2.28, -.94], 0).material = material('#bdd7dc', true);
for (let z of [-2.18, -.94, .28]) block(windowGroup, [.10, 2.12, .09], '#996a72', [-4.59, 2.28, z], .008);
block(windowGroup, [.10, .10, 2.76], '#996a72', [-4.59, 2.28, -.94], .008);
block(windowGroup, [.10, .13, 2.97], '#f2c6a5', [-4.58, 1.20, -.94], .012);
block(windowGroup, [.10, .11, 2.97], '#f2c6a5', [-4.58, 3.35, -.94], .012);
for (let z of [-2.4, .52]) {
  block(windowGroup, [.10, 2.28, .25], '#f7dfcc', [-4.49, 2.28, z], .02);
  for (let i = 0; i < 3; i++) ball(windowGroup, .10, '#f2d6c8', [-4.42, 1.35 + i * .55, z + (i % 2 ? .05 : -.04)]);
}

// Bed and hand-coloured patchwork quilt.
const bed = new THREE.Group(); room.add(bed);
block(bed, [2.75, .30, 3.7], '#4a8290', [-2.8, .32, -.50], .11);
block(bed, [2.52, .29, 3.48], '#f6e6d3', [-2.8, .52, -.50], .10);
block(bed, [2.76, .84, .18], '#4c8190', [-2.8, .66, -2.32], .06);
block(bed, [2.76, .60, .16], '#4c8190', [-2.8, .50, 1.34], .05);
for (const x of [-4.04, -1.56]) for (const z of [-2.31, 1.31]) cylinder(bed, .12, .12, .81, '#4b8190', [x, .49, z], 10);
const quiltColors = ['#f5b49f','#e6b6bd','#a4bac6','#e6c19c','#f0d5ad','#b3b8d1','#d99593','#e6b29a'];
for (let iz = 0; iz < 7; iz++) for (let ix = 0; ix < 5; ix++) {
  const color = quiltColors[(ix * 3 + iz * 5) % quiltColors.length];
  block(bed, [.45, .045, .40], color, [-3.72 + ix * .46, .69, -.77 + iz * .42], .018);
}
block(bed, [2.35, .10, .62], '#ffe6c9', [-2.8, .69, -1.83], .08);
block(bed, [1.03, .22, .47], '#f3ddc9', [-3.42, .77, -1.75], .12);
block(bed, [1.03, .22, .47], '#eec5ad', [-2.18, .77, -1.75], .12);

// Rug, tassels and two small cushions.
block(room, [4.95, .055, 3.30], '#f4cfb9', [.18, .10, 1.10], .06);
block(room, [4.55, .018, 2.94], '#e8b8aa', [.18, .14, 1.10], .02);
const rugColors = ['#e2b2a5','#d7bec6','#b7bace','#eac79d','#efc4ae','#b5b3c7'];
for (let iz = 0; iz < 5; iz++) for (let ix = 0; ix < 7; ix++) {
  block(room, [.61, .008, .55], rugColors[(ix + iz * 2) % rugColors.length], [-1.67 + ix * .62, .155, -.02 + iz * .56], .008);
}
for (let ix = 0; ix < 17; ix++) for (let z of [-.59, 2.79]) ball(room, .045, '#f3d9c5', [-2.20 + ix * .30, .13, z]);
for (let iz = 0; iz < 10; iz++) for (let x of [-2.3, 2.66]) ball(room, .045, '#f3d9c5', [x, .13, -.42 + iz * .31]);
cylinder(room, .46, .55, .35, '#eca991', [.05, .36, .50], 12);
for (let i = 0; i < 8; i++) {
  const angle = i * Math.PI / 4;
  ball(room, .12, i % 2 ? '#f5ceae' : '#f2b7a4', [.05 + .27 * Math.cos(angle), .58, .50 + .27 * Math.sin(angle)]);
}
ball(room, .11, '#edbd75', [.05, .60, .50]);
block(room, [.84, .19, .72], '#94aebc', [-1.2, .29, 1.76], .14);

// Bedside table and books.
block(room, [.87, .99, .82], '#c68770', [-1.12, .55, -2.64], .08);
block(room, [.76, .05, .74], '#e9ae86', [-1.12, 1.06, -2.64], .025);
block(room, [.40, .07, .32], '#8c9db3', [-1.12, 1.12, -2.68], .01);
block(room, [.37, .05, .33], '#f7d7af', [-1.12, 1.18, -2.68], .01);

// Record cabinet and a real 3D turntable.
const record = labelGroup('record', '唱片机 · 听听录音');
block(record, [2.58, .95, .92], '#d29475', [.78, .57, -2.85], .07);
block(record, [2.69, .10, 1.04], '#efb182', [.78, 1.08, -2.85], .025);
for (let x of [.55, 1.32, 1.83]) block(record, [.015, .67, .03], '#b5766b', [x, .55, -2.37], 0);
for (let x of [1.52, 1.92]) ball(record, .045, '#f6d4a7', [x, .56, -2.32]);
const bookColors = ['#7f9ea9','#eac8a2','#7d789f','#c89192','#ebc4ad'];
for (let i = 0; i < 5; i++) block(record, [.12, .51 + (i % 2) * .10, .37], bookColors[i], [-.22 + i * .18, .46, -2.37], .01);
block(record, [1.24, .14, .78], '#5dabb0', [.40, 1.19, -2.80], .05);
const platter = cylinder(record, .35, .35, .055, '#303143', [.34, 1.30, -2.78], 32);
cylinder(record, .11, .11, .064, '#e9aa85', [.34, 1.335, -2.78], 24);
block(record, [1.22, .08, .70], '#66b5b7', [.40, 1.61, -3.18], .04).rotation.x = -.37;
block(record, [.37, .035, .035], '#eac8aa', [.70, 1.35, -2.54], .014).rotation.y = -.43;
cylinder(record, .038, .038, .09, '#edcb9f', [.83, 1.36, -2.45], 8);

// Photo board on the rear wall.
const board = labelGroup('board', '公告板 · 看看回忆');
block(board, [2.28, 1.36, .13], '#a77466', [.55, 2.60, -3.61], .11);
block(board, [2.03, 1.13, .03], '#c68f7d', [.55, 2.60, -3.51], .04);
const noteColors = ['#e8d5b9','#aac1c8','#e9b1a5','#d8bac5'];
for (let i = 0; i < 4; i++) {
  const x = -.21 + (i % 2) * .82;
  const y = 2.83 - Math.floor(i / 2) * .48;
  const note = block(board, [.57, .38, .025], noteColors[i], [x, y, -3.47], .012);
  note.rotation.z = (i % 2 ? 1 : -1) * .075;
  ball(board, .025, '#e6cfad', [x, y + .19, -3.44]);
}

// Wardrobe with separate doors, little handles and crown.
const wardrobe = labelGroup('wardrobe', '衣柜 · 打开照片');
block(wardrobe, [2.18, 3.00, 1.18], '#dba899', [3.55, 1.58, -2.78], .18);
block(wardrobe, [2.27, .24, 1.26], '#f1c1a7', [3.55, 3.17, -2.78], .12);
block(wardrobe, [2.30, .22, 1.26], '#f1c1a7', [3.55, .10, -2.78], .08);
block(wardrobe, [.96, 2.57, .055], '#43899c', [3.04, 1.62, -2.15], .15);
block(wardrobe, [.96, 2.57, .055], '#43899c', [4.06, 1.62, -2.15], .15);
block(wardrobe, [.05, 2.42, .08], '#32788c', [3.55, 1.62, -2.09], .02);
for (let x of [3.39, 3.71]) cylinder(wardrobe, .11, .11, .07, '#f5ceaa', [x, 1.63, -2.04], 12).rotation.x = Math.PI / 2;
for (let [x,y] of [[2.78,.90],[4.28,2.45],[3.9,.54]]) {
  const sticker = ball(wardrobe, .09, '#f5cb98', [x,y,-2.04]); sticker.scale.z = .25;
}
for (let [x,y,tint] of [[3.05,2.18,'#b9c5c9'],[4.04,1.13,'#e4b5a4']]) {
  block(wardrobe,[.43,.51,.023],'#f8e5ce',[x,y,-2.07],.01);
  block(wardrobe,[.34,.30,.024],tint,[x,y+.06,-2.05],.006);
  block(wardrobe,[.23,.025,.025],'#d49a8c',[x,y-.18,-2.05],.004);
}
for (let x of [2.8,4.3]) block(wardrobe, [.18,.18,.97], '#c78b7e', [x,.01,-2.77], .05);

// A standing lamp. The night mode dims the complete scene; it adds no light beams.
const lamp = labelGroup('lamp', '台灯 · 切换昼夜');
cylinder(lamp, .38, .44, .11, '#9e6d75', [-4.11, .12, 2.30]);
cylinder(lamp, .07, .085, 1.49, '#8b6875', [-4.11, .91, 2.30], 10);
ball(lamp, .14, '#ad7a7f', [-4.11, 1.62, 2.30]);
cylinder(lamp, .26, .48, .68, '#f8dfb4', [-4.11, 2.01, 2.30], 9);
cylinder(lamp, .26, .26, .05, '#e9aa8d', [-4.11, 2.36, 2.30], 9);
for (let i = 0; i < 5; i++) {
  const a = i * Math.PI * 2 / 5;
  ball(lamp, .05, '#e6a279', [-4.11 + Math.sin(a) * .35, 2.03, 2.30 + Math.cos(a) * .35]);
}

function plant(parent, position, scale = 1) {
  const [x,y,z] = position;
  cylinder(parent, .22 * scale, .17 * scale, .28 * scale, '#bd8d78', [x,y,z], 9);
  for (let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    ball(parent,.15*scale,i%2?'#738c6e':'#8ca575',[x+Math.cos(a)*.16*scale,y+.25*scale+(i%3)*.05*scale,z+Math.sin(a)*.16*scale]);
  }
  ball(parent,.18*scale,'#6f8c75',[x,y+.34*scale,z]);
}
plant(room,[-4.22,.25,-2.73],1.15);
plant(room,[4.63,.24,1.93],.86);
plant(room,[1.55,3.43,-3.46],.56);
block(room,[.82,.07,.42],'#c88976',[1.60,3.37,-3.48],.02);
for (let i=0;i<4;i++) block(room,[.13,.42+(i%2)*.12,.28],bookColors[i],[.98+i*.18,3.62,-3.45],.01);

// Invisible 3D volumes make small objects easier to tap on a phone.
const touchMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
function touchVolume(group, size, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), touchMaterial);
  mesh.position.set(...position);
  group.add(mesh);
}
touchVolume(record, [2.8, 1.8, 1.3], [.78, .85, -2.72]);
touchVolume(board, [2.65, 1.85, .55], [.55, 2.60, -3.43]);
touchVolume(lamp, [1.05, 2.65, 1.05], [-4.11, 1.32, 2.30]);

// Object picking uses 3D meshes and volumes that turn with the room.
const interactives = [record, board, wardrobe, lamp];
const meshes = [];
interactives.forEach(group => group.traverse(object => { if (object.isMesh) meshes.push(object); }));
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function hitAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(meshes, false)[0];
  if (!hit) return null;
  let object = hit.object;
  while (object && !object.userData.action) object = object.parent;
  return object?.userData.action ? object : null;
}
let down = null;
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  down = { x: event.clientX, y: event.clientY, t: performance.now() };
  canvas.classList.add('is-dragging');
  hoverLabel.hidden = true;
});
canvas.addEventListener('pointerup', event => {
  canvas.classList.remove('is-dragging');
  if (!down) return;
  const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
  down = null;
  if (moved > 7) return;
  const hit = hitAt(event.clientX, event.clientY);
  if (!hit) return;
  if (hit.userData.action === 'lamp') window.dispatchEvent(new Event('soft-hours:lamp'));
  else window.dispatchEvent(new CustomEvent('soft-hours:open', { detail: hit.userData.action }));
});
canvas.addEventListener('pointercancel', () => { down = null; canvas.classList.remove('is-dragging'); });
canvas.addEventListener('pointermove', event => {
  if (down) return;
  const hit = hitAt(event.clientX, event.clientY);
  canvas.style.cursor = hit ? 'pointer' : 'grab';
  hoverLabel.hidden = !hit;
  if (hit) {
    const rect = area.getBoundingClientRect();
    hoverLabel.textContent = hit.userData.label;
    hoverLabel.style.left = `${event.clientX - rect.left}px`;
    hoverLabel.style.top = `${event.clientY - rect.top}px`;
  }
});
canvas.addEventListener('pointerleave', () => { hoverLabel.hidden = true; });
window.addEventListener('soft-hours:reset-view', () => {
  camera.position.copy(initialPosition);
  controls.target.copy(target);
  controls.update();
});

function resize() {
  const width = area.clientWidth, height = area.clientHeight;
  if (!width || !height) return;
  const aspect = width / height;
  const viewHeight = aspect < .9 ? 27.0 : aspect < 1.25 ? 14.7 : 10.1;
  camera.left = -viewHeight * aspect / 2;
  camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
resize();
let firstFrame = true;
function render() {
  requestAnimationFrame(render);
  controls.update();
  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; loader.classList.add('is-hidden'); setTimeout(() => loader.remove(), 500); }
}
render();
