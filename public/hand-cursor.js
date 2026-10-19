const clear=()=>document.body.classList.remove('hand-down','hand-drag');
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;document.body.classList.add(e.target.id==='roomCanvas'?'hand-drag':'hand-down');},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,clear,true);
window.addEventListener('blur',clear);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
