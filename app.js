const API = "https://api.allorigins.win/raw?url=https://bcrapj-9ska.onrender.com/sexy/all";

let mode = localStorage.getItem("baccarat_mode") || "auto";
let store = JSON.parse(localStorage.getItem("baccarat_store") || "{}");

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const overlay = document.getElementById("overlay");
const tablesBox = document.getElementById("tables");
const rankingBox = document.getElementById("ranking");

menuBtn.onclick = ()=>{
  menu.classList.toggle("open");
  overlay.classList.toggle("show");
};
overlay.onclick = ()=>{
  menu.classList.remove("open");
  overlay.classList.remove("show");
};

function setMode(m){
  mode=m;
  localStorage.setItem("baccarat_mode",m);
  menu.classList.remove("open");
  overlay.classList.remove("show");
  render();
}
function resetStats(){
  if(confirm("Reset toàn bộ Win/Lose?")){
    store={};
    save();
    render();
  }
}
function save(){
  localStorage.setItem("baccarat_store",JSON.stringify(store));
}

/* ===== AI ALGORITHMS ===== */
function algTrend(arr){
  let p=arr.filter(x=>x==="P").length;
  let b=arr.filter(x=>x==="B").length;
  return p>=b?"P":"B";
}
function algRecent(arr){
  let a=arr.slice(-8);
  let p=a.filter(x=>x==="P").length;
  let b=a.filter(x=>x==="B").length;
  return p>=b?"P":"B";
}
function algStreak(arr){
  let last=arr[arr.length-1],c=1;
  for(let i=arr.length-2;i>=0;i--){
    if(arr[i]===last)c++; else break;
  }
  return c>=3?last:algRecent(arr);
}
function algBreak(arr){
  if(arr.length<2)return algRecent(arr);
  let last=arr[arr.length-1];
  let prev=arr[arr.length-2];
  return last===prev?algRecent(arr):prev;
}

/* ===== HELPERS ===== */
function getPrev(arr){
  for(let i=arr.length-2;i>=0;i--){
    if(arr[i]==="B")return "BANKER";
    if(arr[i]==="P")return "PLAYER";
  }
  return "N/A";
}
function miniRoad(arr){
  return arr.slice(-3).map(x=>`<span class="dot ${x}"></span>`).join("");
}
function insight(percent){
  if(percent>=70) return "Đồng thuận cao";
  if(percent>=60) return "Xu hướng nhẹ";
  return "Cầu nhiễu";
}

/* ===== MAIN RENDER ===== */
async function render(){
  const res = await fetch(API);
  const data = await res.json();
  tablesBox.innerHTML="";
  rankingBox.innerHTML="<b>🏆 BÀN NGON</b><br>";

  let rank=[];

  data.forEach(t=>{
    let hist = t.ket_qua.split("").filter(x=>x==="B"||x==="P");
    if(hist.length<5 && mode==="auto")return;

    if(!store[t.ban]){
      store[t.ban]={win:0,lose:0,last:null};
    }
    let s=store[t.ban];

    let votes=[
      algTrend(hist),
      algRecent(hist),
      algStreak(hist),
      algBreak(hist)
    ];
    let p=votes.filter(x=>x==="P").length;
    let b=votes.filter(x=>x==="B").length;
    let predict = p>=b?"PLAYER":"BANKER";
    let percent = Math.round(Math.max(p,b)/4*100);

    if(s.last){
      if(s.last===predict)s.win++;
      else s.lose++;
    }
    s.last=predict;

    if(mode==="auto" && percent<55)return;

    let color = percent>=65?"green":percent>=55?"yellow":"red";
    let tableName = "BÀN "+t.ban+(t.cau?" – "+t.cau:"");

    let div=document.createElement("div");
    div.className="table";
    div.innerHTML=`
      <div style="font-weight:bold">${tableName}</div>
      <div>Phiên trước: <b>${getPrev(hist)}</b></div>
      <div class="mini-road">${miniRoad(hist)}</div>
      <div class="predict">AI: <b>${predict}</b></div>
      <div class="percent ${color}">${percent}%</div>
      <div class="stat">${insight(percent)}</div>
      <div class="stat">Win: ${s.win} | Lose: ${s.lose}</div>
    `;
    tablesBox.appendChild(div);

    if(s.win+s.lose>=3){
      rank.push({ban:t.ban,rate:Math.round(s.win/(s.win+s.lose)*100),w:s.win,l:s.lose});
    }
  });

  rank.sort((a,b)=>b.rate-a.rate).slice(0,5).forEach(r=>{
    rankingBox.innerHTML+=`Bàn ${r.ban}: ${r.rate}% (${r.w}W-${r.l}L)<br>`;
  });

  save();
}

/* TOP BUTTON */
window.onscroll=()=>{
  document.getElementById("toTop").style.display=window.scrollY>300?"block":"none";
};
document.getElementById("toTop").onclick=()=>{
  window.scrollTo({top:0,behavior:"smooth"});
};

render();
setInterval(render,15000);
