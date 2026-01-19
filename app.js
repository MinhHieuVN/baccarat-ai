const API = "https://api.allorigins.win/raw?url=https://bcrapj-9ska.onrender.com/sexy/all";

let mode = localStorage.getItem("baccarat_mode") || "auto";
let store = JSON.parse(localStorage.getItem("baccarat_store") || "{}");
let lastHash = "";

const tablesBox = document.getElementById("tables");
const rankingBox = document.getElementById("ranking");
const menu = document.getElementById("menu");
const overlay = document.getElementById("overlay");
const modeLabel = document.getElementById("modeLabel");

/* MODE LABEL */
function updateModeLabel(){
  modeLabel.innerHTML = mode === "auto" ? "◉ AUTO MODE" : "◯ FULL MODE";
}

/* MENU */
document.getElementById("menuBtn").onclick = () => {
  menu.classList.add("open");
  overlay.style.display = "block";
};
function closeMenu(){
  menu.classList.remove("open");
  overlay.style.display = "none";
}
function setMode(m){
  mode = m;
  localStorage.setItem("baccarat_mode", m);
  updateModeLabel();
  closeMenu();
}
function resetStats(){
  if(confirm("Reset Win / Lose?")){
    store = {};
    save();
    closeMenu();
  }
}
function save(){
  localStorage.setItem("baccarat_store", JSON.stringify(store));
}

/* AI ALGORITHMS */
const algTrend = a => a.filter(x=>x==="P").length >= a.filter(x=>x==="B").length ? "P":"B";
const algRecent = a => {
  a=a.slice(-8);
  return a.filter(x=>x==="P").length >= a.filter(x=>x==="B").length ? "P":"B";
};
const algStreak = a => {
  let l=a[a.length-1],c=1;
  for(let i=a.length-2;i>=0;i--){if(a[i]===l)c++;else break}
  return c>=3?l:algRecent(a);
};
const algBreak = a =>
  a.length<2 ? algRecent(a)
  : (a[a.length-1]===a[a.length-2] ? algRecent(a) : a[a.length-2]);

/* HELPERS */
const getPrev = a => {
  for(let i=a.length-2;i>=0;i--){
    if(a[i]==="B") return "BANKER";
    if(a[i]==="P") return "PLAYER";
  }
  return "N/A";
};
const miniRoad = a => a.slice(-3).map(x=>`<span class="dot ${x}"></span>`).join("");
const insight = p => p>=70?"Đồng thuận cao":p>=60?"Xu hướng nhẹ":"Cầu nhiễu";

/* FETCH MỚI NHẤT → DỰ ĐOÁN NGAY */
async function fetchLatest(){
  try{
    const res = await fetch(API);
    const data = await res.json();
    const hash = JSON.stringify(data);

    if(hash !== lastHash){
      lastHash = hash;
      render(data);
    }
  }catch(e){
    console.error("API error", e);
  }
}

/* RENDER */
function render(data){
  tablesBox.innerHTML = "";
  rankingBox.innerHTML = "<b>🏆 BÀN NGON</b><br>";

  let bestScore = -1;
  let bestDiv = null;
  let rank = [];

  data.forEach(t=>{
    let hist = t.ket_qua.split("").filter(x=>x==="B"||x==="P");
    if(hist.length < 5 && mode==="auto") return;

    if(!store[t.ban]) store[t.ban]={win:0,lose:0,last:null};
    let s = store[t.ban];

    let votes=[algTrend(hist),algRecent(hist),algStreak(hist),algBreak(hist)];
    let p=votes.filter(x=>x==="P").length;
    let b=votes.filter(x=>x==="B").length;
    let predict = p>=b?"PLAYER":"BANKER";
    let percent = Math.round(Math.max(p,b)/4*100);

    if(s.last){
      if(s.last===predict) s.win++;
      else s.lose++;
    }
    s.last = predict;

    if(mode==="auto" && percent<55) return;

    let color = percent>=65?"green":percent>=55?"yellow":"red";
    let name = "BÀN "+t.ban+(t.cau?" – "+t.cau:"");

    let div=document.createElement("div");
    div.className="table";
    div.innerHTML=`
      <div class="card-top">
        <b>${name}</b><br>
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

    let score = percent*10 + (s.win-s.lose);
    if(score > bestScore){
      bestScore = score;
      bestDiv = div;
    }

    if(s.win+s.lose>=3){
      rank.push({ban:t.ban,rate:Math.round(s.win/(s.win+s.lose)*100),w:s.win,l:s.lose});
    }
  });

  if(bestDiv) bestDiv.classList.add("best");

  rank.sort((a,b)=>b.rate-a.rate).slice(0,5)
    .forEach(r=>rankingBox.innerHTML+=`Bàn ${r.ban}: ${r.rate}% (${r.w}W-${r.l}L)<br>`);

  save();
}

/* START */
updateModeLabel();
fetchLatest();
setInterval(fetchLatest, 5000);
