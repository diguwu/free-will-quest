const { useState, useRef, useEffect, useCallback } = React;

const ACCENT_COLOR = "#ff3c3c";
const QUESTS = [
  { id: 1, title: "Touch the sky", desc: "Find the highest point you can safely reach. Stretch your arm up. Photo: your hand against open sky.", xp: 120, diff: "Medium", path: "A" },
  { id: 2, title: "Talk to a stranger", desc: "Have a real conversation — not just directions — with someone you've never met. Photo: you two together.", xp: 150, diff: "Hard", path: "B" },
];
const CONFETTI_COLORS = ["#ff3c3c","#ffe600","#00ff88","#3cf","#ff69b4","#fff"];
const SHOP_ITEMS = [
  { id: "PHOENIX_FEATHER", name: "Phoenix Feather", emoji: "🪶", desc: "Instantly revive a broken streak.", price: 5, currency: "₹" },
  { id: "ROAST_INSURANCE", name: "Roast Insurance", emoji: "🛡️", desc: "Block the AI roast on your next submission.", price: 2, currency: "₹" },
  { id: "REBOUND_BUNDLE", name: "Rebound Bundle", emoji: "🔥", desc: "1x Phoenix Feather + 7-Day Comeback Quest Pack. Save 5₹.", price: 15, originalPrice: 20, currency: "₹", badge: "SAVE 5₹" },
];
const MILESTONES = [
  { days: 7,   emoji: "🔥", name: "The Spark",    sub: "you showed up a whole week" },
  { days: 14,  emoji: "⚡", name: "The Habit",    sub: "it's becoming automatic" },
  { days: 30,  emoji: "💀", name: "The Convert",  sub: "you're different now" },
  { days: 100, emoji: "👁️", name: "The Sovereign", sub: "no explanation needed" },
];
const COMEBACK_QUESTS = [
  "Post a photo of your morning coffee or chai.",
  "Take a selfie somewhere you've never taken one before.",
  "Write one sentence about how you feel right now. Photo it.",
  "Do 10 jumping jacks. Photo: you out of breath.",
  "Find something blue outside. Photo it.",
  "Cook or buy something you've never eaten before.",
  "Reach out to someone you haven't talked to in months.",
];

const STORAGE_KEY = "fwq_profile_v1";
const API_KEY_STORAGE = "fwq_api_key";
const PENDING_SUBMISSIONS_KEY = "fwq_pending_submissions_v1";
const FEED_STORAGE_KEY = "fwq_feed_v1";
const ADMIN_AUTH_KEY = "fwq_admin_authenticated";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "500222";

const defaultProfile = () => ({
  questXP: 0, makerXP: 0, streak: 0, currency: 0,
  completedQuests: 0, skippedQuests: 0, skipAdUsed: [],
  activeQuestId: null, activeQuestStatus: "blind",
  lastActiveAt: Date.now(), streakFreezeUsed: [],
  inventory: { PHOENIX_FEATHER: 0, ROAST_INSURANCE: 0 },
  reboundUsedAt: null, reboundOfferExpiry: null, comebackDay: 0,
  badges: [], notifyEnabled: false,
});

const loadProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw);
    return {
      ...defaultProfile(),
      ...parsed,
      inventory: {
        ...defaultProfile().inventory,
        ...(parsed.inventory || {}),
      },
      streakFreezeUsed: parsed.streakFreezeUsed || [],
      skipAdUsed: parsed.skipAdUsed || [],
      badges: parsed.badges || [],
    };
  } catch { return defaultProfile(); }
};

const loadFeed = () => {
  try {
    const raw = localStorage.getItem(FEED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

// ── CONFETTI ──────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const ref = useRef();
  useEffect(() => {
    if (!active) return;
    const c = ref.current, ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const ps = Array.from({ length: 80 }, () => ({
      x: Math.random()*c.width, y: -20, vx: (Math.random()-.5)*6, vy: Math.random()*4+2,
      r: Math.random()*7+3, color: CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
      rot: Math.random()*360, rv: (Math.random()-.5)*8
    }));
    let f;
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      ps.forEach(p => {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r); ctx.restore();
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.rv; p.vy+=.08;
      });
      if (ps.some(p=>p.y<c.height)) f=requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(f);
  }, [active]);
  return <canvas ref={ref} style={{ position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:999,display:active?"block":"none" }} />;
}

// ── MILESTONE MOMENT ──────────────────────────────────────────────────────
function MilestoneMoment({ milestone, onDone }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#000",zIndex:980,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem" }}>
      <div style={{ fontSize:72, marginBottom:16, animation:"none" }}>{milestone.emoji}</div>
      <div style={{ fontSize:11,fontWeight:900,letterSpacing:4,color:"#ff3c3c",marginBottom:8 }}>MILESTONE UNLOCKED</div>
      <div style={{ fontSize:30,fontWeight:900,letterSpacing:-2,color:"#fff",marginBottom:8,textAlign:"center" }}>{milestone.name}</div>
      <div style={{ fontSize:14,color:"#555",marginBottom:32,textAlign:"center" }}>{milestone.sub}</div>
      <div style={{ background:"#0d0d0d",border:"1px solid #222",borderRadius:12,padding:"1rem 1.5rem",textAlign:"center",marginBottom:32 }}>
        <div style={{ fontSize:11,color:"#444",letterSpacing:2,marginBottom:4 }}>STREAK</div>
        <div style={{ fontSize:36,fontWeight:900,color:"#ffe600" }}>{milestone.days}</div>
      </div>
      <button onClick={onDone} style={{ padding:"12px 32px",background:"#ff3c3c",border:"none",color:"#fff",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>LET'S GO →</button>
    </div>
  );
}

// ── FLAME ──────────────────────────────────────────────────────────────────
function Flame({ streak, broken }) {
  const [pulse,setPulse]=useState(false);
  useEffect(()=>{ if(streak>0){setPulse(true);setTimeout(()=>setPulse(false),600);} },[streak]);
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6,background:broken?"rgba(80,80,80,0.1)":streak>0?"rgba(255,60,0,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${broken?"#2a2a2a":streak>0?"rgba(255,80,0,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:999,padding:"5px 12px",transition:"all .3s",transform:pulse?"scale(1.15)":"scale(1)" }}>
      <span style={{ fontSize:16,filter:broken?"grayscale(1)":"none" }}>{broken?"💀":streak>0?"🔥":"💀"}</span>
      <span style={{ fontSize:14,fontWeight:700,color:broken?"#333":streak>0?"#ff6030":"#333",letterSpacing:1,textDecoration:broken?"line-through":"none" }}>{streak}</span>
    </div>
  );
}

// ── BADGES DISPLAY ────────────────────────────────────────────────────────
function BadgeShelf({ earned }) {
  return (
    <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
      {MILESTONES.map(m => {
        const has = earned.includes(m.days);
        return (
          <div key={m.days} title={m.name} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,opacity:has?1:0.18,transition:"opacity .3s" }}>
            <div style={{ width:40,height:40,borderRadius:10,background:has?"#1a1a1a":"#0d0d0d",border:`1px solid ${has?"#333":"#1a1a1a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:has?"0 0 12px rgba(255,60,60,0.2)":"none" }}>{m.emoji}</div>
            <div style={{ fontSize:9,fontWeight:900,letterSpacing:1,color:has?"#555":"#222",textTransform:"uppercase" }}>{m.days}D</div>
          </div>
        );
      })}
    </div>
  );
}

// ── SCRATCH CARD ──────────────────────────────────────────────────────────
function ScratchReveal({ quest, onReveal }) {
  const ref=useRef(); const sc=useRef(0); const [revealed,setRevealed]=useState(false);
  useEffect(()=>{
    const c=ref.current,ctx=c.getContext("2d");
    c.width=c.offsetWidth; c.height=c.offsetHeight;
    ctx.fillStyle="#1a1a1a"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle="#444"; ctx.font="bold 13px monospace"; ctx.textAlign="center";
    ctx.fillText("SCRATCH TO REVEAL YOUR FATE",c.width/2,c.height/2-8);
    ctx.fillText("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",c.width/2,c.height/2+14);
  },[]);
  const scratch=(e)=>{
    if(revealed)return;
    const c=ref.current,ctx=c.getContext("2d"),rect=c.getBoundingClientRect();
    const x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const y=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    ctx.globalCompositeOperation="destination-out";
    ctx.beginPath(); ctx.arc(x*(c.width/rect.width),y*(c.height/rect.height),28,0,Math.PI*2); ctx.fill();
    sc.current+=1;
    if(sc.current>18){setRevealed(true);onReveal();}
  };
  return (
    <div style={{ position:"relative",borderRadius:12,overflow:"hidden",marginBottom:16,height:90 }}>
      <div style={{ position:"absolute",inset:0,background:"#0d0d0d",border:"1px solid #333",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <div style={{ fontSize:18,fontWeight:900,color:"#ff3c3c",letterSpacing:-1,textTransform:"uppercase" }}>{quest.title}</div>
        <div style={{ fontSize:12,color:"#888",marginTop:4 }}>PATH {quest.path} · +{quest.xp} XP</div>
      </div>
      <canvas ref={ref} onMouseMove={e=>e.buttons&&scratch(e)} onMouseDown={scratch} onTouchMove={scratch} onTouchStart={scratch} style={{ position:"absolute",inset:0,width:"100%",height:"100%",cursor:"crosshair",borderRadius:12,touchAction:"none" }} />
    </div>
  );
}

// ── AD INTERSTITIAL ───────────────────────────────────────────────────────
function AdInterstitial({ onDone }) {
  const [secs,setSecs]=useState(5);
  useEffect(()=>{
    const t=setInterval(()=>setSecs(s=>{if(s<=1){clearInterval(t);onDone();return 0;}return s-1;}),1000);
    return ()=>clearInterval(t);
  },[onDone]);
  return (
    <div style={{ position:"fixed",inset:0,background:"#000",zIndex:900,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem" }}>
      <div style={{ fontSize:10,fontWeight:900,letterSpacing:3,color:"#333",marginBottom:24 }}>ADVERTISEMENT</div>
      <div style={{ width:"100%",maxWidth:320,height:250,background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:13,color:"#333",letterSpacing:2,marginBottom:8 }}>AD PLACEHOLDER</div>
          <div style={{ fontSize:11,color:"#222" }}>Google AdSense / AdMob</div>
        </div>
      </div>
      <div style={{ marginTop:24,fontSize:12,color:"#444",letterSpacing:2 }}>AD ENDS IN {secs}s</div>
      {secs===0&&<button onClick={onDone} style={{ marginTop:12,padding:"8px 20px",background:"#ff3c3c",border:"none",color:"#fff",borderRadius:6,fontSize:12,fontWeight:900,cursor:"pointer" }}>CONTINUE →</button>}
    </div>
  );
}

// ── NOTIFY PROMPT ─────────────────────────────────────────────────────────
function NotifyPrompt({ onAccept, onDismiss }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:850,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onDismiss} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.7)" }} />
      <div style={{ position:"relative",width:"100%",maxWidth:480,margin:"0 auto",background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:"16px 16px 0 0",padding:"1.75rem 1.25rem",zIndex:1 }}>
        <div style={{ textAlign:"center",marginBottom:"1.25rem" }}>
          <div style={{ fontSize:32,marginBottom:10 }}>🔔</div>
          <div style={{ fontSize:11,fontWeight:900,letterSpacing:3,color:"#ff3c3c",marginBottom:6 }}>DON'T LOSE YOUR STREAK</div>
          <div style={{ fontSize:18,fontWeight:900,letterSpacing:-1,marginBottom:8 }}>REMIND ME TOMORROW</div>
          <div style={{ fontSize:13,color:"#555",lineHeight:1.6 }}>Get a nudge every day when the new quest drops. No spam. One notification.</div>
        </div>
        <button onClick={onAccept} style={{ width:"100%",padding:"13px",background:"#ff3c3c",border:"none",color:"#fff",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer",marginBottom:10 }}>YEAH, REMIND ME →</button>
        <button onClick={onDismiss} style={{ width:"100%",padding:"10px",background:"none",border:"none",color:"#333",fontSize:12,cursor:"pointer",letterSpacing:2 }}>NAH, I'LL REMEMBER</button>
      </div>
    </div>
  );
}

// ── STREAK FREEZE HOOK ────────────────────────────────────────────────────
function useStreakFreezeLogic(profile, setProfile) {
  const now=Date.now(), threeDaysAgo=now-3*24*3600000;
  const recent=profile.streakFreezeUsed.filter(t=>t>threeDaysAgo);
  const canUse=recent.length<2;
  const nextIn=canUse?0:Math.max(0,recent[0]+3*24*3600000-now);
  const useFreeze=useCallback(()=>{ if(!canUse)return false; setProfile(p=>({...p,streak:p.streak+1,streakFreezeUsed:[...p.streakFreezeUsed,Date.now()]})); return true; },[canUse,setProfile]);
  const fmt=(ms)=>{ const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000); return `${h}h ${m}m`; };
  return { canUse, recentUses:recent.length, nextIn, useFreeze, fmt };
}

// ── REBOUND HOOK ──────────────────────────────────────────────────────────
function useReboundLogic(profile, setProfile) {
  const now=Date.now(), hrs=(now-profile.lastActiveAt)/3600000;
  const noRecent=!profile.reboundUsedAt||(profile.reboundUsedAt<now-30*24*3600000);
  const shouldTrigger=profile.streak>3&&hrs>24&&hrs<48&&noRecent;
  const timeLeft=profile.reboundOfferExpiry?Math.max(0,profile.reboundOfferExpiry-now):0;
  const triggerOffer=useCallback(()=>setProfile(p=>({...p,reboundOfferExpiry:Date.now()+2*3600000})),[setProfile]);
  const claimRebound=useCallback((cur)=>{ if(cur<15)return false; setProfile(p=>({...p,currency:p.currency-15,streak:1,lastActiveAt:Date.now(),reboundUsedAt:Date.now(),reboundOfferExpiry:null,inventory:{...p.inventory,PHOENIX_FEATHER:(p.inventory.PHOENIX_FEATHER||0)+1},comebackDay:1})); return true; },[setProfile]);
  const fmt=(ms)=>{ const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000); return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; };
  return { shouldTrigger, timeLeft, triggerOffer, claimRebound, fmt };
}

// ── SHOP ──────────────────────────────────────────────────────────────────
function Shop({ profile, setProfile, onClose }) {
  const [bought,setBought]=useState(null);
  const buy=(item)=>{
    if(profile.currency<item.price)return;
    setProfile(p=>({ ...p, currency:p.currency-item.price, inventory:{...p.inventory,[item.id]:(p.inventory[item.id]||0)+1}, ...(item.id==="REBOUND_BUNDLE"?{streak:1,lastActiveAt:Date.now(),reboundUsedAt:Date.now(),comebackDay:1}:{}) }));
    setBought(item.id); setTimeout(()=>setBought(null),2000);
  };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.7)" }} />
      <div style={{ position:"relative",width:"100%",maxWidth:480,margin:"0 auto",background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:"16px 16px 0 0",padding:"1.5rem 1.25rem",zIndex:1,maxHeight:"85vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
          <div>
            <div style={{ fontSize:11,fontWeight:900,letterSpacing:3,color:"#ff3c3c" }}>THE SHOP</div>
            <div style={{ fontSize:20,fontWeight:900,letterSpacing:-1 }}>POWER-UPS</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ fontSize:15,fontWeight:900,color:"#ffe600" }}>₹{profile.currency}</div>
            <button onClick={onClose} style={{ background:"none",border:"1px solid #222",color:"#888",borderRadius:6,padding:"5px 10px",fontSize:14,cursor:"pointer" }}>✕</button>
          </div>
        </div>
        {SHOP_ITEMS.map(item=>(
          <div key={item.id} style={{ background:"#111",border:item.id==="REBOUND_BUNDLE"?"1px solid #ff3c3c44":"1px solid #1a1a1a",borderRadius:10,padding:"1rem 1.1rem",marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap" }}>
                  <span style={{ fontSize:16 }}>{item.emoji}</span>
                  <span style={{ fontSize:14,fontWeight:900,color:"#fff",textTransform:"uppercase",letterSpacing:-0.5 }}>{item.name}</span>
                  {item.badge&&<span style={{ fontSize:10,fontWeight:900,background:"#ff3c3c",color:"#fff",padding:"2px 7px",borderRadius:4,letterSpacing:1 }}>{item.badge}</span>}
                </div>
                <div style={{ fontSize:12,color:"#555",lineHeight:1.5 }}>{item.desc}</div>
                <div style={{ fontSize:11,color:"#2a2a2a",marginTop:4 }}>owned: {profile.inventory[item.id]||0}</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                {item.originalPrice&&<div style={{ fontSize:11,color:"#333",textDecoration:"line-through",marginBottom:2 }}>{item.currency}{item.originalPrice}</div>}
                <div style={{ fontSize:16,fontWeight:900,color:"#ffe600" }}>{item.currency}{item.price}</div>
                <button onClick={()=>buy(item)} style={{ marginTop:6,padding:"7px 14px",background:bought===item.id?"#00ff88":profile.currency>=item.price?"#fff":"#1a1a1a",border:"none",color:bought===item.id?"#000":profile.currency>=item.price?"#000":"#333",borderRadius:6,fontSize:11,fontWeight:900,letterSpacing:1,cursor:profile.currency>=item.price?"pointer":"not-allowed",transition:"all .2s" }}>
                  {bought===item.id?"BOUGHT!":profile.currency>=item.price?"BUY":"LOW ₹"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REBOUND SHEET ─────────────────────────────────────────────────────────
function ReboundSheet({ profile, setProfile, onClose, rebound }) {
  const [claimed,setClaimed]=useState(false);
  const [tick,setTick]=useState(rebound.timeLeft);
  useEffect(()=>{ const t=setInterval(()=>setTick(p=>Math.max(0,p-1000)),1000); return()=>clearInterval(t); },[]);
  const handle=()=>{ if(rebound.claimRebound(profile.currency)){setClaimed(true);setTimeout(onClose,2000);} };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:850,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.8)" }} />
      <div style={{ position:"relative",width:"100%",maxWidth:480,margin:"0 auto",background:"#0d0d0d",border:"1px solid #ff3c3c44",borderRadius:"16px 16px 0 0",padding:"1.75rem 1.25rem",zIndex:1 }}>
        <div style={{ textAlign:"center",marginBottom:"1.25rem" }}>
          <div style={{ fontSize:28,marginBottom:6 }}>💀</div>
          <div style={{ fontSize:11,fontWeight:900,letterSpacing:3,color:"#ff3c3c",marginBottom:4 }}>STREAK BROKEN</div>
          <div style={{ fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:8 }}>THE REBOUND</div>
          <div style={{ fontSize:13,color:"#555",lineHeight:1.6 }}>Your {profile.streak}-day streak is gone. But it doesn't have to stay that way.</div>
        </div>
        <div style={{ background:"#111",border:"1px solid #ff3c3c33",borderRadius:10,padding:"1rem 1.25rem",marginBottom:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14,fontWeight:900,color:"#fff" }}>🪶 Phoenix Feather + 7-Day Comeback</div>
              <div style={{ fontSize:12,color:"#555",marginTop:3 }}>Revive streak + 7 easy quests to ease back in</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11,color:"#444",textDecoration:"line-through" }}>₹20</div>
              <div style={{ fontSize:20,fontWeight:900,color:"#ffe600" }}>₹15</div>
            </div>
          </div>
          <div style={{ fontSize:11,color:"#ff3c3c",fontWeight:900,letterSpacing:2,textAlign:"center" }}>OFFER EXPIRES IN {rebound.fmt(tick)}</div>
        </div>
        {!claimed?(
          <button onClick={handle} disabled={profile.currency<15} style={{ width:"100%",padding:"14px",background:profile.currency>=15?"#ff3c3c":"#1a1a1a",border:"none",color:profile.currency>=15?"#fff":"#333",borderRadius:8,fontSize:14,fontWeight:900,letterSpacing:2,cursor:profile.currency>=15?"pointer":"not-allowed" }}>
            {profile.currency>=15?"REVIVE FOR ₹15 →":`NEED ₹${15-profile.currency} MORE`}
          </button>
        ):(
          <div style={{ textAlign:"center",fontSize:16,fontWeight:900,color:"#00ff88" }}>STREAK REVIVED. LET'S GO. 🔥</div>
        )}
        <button onClick={onClose} style={{ width:"100%",marginTop:10,padding:"10px",background:"none",border:"none",color:"#333",fontSize:12,cursor:"pointer",letterSpacing:2 }}>ACCEPT THE LOSS</button>
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────
const SLIDES = [
  { emoji:"🎲", title:"TWO PATHS.\nONE DARE.", body:"Every day, two quests. You scratch to reveal them. You pick one. You do it in real life." },
  { emoji:"📸", title:"PROOF OR\nIT DIDN'T HAPPEN.", body:"Upload a photo. AI judges whether you actually did it. No cheating. No mercy." },
  { emoji:"🔥", title:"SHOW UP.\nOR LOSE IT ALL.", body:"Miss a day, your streak dies. Keep going and earn badges nobody else has." },
];
function Onboarding({ onDone }) {
  const [slide,setSlide]=useState(0);
  const s=SLIDES[slide];
  return (
    <div style={{ position:"fixed",inset:0,background:"#080808",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem" }}>
      <div style={{ fontSize:64,marginBottom:24 }}>{s.emoji}</div>
      <div style={{ fontSize:28,fontWeight:900,letterSpacing:-2,color:"#fff",marginBottom:12,textAlign:"center",whiteSpace:"pre-line",lineHeight:1.1 }}>{s.title}</div>
      <div style={{ fontSize:14,color:"#555",lineHeight:1.7,textAlign:"center",maxWidth:300,marginBottom:40 }}>{s.body}</div>
      <div style={{ display:"flex",gap:6,marginBottom:32 }}>
        {SLIDES.map((_,i)=><div key={i} style={{ width:i===slide?20:6,height:6,borderRadius:3,background:i===slide?"#ff3c3c":"#222",transition:"width .3s" }} />)}
      </div>
      {slide<SLIDES.length-1?(
        <button onClick={()=>setSlide(s=>s+1)} style={{ padding:"13px 40px",background:"#ff3c3c",border:"none",color:"#fff",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>NEXT →</button>
      ):(
        <button onClick={onDone} style={{ padding:"13px 40px",background:"#fff",border:"none",color:"#000",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>LET'S GO →</button>
      )}
    </div>
  );
}

// ── ADMIN LOGIN MODAL ────────────────────────────────────────────────────
function AdminLoginModal({ onSuccess, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleLogin = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      onSuccess();
    } else {
      setError("Invalid credentials");
      setUsername("");
      setPassword("");
    }
  };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.7)" }} />
      <div style={{ position:"relative",width:"100%",maxWidth:480,margin:"0 auto",background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:"16px 16px 0 0",padding:"1.5rem 1.25rem",zIndex:1 }}>
        <div style={{ fontSize:16,fontWeight:900,letterSpacing:-1,marginBottom:"1.25rem" }}>ADMIN ACCESS</div>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={{ width:"100%",boxSizing:"border-box",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"inherit",marginBottom:10,outline:"none" }} />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={{ width:"100%",boxSizing:"border-box",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"inherit",marginBottom:10,outline:"none" }} />
        {error&&<div style={{ fontSize:12,color:"#ff3c3c",marginBottom:10,letterSpacing:1 }}>❌ {error}</div>}
        <button onClick={handleLogin} style={{ width:"100%",padding:"12px",background:"#ff3c3c",border:"none",color:"#fff",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer",marginBottom:10 }}>LOGIN →</button>
        <button onClick={onClose} style={{ width:"100%",padding:"8px",background:"none",border:"none",color:"#333",fontSize:11,cursor:"pointer",letterSpacing:1 }}>CANCEL</button>
      </div>
    </div>
  );
}

// ── ADMIN QUEUE ──────────────────────────────────────────────────────────
function AdminQueue({ pending, onReview, onLogout }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
        <div>
          <div style={{ fontSize:11,fontWeight:900,letterSpacing:3,color:"#ff3c3c",marginBottom:2 }}>ADMIN PANEL</div>
          <div style={{ fontSize:20,fontWeight:900,letterSpacing:-1 }}>VERIFICATION QUEUE</div>
        </div>
        <button onClick={onLogout} style={{ background:"none",border:"1px solid #1a1a1a",color:"#888",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:900,cursor:"pointer" }}>LOGOUT</button>
      </div>
      {pending.length===0?(
        <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"2rem",textAlign:"center" }}>
          <div style={{ fontSize:13,color:"#333",letterSpacing:2,fontWeight:900 }}>NO PENDING SUBMISSIONS</div>
          <div style={{ fontSize:11,color:"#222",marginTop:8 }}>waiting for users...</div>
        </div>
      ):(
        <div>
          <div style={{ fontSize:11,color:"#444",letterSpacing:2,fontWeight:900,marginBottom:12 }}>{pending.length} PENDING</div>
          {pending.map((sub,i)=>(
            <div key={sub.id} style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"1rem",marginBottom:10 }}>
              <div style={{ display:"flex",gap:12,marginBottom:10 }}>
                <img src={sub.photoBase64} alt="proof" style={{ width:80,height:80,objectFit:"cover",borderRadius:8 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:900,marginBottom:4,textTransform:"uppercase",letterSpacing:-0.5 }}>{sub.questTitle}</div>
                  <div style={{ fontSize:10,color:"#333",letterSpacing:1 }}>ID: {sub.id}</div>
                  <div style={{ fontSize:10,color:"#222",marginTop:4 }}>submitted {new Date(sub.submittedAt).toLocaleTimeString()}</div>
                </div>
              </div>
              <button onClick={()=>onReview(sub)} style={{ width:"100%",padding:"9px",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:8,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>REVIEW →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ADMIN REVIEW CARD ────────────────────────────────────────────────────
function AdminReviewCard({ submission, onApprove, onReject, onBack }) {
  const [roast, setRoast] = useState("");
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom:"1rem",padding:"8px 12px",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:6,fontSize:11,fontWeight:900,cursor:"pointer" }}>← BACK</button>
      <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,padding:"1.25rem" }}>
        <div style={{ fontSize:20,fontWeight:900,color:"#ff3c3c",marginBottom:12,letterSpacing:-1 }}>{submission.questTitle}</div>
        <img src={submission.photoBase64} alt="proof" style={{ width:"100%",borderRadius:10,marginBottom:12,maxHeight:300,objectFit:"cover" }} />
        <div style={{ fontSize:11,fontWeight:900,letterSpacing:2,color:"#444",marginBottom:8 }}>YOUR ROAST (optional)</div>
        <textarea value={roast} onChange={e=>setRoast(e.target.value)} placeholder="Write a cheeky, funny roast or reason..." rows={3} style={{ width:"100%",boxSizing:"border-box",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:8,padding:"10px 12px",fontSize:12,fontFamily:"inherit",resize:"vertical",outline:"none",marginBottom:12 }} />
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>onReject(submission,roast)} style={{ flex:1,padding:"11px",background:"#500",border:"1px solid #a00",color:"#faa",borderRadius:8,fontSize:12,fontWeight:900,letterSpacing:1,cursor:"pointer" }}>REJECT ✗</button>
          <button onClick={()=>onApprove(submission,roast)} style={{ flex:1,padding:"11px",background:"#050",border:"1px solid #0a0",color:"#afa",borderRadius:8,fontSize:12,fontWeight:900,letterSpacing:1,cursor:"pointer" }}>APPROVE ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── BANNER AD (AppLovin) ──────────────────────────────────────────────────
function BannerAd() {
  return (
    <div id="banner-ad-container" style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:8,padding:"8px 14px",marginBottom:14,textAlign:"center",minHeight:60,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <span style={{ fontSize:10,color:"#2a2a2a",letterSpacing:2,fontWeight:900 }}>📢 ADVERTISEMENT — AppLovin Banner</span>
    </div>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────
function SettingsModal({ onClose, apiKey, setApiKey }) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    localStorage.setItem(API_KEY_STORAGE, tempKey);
    setApiKey(tempKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",alignItems:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.7)" }} />
      <div style={{ position:"relative",width:"100%",maxWidth:480,margin:"0 auto",background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:"16px 16px 0 0",padding:"1.5rem 1.25rem",zIndex:1 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
          <div style={{ fontSize:16,fontWeight:900,letterSpacing:-1 }}>API KEY</div>
          <button onClick={onClose} style={{ background:"none",border:"1px solid #222",color:"#888",borderRadius:6,padding:"5px 10px",fontSize:14,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ fontSize:11,color:"#555",marginBottom:12,lineHeight:1.6 }}>Add your Anthropic API key to enable AI photo verification. Get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{color:"#3cf",textDecoration:"underline"}}>console.anthropic.com</a></div>
        <textarea value={tempKey} onChange={e=>setTempKey(e.target.value)} placeholder="sk-ant-..." rows={3} style={{ width:"100%",boxSizing:"border-box",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:8,padding:"10px 12px",fontSize:12,fontFamily:"monospace",resize:"vertical",outline:"none",marginBottom:12 }} />
        <button onClick={handleSave} style={{ width:"100%",padding:"12px",background:saved?"#00ff88":"#ff3c3c",border:"none",color:saved?"#000":"#fff",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer",transition:"all .2s" }}>{saved?"SAVED ✓":"SAVE KEY"}</button>
      </div>
    </div>
  );
}

// ── TOMORROW TEASER ───────────────────────────────────────────────────────
function TomorrowTeaser() {
  return (
    <div style={{ background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,padding:"0.9rem 1.1rem",marginTop:10,display:"flex",alignItems:"center",gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10,fontWeight:900,letterSpacing:2,color:"#333",marginBottom:4 }}>TOMORROW'S QUEST</div>
        <div style={{ fontSize:14,fontWeight:900,color:"#1a1a1a",filter:"blur(4px)",userSelect:"none" }}>Something about silence</div>
        <div style={{ fontSize:11,color:"#2a2a2a",marginTop:3 }}>Unlocks in 18h · voted by community</div>
      </div>
      <div style={{ fontSize:20 }}>🔒</div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
function App() {
  const [onboarded,setOnboarded]=useState(false);
  const [profile,setProfile]=useState(loadProfile);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem(API_KEY_STORAGE)||"");
  const [showSettings,setShowSettings]=useState(false);
  const [adminAuthenticated,setAdminAuthenticated]=useState(()=>localStorage.getItem(ADMIN_AUTH_KEY)==="true");
  const [showAdminLogin,setShowAdminLogin]=useState(false);
  const [pendingSubmissions,setPendingSubmissions]=useState(()=>{
    const saved=localStorage.getItem(PENDING_SUBMISSIONS_KEY);
    return saved?JSON.parse(saved):[];
  });
  const [adminReviewingId,setAdminReviewingId]=useState(null);
  const [tab,setTab]=useState("quest");
  const [phase,setPhase]=useState(()=>loadProfile().activeQuestStatus||"blind");
  const [chosenQuest,setChosenQuest]=useState(()=>QUESTS.find(q=>q.id===loadProfile().activeQuestId)||null);
  const [scratchDone,setScratchDone]=useState([false,false]);
  const [preview,setPreview]=useState(null);
  const [aiResult,setAiResult]=useState(null);
  const [roast,setRoast]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const [shake,setShake]=useState(false);
  const [showAd,setShowAd]=useState(false);
  const [adDone,setAdDone]=useState(false);
  const [adMode,setAdMode]=useState(null);
  const [showShop,setShowShop]=useState(false);
  const [showRebound,setShowRebound]=useState(false);
  const [showNotify,setShowNotify]=useState(false);
  const [newMilestone,setNewMilestone]=useState(null);
  const [candidates,setCandidates]=useState([
    {id:1,title:"Leave a kind note for a stranger",desc:"Write something on paper, leave it public. Photo: note in place.",votes:42,by:"Priya M.",isAI:false},
    {id:2,title:"Eat something you've never tried",desc:"One food you've never eaten. Photo: you with the food.",votes:38,by:"AI",isAI:true},
  ]);
  const [voted,setVoted]=useState(null);
  const [newIdea,setNewIdea]=useState({title:"",desc:""});
  const [labStep,setLabStep]=useState("vote");
  const [lbTab,setLbTab]=useState("completers");
  const [generatingAI,setGeneratingAI]=useState(false);
  const [feed,setFeed]=useState(loadFeed);
  const [diffVote,setDiffVote]=useState(null);
  const [pathRevealed,setPathRevealed]=useState(false);
  const fileRef=useRef();
  const [,tick]=useState(0);
  useEffect(()=>{ const t=setInterval(()=>tick(n=>n+1),1000); return()=>clearInterval(t); },[]);
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); },[profile]);
  useEffect(()=>{ localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed)); },[feed]);

  const freeze=useStreakFreezeLogic(profile,setProfile);
  const rebound=useReboundLogic(profile,setProfile);
  const streakBroken=(Date.now()-profile.lastActiveAt)>24*3600000&&profile.streak>0;
  const skipWindowStart=Date.now()-3*24*3600000;
  const recentSkipUses=(profile.skipAdUsed||[]).filter(t=>t>skipWindowStart);
  const skipCanUse=recentSkipUses.length<2;
  const skipNextIn=skipCanUse?0:Math.max(0,recentSkipUses[0]+3*24*3600000-Date.now());
  const fmtCountdown=(ms)=>{
    const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
    return `${h}h ${m}m`;
  };

  const checkMilestone=(newStreak)=>{
    const m=MILESTONES.find(m=>m.days===newStreak&&!profile.badges.includes(m.days));
    if(m){ setProfile(p=>({...p,badges:[...p.badges,m.days]})); setNewMilestone(m); }
  };

  const triggerWin=()=>{ setConfetti(true); setShake(true); setTimeout(()=>setConfetti(false),3500); setTimeout(()=>setShake(false),600); };
  const pushFeedEntry=(entry)=>setFeed(prev=>[{id:Date.now(),user:"you",avatar:"YO",upvotes:0,time:"just now",isMe:true,...entry},...prev].slice(0,25));
  const syncQuestState=(quest,status)=>{
    setChosenQuest(quest);
    setPhase(status);
    setProfile(p=>({...p,activeQuestId:quest?.id??null,activeQuestStatus:status}));
  };

  const handleFile=(e)=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{setPreview(ev.target.result);setPhase("uploading");}; r.readAsDataURL(f); };

  const handleAdminApprove=(submission,roast)=>{
    // Mark as approved
    const updated=pendingSubmissions.map(s=>s.id===submission.id?{...s,status:"approved",roast:roast||"Approved by admin!"}:s);
    setPendingSubmissions(updated);
    localStorage.setItem(PENDING_SUBMISSIONS_KEY,JSON.stringify(updated));

    // Give user rewards
    const newStreak=profile.streak+1;
    setProfile(p=>({...p,questXP:p.questXP+submission.questXP,completedQuests:p.completedQuests+1,streak:newStreak,lastActiveAt:Date.now()}));

    setAiResult({verified:true,reason:"Your quest was approved by admin! Well done.",roast:roast||"Approved by admin!"});
    setRoast(roast||"Nice work!");
    setAdminReviewingId(null);
    syncQuestState({ id: submission.questId||submission.id, title: submission.questTitle, xp: submission.questXP, path: submission.questPath, desc: submission.questDesc, diff: submission.questDiff }, "done");
    pushFeedEntry({ verified:true, status:"completed", title:submission.questTitle, xp:submission.questXP, path:submission.questPath, streak:newStreak });
    triggerWin();
    checkMilestone(newStreak);
  };

  const handleAdminReject=(submission,roast)=>{
    // Mark as rejected
    const updated=pendingSubmissions.map(s=>s.id===submission.id?{...s,status:"rejected",roast:roast||"Rejected - doesn't show quest completion."}:s);
    setPendingSubmissions(updated);
    localStorage.setItem(PENDING_SUBMISSIONS_KEY,JSON.stringify(updated));

    setAiResult({verified:false,reason:"Admin said this doesn't show quest completion.",roast:roast||"Doesn't show the quest completion"});
    setRoast(roast||"Doesn't look right to admin");
    syncQuestState(chosenQuest,"failed");
    setAdminReviewingId(null);
  };

  const doVerify=useCallback(async()=>{
    if(!apiKey){setRoast("no API key configured. check settings.");syncQuestState(chosenQuest,"failed");return;}
    setPhase("verifying");
    const hasIns=profile.inventory.ROAST_INSURANCE>0;
    try {
      const base64=preview.split(",")[1], mediaType=preview.split(";")[0].split(":")[1];
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514",max_tokens:1000,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:mediaType,data:base64}},
            {type:"text",text:`Quest: "${chosenQuest.title}" — "${chosenQuest.desc}". Does this photo show completion? Also write a short roast (1-2 sentences, cheeky/funny, slightly mean). Reply ONLY as JSON: {"verified":true/false,"reason":"short sentence","roast":"cheeky comment"}`}
          ]}]
        })
      });
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(parsed.verified){
        const newStreak=profile.streak+1;
        setProfile(p=>({ ...p,questXP:p.questXP+chosenQuest.xp,completedQuests:p.completedQuests+1,streak:newStreak,lastActiveAt:Date.now(), ...(hasIns?{inventory:{...p.inventory,ROAST_INSURANCE:p.inventory.ROAST_INSURANCE-1}}:{}) }));
        setAiResult(parsed); setRoast(hasIns?"🛡️ Roast Insurance activated. You're safe — this time.":parsed.roast);
        syncQuestState(chosenQuest,"done"); pushFeedEntry({ verified:true, status:"completed", title:chosenQuest.title, xp:chosenQuest.xp, path:chosenQuest.path, streak:newStreak });
        triggerWin(); checkMilestone(newStreak);
        setTimeout(()=>setShowNotify(true),2000);
      } else {
        setAiResult(parsed); setRoast(hasIns?"🛡️ Roast blocked. Still failed though.":parsed.roast); syncQuestState(chosenQuest,"failed");
      }
    } catch(e) { setAiResult({verified:false,reason:"Connection failed: "+e.message}); setRoast("couldn't even connect. bold strategy."); syncQuestState(chosenQuest,"failed"); }
  },[preview,chosenQuest,profile,apiKey]);

  useEffect(()=>{
    if(!adDone)return;
    setAdDone(false);
    if(adMode==="verify") doVerify();
    if(adMode==="bypass") bypassQuest();
    setAdMode(null);
  },[adDone,adMode,doVerify]);

  const generateAI=async()=>{
    if(!apiKey){setRoast("no API key configured.");return;}
    setGeneratingAI(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`Generate 2 bold real-world daily quest ideas for Free Will Quest. Each must be doable, photo-verifiable, feel like a dare. Reply ONLY as JSON: [{"title":"...","desc":"..."},{"title":"...","desc":"..."}]`}]})});
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"[]";
      const qs=JSON.parse(text.replace(/```json|```/g,"").trim());
      setCandidates(prev=>[...prev,...qs.map((q,i)=>({id:Date.now()+i,title:q.title,desc:q.desc,votes:0,by:"AI",isAI:true}))]);
    } catch {} setGeneratingAI(false);
  };

  const reset=()=>{ setPreview(null);setAiResult(null);setRoast(null);setScratchDone([false,false]);setDiffVote(null);setPathRevealed(false);syncQuestState(null,"blind"); };
  const retakeUpload=()=>{ setPreview(null);setAiResult(null);setRoast(null);syncQuestState(chosenQuest,"chosen"); };
  const bypassQuest=()=>{
    if(!chosenQuest||!skipCanUse)return;
    setProfile(p=>({...p,skippedQuests:p.skippedQuests+1,skipAdUsed:[...(p.skipAdUsed||[]),Date.now()],lastActiveAt:Date.now()}));
    pushFeedEntry({ verified:false, status:"bypassed", title:chosenQuest.title, xp:0, path:chosenQuest.path });
    setPreview(null);
    setAiResult(null);
    setRoast(null);
    syncQuestState(chosenQuest,"bypassed");
  };
  const verifyWithAI=()=>{ 
    // Submit to admin review queue instead of AI
    const submission={id:Date.now(),questId:chosenQuest.id,questTitle:chosenQuest.title,questDesc:chosenQuest.desc,questXP:chosenQuest.xp,questPath:chosenQuest.path,questDiff:chosenQuest.diff,photoBase64:preview,status:"pending",submittedAt:Date.now()};
    const updated=[...pendingSubmissions,submission];
    setPendingSubmissions(updated);
    localStorage.setItem(PENDING_SUBMISSIONS_KEY,JSON.stringify(updated));
    syncQuestState(chosenQuest,"submitted");
  };
  const tabs=adminAuthenticated?[{id:"quest",label:"TODAY"},{id:"lab",label:"LAB"},{id:"community",label:"FEED"},{id:"leaderboard",label:"RANKS"},{id:"admin",label:"ADMIN"}]:[{id:"quest",label:"TODAY"},{id:"lab",label:"LAB"},{id:"community",label:"FEED"},{id:"leaderboard",label:"RANKS"}];

  if(!onboarded) return <Onboarding onDone={()=>setOnboarded(true)} />;

  return (
    <div style={{ background:"#080808",minHeight:"100vh",color:"#fff",fontFamily:"'Arial Black',Arial,sans-serif" }}>
      <Confetti active={confetti} />
      {showAd&&<AdInterstitial onDone={()=>{setShowAd(false);setAdDone(true);}} />}
      {showShop&&<Shop profile={profile} setProfile={setProfile} onClose={()=>setShowShop(false)} />}
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)} apiKey={apiKey} setApiKey={setApiKey} />}
      {showAdminLogin&&<AdminLoginModal onSuccess={()=>{setAdminAuthenticated(true);setShowAdminLogin(false);}} onClose={()=>setShowAdminLogin(false)} />}
      {showRebound&&<ReboundSheet profile={profile} setProfile={setProfile} onClose={()=>setShowRebound(false)} rebound={rebound} />}
      {showNotify&&!profile.notifyEnabled&&<NotifyPrompt onAccept={()=>{setProfile(p=>({...p,notifyEnabled:true}));setShowNotify(false);}} onDismiss={()=>setShowNotify(false)} />}
      {newMilestone&&<MilestoneMoment milestone={newMilestone} onDone={()=>setNewMilestone(null)} />}

      <div style={{ maxWidth:480,margin:"0 auto",padding:"1.25rem 1rem",transition:shake?"transform .1s":"none",transform:shake?`translateX(${Math.random()>.5?6:-6}px)`:"none" }}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
          <div>
            <div style={{ fontSize:24,fontWeight:900,letterSpacing:-2,lineHeight:1 }}>FREE WILL<br/>QUEST</div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
            <div style={{ display:"flex",gap:6,alignItems:"center" }}>
              <Flame streak={profile.streak} broken={streakBroken} />
              <button onClick={()=>setShowShop(true)} title="Shop" style={{ background:"none",border:"1px solid #1a1a1a",color:"#555",borderRadius:8,padding:"5px 10px",fontSize:15,cursor:"pointer",lineHeight:1 }}>🛒</button>
              {!adminAuthenticated&&<button onClick={()=>setShowAdminLogin(true)} title="Admin" style={{ background:"none",border:"1px solid #1a1a1a",color:"#333",borderRadius:8,padding:"5px 10px",fontSize:15,cursor:"pointer",lineHeight:1 }}>🔐</button>}
              {adminAuthenticated&&<button onClick={()=>{setTab("admin");}} title="Admin Panel" style={{ background:"none",border:"1px solid #ff3c3c44",color:"#ff3c3c",borderRadius:8,padding:"5px 10px",fontSize:15,cursor:"pointer",lineHeight:1 }}>👤</button>}
              <button onClick={()=>setShowSettings(true)} title="Settings" style={{ background:"none",border:"1px solid #1a1a1a",color:"#555",borderRadius:8,padding:"5px 10px",fontSize:15,cursor:"pointer",lineHeight:1 }}>⚙️</button>
            </div>
            <div style={{ fontSize:11,color:"#333",letterSpacing:1 }}>{profile.questXP} QXP{profile.makerXP>0?` · ${profile.makerXP} MXP`:""}</div>
          </div>
        </div>

        {/* Rebound banner */}
        {streakBroken&&!showRebound&&(
          <div style={{ background:"#0d0505",border:"1px solid #ff3c3c22",borderRadius:10,padding:"0.9rem 1.1rem",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11,fontWeight:900,letterSpacing:2,color:"#ff3c3c",marginBottom:2 }}>STREAK BROKEN</div>
              <div style={{ fontSize:12,color:"#444" }}>your {profile.streak}-day run is gone</div>
            </div>
            <button onClick={()=>{rebound.triggerOffer();setShowRebound(true);}} style={{ padding:"7px 14px",background:"none",border:"1px solid #ff3c3c44",color:"#ff3c3c",borderRadius:8,fontSize:11,fontWeight:900,letterSpacing:1,cursor:"pointer" }}>REVIVE? →</button>
          </div>
        )}

        {/* Comeback */}
        {profile.comebackDay>0&&profile.comebackDay<=7&&(
          <div style={{ background:"#050d0a",border:"1px solid #00ff8833",borderRadius:10,padding:"0.9rem 1.1rem",marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:900,letterSpacing:2,color:"#00ff88",marginBottom:4 }}>COMEBACK QUEST — DAY {profile.comebackDay}/7</div>
            <div style={{ fontSize:14,color:"#888" }}>{COMEBACK_QUESTS[profile.comebackDay-1]}</div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex",gap:2,marginBottom:"1.25rem",borderBottom:"1px solid #1a1a1a" }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:"none",border:"none",padding:"7px 10px",fontSize:11,fontWeight:900,letterSpacing:2,color:tab===t.id?"#fff":"#444",borderBottom:tab===t.id?`2px solid ${ACCENT_COLOR}`:"2px solid transparent",cursor:"pointer",marginBottom:-1 }}>{t.label}</button>
          ))}
          <button onClick={()=>setShowShop(true)} style={{ marginLeft:"auto",background:"none",border:"1px solid #1a1a1a",borderRadius:999,padding:"4px 9px",fontSize:11,color:"#333",cursor:"pointer" }}>🛒</button>
        </div>

        {/* TODAY TAB */}
        {tab==="quest"&&(
          <div>
            <BannerAd />

            {phase==="blind"&&(
              <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,padding:"1.25rem" }}>
                <div style={{ fontSize:11,fontWeight:900,letterSpacing:3,color:ACCENT_COLOR,marginBottom:8 }}>TODAY'S DARE — PICK YOUR PATH</div>
                <div style={{ fontSize:13,color:"#444",marginBottom:14,lineHeight:1.5 }}>Two quests. Scratch to reveal. You only do one.</div>
                {QUESTS.map((q,i)=>(
                  <ScratchReveal key={q.id} quest={q} onReveal={()=>{const n=[...scratchDone];n[i]=true;setScratchDone(n);}} />
                ))}
                {scratchDone.some(Boolean)&&(
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:11,fontWeight:900,letterSpacing:2,color:"#444",marginBottom:10 }}>WHICH ONE?</div>
                    <div style={{ display:"flex",gap:8 }}>
                      {QUESTS.map(q=>(
                        <button key={q.id} onClick={()=>syncQuestState(q,"chosen")} style={{ flex:1,padding:"12px",background:"#111",border:"1px solid #2a2a2a",borderRadius:8,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",letterSpacing:1 }}>PATH {q.path}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {phase==="chosen"&&chosenQuest&&(
              <div>
                <div style={{ background:"#0d0d0d",border:`1px solid ${ACCENT_COLOR}33`,borderRadius:12,padding:"1.25rem",marginBottom:12 }}>
                  <div style={{ fontSize:11,fontWeight:900,letterSpacing:3,color:ACCENT_COLOR,marginBottom:8 }}>PATH {chosenQuest.path} — YOUR DARE</div>
                  <div style={{ fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:10,lineHeight:1.1,textTransform:"uppercase" }}>{chosenQuest.title}</div>
                  <div style={{ fontSize:14,color:"#666",lineHeight:1.6,marginBottom:12 }}>{chosenQuest.desc}</div>
                  <div style={{ display:"flex",gap:10 }}>
                    <span style={{ fontSize:11,fontWeight:900,color:"#ffe600",letterSpacing:2 }}>+{chosenQuest.xp} XP</span>
                    <span style={{ fontSize:11,color:"#333",letterSpacing:1 }}>{chosenQuest.diff.toUpperCase()}</span>
                    {profile.inventory.ROAST_INSURANCE>0&&<span style={{ fontSize:11,color:"#555",letterSpacing:1 }}>🛡️ INSURED</span>}
                  </div>
                </div>
                <div style={{ background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,padding:"0.9rem 1rem",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 }}>
                  <div>
                    <div style={{ fontSize:10,fontWeight:900,letterSpacing:2,color:"#333",marginBottom:4 }}>BYPASS QUEST</div>
                    <div style={{ fontSize:12,color:"#555" }}>{skipCanUse?`${2-recentSkipUses.length} of 2 skips left in 3 days`:`next skip in ${fmtCountdown(skipNextIn)}`}</div>
                  </div>
                  <button onClick={()=>{setAdMode("bypass");setShowAd(true);}} disabled={!skipCanUse} style={{ padding:"9px 14px",background:skipCanUse?"#111":"#0a0a0a",border:`1px solid ${skipCanUse?"#333":"#111"}`,color:skipCanUse?"#fff":"#222",borderRadius:8,fontSize:11,fontWeight:900,letterSpacing:1,cursor:skipCanUse?"pointer":"not-allowed" }}>WATCH AD</button>
                </div>
                <div onClick={()=>fileRef.current.click()} style={{ border:"1px dashed #1a1a1a",borderRadius:10,padding:"2rem 1rem",textAlign:"center",cursor:"pointer",background:"#0a0a0a" }}>
                  <div style={{ fontSize:12,color:"#2a2a2a",marginBottom:8,letterSpacing:1 }}>UPLOAD PROOF PHOTO</div>
                  <button style={{ background:"#1a1a1a",border:"1px solid #333",color:"#fff",padding:"9px 22px",borderRadius:6,fontSize:12,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>CHOOSE</button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
                </div>
              </div>
            )}

            {phase==="uploading"&&preview&&(
              <div>
                <img src={preview} alt="proof" style={{ width:"100%",borderRadius:10,marginBottom:10,maxHeight:260,objectFit:"cover",filter:"grayscale(20%)" }} />
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={retakeUpload} style={{ flex:1,padding:"11px",background:"#111",border:"1px solid #222",color:"#666",borderRadius:8,fontSize:12,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>RETAKE</button>
                  <button onClick={verifyWithAI} style={{ flex:2,padding:"11px",background:ACCENT_COLOR,border:"none",color:"#fff",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>VERIFY →</button>
                </div>
                <div style={{ marginTop:8,fontSize:10,color:"#1a1a1a",textAlign:"center",letterSpacing:1 }}>ADMIN WILL REVIEW YOUR SUBMISSION</div>
              </div>
            )}

            {phase==="verifying"&&(
              <div style={{ textAlign:"center",padding:"3rem 0" }}>
                <div style={{ fontSize:13,fontWeight:900,letterSpacing:3,color:"#333",marginBottom:8 }}>SUBMISSION SUBMITTED</div>
                <div style={{ fontSize:11,color:"#1a1a1a",letterSpacing:2 }}>WAITING FOR ADMIN REVIEW</div>
              </div>
            )}

            {phase==="submitted"&&(
              <div style={{ background:"#050f07",border:"1px solid #00ff8833",borderRadius:12,padding:"1.25rem",textAlign:"center" }}>
                <div style={{ fontSize:24,marginBottom:12 }}>✅</div>
                <div style={{ fontSize:18,fontWeight:900,color:"#00ff88",marginBottom:8,letterSpacing:-1 }}>SUBMITTED!</div>
                <div style={{ fontSize:13,color:"#555",marginBottom:16,lineHeight:1.6 }}>Your photo is in the admin review queue. You'll see the result here once admin reviews it.</div>
              </div>
            )}

            {phase==="bypassed"&&chosenQuest&&(
              <div style={{ background:"#120808",border:"1px solid #ff3c3c33",borderRadius:12,padding:"1.25rem",textAlign:"center" }}>
                <div style={{ fontSize:18,fontWeight:900,color:"#ff9050",marginBottom:8,letterSpacing:-1 }}>QUEST BYPASSED</div>
                <div style={{ fontSize:13,color:"#777",marginBottom:10 }}>PATH {chosenQuest.path} stays locked till reset.</div>
                <div style={{ fontSize:13,color:"#ff9050",lineHeight:1.6 }}>bypassed like a pussy that you ARE</div>
              </div>
            )}

            {phase==="failed"&&aiResult&&(
              <div style={{ background:"#0d0505",border:"1px solid #ff3c3c33",borderRadius:12,padding:"1.25rem" }}>
                <div style={{ fontSize:13,fontWeight:900,color:"#ff3c3c",marginBottom:6,letterSpacing:2 }}>NOPE.</div>
                <div style={{ fontSize:14,color:"#555",marginBottom:8 }}>{aiResult.reason}</div>
                {roast&&<div style={{ fontSize:13,color:"#ff9050",fontStyle:"italic",marginBottom:14,borderLeft:`2px solid ${ACCENT_COLOR}`,paddingLeft:12 }}>"{roast}"</div>}
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>setPhase("chosen")} style={{ flex:1,padding:"9px",background:"#111",border:"1px solid #222",color:"#fff",borderRadius:6,fontSize:11,fontWeight:900,letterSpacing:1,cursor:"pointer" }}>RETRY</button>
                  {profile.inventory.PHOENIX_FEATHER>0&&(
                    <button onClick={()=>{setProfile(p=>({...p,streak:p.streak+1,inventory:{...p.inventory,PHOENIX_FEATHER:p.inventory.PHOENIX_FEATHER-1}}));setPhase("chosen");}} style={{ flex:1,padding:"9px",background:"#1a0a00",border:"1px solid #ff6030",color:"#ff9050",borderRadius:6,fontSize:11,fontWeight:900,letterSpacing:1,cursor:"pointer" }}>🪶 USE FEATHER</button>
                  )}
                </div>
              </div>
            )}

            {phase==="done"&&aiResult&&(
              <div>
                <div style={{ background:"#050f07",border:"1px solid #00ff8833",borderRadius:12,padding:"1.25rem",marginBottom:10 }}>
                  <div style={{ fontSize:20,fontWeight:900,color:"#00ff88",letterSpacing:-1,marginBottom:6 }}>QUEST COMPLETE 🔥</div>
                  <div style={{ fontSize:14,color:"#00cc66",marginBottom:6 }}>{aiResult.reason}</div>
                  {roast&&<div style={{ fontSize:13,color:"#555",fontStyle:"italic",marginBottom:12,borderLeft:"2px solid #1a1a1a",paddingLeft:12 }}>"{roast}"</div>}
                  <div style={{ display:"flex",gap:12,marginBottom:14 }}>
                    <div style={{ fontSize:18,fontWeight:900,color:"#ffe600" }}>+{chosenQuest.xp} QXP</div>
                  </div>
                  {!pathRevealed?(
                    <button onClick={()=>setPathRevealed(true)} style={{ width:"100%",padding:"9px",background:"#111",border:"1px solid #1a1a1a",color:"#444",borderRadius:8,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer",marginBottom:10 }}>REVEAL WHAT YOU DODGED →</button>
                  ):(
                    <div style={{ background:"#0d0d0d",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 12px",marginBottom:10 }}>
                      <div style={{ fontSize:10,fontWeight:900,letterSpacing:2,color:"#333",marginBottom:6 }}>THE OTHER PATH</div>
                      {QUESTS.filter(q=>q.id!==chosenQuest.id).map(q=>(
                        <div key={q.id}>
                          <div style={{ fontSize:14,fontWeight:900,color:"#3cf",textTransform:"uppercase" }}>{q.title}</div>
                          <div style={{ fontSize:12,color:"#444",marginTop:3 }}>{q.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:8,padding:"0.9rem 1rem" }}>
                    <div style={{ fontSize:10,fontWeight:900,letterSpacing:2,color:"#333",marginBottom:6 }}>STREAK FREEZE · {freeze.recentUses}/2 used</div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div style={{ fontSize:12,color:"#333" }}>{freeze.canUse?"watch an ad to bank one":"next available in "+freeze.fmt(freeze.nextIn)}</div>
                      <button onClick={()=>freeze.useFreeze()} disabled={!freeze.canUse} style={{ padding:"6px 12px",background:freeze.canUse?"#111":"#0a0a0a",border:`1px solid ${freeze.canUse?"#333":"#111"}`,color:freeze.canUse?"#fff":"#222",borderRadius:6,fontSize:11,fontWeight:900,cursor:freeze.canUse?"pointer":"not-allowed" }}>{freeze.canUse?"WATCH AD":"LIMIT HIT"}</button>
                    </div>
                  </div>
                </div>
                <TomorrowTeaser />
              </div>
            )}
          </div>
        )}

        {/* LAB TAB */}
        {tab==="lab"&&(
          <div>
            <BannerAd />
            <div style={{ display:"flex",gap:4,marginBottom:14 }}>
              {["vote","submit"].map(s=>(
                <button key={s} onClick={()=>setLabStep(s)} style={{ flex:1,padding:"9px",background:labStep===s?"#1a1a1a":"none",border:labStep===s?"1px solid #333":"1px solid #111",color:labStep===s?"#fff":"#444",borderRadius:6,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer",textTransform:"uppercase" }}>{s==="vote"?"VOTE":"SUBMIT"}</button>
              ))}
            </div>
            {labStep==="vote"&&(
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                  <span style={{ fontSize:10,color:"#333",letterSpacing:2,fontWeight:900 }}>TOMORROW'S CANDIDATES</span>
                  <button onClick={generateAI} disabled={generatingAI} style={{ padding:"6px 12px",background:"#111",border:"1px solid #222",color:generatingAI?"#222":"#555",borderRadius:6,fontSize:11,fontWeight:900,cursor:"pointer" }}>{generatingAI?"...":"AI MORE →"}</button>
                </div>
                {[...candidates].sort((a,b)=>b.votes-a.votes).map((c,i)=>(
                  <div key={c.id} style={{ background:"#0d0d0d",border:voted===c.id?"1px solid #3cf":"1px solid #1a1a1a",borderRadius:10,padding:"1rem",marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",gap:8 }}>
                      <div style={{ flex:1 }}>
                        {i===0&&<span style={{ fontSize:10,fontWeight:900,letterSpacing:2,color:"#ffe600",display:"block",marginBottom:4 }}>LEADING</span>}
                        <div style={{ fontSize:14,fontWeight:900,textTransform:"uppercase",letterSpacing:-0.5,marginBottom:3 }}>{c.title}</div>
                        <div style={{ fontSize:12,color:"#444" }}>{c.desc}</div>
                        <div style={{ fontSize:10,color:"#222",marginTop:4,letterSpacing:1 }}>{c.isAI?"AI":`BY ${c.by.toUpperCase()}`}</div>
                      </div>
                      <button onClick={()=>{if(!voted){setVoted(c.id);setCandidates(prev=>prev.map(x=>x.id===c.id?{...x,votes:x.votes+1}:x));if(c.isMe)setProfile(p=>({...p,makerXP:p.makerXP+10}));} }} disabled={!!voted} style={{ padding:"8px 12px",background:voted===c.id?"#001a1a":"#111",border:voted===c.id?"1px solid #3cf":"1px solid #222",color:voted===c.id?"#3cf":"#555",borderRadius:6,fontSize:14,fontWeight:900,cursor:voted?"default":"pointer",minWidth:44,alignSelf:"flex-start" }}>{c.votes}</button>
                    </div>
                  </div>
                ))}
                {voted&&<div style={{ fontSize:11,color:"#00ff88",textAlign:"center",letterSpacing:2,fontWeight:900,marginTop:8 }}>VOTED.</div>}
              </div>
            )}
            {labStep==="submit"&&(
              <div>
                <div style={{ fontSize:11,color:"#333",letterSpacing:2,fontWeight:900,marginBottom:12 }}>WINNING IDEAS EARN BONUS MAKER XP</div>
                <input value={newIdea.title} onChange={e=>setNewIdea(p=>({...p,title:e.target.value}))} placeholder="Quest title (make it a dare)" style={{ width:"100%",boxSizing:"border-box",background:"#0d0d0d",border:"1px solid #222",color:"#fff",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"inherit",marginBottom:10,outline:"none" }} />
                <textarea value={newIdea.desc} onChange={e=>setNewIdea(p=>({...p,desc:e.target.value}))} placeholder="What do they do? What photo proves it?" rows={3} style={{ width:"100%",boxSizing:"border-box",background:"#0d0d0d",border:"1px solid #222",color:"#fff",borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",marginBottom:12 }} />
                <button onClick={()=>{if(!newIdea.title.trim())return;setCandidates(prev=>[...prev,{id:Date.now(),title:newIdea.title,desc:newIdea.desc,votes:0,by:"You",isMe:true}]);setProfile(p=>({...p,makerXP:p.makerXP+50}));setNewIdea({title:"",desc:""});setLabStep("vote");}} style={{ width:"100%",padding:"12px",background:"#ffe600",border:"none",color:"#000",borderRadius:8,fontSize:13,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>SUBMIT (+50 MXP) →</button>
              </div>
            )}
          </div>
        )}

        {/* FEED TAB */}
        {tab==="community"&&(
          <div>
            <BannerAd />
            {!feed.length&&(
              <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"1rem 1.1rem",marginBottom:8,textAlign:"center" }}>
                <div style={{ fontSize:13,fontWeight:900,color:"#666",marginBottom:4 }}>No posts yet</div>
                <div style={{ fontSize:11,color:"#333",letterSpacing:1 }}>Complete a quest and your verified post will show up here.</div>
              </div>
            )}
            {feed.map(f=>(
              <div key={f.id} style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"0.9rem 1.1rem",marginBottom:8,display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#444",flexShrink:0 }}>{f.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:900 }}>@{f.user} <span style={{ fontSize:10,color:"#333",letterSpacing:1 }}>PATH {f.path}</span></div>
                  <div style={{ fontSize:12,color:"#555",marginTop:3 }}>{f.title}</div>
                  {!!f.xp&&<div style={{ fontSize:10,color:"#444",letterSpacing:1,marginTop:3 }}>+{f.xp} XP {f.streak?`- ${f.streak}D STREAK`:""}</div>}
                  {!f.xp&&f.status==="bypassed"&&<div style={{ fontSize:10,color:"#444",letterSpacing:1,marginTop:3 }}>BYPASSED WITH AD</div>}
                  {f.verified&&<span style={{ fontSize:10,fontWeight:900,background:"#003319",color:"#00ff88",padding:"1px 7px",borderRadius:4 }}>VERIFIED</span>}
                  <div style={{ fontSize:11,color:"#222",marginTop:2 }}>{f.time}</div>
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  <button onClick={()=>setFeed(prev=>prev.map(x=>x.id===f.id?{...x,upvotes:x.upvotes+1}:x))} style={{ padding:"5px 10px",background:"#111",border:"1px solid #222",color:"#555",borderRadius:6,fontSize:12,fontWeight:900,cursor:"pointer" }}>+{f.upvotes}</button>
                  {!f.flagged?<button onClick={()=>setFeed(prev=>prev.map(x=>x.id===f.id?{...x,flagged:true}:x))} style={{ padding:"5px 8px",background:"none",border:"1px solid #1a1a1a",color:"#333",borderRadius:6,fontSize:11,cursor:"pointer" }}>FLAG</button>
                    :<span style={{ fontSize:11,color:"#222",padding:"5px 4px" }}>FLAGGED</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RANKS TAB */}
        {tab==="leaderboard"&&(
          <div>
            <BannerAd />

            {/* Badge shelf */}
            <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"1rem 1.1rem",marginBottom:14 }}>
              <div style={{ fontSize:10,fontWeight:900,letterSpacing:2,color:"#333",marginBottom:10 }}>YOUR BADGES</div>
              <BadgeShelf earned={profile.badges} />
              <div style={{ fontSize:11,color:"#2a2a2a",marginTop:10,letterSpacing:1 }}>EARN AT 7 · 14 · 30 · 100 DAY STREAKS</div>
            </div>

            <div style={{ display:"flex",gap:4,marginBottom:14 }}>
              {["completers","creators"].map(s=>(
                <button key={s} onClick={()=>setLbTab(s)} style={{ flex:1,padding:"9px",background:lbTab===s?"#1a1a1a":"none",border:lbTab===s?"1px solid #333":"1px solid #111",color:lbTab===s?"#fff":"#444",borderRadius:6,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer",textTransform:"uppercase" }}>{s==="completers"?"QUESTERS":"MAKERS"}</button>
              ))}
            </div>
            {[(lbTab==="completers"
              ? {rank:1,user:"you",val:profile.questXP,sub:`${profile.completedQuests} COMPLETED - ${profile.streak}D STREAK`,isMe:true}
              : {rank:1,user:"you",val:profile.skippedQuests,sub:`${recentSkipUses.length}/2 BYPASSES USED`,isMe:true}
            )].map(u=>(
              <div key={u.rank} style={{ background:u.isMe?"#0a0d0f":"#0d0d0d",border:u.isMe?"1px solid #ffffff11":"1px solid #1a1a1a",borderRadius:10,padding:"0.9rem 1.1rem",marginBottom:8,display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:22,fontSize:14,fontWeight:900,color:u.rank===1?"#ffe600":"#222",textAlign:"center" }}>{u.rank}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:900,color:u.isMe?"#fff":"#666" }}>@{u.user}</div>
                  <div style={{ fontSize:10,color:"#2a2a2a",letterSpacing:1,marginTop:2 }}>{u.sub}</div>
                </div>
                <div style={{ fontSize:14,fontWeight:900,color:u.isMe?"#fff":"#333" }}>{u.val.toLocaleString()}</div>
              </div>
            ))}

            <button onClick={()=>{setProfile(p=>({...p,streak:7,lastActiveAt:Date.now()-36*3600000}));rebound.triggerOffer();setShowRebound(true);}} style={{ width:"100%",marginTop:8,padding:"10px",background:"none",border:"1px dashed #1a1a1a",color:"#1a1a1a",borderRadius:8,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>DEMO: SIMULATE BROKEN STREAK →</button>

            <div style={{ background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"1.1rem",textAlign:"center",marginTop:10 }}>
              <div style={{ fontSize:13,fontWeight:900,marginBottom:4 }}>WANT THIS FOR YOUR BRAND?</div>
              <div style={{ fontSize:12,color:"#444",marginBottom:12 }}>custom quest platforms · communities · drops</div>
              <button style={{ padding:"9px 22px",background:"#fff",border:"none",color:"#000",borderRadius:6,fontSize:12,fontWeight:900,letterSpacing:2,cursor:"pointer" }}>GET IN TOUCH →</button>
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {tab==="admin"&&adminAuthenticated&&(
          <div>
            {!adminReviewingId?(
              <AdminQueue pending={pendingSubmissions.filter(s=>s.status==="pending")} onReview={s=>setAdminReviewingId(s.id)} onLogout={()=>{setAdminAuthenticated(false);localStorage.removeItem(ADMIN_AUTH_KEY);setTab("quest");}} />
            ):(
              <AdminReviewCard submission={pendingSubmissions.find(s=>s.id===adminReviewingId)} onApprove={handleAdminApprove} onReject={handleAdminReject} onBack={()=>setAdminReviewingId(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
