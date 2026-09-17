const MATCH_SIZE = 10;
const STORAGE_KEY = 'texPassaRepassaUsedQuestionsV3';
function loadUsed(){try{return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'))}catch(e){return new Set()}}
function saveUsed(set){localStorage.setItem(STORAGE_KEY,JSON.stringify([...set]))}
function shuffled(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function buildMatch(){
  let used=loadUsed(); let available=QUESTION_BANK.filter(q=>!used.has(q.id));
  if(available.length<MATCH_SIZE){used=new Set();available=[...QUESTION_BANK]}
  const byCat={}; shuffled(available).forEach(q=>(byCat[q.category]??=[]).push(q));
  const cats=shuffled(Object.keys(byCat)); const pick=[];
  while(pick.length<MATCH_SIZE){let moved=false;for(const c of cats){if(byCat[c].length&&pick.length<MATCH_SIZE){pick.push(byCat[c].pop());moved=true}}if(!moved)break}
  pick.forEach(q=>used.add(q.id)); saveUsed(used); return pick;
}
let questions=buildMatch();

let index=0,scores={A:0,D:0},lockedTeam=null,timeLeft=15,timerId=null,answerShown=false;
const $=id=>document.getElementById(id), teamA=$('teamA'),teamB=$('teamB'),scoreA=$('scoreA'),scoreB=$('scoreB'),timer=$('timer'),status=$('status'),answers=$('answers'),passBtn=$('passBtn');
function pad(n){return String(n).padStart(2,'0')}
function renderQuestion(){const item=questions[index];$('questionNumber').textContent=index+1;$('questionBadge').textContent=pad(index+1);$('category').textContent=item.category;$('question').textContent=item.q;answers.innerHTML='';item.options.forEach((text,i)=>{const div=document.createElement('div');div.className='answer';div.dataset.index=i;div.textContent=`${String.fromCharCode(65+i)}) ${text}`;div.addEventListener('click',()=>chooseAnswer(i));answers.appendChild(div)});answerShown=false;resetRound()}
function updateScores(){scoreA.textContent=pad(scores.A);scoreB.textContent=pad(scores.D)}
function resetRound(){lockedTeam=null;teamA.classList.remove('active');teamB.classList.remove('active');status.textContent='AGUARDANDO RESPOSTA...';passBtn.disabled=true;timeLeft=15;timer.textContent=timeLeft;$('timerRing').classList.remove('warning');stopTimer()}
function buzz(team){if(lockedTeam)return;lockedTeam=team;stopTimer();const name=team==='A'?'EQUIPE AZUL':'EQUIPE VERMELHA';(team==='A'?teamA:teamB).classList.add('active');status.textContent=`${name} APERTOU PRIMEIRO!`;passBtn.disabled=false;playBuzz(team);flash(team)}
let audioCtx=null;
function getAudioCtx(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    return audioCtx;
  }catch(e){return null}
}
function tone(freq,dur=.16,type='square',vol=.16,delay=0){
  const ctx=getAudioCtx(); if(!ctx)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+delay;
  osc.type=type; osc.frequency.setValueAtTime(freq,t);
  gain.gain.setValueAtTime(.001,t); gain.gain.exponentialRampToValueAtTime(vol,t+.012);
  gain.gain.exponentialRampToValueAtTime(.001,t+dur);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t+dur+.03)
}
function playSiren(){
  const ctx=getAudioCtx(); if(!ctx)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;
  osc.type='square';
  osc.frequency.setValueAtTime(620,t);
  // Sirene mais longa: aproximadamente 1,6 s (o dobro da versão anterior).
  for(let i=0;i<15;i++){
    osc.frequency.linearRampToValueAtTime(i%2===0?1080:620,t+.1*(i+1));
  }
  gain.gain.setValueAtTime(.001,t); gain.gain.linearRampToValueAtTime(.19,t+.025);
  gain.gain.setValueAtTime(.19,t+1.42); gain.gain.exponentialRampToValueAtTime(.001,t+1.58);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t+1.6)
}
function playApplause(){
  const ctx=getAudioCtx(); if(!ctx)return;
  const duration=1.7, buffer=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*.22;
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),t=ctx.currentTime;
  filter.type='bandpass'; filter.frequency.value=1500; filter.Q.value=.55;
  src.buffer=buffer; src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(.001,t);
  for(let i=0;i<18;i++){
    const tt=t+i*.085+Math.random()*.03;
    gain.gain.linearRampToValueAtTime(.12+Math.random()*.12,tt+.018);
    gain.gain.exponentialRampToValueAtTime(.018,tt+.065);
  }
  gain.gain.exponentialRampToValueAtTime(.001,t+duration);
  src.start(t); src.stop(t+duration)
}
function playFail(){
  // “qué, qué, qué, quééé...” clássico, em queda.
  tone(390,.18,'sawtooth',.15,0);
  tone(330,.18,'sawtooth',.15,.21);
  tone(270,.18,'sawtooth',.15,.42);
  tone(205,.68,'sawtooth',.17,.63);
}
function playBuzz(){playSiren()}
function flash(team){const el=$('flash');el.className=`flash ${team==='A'?'blue':'red'}`;setTimeout(()=>el.className='flash',260)}
function startTimer(){if(timerId){stopTimer();status.textContent='CRONÔMETRO PAUSADO';return}if(timeLeft<=0)timeLeft=15;status.textContent=lockedTeam?status.textContent:'VALENDO! APERTE A OU D!';timerId=setInterval(()=>{timeLeft--;timer.textContent=timeLeft;$('timerRing').classList.toggle('warning',timeLeft<=5);if(timeLeft<=0){stopTimer();status.textContent='TEMPO ESGOTADO!';passBtn.disabled=true;playTimeout()}},1000)}
function stopTimer(){if(timerId)clearInterval(timerId);timerId=null}
function playTimeout(){tone(190,.45,'sawtooth',.13);setTimeout(()=>tone(130,.35,'sawtooth',.11),180)}
function chooseAnswer(selectedIndex) {
  if (!lockedTeam || answerShown) return;
  const item = questions[index];
  const selected = answers.querySelector(`[data-index="${selectedIndex}"]`);
  answerShown = true;
  passBtn.disabled = true;
  stopTimer();

  if (selectedIndex === item.answer) {
    selected.classList.add('correct');
    scores[lockedTeam] += 10;
    updateScores();
    status.textContent = `${lockedTeam === 'A' ? 'EQUIPE AZUL' : 'EQUIPE VERMELHA'} ACERTOU! +10 PONTOS.`;
    playApplause(); celebrate();
  } else {
    if (selected) selected.classList.add('wrong-answer');
    const correct = answers.querySelector(`[data-index="${item.answer}"]`);
    if (correct) correct.classList.add('correct');
    status.textContent = `${lockedTeam === 'A' ? 'EQUIPE AZUL' : 'EQUIPE VERMELHA'} ERROU!`;
    playFail();
  }
}

function passTurn() {
  if (!lockedTeam || answerShown) return;
  const oldTeam = lockedTeam;
  lockedTeam = oldTeam === 'A' ? 'D' : 'A';
  teamA.classList.toggle('active', lockedTeam === 'A');
  teamB.classList.toggle('active', lockedTeam === 'D');
  const name = lockedTeam === 'A' ? 'Equipe Azul' : 'Equipe Vermelha';
  status.textContent = `PASSOU! Agora é a vez da ${name}.`;
  flash(lockedTeam);
  playBuzz(lockedTeam);
}

function showAnswer(){if(answerShown)return;answerShown=true;const item=questions[index],el=answers.querySelector(`[data-index="${item.answer}"]`);if(el)el.classList.add('correct')}
function showGameOver(){stopTimer();passBtn.disabled=true;const over=$('gameOver');$('finalA').textContent=pad(scores.A);$('finalB').textContent=pad(scores.D);if(scores.A>scores.D){$('winnerTitle').textContent='EQUIPE AZUL VENCEU!';$('winnerText').textContent='Mandou bem! A equipe azul levou essa rodada.'}else if(scores.D>scores.A){$('winnerTitle').textContent='EQUIPE VERMELHA VENCEU!';$('winnerText').textContent='Mandou bem! A equipe vermelha levou essa rodada.'}else{$('winnerTitle').textContent='EMPATE!';$('winnerText').textContent='Essa foi no limite. As equipes terminaram com a mesma pontuação.'}over.hidden=false;celebrate()}
function newMatch(){scores={A:0,D:0};index=0;questions=buildMatch();updateScores();$('gameOver').hidden=true;renderQuestion()}
function nextQuestion(){if(index>=questions.length-1){showGameOver();return}index++;renderQuestion()}
function celebrate(){const layer=$('confettiLayer'),colors=['#ffd600','#ff1bd1','#1677ff','#62ff71','#ff203c','#ffffff'];for(let i=0;i<80;i++){const c=document.createElement('i');c.className='confetti';c.style.left=Math.random()*100+'vw';c.style.background=colors[Math.floor(Math.random()*colors.length)];c.style.setProperty('--dx',`${(Math.random()-.5)*360}px`);c.style.animationDelay=(Math.random()*.25)+'s';c.style.transform=`rotate(${Math.random()*180}deg)`;layer.appendChild(c);setTimeout(()=>c.remove(),2300)}}
$('startBtn').addEventListener('click',startTimer);passBtn.addEventListener('click',passTurn);$('showAnswerBtn').addEventListener('click',showAnswer);$('nextBtn').addEventListener('click',nextQuestion);$('resetBtn').addEventListener('click',newMatch);$('newMatchBtn').addEventListener('click',newMatch);
document.addEventListener('keydown',e=>{if(e.repeat)return;const key=e.key.toLowerCase();if(key==='a')buzz('A');if(key==='d')buzz('D');if(key==='n')nextQuestion();if(key==='r')resetRound();if(key==='p')passTurn();if(e.code==='Space'){e.preventDefault();startTimer()}});
updateScores();renderQuestion();
