(()=>{
const canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
const W=900,H=650;
let controls=Object.assign({left:"ArrowLeft",right:"ArrowRight",down:"ArrowDown",grab:"Space"},ClawStorage.get("controls",{}));
let state={x:450,y:105,rope:0,phase:"aim",score:0,coins:ClawStorage.get("coins",10),best:ClawStorage.get("best",0),caught:ClawStorage.get("caught",0),sound:true};
let plush=[
 {x:150,y:505,r:38,c:"#ff86b6",e:"🐰",name:"粉兔"},
 {x:250,y:530,r:36,c:"#8dd8ff",e:"🐻",name:"藍熊"},
 {x:360,y:510,r:40,c:"#ffd36e",e:"🐥",name:"小雞"},
 {x:485,y:535,r:36,c:"#c9a2ff",e:"🐱",name:"紫貓"},
 {x:610,y:505,r:39,c:"#8be0b0",e:"🐸",name:"青蛙"},
 {x:735,y:530,r:37,c:"#ff9b76",e:"🦊",name:"狐狸"}
];
let target=null,particles=[],last=performance.now(),audio=null;

function beep(freq=500,dur=.06){
 if(!state.sound)return;
 try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.connect(g);g.connect(audio.destination);g.gain.value=.045;o.start();o.stop(audio.currentTime+dur)}catch(e){}
}
function resize(){const ratio=Math.min(devicePixelRatio||1,2);canvas.width=W*ratio;canvas.height=H*ratio;ctx.setTransform(ratio,0,0,ratio,0,0)}resize();addEventListener("resize",resize);

function drawMachine(){
 const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,"#f7d3e5");grd.addColorStop(1,"#dca7d2");ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
 ctx.fillStyle="#fff8fc";ctx.fillRect(45,55,810,510);
 ctx.fillStyle="#b35b94";ctx.fillRect(45,55,810,20);
 ctx.fillStyle="#eeb7d5";ctx.fillRect(45,75,810,410);
 ctx.fillStyle="#d89fc7";ctx.fillRect(45,485,810,80);
 // glass shine
 ctx.fillStyle="#ffffff38";ctx.fillRect(65,95,18,340);
 ctx.fillStyle="#ffffff20";ctx.fillRect(90,95,7,340);
 // prize pit
 ctx.fillStyle="#8d5c86";ctx.fillRect(70,455,760,95);
 ctx.fillStyle="#6e4a6c";ctx.fillRect(70,535,760,15);
 // plush
 plush.forEach((p,i)=>drawPlush(p,i));
 // top rail
 ctx.fillStyle="#633b67";ctx.fillRect(75,85,750,22);
 ctx.fillStyle="#a26ba4";ctx.fillRect(80,89,740,7);
 // claw
 ctx.strokeStyle="#47334d";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(state.x,100);ctx.lineTo(state.x,100+state.rope);ctx.stroke();
 const cy=100+state.rope;
 ctx.fillStyle="#6a4d70";ctx.beginPath();ctx.arc(state.x,cy,13,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#514057";ctx.lineWidth=8;
 const spread=state.phase==="grab"?12:22;
 ctx.beginPath();ctx.moveTo(state.x-4,cy+7);ctx.lineTo(state.x-spread,cy+28);ctx.lineTo(state.x-spread-3,cy+38);ctx.moveTo(state.x+4,cy+7);ctx.lineTo(state.x+spread,cy+28);ctx.lineTo(state.x+spread+3,cy+38);ctx.stroke();
 // lights
 for(let i=0;i<10;i++){ctx.fillStyle=(Math.floor(Date.now()/300)+i)%2?"#ffd45c":"#fff";ctx.beginPath();ctx.arc(85+i*74,58,5,0,Math.PI*2);ctx.fill()}
 // particles
 particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s);});ctx.globalAlpha=1;
}
function drawPlush(p,i){
 ctx.fillStyle="#00000018";ctx.beginPath();ctx.ellipse(p.x,p.y+30,p.r*.9,9,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
 ctx.font=`${p.r*.8}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(p.e,p.x,p.y+2);
 ctx.font="bold 12px system-ui";ctx.fillStyle="#553d58";ctx.fillText(p.name,p.x,p.y+p.r+16);
}
function key(action){return pressed.has(controls[action])}
const pressed=new Set();
addEventListener("keydown",e=>{pressed.add(e.code);if(["ArrowLeft","ArrowRight","ArrowDown","Space"].includes(e.code))e.preventDefault();});
addEventListener("keyup",e=>pressed.delete(e.code));

document.querySelectorAll(".touch-btn").forEach(b=>{
 const a=b.dataset.action;
 const down=()=>{pressed.add(controls[a]);if(a==="grab")grab()};
 const up=()=>pressed.delete(controls[a]);
 b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);
});

function move(){
 if(state.phase!=="aim")return;
 if(key("left")||GamepadState.left)state.x-=5;
 if(key("right")||GamepadState.right)state.x+=5;
 state.x=Math.max(90,Math.min(810,state.x));
 if(key("down")||GamepadState.down){state.phase="lower";state.rope=0;beep(320,.04)}
}
let prevGrab=false;
function inputGrab(){
 const g=key("grab")||GamepadState.grab;
 if(g&&!prevGrab)grab();
 prevGrab=g;
}
function grab(){
 if(state.phase!=="aim"||state.coins<=0)return;
 state.coins--;state.phase="lower";state.rope=0;target=plush.reduce((a,b)=>Math.abs(b.x-state.x)<Math.abs(a.x-state.x)?b:a);beep(650,.06);
 updateHud();
}
function runClaw(dt){
 if(state.phase==="lower"){
  state.rope+=dt*.34;
  if(state.rope>350){state.rope=350;state.phase="grab";setTimeout(()=>{if(state.phase==="grab"){state.phase="rise";state.rope=350;beep(760,.08)}},180)}
 }else if(state.phase==="rise"){
  state.rope-=dt*.28;
  if(state.rope<=0){state.rope=0;finishGrab()}
 }
}
function finishGrab(){
 const hit=target&&Math.abs(target.x-state.x)<52;
 if(hit&&Math.random()<.62){
   state.score+=100;state.caught++;state.coins+=2;state.best=Math.max(state.best,state.score);
   spawn(target.x,target.y,target.c);beep(950,.13);
   showMessage("🎉","抓到了！",`你抓到「${target.name}」！ +100 分、+2 金幣`);
   plush=plush.filter(p=>p!==target);
   setTimeout(()=>{plush.push({x:90+Math.random()*720,y:500+Math.random()*35,r:35+Math.random()*6,c:["#ff86b6","#8dd8ff","#ffd36e","#c9a2ff","#8be0b0","#ff9b76"][Math.floor(Math.random()*6)],e:["🐰","🐻","🐥","🐱","🐸","🦊"][Math.floor(Math.random()*6)],name:"新娃娃"});},400);
 }else{beep(180,.14);showMessage("😢","差一點！","這次沒有夾穩，再試一次吧。")}
 state.phase="aim";target=null;updateHud();
}
function spawn(x,y,c){for(let i=0;i<28;i++)particles.push({x,y,vx:(Math.random()-.5)*4,vy:(Math.random()-.8)*4,life:1,s:3+Math.random()*4,c})}
function updateHud(){document.getElementById("coins").textContent=state.coins;document.getElementById("score").textContent=state.score;document.getElementById("best").textContent=state.best;document.getElementById("caught").textContent=state.caught;ClawStorage.set("coins",state.coins);ClawStorage.set("best",state.best);ClawStorage.set("caught",state.caught)}
function showMessage(e,t,x){document.getElementById("messageEmoji").textContent=e;document.getElementById("messageTitle").textContent=t;document.getElementById("messageText").textContent=x;document.getElementById("message").classList.remove("hidden")}
document.getElementById("continueBtn").onclick=()=>document.getElementById("message").classList.add("hidden");
document.getElementById("soundBtn").onclick=()=>{state.sound=!state.sound;document.getElementById("soundBtn").textContent=state.sound?"🔊 音效":"🔇 靜音";};
document.getElementById("fullscreenBtn").onclick=()=>{const el=document.querySelector(".game-wrap");if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.()};

function loop(now){const dt=Math.min(now-last,40);last=now;move();inputGrab();runClaw(dt);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.025});particles=particles.filter(p=>p.life>0);drawMachine();requestAnimationFrame(loop)}
updateHud();requestAnimationFrame(loop);
})();