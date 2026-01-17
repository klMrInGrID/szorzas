// Game State
let state = {
    mode: 'multiplication', // 'multiplication' or 'division'
    selectedNumbers: [],
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    isGameActive: false
};

// DOM Elements
const configScreen = document.getElementById('config-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const numbersGrid = document.querySelector('.numbers-grid');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const scoreDisplay = document.getElementById('score-display');
const progressBar = document.querySelector('.progress-fill');
const finalScore = document.getElementById('final-score');
const feedbackText = document.getElementById('feedback-text');

// Init
function init() {
    renderNumberSelection();
    // Default: Clear selection or select none? 
    // Let's uncheck all initially so user consciously selects numbers. 
    toggleAllNumbers(false);
}

// --- Config Screen Logic ---

function selectMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function renderNumberSelection() {
    numbersGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const label = document.createElement('label');
        label.className = 'num-checkbox';
        label.innerHTML = `
            <input type="checkbox" value="${i}" class="num-select" onchange="handleSingleSelection(this)">
            <div class="num-label">${i}</div>
        `;
        numbersGrid.appendChild(label);
    }
}

function handleSingleSelection(targetCheckbox) {
    // If the user checked a box, uncheck all others
    if (targetCheckbox.checked) {
        document.querySelectorAll('.num-select').forEach(cb => {
            if (cb !== targetCheckbox) cb.checked = false;
        });
    }
    updateSelectedNumbers();
}

function updateSelectedNumbers() {
    const checkboxes = document.querySelectorAll('.num-select:checked');
    state.selectedNumbers = Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function toggleAllNumbers(forceState = null) {
    const checkboxes = document.querySelectorAll('.num-select');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const newState = forceState !== null ? forceState : !allChecked;

    checkboxes.forEach(cb => cb.checked = newState);
    updateSelectedNumbers();
}

function practiceAll() {
    toggleAllNumbers(true);
    startGame();
}

function showConfig() {
    showScreen(configScreen);
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// --- Game Logic ---

function startGame() {
    updateSelectedNumbers();
    if (state.selectedNumbers.length === 0) {
        alert('Válassz legalább egy számot!');
        return;
    }

    state.score = 0;
    state.currentQuestionIndex = 0;
    state.questions = generateQuestions();
    state.isGameActive = true;

    showScreen(gameScreen);
    loadQuestion();
    updateStats();
}

function generateQuestions() {
    const allPossibleQuestions = [];

    // Generate all valid combinations
    state.selectedNumbers.forEach(num1 => {
        for (let num2 = 1; num2 <= 10; num2++) {
            if (state.mode === 'multiplication') {
                allPossibleQuestions.push({
                    type: 'mult',
                    n1: num1,
                    n2: num2,
                    correct: num1 * num2,
                    text: `${num1} × ${num2}`
                });
            } else {
                const product = num1 * num2;
                allPossibleQuestions.push({
                    type: 'div',
                    n1: product,
                    n2: num1,
                    correct: num2,
                    text: `${product} : ${num1}`
                });
            }
        }
    });

    // Shuffle
    allPossibleQuestions.sort(() => Math.random() - 0.5);

    // Take first 10
    return allPossibleQuestions.slice(0, 10);
}

function loadQuestion() {
    if (state.currentQuestionIndex >= state.questions.length) {
        endGame();
        return;
    }

    const q = state.questions[state.currentQuestionIndex];
    questionText.textContent = q.text + ' = ?';

    // Generate answers
    const answers = generateAnswers(q.correct);
    renderAnswers(answers, q.correct);
}

function generateAnswers(correct) {
    const answers = new Set([correct]);
    while (answers.size < 4) {
        // Generate distracting wrong answer
        // Strategy: close numbers, or numbers from same table
        let wrong;
        if (Math.random() > 0.5) {
            wrong = correct + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
        } else {
            // completely random but positive
            wrong = Math.floor(Math.random() * 100) + 1;
        }

        if (wrong > 0 && wrong !== correct) {
            answers.add(wrong);
        }
    }
    // Shuffle
    return Array.from(answers).sort(() => Math.random() - 0.5);
}

function renderAnswers(answers, correctVal) {
    answersContainer.innerHTML = '';
    answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = ans;
        btn.onclick = () => handleAnswer(ans, correctVal, btn);
        answersContainer.appendChild(btn);
    });
}

function handleAnswer(selected, correct, btnElement) {
    if (!state.isGameActive) return;

    // Disable all buttons to prevent double click
    const allBtns = document.querySelectorAll('.answer-btn');
    allBtns.forEach(b => b.disabled = true);

    if (selected === correct) {
        btnElement.classList.add('correct');
        state.score++;
        // Confetti could go here
    } else {
        btnElement.classList.add('wrong');
        // Highlight correct one
        allBtns.forEach(b => {
            if (parseInt(b.textContent) === correct) b.classList.add('correct');
        });
    }

    state.currentQuestionIndex++;
    updateStats();

    // Next question delay
    setTimeout(() => {
        loadQuestion();
    }, 1500);
}

function updateStats() {
    scoreDisplay.textContent = `Pont: ${state.score}`;
    const progress = (state.currentQuestionIndex / state.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function quitGame() {
    if (confirm('Biztosan ki akarsz lépni?')) {
        showConfig();
    }
}

function endGame() {
    state.isGameActive = false;
    showScreen(resultScreen);
    finalScore.textContent = `${state.score} / ${state.questions.length}`;

    // Feedback
    const percentage = state.score / state.questions.length;
    if (percentage === 1) feedbackText.textContent = "Tökéletes! Zseni vagy! 🌟";
    else if (percentage >= 0.8) feedbackText.textContent = "Nagyon szép munka! 🔥";
    else if (percentage >= 0.5) feedbackText.textContent = "Jól haladsz, csak így tovább! 👍";
    else feedbackText.textContent = "Gyakorlás teszi a mestert! Próbáld újra! 💪";
}

function restartGame() {
    startGame();
}

// Start
init();
