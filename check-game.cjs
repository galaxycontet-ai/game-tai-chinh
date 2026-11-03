const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('merchant_accounting_tycoon_3d.html', 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
new vm.Script(script);
const state = script.slice(script.indexOf('        let playerCash'), script.indexOf('        function setElText'));
let saved = null;
const context = vm.createContext({ localStorage: { getItem: () => saved, setItem: (k,v) => { saved = v; } }, show3DToast() {} });
vm.runInContext(fs.readFileSync('warehouse-progression.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('learning-game.js', 'utf8'), context);
vm.runInContext(state, context);
vm.runInContext('playerCash = 13000; playerXP = 35; totalAttempts = 2; correctAttempts = 1; questProgress[2] = 1; saveProgress(); playerCash = 0; restoreProgress();', context);
assert.equal(vm.runInContext('playerCash', context), 13000);
assert.equal(vm.runInContext('questProgress[2]', context), 1);
saved = '{bad json';
assert.doesNotThrow(() => vm.runInContext('restoreProgress()', context));
saved = JSON.stringify({playerCash: -10, playerXP: 0, totalAttempts: 0, correctAttempts: 0, questProgress: {1:0,2:0,3:0,4:0,5:0}});
vm.runInContext('restoreProgress()', context);
assert.equal(vm.runInContext('playerCash', context), 13000);
saved = JSON.stringify({playerCash: 10, playerXP: 0, totalAttempts: 0, correctAttempts: 1, questProgress: {1:0,2:0,3:0,4:0,5:0}});
vm.runInContext('restoreProgress()', context);
assert.equal(vm.runInContext('playerCash', context), 13000);
console.log('PASS: JavaScript syntax, save round-trip, corrupt and invalid save rejection');

// Build the real map with lightweight rendering stubs, then check forklift routes.
class Shape {
    constructor() { this.position = {set() {}}; this.rotation = {}; this.scale = {set() {}}; }
    add() {}
}
const mapContext = vm.createContext({
    THREE: new Proxy({}, {get: () => Shape}),
    document: {createElement: () => ({getContext: () => ({fillRect() {}, fillText() {}})})},
    scene: {add() {}},
    colliderBoxes: [], colliderHelperMeshes: [],
    addColliderBox(minX,maxX,minZ,maxZ,label) { mapContext.colliderBoxes.push({minX,maxX,minZ,maxZ,label}); }
});
vm.runInContext(script.slice(script.indexOf('        function buildIndustrialWarehouseMatchingPhoto'), script.indexOf('        function buildStandUpReachTruckPlayer')), mapContext);
vm.runInContext(script.slice(script.indexOf('        function checkCircleAABBCollision'), script.indexOf('        function triggerCollisionBump')), mapContext);
vm.runInContext('buildIndustrialWarehouseMatchingPhoto()', mapContext);
function checkRoutes() {
    const blocked = (x,z) => mapContext.checkCircleAABBCollision(x,z,0.65);
    const start = [0.5,4];
    const queue = [start], reached = new Set([start.join(',')]);
    for (let head=0; head<queue.length; head++) {
        const [x,z] = queue[head];
        for (const [dx,dz] of [[0.25,0],[-0.25,0],[0,0.25],[0,-0.25]]) {
            const nx=x+dx,nz=z+dz,key=[nx,nz].join(',');
            if (!reached.has(key) && !blocked(nx,nz)) {reached.add(key);queue.push([nx,nz]);}
        }
    }
    const goals = [[0.95,7.8],[0.95,-6.5],[4.2,7.8],[-3.6,0],[-3.6,3.8],[-3.6,7],[-3.6,-2.2],[3.6,-5.6]];
    for (const [x,z] of goals) {
        assert.equal(blocked(x,z),false,`Destination blocked: ${x},${z}`);
        assert(queue.some(([qx,qz])=>Math.hypot(x-qx,z-qz)<0.3),`No route to ${x},${z}`);
    }
    for(let z=-7;z<=8;z+=0.25) assert(!blocked(0.95,z),'Central aisle blocked');
}
checkRoutes();
vm.runInContext("buildHighBayRackRow(-2.5,-5.6,4.4,'Expansion rack')",mapContext);
checkRoutes();
console.log('PASS: map destinations and central aisle reachable before and after rack upgrade');
