// Learning state stores decisions, not a second mutable accounting ledger.
const LESSON_NAMES = ['Làm quen với hàng hóa', 'Mua hàng: tiền mặt và mua chịu',
    'Bán hàng: doanh thu và giá vốn', 'Chốt ca: tiền khác lợi nhuận',
    'Trả lại, chiết khấu và vận chuyển', 'Kiểm kê: hàng thuộc về ai?',
    'FIFO và bình quân di động', 'Hàng giảm giá trị: LCNRV', 'Ca tổng hợp'];
let learning = { version: 1, caseIndex: 0, round: 0, step: 0, assisted: false, variant: 0, completed: false };
let lessonDialogOpen = false;
let showingGameHelp = false;

function buildLesson(index, variant) {
    const n = 10 + variant * 2, cost = 10 + variant * 2, sold = 4 + variant, price = cost + 5;
    const purchase = n * cost, initial = Math.max(1000,purchase*2), sales = sold * price, cogs = sold * cost;
    const q = (prompt, answer, why, effect = {}, entry = '') => ({ kind: 'number', prompt, answer, why, effect, entry });
    const choose = (prompt, options, answer, why, effect = {}, entry = '') => ({ kind: 'choice', prompt, options, answer, why, effect, entry });
    const move = (prompt, direction) => ({ kind: 'move', prompt, direction,
        why: 'Di chuyển nội bộ không làm thay đổi quyền sở hữu, doanh thu hay giá vốn.', effect: {} });
    const buy = { units: n, inventory: purchase, cash: -purchase };
    const sell = { units: -sold, inventory: -cogs, cash: sales, revenue: sales, cogs };
    const buyEntry = `Nợ Inventory $${purchase} / Có Cash $${purchase}`;
    const sellEntry = `Nợ Cash $${sales} / Có Sales revenue $${sales}; Nợ Cost of goods sold $${cogs} / Có Inventory $${cogs}`;
    const intro = `Doanh nghiệp thương mại bán loa. Kê khai thường xuyên; không có thuế trong các ca này. Một pallet đại diện ${n} loa. Giá mua $${cost}/loa, giá bán $${price}/loa. Tiền đầu ca $${initial}, không có tồn đầu kỳ.`;
    const base = () => [
        q(`Nhận hóa đơn mua ${n} loa × $${cost}, trả tiền mặt. Tổng giá mua là bao nhiêu?`, purchase,
            `${n} × ${cost} = ${purchase}. Hàng tồn tăng và tiền giảm cùng số tiền; chưa ghi giá vốn khi hàng chưa bán.`, buy, buyEntry),
        move(`Cất pallet ${n} loa vào ô A01.`, 'in'),
        choose(`Bán tiền mặt ${sold} loa, giá $${price}/loa. Giao dịch cần ghi nhận điều gì?`,
            ['Chỉ ghi nhận doanh thu', 'Doanh thu và giá vốn của số hàng đã bán', 'Toàn bộ giá mua thành chi phí'], 1,
            'Kê khai thường xuyên ghi nhận cả doanh thu và giá vốn, bằng hai bút toán khác nhau.'),
        move(`Lấy ${sold} loa ở A01, giao đến khu xuất hàng. Chỉ xác nhận bán hàng ở bước chứng từ tiếp theo.`, 'out'),
        q(`Khách nhận hàng và trả tiền: doanh thu ${sold} × $${price} bằng bao nhiêu?`, sales,
            `Doanh thu $${sales}; giá vốn ${sold} × ${cost} = $${cogs}. Còn ${n-sold} loa, giá trị $${purchase-cogs}.`, sell, sellEntry)
    ];
    let steps, description = intro;
    if (index === 0) {
        steps = [q(`Thẻ pallet ghi “${n} loa”. Một pallet này có bao nhiêu đơn vị hàng?`, n,
            'Pallet là đơn vị vận chuyển; số loa trên pallet mới là số đơn vị hàng tồn.'),
            choose(`Giá mua $${cost}, giá bán $${price}. Giá nào cho biết số tiền mua một loa?`,
                [`$${cost}`, `$${price}`], 0, 'Giá mua và giá bán có vai trò khác nhau; chênh lệch chưa xét chi phí khác.'),
            move('WASD hoặc bấm sàn để lái. Đến pallet ở khu nhận → E để nâng → đưa đến vòng vàng A01 → E để đặt.', 'in'),
            choose('Vừa chuyển hàng giữa hai vị trí trong cùng kho. Đã có doanh thu chưa?',
                ['Có, vì xe đã giao pallet', 'Chưa, chỉ thay đổi vị trí hàng'], 1,
                'Chuyển nội bộ không phải bán cho khách; không tự tạo doanh thu.')];
    } else if (index === 1) {
        steps = [choose('Nhận hàng hôm nay, trả tiền sau. Điều gì thay đổi?',
            ['Hàng trong kho tăng; tiền nợ nhà cung cấp tăng', 'Hàng tăng; tiền mặt tăng', 'Chi phí tăng; tiền mặt tăng'], 0,
            'Hàng tồn và khoản phải trả tăng. Mua chịu chưa làm giảm tiền.'),
            q(`Mua chịu ${n} loa × $${cost}. Khoản phải trả tăng bao nhiêu?`, purchase,
                'Có nghĩa vụ trả nhà cung cấp, không ghi doanh thu.', {units:n, inventory:purchase, payable:purchase},
                `Nợ Inventory $${purchase} / Có Accounts payable $${purchase}`),
            move(`Đưa ${n} loa đã nhận đến ô A01.`, 'in'),
            choose('Chọn bút toán trả toàn bộ khoản nợ nhà cung cấp.',
                ['Nợ Accounts payable / Có Cash', 'Nợ Inventory / Có Cash', 'Nợ Cash / Có Accounts payable'], 0,
                'Thanh toán giảm tiền và giảm khoản phải trả. Không mua thêm hàng lần thứ hai.',
                {cash:-purchase, payable:-purchase}, `Nợ Accounts payable $${purchase} / Có Cash $${purchase}`),
            q('Sau khi trả nợ, khoản phải trả còn bao nhiêu?', 0, 'Khoản phải trả đã được thanh toán hết.')];
    } else if (index === 2) {
        steps = base();
        steps.push(choose('Nếu giao dịch trên là bán chịu thay vì thu tiền ngay, tài khoản nào tăng thay cho Cash?',
            ['Accounts receivable — phải thu', 'Accounts payable — phải trả', 'Inventory — hàng tồn'], 0,
            'Bán chịu tạo khoản phải thu. Doanh thu và giá vốn vẫn ghi nhận khi thỏa điều kiện chuyển giao.'));
    } else if (index === 3 || index === 8) {
        steps = base();
        steps.push(q('Số loa còn lại trong kho?', n-sold, `${n} − ${sold} = ${n-sold}.`),
            q('Giá trị tồn kho cuối ca?', purchase-cogs, `${n-sold} × $${cost} = $${purchase-cogs}.`),
            q('Lợi nhuận gộp = doanh thu − giá vốn. Kết quả?', sales-cogs, `$${sales} − $${cogs} = $${sales-cogs}.`),
            q('Tiền còn lại cuối ca?', initial-purchase+sales, `$${initial} − $${purchase} + $${sales} = $${initial-purchase+sales}.`),
            choose('Vì sao có lãi gộp mà tiền vẫn thấp hơn đầu ca?',
                ['Còn vốn nằm trong hàng chưa bán', 'Lợi nhuận gộp luôn bằng số dư tiền', 'Hàng chưa bán đã thành giá vốn'], 0,
                `Còn $${purchase-cogs} hàng tồn chưa bán. Lợi nhuận không phải số dư tiền.`));
        if (index === 8) steps.push(q(`Trả $${10+variant} chi phí vận hành. Lợi nhuận sau chi phí này là bao nhiêu?`,
            sales-cogs-10-variant, 'Trong ca đơn giản không có thuế/thu nhập khác: lợi nhuận = lãi gộp − chi phí hoạt động.',
            {cash:-10-variant, expenses:10+variant}, `Nợ Operating expense $${10+variant} / Có Cash $${10+variant}`),
            choose('Chọn nhận định đúng khi chốt sổ.', ['Cứ hàng trong kho là hàng của mình',
                'Phải xét quyền sở hữu; FIFO là dòng chi phí; NRV trừ chi phí hoàn thành và bán'], 1,
                'Sổ kho cần phản ánh quyền sở hữu, phương pháp tính giá nhất quán và giá trị có thể thu hồi.'));
    } else if (index === 4) {
        const returned = 2*cost, balance = purchase-returned, discount = Math.round(balance*2)/100;
        description += ' Điều khoản mua 2/10, n/30. Trả lại 2 loa nguyên vẹn; thanh toán trong thời hạn 10 ngày. Không có thuế.';
        steps = [q(`Mua chịu ${n} loa × $${cost}: tổng nợ?`, purchase, 'Hàng và công nợ cùng tăng.',
            {units:n, inventory:purchase, payable:purchase}, `Nợ Inventory $${purchase} / Có Accounts payable $${purchase}`),
            q('Trả lại 2 loa. Giá trị hàng trả lại?', returned, `2 × ${cost} = ${returned}. Giảm hàng tồn và khoản phải trả.`,
                {units:-2,inventory:-returned,payable:-returned}, `Nợ Accounts payable $${returned} / Có Inventory $${returned}`),
            q('Khoản nợ còn lại trước chiết khấu?', balance, `${purchase} − ${returned} = ${balance}.`),
            q('Chiết khấu 2% trên khoản nợ còn lại là bao nhiêu?', discount,
                `${balance} × 2% = ${discount}. Không tính chiết khấu trên số hàng đã trả lại.`),
            q('Số tiền thực trả trong hạn chiết khấu?', balance-discount,
                'Giảm toàn bộ khoản phải trả; giảm tiền theo số thực trả và giảm giá trị hàng tồn theo chiết khấu mua.',
                {cash:-(balance-discount),payable:-balance,inventory:-discount},
                `Nợ Accounts payable $${balance} / Có Cash $${balance-discount} / Có Inventory $${discount}`),
            choose('Với FOB shipping point trong bài học, bên mua trả vận chuyển nhập hàng: khoản này thường được ghi vào đâu?',
                ['Giá trị Inventory của bên mua', 'Sales revenue', 'Không ghi sổ'],0,
                'Chi phí đưa hàng mua đến vị trí và điều kiện hiện tại thuộc giá gốc hàng tồn theo tình huống này.'),
            choose('Bên bán chịu chi phí giao hàng theo FOB destination: ghi vào đâu?',
                ['Inventory của bên bán', 'Chi phí giao hàng của bên bán', 'Giảm Accounts payable của khách'],1,
                'Bài giảng phân biệt vận chuyển nhập hàng của người mua với chi phí giao hàng của người bán.'),
            q(`Tiếp theo bán chịu 2 loa × $${price}. Khoản phải thu tăng bao nhiêu?`,2*price,
                'Bán chịu tăng khoản phải thu và doanh thu; đồng thời giảm hàng tồn và ghi giá vốn. Đơn giá vốn sau chiết khấu mua là 98% giá mua.',
                {units:-2,inventory:-2*cost*0.98,receivable:2*price,revenue:2*price,cogs:2*cost*0.98},
                `Nợ Accounts receivable $${2*price} / Có Sales revenue $${2*price}; Nợ Cost of goods sold / Có Inventory $${(2*cost*0.98).toFixed(2)}`),
            q('Khách trả lại 1 loa nguyên vẹn. Giảm khoản phải thu bao nhiêu?',price,
                'Giảm phải thu theo giá bán; nhập lại hàng và giảm giá vốn theo giá vốn của một loa. Giá bán và giá vốn khác nhau.',
                {units:1,inventory:cost*0.98,receivable:-price,revenue:-price,cogs:-cost*0.98},
                `Nợ Sales returns and allowances $${price} / Có Accounts receivable $${price}; Nợ Inventory / Có Cost of goods sold $${(cost*0.98).toFixed(2)}`),
            q(`Khách thanh toán nợ còn $${price}, được chiết khấu bán 2%. Tiền thu thực tế?`,price*0.98,
                'Chiết khấu bán làm giảm doanh thu thuần, không giảm giá vốn. Khoản phải thu được tất toán toàn bộ.',
                {cash:price*0.98,receivable:-price,revenue:-price*0.02},
                `Nợ Cash $${(price*0.98).toFixed(2)} / Nợ Sales discounts $${(price*0.02).toFixed(2)} / Có Accounts receivable $${price}`)];
    } else if (index === 5) {
        const physical=20+variant, consigned=3, transit=4, destination=2;
        description = `Kiểm kê cuối kỳ: ${physical} sản phẩm trong kho, gồm ${consigned} sản phẩm giữ hộ bên khác. Ngoài kho có ${transit} sản phẩm đã mua, đang vận chuyển theo FOB shipping point; ${destination} sản phẩm đã bán nhưng chưa đến khách theo FOB destination. Các lô này không trùng nhau.`;
        steps = [choose('Hàng ký gửi giữ hộ người khác trong kho mình có thuộc tồn kho của mình?', ['Có','Không'],1,
            'Sở hữu vẫn thuộc bên gửi; vị trí hiện tại không quyết định quyền sở hữu.'),
            choose('Hàng mua FOB shipping point đã giao cho đơn vị vận chuyển: thuộc ai?', ['Bên mua','Bên bán'],0,
                'Theo tình huống giáo trình, quyền sở hữu chuyển khi người vận chuyển nhận hàng.'),
            choose('Hàng bán FOB destination chưa đến khách: còn thuộc bên bán?', ['Có','Không'],0,
                'Theo điều khoản của bài, bên bán giữ quyền sở hữu cho tới điểm đến.'),
            q('Tổng số sản phẩm thuộc doanh nghiệp cuối kỳ?',physical-consigned+transit+destination,
                `${physical} − ${consigned} giữ hộ + ${transit} hàng mua trên đường + ${destination} hàng bán chưa chuyển quyền.`)];
    } else if (index === 6) {
        const c1=10+variant*2,c2=c1+4,c3=c1+8,avg=(c1+c2)/2;
        description = `Không tồn đầu kỳ. Mua 10 loa × $${c1}, mua 10 loa × $${c2}, bán 12 loa, rồi mua 8 loa × $${c3}. So sánh FIFO và bình quân di động trong hệ thống kê khai thường xuyên. Đây là mô phỏng so sánh; không đổi phương pháp giữa ca thực tế.`;
        steps = [q('FIFO: giá vốn của 12 loa bán?',10*c1+2*c2,
            `Dùng lớp chi phí đầu: 10 × ${c1} + 2 × ${c2}. Không bắt buộc lấy đúng kiện vật lý của lô đó.`),
            q('Bình quân di động: đơn giá sau hai lần mua đầu?',avg,
                `(10 × ${c1} + 10 × ${c2}) ÷ 20 = ${avg}.`),
            q('Bình quân di động: giá vốn của 12 loa bán?',12*avg, `12 × ${avg} = ${12*avg}.`),
            q('Bình quân di động: đơn giá mới sau lần mua cuối? Làm tròn 2 chữ số thập phân.',(8*avg+8*c3)/16,
                `Sau bán còn 8 loa × ${avg}. Mua 8 loa × ${c3}: bình quân mới = (8 × ${avg} + 8 × ${c3}) ÷ 16.`),
            q('FIFO: giá trị 16 loa tồn cuối?',8*c2+8*c3, `8 × ${c2} còn lại từ lô thứ hai + 8 × ${c3} mua cuối.`),
            choose('FIFO có bắt buộc xe nâng lấy đúng kiện nhập trước?', ['Có, luôn bắt buộc','Không; đây là giả định dòng chi phí'],1,
                'Dòng chi phí không nhất thiết trùng với dòng hàng vật lý. Bình quân di động tính lại sau mua, không tính lại sau bán.')];
    } else if (index === 7) {
        const unitCost=30+variant*2, salePrice=28+variant*2, complete=2, selling=3, nrv=salePrice-complete-selling;
        description = `Kiểm định 10 loa: Cost $${unitCost}/loa; giá bán ước tính $${salePrice}; chi phí hoàn thành $${complete}; chi phí bán $${selling}/loa. Đánh giá từng mặt hàng.`;
        steps = [q('NRV của một loa?',nrv, `${salePrice} − ${complete} − ${selling} = ${nrv}. NRV không phải chỉ là giá bán.`),
            q('LCNRV: giá trị ghi sổ một loa?',Math.min(unitCost,nrv),`Chọn mức thấp hơn giữa Cost ${unitCost} và NRV ${nrv}.`),
            q('Tổng giá trị 10 loa sau đánh giá?',10*nrv, `10 × ${nrv} = ${10*nrv}.`),
            q('Tổng khoản ghi giảm giá trị?',10*(unitCost-nrv), `10 × (${unitCost} − ${nrv}) = ${10*(unitCost-nrv)}.`),
            choose('Nếu NRV kỳ đánh giá ban đầu cao hơn Cost thì chọn gì?', ['Cost','NRV cao hơn'],0,
                'Ở bước so sánh ban đầu, dùng mức thấp hơn; không ghi tăng vượt giá gốc chỉ vì giá bán kỳ vọng cao.')];
    }
    return { title: LESSON_NAMES[index], description, initial, units:n, sold, cost, price, steps };
}

function currentLesson() { return buildLesson(learning.caseIndex, learning.variant); }
function currentLearningStep() { return learning.completed ? null : currentLesson().steps[learning.step]; }
function lessonLedger() {
    const book = {cash:currentLesson().initial,units:0,inventory:0,payable:0,receivable:0,revenue:0,cogs:0,expenses:0};
    for (const step of currentLesson().steps.slice(0,learning.step))
        for (const [key,value] of Object.entries(step.effect || {})) book[key] += value;
    return book;
}

function restoreLearning(saved) {
    if (!saved || saved.version !== 1 || !Number.isInteger(saved.caseIndex) || saved.caseIndex < 0 || saved.caseIndex > 8
        || !Number.isInteger(saved.round) || saved.round < 0 || saved.round > 3
        || !Number.isInteger(saved.variant) || saved.variant < 0 || saved.variant > 19
        || typeof saved.assisted !== 'boolean' || typeof saved.completed !== 'boolean'
        || !Number.isInteger(saved.step) || saved.step < 0
        || saved.step > buildLesson(saved.caseIndex,saved.variant).steps.length
        || (saved.completed && (saved.caseIndex !== 8 || saved.round !== 3))) return;
    learning = {version:1,caseIndex:saved.caseIndex,round:saved.round,step:saved.step,
        assisted:saved.assisted,variant:saved.variant,completed:saved.completed};
}

function stationUnlocked(id) {
    return learning.completed || learning.caseIndex >= ({1:3,2:1,3:5,4:6,5:7}[id] ?? 99);
}

function learningCargoPoint() {
    return currentLearningStep()?.direction === 'out' ? {x:0.95,z:-6.5} : cargoSource;
}
function learningCargoTarget() {
    return currentLearningStep()?.direction === 'out'
        ? {x:4.2,z:7.8,name:'khu xuất hàng'} : {x:0.95,z:-6.5,name:'ô lưu trữ A01'};
}

function answerLearning(raw) {
    const step = currentLearningStep();
    if (!step || step.kind === 'move') return;
    const text = String(raw).trim();
    const value = typeof raw === 'number' ? raw : Number(text.replace(',','.'));
    if (!text || !Number.isFinite(value)) return setLearningFeedback('Nhập một số hợp lệ; dùng dấu chấm hoặc phẩy cho phần thập phân.');
    totalAttempts++;
    const correct = step.kind === 'choice' ? value === step.answer : Math.abs(value-step.answer) < 0.005001;
    if (correct) correctAttempts++;
    updatePlayerHUD();
    if (!correct) {
        learning.assisted = true;
        saveProgress();
        return setLearningFeedback('Chưa đúng. ' + step.why + ' Hãy thử lại; không bị trừ tiền.');
    }
    finishLearningStep();
}

function setLearningFeedback(text) {
    setElText('learning-feedback',text);
}
function hintLearning() {
    const step = currentLearningStep();
    if (!step) return;
    learning.assisted = true;
    saveProgress();
    setLearningFeedback(step.why + (step.kind === 'move' ? '' : ` Đáp án: ${step.options ? step.options[step.answer] : step.answer}.`)
        + (learning.round >= 2 ? ' Lượt này là luyện tập; bạn sẽ được thử lại bằng dữ liệu mới.' : ''));
}
function finishLearningStep() {
    const step = currentLearningStep();
    if (!step) return;
    learning.step++;
    warehouseProgress.carrying = false;
    saveProgress();
    syncWarehouseWorld();
    renderLearning();
    updateWarehouseUI();
    setLearningFeedback('Đúng rồi. ' + step.why);
    if (currentLearningStep()?.kind === 'move') closeLearning();
}

function nextLearningRound() {
    if (learning.completed || learning.step !== currentLesson().steps.length) return;
    if (learning.round >= 2 && learning.assisted) {
        learning.variant = learning.variant >= 19 ? 4 : learning.variant + 1;
        show3DToast('Luyện tập đã hoàn thành. Thử dữ liệu mới, tự làm để xác nhận thành thạo.');
    } else if (learning.round < 3 && learning.caseIndex !== 0) {
        learning.round++;
        learning.variant = learning.round;
    } else {
        playerCash += 2000;
        playerXP += 100;
        if (learning.caseIndex === 8) learning.completed = true;
        else learning.caseIndex++;
        learning.round = learning.completed ? 3 : 0;
        if (!learning.completed) learning.variant = 0;
        spawn3DCelebrationParticles();
        show3DToast('Thành thạo ca học! +$2,000 ngân sách nâng cấp, +100 XP.');
    }
    learning.step = learning.completed ? currentLesson().steps.length : 0;
    learning.assisted = false;
    warehouseProgress.carrying = false;
    saveProgress();
    syncWarehouseWorld();
    updatePlayerHUD();
    updateWarehouseUI();
    renderLearning();
}

function openLearning() {
    showingGameHelp = false;
    closeStationPopup();
    lessonDialogOpen = true;
    isPopupOpen = true;
    moveKeys = {};
    pendingStationToOpen = null;
    if (playerGroup) playerTargetPos.copy(playerGroup.position);
    renderLearning();
}
function closeLearning() {
    showingGameHelp = false;
    lessonDialogOpen = false;
    isPopupOpen = false;
    document.getElementById('learning-dialog')?.close();
    if (playerGroup) playerTargetPos.copy(playerGroup.position);
}

function renderLearning() {
    const dialog = document.getElementById('learning-dialog');
    if (!dialog) return;
    if (showingGameHelp) return renderGameHelp(dialog);
    const lesson = currentLesson(), step = currentLearningStep(), book = lessonLedger();
    const rounds = ['Làm cùng hướng dẫn','Luyện tập có gợi ý','Tự làm 1/2','Tự làm 2/2'];
    const summaryOnly = [0,5,6,7].includes(learning.caseIndex);
    dialog.innerHTML = `<header><div><small>${learning.caseIndex === 0 ? 'LÀM QUEN · CHỈ LÀM MỘT LẦN' : `BÀI ${learning.caseIndex}/8 · ${rounds[learning.round]}`}</small>
        <h2 id="learning-title">${lesson.title}</h2></div><div><button onclick="openGameHelp()">Hướng dẫn chơi</button><button onclick="closeLearning()" aria-label="Đóng bài học">Về kho · Esc</button></div></header>
        ${learning.caseIndex >= 4 ? `<p>${lesson.description}</p>` : '<details><summary>Xem tình huống và số liệu</summary><p>' + lesson.description + '</p></details>'}<progress aria-label="Tiến độ ca" max="${lesson.steps.length}" value="${learning.step}"></progress>
        <p>Bước ${Math.min(learning.step+1,lesson.steps.length)}/${lesson.steps.length}. ${learning.round>=2 ? 'Tự làm, hoặc chọn gợi ý nếu cần.' : 'Làm từng bước. Sai có thể sửa lại.'}</p>
        ${summaryOnly ? '' :
        `<details><summary>Xem sổ: hàng và tiền thay đổi thế nào?</summary><div class="learning-ledger" aria-label="Sổ doanh nghiệp của riêng ca này">
        <span>Tiền doanh nghiệp <b>$${book.cash.toFixed(2)}</b></span><span>Hàng thuộc DN <b>${book.units} loa · $${book.inventory.toFixed(2)}</b></span>
        <span>Phải trả <b>$${book.payable.toFixed(2)}</b></span><span>Phải thu <b>$${book.receivable.toFixed(2)}</b></span><span>Doanh thu thuần <b>$${book.revenue.toFixed(2)}</b></span>
        <span>Giá vốn <b>$${book.cogs.toFixed(2)}</b></span><span>Lãi gộp <b>$${(book.revenue-book.cogs).toFixed(2)}</b></span></div></details>`}
        ${learning.completed ? '<h3>Hoàn thành chương trình!</h3><p>Bạn đã tự làm hai tình huống mới cho mỗi ca. Các trạm bài tập đã mở để ôn luyện.</p>' : step ?
        `<h3>${step.prompt}</h3>${learning.round===0 && step.kind !== 'move' ? `<p class="learning-explain">${learning.caseIndex === 0 ? (learning.step === 0 ? `Thẻ hàng ghi ${lesson.units} loa: đó là ${lesson.units} chiếc loa.` : learning.step === 1 ? 'Giá mua là số tiền mình trả để có một chiếc loa.' : 'Đưa hàng sang chỗ khác trong kho chưa phải là bán cho khách.') : step.why}</p>` : ''}
        ${step.kind==='number' && learning.caseIndex===0 ? `<button class="learning-option" onclick="answerLearning(${step.answer})">${step.answer} chiếc loa</button><button class="learning-option" onclick="answerLearning(1)">1 chiếc loa</button>` : step.kind==='number' ? `<form id="learning-answer"><label for="learning-number">Kết quả (USD hoặc đơn vị theo câu hỏi)</label><input id="learning-number" inputmode="decimal" autocomplete="off" required><button type="submit">Trả lời</button></form>` :
        step.kind==='choice' ? step.options.map((option,i)=>`<button class="learning-option" onclick="answerLearning(${i})">${option}</button>`).join('') :
        `<p>Pallet: ${step.direction==='out' ? lesson.sold : lesson.units} loa. ${step.direction==='out' ? 'Lấy tại A01 → giao khu xuất.' : 'Lấy tại khu nhận → cất A01.'}</p>
        <button onclick="closeLearning()">Về kho để thực hiện bằng xe nâng</button>
        ${(learning.caseIndex>0 || learning.round>0) ? '<button onclick="finishLearningStep()">Xác nhận vận chuyển tự động (bỏ qua lái xe)</button>' : ''}`}
        <button onclick="hintLearning()">Tôi cần gợi ý</button>` :
        `<h3>Đã xử lý xong tình huống</h3><p>${learning.round>=2 && learning.assisted ? 'Bạn đã dùng hỗ trợ hoặc sửa sai. Tiếp theo là dữ liệu mới để tự làm lại, không bị phạt.' : 'Xem lại thay đổi trong sổ trước khi tiếp tục.'}</p>
        <button onclick="nextLearningRound()">${(learning.caseIndex===0 || learning.round===3) && !learning.assisted ? 'Xong! Sang bài tiếp theo' : 'Tiếp tục'}</button>`}
        <p id="learning-feedback" role="status" aria-live="polite"></p>`;
    dialog.querySelector('form')?.addEventListener('submit',event=>{
        event.preventDefault(); answerLearning(dialog.querySelector('input').value);
    });
    if (lessonDialogOpen && !dialog.open) dialog.showModal();
}

function openGameHelp() {
    openLearning();
    showingGameHelp = true;
    renderLearning();
}

function renderGameHelp(dialog) {
    dialog.innerHTML = `<header><div><small>DÀNH CHO NGƯỜI MỚI</small>
        <h2 id="learning-title">Hướng dẫn chơi</h2></div><button onclick="closeLearning()">Về kho · Esc</button></header>
        <p><b>Mục tiêu:</b> hiểu hàng, tiền và sổ sách thay đổi thế nào khi mua/bán; hoàn thành 9 ca học để phát triển kho. Không cần biết kế toán trước khi chơi.</p>
        <h3>Bắt đầu trong 3 bước</h3>
        <ol style="list-style:decimal;padding-left:24px;line-height:1.8">
            <li>Chọn <b>Tiếp tục bài đang học</b>, đọc thẻ pallet và câu hỏi. Lượt đầu có đáp án mẫu cùng giải thích.</li>
            <li>Nhập số hoặc chọn câu trả lời, bấm <b>Kiểm tra và xác nhận</b>. Đọc phản hồi và xem sổ thay đổi.</li>
            <li>Khi bài yêu cầu vận chuyển, chọn <b>Về kho</b>, đưa pallet đến vòng vàng rồi quay lại xử lý chứng từ.</li>
        </ol>
        <h3>Điều khiển xe nâng</h3>
        <p><b>W / A / S / D hoặc phím mũi tên:</b> di chuyển. Có thể bấm vào sàn để lái đến điểm gần; nếu gặp kệ chắn, dùng phím đi vòng qua lối trống.</p>
        <p><b>E:</b> nâng hoặc giao pallet khi ở gần. Nút nâng/giao ở bảng bên phải có tác dụng tương tự. Chỉ thao tác được ở bước vận chuyển của bài.</p>
        <p><b>Cuộn chuột:</b> phóng to/thu nhỏ. <b>Nút la bàn:</b> đặt lại góc nhìn. <b>Esc:</b> đóng bảng để về kho. Khi bảng học mở, xe tạm dừng.</p>
        <h3>Chuyển một pallet như thế nào?</h3>
        <ol style="list-style:decimal;padding-left:24px;line-height:1.8">
            <li><b>Nhập kho:</b> tìm biển NHAN PALLET ở phía trước kho. <b>Xuất kho:</b> lấy hàng tại A01 ở phía sau.</li>
            <li>Lái đến gần pallet. Khi nút đổi thành <b>E · Nâng pallet</b>, nhấn E một lần.</li>
            <li>Đi theo đường trống đến <b>vòng vàng</b>. Nhập hàng đến A01; xuất hàng đến khu xuất phía trước bên phải.</li>
            <li>Khi hiện <b>E · Giao pallet tại ô đích</b>, nhấn E. Bài học sẽ mở lại ở bước tiếp theo.</li>
        </ol>
        <p>Một pallet có thể chứa nhiều loa: đọc số đơn vị trong bài. Chuyển vị trí nội bộ chưa tạo doanh thu. Sau lượt làm quen đầu, bạn có thể chọn <b>Xác nhận vận chuyển tự động</b> để tập trung vào kế toán.</p>
        <h3>Học, sửa sai và qua ca</h3>
        <p>Mỗi ca gồm <b>Làm cùng hướng dẫn → Luyện tập có gợi ý → Tự làm 1/2 → Tự làm 2/2</b>. Hai lượt tự làm dùng số liệu mới.</p>
        <p>Trả lời sai không trừ tiền. Đọc giải thích rồi sửa lại. Dùng gợi ý hoặc sửa sai trong lượt tự làm sẽ chuyển lượt đó thành luyện tập; bấm Tiếp tục để thử dữ liệu mới. Bạn không phải học lại những ca đã hoàn thành.</p>
        <p>Ô số chỉ nhập kết quả, không nhập ký hiệu $, đơn vị hay dấu phân cách hàng nghìn. Ví dụ: <b>1000</b>, <b>12.50</b> hoặc <b>12,50</b>. Làm tròn 2 chữ số thập phân khi đề yêu cầu.</p>
        <h3>Đọc tiền và sổ sách</h3>
        <p><b>Ngân sách nâng cấp trên thanh đầu:</b> tiền thưởng của game để mua thiết bị. <b>Tiền doanh nghiệp trong bài:</b> số dư dùng để học kế toán. Hai khoản này tách biệt.</p>
        <p><b>Hàng tồn:</b> số lượng và giá trị hàng thuộc doanh nghiệp. <b>Phải thu:</b> khách còn nợ mình. <b>Phải trả:</b> mình còn nợ nhà cung cấp. <b>Giá vốn:</b> chi phí của hàng đã bán. <b>Lãi gộp = doanh thu thuần − giá vốn.</b></p>
        <p>Ví dụ: mua 10 loa × $10, bán 4 loa × $15 → còn 6 loa trị giá $60, doanh thu $60, giá vốn $40 và lãi gộp $20. Tiền còn lại phụ thuộc cả tiền đầu ca và việc đã thu/trả hay chưa.</p>
        <h3>Mở trạm, nâng cấp và tiếp tục lần sau</h3>
        <p>Hoàn thành một ca nhận <b>$2.000 ngân sách và 100 XP</b>, chỉ một lần. Mở mục <b>Nâng cấp kho</b> bên phải để mua khi đủ điều kiện. Kệ và xe mở sau ca 3; khu xuất mở sau ca 6. Không bắt buộc mua để học tiếp.</p>
        <p>Các trạm bài tập phía dưới mở theo tiến trình: mua/bán từ ca 1, lợi nhuận từ ca 3, quyền sở hữu từ ca 5, FIFO/WAC từ ca 6, LCNRV từ ca 7.</p>
        <p>Game tự lưu trên trình duyệt. Lần sau mở cùng đường dẫn, trình duyệt và hồ sơ để tiếp tục. Xóa dữ liệu trình duyệt hoặc đổi hồ sơ có thể làm mất quyền truy cập bản lưu. Cần mạng để tải thư viện hiển thị game.</p>
        <button onclick="openLearning()">Tiếp tục bài đang học</button>
        <button onclick="closeLearning()">Về kho</button>`;
    if (lessonDialogOpen && !dialog.open) dialog.showModal();
}

function initLearning() {
    const dialog = document.createElement('dialog');
    dialog.id = 'learning-dialog';
    dialog.setAttribute('aria-labelledby','learning-title');
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeLearning();});
    document.body.appendChild(dialog);
    const style = document.createElement('style');
    style.textContent = `body>aside{display:none!important}#learning-dialog details{margin:12px 0;color:#52636b}#learning-dialog summary{cursor:pointer}#learning-dialog .learning-explain{font-size:14px}body>footer{display:none}#btn-beginner-mode,#btn-collider-debug{display:none}#learning-dialog h3{line-height:1.5}#learning-dialog{max-width:600px!important}#warehouse-panel{font-size:14px!important}#warehouse-panel details{margin-top:12px}#learning-dialog{width:min(760px,94vw);max-height:86dvh;overflow:auto;margin:auto;padding:24px;background:#faf8f1;color:#263746;border:2px solid #657787;border-radius:16px;font-size:15px}#learning-dialog::backdrop{background:#142330aa}#learning-dialog header{display:flex;justify-content:space-between;gap:12px;align-items:start}#learning-dialog h2{font-size:22px;font-weight:800}#learning-dialog h3{font-size:18px;font-weight:800;margin:16px 0}#learning-dialog p{margin:12px 0;line-height:1.6}#learning-dialog button{background:#263746;color:white;border:2px solid transparent;border-radius:8px;padding:10px 14px;margin:5px 5px 5px 0}#learning-dialog button:focus-visible,#learning-dialog input:focus-visible{outline:3px solid #d99118;outline-offset:2px}#learning-dialog input{display:block;border:2px solid #657787;padding:9px;width:100%;margin:8px 0;background:white}#learning-dialog progress{width:100%;accent-color:#16805d}#learning-dialog .learning-option{display:block;width:100%;text-align:left}.learning-ledger{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;background:#e9efed;padding:12px;border-radius:10px}.learning-ledger b{display:block}.learning-explain{background:#fff0cc;padding:12px}#learning-feedback{border-left:4px solid #16805d;padding-left:12px}`;
    document.head.appendChild(style);
    if (currentLearningStep()?.kind !== 'move') warehouseProgress.carrying = false;
    syncWarehouseWorld();
    updateWarehouseUI();
    openLearning();
    if (currentLearningStep()?.kind === 'move') closeLearning();
}
