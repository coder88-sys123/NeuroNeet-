// ==========================================
// SPA NAVIGATION & UNIVERSAL SIDEBAR
// ==========================================

function switchTab(viewId, clickedElement) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    clickedElement.classList.add('active');
    
    const sidebar = document.querySelector('.sidebar');
    if(sidebar) sidebar.classList.remove('active');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if(sidebar) sidebar.classList.toggle('active');
}

// ==========================================
// MASTER BOOT ENGINE (Loads everything on startup)
// ==========================================
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }
    }, 2500);

    // Initialize all saved user data & structures
    loadGoals();
    loadStreak();
    loadFlashcards();
    loadMistakes();
    loadTricks();
    loadFlowMaps();
    loadReactionQuizzes();
    loadPYQs();
    generateOMR(); // <--- This generates your 10 OMRs right when the app opens!
});

// MASTER RESET FUNCTION
function factoryResetApp() {
    if(confirm("🚨 WARNING: MASTER RESET 🚨\n\nAre you absolutely sure you want to delete ALL your saved data? This will wipe your trackers, goals, flashcards, flow maps, and PYQs permanently. This cannot be undone!")) {
        localStorage.clear();
        window.location.reload();
    }
}

// ==========================================
// 1. DASHBOARD, TARGETS & STREAK LOGIC
// ==========================================
let timerInterval; let seconds = 0; let isRunning = false;
function updateDisplay() {
    let h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    let m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('timer').innerText = `${h}:${m}:${s}`;
}
function startTimer() { if (!isRunning) { isRunning = true; timerInterval = setInterval(() => { seconds++; updateDisplay(); }, 1000); } }
function pauseTimer() { isRunning = false; clearInterval(timerInterval); }
function resetTimer() { isRunning = false; clearInterval(timerInterval); seconds = 0; updateDisplay(); }

function addGoal(event) {
    if (event.key === 'Enter') {
        let input = document.getElementById('goalInput');
        if (input.value.trim() !== "") {
            createGoalElement(input.value, false);
            saveGoals();
            input.value = "";
        }
    }
}

function createGoalElement(text, isCompleted) {
    let li = document.createElement('li'); 
    li.className = 'goal-item' + (isCompleted ? ' completed' : '');
    li.innerHTML = `
        <input type="checkbox" ${isCompleted ? 'checked' : ''} onclick="toggleGoal(this)"> 
        <span style="flex-grow:1;">${text}</span> 
        <i class="fa-solid fa-trash delete-btn" onclick="this.parentElement.remove(); saveGoals();"></i>`;
    document.getElementById('goalList').prepend(li);
}

function toggleGoal(checkbox) { 
    if(checkbox.checked) {
        checkbox.parentElement.classList.add('completed');
    } else {
        checkbox.parentElement.classList.remove('completed');
    }
    saveGoals(); 
}

function saveGoals() {
    let goals = [];
    document.querySelectorAll('#goalList .goal-item').forEach(li => {
        goals.push({
            text: li.querySelector('span').innerText,
            completed: li.querySelector('input').checked
        });
    });
    localStorage.setItem('nn_goals', JSON.stringify(goals));
}

function loadGoals() {
    let saved = localStorage.getItem('nn_goals');
    if (saved) {
        let goals = JSON.parse(saved);
        goals.reverse().forEach(g => createGoalElement(g.text, g.completed));
    }
}

// Consistency Tracker Persistence
const consistencyGrid = document.getElementById('consistencyGrid');
for (let i = 1; i <= 30; i++) {
    if(consistencyGrid) consistencyGrid.innerHTML += `<label class="day-box">D${i} <input type="checkbox" id="streak_d_${i}" onchange="updateStreak()"></label>`;
}

function updateStreak() {
    const checks = document.querySelectorAll('#consistencyGrid input[type="checkbox"]');
    let count = 0;
    let savedState = {};
    checks.forEach(cb => { 
        if (cb.checked) count++; 
        savedState[cb.id] = cb.checked;
    });
    document.getElementById('streakDays').innerText = count;
    const flame = document.getElementById('streakFlame');
    if (count > 0) { flame.classList.add('active'); } else { flame.classList.remove('active'); }
    
    localStorage.setItem('nn_streak_state', JSON.stringify(savedState));
}

function loadStreak() {
    let saved = localStorage.getItem('nn_streak_state');
    if(saved) {
        let state = JSON.parse(saved);
        for(let id in state) {
            let el = document.getElementById(id);
            if(el) el.checked = state[id];
        }
        updateStreak();
    }
}

// ==========================================
// 2. UNIVERSAL TRACKER RENDER ENGINE
// ==========================================
function renderTracker(chapters, containerId, prefix, accentColor) {
    const container = document.getElementById(containerId);
    if(!container) return;
    chapters.forEach((ch, idx) => {
        let uniqueId = `${prefix}_${idx}`;
        container.innerHTML += `
        <div class="chapter-track" id="row_${uniqueId}">
            <span class="chapter-name">${ch}</span>
            <div class="reading-checks">
                <label>R1<input type="checkbox" id="r1_${uniqueId}" onchange="saveTrackers()"></label>
                <label>R2<input type="checkbox" id="r2_${uniqueId}" onchange="saveTrackers()"></label>
                <label>Fin<input type="checkbox" id="fin_${uniqueId}" onchange="saveTrackers()"></label>
                <label title="Mark Chapter Done" style="margin-left: 5px;">
                    <input type="checkbox" id="done_${uniqueId}" onchange="document.getElementById('row_${uniqueId}').classList.toggle('chapter-done', this.checked); saveTrackers();"> 
                    <i class="fa-solid fa-check-double" style="color:${accentColor};"></i>
                </label>
            </div>
        </div>`;
    });
}

const bio11 = ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology", "Anatomy", "Structural Organisation", "Cell: Unit of Life", "Biomolecules", "Cell Cycle", "Photosynthesis", "Respiration", "Plant Growth", "Breathing", "Body Fluids", "Excretory Products", "Locomotion", "Neural Control", "Chemical Coordination"];
const bio12 = ["Sexual Reproduction in Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance", "Molecular Basis", "Evolution", "Human Health", "Microbes in Welfare", "Biotech: Principles", "Biotech: Applications", "Organisms & Populations", "Ecosystem", "Biodiversity"];
const phys11 = ["Physical World and Measurement", "Kinematics", "Laws of Motion", "Work, Energy, and Power", "Motion of System of Particles and Rigid Body", "Gravitation", "Properties of Bulk Matter", "Thermodynamics", "Oscillations and Waves"];
const phys12 = ["Electrostatics", "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction", "Electromagnetic Waves", "Optics", "Dual Nature of Matter", "Atoms and Nuclei", "Electronic Devices"];
const chem11 = ["Some Basic Concepts", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "Chemical Thermodynamics", "Equilibrium", "Redox Reactions", "Organic Chemistry - Basic Principles", "Hydrocarbons"];
const chem12 = ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"];

renderTracker(bio11, 'bio11Tracker', 'b11', 'var(--neon-green)');
renderTracker(bio12, 'bio12Tracker', 'b12', 'var(--neon-green)');
renderTracker(phys11, 'phys11Tracker', 'p11', 'var(--neon-purple)');
renderTracker(phys12, 'phys12Tracker', 'p12', 'var(--neon-purple)');
renderTracker(chem11, 'chem11Tracker', 'c11', 'var(--neon-cyan)');
renderTracker(chem12, 'chem12Tracker', 'c12', 'var(--neon-cyan)');

function saveTrackers() {
    let states = {};
    document.querySelectorAll('.reading-checks input[type="checkbox"]').forEach(cb => {
        states[cb.id] = cb.checked;
    });
    localStorage.setItem('nn_tracker_states', JSON.stringify(states));
}

function loadTrackers() {
    let saved = localStorage.getItem('nn_tracker_states');
    if(saved) {
        let states = JSON.parse(saved);
        for(let id in states) {
            let cb = document.getElementById(id);
            if(cb) {
                cb.checked = states[id];
                if(id.startsWith('done_')) {
                    let suffix = id.replace('done_', '');
                    let row = document.getElementById('row_' + suffix);
                    if(row) row.classList.toggle('chapter-done', cb.checked);
                }
            }
        }
    }
}
window.addEventListener('load', loadTrackers);

// ==========================================
// 3. BIOLOGY & PHYSICS UTILITIES
// ==========================================
function addFlashcard() {
    let q = document.getElementById('fcQuestion').value.trim();
    let a = document.getElementById('fcAnswer').value.trim();
    if (q && a) {
        createFlashcardElement(q, a);
        saveFlashcards();
        document.getElementById('fcQuestion').value = ""; document.getElementById('fcAnswer').value = "";
    }
}

function createFlashcardElement(q, a) {
    let deck = document.getElementById('flashcardDeck');
    let div = document.createElement('div');
    div.style.position = "relative";
    div.style.marginBottom = "10px";
    div.className = "fc-item-container";
    div.innerHTML = `
        <i class="fa-solid fa-trash delete-btn" style="position:absolute; top:15px; right:15px; z-index:10;" onclick="this.parentElement.remove(); saveFlashcards();"></i>
        <div style="background: #181818; border: 1px solid #333; border-radius: 8px; padding: 15px; cursor: pointer; transition: 0.3s;" 
             onclick="let ans = this.querySelector('.fc-answer'); ans.style.display = ans.style.display === 'block' ? 'none' : 'block';">
            <div class="fc-q-text" style="font-weight: 600; padding-right: 25px; color: var(--text-primary);">Q: ${q}</div>
            <div class="fc-answer" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #444; color: var(--neon-green); font-weight: 600;">
                A: ${a}
            </div>
        </div>`;
    deck.prepend(div);
}

function saveFlashcards() {
    let items = [];
    document.querySelectorAll('#flashcardDeck .fc-item-container').forEach(div => {
        items.push({
            q: div.querySelector('.fc-q-text').innerText.replace('Q: ', ''),
            a: div.querySelector('.fc-answer').innerText.replace('A: ', '')
        });
    });
    localStorage.setItem('nn_flashcards', JSON.stringify(items));
}

function loadFlashcards() {
    let saved = localStorage.getItem('nn_flashcards');
    if(saved) {
        JSON.parse(saved).reverse().forEach(f => createFlashcardElement(f.q, f.a));
    }
}

function toggleSpecificLabel(id) { document.getElementById(id).classList.toggle('blur-effect'); }

function addFormula() {
    let title = document.getElementById('formTitle').value.trim();
    let latex = document.getElementById('formLatex').value.trim();
    if (title && latex) {
        createFormulaElement(title, latex);
        saveFormulas();
        document.getElementById('formTitle').value = ""; document.getElementById('formLatex').value = "";
    }
}

function createFormulaElement(title, latex) {
    let container = document.getElementById('formulaContainer');
    let div = document.createElement('div');
    div.className = 'formula-item-wrap';
    div.style.position = 'relative';
    div.innerHTML = `
        <button class="accordion-btn" onclick="let c=this.nextElementSibling.nextElementSibling; c.style.maxHeight=c.style.maxHeight?null:c.scrollHeight+'px';" style="background:#181818; color:white; width:100%; padding:15px; text-align:left; border:none; border-radius:5px; margin-top:10px;">${title}</button>
        <i class="fa-solid fa-trash delete-btn" style="position:absolute; top:25px; right:15px;" onclick="this.parentElement.remove(); saveFormulas();"></i>
        <div class="accordion-content" style="max-height:0; overflow:hidden; transition:0.3s; background:var(--surface-card);">
            <div class="latex-data" style="padding:15px; text-align:center; color:white; font-size:1.2em;">$$${latex}$$</div>
        </div>`;
    container.prepend(div);
    if (window.MathJax) { MathJax.typesetPromise(); } 
}

function saveFormulas() {
    let items = [];
    document.querySelectorAll('#formulaContainer .formula-item-wrap').forEach(div => {
        items.push({
            t: div.querySelector('.accordion-btn').innerText,
            l: div.querySelector('.latex-data').innerText.replace(/\$\$/g, '')
        });
    });
    localStorage.setItem('nn_formulas', JSON.stringify(items));
}

function loadFormulas() {
    let saved = localStorage.getItem('nn_formulas');
    if(saved) {
        JSON.parse(saved).reverse().forEach(f => createFormulaElement(f.t, f.l));
    }
}
window.addEventListener('load', loadFormulas);

function logMistake() {
    let type = document.getElementById('mistakeType').value;
    let details = document.getElementById('mistakeDetails').value.trim();
    if (details) {
        createMistakeElement(type, details, false);
        saveMistakes();
        document.getElementById('mistakeDetails').value = "";
    }
}

function createMistakeElement(type, details, isResolved) {
    let list = document.getElementById('mistakeList');
    let li = document.createElement('li');
    li.className = "mistake-item" + (isResolved ? " resolved" : "");
    li.style.position = "relative";
    li.innerHTML = `
        <input type="checkbox" ${isResolved ? 'checked' : ''} onclick="this.parentElement.classList.toggle('resolved', this.checked); saveMistakes();"> 
        <div style="flex-grow:1; padding-right: 20px; margin-left: 10px;">
            <span class="m-type" style="font-size:10px;color:var(--neon-purple);">${type}</span>
            <p class="m-text" style="font-size:13px;">${details}</p>
        </div>
        <i class="fa-solid fa-trash delete-btn" style="position:static; margin-left:auto;" onclick="this.parentElement.remove(); saveMistakes();"></i>`;
    list.prepend(li);
}

function saveMistakes() {
    let items = [];
    document.querySelectorAll('#mistakeList .mistake-item').forEach(li => {
        items.push({
            t: li.querySelector('.m-type').innerText,
            d: li.querySelector('.m-text').innerText,
            r: li.querySelector('input').checked
        });
    });
    localStorage.setItem('nn_mistakes', JSON.stringify(items));
}

function loadMistakes() {
    let saved = localStorage.getItem('nn_mistakes');
    if(saved) {
        JSON.parse(saved).reverse().forEach(m => createMistakeElement(m.t, m.d, m.r));
    }
}

function addTrick() {
    let title = document.getElementById('trickTitle').value.trim();
    let desc = document.getElementById('trickDesc').value.trim();
    if (title && desc) {
        createTrickElement(title, desc);
        saveTricks();
        document.getElementById('trickTitle').value = ""; document.getElementById('trickDesc').value = "";
    }
}

function createTrickElement(title, desc) {
    let slider = document.getElementById('trickSlider');
    let div = document.createElement('div');
    div.className = "trick-card";
    div.style.position = "relative";
    div.innerHTML = `
        <i class="fa-solid fa-trash delete-btn" style="font-size:12px; position:absolute; right:10px; top:10px;" onclick="this.parentElement.remove(); saveTricks();"></i>
        <h4 class="t-title" style="color:var(--neon-purple);margin-bottom:5px; padding-right:15px;">${title}</h4>
        <p class="t-desc" style="font-size:12px;color:var(--text-secondary);">${desc}</p>`;
    slider.prepend(div);
}

function saveTricks() {
    let items = [];
    document.querySelectorAll('#trickSlider .trick-card').forEach(div => {
        items.push({
            t: div.querySelector('.t-title').innerText,
            d: div.querySelector('.t-desc').innerText
        });
    });
    localStorage.setItem('nn_tricks', JSON.stringify(items));
}

function loadTricks() {
    let saved = localStorage.getItem('nn_tricks');
    if(saved) {
        JSON.parse(saved).reverse().forEach(t => createTrickElement(t.t, t.d));
    }
}

// ==========================================
// 4. CHEMISTRY LOGIC (Dynamic Flow & Quizzes)
// ==========================================
function addFlowMap() {
    createFlowMapElement("Map Title...", ["Reactant..."], ["Reagent..."], ["Product..."]);
    saveFlowMaps();
}

function createFlowMapElement(title, nodes, reagents, products) {
    let container = document.getElementById('flowMapContainer');
    let div = document.createElement('div');
    div.className = 'flow-container';
    div.style.position = 'relative';
    
    let innerContent = `
        <i class="fa-solid fa-trash delete-btn" style="position:absolute; top:10px; right:10px; font-size:12px;" onclick="this.parentElement.remove(); saveFlowMaps();"></i>
        <div class="fm-title" contenteditable="true" oninput="saveFlowMaps()" style="color:#00f3ff; font-size:12px; margin-bottom:10px; min-width:100px; text-align:center; border-bottom:1px dashed #333; padding-bottom:3px; outline:none;">${title}</div>
        <div class="flow-node fn-start" contenteditable="true" oninput="saveFlowMaps()">${nodes[0]}</div>`;
        
    for (let i = 0; i < reagents.length; i++) {
        innerContent += `
        <div class="flow-arrow">
            <span class="reagent fm-reagent" contenteditable="true" oninput="saveFlowMaps()" style="border-bottom:1px dashed #444;">${reagents[i]}</span>
            <i class="fa-solid fa-arrow-down"></i>
        </div>
        <div class="flow-node highlight-node fm-product" contenteditable="true" oninput="saveFlowMaps()">${products[i]}</div>`;
    }
    
    innerContent += `<button onclick="addFlowNode(this)" style="background:transparent; border:1px dashed #555; color:#888; font-size:10px; margin-top:15px; cursor:pointer; width:100%; border-radius:4px; padding:5px; transition:0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">+ Add Step</button>`;
    
    div.innerHTML = innerContent;
    container.prepend(div);
}

function addFlowNode(btn) {
    let stepHtml = `
        <div class="flow-arrow">
            <span class="reagent fm-reagent" contenteditable="true" oninput="saveFlowMaps()" style="border-bottom:1px dashed #444;">Reagent...</span>
            <i class="fa-solid fa-arrow-down"></i>
        </div>
        <div class="flow-node highlight-node fm-product" contenteditable="true" oninput="saveFlowMaps()">Product...</div>
    `;
    btn.insertAdjacentHTML('beforebegin', stepHtml);
    saveFlowMaps();
}

function saveFlowMaps() {
    let maps = [];
    document.querySelectorAll('#flowMapContainer .flow-container').forEach(container => {
        let reagents = [];
        let products = [];
        container.querySelectorAll('.fm-reagent').forEach(el => reagents.push(el.innerText));
        container.querySelectorAll('.fm-product').forEach(el => products.push(el.innerText));
        
        maps.push({
            title: container.querySelector('.fm-title').innerText,
            startNode: container.querySelector('.fn-start').innerText,
            reagents: reagents,
            products: products
        });
    });
    localStorage.setItem('nn_flowmaps', JSON.stringify(maps));
}

function loadFlowMaps() {
    let saved = localStorage.getItem('nn_flowmaps');
    if(saved) {
        JSON.parse(saved).reverse().forEach(m => {
            createFlowMapElement(m.title, [m.startNode], m.reagents, m.products);
        });
    }
}

let quizCounter = 0;
function addReactionQuiz() {
    let q = document.getElementById('quizQ').value.trim();
    let a = document.getElementById('quizA').value.trim();
    if (q && a) {
        quizCounter++;
        createReactionQuizElement(q, a);
        saveReactionQuizzes();
        document.getElementById('quizQ').value = ""; document.getElementById('quizA').value = "";
    }
}

function createReactionQuizElement(q, a) {
    let container = document.getElementById('reactionQuizContainer');
    let div = document.createElement('div');
    div.className = 'quiz-box';
    div.style.position = 'relative';
    div.innerHTML = `
        <i class="fa-solid fa-trash delete-btn" style="position:absolute; top:10px; right:10px; font-size:12px;" onclick="this.parentElement.remove(); saveReactionQuizzes();"></i>
        <div class="reaction-display qz-text" style="font-size: 13px; margin-bottom: 15px; margin-top:15px; padding-right:15px;">${q}</div>
        <input type="text" id="dynQuiz${quizCounter}" class="custom-input" placeholder="Product name..." data-answer="${a.toLowerCase()}">
        <button class="btn btn-chem" style="width: 100%;" onclick="checkDynamicQuiz('dynQuiz${quizCounter}')">Submit</button>
    `;
    container.prepend(div);
}

function saveReactionQuizzes() {
    let items = [];
    document.querySelectorAll('#reactionQuizContainer .quiz-box').forEach(div => {
        items.push({
            q: div.querySelector('.qz-text').innerText,
            a: div.querySelector('input').getAttribute('data-answer')
        });
    });
    localStorage.setItem('nn_reaction_quizzes', JSON.stringify(items));
}

function loadReactionQuizzes() {
    let saved = localStorage.getItem('nn_reaction_quizzes');
    if(saved) {
        JSON.parse(saved).reverse().forEach(qz => {
            quizCounter++;
            createReactionQuizElement(qz.q, qz.a);
        });
    }
}

function checkDynamicQuiz(id) {
    let input = document.getElementById(id);
    let correct = input.getAttribute('data-answer');
    if (input.value.trim().toLowerCase() === correct) {
        input.style.borderColor = "var(--neon-green)";
        input.style.color = "var(--neon-green)";
    } else {
        input.style.borderColor = "#ff3366";
        input.style.color = "#ff3366";
    }
}

// ==========================================
// 5. MOCK ENGINE LOGIC
// ==========================================
let mockInterval; let mockSeconds = 12000; let isMockRunning = false; let manualGrades = {}; 

function generateOMR() {
    const omrSheet = document.getElementById('omrSheet');
    if (!omrSheet) return;
    omrSheet.innerHTML = ''; 
    for(let i = 1; i <= 10; i++) {
        omrSheet.innerHTML += `
        <div class="omr-row" data-question="${i}">
            <span style="color:var(--text-secondary); width:35px; font-weight:600;">Q${i}.</span>
            <div style="display: flex; gap: 10px;">
                <div class="bubble" onclick="selectOption(this)">A</div>
                <div class="bubble" onclick="selectOption(this)">B</div>
                <div class="bubble" onclick="selectOption(this)">C</div>
                <div class="bubble" onclick="selectOption(this)">D</div>
            </div>
            <div class="manual-grade" style="display: flex; gap: 15px; margin-left: auto;">
                <i class="fa-solid fa-check grade-icon correct-icon" onclick="setManualGrade(this, 'correct', ${i})"></i>
                <i class="fa-solid fa-xmark grade-icon incorrect-icon" onclick="setManualGrade(this, 'incorrect', ${i})"></i>
            </div>
        </div>`;
    }
}

function selectOption(bubble) {
    const row = bubble.parentElement;
    row.querySelectorAll('.bubble').forEach(b => b.classList.remove('selected'));
    bubble.classList.add('selected');
}

function setManualGrade(icon, status, qNum) {
    const parent = icon.parentElement;
    parent.querySelectorAll('i').forEach(i => i.classList.remove('active-correct', 'active-incorrect'));
    if (status === 'correct') { icon.classList.add('active-correct'); manualGrades[qNum] = 4; } 
    else { icon.classList.add('active-incorrect'); manualGrades[qNum] = -1; }
}

function updateMockTimerDisplay() {
    let h = Math.floor(mockSeconds / 3600).toString().padStart(2, '0');
    let m = Math.floor((mockSeconds % 3600) / 60).toString().padStart(2, '0');
    let s = (mockSeconds % 60).toString().padStart(2, '0');
    const td = document.getElementById('mockTimer');
    if(td) td.innerText = `${h}:${m}:${s}`;
}

function startMockExam() {
    if (isMockRunning) return; 
    isMockRunning = true;
    
    document.getElementById('startMockBtn').style.display = "none";
    document.getElementById('endMockBtn').style.display = "inline-block";
    
    mockInterval = setInterval(() => {
        if (mockSeconds <= 0) { stopMockExam(); return; }
        mockSeconds--;
        updateMockTimerDisplay();
    }, 1000);
}

function stopMockExam() {
    isMockRunning = false;
    clearInterval(mockInterval);
    
    document.getElementById('endMockBtn').style.display = "none";
    const mt = document.getElementById('mockTimer');
    if(mt) mt.innerText = "Exam Ended";
}

function viewMockResult() {
    let correctCount = 0; let incorrectCount = 0;
    for(let i=1; i<=10; i++) {
        if(manualGrades[i] === 4) correctCount++;
        else if(manualGrades[i] === -1) incorrectCount++;
    }
    let finalScore = (correctCount * 4) - (incorrectCount * 1);
    
    let resultContainer = document.getElementById('dynamicResultsDisplayContainer');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="score-grid" style="margin-top: 20px;">
                <div class="score-box" style="border-color: var(--neon-green);">
                    <div style="font-size:12px; color:var(--text-secondary);">Correct</div>
                    <h2 class="correct">${correctCount}</h2>
                </div>
                <div class="score-box" style="border-color: #ff3366;">
                    <div style="font-size:12px; color:var(--text-secondary);">Incorrect</div>
                    <h2 class="incorrect">${incorrectCount}</h2>
                </div>
                <div class="score-box" style="border-color: var(--electric-blue); background: rgba(0, 60, 255, 0.1);">
                    <div style="font-size:12px; color:var(--electric-blue);">Total Score</div>
                    <h2 style="color: var(--electric-blue);">${finalScore} <span style="font-size:14px;">/ 40</span></h2>
                </div>
            </div>
        `;
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

function resetMockExam() {
    clearInterval(mockInterval);
    isMockRunning = false;
    mockSeconds = 12000; 
    
    const mt = document.getElementById('mockTimer');
    if(mt) mt.innerText = "03:20:00";
    
    document.getElementById('startMockBtn').style.display = "inline-block";
    document.getElementById('endMockBtn').style.display = "none";
    
    generateOMR();
    manualGrades = {};
    
    const rc = document.getElementById('dynamicResultsDisplayContainer');
    if (rc) rc.innerHTML = "";
}

// ==========================================
// 6. DYNAMIC PYQ VAULT 
// ==========================================
function addPYQ() {
    let yr = document.getElementById('pyqYear').value;
    let sub = document.getElementById('pyqSub').value;
    let q = document.getElementById('pyqQ').value.trim();
    let a = document.getElementById('pyqA').value.trim();
    
    if (q && a) {
        createPYQElement(yr, sub, q, a);
        savePYQs();
        document.getElementById('pyqQ').value = ""; document.getElementById('pyqA').value = "";
    }
}

function createPYQElement(yr, sub, q, a) {
    let grid = document.getElementById('pyqGrid');
    let color = sub === "Physics" ? "var(--neon-purple)" : sub === "Chemistry" ? "var(--neon-cyan)" : "var(--neon-green)";
    
    let div = document.createElement('div');
    div.className = "card pyq-card pyq-item";
    div.setAttribute('data-year', yr);
    div.setAttribute('data-sub', sub);
    div.style.borderLeftColor = color;
    div.style.position = "relative";
    
    div.innerHTML = `
        <i class="fa-solid fa-trash delete-btn" style="position:absolute; top:15px; right:15px;" onclick="this.parentElement.remove(); savePYQs();"></i>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; padding-right: 30px;">
            <span class="pyq-tag" style="color:${color}; background:rgba(255,255,255,0.05);">${yr} • ${sub}</span> 
            <i class="fa-regular fa-star bookmark-btn" onclick="this.classList.toggle('fa-solid'); this.classList.toggle('fa-regular');" style="color:#555; cursor:pointer;"></i>
        </div>
        <div class="pq-question-text"><p>${q}</p></div>
        <button class="btn-pyq-outline" onclick="let ans = this.nextElementSibling; ans.style.display = ans.style.display === 'block' ? 'none' : 'block'"><i class="fa-solid fa-eye"></i> View Answer</button>
        <div class="pyq-solution" style="display:none; margin-top:10px; background:#0a0a0a; padding:15px; border-radius:5px;">
            <p style="color:var(--neon-green); margin-bottom:5px;">Solution:</p><p class="pq-sol-text" style="font-size:13px; color:var(--text-secondary);">${a}</p>
        </div>
    `;
    grid.prepend(div);
}

function savePYQs() {
    let items = [];
    document.querySelectorAll('#pyqGrid .pyq-item').forEach(div => {
        items.push({
            yr: div.getAttribute('data-year'),
            sub: div.getAttribute('data-sub'),
            q: div.querySelector('.pq-question-text p').innerText,
            a: div.querySelector('.pq-sol-text').innerText
        });
    });
    localStorage.setItem('nn_pyqs', JSON.stringify(items));
}

function loadPYQs() {
    let saved = localStorage.getItem('nn_pyqs');
    if(saved) {
        JSON.parse(saved).reverse().forEach(pq => createPYQElement(pq.yr, pq.sub, pq.q, pq.a));
    }
}

function resetPYQ() {
    if(confirm("Are you sure you want to delete all saved PYQs permanently?")) {
        document.getElementById('pyqGrid').innerHTML = "";
        localStorage.removeItem('nn_pyqs');
    }
}

function applyPYQFilters() {
    let fYear = document.getElementById('filterYear').value;
    let fSub = document.getElementById('filterSub').value;
    
    document.querySelectorAll('.pyq-item').forEach(item => {
        let y = item.getAttribute('data-year');
        let s = item.getAttribute('data-sub');
        let show = true;
        
        if(fYear !== 'all' && y !== fYear) show = false;
        if(fSub !== 'all' && s !== fSub) show = false;
        
        item.style.display = show ? "block" : "none";
    });
}
document.getElementById("btn1").addEventListener("click", () => {
  window.location.href="main.html"
})