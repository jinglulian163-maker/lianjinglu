const roomSection = document.getElementById('roomSection');
const roomStage = document.getElementById('roomStage');
const heroCopy = document.getElementById('heroCopy');
const sceneNote = document.getElementById('sceneNote');
const scrollCue = document.getElementById('scrollCue');
const modalShell = document.getElementById('modalShell');
const panelTitle = document.getElementById('panelTitle');
const panelIntro = document.getElementById('panelIntro');
const panelNumber = document.getElementById('panelNumber');
const panelBody = document.getElementById('panelBody');
const recordArtClass = 'record-art';
let currentPanel = null;
let lastTrigger = null;
let localAudioUrl = null;
let photoUrls = [];

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function updateScroll() {
  const distance = Math.max(1, roomSection.offsetHeight - window.innerHeight);
  const progress = clamp(window.scrollY / distance, 0, 1);
  const titleProgress = clamp(progress * 2.2, 0, 1);
  heroCopy.style.transform = `translate(-50%, ${-200 * titleProgress}px)`;
  heroCopy.style.opacity = String(1 - titleProgress);
  const roomScale = 1 + .065 * clamp(progress * 1.8, 0, 1);
  document.getElementById('roomWrap').style.transform = `translateX(-50%) scale(${roomScale})`;
  sceneNote.style.opacity = progress > .22 ? '1' : '.65';
  scrollCue.style.opacity = String(1 - clamp(progress * 3, 0, 1));
}
window.addEventListener('scroll', updateScroll, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();

// The current scene is a painted concept image. Dragging gives it restrained
// spatial movement; a later 3D model can replace this stage without changing
// the content panels or visual flow.
let drag = null;
let offsetX = 0;
let offsetY = 0;
let suppressClickUntil = 0;
function renderDrag() {
  roomStage.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotateY(${offsetX * .045}deg) rotateX(${-offsetY * .045}deg)`;
}
roomStage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  if (event.target.closest('button')) return;
  drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, baseX: offsetX, baseY: offsetY, moved: false };
  roomStage.setPointerCapture(event.pointerId);
  roomStage.classList.add('is-dragging');
});
roomStage.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (Math.hypot(dx, dy) > 6) drag.moved = true;
  if (!drag.moved) return;
  offsetX = clamp(drag.baseX + dx * .26, -75, 75);
  offsetY = clamp(drag.baseY + dy * .22, -43, 43);
  renderDrag();
});
function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  if (drag.moved) suppressClickUntil = performance.now() + 230;
  drag = null;
  roomStage.classList.remove('is-dragging');
}
roomStage.addEventListener('pointerup', endDrag);
roomStage.addEventListener('pointercancel', endDrag);
document.getElementById('resetView').addEventListener('click', () => { offsetX = 0; offsetY = 0; renderDrag(); roomSection.scrollIntoView({ behavior: 'smooth' }); });
document.getElementById('backToRoom').addEventListener('click', () => { roomSection.scrollIntoView({ behavior: 'smooth' }); });

let isNight = false;
try { isNight = localStorage.getItem('soft-hours-night') === 'true'; } catch (_) {}
function applyNight() {
  document.body.classList.toggle('is-night', isNight);
  document.getElementById('timeLabel').textContent = isNight ? 'AFTER DARK' : 'GOLDEN HOUR';
  document.getElementById('lampButton').setAttribute('aria-label', isNight ? '打开白天模式' : '打开夜晚模式');
}
applyNight();
document.getElementById('lampButton').addEventListener('click', () => {
  if (performance.now() < suppressClickUntil) return;
  isNight = !isNight; applyNight();
  try { localStorage.setItem('soft-hours-night', String(isNight)); } catch (_) {}
});

const panels = {
  wardrobe: { number: '01 / THE WARDROBE', title: '照片衣柜', intro: '拉开柜门，那些舍不得删掉的瞬间都在这里。' },
  record: { number: '02 / THE RECORD PLAYER', title: '唱片机', intro: '一首歌，一段声音，就能把那一天带回来。' },
  board: { number: '03 / THE MEMORY BOARD', title: '回忆公告板', intro: '有些日子值得被钉在墙上，偶尔抬头再看一眼。' }
};

function renderWardrobe() {
  panelBody.innerHTML = `<p class="modal-section-title">THE PHOTO DRAWER</p><div class="photo-grid" id="photoGrid"><div class="photo-slot"><span class="photo-slot__placeholder">✳<small>等待第一张照片</small></span></div><div class="photo-slot"><span class="photo-slot__placeholder">✳<small>和下一段回忆</small></span></div></div><label class="upload-label">试着放入照片 <span aria-hidden="true">↗</span><input type="file" id="photoInput" accept="image/*" multiple /></label><p class="small-note">原型预览：选择的照片仅在当前页面展示，不会上传或保存。</p>`;
  document.getElementById('photoInput').addEventListener('change', (event) => {
    photoUrls.forEach(URL.revokeObjectURL); photoUrls = [];
    const grid = document.getElementById('photoGrid');
    const files = [...event.target.files].filter(file => file.type.startsWith('image/')).slice(0, 12);
    if (!files.length) return;
    grid.replaceChildren();
    files.forEach(file => {
      const url = URL.createObjectURL(file); photoUrls.push(url);
      const frame = document.createElement('div'); frame.className = 'photo-slot';
      const image = document.createElement('img'); image.src = url; image.alt = file.name;
      frame.append(image); grid.append(frame);
    });
  });
}
function renderRecord() {
  panelBody.innerHTML = `<div class="${recordArtClass}" id="recordArt" aria-hidden="true"><div class="record-disc"></div><div class="record-tonearm"></div></div><p class="modal-section-title">SOUNDS WE KEPT</p><div class="empty-state" id="audioEmpty">这里还没有放入录音。你可以先选择一段音频，试试唱片机的播放效果。</div><div class="record-controls"><audio id="audioPlayer" controls hidden></audio></div><label class="upload-label">选择一段录音 <span aria-hidden="true">♪</span><input type="file" id="audioInput" accept="audio/*" /></label><p class="small-note" id="audioFileNote">原型预览：音频仅在当前页面播放，不会上传或保存。</p>`;
  const player = document.getElementById('audioPlayer');
  player.addEventListener('play', () => document.getElementById('recordArt')?.classList.add('is-playing'));
  player.addEventListener('pause', () => document.getElementById('recordArt')?.classList.remove('is-playing'));
  document.getElementById('audioInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('audio/')) return;
    if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
    localAudioUrl = URL.createObjectURL(file);
    player.src = localAudioUrl; player.hidden = false;
    document.getElementById('audioEmpty').hidden = true;
    document.getElementById('audioFileNote').textContent = `已选择：${file.name} · 仅在当前页面播放，不会上传或保存。`;
    player.play().catch(() => {});
  });
}
function renderBoard() {
  panelBody.innerHTML = `<p class="modal-section-title">NOTES TO OUR FUTURE SELVES</p><div class="board-note"><strong>留一张便签给未来的我们</strong><p>这里会慢慢贴上值得记住的日期、车票、聊天摘录和那些讲不完的小故事。</p></div><div class="board-list"><div>我们的第一张便签 <span>待填写</span></div><div>一段难忘的旅程 <span>待填写</span></div><div>下一次见面的约定 <span>待填写</span></div></div><p class="small-note">这是回忆公告板的展示原型。真实故事可以在下一阶段加入。</p>`;
}
function openPanel(name, trigger) {
  if (performance.now() < suppressClickUntil) return;
  const data = panels[name]; if (!data) return;
  lastTrigger = trigger; currentPanel = name;
  panelNumber.textContent = data.number; panelTitle.textContent = data.title; panelIntro.textContent = data.intro;
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'record') renderRecord();
  if (name === 'board') renderBoard();
  modalShell.hidden = false; document.body.style.overflow = 'hidden';
  document.getElementById('closePanel').focus();
}
function closePanel() {
  if (!currentPanel) return;
  const player = document.getElementById('audioPlayer'); if (player) player.pause();
  if (localAudioUrl) { URL.revokeObjectURL(localAudioUrl); localAudioUrl = null; }
  photoUrls.forEach(URL.revokeObjectURL); photoUrls = [];
  modalShell.hidden = true; panelBody.replaceChildren(); document.body.style.overflow = '';
  currentPanel = null; lastTrigger?.focus();
}
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.open, button)));
document.getElementById('closePanel').addEventListener('click', closePanel);
modalShell.addEventListener('click', event => { if (event.target.matches('[data-close]')) closePanel(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
