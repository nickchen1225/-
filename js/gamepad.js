(()=>{
window.GamepadState={left:false,right:false,down:false,grab:false};
let previous=false;
function poll(){
 const pads=navigator.getGamepads?navigator.getGamepads():[];
 const p=[...pads].find(Boolean);
 if(p){
  const x=p.axes[0]||0;
  GamepadState.left=x<-.35;GamepadState.right=x>.35;
  GamepadState.down=(p.axes[1]||0)>.45;
  const a=!!(p.buttons[0]&&p.buttons[0].pressed);
  GamepadState.grab=a&&!previous;previous=a;
 }else{GamepadState.left=GamepadState.right=GamepadState.down=false;GamepadState.grab=false;previous=false}
 requestAnimationFrame(poll);
}
poll();
})();