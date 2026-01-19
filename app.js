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
  modeLabel.innerHTML = mode === "auto" ? "AUTO MODE" : "FULL MODE";
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

/* AI */
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

/* CORE */
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

  data.forEach(t=>{
    const hist = t.ket_qua.split("").filter(x=>x==="B"||x==="P");
    if(hist.length < 5 && mode==="auto") return;

    if(!store[t.ban]) store[t.ban]={win:0,lose:0,last:null};
    const s = store[t.ban];

    const votes=[algTrend(hist),algRecent(hist),algStreak(hist),algBreak(hist)];
    const p=votes.filter(x=>x==="P").length;
    const b=votes.filter(x=>x==="B").length;
    const predict = p>=b?"P":"B";
    const percent = Math.round(Math.max(p,b)/4*100);

    if(s.last){
      if(s.last===predict) s.win++;
      else s.lose++;
    }
    s.last = predict;

    if(mode==="auto" && percent<55) return;

    const name = "BÀN "+t.ban+(t.cau?" – "+t.cau:"");

    const div=document.createElement("div");
    div.className="table";
    div.innerHTML=`
      <div class="card-top">
        <b>${name}</b><br>
        Chuỗi: ${hist.slice(-12).join("")}
      </div>

      <div class="card-center">
        <div class="side">Dự đoán: ${predict}</div>
        <div class="percent">${percent}%</div>
      </div>

      <div class="card-bottom">
        <div>AI tổng hợp</div>
        <div>W ${s.win} | L ${s.lose}</div>
      </div>
    `;
    tablesBox.appendChild(div);
  });

  save();
}

/* START */
updateModeLabel();
fetchLatest();
setInterval(fetchLatest, 5000);
