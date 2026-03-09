// ===== GLOBAL STATE =====
const STATE = {
  name: '', avatar: '', level: 'beginner', xp: 0, gamesPlayed: 0,
  bestCombo: 0, totalScore: 0, soundOn: true, volume: 0.5,
  bestScores: {space:0,flappy:0,asteroid:0,whack:0},
  leaderboard: [], emojiAvatar: '🎮'
};

const QUOTES = [
  "Every pixel tells a story...",
  "Loading your gaming destiny...",
  "Calibrating fun levels...",
  "Charging the turbo engines...",
  "Summoning high scores...",
  "Warming up the joystick...",
  "The moles are hiding...",
  "Asteroids incoming...",
  "Ready player one?"
];

const LEVELS_XP = [{name:'ROOKIE',min:0,max:500},{name:'PLAYER',min:500,max:2000},{name:'PRO',min:2000,max:5000},{name:'LEGEND',min:5000,max:Infinity}];
const AVATAR_STYLES = ['adventurer','adventurer-neutral','avataaars','big-ears','big-ears-neutral','bottts','croodles','fun-emoji','icons','identicon','initials','lorelei','micah','miniavs','notionists','open-peeps','personas','pixel-art','shapes'];

// ===== AUDIO ENGINE =====
let audioCtx;
function getAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function playTone(freq,type='sine',dur=0.1,vol=0.3,decay=true){
  if(!STATE.soundOn)return;
  try{
    const ctx=getAudio(),o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);
    g.gain.setValueAtTime(vol*STATE.volume,ctx.currentTime);
    if(decay)g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
    o.start();o.stop(ctx.currentTime+dur);
  }catch(e){}
}
const SFX={
  shoot:()=>{playTone(800,'square',0.08,0.2);playTone(1200,'square',0.05,0.15)},
  hit:()=>{playTone(200,'sawtooth',0.15,0.3);playTone(150,'sawtooth',0.1,0.2)},
  point:()=>{playTone(600,'sine',0.1,0.2);setTimeout(()=>playTone(900,'sine',0.08,0.15),80)},
  levelUp:()=>{[400,500,600,800].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.2,0.3),i*100))},
  die:()=>{[400,300,200,100].forEach((f,i)=>setTimeout(()=>playTone(f,'sawtooth',0.15,0.4),i*80))},
  flap:()=>{playTone(300,'sine',0.06,0.15)},
  whack:()=>{playTone(500,'square',0.1,0.3);playTone(300,'square',0.08,0.2)},
  powerup:()=>{[300,400,500,700,1000].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.15,0.3),i*60))},
  click:()=>{playTone(800,'sine',0.05,0.1)},
  select:()=>{playTone(600,'sine',0.08,0.1);setTimeout(()=>playTone(900,'sine',0.06,0.08),60)}
};

// ===== PARTICLE BACKGROUND =====
const pbCanvas=document.getElementById('particle-bg');
const pbCtx=pbCanvas.getContext('2d');
let particles=[],mouse={x:0,y:0};
function resizeParticles(){pbCanvas.width=window.innerWidth;pbCanvas.height=window.innerHeight}
function initParticles(){
  particles=[];
  const n=Math.min(80,Math.floor(window.innerWidth*window.innerHeight/12000));
  for(let i=0;i<n;i++)particles.push({
    x:Math.random()*pbCanvas.width,y:Math.random()*pbCanvas.height,
    vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,
    r:Math.random()*2+1,alpha:Math.random()*.5+.1
  });
}
function drawParticles(){
  pbCtx.clearRect(0,0,pbCanvas.width,pbCanvas.height);
  particles.forEach(p=>{
    const dx=p.x-mouse.x,dy=p.y-mouse.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<100){p.vx+=dx/dist*.05;p.vy+=dy/dist*.05}
    p.vx*=.99;p.vy*=.99;
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0||p.x>pbCanvas.width)p.vx*=-1;
    if(p.y<0||p.y>pbCanvas.height)p.vy*=-1;
    pbCtx.beginPath();pbCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    pbCtx.fillStyle=`rgba(124,58,237,${p.alpha})`;pbCtx.fill();
  });
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){
        pbCtx.beginPath();pbCtx.moveTo(particles[i].x,particles[i].y);
        pbCtx.lineTo(particles[j].x,particles[j].y);
        pbCtx.strokeStyle=`rgba(124,58,237,${.15*(1-d/120)})`;
        pbCtx.lineWidth=.5;pbCtx.stroke();
      }
    }
  }
  requestAnimationFrame(drawParticles);
}
window.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
resizeParticles();initParticles();drawParticles();
window.addEventListener('resize',()=>{resizeParticles();initParticles()});

// ===== LOADING =====
function runLoading(){
  const bar=document.getElementById('loadBar'),pct=document.getElementById('loadPct'),quote=document.getElementById('loadQuote');
  let p=0,qi=0;
  const interval=setInterval(()=>{
    p+=Math.random()*4+1;if(p>100)p=100;
    bar.style.width=p+'%';pct.textContent=Math.floor(p)+'%';
    if(p>=100){clearInterval(interval);setTimeout(()=>showScreen('name-screen'),400)}
  },60);
  setInterval(()=>{
    quote.style.opacity='0';
    setTimeout(()=>{quote.textContent=QUOTES[qi++%QUOTES.length];quote.style.opacity='1'},400);
  },1800);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ===== AVATAR PICKER =====
let currentStyle=AVATAR_STYLES[6],selectedSeed='seed1',avatarOpen=false;
function buildAvatarStyles(){
  const tabs=document.getElementById('styleTabs');
  AVATAR_STYLES.forEach((s,i)=>{
    const t=document.createElement('div');
    t.className='style-tab'+(i===6?' active':'');
    t.textContent=s;t.dataset.style=s;
    t.onclick=()=>{
      currentStyle=s;document.querySelectorAll('.style-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');loadAvatars();SFX.click();
    };tabs.appendChild(t);
  });
}
function dicebearUrl(style,seed){return`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`}
function loadAvatars(){
  const grid=document.getElementById('avatarGrid');grid.innerHTML='';
  for(let i=0;i<18;i++){
    const seed='user'+i,url=dicebearUrl(currentStyle,seed);
    const item=document.createElement('div');item.className='avatar-item'+(seed===selectedSeed?' selected':'');
    const img=document.createElement('img');img.src=url;img.alt='avatar';img.loading='lazy';
    item.appendChild(img);
    item.onclick=()=>{
      selectedSeed=seed;currentAvatarUrl=url;
      document.querySelectorAll('.avatar-item').forEach(x=>x.classList.remove('selected'));
      item.classList.add('selected');
      document.getElementById('selectedAvatarImg').src=url;
      SFX.select();
      setTimeout(()=>{avatarSection.classList.remove('open');avatarOpen=false;document.getElementById('avatarToggleArrow').textContent='▼';document.getElementById('avatarToggleText').textContent='Change avatar'},600);
    };
    grid.appendChild(item);
  }
}
let currentAvatarUrl='';
const avatarSection=document.getElementById('avatarSection');
document.getElementById('avatarToggle').onclick=()=>{
  avatarOpen=!avatarOpen;
  avatarSection.classList.toggle('open',avatarOpen);
  document.getElementById('avatarToggleArrow').textContent=avatarOpen?'▲':'▼';
  document.getElementById('avatarToggleText').textContent=avatarOpen?'Close':'Choose avatar';
  if(avatarOpen&&!document.getElementById('avatarGrid').children.length)loadAvatars();
  SFX.click();
};
buildAvatarStyles();
currentAvatarUrl=dicebearUrl(currentStyle,'user0');
document.getElementById('selectedAvatarImg').src=currentAvatarUrl;

// Name submit
document.getElementById('nameSubmitBtn').onclick=()=>{
  const n=document.getElementById('nameInput').value.trim();
  if(!n){document.getElementById('nameInput').style.borderColor='var(--red)';return}
  STATE.name=n;STATE.avatar=currentAvatarUrl||dicebearUrl('fun-emoji','user0');
  SFX.select();showScreen('level-screen');
};
document.getElementById('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('nameSubmitBtn').click()});

// ===== LEVEL SELECT =====
document.querySelectorAll('.level-card').forEach(card=>{
  card.onclick=()=>{
    STATE.level=card.dataset.level;
    SFX.levelUp();
    document.querySelectorAll('.level-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    setTimeout(()=>{loadHub();showScreen('hub-screen')},400);
  };
});

// ===== SAVE/LOAD =====
function saveState(){localStorage.setItem('hw_state',JSON.stringify(STATE))}
function loadState(){
  const s=localStorage.getItem('hw_state');
  if(s){const d=JSON.parse(s);Object.assign(STATE,d)}
}
loadState();

// ===== HUB =====
function getRank(){return LEVELS_XP.find(l=>STATE.xp>=l.min&&STATE.xp<l.max)||LEVELS_XP[0]}
function getRankClass(name){return{ROOKIE:'rank-rookie',PLAYER:'rank-player',PRO:'rank-pro',LEGEND:'rank-legend'}[name]}
function loadHub(){
  document.getElementById('navName').textContent=STATE.name;
  document.getElementById('navBest').textContent=Math.max(...Object.values(STATE.bestScores),0);
  document.getElementById('hubAvatar').src=STATE.avatar;
  document.getElementById('heroName').textContent=STATE.name;
  const rank=getRank();
  const badge=document.getElementById('rankBadge');
  badge.textContent=rank.name;badge.className='rank-badge '+getRankClass(rank.name);
  const nextRank=LEVELS_XP[LEVELS_XP.indexOf(rank)+1];
  const pct=nextRank?Math.min(100,Math.round((STATE.xp-rank.min)/(rank.max-rank.min)*100)):100;
  document.getElementById('xpBar').style.width=pct+'%';
  document.getElementById('xpLabel').textContent=STATE.xp+' XP total';
  document.getElementById('rankXp').textContent=STATE.xp+' / '+(rank.max===Infinity?'∞':rank.max)+' XP';
  document.getElementById('xpNext').textContent=nextRank?(rank.max-STATE.xp)+' XP to '+nextRank.name:'MAX RANK 🏆';
  document.getElementById('statGames').textContent=STATE.gamesPlayed;
  document.getElementById('statCombo').textContent=STATE.bestCombo+'x';
  document.getElementById('totalScore').textContent=STATE.totalScore;
  document.getElementById('totalGames').textContent=STATE.gamesPlayed;
  document.getElementById('bestCombo').textContent=STATE.bestCombo+'x';
  document.getElementById('totalXp').textContent=STATE.xp;
  document.querySelectorAll('.best-score').forEach(el=>{el.textContent=STATE.bestScores[el.dataset.game]||0});
  renderLeaderboard();
  document.getElementById('settingsName').value=STATE.name;
  document.getElementById('soundToggle').classList.toggle('on',STATE.soundOn);
  document.getElementById('soundToggleNav').textContent=STATE.soundOn?'🔊':'🔇';
  document.getElementById('volumeSlider').value=STATE.volume;
}
function renderLeaderboard(){
  const list=document.getElementById('leaderboardList');list.innerHTML='';
  const top=STATE.leaderboard.slice(0,5);
  if(!top.length){list.innerHTML='<div style="color:var(--text2);font-size:.8rem;text-align:center;padding:1rem">No scores yet. Play some games!</div>';return}
  top.forEach((e,i)=>{
    const div=document.createElement('div');div.className='lb-entry';
    const rankClass=i===0?'gold':i===1?'silver':i===2?'bronze':'';
    div.innerHTML=`<div class="lb-rank ${rankClass}">${i===0?'👑':i+1}</div><div class="lb-name">${e.game} — ${e.name}</div><div class="lb-score">${e.score}</div>`;
    list.appendChild(div);
  });
}
function addToLeaderboard(game,score){
  STATE.leaderboard.push({game,name:STATE.name,score,date:Date.now()});
  STATE.leaderboard.sort((a,b)=>b.score-a.score);
  STATE.leaderboard=STATE.leaderboard.slice(0,20);
  if(score>STATE.bestScores[game])STATE.bestScores[game]=score;
  saveState();
}
function addXp(amount){
  const prev=getRank();
  STATE.xp+=amount;saveState();
  const curr=getRank();
  if(curr.name!==prev.name){SFX.levelUp();showFloatingText(gameCanvasWrap,'🎉 RANK UP: '+curr.name+'!',true)}
}

// ===== SETTINGS =====
document.getElementById('settingsBtn').onclick=()=>{
  document.getElementById('settingsOverlay').classList.remove('hidden');
  const emojis=['🎮','⚡','🔥','💀','🚀','🌟','👾','🎯'];
  const ep=document.getElementById('emojiPick');ep.innerHTML='';
  emojis.forEach(e=>{
    const b=document.createElement('button');b.className='emoji-btn'+(STATE.emojiAvatar===e?' active':'');
    b.textContent=e;b.onclick=()=>{STATE.emojiAvatar=e;document.querySelectorAll('.emoji-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');saveState();SFX.click()};
    ep.appendChild(b);
  });
  SFX.click();
};
document.getElementById('closeSettings').onclick=()=>{document.getElementById('settingsOverlay').classList.add('hidden')};
document.getElementById('soundToggle').onclick=function(){
  STATE.soundOn=!STATE.soundOn;this.classList.toggle('on',STATE.soundOn);
  document.getElementById('soundToggleNav').textContent=STATE.soundOn?'🔊':'🔇';
  saveState();
};
document.getElementById('soundToggleNav').onclick=()=>document.getElementById('soundToggle').click();
document.getElementById('volumeSlider').oninput=function(){STATE.volume=+this.value;saveState()};
document.getElementById('saveName').onclick=()=>{
  const n=document.getElementById('settingsName').value.trim();
  if(n){STATE.name=n;saveState();loadHub();SFX.select()}
};
document.getElementById('resetScores').onclick=()=>{
  if(confirm('Reset all scores and XP? This cannot be undone.')){
    STATE.xp=0;STATE.gamesPlayed=0;STATE.bestCombo=0;STATE.totalScore=0;
    STATE.bestScores={space:0,flappy:0,asteroid:0,whack:0};STATE.leaderboard=[];
    saveState();loadHub();SFX.hit();
  }
};

// ===== GAME LAUNCH =====
document.getElementById('gamesGrid').addEventListener('click',e=>{
  const card=e.target.closest('.game-card');
  if(!card||card.classList.contains('locked'))return;
  const game=card.dataset.game;SFX.select();
  launchGame(game);
});
document.getElementById('backToHub').onclick=()=>{stopGame();showMobileControls('');showScreen('hub-screen');loadHub()};
document.getElementById('pauseBtn').onclick=togglePause;
document.getElementById('resumeBtn').onclick=togglePause;
document.getElementById('restartBtn').onclick=()=>{togglePause();setTimeout(()=>launchGame(currentGame),100)};
document.getElementById('quitBtn').onclick=()=>{stopGame();showMobileControls('');showScreen('hub-screen');loadHub()};
document.getElementById('playAgainBtn').onclick=()=>{document.getElementById('gameOverOverlay').classList.add('hidden');launchGame(currentGame)};
document.getElementById('goHubBtn').onclick=()=>{stopGame();showMobileControls('');showScreen('hub-screen');loadHub()};

let currentGame='',gamePaused=false,gameRunning=false,gameLoop=null;
const gameCanvasWrap=document.getElementById('gameCanvasWrap');
const gameCanvas=document.getElementById('gameCanvas');
const gCtx=gameCanvas.getContext('2d');

function resizeCanvas(){
  gameCanvas.width=gameCanvasWrap.clientWidth;
  gameCanvas.height=gameCanvasWrap.clientHeight;
}
function stopGame(){gameRunning=false;gamePaused=false;if(gameLoop)cancelAnimationFrame(gameLoop);gameLoop=null;clearGame()}
function togglePause(){
  gamePaused=!gamePaused;
  document.getElementById('pauseOverlay').classList.toggle('hidden',!gamePaused);
  document.getElementById('pauseBtn').textContent=gamePaused?'▶':'⏸';
}
function launchGame(game){
  currentGame=game;stopGame();
  document.getElementById('hudGameName').textContent={space:'SPACE SHOOTER',flappy:'FLAPPY BIRD',asteroid:'ASTEROID DODGE',whack:'WHACK-A-MOLE'}[game];
  document.getElementById('pauseOverlay').classList.add('hidden');
  document.getElementById('gameOverOverlay').classList.add('hidden');
  resizeCanvas();showScreen('game-screen');
  showMobileControls(game);

  gameRunning=true;
  STATE.gamesPlayed++;saveState();
  GAMES[game]?.start();
}

// ===== UTILITY =====
function showFloatingText(parent,text,big=false){
  const el=document.createElement('div');el.className='float-popup';el.textContent=text;
  el.style.cssText=`left:${Math.random()*60+20}%;top:${Math.random()*40+30}%;font-size:${big?'1.5rem':'1rem'}`;
  parent.appendChild(el);setTimeout(()=>el.remove(),900);
}
function screenShake(){
  gameCanvasWrap.classList.remove('shaking');
  void gameCanvasWrap.offsetWidth;
  gameCanvasWrap.classList.add('shaking');
  setTimeout(()=>gameCanvasWrap.classList.remove('shaking'),250);
}
function spawnConfetti(){
  for(let i=0;i<60;i++){
    const c=document.createElement('div');c.className='confetti-piece';
    const colors=['#7C3AED','#22D3EE','#EC4899','#F59E0B','#10B981'];
    c.style.cssText=`left:${Math.random()*100}vw;top:-10px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*2+1.5}s;animation-delay:${Math.random()*.5}s`;
    document.body.appendChild(c);setTimeout(()=>c.remove(),3000);
  }
}
function endGame(score,gameName){
  gameRunning=false;
  const isHighScore=score>STATE.bestScores[currentGame];
  addToLeaderboard(gameName,score);
  const xpGained=Math.floor(score/2)+STATE.gamesPlayed*5;
  addXp(xpGained);STATE.totalScore+=score;saveState();
  const overlay=document.getElementById('gameOverOverlay');
  document.getElementById('gameOverTitle').textContent=isHighScore?'🏆 NEW HIGH SCORE!':'GAME OVER';
  document.getElementById('gameOverScore').textContent='Score: '+score;
  document.getElementById('gameOverExtra').innerHTML=`+${xpGained} XP earned<br>Best: ${STATE.bestScores[currentGame]}`;
  overlay.classList.remove('hidden');
  if(isHighScore)spawnConfetti();
  SFX.die();
}

// ===== KEYS =====
const keys={};
document.addEventListener('keydown',e=>{keys[e.key]=true;if(e.key===' ')e.preventDefault()});
document.addEventListener('keyup',e=>{keys[e.key]=false});
// D-Pad buttons (asteroid)
document.querySelectorAll('.dpad-btn').forEach(btn=>{
  const dir=btn.dataset.dir;if(!dir)return;
  btn.addEventListener('touchstart',e=>{e.preventDefault();keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)]=true;btn.classList.add('pressed')},{passive:false});
  btn.addEventListener('touchend',e=>{e.preventDefault();keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)]=false;btn.classList.remove('pressed')},{passive:false});
});

// Space Shooter mobile: left/right buttons
['spaceLeft','spaceRight'].forEach(id=>{
  const btn=document.getElementById(id);if(!btn)return;
  const dir=btn.dataset.dir;
  btn.addEventListener('touchstart',e=>{e.preventDefault();keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)]=true;btn.classList.add('pressed')},{passive:false});
  btn.addEventListener('touchend',e=>{e.preventDefault();keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)]=false;btn.classList.remove('pressed')},{passive:false});
});

// Space Shooter bomb button
document.getElementById('spaceBomb').addEventListener('touchstart',e=>{e.preventDefault();keys['b']=true;document.getElementById('spaceBomb').classList.add('pressed')},{passive:false});
document.getElementById('spaceBomb').addEventListener('touchend',e=>{e.preventDefault();keys['b']=false;document.getElementById('spaceBomb').classList.remove('pressed')},{passive:false});

// Fire button
document.getElementById('fireBtn').addEventListener('touchstart',e=>{e.preventDefault();keys[' ']=true});
document.getElementById('fireBtn').addEventListener('touchend',e=>{e.preventDefault();keys[' ']=false});

// ===== SPACE SLIDER BAR =====
(function(){
  const track=document.getElementById('spaceSliderTrack');
  const thumb=document.getElementById('spaceSliderThumb');
  if(!track||!thumb)return;
  let dragging=false;
  function getSliderPos(clientX){
    const rect=track.getBoundingClientRect();
    const pct=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
    return pct;
  }
  function moveThumb(pct){
    thumb.style.left=(pct*100)+'%';
    // Move spaceship proportionally
    if(currentGame==='space'&&GAMES.space.player&&gameRunning){
      const W=gameCanvas.width;
      GAMES.space.player.x=pct*(W-GAMES.space.player.w);
    }
  }
  track.addEventListener('touchstart',e=>{
    e.preventDefault();dragging=true;
    const pct=getSliderPos(e.touches[0].clientX);moveThumb(pct);
  },{passive:false});
  track.addEventListener('touchmove',e=>{
    e.preventDefault();if(!dragging)return;
    const pct=getSliderPos(e.touches[0].clientX);moveThumb(pct);
  },{passive:false});
  track.addEventListener('touchend',e=>{e.preventDefault();dragging=false},{passive:false});
  // Mouse fallback
  track.addEventListener('mousedown',e=>{dragging=true;moveThumb(getSliderPos(e.clientX))});
  window.addEventListener('mousemove',e=>{if(dragging)moveThumb(getSliderPos(e.clientX))});
  window.addEventListener('mouseup',()=>{dragging=false});
})();

// ===== SHOW/HIDE MOBILE CONTROLS PER GAME =====
function showMobileControls(game){
  // Hide all mobile control sets
  document.querySelectorAll('.mobile-controls').forEach(el=>el.classList.remove('active'));
  // Show the correct one
  const map={space:'mobileSpace',asteroid:'mobileAsteroid'};
  const id=map[game];
  if(id){const el=document.getElementById(id);if(el)el.classList.add('active')}
  // Sync slider thumb to ship position
  if(game==='space'){
    const thumb=document.getElementById('spaceSliderThumb');
    if(thumb)thumb.style.left='50%';
  }
}

// ===== COMBO SYSTEM =====
let comboCount=0,comboTimer=null;
function addCombo(){
  comboCount++;
  if(comboCount>STATE.bestCombo){STATE.bestCombo=comboCount;saveState()}
  const el=document.getElementById('hudCombo');
  el.textContent=comboCount>1?`${comboCount}x COMBO!`:'';
  if(comboCount>2){el.classList.remove('combo-flash');void el.offsetWidth;el.classList.add('combo-flash')}
  if(comboTimer)clearTimeout(comboTimer);
  comboTimer=setTimeout(()=>{comboCount=0;document.getElementById('hudCombo').textContent=''},2000);
  return comboCount;
}
function resetCombo(){comboCount=0;document.getElementById('hudCombo').textContent=''}
function setLives(n){
  const max=Math.max(n,5);
  let hearts='';
  for(let i=0;i<Math.max(0,n);i++)hearts+='❤️';
  for(let i=n;i<max;i++)hearts+='🖤';
  document.getElementById('hudLives').textContent=hearts;
}
function setScore(n){document.getElementById('hudScore').textContent=n}

// ===== CLEAR GAME =====
function clearGame(){clearTimeout(whackTimer);whackInterval&&clearInterval(whackInterval);whackTimer=null;whackInterval=null}
let whackTimer=null,whackInterval=null;

// ===== GAMES =====
const GAMES={};

// ============================================================
// SPACE SHOOTER — AAA with Power-ups, Bombs, Time-based Difficulty
// ============================================================
const POWERUP_TYPES={
  TRIPLE: {emoji:'🔱',color:'#00BFFF',label:'TRIPLE SHOT!',duration:420},
  BIG:    {emoji:'💥',color:'#FFD700',label:'BIG BULLET!',duration:360},
  BOMB:   {emoji:'💣',color:'#FF6347',label:'+1 BOMB!',duration:0},
  LIFE:   {emoji:'❤️',color:'#FF69B4',label:'+1 LIFE!',duration:0}
};
const getDifficulty=(gt)=>{const s=gt/60;if(s<45)return 0;if(s<90)return 1;if(s<150)return 2;if(s<225)return 3;if(s<320)return 4;return Math.min(5,Math.floor((s-320)/120)+5)};
const getDiffSettings=(lv)=>[
  {speed:0.6,spawnRate:0.008,maxE:3,label:'Easy'},
  {speed:0.8,spawnRate:0.010,maxE:4,label:'Easy'},
  {speed:1.0,spawnRate:0.012,maxE:4,label:'Normal'},
  {speed:1.3,spawnRate:0.014,maxE:5,label:'Normal'},
  {speed:1.6,spawnRate:0.016,maxE:6,label:'Hard'},
  {speed:2.0,spawnRate:0.018,maxE:6,label:'Hard'}
][Math.min(lv,5)];

GAMES.space={
  score:0,lives:5,stars:[],bullets:[],enemies:[],particles:[],powerups:[],
  tripleShot:false,tripleShotTimer:0,bigBullet:false,bigBulletTimer:0,bombs:0,
  gameTime:0,diffLevel:0,nextPUTime:0,maxE:3,puMsg:'',puMsgTimer:0,puMsgColor:'#fff',bombFlash:0,
  player:null,lastMilestone:0,surpriseFlash:0,surpriseFlashColor:'#fff',

  start(){
    const W=gameCanvas.width,H=gameCanvas.height;
    this.score=0;this.lives=5;this.gameTime=0;this.diffLevel=0;this.bombs=0;
    this.tripleShot=false;this.tripleShotTimer=0;this.bigBullet=false;this.bigBulletTimer=0;
    this.bullets=[];this.enemies=[];this.particles=[];this.powerups=[];
    this.nextPUTime=300+Math.floor(Math.random()*180);this.maxE=3;
    this.puMsg='';this.puMsgTimer=0;this.bombFlash=0;this.lastMilestone=0;this.surpriseFlash=0;
    this.player={x:W/2,y:H-80,w:64,h:64,vx:0,vy:0,acc:1.2,fric:0.88,maxSpd:12,invincible:0};
    this.stars=Array.from({length:80},()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()*2+.5,v:Math.random()*.8+.2}));
    setScore(0);setLives(5);resetCombo();
    gameLoop=requestAnimationFrame(()=>this.loop());
  },

  loop(){
    if(!gameRunning)return;
    if(!gamePaused)this.update();
    this.draw();
    gameLoop=requestAnimationFrame(()=>this.loop());
  },

  fireBullets(){
    const p=this.player,cx=p.x+p.w/2,cy=p.y;
    this.bullets.push({x:cx,y:cy,vx:0,vy:-7,big:this.bigBullet});
    if(this.tripleShot){
      this.bullets.push({x:cx-16,y:cy+10,vx:-2,vy:-6,big:this.bigBullet});
      this.bullets.push({x:cx+16,y:cy+10,vx:2,vy:-6,big:this.bigBullet});
    }
    SFX.shoot();
  },

  useBomb(){
    if(this.bombs<=0)return;
    this.bombs--;
    this.enemies.forEach(e=>{this.score+=10;this.spawnParticles(e.x+16,e.y+16,'#FF6347')});
    this.enemies=[];
    this.bombFlash=15;
    this.showPU('💣 BOOM! ALL ENEMIES DESTROYED! 💣','#FF6347');
    SFX.hit();screenShake();
    setScore(this.score);
  },

  showPU(msg,color){this.puMsg=msg;this.puMsgTimer=120;this.puMsgColor=color},

  collectPU(pu){
    const info=POWERUP_TYPES[pu.type];
    SFX.powerup();
    switch(pu.type){
      case'TRIPLE':this.tripleShot=true;this.tripleShotTimer=info.duration;this.showPU('🔱 TRIPLE SHOT ACTIVATED! 🔱',info.color);break;
      case'BIG':this.bigBullet=true;this.bigBulletTimer=info.duration;this.showPU('💥 BIG BULLET ACTIVATED! 💥',info.color);break;
      case'BOMB':this.bombs++;this.showPU('💣 BOMB COLLECTED! Press B to use! 💣',info.color);break;
      case'LIFE':this.lives=Math.min(this.lives+1,7);setLives(this.lives);this.showPU('❤️ EXTRA LIFE! ❤️',info.color);break;
    }
  },

  spawnEnemy(){
    const W=gameCanvas.width,s=getDiffSettings(this.diffLevel);
    const spd=s.speed+Math.random()*0.3;
    const mt=Math.random()<0.4?'zigzag':'straight';
    this.enemies.push({
      x:Math.random()*(W-32),y:-32,w:32,h:32,
      moveType:mt,vx:(Math.random()-.5)*2,vy:spd,
      amplitude:Math.random()*40+20,frequency:Math.random()*0.03+0.01,
      phase:Math.random()*Math.PI*2,baseX:Math.random()*(W-32),
      frame:0
    });
  },

  spawnPowerUp(){
    const W=gameCanvas.width;
    const types=Object.keys(POWERUP_TYPES);
    const type=types[Math.floor(Math.random()*types.length)];
    const info=POWERUP_TYPES[type];
    this.powerups.push({
      x:Math.random()*(W-40)+20,y:-30,w:30,h:30,vy:1.2,
      type,emoji:info.emoji,color:info.color,label:info.label,
      bobPhase:Math.random()*Math.PI*2,frame:0
    });
  },

  spawnParticles(x,y,color){
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2,v=3+Math.random()*2;
      this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color,size:Math.random()*4+2});
    }
  },

  update(){
    const W=gameCanvas.width,H=gameCanvas.height,p=this.player;
    this.gameTime++;

    if(keys['b']||keys['B']){this.useBomb();keys['b']=false;keys['B']=false}
    if(keys[' ']&&this.gameTime%8===0)this.fireBullets();

    const nd=getDifficulty(this.gameTime);
    if(nd>this.diffLevel){
      this.diffLevel=nd;const s=getDiffSettings(nd);this.maxE=s.maxE;
      this.showPU('⭐ DIFFICULTY UP: '+s.label+'! ⭐','#FFD700');
      showFloatingText(gameCanvasWrap,'⭐ '+s.label+' MODE',true);
    }
    const ds=getDiffSettings(this.diffLevel);

    if(this.tripleShot){this.tripleShotTimer--;if(this.tripleShotTimer<=0)this.tripleShot=false}
    if(this.bigBullet){this.bigBulletTimer--;if(this.bigBulletTimer<=0)this.bigBullet=false}
    if(this.puMsgTimer>0)this.puMsgTimer--;
    if(this.bombFlash>0)this.bombFlash--;

    if(keys['ArrowLeft'])p.vx-=p.acc;
    if(keys['ArrowRight'])p.vx+=p.acc;
    if(keys['ArrowUp'])p.vy-=p.acc;
    if(keys['ArrowDown'])p.vy+=p.acc;
    p.vx*=p.fric;p.vy*=p.fric;
    p.vx=Math.max(-p.maxSpd,Math.min(p.maxSpd,p.vx));
    p.vy=Math.max(-p.maxSpd,Math.min(p.maxSpd,p.vy));
    p.x+=p.vx;p.y+=p.vy;
    p.x=Math.max(0,Math.min(W-p.w,p.x));
    p.y=Math.max(0,Math.min(H-p.h,p.y));

    if(this.enemies.length<this.maxE&&Math.random()<ds.spawnRate)this.spawnEnemy();

    if(this.gameTime>=this.nextPUTime){
      this.spawnPowerUp();
      this.nextPUTime=this.gameTime+300+Math.floor(Math.random()*300);
    }

    this.stars.forEach(s=>{s.y+=s.v;if(s.y>H){s.y=0;s.x=Math.random()*W}});

    this.enemies.forEach(e=>{
      e.frame++;
      if(e.moveType==='zigzag'){e.x=e.baseX+Math.sin(e.frame*e.frequency)*e.amplitude}
      else{e.x+=e.vx;if(e.x<0||e.x>W-32)e.vx*=-1}
      e.y+=e.vy;
    });

    this.powerups.forEach(pu=>{pu.frame++;pu.y+=pu.vy;pu.x+=Math.sin(pu.frame*0.05)*0.5});
    this.powerups=this.powerups.filter(pu=>pu.y<H+40);

    this.bullets=this.bullets.filter(b=>{b.y+=b.vy;b.x+=(b.vx||0);return b.y>-20&&b.x>-20&&b.x<W+20});

    this.bullets=this.bullets.filter(b=>{
      let alive=true;
      this.enemies=this.enemies.filter(e=>{
        const bw=b.big?12:4,bh=b.big?16:10;
        if(b.x<e.x+e.w&&b.x+bw>e.x&&b.y<e.y+e.h&&b.y+bh>e.y){
          const pts=b.big?20:10;
          this.score+=pts;addCombo();setScore(this.score);
          showFloatingText(gameCanvasWrap,'+'+pts);
          SFX.point();
          this.spawnParticles(e.x+16,e.y+16,b.big?'#FFD700':'#7C3AED');
          if(!b.big)alive=false;
          return false;
        }
        return true;
      });
      return alive;
    });

    const milestones=[50,100,200,350,500,750,1000];
    const nextM=milestones.find(m=>m>this.lastMilestone);
    if(nextM&&this.score>=nextM){
      this.lastMilestone=nextM;spawnConfetti();SFX.levelUp();
      if(nextM<=100){this.bombs+=2;this.showPU('🎉 '+nextM+'PTS! +2 BOMBS!','#FFD700');showFloatingText(gameCanvasWrap,'🎉 MILESTONE '+nextM+'!',true)}
      else if(nextM<=350){this.tripleShot=true;this.tripleShotTimer=600;this.bigBullet=true;this.bigBulletTimer=600;this.showPU('🔥 '+nextM+'PTS! ALL WEAPONS 10s!','#FF6347');showFloatingText(gameCanvasWrap,'🔥 POWER SURGE!',true)}
      else if(nextM<=750){this.lives=Math.min(this.lives+2,7);setLives(this.lives);this.bombs+=3;this.showPU('💎 '+nextM+'PTS! +2❤️ +3💣!','#C084FC');showFloatingText(gameCanvasWrap,'💎 MEGA BONUS!',true)}
      else{this.tripleShot=true;this.tripleShotTimer=900;this.bigBullet=true;this.bigBulletTimer=900;this.lives=Math.min(this.lives+3,7);setLives(this.lives);this.bombs+=5;this.showPU('👑 '+nextM+'PTS! LEGENDARY!','#FFD700');showFloatingText(gameCanvasWrap,'👑 LEGENDARY!',true)}
      this.surpriseFlash=25;this.surpriseFlashColor=nextM>=500?'#FFD700':'#C084FC';
      screenShake();
    }
    if(this.surpriseFlash>0)this.surpriseFlash--;

    this.powerups=this.powerups.filter(pu=>{
      if(pu.x<p.x+p.w&&pu.x+pu.w>p.x&&pu.y<p.y+p.h&&pu.y+pu.h>p.y){
        this.collectPU(pu);
        this.spawnParticles(pu.x+15,pu.y+15,pu.color);
        return false;
      }
      return true;
    });

    this.enemies=this.enemies.filter(e=>{
      if(e.y>H){
        if(p.invincible<=0){
          this.lives--;setLives(this.lives);SFX.hit();screenShake();
          p.invincible=90;resetCombo();
          if(this.lives<=0){endGame(this.score,'Space Shooter');return false}
        }
        return false;
      }
      if(p.invincible<=0&&e.x<p.x+p.w&&e.x+e.w>p.x&&e.y<p.y+p.h&&e.y+e.h>p.y){
        this.lives--;setLives(this.lives);SFX.hit();screenShake();
        p.invincible=90;resetCombo();
        this.spawnParticles(e.x+16,e.y+16,'#EF4444');
        if(this.lives<=0){endGame(this.score,'Space Shooter');return false}
        return false;
      }
      return true;
    });

    if(p.invincible>0)p.invincible--;

    this.particles=this.particles.filter(pt=>{
      pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.15;pt.life-=0.02;pt.vx*=0.95;
      return pt.life>0;
    });
  },

  draw(){
    const W=gameCanvas.width,H=gameCanvas.height,p=this.player;
    const bg=gCtx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#020209');bg.addColorStop(1,'#1a0533');
    gCtx.fillStyle=bg;gCtx.fillRect(0,0,W,H);

    if(this.bombFlash>0){
      gCtx.fillStyle=`rgba(255,99,71,${this.bombFlash/20})`;
      gCtx.fillRect(0,0,W,H);
    }

    if(this.surpriseFlash>0){
      const c=this.surpriseFlashColor==='#FFD700'?'255,215,0':'192,132,252';
      gCtx.fillStyle=`rgba(${c},${this.surpriseFlash/30})`;
      gCtx.fillRect(0,0,W,H);
    }

    this.stars.forEach(s=>{
      gCtx.fillStyle=`rgba(255,255,255,${s.s/3})`;
      gCtx.beginPath();gCtx.arc(s.x,s.y,s.s,0,Math.PI*2);gCtx.fill();
    });

    gCtx.save();
    gCtx.translate(p.x+p.w/2,p.y+p.h/2);
    if(p.invincible>0&&Math.floor(p.invincible/5)%2===0)gCtx.globalAlpha=0.4;
    gCtx.fillStyle='#7C3AED';
    gCtx.beginPath();gCtx.moveTo(-20,-24);gCtx.lineTo(20,-24);gCtx.lineTo(28,24);gCtx.lineTo(-28,24);gCtx.closePath();gCtx.fill();
    gCtx.fillStyle='#A78BFA';
    gCtx.beginPath();gCtx.moveTo(-28,-10);gCtx.lineTo(-38,15);gCtx.lineTo(-28,15);gCtx.closePath();gCtx.fill();
    gCtx.beginPath();gCtx.moveTo(28,-10);gCtx.lineTo(38,15);gCtx.lineTo(28,15);gCtx.closePath();gCtx.fill();
    gCtx.fillStyle='#FFD700';gCtx.beginPath();gCtx.arc(0,-15,6,0,Math.PI*2);gCtx.fill();
    gCtx.shadowColor='#7C3AED';gCtx.shadowBlur=15;
    gCtx.fillStyle='rgba(124,58,237,0.6)';gCtx.fillRect(-12,20,24,12);gCtx.shadowBlur=0;
    const fi=Math.random()*0.5+0.5;
    gCtx.fillStyle=`rgba(255,107,53,${fi})`;
    gCtx.beginPath();gCtx.moveTo(-10,32);gCtx.lineTo(-6,42);gCtx.lineTo(0,38);gCtx.lineTo(6,42);gCtx.lineTo(10,32);gCtx.closePath();gCtx.fill();
    gCtx.globalAlpha=1;gCtx.restore();

    if(this.tripleShot||this.bigBullet){
      gCtx.save();
      const cx=p.x+p.w/2,cy=p.y+p.h/2;
      const col=this.tripleShot?'rgba(0,191,255,0.15)':'rgba(255,215,0,0.15)';
      const pulse=Math.sin(this.gameTime*0.1)*5;
      gCtx.beginPath();gCtx.arc(cx,cy,40+pulse,0,Math.PI*2);gCtx.fillStyle=col;gCtx.fill();
      gCtx.restore();
    }

    this.bullets.forEach(b=>{
      if(b.big){
        const gr=gCtx.createLinearGradient(b.x,b.y,b.x,b.y+20);
        gr.addColorStop(0,'#FFD700');gr.addColorStop(1,'#FF6B35');
        gCtx.fillStyle=gr;gCtx.shadowColor='#FFD700';gCtx.shadowBlur=12;
        gCtx.fillRect(b.x-4,b.y,12,16);gCtx.shadowBlur=0;
      }else{
        gCtx.fillStyle='#10B981';gCtx.shadowColor='#10B981';gCtx.shadowBlur=6;
        gCtx.fillRect(b.x,b.y,4,10);gCtx.shadowBlur=0;
      }
    });

    this.enemies.forEach(e=>{
      gCtx.save();gCtx.translate(e.x+e.w/2,e.y+e.h/2);
      gCtx.fillStyle='#EF4444';
      gCtx.beginPath();gCtx.moveTo(-14,-14);gCtx.lineTo(14,-14);gCtx.lineTo(18,14);gCtx.lineTo(-18,14);gCtx.closePath();gCtx.fill();
      gCtx.fillStyle='#F97316';
      gCtx.beginPath();gCtx.moveTo(-18,0);gCtx.lineTo(-24,-6);gCtx.lineTo(-18,-2);gCtx.closePath();gCtx.fill();
      gCtx.beginPath();gCtx.moveTo(18,0);gCtx.lineTo(24,-6);gCtx.lineTo(18,-2);gCtx.closePath();gCtx.fill();
      gCtx.shadowColor='#EF4444';gCtx.shadowBlur=10;
      gCtx.fillStyle='#FFF';gCtx.beginPath();gCtx.arc(-6,-3,3,0,Math.PI*2);gCtx.fill();
      gCtx.fillStyle='#000';gCtx.beginPath();gCtx.arc(-6,-3,1.5,0,Math.PI*2);gCtx.fill();
      gCtx.shadowBlur=0;gCtx.restore();
    });

    this.powerups.forEach(pu=>{
      gCtx.save();
      const bob=Math.sin(pu.frame*0.08)*3;
      const cx=pu.x+pu.w/2,cy=pu.y+pu.h/2+bob;
      gCtx.shadowColor=pu.color;gCtx.shadowBlur=20;
      gCtx.strokeStyle=pu.color;gCtx.lineWidth=2;
      gCtx.beginPath();gCtx.arc(cx,cy,22,0,Math.PI*2);gCtx.stroke();
      gCtx.shadowBlur=0;
      gCtx.font='22px serif';gCtx.textAlign='center';gCtx.textBaseline='middle';
      gCtx.fillText(pu.emoji,cx,cy);
      gCtx.restore();
    });

    this.particles.forEach(pt=>{
      gCtx.globalAlpha=pt.life;gCtx.fillStyle=pt.color;
      gCtx.fillRect(pt.x,pt.y,pt.size,pt.size);gCtx.globalAlpha=1;
    });

    if(this.bombs>0){
      gCtx.fillStyle='rgba(255,99,71,0.9)';gCtx.font='bold 16px Orbitron,monospace';
      gCtx.textAlign='left';gCtx.fillText('💣 x'+this.bombs+'  [B]',16,H-20);
    }

    let hy=30;
    if(this.tripleShot){
      const s=Math.ceil(this.tripleShotTimer/60);
      gCtx.fillStyle='#00BFFF';gCtx.font='bold 14px Orbitron,monospace';gCtx.textAlign='center';
      gCtx.fillText('🔱 TRIPLE SHOT '+s+'s',W/2,hy);hy+=22;
    }
    if(this.bigBullet){
      const s=Math.ceil(this.bigBulletTimer/60);
      gCtx.fillStyle='#FFD700';gCtx.font='bold 14px Orbitron,monospace';gCtx.textAlign='center';
      gCtx.fillText('💥 BIG BULLET '+s+'s',W/2,hy);hy+=22;
    }

    if(this.puMsgTimer>0){
      const a=Math.min(1,this.puMsgTimer/30);
      gCtx.save();gCtx.globalAlpha=a;
      gCtx.fillStyle=this.puMsgColor;gCtx.font='bold 20px Orbitron,monospace';gCtx.textAlign='center';
      gCtx.fillText(this.puMsg,W/2,H/2-50-(120-this.puMsgTimer)*0.3);
      gCtx.globalAlpha=1;gCtx.restore();
    }

    gCtx.fillStyle='rgba(255,255,255,0.5)';gCtx.font='12px Orbitron,monospace';gCtx.textAlign='right';
    const mn=Math.floor(this.gameTime/3600),sc=String(Math.floor((this.gameTime/60)%60)).padStart(2,'0');
    gCtx.fillText(getDiffSettings(this.diffLevel).label+' | '+mn+':'+sc,W-16,H-20);
  }
};

// ============================================================
// FLAPPY BIRD
// ============================================================
GAMES.flappy={
  bird:null,pipes:[],score:0,started:false,dead:false,frameCount:0,bg:0,lives:3,invincible:0,
  start(){
    const W=gameCanvas.width,H=gameCanvas.height;
    this.bird={x:W*0.22,y:H/2,vy:0,r:14,rot:0};
    this.pipes=[];this.score=0;this.started=false;this.dead=false;this.frameCount=0;this.bg=0;this.pipeTimer=0;this.lives=3;this.invincible=0;
    setScore(0);setLives(3);resetCombo();
    document.addEventListener('click',this._flap=()=>this.flap(),{once:false});
    gameLoop=requestAnimationFrame(()=>this.loop());
  },
  flap(){if(!gamePaused&&!this.dead){this.bird.vy=-6.5;SFX.flap();if(!this.started)this.started=true}},
  loop(){
    if(!gameRunning)return;
    if(!gamePaused)this.update();
    this.draw();
    gameLoop=requestAnimationFrame(()=>this.loop());
  },
  update(){
    const W=gameCanvas.width,H=gameCanvas.height,b=this.bird;
    if(keys[' ']&&!this._spaceHeld){this.flap();this._spaceHeld=true}
    if(!keys[' '])this._spaceHeld=false;
    if(!this.started)return;
    this.frameCount++;this.bg+=1.5;
    b.vy+=.38;b.y+=b.vy;b.rot=Math.min(Math.max(b.vy*4,-30),90);
    if(b.y+b.r>H-40){this.lives--;setLives(this.lives);SFX.die();screenShake();
      if(this.lives<=0){this.dead=true;document.removeEventListener('click',this._flap);endGame(this.score,'Flappy Bird');return}
      b.y=H/2;b.vy=-3;this.invincible=90;return}
    if(b.y-b.r<0){b.y=b.r;b.vy=0}
    this.pipeTimer++;const gap=120+Math.max(0,60-this.score*2);const pipeSpeed=2+this.score*.08;
    if(this.pipeTimer>90){
      this.pipeTimer=0;
      const top=80+Math.random()*(H-gap-140);
      this.pipes.push({x:W+30,top,bottom:top+gap,scored:false,w:52});
    }
    this.pipes=this.pipes.filter(p=>{
      p.x-=pipeSpeed;
      if(!p.scored&&p.x+p.w<b.x){p.scored=true;this.score++;setScore(this.score);addCombo();SFX.point();showFloatingText(gameCanvasWrap,'+'+(addCombo()))}
      if(this.invincible<=0&&b.x+b.r>p.x&&b.x-b.r<p.x+p.w&&(b.y-b.r<p.top||b.y+b.r>p.bottom)){
        this.lives--;setLives(this.lives);SFX.hit();screenShake();resetCombo();
        if(this.lives<=0){this.dead=true;document.removeEventListener('click',this._flap);endGame(this.score,'Flappy Bird')}
        else{b.y=(p.top+p.bottom)/2;b.vy=-3;this.invincible=90}
      }
      return p.x>-100;
    });
    if(this.invincible>0)this.invincible--;
  },
  draw(){
    const W=gameCanvas.width,H=gameCanvas.height,b=this.bird;
    const sky=gCtx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0a4d7a');sky.addColorStop(0.5,'#1a8ab5');sky.addColorStop(1,'#0e6e9e');
    gCtx.fillStyle=sky;gCtx.fillRect(0,0,W,H);
    gCtx.fillStyle='rgba(255,255,255,.12)';
    for(let i=0;i<5;i++){const cx=(this.bg*.3+i*180)%W;gCtx.beginPath();gCtx.ellipse(cx,50+i*30,55,22,0,0,Math.PI*2);gCtx.fill();gCtx.beginPath();gCtx.ellipse(cx+30,48+i*30,35,18,0,0,Math.PI*2);gCtx.fill()}
    this.pipes.forEach(p=>{
      const tG=gCtx.createLinearGradient(p.x,0,p.x+p.w,0);
      tG.addColorStop(0,'#0d4d1a');tG.addColorStop(.5,'#1a7a2e');tG.addColorStop(1,'#0d4d1a');
      gCtx.fillStyle=tG;
      gCtx.fillRect(p.x,0,p.w,p.top);
      gCtx.fillRect(p.x,p.bottom,p.w,H-p.bottom-38);
      gCtx.fillStyle='#22a63f';gCtx.fillRect(p.x-4,p.top-16,p.w+8,16);gCtx.fillRect(p.x-4,p.bottom,p.w+8,16);
    });
    const gG=gCtx.createLinearGradient(0,H-40,0,H);gG.addColorStop(0,'#3d8a37');gG.addColorStop(1,'#2a6a25');
    gCtx.fillStyle=gG;gCtx.fillRect(0,H-40,W,40);
    gCtx.save();gCtx.translate(b.x,b.y);gCtx.rotate(b.rot*Math.PI/180);
    if(this.invincible>0&&Math.floor(this.invincible/5)%2===0)gCtx.globalAlpha=0.4;
    gCtx.shadowColor='#F59E0B';gCtx.shadowBlur=15;
    gCtx.fillStyle='#D97706';gCtx.beginPath();gCtx.ellipse(-b.r*.9,b.r*.1,b.r*.4,b.r*.2,-.3,0,Math.PI*2);gCtx.fill();
    gCtx.fillStyle='#B45309';gCtx.beginPath();gCtx.ellipse(-b.r*.85,b.r*.25,b.r*.3,b.r*.15,-.2,0,Math.PI*2);gCtx.fill();
    const bodyG=gCtx.createRadialGradient(0,0,2,0,0,b.r);
    bodyG.addColorStop(0,'#FDE68A');bodyG.addColorStop(.6,'#FBBF24');bodyG.addColorStop(1,'#D97706');
    gCtx.beginPath();gCtx.ellipse(0,0,b.r,b.r*.75,0,0,Math.PI*2);gCtx.fillStyle=bodyG;gCtx.fill();
    gCtx.fillStyle='rgba(254,243,199,.5)';gCtx.beginPath();gCtx.ellipse(-b.r*.1,b.r*.15,b.r*.5,b.r*.35,0,0,Math.PI*2);gCtx.fill();
    const wingFlap=Math.sin(this.frameCount*.3)*b.r*.15;
    gCtx.fillStyle='#1E40AF';gCtx.beginPath();gCtx.ellipse(b.r*.2,-b.r*.1+wingFlap,b.r*.55,b.r*.35,.1,0,Math.PI*2);gCtx.fill();
    gCtx.fillStyle='#2563EB';gCtx.beginPath();gCtx.ellipse(b.r*.25,-b.r*.05+wingFlap,b.r*.4,b.r*.25,.1,0,Math.PI*2);gCtx.fill();
    gCtx.fillStyle='#fff';gCtx.beginPath();gCtx.arc(b.r*.5,-b.r*.15,b.r*.22,0,Math.PI*2);gCtx.fill();
    gCtx.fillStyle='#1a1a1a';gCtx.beginPath();gCtx.arc(b.r*.56,-b.r*.17,b.r*.12,0,Math.PI*2);gCtx.fill();
    gCtx.fillStyle='#fff';gCtx.beginPath();gCtx.arc(b.r*.6,-b.r*.2,b.r*.05,0,Math.PI*2);gCtx.fill();
    gCtx.fillStyle='#EF4444';gCtx.beginPath();gCtx.moveTo(b.r*.5,b.r*.05);gCtx.lineTo(b.r*.9,0);gCtx.lineTo(b.r*.5,b.r*.15);gCtx.closePath();gCtx.fill();
    gCtx.fillStyle='#DC2626';gCtx.beginPath();gCtx.moveTo(b.r*.5,b.r*.1);gCtx.lineTo(b.r*.85,b.r*.05);gCtx.lineTo(b.r*.5,b.r*.15);gCtx.closePath();gCtx.fill();
    gCtx.globalAlpha=1;
    gCtx.restore();
    if(!this.started){gCtx.fillStyle='rgba(255,255,255,.6)';gCtx.font='bold 16px Nunito,sans-serif';gCtx.textAlign='center';gCtx.fillText('Tap or press SPACE to start',W/2,H/2-60)}
  }
};

// ============================================================
// ASTEROID DODGE
// ============================================================
GAMES.asteroid={
  player:null,asteroids:[],particles:[],score:0,lives:3,frameCount:0,stars:[],
  start(){
    const W=gameCanvas.width,H=gameCanvas.height;
    this.player={x:W/2,y:H-80,r:14,speed:4.5,invincible:0,trail:[]};
    this.asteroids=[];this.particles=[];this.score=0;this.lives=3;this.frameCount=0;
    this.stars=Array.from({length:100},()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()*2+.3,v:Math.random()*1.5+.5,twinkle:Math.random()}));
    setScore(0);setLives(3);resetCombo();
    gameLoop=requestAnimationFrame(()=>this.loop());
  },
  loop(){if(!gameRunning)return;if(!gamePaused)this.update();this.draw();gameLoop=requestAnimationFrame(()=>this.loop())},
  update(){
    const W=gameCanvas.width,H=gameCanvas.height,p=this.player;
    this.frameCount++;const speed=Math.min(2+this.frameCount/800,5.5);
    if(keys['ArrowLeft']&&p.x>p.r+5)p.x-=p.speed;
    if(keys['ArrowRight']&&p.x<W-p.r-5)p.x+=p.speed;
    if(keys['ArrowUp']&&p.y>p.r+5)p.y-=p.speed*.7;
    if(keys['ArrowDown']&&p.y<H-p.r-5)p.y+=p.speed*.7;
    p.trail.push({x:p.x,y:p.y});if(p.trail.length>12)p.trail.shift();
    if(p.invincible>0)p.invincible--;
    if(this.frameCount%60===0){this.score++;setScore(this.score);addCombo()}
    if(this.frameCount%Math.max(40,90-Math.floor(this.frameCount/200)*10)===0){
      const sides=['top','left','right'];const side=sides[Math.floor(Math.random()*sides.length)];
      let x,y,vx,vy;
      if(side==='top'){x=Math.random()*W;y=-40;vx=(Math.random()-.5)*2;vy=speed}
      else if(side==='left'){x=-40;y=Math.random()*H;vx=speed;vy=(Math.random()-.5)*1.5}
      else{x=W+40;y=Math.random()*H;vx=-speed;vy=(Math.random()-.5)*1.5}
      const size=20+Math.random()*25;
      const pts=5+Math.floor(Math.random()*4);
      const shape=Array.from({length:pts},(_,i)=>{const a=i/pts*Math.PI*2,r2=size*(0.6+Math.random()*.4);return{x:Math.cos(a)*r2,y:Math.sin(a)*r2}});
      this.asteroids.push({x,y,vx,vy,rot:Math.random()*Math.PI*2,rspeed:(Math.random()-.5)*.06,size,shape,color:`hsl(${200+Math.random()*60},60%,${40+Math.random()*20}%)`});
    }
    this.stars.forEach(s=>{s.y+=s.v;if(s.y>H)s.y=-5;s.twinkle=(s.twinkle+.02)%1});
    this.asteroids=this.asteroids.filter(a=>{
      a.x+=a.vx;a.y+=a.vy;a.rot+=a.rspeed;
      if(a.x<-80||a.x>W+80||a.y>H+80)return false;
      if(p.invincible<=0&&Math.sqrt((a.x-p.x)**2+(a.y-p.y)**2)<a.size*.6+p.r*.7){
        this.lives--;setLives(this.lives);SFX.hit();screenShake();resetCombo();p.invincible=90;
        for(let i=0;i<15;i++)this.particles.push({x:p.x,y:p.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:40,color:'#EC4899'});
        if(this.lives<=0){endGame(this.score,'Asteroid Dodge');return false}
      }
      return true;
    });
    this.particles=this.particles.filter(pt=>{pt.x+=pt.vx;pt.y+=pt.vy;pt.life--;pt.vx*=.92;pt.vy*=.92;return pt.life>0});
  },
  draw(){
    const W=gameCanvas.width,H=gameCanvas.height,p=this.player;
    gCtx.fillStyle='#050510';gCtx.fillRect(0,0,W,H);
    this.stars.forEach(s=>{const a=.3+Math.sin(s.twinkle*Math.PI*2)*.2;gCtx.fillStyle=`rgba(200,200,255,${a})`;gCtx.beginPath();gCtx.arc(s.x,s.y,s.s,0,Math.PI*2);gCtx.fill()});
    p.trail.forEach((t,i)=>{const a=i/p.trail.length*.5;gCtx.fillStyle=`rgba(168,85,247,${a})`;gCtx.beginPath();gCtx.arc(t.x,t.y,p.r*(i/p.trail.length),0,Math.PI*2);gCtx.fill()});
    this.asteroids.forEach(a=>{
      gCtx.save();gCtx.translate(a.x,a.y);gCtx.rotate(a.rot);
      gCtx.beginPath();gCtx.moveTo(a.shape[0].x,a.shape[0].y);
      a.shape.slice(1).forEach(pt=>gCtx.lineTo(pt.x,pt.y));gCtx.closePath();
      gCtx.fillStyle=a.color;gCtx.fill();
      gCtx.strokeStyle='rgba(255,255,255,.15)';gCtx.lineWidth=1.5;gCtx.stroke();
      gCtx.restore();
    });
    this.particles.forEach(pt=>{gCtx.globalAlpha=pt.life/40;gCtx.fillStyle=pt.color;gCtx.beginPath();gCtx.arc(pt.x,pt.y,3,0,Math.PI*2);gCtx.fill();gCtx.globalAlpha=1});
    const pi=p.invincible;
    gCtx.save();gCtx.translate(p.x,p.y);
    if(pi>0&&Math.floor(pi/5)%2===0)gCtx.globalAlpha=.3;
    gCtx.shadowColor='#22D3EE';gCtx.shadowBlur=20;
    gCtx.fillStyle='#22D3EE';
    gCtx.beginPath();gCtx.moveTo(0,-16);gCtx.lineTo(12,12);gCtx.lineTo(0,6);gCtx.lineTo(-12,12);gCtx.closePath();gCtx.fill();
    gCtx.strokeStyle='rgba(255,255,255,.3)';gCtx.lineWidth=1;gCtx.stroke();
    gCtx.globalAlpha=1;gCtx.restore();
    gCtx.fillStyle='rgba(34,211,238,.5)';gCtx.beginPath();gCtx.ellipse(p.x,p.y+14,5,10,0,0,Math.PI*2);gCtx.fill();
    const spd=Math.min(2+this.frameCount/800,5.5);
    gCtx.fillStyle='rgba(168,85,247,.5)';gCtx.font='11px Orbitron,monospace';gCtx.textAlign='right';gCtx.fillText('SPEED: '+spd.toFixed(1)+'x',W-15,H-15);
  }
};

// ============================================================
// WHACK A BEAR
// ============================================================
GAMES.whack={
  holes:[],score:0,misses:0,timeLeft:60,interval:null,
  start(){
    this.score=0;this.misses=0;this.timeLeft=60;
    this.holes=Array.from({length:9},(_,i)=>({active:false,timer:0,maxTimer:0,x:0,y:0,idx:i,anim:0,whacked:false,whackAnim:0}));
    setScore(0);setLives(3);resetCombo();
    document.getElementById('hudLives').textContent='⏱ 60';
    gameLoop=requestAnimationFrame(()=>this.loop());
    this.startTimers();
  },
  startTimers(){
    const self=this;
    whackInterval=setInterval(()=>{
      if(!gameRunning||gamePaused)return;
      self.timeLeft--;document.getElementById('hudLives').textContent='⏱ '+self.timeLeft;
      if(self.timeLeft<=0){clearInterval(whackInterval);clearTimeout(whackTimer);endGame(self.score,'Whack-a-Mole')}
    },1000);
    const popMole=()=>{
      if(!gameRunning)return;
      if(!gamePaused){
        const inactive=self.holes.filter(h=>!h.active);
        if(inactive.length){
          const h=inactive[Math.floor(Math.random()*inactive.length)];
          h.active=true;h.whacked=false;h.anim=0;
          h.maxTimer=Math.max(40,80-Math.floor(self.score/5)*5);h.timer=h.maxTimer;
        }
      }
      if(gameRunning)whackTimer=setTimeout(popMole,Math.max(400,900-self.score*15));
    };
    popMole();
  },
  loop(){if(!gameRunning)return;if(!gamePaused)this.update();this.draw();gameLoop=requestAnimationFrame(()=>this.loop())},
  update(){
    const W=gameCanvas.width,H=gameCanvas.height;
    const cols=3,rows=3,pw=Math.min(W,500),ph=Math.min(H-40,400);
    const ox=(W-pw)/2,oy=(H-ph)/2+20,cw=pw/cols,ch=ph/rows;
    this.holes.forEach((h,i)=>{
      h.x=ox+cw*(i%3)+cw/2;h.y=oy+ch*Math.floor(i/3)+ch*.7;
      if(h.active&&!h.whacked){h.anim=Math.min(1,h.anim+.12);h.timer--;if(h.timer<=0){h.active=false;h.anim=0;this.misses++;setLives(Math.max(0,3-Math.floor(this.misses/3)))}}
      if(h.whacked){h.whackAnim+=.15;if(h.whackAnim>=1){h.active=false;h.whacked=false;h.anim=0;h.whackAnim=0}}
    });
  },
  click(ex,ey){
    this.holes.forEach(h=>{
      if(h.active&&!h.whacked&&Math.sqrt((ex-h.x)**2+(ey-h.y)**2)<35){
        h.whacked=true;h.whackAnim=0;
        this.score+=Math.max(1,addCombo());setScore(this.score);SFX.whack();
        showFloatingText(gameCanvasWrap,'+'+(addCombo()));
      }
    });
  },
  draw(){
    const W=gameCanvas.width,H=gameCanvas.height;
    const bg=gCtx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1a5a0f');bg.addColorStop(0.5,'#2d8a22');bg.addColorStop(1,'#1a5a0f');
    gCtx.fillStyle=bg;gCtx.fillRect(0,0,W,H);
    this.holes.forEach(h=>{
      const visible=h.active?h.anim:0;
      gCtx.fillStyle='rgba(0,0,0,.6)';gCtx.beginPath();gCtx.ellipse(h.x,h.y+5,38,20,0,0,Math.PI*2);gCtx.fill();
      gCtx.fillStyle='#1a0d00';gCtx.beginPath();gCtx.ellipse(h.x,h.y,34,18,0,0,Math.PI*2);gCtx.fill();
      if(h.active){
        const sy=h.whacked?h.whackAnim*30:-30+h.anim*30;
        gCtx.save();gCtx.beginPath();gCtx.ellipse(h.x,h.y,34,18,0,0,Math.PI*2);gCtx.clip();
        gCtx.save();gCtx.translate(h.x,h.y+sy);
        gCtx.fillStyle=h.whacked?'#7A4A1A':'#8B5E3C';gCtx.beginPath();gCtx.arc(-14,-32,8,0,Math.PI*2);gCtx.fill();gCtx.beginPath();gCtx.arc(14,-32,8,0,Math.PI*2);gCtx.fill();
        gCtx.fillStyle='#D2956C';gCtx.beginPath();gCtx.arc(-14,-32,4,0,Math.PI*2);gCtx.fill();gCtx.beginPath();gCtx.arc(14,-32,4,0,Math.PI*2);gCtx.fill();
        gCtx.fillStyle=h.whacked?'#7A4A1A':'#8B5E3C';gCtx.beginPath();gCtx.ellipse(0,-10,22,28,0,0,Math.PI*2);gCtx.fill();
        gCtx.fillStyle='#D2B48C';gCtx.beginPath();gCtx.ellipse(0,-18,15,13,0,0,Math.PI*2);gCtx.fill();
        gCtx.fillStyle='#E8D5B7';gCtx.beginPath();gCtx.ellipse(0,-15,8,6,0,0,Math.PI*2);gCtx.fill();
        if(!h.whacked){
          gCtx.fillStyle='#1a1a1a';gCtx.beginPath();gCtx.arc(-6,-22,3,0,Math.PI*2);gCtx.fill();gCtx.beginPath();gCtx.arc(6,-22,3,0,Math.PI*2);gCtx.fill();
          gCtx.fillStyle='#fff';gCtx.beginPath();gCtx.arc(-5,-23,1.5,0,Math.PI*2);gCtx.fill();gCtx.beginPath();gCtx.arc(7,-23,1.5,0,Math.PI*2);gCtx.fill();
          gCtx.fillStyle='#333';gCtx.beginPath();gCtx.ellipse(0,-16,3.5,2.5,0,0,Math.PI*2);gCtx.fill();
          gCtx.strokeStyle='#555';gCtx.lineWidth=1;gCtx.beginPath();gCtx.arc(0,-13,3,0,Math.PI);gCtx.stroke();
        }else{
          gCtx.fillStyle='#F59E0B';gCtx.font='20px serif';gCtx.textAlign='center';gCtx.fillText('⭐',-15,-35+h.whackAnim*-15);gCtx.fillText('⭐',15,-30+h.whackAnim*-10);
        }
        gCtx.restore();gCtx.restore();
      }
    });
    gCtx.fillStyle='rgba(124,58,237,.5)';gCtx.font='bold 14px Orbitron,monospace';gCtx.textAlign='center';gCtx.fillText('WHACK-A-BEAR',W/2,30);
    gCtx.fillStyle='rgba(239,68,68,.7)';gCtx.font='11px Nunito,sans-serif';gCtx.textAlign='left';gCtx.fillText('Misses: '+this.misses,15,H-15);
  }
};
// Whack click handler
gameCanvas.addEventListener('click',e=>{
  if(currentGame==='whack'&&gameRunning&&!gamePaused){
    const r=gameCanvas.getBoundingClientRect();
    const sx=gameCanvas.width/r.width,sy=gameCanvas.height/r.height;
    GAMES.whack.click((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);
  }
});
gameCanvas.addEventListener('touchstart',e=>{
  if(currentGame==='whack'&&gameRunning&&!gamePaused){
    e.preventDefault();
    const r=gameCanvas.getBoundingClientRect(),t=e.touches[0];
    const sx=gameCanvas.width/r.width,sy=gameCanvas.height/r.height;
    GAMES.whack.click((t.clientX-r.left)*sx,(t.clientY-r.top)*sy);
  }
},{passive:false});

// Flappy click (exclude whack)
gameCanvas.addEventListener('click',e=>{if(currentGame==='flappy')GAMES.flappy.flap()});
gameCanvas.addEventListener('touchstart',e=>{if(currentGame==='flappy'){e.preventDefault();GAMES.flappy.flap()}},{passive:false});

// ===== START =====
window.addEventListener('load',()=>{
  if(STATE.name){
    loadHub();showScreen('hub-screen');
  }else{
    runLoading();
  }
});
window.addEventListener('resize',()=>{if(gameRunning)resizeCanvas()});

// Auto-start
runLoading();
