// ===== CONFIG =====
const API =
"https://api.allorigins.win/raw?url=https://bcrapj-9ska.onrender.com/sexy/all";

const box = document.getElementById("tables");

// ===== LOAD STORAGE =====
let store = JSON.parse(localStorage.getItem("baccarat_ai_vip") || "{}");
function save(){
  localStorage.setItem("baccarat_ai_vip", JSON.stringify(store));
}

// ===== MAIN LOAD =====
async function load(){
  try{
    const res = await fetch(API);
    const data = await res.json();
    box.innerHTML = "";

    data.forEach(t=>{
      const history = t.ket_qua
        .split("")
        .filter(x=>x==="B"||x==="P");

      const len = history.length;
      const last = history[len-1];

      if(!store[t.ban]){
        store[t.ban] = {
          win:0,
          lose:0,
          lastLen:0,
          lastPredict:null
        };
      }

      const s = store[t.ban];

      // ===== AUTO WIN / LOSE =====
      if(s.lastPredict && len > s.lastLen){
        if(last === s.lastPredict) s.win++;
        else s.lose++;
      }

      // ===== AI LV5 SCORING =====
      let B = 0, P = 0;

      // bệt
      if(history.slice(-4).every(x=>x===last))
        last==="B"?B+=30:P+=30;

      // cầu đảo
      if(/BPBP$/.test(history.join(""))) B+=20;
      if(/PBPB$/.test(history.join(""))) P+=20;

      // cầu 2-2
      if(/BBPP$/.test(history.join(""))) B+=20;
      if(/PPBB$/.test(history.join(""))) P+=20;

      // gãy bệt
      if(history.slice(-3).every(x=>x===last))
        last==="B"?P+=15:B+=15;

      // độ dài streak
      let streak=1;
      for(let i=len-2;i>=0;i--){
        if(history[i]===last) streak++;
        else break;
      }
      if(streak>=4) last==="B"?B+=15:P+=15;

      // thống kê 10 ván gần nhất
      const l10 = history.slice(-10);
      const b10 = l10.filter(x=>x==="B").length;
      const p10 = l10.filter(x=>x==="P").length;
      b10>p10?B+=10:P+=10;

      // ===== RESULT =====
      const predict = B>P ? "BANKER" : "PLAYER";
      let percent = Math.round(Math.max(B,P)/(B+P)*100);
      percent = Math.max(50, Math.min(80, percent));

      s.lastPredict = predict;
      s.lastLen = len;
      save();

      let color =
        percent>=65 ? "green" :
        percent>=55 ? "yellow" : "red";

      // ===== RENDER =====
      const div = document.createElement("div");
      div.className = "table";
      div.innerHTML = `
        <div><b>🪑 Bàn ${t.ban}</b></div>
        <div class="predict">AI dự đoán: <b>${predict}</b></div>
        <div class="percent ${color}">${percent}%</div>
        <div class="stat">Win: ${s.win} | Lose: ${s.lose}</div>
        ${percent<55?'<div class="warn">⚠️ Tỷ lệ thấp – cân nhắc</div>':''}
      `;
      box.appendChild(div);
    });

  }catch(e){
    box.innerHTML = "<p style='text-align:center'>Lỗi tải dữ liệu</p>";
  }
}

// ===== AUTO REFRESH =====
load();
setInterval(load, 15000);
