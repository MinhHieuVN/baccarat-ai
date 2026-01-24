// ⚠️ DÙNG CORS PROXY
const API = "https://corsproxy.io/?https://bcrapj.vercel.app/sexy/all";

const app = document.getElementById("app");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const apiStatusEl = document.getElementById("apiStatus");

// ===== API STATUS =====
function setApiStatus(state){
  apiStatusEl.className = "api-status " + state;
  apiStatusEl.querySelector(".text").textContent =
    state === "online" ? "API ONLINE" :
    state === "offline" ? "API OFFLINE" :
    "API LOADING";
}

// ===== AI LOGIC =====
const AIs = {
  Pattern: h => h.at(-1) === h.at(-2) ? h.at(-1) : null,
  Trend: h => count(h.slice(-20),"B") > count(h.slice(-20),"P") ? "B" : "P",
  Short: h => count(h.slice(-5),"B") > count(h.slice(-5),"P") ? "B" : "P",
  Streak: h => streak(h) >= 3 ? h.at(-1) : null,
  Reverse: h => streak(h) >= 4 ? flip(h.at(-1)) : null
};

const store = JSON.parse(localStorage.getItem("AI_CMD") || "{}");
const save = () => localStorage.setItem("AI_CMD", JSON.stringify(store));

const count = (a,v) => a.filter(x=>x===v).length;
const flip = v => v==="B"?"P":"B";
const streak = h => {
  let c=1;
  for(let i=h.length-1;i>0;i--){
    if(h[i]===h[i-1]) c++; else break;
  }
  return c;
};

// ===== LOAD DATA =====
async function load(){
  setApiStatus("loading");
  loading.classList.remove("hidden");
  errorBox.classList.add("hidden");
  app.querySelectorAll(".card").forEach(c=>c.remove());

  try{
    const res = await fetch(API,{cache:"no-store"});
    if(!res.ok) throw new Error("API ERROR");
    const data = await res.json();
    if(!Array.isArray(data) || data.length===0) throw new Error("NO DATA");

    setApiStatus("online");
    loading.classList.add("hidden");

    data.forEach(t=>{
      const h = (t.results||[]).filter(x=>x==="B"||x==="P");
      if(h.length < 6) return;

      const name = t.table;
      store[name] ??= {};

      const last = h.at(-1);
      Object.values(store[name]).forEach(s=>{
        if(s?.pending){
          s[last===s.pending?"win":"lose"]++;
          s.pending=null;
        }
      });

      let vote={B:0,P:0};
      let aiHTML="";

      Object.entries(AIs).forEach(([k,fn])=>{
        store[name][k] ??= {win:0,lose:0,pending:null};
        const p = fn(h);
        store[name][k].pending = p;

        const total = store[name][k].win + store[name][k].lose;
        const rate = total ? store[name][k].win / total : 0;
        if(p && rate>=0.55) vote[p]+=rate;

        aiHTML+=`
          <div class="ai-row">
            <div>${k}</div>
            <div class="${rate>=0.55?"good":"bad"}">
              ${p||"-"} • ${(rate*100).toFixed(1)}%
            </div>
          </div>`;
      });

      save();

      const final = vote.B>vote.P?"BANKER":vote.P>vote.B?"PLAYER":"SKIP";
      const conf = Math.max(vote.B,vote.P)*100;

      let decision="❌ KHÔNG THEO", cls="skip";
      if(conf>=65){decision="✅ NÊN THEO";cls="follow";}
      else if(conf>=55){decision="⚠️ CÂN NHẮC";cls="consider";}

      app.insertAdjacentHTML("beforeend",`
        <div class="card">
          <div class="card-head">
            <div>${name}</div>
            <div>${final} • ${conf.toFixed(1)}%</div>
          </div>
          <div class="decision ${cls}">${decision}</div>
          <div class="history">
            ${h.slice(-18).map(x=>`<span>${x}</span>`).join("")}
          </div>
          ${aiHTML}
        </div>
      `);
    });

  }catch(e){
    console.error(e);
    setApiStatus("offline");
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
}

load();
setInterval(load,5000);
