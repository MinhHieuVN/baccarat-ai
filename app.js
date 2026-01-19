const API="https://api.allorigins.win/raw?url=https://bcrapj-9ska.onrender.com/sexy/all";

let mode=localStorage.getItem("baccarat_mode")||"auto";
let store=JSON.parse(localStorage.getItem("baccarat_store")||"{}");

const menuBtn=document.getElementById("menuBtn");
const menu=document.getElementById("menu");
const overlay=document.getElementById("overlay");
const tablesBox=document.getElementById("tables");
const rankingBox=document.getElementById("ranking");

/* MENU */
menuBtn.onclick=()=>{
  menu.classList.add("open");
  overlay.style.display="block";
};
function closeMenu(){
  menu.classList.remove("open");
  overlay.style.display="none";
}
function setMode(m){
  mode=m;
  localStorage.setItem("baccarat_mode",m);
  closeMenu();
  render();
}
function resetStats(){
  if(confirm("Reset Win / Lose?")){
    store={};
    save();
    closeMenu();
    render();
  }
}
function save(){
  localStorage.setItem("baccarat_store",JSON.stringify(store));
}

/* AI */
function algTrend(a){return a.filter(x=>x==="P").length>=a.filter(x=>x==="B").length?"P":"B"}
function algRecent(a){a=a.slice(-8);return a.filter(x=>x==="P").length>=a.filter(x=>x==="B").length?"P":"B"}
function algStreak(a){
  let l=a[a.length-1],c=1;
  for(let i=a.length-2;i>=0;i--){if(a[i]===l)c++;else break}
  return c>=3?l:algRecent(a)
}
function algBreak(a){
  if(a.length<2)return algRecent(a);
  return a[a.length-1]===a[a.length-2]?algRecent(a):a[a.length-2]
}

/* HELPERS */
function getPrev(a){
  for(let i=a.length-2;i>=0;i--){
    if(a[i]==="B")return"BANKER";
    if(a[i]==="P")return"PLAYER";
  }
  return"N/A";
}
function miniRoad(a){
  return a.slice(-3).map(x=>`<span class="dot ${x}"></span>`).join("");
}
function insight(p){
  if(p>=70)return"Đồng thuận cao";
  if(p>=60)return"Xu hướng nhẹ";
  return"Cầu nhiễu";
}

/* RENDER */
async function render(){
  const res=await fetch(API);
  const data=await res.json();

  tablesBox.innerHTML="";
  rankingBox.innerHTML="<b>🏆 BÀN NGON</b><br>";

  let bestScore=-1;
  let bestDiv=null;
  let rank=[];

  data.forEach(t=>{
    let hist=t.ket_qua.split("").filter(x=>x==="B"||x==="P");
    if(hist.length<5&&mode==="auto")return;

    if(!store[t.ban])store[t.ban]={win:0,lose:0,last:null};
    let s=store[t.ban];

    let votes=[algTrend(hist),algRecent(hist),algStreak(hist),algBreak(hist)];
    let p=votes.filter(x=>x==="P").length;
    let b=votes.filter(x=>x==="B").length;
    let predict=p>=b?"PLAYER":"BANKER";
    let percent=Math.round(Math.max(p,b)/4*100);

    if(s.last){
      if(s.last===predict)s.win++;else s.lose++;
    }
    s.last=predict;

    if(mode==="auto"&&percent<55)return;

    let color=percent>=65?"green":percent>=55?"yellow":"red";
    let tableName="BÀN "+t.ban+(t.cau?" – "+t.cau:"");

    let div=document.createElement("div");
    div.className="table";
    div.innerHTML=`
      <div class="card-top">
        <b>${tableName}</b><br>
        Phiên trước: <b>${getPrev(hist)}</b>
        <div class="mini-road">${miniRoad(hist)}</div>
      </div>

      <div class="card-center">
        <div class="side">${predict}</div>
        <div class="percent ${color}">${percent}%</div>
      </div>

      <div class="card-bottom">
        <div>${insight(percent)}</div>
        <div>W ${s.win} | L ${s.lose}</div>
      </div>
    `;
    tablesBox.appendChild(div);

    let score=percent*10+(s.win-s.lose);
    if(score>bestScore){
      bestScore=score;
      bestDiv=div;
    }

    if(s.win+s.lose>=3){
      rank.push({ban:t.ban,rate:Math.round(s.win/(s.win+s.lose)*100),w:s.win,l:s.lose});
    }
  });

  if(bestDiv)bestDiv.classList.add("best");

  rank.sort((a,b)=>b.rate-a.rate).slice(0,5).forEach(r=>{
    rankingBox.innerHTML+=`Bàn ${r.ban}: ${r.rate}% (${r.w}W-${r.l}L)<br>`;
  });

  save();
}

/* TOP BTN */
window.onscroll=()=>{
  document.getElementById("toTop").style.display=window.scrollY>300?"block":"none";
};
document.getElementById("toTop").onclick=()=>{
  window.scrollTo({top:0,behavior:"smooth"});
};

render();
setInterval(render,15000);
