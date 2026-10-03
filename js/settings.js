(()=>{
const defaults={left:"ArrowLeft",right:"ArrowRight",down:"ArrowDown",grab:"Space"};
let controls=Object.assign({},defaults,ClawStorage.get("controls",defaults));
const labels={ArrowLeft:"← 左",ArrowRight:"→ 右",ArrowDown:"↓ 下",Space:"Space"};
let waiting=null;
function pretty(k){return labels[k]||k.replace("Key","").replace("Arrow","");}
document.querySelectorAll(".key-btn").forEach(btn=>{
 const action=btn.dataset.bind;btn.textContent=pretty(controls[action]);
 btn.addEventListener("click",()=>{if(waiting)waiting.classList.remove("listening");waiting=btn;btn.classList.add("listening");btn.textContent="請按鍵…";});
});
window.addEventListener("keydown",e=>{
 if(!waiting)return;
 e.preventDefault();
 const action=waiting.dataset.bind;
 controls[action]=e.code;
 waiting.textContent=pretty(e.code);waiting.classList.remove("listening");waiting=null;
});
document.getElementById("saveBtn").onclick=()=>{ClawStorage.set("controls",controls);alert("設定已儲存！");};
document.getElementById("resetBtn").onclick=()=>{controls=Object.assign({},defaults);ClawStorage.set("controls",controls);location.reload();};
function pads(){const p=navigator.getGamepads?navigator.getGamepads():[];return [...p].filter(Boolean)}
function update(){const p=pads();document.getElementById("gamepadStatus").textContent=p.length?`已偵測：${p[0].id}`:"尚未偵測到手把。請按一下 Xbox／USB 手把的按鍵。";requestAnimationFrame(update)}
window.addEventListener("gamepadconnected",update);update();
})();