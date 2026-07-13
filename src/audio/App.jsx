import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { skyCards, earthCards, humanCards, allCards } from "./data/cards";
import Deck from "./components/Deck";
import OracleSpread from "./components/OracleSpread";
import { APP_TEXT } from "./config/appText";
import { createOracleAudioEngine } from "./audio/oracleAudio";

function App() {
  const [sky, setSky] = useState(null);
  const [earth, setEarth] = useState(null);
  const [human, setHuman] = useState(null);
  const [activeRealm, setActiveRealm] = useState("sky");
  const [flipping, setFlipping] = useState(null);
  const [resultPhase, setResultPhase] = useState("drawing");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const savedPreference = window.localStorage.getItem(
      "master-yean-oracle-sound",
    );

    return savedPreference !== "muted";
  });
  const audioEngineRef = useRef(null);
  const timersRef = useRef(new Set());
  const [assetsReady, setAssetsReady] = useState(false);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [ceremonyPhase, setCeremonyPhase] = useState("opening");

  const schedule = useCallback((callback, delay) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "master-yean-oracle-sound",
      soundEnabled ? "enabled" : "muted",
    );
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });

      timersRef.current.clear();

    };
  }, []);

  useEffect(() => {
    audioEngineRef.current = createOracleAudioEngine();
    audioEngineRef.current.setEnabled(soundEnabled);

    return () => {
      audioEngineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    audioEngineRef.current?.setEnabled(soundEnabled);

    if (
      soundEnabled &&
      ceremonyPhase === "ritual"
    ) {
      audioEngineRef.current?.startAmbientMusic();
    }

    if (!soundEnabled) {
      audioEngineRef.current?.stopAmbientMusic();
    }
  }, [soundEnabled, ceremonyPhase]);

  useEffect(() => {
    let cancelled = false;
    let completed = 0;

    const preloadJobs = allCards.map(
      (card) =>
        new Promise((resolve) => {
          const image = new Image();

          const finish = () => {
            completed += 1;

            if (!cancelled) {
              setLoadedAssets(completed);
            }

            resolve();
          };

          image.onload = finish;
          image.onerror = finish;
          image.src = card.image;
        }),
    );

    Promise.all(preloadJobs).then(() => {
      if (!cancelled) {
        setAssetsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function drawCard(realm, deck, setter) {
    if (flipping) return;
    audioEngineRef.current?.playDrawEffect(realm);

  const random =
    deck[Math.floor(Math.random() * deck.length)];

  setFlipping(realm);

  schedule(() => {

    setter(random);
    setFlipping(null);

    if (realm === "sky") {
      setActiveRealm("earth");
    }

    if (realm === "earth") {
      setActiveRealm("human");
      
    }

    if (realm === "human") {
      // Keep the third card visible before beginning the completion ritual.
      setActiveRealm("complete");
      setResultPhase("third-card-pause");

      schedule(() => {
        setResultPhase("transition");

        audioEngineRef.current?.playCompletionEffect();
      }, 1800);

      schedule(() => {
        setResultPhase("result");
      }, 3600);
    }

  }, 450);
}

function beginCeremony() {
  setCeremonyPhase("entering");
  audioEngineRef.current?.setEnabled(soundEnabled);

  schedule(() => {
    setCeremonyPhase("ritual");

    if (soundEnabled) {
      audioEngineRef.current?.startAmbientMusic();
    }
  }, 1400);
}

function endCeremony() {
  setCeremonyPhase("closing");
  audioEngineRef.current?.stopAmbientMusic();

  schedule(() => {
    resetRitual();
    setCeremonyPhase("opening");
  }, 1300);
}

function resetRitual() {
  setSky(null);
  setEarth(null);
  setHuman(null);
  setFlipping(null);
  setActiveRealm("sky");
  setResultPhase("drawing");
}

  return (
    <div
      className={[
        "academy-bg",
        `atmosphere-${activeRealm}`,
        sky ? "atmosphere-has-sky" : "",
        earth ? "atmosphere-has-earth" : "",
        human ? "atmosphere-has-human" : "",
        ceremonyPhase === "ritual" ? "atmosphere-awake" : "",
        resultPhase === "transition" ? "atmosphere-converging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={styles.page}
    >
      <div className="oracle-atmosphere" aria-hidden="true">
        <div className="cosmology-disc cosmology-disc-outer">
          <span className="cosmology-mark mark-1">☰</span>
          <span className="cosmology-mark mark-2">☷</span>
          <span className="cosmology-mark mark-3">☵</span>
          <span className="cosmology-mark mark-4">☲</span>
          <span className="cosmology-mark mark-5">☳</span>
          <span className="cosmology-mark mark-6">☴</span>
          <span className="cosmology-mark mark-7">☶</span>
          <span className="cosmology-mark mark-8">☱</span>
        </div>

        <div className="cosmology-disc cosmology-disc-middle">
          <span className="cosmology-dot dot-1" />
          <span className="cosmology-dot dot-2" />
          <span className="cosmology-dot dot-3" />
          <span className="cosmology-dot dot-4" />
          <span className="cosmology-dot dot-5" />
          <span className="cosmology-dot dot-6" />
          <span className="cosmology-dot dot-7" />
          <span className="cosmology-dot dot-8" />
          <span className="cosmology-dot dot-9" />
        </div>

        <div className="cosmology-core">
          <span>九</span>
        </div>

        <div className="realm-light realm-light-sky" />
        <div className="realm-light realm-light-earth" />
        <div className="realm-light realm-light-human" />

        <div className="ambient-particle-field">
          {Array.from({ length: 28 }).map((_, index) => (
            <span
              key={index}
              style={{
                "--ambient-index": index,
                "--ambient-delay": `${(index % 7) * 0.55}s`,
              }}
            />
          ))}
        </div>
      </div>
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
      {!assetsReady && (
        <div className="oracle-loader" role="status" aria-live="polite">
          <div className="loader-halo" aria-hidden="true" />
          <div className="loader-mark">{APP_TEXT.loading.mark}</div>
          <p className="loader-title">{APP_TEXT.loading.title}</p>
          <div
            className="loader-progress"
            aria-label={`Loading oracle artwork: ${loadedAssets} of ${allCards.length}`}
          >
            <span
              style={{
                width: `${Math.round(
                  (loadedAssets / allCards.length) * 100,
                )}%`,
              }}
            />
          </div>
          <p className="loader-count">
            {loadedAssets} / {allCards.length}
          </p>
        </div>
      )}

      <div className={assetsReady ? "app-ready" : "app-waiting"}>
        {ceremonyPhase === "opening" || ceremonyPhase === "entering" ? (
          <section
            className={[
              "opening-ceremony",
              ceremonyPhase === "entering" ? "is-entering" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="opening-stars" aria-hidden="true">
              {Array.from({ length: 20 }).map((_, index) => (
                <span key={index} style={{ "--star-index": index }} />
              ))}
            </div>

            <div className="opening-halo" aria-hidden="true" />
            <div className="opening-ring opening-ring-one" aria-hidden="true" />
            <div className="opening-ring opening-ring-two" aria-hidden="true" />

            <div className="opening-content">
              <p className="opening-brand">{APP_TEXT.opening.brand}</p>
              <h1>{APP_TEXT.opening.title}</h1>
              <div className="opening-divider" />

              <div className="opening-invocation">
                {APP_TEXT.opening.invocation.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <button
                type="button"
                className="begin-ritual-button"
                onClick={beginCeremony}
                disabled={ceremonyPhase === "entering"}
              >
                <span>{APP_TEXT.opening.beginButton}</span>
              </button>

              <p className="opening-footer">{APP_TEXT.opening.footer}</p>
            </div>

            {ceremonyPhase === "entering" && (
              <div className="ceremony-entry-overlay" aria-hidden="true">
                <div className="entry-ripple" />
                <p>{APP_TEXT.opening.entering}</p>
              </div>
            )}
          </section>
        ) : (
          <>
            <button
              type="button"
              className="sound-toggle"
              onClick={() => setSoundEnabled((current) => !current)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? APP_TEXT.sound.muteLabel : APP_TEXT.sound.enableLabel}
              title={soundEnabled ? APP_TEXT.sound.enabledTitle : APP_TEXT.sound.mutedTitle}
            >
              <span aria-hidden="true">{soundEnabled ? "🔊" : "🔇"}</span>
              <span>{soundEnabled ? APP_TEXT.sound.enabled : APP_TEXT.sound.muted}</span>
            </button>

            {ceremonyPhase === "closing" && (
              <div className="ceremony-closing" aria-hidden="true">
                <div className="closing-halo" />
                <p>{APP_TEXT.closing.title}</p>
              </div>
            )}

            {resultPhase === "result" ? (
              <OracleSpread
                sky={sky}
                earth={earth}
                human={human}
                onReset={resetRitual}
                onEnd={endCeremony}
              />
            ) : (
              <main
                className={[
                  "ritual-draw-stage",
                  `realm-${activeRealm}`,
                  sky ? "has-sky" : "",
                  earth ? "has-earth" : "",
                  human ? "has-human" : "",
                  resultPhase === "third-card-pause" ? "is-third-card-pause" : "",
                  resultPhase === "transition" ? "is-transitioning" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <header className="ritual-intro">
                  <p className="ritual-eyebrow">{APP_TEXT.ritual.eyebrow}</p>
                  <h1>{APP_TEXT.ritual.title}</h1>
                  <p>
                    {resultPhase === "third-card-pause"
                      ? APP_TEXT.ritual.thirdCardPause
                      : resultPhase === "transition"
                      ? APP_TEXT.ritual.transitionMessage
                      : APP_TEXT.ritual.instruction}
                  </p>
                </header>

                <div style={styles.decks}>
                  <Deck
                    title={APP_TEXT.decks.sky.title}
                    color="#2C5DAA"
                    value={sky}
                    locked={activeRealm !== "sky" && !sky}
                    flipping={flipping === "sky"}
                    onClick={() => drawCard("sky", skyCards, setSky)}
                  />

                  <Deck
                    title={APP_TEXT.decks.earth.title}
                    color="#2E7D5B"
                    value={earth}
                    locked={!sky || (activeRealm !== "earth" && !earth)}
                    flipping={flipping === "earth"}
                    onClick={() => drawCard("earth", earthCards, setEarth)}
                  />

                  <Deck
                    title={APP_TEXT.decks.human.title}
                    color="#B8322A"
                    value={human}
                    locked={!earth || (activeRealm !== "human" && !human)}
                    flipping={flipping === "human"}
                    onClick={() => drawCard("human", humanCards, setHuman)}
                  />
                </div>

                {resultPhase === "transition" && (
                  <div className="oracle-transition" role="status" aria-live="polite">
                    <div className="transition-light" aria-hidden="true" />
                    <div className="transition-seal" aria-hidden="true">
                      <span>天</span>
                      <span>地</span>
                      <span>人</span>
                    </div>
                    <p className="transition-title">{APP_TEXT.transition.title}</p>
                    <div className="transition-divider" />
                    <p className="transition-subtitle">{APP_TEXT.transition.subtitle}</p>
                  </div>
                )}
              </main>
            )}
          </>
        )}
      </div>

    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
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
};

export default App;