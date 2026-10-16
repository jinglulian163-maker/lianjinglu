import { installCurtains } from './curtains.js';
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

const canvas = document.getElementById('roomCanvas');
const area = document.getElementById('sceneArea');
const loader = document.getElementById('sceneLoader');
const hoverLabel = document.getElementById('hoverLabel');
const zoomLevel = document.getElementById('zoomLevel');
const labels = { curtainLeft: '窗帘 · 左右拖动开合', curtainRight: '窗帘 · 左右拖动开合', wardrobe: '衣柜 · 翻看照片', record: '唱片机 · 听听我们的声音', lamp: '台灯 · 切换昼夜', board: '公告板 · 收藏回忆' };

async function startRoom() {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;
  // True two-point perspective: level camera, vertical lens shift, two finite horizontal vanishing points.
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 150);
  const target = new THREE.Vector3(0, 8.5, 0);
  const initialPosition = new THREE.Vector3(16, 8.5, 20);
  const initialDistance = initialPosition.distanceTo(target);
  let viewHeight = 15.6, compositionCenter = .56;
  const roomFocus = new THREE.Vector3(0, 1.68, 0);
  const viewFocus = new THREE.Vector3();
  function updateProjection() {
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    viewFocus.copy(roomFocus).applyMatrix4(camera.matrixWorldInverse);
    camera.projectionMatrix.elements[9] = camera.projectionMatrix.elements[5] * viewFocus.y / -viewFocus.z + (compositionCenter * 2 - 1);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  camera.position.copy(initialPosition); camera.lookAt(target);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = true; controls.dampingFactor = .1;
  controls.enablePan = false; controls.enableZoom = true;
  controls.minZoom = .65; controls.maxZoom = 2.3; controls.zoomSpeed = .7;
  controls.minDistance = initialDistance; controls.maxDistance = initialDistance;
  controls.rotateSpeed = .5;
  controls.minPolarAngle = .35; controls.maxPolarAngle = 1.68;
  controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  controls.update();
  const zoomIn = document.getElementById('zoomIn'), zoomOut = document.getElementById('zoomOut');
  function zoomStatus() {
    const zoom = camera.zoom;
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    zoomIn.disabled = zoom >= controls.maxZoom - .001;
    zoomOut.disabled = zoom <= controls.minZoom + .001;
    updateProjection();
  }
  function zoomBy(factor) {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
    zoomStatus();
  }
  // Adapt the bundled OrbitControls dolly hooks so wheel, pinch and middle-drag
  // use lens magnification, never moving the viewpoint toward the furniture.
  controls._dollyOut = factor => zoomBy(factor);
  controls._dollyIn = factor => zoomBy(1 / factor);
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
      sphere.theta = THREE.MathUtils.clamp(sphere.theta, controls.minAzimuthAngle, controls.maxAzimuthAngle);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sphere)); controls.update();
    }
  });
  const gltf = await new GLTFLoader().loadAsync('./assets/soft-hours-room.glb', event => {
    loader.textContent = event.total ? `正在打开小屋… ${Math.round(event.loaded / event.total * 100)}%` : '正在打开小屋…';
  });
  const room = gltf.scene; const meshes = []; const materials = [];
  room.scale.y = 1 / .92;
  const nightUniform = { value: document.body.classList.contains('is-night') ? 1 : 0 };
  let nightTarget = nightUniform.value;
  const curtainOpening = {value:new THREE.Vector2(-3.15,3.15)};
  room.traverse(object => {
    if (!object.isMesh) return;
    object.material.dispose();
    object.material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    object.material.onBeforeCompile = shader => {
      shader.uniforms.uNight = nightUniform;
      shader.uniforms.uCurtainOpening = curtainOpening;
      shader.vertexShader = 'varying vec3 vRoomPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvRoomPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = 'uniform float uNight; uniform vec2 uCurtainOpening; varying vec3 vRoomPosition;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        float distanceFromWindow = max(0.0, vRoomPosition.x + 5.3);
        float windowY = vRoomPosition.y + distanceFromWindow * .52;
        float windowZ = vRoomPosition.z - distanceFromWindow * .18;
        float opening = smoothstep(1.5,1.75,windowY) * (1.0-smoothstep(3.8,4.1,windowY));
        opening *= 1.0-smoothstep(2.6,3.15,abs(windowZ));
        float mullions = smoothstep(.03,.14,abs(sin(windowZ * 1.904)));
        mullions *= smoothstep(.035,.15,abs(windowY-2.91));
        float curtainGap = max(0.0, uCurtainOpening.y-uCurtainOpening.x);
        float curtainMask = smoothstep(uCurtainOpening.x-.08,uCurtainOpening.x+.08,windowZ)
                          * (1.0-smoothstep(uCurtainOpening.y-.08,uCurtainOpening.y+.08,windowZ));
        float curtainTransmission = smoothstep(0.0,.35,curtainGap);
        float moon = opening * curtainMask * curtainTransmission * mix(.35,1.0,mullions) * exp(-distanceFromWindow*.16);
        vec3 nightColor = outgoingLight * vec3(.24,.30,.49) + vec3(.12,.20,.32) * moon;
        outgoingLight = mix(outgoingLight, nightColor, uNight);
        #include <opaque_fragment>
      `);
    };
    materials.push(object.material); meshes.push(object);
  });
  scene.add(room);
  const curtains = installCurtains({room,camera,canvas,controls,meshes,hoverLabel});
  curtainOpening.value.fromArray(curtains.lightOpening);
  const windowGlow = new THREE.Mesh(new THREE.PlaneGeometry(6.35,2.45),new THREE.MeshBasicMaterial({color:0x92afd9,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  windowGlow.rotation.y = Math.PI/2; windowGlow.position.set(-5.48,2.58,.05); room.add(windowGlow);
  function nightMode(night) { nightTarget = night ? 1 : 0; }
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
    const isCurtain = action === 'curtainLeft' || action === 'curtainRight';
    curtains.hover(event,isCurtain);
    if (!isCurtain) canvas.style.cursor = action ? 'pointer' : 'grab';
    hoverLabel.hidden = !action || isCurtain;
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
    viewHeight = Math.max(15.6, 17.2 / aspect);
    // Compose within a full-screen canvas; zoom never meets an interior crop box.
    compositionCenter = width < 600 ? .55 : .56;
    camera.aspect = aspect;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewHeight / (2 * initialDistance)));
    updateProjection(); renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(area); resize(); zoomStatus();
  let previousTime = performance.now();
  const modal = document.getElementById("modalShell");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  renderer.setAnimationLoop(() => {
    const now = performance.now(), delta = Math.min((now-previousTime)/1000,.1); previousTime=now;
    if (document.hidden || (modal && !modal.hidden)) return;
    const reduced = motionPreference.matches;
    nightUniform.value = reduced ? nightTarget : THREE.MathUtils.damp(nightUniform.value,nightTarget,5,delta);
    const aperture = curtains.lightOpening;
    curtainOpening.value.x = reduced ? aperture[0] : THREE.MathUtils.damp(curtainOpening.value.x,aperture[0],14,delta);
    curtainOpening.value.y = reduced ? aperture[1] : THREE.MathUtils.damp(curtainOpening.value.y,aperture[1],14,delta);
    const gap = Math.max(0,curtainOpening.value.y-curtainOpening.value.x);
    windowGlow.material.opacity = nightUniform.value * .36 * THREE.MathUtils.smoothstep(gap,0,4.6);
    if (!curtains.dragging) controls.update(); renderer.render(scene, camera);
  });
  loader.hidden = true;
  canvas.dataset.modelReady = 'true';
}
startRoom().catch(error => {
  console.error('Unable to open the 3D room', error);
  loader.replaceChildren(document.createTextNode('小屋暂时没有加载成功。'));
  const retry = document.createElement('button'); retry.textContent = '重新加载'; retry.type = 'button';
  retry.addEventListener('click', () => location.reload()); loader.append(retry);
});
