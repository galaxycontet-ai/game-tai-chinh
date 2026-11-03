const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('merchant_accounting_tycoon_3d.html','utf8');
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.style={};this.dataset={};this.open=false;this.value='';this.classList={add(){},remove(){},toggle(){}};this.events={};}
 set innerHTML(text){this.markup=text;for(const match of text.matchAll(/id="([^"]+)"/g)) if(!nodes.has(match[1])) nodes.set(match[1],new Element());}
 get innerHTML(){return this.markup||'';}
 setAttribute(){} appendChild(el){if(el.id)nodes.set(el.id,el);return el;}
 addEventListener(type,fn){this.events[type]=fn;}
 querySelector(selector){return selector==='form' && this.innerHTML.includes('<form') ? new Element('form') : null;}
 showModal(){this.open=true;} close(){this.open=false;}
 getContext(){return {fillRect(){},fillText(){}};}
 getBoundingClientRect(){return {left:0,top:0,width:1280,height:800};}
}
const nodes=new Map();for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],new Element());
class Vec {
 constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 copy(v){return this.set(v.x,v.y,v.z);}clone(){return new Vec(this.x,this.y,this.z);}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
 setScalar(s){return this.set(s,s,s);}project(){return this.set(0,0,0);}
}
class Object3D {
 constructor(){this.position=new Vec();this.rotation=new Vec();this.scale=new Vec(1,1,1);this.children=[];this.userData={};this.shadow={mapSize:{},camera:{}};this.shadowMap={};this.domElement=new Element('canvas');}
 add(child){this.children.push(child);}remove(child){this.children=this.children.filter(c=>c!==child);}lookAt(){} updateProjectionMatrix(){}setSize(){}setPixelRatio(){}render(){}setFromCamera(){}intersectObject(){return [];}
}
const ctx=vm.createContext({
 document:{body:new Element('body'),head:new Element('head'),activeElement:null,getElementById:id=>nodes.get(id)||null,createElement:tag=>new Element(tag),addEventListener(){}},
 THREE:new Proxy({Vector2:Vec,Vector3:Vec},{get:(obj,key)=>obj[key]||Object3D}),
 window:{innerWidth:1280,innerHeight:800,devicePixelRatio:1,addEventListener(){}},
 performance:{now:()=>1000},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},
 localStorage:{getItem:()=>null,setItem(){}},console
});
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())vm.runInContext(match[1],ctx);
for(const file of ['warehouse-progression.js','learning-game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
vm.runInContext('window.onload()',ctx);
assert(nodes.get('learning-dialog').open,'First lesson should open on startup');
assert(nodes.get('learning-dialog').innerHTML.includes('Làm quen với hàng hóa'));
assert(nodes.get('warehouse-panel'));
assert(vm.runInContext('isPopupOpen',ctx),'Movement paused during lesson');
vm.runInContext('closeLearning();animateIsoLoop()',ctx);
assert(!nodes.get('learning-dialog').open);
assert.equal(vm.runInContext('isPopupOpen',ctx),false);
vm.runInContext('openStationPopup(5)',ctx);
assert.equal(vm.runInContext('isPopupOpen',ctx),false,'Locked station must stay closed');
vm.runInContext('openLearning()',ctx);
assert(nodes.get('learning-dialog').open);
const learningBeforeHelp=vm.runInContext('JSON.stringify(learning)',ctx);
vm.runInContext('openGameHelp()',ctx);
assert(nodes.get('learning-dialog').open);
assert(nodes.get('learning-dialog').innerHTML.includes('Chuyển một pallet như thế nào?'));
assert.equal(vm.runInContext('isPopupOpen',ctx),true,'Help pauses movement');
vm.runInContext('openLearning()',ctx);
assert(nodes.get('learning-dialog').innerHTML.includes('Làm quen với hàng hóa'));
assert.equal(vm.runInContext('JSON.stringify(learning)',ctx),learningBeforeHelp,'Help must preserve lesson progress');
vm.runInContext('closeLearning();openGameHelp();closeLearning()',ctx);
assert.equal(nodes.get('learning-dialog').open,false);
assert.equal(vm.runInContext('isPopupOpen',ctx),false);
console.log('PASS: full script startup, world construction, first lesson, close/reopen, animation frame and station lock (DOM/WebGL stubs)');
console.log('PASS: help from lesson/map, pause/resume and preserved learning progress');
