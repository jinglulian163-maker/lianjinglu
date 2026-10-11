const roomSection = document.getElementById('roomSection');
const heroCopy = document.getElementById('heroCopy');
const modalShell = document.getElementById('modalShell');
const panelTitle = document.getElementById('panelTitle');
const panelIntro = document.getElementById('panelIntro');
const panelNumber = document.getElementById('panelNumber');
const panelBody = document.getElementById('panelBody');
let currentPanel = null;
let lastTrigger = null;
let localAudioUrl = null;
let photoUrls = [];

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function updateScroll() {
  const travel = Math.max(1, roomSection.offsetHeight - window.innerHeight);
  const progress = clamp(window.scrollY / travel, 0, 1);
  const exit = clamp(progress * 1.8, 0, 1);
  heroCopy.style.transform = `translate(-50%, ${-175 * exit}px)`;
  heroCopy.style.opacity = String(1 - exit);
}
window.addEventListener('scroll', updateScroll, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();

let isNight = false;
try { isNight = localStorage.getItem('soft-hours-night') === 'true'; } catch (_) {}
function applyNight() {
  document.body.classList.toggle('is-night', isNight);
  document.getElementById('timeLabel').textContent = isNight ? 'AFTER DARK' : 'GOLDEN HOUR';
}
applyNight();
window.addEventListener('soft-hours:lamp', () => {
  isNight = !isNight;
  applyNight();
  try { localStorage.setItem('soft-hours-night', String(isNight)); } catch (_) {}
});
document.getElementById('resetView').addEventListener('click', () => {
  window.dispatchEvent(new Event('soft-hours:reset-view'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const panels = {
  wardrobe: { number: '01 / THE WARDROBE', title: '照片衣柜', intro: '拉开柜门，那些舍不得删掉的瞬间都在这里。' },
  record: { number: '02 / THE RECORD PLAYER', title: '唱片机', intro: '一首歌，一段声音，就能把那一天带回来。' },
  board: { number: '03 / THE MEMORY BOARD', title: '回忆公告板', intro: '有些日子值得被钉在墙上，偶尔抬头再看一眼。' }
};
function renderWardrobe() {
  panelBody.innerHTML = `<p class="modal-section-title">THE PHOTO DRAWER</p><div class="photo-grid" id="photoGrid"><div class="photo-slot"><span class="photo-slot__placeholder">✳<small>等待第一张照片</small></span></div><div class="photo-slot"><span class="photo-slot__placeholder">✳<small>和下一段回忆</small></span></div></div><label class="upload-label">试着放入照片 <span aria-hidden="true">↗</span><input type="file" id="photoInput" accept="image/*" multiple /></label><p class="small-note">原型预览：选择的照片仅在当前页面展示，不会上传或保存。</p>`;
  document.getElementById('photoInput').addEventListener('change', event => {
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
  panelBody.innerHTML = `<div class="record-art" id="recordArt" aria-hidden="true"><div class="record-disc"></div><div class="record-tonearm"></div></div><p class="modal-section-title">SOUNDS WE KEPT</p><div class="empty-state" id="audioEmpty">这里还没有放入录音。你可以先选择一段音频，试试唱片机的播放效果。</div><div class="record-controls"><audio id="audioPlayer" controls hidden></audio></div><label class="upload-label">选择一段录音 <span aria-hidden="true">♪</span><input type="file" id="audioInput" accept="audio/*" /></label><p class="small-note" id="audioFileNote">原型预览：音频仅在当前页面播放，不会上传或保存。</p>`;
  const player = document.getElementById('audioPlayer');
  player.addEventListener('play', () => document.getElementById('recordArt')?.classList.add('is-playing'));
  player.addEventListener('pause', () => document.getElementById('recordArt')?.classList.remove('is-playing'));
  document.getElementById('audioInput').addEventListener('change', event => {
    const file = event.target.files[0]; if (!file || !file.type.startsWith('audio/')) return;
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
function openPanel(name) {
  const data = panels[name]; if (!data) return;
  currentPanel = name;
  lastTrigger = document.activeElement;
  panelNumber.textContent = data.number; panelTitle.textContent = data.title; panelIntro.textContent = data.intro;
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'record') renderRecord();
  if (name === 'board') renderBoard();
  modalShell.hidden = false; document.body.style.overflow = 'hidden';
  document.getElementById('closePanel').focus();
}
function closePanel() {
  if (!currentPanel) return;
  document.getElementById('audioPlayer')?.pause();
  if (localAudioUrl) { URL.revokeObjectURL(localAudioUrl); localAudioUrl = null; }
  photoUrls.forEach(URL.revokeObjectURL); photoUrls = [];
  modalShell.hidden = true; panelBody.replaceChildren(); document.body.style.overflow = '';
  currentPanel = null; if (lastTrigger?.focus) lastTrigger.focus();
}
window.addEventListener('soft-hours:open', event => openPanel(event.detail));
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.action === 'lamp') window.dispatchEvent(new Event('soft-hours:lamp'));
  else openPanel(button.dataset.action);
}));
document.getElementById('closePanel').addEventListener('click', closePanel);
modalShell.addEventListener('click', event => { if (event.target.matches('[data-close]')) closePanel(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
