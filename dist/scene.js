import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

const canvas = document.getElementById('roomCanvas');
const area = document.getElementById('sceneArea');
const loader = document.getElementById('sceneLoader');
const hoverLabel = document.getElementById('hoverLabel');
const zoomLevel = document.getElementById('zoomLevel');
const labels = { wardrobe: '衣柜 · 翻看照片', record: '唱片机 · 听听我们的声音', lamp: '台灯 · 切换昼夜', board: '公告板 · 收藏回忆' };

async function startRoom() {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;
  const camera = new THREE.OrthographicCamera(-9, 9, 6, -6, .1, 100);
  const target = new THREE.Vector3(0, 1.68, 0);
  const initialPosition = new THREE.Vector3(15.8983, 11.6254, 15.8983);
  camera.position.copy(initialPosition); camera.lookAt(target);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = true; controls.dampingFactor = .1;
  controls.enablePan = false; controls.enableZoom = true;
  controls.minZoom = .65; controls.maxZoom = 2.3; controls.zoomSpeed = .7;
  controls.rotateSpeed = .5;
  controls.minPolarAngle = .4; controls.maxPolarAngle = 1.43;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  controls.update();
  const zoomIn = document.getElementById('zoomIn'), zoomOut = document.getElementById('zoomOut');
  function zoomStatus() {
    zoomLevel.textContent = `${Math.round(camera.zoom * 100)}%`;
    zoomIn.disabled = camera.zoom >= controls.maxZoom - .001;
    zoomOut.disabled = camera.zoom <= controls.minZoom + .001;
  }
  function zoomBy(factor) {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
    camera.updateProjectionMatrix(); zoomStatus();
  }
  controls.addEventListener('change', zoomStatus);
  zoomIn.addEventListener('click', () => zoomBy(1.15));
  zoomOut.addEventListener('click', () => zoomBy(1 / 1.15));
  function reset() {
    controls.enableDamping = false; controls.update();
    camera.position.copy(initialPosition); camera.zoom = 1;
    controls.target.copy(target); camera.updateProjectionMatrix(); controls.update();
    controls.enableDamping = true; zoomStatus();
  }
  window.addEventListener('soft-hours:reset-view', reset);
  canvas.addEventListener('keydown', event => {
    if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault(); event.key === '0' ? reset() : zoomBy(event.key === '-' ? 1 / 1.15 : 1.15);
    }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const sphere = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (event.key === 'ArrowLeft') sphere.theta -= .1;
      if (event.key === 'ArrowRight') sphere.theta += .1;
      if (event.key === 'ArrowUp') sphere.phi -= .08;
      if (event.key === 'ArrowDown') sphere.phi += .08;
      sphere.phi = THREE.MathUtils.clamp(sphere.phi, controls.minPolarAngle, controls.maxPolarAngle);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sphere)); controls.update();
    }
  });
  const gltf = await new GLTFLoader().loadAsync('./assets/soft-hours-room.glb', event => {
    loader.textContent = event.total ? `正在打开小屋… ${Math.round(event.loaded / event.total * 100)}%` : '正在打开小屋…';
  });
  const room = gltf.scene; const meshes = []; const materials = [];
  room.traverse(object => {
    if (!object.isMesh) return;
    object.material.dispose();
    object.material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    materials.push(object.material); meshes.push(object);
  });
  scene.add(room);
  function nightMode(night) { materials.forEach(material => material.color.setScalar(night ? .34 : 1)); }
  nightMode(document.body.classList.contains('is-night'));
  window.addEventListener('soft-hours:night', event => nightMode(event.detail));
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function hitAt(x, y) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    let object = hit.object;
    while (object && !object.userData.action) object = object.parent;
    return labels[object?.userData.action] ? object.userData.action : null;
  }
  const fingers = new Set(); let down = null; let dragged = false;
  canvas.addEventListener('pointerdown', event => {
    fingers.add(event.pointerId); if (fingers.size > 1) dragged = true;
    if (fingers.size === 1) { down = { x: event.clientX, y: event.clientY }; dragged = false; }
    canvas.classList.add('is-dragging'); hoverLabel.hidden = true;
  });
  canvas.addEventListener('pointermove', event => {
    if (down) { if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) dragged = true; return; }
    if (event.pointerType === 'touch') return;
    const action = hitAt(event.clientX, event.clientY);
    canvas.style.cursor = action ? 'pointer' : 'grab'; hoverLabel.hidden = !action;
    if (action) {
      const rect = area.getBoundingClientRect(); hoverLabel.textContent = labels[action];
      hoverLabel.style.left = `${Math.min(event.clientX - rect.left, rect.width - 205)}px`;
      hoverLabel.style.top = `${event.clientY - rect.top}px`;
    }
  });
  canvas.addEventListener('pointerup', event => {
    fingers.delete(event.pointerId);
    if (down && !dragged && !fingers.size && (event.button === 0 || event.pointerType === 'touch')) {
      const action = hitAt(event.clientX, event.clientY);
      if (action === 'lamp') window.dispatchEvent(new Event('soft-hours:lamp'));
      else if (action) window.dispatchEvent(new CustomEvent('soft-hours:open', { detail: action }));
    }
    if (!fingers.size) { down = null; canvas.classList.remove('is-dragging'); }
  });
  canvas.addEventListener('pointercancel', event => { fingers.delete(event.pointerId); down = null; dragged = true; canvas.classList.remove('is-dragging'); });
  canvas.addEventListener('pointerleave', () => { hoverLabel.hidden = true; });
  canvas.addEventListener('wheel', () => { hoverLabel.hidden = true; }, { passive: true });
  function resize() {
    const width = area.clientWidth, height = area.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const viewHeight = Math.max(10.2, 15.5 / aspect);
    camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(area); resize(); zoomStatus();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
  loader.hidden = true;
  canvas.dataset.modelReady = 'true';
}
startRoom().catch(error => {
  console.error('Unable to open the 3D room', error);
  loader.replaceChildren(document.createTextNode('小屋暂时没有加载成功。'));
  const retry = document.createElement('button'); retry.textContent = '重新加载'; retry.type = 'button';
  retry.addEventListener('click', () => location.reload()); loader.append(retry);
});
