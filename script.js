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
let index=0,scores={A:0,D:0},lockedTeam=null,timeLeft=15,timerId=null,answerShown=false;
const $=id=>document.getElementById(id), teamA=$('teamA'),teamB=$('teamB'),scoreA=$('scoreA'),scoreB=$('scoreB'),timer=$('timer'),status=$('status'),answers=$('answers'),correctBtn=$('correctBtn'),wrongBtn=$('wrongBtn');
function pad(n){return String(n).padStart(2,'0')}
function renderQuestion(){const item=questions[index];$('questionNumber').textContent=index+1;$('questionBadge').textContent=pad(index+1);$('category').textContent=item.category;$('question').textContent=item.q;answers.innerHTML='';item.options.forEach((text,i)=>{const div=document.createElement('div');div.className='answer';div.dataset.index=i;div.textContent=`${String.fromCharCode(65+i)}) ${text}`;answers.appendChild(div)});answerShown=false;resetRound()}
function updateScores(){scoreA.textContent=pad(scores.A);scoreB.textContent=pad(scores.D)}
function resetRound(){lockedTeam=null;teamA.classList.remove('active');teamB.classList.remove('active');status.textContent='AGUARDANDO RESPOSTA...';correctBtn.disabled=true;wrongBtn.disabled=true;timeLeft=15;timer.textContent=timeLeft;$('timerRing').classList.remove('warning');stopTimer()}
function buzz(team){if(lockedTeam)return;lockedTeam=team;stopTimer();const name=team==='A'?'EQUIPE AZUL':'EQUIPE VERMELHA';(team==='A'?teamA:teamB).classList.add('active');status.textContent=`${name} APERTOU PRIMEIRO!`;correctBtn.disabled=false;wrongBtn.disabled=false;playBuzz(team);flash(team)}
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
function startTimer(){if(timerId){stopTimer();status.textContent='CRONÔMETRO PAUSADO';return}if(timeLeft<=0)timeLeft=15;status.textContent=lockedTeam?status.textContent:'VALENDO! APERTE A OU D!';timerId=setInterval(()=>{timeLeft--;timer.textContent=timeLeft;$('timerRing').classList.toggle('warning',timeLeft<=5);if(timeLeft<=0){stopTimer();status.textContent='TEMPO ESGOTADO!';correctBtn.disabled=true;wrongBtn.disabled=true;playTimeout()}},1000)}
function stopTimer(){if(timerId)clearInterval(timerId);timerId=null}
function playTimeout(){tone(190,.45,'sawtooth',.13);setTimeout(()=>tone(130,.35,'sawtooth',.11),180)}
function markCorrect(){if(!lockedTeam)return;scores[lockedTeam]+=10;updateScores();status.textContent=`${lockedTeam==='A'?'EQUIPE AZUL':'EQUIPE VERMELHA'} ACERTOU! +10`;correctBtn.disabled=true;wrongBtn.disabled=true;showAnswer();celebrate();playApplause()}
function markWrong(){if(!lockedTeam)return;status.textContent=`${lockedTeam==='A'?'EQUIPE AZUL':'EQUIPE VERMELHA'} ERROU!`;correctBtn.disabled=true;wrongBtn.disabled=true;showAnswer();playFail()}
function showAnswer(){if(answerShown)return;answerShown=true;const item=questions[index],el=answers.querySelector(`[data-index="${item.answer}"]`);if(el)el.classList.add('correct')}
function nextQuestion(){index=(index+1)%questions.length;renderQuestion()}
function celebrate(){const layer=$('confettiLayer'),colors=['#ffd600','#ff1bd1','#1677ff','#62ff71','#ff203c','#ffffff'];for(let i=0;i<80;i++){const c=document.createElement('i');c.className='confetti';c.style.left=Math.random()*100+'vw';c.style.background=colors[Math.floor(Math.random()*colors.length)];c.style.setProperty('--dx',`${(Math.random()-.5)*360}px`);c.style.animationDelay=(Math.random()*.25)+'s';c.style.transform=`rotate(${Math.random()*180}deg)`;layer.appendChild(c);setTimeout(()=>c.remove(),2300)}}
$('startBtn').addEventListener('click',startTimer);correctBtn.addEventListener('click',markCorrect);wrongBtn.addEventListener('click',markWrong);$('showAnswerBtn').addEventListener('click',showAnswer);$('nextBtn').addEventListener('click',nextQuestion);$('resetBtn').addEventListener('click',()=>{scores={A:0,D:0};index=0;updateScores();renderQuestion()});
document.addEventListener('keydown',e=>{if(e.repeat)return;const key=e.key.toLowerCase();if(key==='a')buzz('A');if(key==='d')buzz('D');if(key==='n')nextQuestion();if(key==='r')resetRound();if(e.code==='Space'){e.preventDefault();startTimer()}});
updateScores();renderQuestion();
