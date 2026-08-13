const questions = [
  { category:'Geografia', q:'Qual é a capital da Austrália?', options:['Sydney','Melbourne','Canberra','Perth'], answer:2 },
  { category:'Ciência', q:'Qual planeta é conhecido como Planeta Vermelho?', options:['Vênus','Marte','Júpiter','Mercúrio'], answer:1 },
  { category:'Brasil', q:'Em qual região brasileira fica o estado do Amazonas?', options:['Norte','Nordeste','Centro-Oeste','Sudeste'], answer:0 },
  { category:'História', q:'Em que ano o homem pisou na Lua pela primeira vez?', options:['1965','1969','1972','1975'], answer:1 },
  { category:'Esportes', q:'Quantos jogadores cada time tem em campo no futebol tradicional?', options:['9','10','11','12'], answer:2 },
  { category:'Entretenimento', q:'Qual personagem vive na cidade fictícia de Gotham?', options:['Superman','Batman','Homem-Aranha','Flash'], answer:1 },
  { category:'Matemática', q:'Quanto é 12 x 8?', options:['86','92','96','108'], answer:2 },
  { category:'Natureza', q:'Qual é o maior animal terrestre atualmente?', options:['Rinoceronte','Hipopótamo','Elefante-africano','Girafa'], answer:2 },
  { category:'Tecnologia', q:'O que significa a sigla USB?', options:['Universal Serial Bus','United System Base','User Signal Bridge','Universal System Board'], answer:0 },
  { category:'Conhecimentos Gerais', q:'Quantos lados tem um hexágono?', options:['5','6','7','8'], answer:1 }
];

let index = 0;
let scores = { A: 0, D: 0 };
let lockedTeam = null;
let timeLeft = 15;
let timerId = null;
let answerShown = false;

const $ = (id) => document.getElementById(id);
const teamA = $('teamA');
const teamB = $('teamB');
const scoreA = $('scoreA');
const scoreB = $('scoreB');
const timer = $('timer');
const status = $('status');
const answers = $('answers');
const correctBtn = $('correctBtn');
const wrongBtn = $('wrongBtn');

function renderQuestion() {
  const item = questions[index];
  $('questionNumber').textContent = index + 1;
  $('category').textContent = item.category;
  $('question').textContent = item.q;
  answers.innerHTML = '';
  item.options.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'answer';
    div.dataset.index = i;
    div.textContent = `${String.fromCharCode(65+i)}) ${text}`;
    answers.appendChild(div);
  });
  answerShown = false;
  resetRound();
}

function updateScores() {
  scoreA.textContent = scores.A;
  scoreB.textContent = scores.D;
}

function resetRound() {
  lockedTeam = null;
  teamA.classList.remove('active');
  teamB.classList.remove('active');
  status.textContent = 'Pressione A ou D para disputar a resposta.';
  correctBtn.disabled = true;
  wrongBtn.disabled = true;
  timeLeft = 15;
  timer.textContent = timeLeft;
  stopTimer();
}

function buzz(team) {
  if (lockedTeam) return;
  lockedTeam = team;
  stopTimer();
  const name = team === 'A' ? 'Equipe Azul' : 'Equipe Vermelha';
  const target = team === 'A' ? teamA : teamB;
  target.classList.add('active');
  status.textContent = `${name} apertou primeiro! Responda agora.`;
  correctBtn.disabled = false;
  wrongBtn.disabled = false;
  playBuzz(team);
  flash(team);
}

function flash(team) {
  const el = $('flash');
  el.className = `flash ${team === 'A' ? 'blue' : 'red'}`;
  setTimeout(() => el.className = 'flash', 180);
}

function playBuzz(team) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = team === 'A' ? 520 : 390;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.16);
  } catch (e) {}
}

function startTimer() {
  if (timerId) { stopTimer(); return; }
  if (timeLeft <= 0) timeLeft = 15;
  status.textContent = lockedTeam ? status.textContent : 'Cronômetro rodando... A ou D para responder.';
  timerId = setInterval(() => {
    timeLeft--;
    timer.textContent = timeLeft;
    if (timeLeft <= 0) {
      stopTimer();
      status.textContent = 'Tempo esgotado!';
      correctBtn.disabled = true;
      wrongBtn.disabled = true;
      playTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function playTimeout() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function markCorrect() {
  if (!lockedTeam) return;
  scores[lockedTeam] += 10;
  updateScores();
  status.textContent = `${lockedTeam === 'A' ? 'Equipe Azul' : 'Equipe Vermelha'} acertou! +10 pontos.`;
  correctBtn.disabled = true;
  wrongBtn.disabled = true;
  showAnswer();
}

function markWrong() {
  if (!lockedTeam) return;
  status.textContent = `${lockedTeam === 'A' ? 'Equipe Azul' : 'Equipe Vermelha'} errou. Pressione R para liberar os botões ou avance.`;
  correctBtn.disabled = true;
  wrongBtn.disabled = true;
  showAnswer();
}

function showAnswer() {
  if (answerShown) return;
  answerShown = true;
  const item = questions[index];
  const el = answers.querySelector(`[data-index="${item.answer}"]`);
  if (el) el.classList.add('correct');
}

function nextQuestion() {
  index = (index + 1) % questions.length;
  renderQuestion();
}

$('startBtn').addEventListener('click', startTimer);
correctBtn.addEventListener('click', markCorrect);
wrongBtn.addEventListener('click', markWrong);
$('showAnswerBtn').addEventListener('click', showAnswer);
$('nextBtn').addEventListener('click', nextQuestion);
$('resetBtn').addEventListener('click', () => {
  scores = { A:0, D:0 }; index = 0; updateScores(); renderQuestion();
});

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  if (key === 'a') buzz('A');
  if (key === 'd') buzz('D');
  if (key === 'n') nextQuestion();
  if (key === 'r') resetRound();
  if (e.code === 'Space') { e.preventDefault(); startTimer(); }
});

updateScores();
renderQuestion();
