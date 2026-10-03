(()=>{"use strict";
window.ClawStorage={
 get(key, fallback){try{const v=localStorage.getItem("clawparty_"+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
 set(key,value){try{localStorage.setItem("clawparty_"+key,JSON.stringify(value))}catch(e){}}
};
window.ClawControls=window.ClawStorage.get("controls",{left:"ArrowLeft",right:"ArrowRight",down:"ArrowDown",grab:"Space"});
})();