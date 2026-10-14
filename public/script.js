import { mountPhotos, unmountPhotos } from './photos.js';
import { mountBoard, unmountBoard } from './board.js';
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

// The title stays fixed. Wheel input belongs to the three-dimensional room.

let isNight = false;
try { isNight = localStorage.getItem('soft-hours-night') === 'true'; } catch (_) {}
function applyNight() {
  document.body.classList.toggle('is-night', isNight);
  document.getElementById('timeLabel').textContent = isNight ? 'AFTER DARK' : 'GOLDEN HOUR';
  window.dispatchEvent(new CustomEvent('soft-hours:night', { detail: isNight }));
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
function renderWardrobe() { mountPhotos(panelBody); }
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
function renderBoard() { mountBoard(panelBody); }
function openPanel(name) {
  const data = panels[name]; if (!data) return;
  unmountBoard(); unmountPhotos();
  currentPanel = name;
  modalShell.classList.toggle('is-board', name === 'board');
  lastTrigger = document.activeElement;
  panelNumber.textContent = data.number; panelTitle.textContent = data.title; panelIntro.textContent = data.intro;
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'record') renderRecord();
  if (name === 'board') renderBoard();
  modalShell.hidden = false; document.body.style.overflow = 'hidden';
  modalShell.querySelector('.memory-panel__scroll').scrollTop = 0;
  document.querySelector('main').inert = true;
  document.getElementById('closePanel').focus();
}
function closePanel() {
  if (!currentPanel) return;
  unmountBoard(); unmountPhotos();
  document.getElementById('audioPlayer')?.pause();
  if (localAudioUrl) { URL.revokeObjectURL(localAudioUrl); localAudioUrl = null; }
  photoUrls.forEach(URL.revokeObjectURL); photoUrls = [];
  modalShell.hidden = true; panelBody.replaceChildren(); document.body.style.overflow = '';
  document.querySelector('main').inert = false;
  currentPanel = null; if (lastTrigger?.focus) lastTrigger.focus();
}
window.addEventListener('soft-hours:open', event => openPanel(event.detail));
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.action === 'lamp') window.dispatchEvent(new Event('soft-hours:lamp'));
  else openPanel(button.dataset.action);
}));
document.getElementById('closePanel').addEventListener('click', closePanel);
modalShell.addEventListener('click', event => { if (event.target.matches('[data-close]')) closePanel(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closePanel();
  if (event.key !== 'Tab' || !currentPanel) return;
  const items = [...modalShell.querySelectorAll('button, input, textarea, a[href], audio[controls], [tabindex="0"]')].filter(el => !el.hidden && !el.disabled && el.getClientRects().length);
  const first = items[0], last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
