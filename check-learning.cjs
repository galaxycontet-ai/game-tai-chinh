const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('merchant_accounting_tycoon_3d.html','utf8');
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const state = inline.slice(inline.indexOf('        let playerCash'),inline.indexOf('        function setElText'));
let saved;
const elements = new Map();
function element() { return {textContent:'',innerHTML:'',style:{},open:false,
    setAttribute(){},querySelector(){return null;},showModal(){this.open=true;},close(){this.open=false;}}; }
for(const id of ['warehouse-level','warehouse-deliveries','warehouse-mission','warehouse-cargo','cargo-action','learning-dialog','learning-feedback']) elements.set(id,element());
for(let i=1;i<=5;i++) elements.set('dock-btn-'+i,element());
for(const key of ['rack','truck','dispatch']) elements.set('upgrade-'+key,element());
const ctx = vm.createContext({
    document:{getElementById:id=>elements.get(id)||null},
    localStorage:{getItem:()=>saved,setItem:(k,v)=>{saved=v;}},
    show3DToast(){},setElText(id,text){const el=elements.get(id);if(el)el.textContent=text;},
    updatePlayerHUD(){},spawn3DCelebrationParticles(){},closeStationPopup(){},
    playerGroup:{position:{x:0,z:0},add(){}},playerTargetPos:{copy(){}},moveKeys:{},pendingStationToOpen:null,
    scene:{add(){}},buildHighBayRackRow(){},buildWarehouseSign(){}
});
vm.runInContext(fs.readFileSync('warehouse-progression.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('learning-game.js','utf8'),ctx);
vm.runInContext(state,ctx);
vm.runInContext(`cargoMesh={visible:false,position:{set(){}}}; cargoDestination={position:{set(){}}};`,ctx);
const run=code=>vm.runInContext(code,ctx);
const eq=(code,expected)=>assert.equal(run(code),expected,code);
const near=(code,expected)=>assert(Math.abs(run(code)-expected)<1e-7,code);
const reset=()=>run('learning={version:1,caseIndex:0,round:0,step:0,assisted:false,variant:0,completed:false}; warehouseProgress={rack:false,truck:false,dispatch:false,deliveries:0,carrying:false}; playerCash=1000;playerXP=0;isPopupOpen=false;');
reset();
// Known accounting examples are checked independently of the step answer loop.
assert.deepEqual(Array.from(run('buildLesson(6,0).steps.filter(s=>s.kind === "number").map(s=>s.answer)')),[128,12,144,15,256]);
assert.deepEqual(Array.from(run('buildLesson(7,0).steps.filter(s=>s.kind === "number").map(s=>s.answer)')),[23,23,230,70]);
run('learning.caseIndex=3; learning.step=currentLesson().steps.length;');
near('lessonLedger().cash',960);near('lessonLedger().inventory',60);
near('lessonLedger().revenue-lessonLedger().cogs',20);eq('lessonLedger().units',6);
run('learning.caseIndex=4;learning.step=currentLesson().steps.length;');
near('lessonLedger().cash',936.3);near('lessonLedger().inventory',68.6);
near('lessonLedger().receivable',0);near('lessonLedger().payable',0);eq('lessonLedger().units',7);
// Invalid answers, help and independent retries must not award a level.
reset();run("answerLearning(''); answerLearning('NaN')");eq('learning.step',0);
run('learning.round=2; answerLearning(-1);');eq('learning.assisted',true);eq('learning.step',0);
run('learning.step=currentLesson().steps.length;nextLearningRound()');eq('learning.caseIndex',0);eq('learning.round',2);eq('learning.variant',1);eq('playerCash',1000);
run('hintLearning()');eq('learning.assisted',true);
// Picking up, saving while carrying, resuming, and delivering must advance once.
reset();run('learning.step=2;syncWarehouseWorld();');
run('playerGroup.position.x=8;playerGroup.position.z=0;interactCargo()');eq('warehouseProgress.carrying',false);
run('playerGroup.position.x=0.95;playerGroup.position.z=7.8;interactCargo()');eq('warehouseProgress.carrying',true);
run('saveProgress();warehouseProgress.carrying=false;learning.step=0;restoreProgress()');eq('warehouseProgress.carrying',true);eq('learning.step',2);
run('interactCargo()');eq('warehouseProgress.deliveries',0);
run('playerGroup.position.z=-6.5;interactCargo()');eq('learning.step',3);eq('warehouseProgress.deliveries',1);eq('playerCash',1000);
run('interactCargo()');eq('warehouseProgress.deliveries',1);
// Legacy saves keep owned upgrades without inventing learning mastery.
reset();run('restoreWarehouseProgress({rack:true,truck:true,dispatch:true,deliveries:6,carrying:false})');eq('warehouseLevel()',3);eq('learning.caseIndex',0);
run('restoreLearning({version:1,caseIndex:90,round:0,step:0,variant:0,assisted:false,completed:false})');eq('learning.caseIndex',0);
// Complete all 9 cases and 4 rounds, exercising real render/update/save paths.
reset();let steps=0;
while(!run('learning.completed')) {
    assert(steps++<500,'Learning progression stalled');
    run('renderLearning();updateWarehouseUI();');
    const kind=run('currentLearningStep()?.kind');
    if(!kind) {run('nextLearningRound()');continue;}
    if(kind==='move') {
        run('{closeLearning();const source=learningCargoPoint();playerGroup.position.x=source.x;playerGroup.position.z=source.z;interactCargo();}');
        eq('warehouseProgress.carrying',true);
        run('{const destination=cargoTarget();playerGroup.position.x=destination.x;playerGroup.position.z=destination.z;interactCargo();}');
    } else run('answerLearning(currentLearningStep().answer)');
    // Every journal effect obeys the accounting equation and nonnegative stock.
    const b=run('lessonLedger()');
    assert(b.units>=0 && b.inventory>=-1e-7,'Negative inventory');
    near('lessonLedger().cash+lessonLedger().inventory+lessonLedger().receivable-lessonLedger().payable',
        run('currentLesson().initial+lessonLedger().revenue-lessonLedger().cogs-lessonLedger().expenses'));
    // Restore at every step, including between rounds.
    run('saveProgress();restoreProgress();');
}
eq('playerCash',19000);eq('playerXP',900);
run('nextLearningRound();nextLearningRound()');eq('playerCash',19000);
run("closeLearning();buyWarehouseUpgrade('rack');buyWarehouseUpgrade('truck');buyWarehouseUpgrade('dispatch')");eq('warehouseLevel()',3);eq('playerCash',12500);
run("buyWarehouseUpgrade('dispatch')");eq('playerCash',12500);
run('renderLearning()');assert(elements.get('learning-dialog').innerHTML.includes('Hoàn thành chương trình'));
// All round datasets render, including hard questions with fractional currency.
for(let lesson=0;lesson<9;lesson++) for(let variant=0;variant<4;variant++) {
    run(`learning={version:1,caseIndex:${lesson},round:${variant},step:0,assisted:false,variant:${variant},completed:false}`);
    const length=run('currentLesson().steps.length');
    for(let step=0;step<=length;step++) run(`learning.step=${step};renderLearning();updateWarehouseUI();`);
}
reset();run("buyWarehouseUpgrade('rack')");eq('warehouseProgress.rack',false);
console.log(`PASS: ${steps} progression actions; accounting examples, journal balance, all 9 cases × 4 rounds, render branches, cargo, save/resume, mastery gates and one-time rewards`);
