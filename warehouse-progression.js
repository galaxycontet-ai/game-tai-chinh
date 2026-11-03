// One active pallet keeps delivery state recoverable without a physics engine.
let warehouseProgress = { rack: false, truck: false, dispatch: false, deliveries: 0, carrying: false };
const WAREHOUSE_UPGRADES = {
    rack: { name: 'Thêm dãy kệ', price: 1500, xp: 60 },
    truck: { name: 'Xe nâng +30% tốc độ', price: 2000, xp: 120 },
    dispatch: { name: 'Mở khu xuất hàng', price: 3000, xp: 200 }
};
let cargoMesh, cargoDestination, expansionRackBuilt = false;
const cargoSource = { x: 0.95, z: 7.8 };

function restoreWarehouseProgress(saved) {
    if (!saved || !['rack', 'truck', 'dispatch', 'carrying'].every(k => typeof saved[k] === 'boolean')
        || !Number.isSafeInteger(saved.deliveries) || saved.deliveries < 0
        || (saved.dispatch && (!saved.rack || !saved.truck))) return;
    warehouseProgress = { rack: saved.rack, truck: saved.truck, dispatch: saved.dispatch,
        deliveries: saved.deliveries, carrying: saved.carrying };
}

function warehouseLevel() {
    return warehouseProgress.dispatch ? 3 : warehouseProgress.rack ? 2 : 1;
}

function cargoTarget() { return learningCargoTarget(); }

function upgradeLearningUnlocked(key) {
    return learning.completed || learning.caseIndex >= (key === 'dispatch' ? 7 : 4);
}

function buyWarehouseUpgrade(key) {
    const upgrade = WAREHOUSE_UPGRADES[key];
    if (!upgrade || warehouseProgress[key]) return;
    if (!upgradeLearningUnlocked(key)) return show3DToast('Hoàn thành mốc học để mở nâng cấp này.');
    if (isPopupOpen || warehouseProgress.carrying) return show3DToast('Hoàn thành thao tác hiện tại trước khi nâng cấp.');
    if (key === 'dispatch' && (!warehouseProgress.rack || !warehouseProgress.truck))
        return show3DToast('Cần mua kệ và nâng cấp xe trước.');
    if (playerXP < upgrade.xp || playerCash < upgrade.price)
        return show3DToast(`Cần ${upgrade.xp} XP và $${upgrade.price.toLocaleString()} để nâng cấp.`);
    playerCash -= upgrade.price;
    warehouseProgress[key] = true;
    syncWarehouseWorld();
    updatePlayerHUD();
    updateWarehouseUI();
    saveProgress();
    show3DToast(`Đã nâng cấp: ${upgrade.name}!`);
}

function updateWarehouseUI() {
    const level = warehouseLevel();
    setElText('warehouse-level', `Cấp ${level}/3 · ${['', 'Kho nhỏ', 'Kho có tổ chức', 'Kho chuyên nghiệp'][level]}`);
    setElText('warehouse-deliveries', `${warehouseProgress.deliveries} pallet hoàn thành · ${playerXP} XP`);
    const step = currentLearningStep();
    setElText('warehouse-mission', learning.completed ? 'Đã hoàn thành lộ trình. Mở các trạm để ôn tập.' : `Ca ${learning.caseIndex}: ${LESSON_NAMES[learning.caseIndex]} · Bước ${learning.step + 1}/${currentLesson().steps.length}`);
    setElText('warehouse-cargo', step?.kind === 'move' ? step.prompt : `Sổ ca hiện có ${lessonLedger().units} loa, trị giá $${lessonLedger().inventory.toFixed(2)}. Chọn Tiếp tục học để xử lý chứng từ.`);
    Object.entries(WAREHOUSE_UPGRADES).forEach(([key, upgrade]) => {
        const button = document.getElementById('upgrade-' + key);
        if (!button) return;
        const bought = warehouseProgress[key];
        const locked = !upgradeLearningUnlocked(key) || (key === 'dispatch' && (!warehouseProgress.rack || !warehouseProgress.truck));
        button.disabled = bought || locked || playerXP < upgrade.xp || playerCash < upgrade.price || warehouseProgress.carrying;
        button.textContent = bought ? `✓ ${upgrade.name}` : `${upgrade.name} · $${upgrade.price.toLocaleString()} · ${upgrade.xp} XP`;
    });
    for (let id = 1; id <= 5; id++) {
        const dock = document.getElementById('dock-btn-' + id);
        if (dock) {
            dock.setAttribute('aria-disabled', String(!stationUnlocked(id)));
            dock.style.opacity = stationUnlocked(id) ? '1' : '0.45';
            dock.title = stationUnlocked(id) ? 'Bài tập ôn luyện' : 'Mở theo tiến trình học';
        }
    }
}

function initWarehouseProgression() {
    const panel = document.createElement('section');
    panel.id = 'warehouse-panel';
    panel.setAttribute('aria-label', 'Tiến trình kho và nhiệm vụ vận chuyển');
    panel.innerHTML = `<strong id="warehouse-level"></strong>
        <p id="warehouse-deliveries"></p><p id="warehouse-mission"></p>
        <button onclick="openLearning()">Tiếp tục học / xem sổ</button>
        <button onclick="openGameHelp()">Hướng dẫn chơi</button><p id="warehouse-cargo"></p>
        <p>WASD / bấm sàn để lái · E hoặc nút bên dưới để nâng/giao hàng.</p>
        <button id="cargo-action" onclick="interactCargo()">Đến gần pallet để nâng hàng</button>
        <details><summary>Nâng cấp kho</summary>
        ${Object.keys(WAREHOUSE_UPGRADES).map(key => `<button id="upgrade-${key}" onclick="buyWarehouseUpgrade('${key}')"></button>`).join('')}
        <small>Ngân sách nâng cấp tách khỏi tiền doanh nghiệp. Kệ/xe mở sau ca 3; khu xuất mở sau ca 6. Không cần mua để tiếp tục học.</small>
        </details>`;
    const style = document.createElement('style');
    style.textContent = `#warehouse-panel{position:fixed;right:12px;top:90px;z-index:21;width:280px;max-height:calc(100dvh - 210px);overflow:auto;background:#f8fafceF;color:#263746;border:2px solid #657787;border-top:5px solid #eebc32;border-radius:12px;padding:12px;font-size:12px;box-shadow:0 8px 24px #0002}#warehouse-panel p{margin:8px 0}#warehouse-panel button{display:block;width:100%;padding:9px;margin:7px 0;background:#263746;color:white;border-radius:7px;text-align:left}#warehouse-panel button:disabled{background:#e2e8f0;color:#64748b;cursor:default}#warehouse-panel button:focus-visible{outline:3px solid #eab308}#warehouse-panel summary{cursor:pointer}#warehouse-panel small{display:block}@media(max-width:700px){#warehouse-panel{top:80px;right:8px;width:225px;max-height:45dvh}}`;
    document.head.appendChild(style);
    document.body.appendChild(panel);
    cargoMesh = new THREE.Group();
    const pallet = new THREE.Mesh(new THREE.BoxGeometry(1, 0.13, 1), new THREE.MeshStandardMaterial({color:0x987044}));
    pallet.position.y = 0.1;
    cargoMesh.add(pallet);
    const carton = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.85), new THREE.MeshStandardMaterial({color:0xc99e67}));
    carton.position.y = 0.49;
    carton.castShadow = true;
    cargoMesh.add(carton);
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.66, 0.86), new THREE.MeshStandardMaterial({color:0xe4ce9d}));
    tape.position.y = 0.49;
    cargoMesh.add(tape);
    cargoDestination = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.05, 32),
        new THREE.MeshBasicMaterial({color:0xf2c94c,side:THREE.DoubleSide}));
    cargoDestination.rotation.x = -Math.PI / 2;
    scene.add(cargoDestination);
    buildWarehouseSign('NHAN PALLET [E]', cargoSource.x, cargoSource.z, 2.5);
    buildWarehouseSign('A01  LUU TRU', 0.95, -6.5, 2.8);
    syncWarehouseWorld();
    updateWarehouseUI();
}

function syncWarehouseWorld() {
    if (!cargoMesh) return;
    if (warehouseProgress.rack && !expansionRackBuilt) {
        buildHighBayRackRow(-2.5, -5.6, 4.4, 'Expansion rack');
        buildWarehouseSign('KE MO RONG', -2.5, -5.6, 3.5);
        expansionRackBuilt = true;
    }
    if (warehouseProgress.carrying) {
        playerGroup.add(cargoMesh);
        cargoMesh.position.set(0, 0.2, 0.8);
    } else {
        scene.add(cargoMesh);
        const source = currentLearningStep()?.kind === 'move' ? learningCargoPoint() : {x:0.95,z:-6.5};
        cargoMesh.position.set(source.x, 0.22, source.z);
    }
    cargoMesh.visible = currentLearningStep()?.kind === 'move' || lessonLedger().units > 0;
    cargoDestination.visible = currentLearningStep()?.kind === 'move';
    const target = cargoTarget();
    cargoDestination.position.set(target.x, 0.24, target.z);
}

function updateCargoHint() {
    if (!cargoMesh || !playerGroup) return;
    const target = warehouseProgress.carrying ? cargoTarget() : learningCargoPoint();
    const near = Math.hypot(playerGroup.position.x - target.x, playerGroup.position.z - target.z) <= 1.2;
    const button = document.getElementById('cargo-action');
    const moveStep = currentLearningStep()?.kind === 'move';
    button.disabled = isPopupOpen || !near || !moveStep;
    const text = !moveStep ? 'Mở bài học để tiếp tục' : warehouseProgress.carrying
        ? near ? 'E · Giao pallet tại ô đích' : `Đang chở hàng → ${cargoTarget().name}`
        : near ? 'E · Nâng pallet' : 'Đến gần pallet ở khu nhận hàng';
    if (button.textContent !== text) button.textContent = text;
}

function interactCargo() {
    if (isPopupOpen || !playerGroup || !cargoMesh || currentLearningStep()?.kind !== 'move') return;
    const target = warehouseProgress.carrying ? cargoTarget() : learningCargoPoint();
    if (Math.hypot(playerGroup.position.x - target.x, playerGroup.position.z - target.z) > 1.2)
        return show3DToast(warehouseProgress.carrying ? 'Hãy đến vòng vàng để giao hàng.' : 'Hãy đến gần pallet ở khu nhận hàng.');
    pendingStationToOpen = null;
    playerTargetPos.copy(playerGroup.position);
    if (warehouseProgress.carrying) {
        warehouseProgress.deliveries++;
        warehouseProgress.carrying = false;
        finishLearningStep();
        openLearning();
        show3DToast('Đã chuyển hàng. Tiếp tục đọc chứng từ và ghi sổ trong bài học.');
    } else {
        warehouseProgress.carrying = true;
        show3DToast(`Đã nâng pallet. Đưa hàng đến ${cargoTarget().name}, nhấn E để giao.`);
    }
    syncWarehouseWorld();
    updatePlayerHUD();
    updateWarehouseUI();
    updateCargoHint();
    saveProgress();
}
