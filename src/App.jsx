import { useState } from "react";
import "./App.css";
import { skyCards, earthCards, humanCards } from "./data/cards";

function App() {
  const [sky, setSky] = useState(null);
  const [earth, setEarth] = useState(null);
  const [human, setHuman] = useState(null);
  const [activeRealm, setActiveRealm] = useState("sky");

  function drawCard(realm, deck, setter) {

  const random =
    deck[Math.floor(Math.random() * deck.length)];

  setTimeout(() => {

    setter(random);

    if (realm === "sky") {
      setActiveRealm("earth");
    }

    if (realm === "earth") {
      setActiveRealm("human");
    }

    if (realm === "human") {
      setActiveRealm("complete");
    }

  }, 800);
}

function resetRitual() {
  setSky(null);
  setEarth(null);
  setHuman(null);
  setActiveRealm("sky");
}

  return (
    <div className="academy-bg" style={styles.page}>
      <div 
  className="mist"
  style={{
    left: "0%",
    top: "25%"
  }}
/>

<div 
  className="mist"
  style={{
    left: "30%",
    top: "55%"
  }}
/>
      <div className="gold-particle"
style={{left:"20%", top:"70%"}}
/>

<div className="gold-particle"
style={{left:"50%", top:"80%"}}
/>

<div className="gold-particle"
style={{left:"75%", top:"65%"}}
/>
      <h2>天 • 地 • 人</h2>
      <p>Draw in order: Sky → Earth → Human</p>

      <div style={styles.decks}>
        <Deck
          title="☁ SKY"
          color="#2C5DAA"
          value={sky}
          locked={activeRealm !== "sky" && !sky}
          onClick={() => drawCard("sky", skyCards, setSky)}
        />

        <Deck
          title="🌿 EARTH"
          color="#2E7D5B"
          value={earth}
          locked={!sky || (activeRealm !== "earth" && !earth)}
          onClick={() => drawCard("earth", earthCards, setEarth)}
        />

        <Deck
          title="🔥 HUMAN"
          color="#B8322A"
          value={human}
          locked={!earth || (activeRealm !== "human" && !human)}
          onClick={() => drawCard("human", humanCards, setHuman)}
        />
      </div>

      {activeRealm === "complete" && (

<div style={styles.result}>

<h2>
九数成卦
</h2>


<div style={styles.resultCircle}>


<div>

<div style={styles.realmTitle}>
☁ 天
</div>

<div style={styles.resultCard}>
{sky}
</div>

</div>



<div style={styles.bottomResult}>


<div>

<div style={styles.realmTitle}>
🌿 地
</div>

<div style={styles.resultCard}>
{earth}
</div>

</div>



<div>

<div style={styles.realmTitle}>
🔥 人
</div>

<div style={styles.resultCard}>
{human}
</div>

</div>


</div>


</div>


<button
onClick={resetRitual}
style={styles.resetButton}
>

再启九数

</button>


</div>

)}
    </div>
  );
}

function Deck({ title, color, value, locked, onClick }) {
  const isActive = !locked && !value;
  const realmClass =
  color === "#2C5DAA"
    ? "sky-aura"
    : color === "#2E7D5B"
    ? "earth-aura"
    : "human-aura";

  return (
    <div>
      <h2 style={{ color }}>{title}</h2>

      <div
        className={isActive ? realmClass : ""}
        onClick={isActive ? onClick : undefined}
        style={{
          ...styles.card,
          background: value
            ? "linear-gradient(145deg, #fff9ea, #f1dca8)"
            : `linear-gradient(145deg, ${color}, #2b1d14)`,
          border: `5px double ${value ? "#D4AF37" : color}`,
          color: value ? color : "#fff8e8",
          opacity: locked ? 0.35 : 1,
          cursor: isActive ? "pointer" : "default",
          boxShadow: isActive
            ? `0 0 45px ${color}, 0 18px 35px rgba(76,45,15,0.35)`
            : "0 18px 35px rgba(76,45,15,0.28)",
          animation: value
            ? "flipCard 0.8s ease"
            : isActive
            ? "floatCard 2.5s infinite"
            : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "12px",
            border: "2px solid rgba(212,175,55,0.8)",
            borderRadius: "18px",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "18px",
            fontSize: "18px",
            letterSpacing: "2px",
            color: value ? "#8b6f2a" : "rgba(255,248,232,0.8)",
          }}
        >
          {title.replace(/[☁🌿🔥]/g, "")}
        </div>

        <div
          style={{
            zIndex: 2,
            background: value ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)",
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid rgba(212,175,55,0.65)",
          }}
        >
          {value ? value : locked ? "锁" : "?"}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "20px",
            fontSize: "14px",
            color: value ? "#8b6f2a" : "rgba(255,248,232,0.8)",
          }}
        >
          MASTER YEAN
        </div>
      </div>

      <p>{value ? "Revealed" : locked ? "Locked" : "Touch to draw"}</p>

      <style>
        {`
          @keyframes floatCard {
            0% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
            100% { transform: translateY(0); }
          }

          @keyframes flipCard {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(90deg); }
            100% { transform: rotateY(0deg); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  page: {
    
    minHeight: "100vh",
    position:"relative",
    background: "linear-gradient(135deg, #fff7e6, #f3d9a4)",
    textAlign: "center",
    padding: "40px",
    fontFamily: "Georgia, serif",
    color: "#4a2a12",
  },
  decks: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    flexWrap: "wrap",
    marginTop: "40px",
  },
  card: {
  width: "160px",
  height: "250px",
  borderRadius: "24px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "86px",
  fontWeight: "bold",
  boxShadow: "0 18px 35px rgba(76, 45, 15, 0.28)",
  userSelect: "none",
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Times New Roman', serif",
  textShadow: "0 2px 6px rgba(0,0,0,0.15)",
},
  result: {
    marginTop: "50px",
    padding: "25px",
    border: "2px solid #D4AF37",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.45)",
    display: "inline-block",
  },
resultCircle: {

marginTop:"30px",

display:"flex",

flexDirection:"column",

alignItems:"center",

gap:"25px",

},


bottomResult: {

display:"flex",

gap:"80px",

},


realmTitle: {

fontSize:"22px",

marginBottom:"10px",

color:"#7a4a16",

},


resultCard: {

width:"90px",

height:"130px",

border:"3px double #D4AF37",

borderRadius:"18px",

background:
"linear-gradient(145deg,#fff9ea,#e8c878)",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"55px",

fontWeight:"bold",

boxShadow:
"0 12px 25px rgba(0,0,0,0.25)",

},


resetButton: {

marginTop:"35px",

padding:"15px 35px",

borderRadius:"30px",

border:"none",

background:
"linear-gradient(90deg,#b88a2c,#e6c46a)",

fontSize:"20px",

fontFamily:"serif",

cursor:"pointer",

boxShadow:
"0 8px 20px rgba(0,0,0,0.25)",

},
};

function resetRitual() {

  setSky(null);
  setEarth(null);
  setHuman(null);

  setActiveRealm("sky");

}

export default App;