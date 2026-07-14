import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import "./Bilingual.css";
import { skyCards, earthCards, humanCards, allCards } from "./data/cards";
import Deck from "./components/Deck";
import OracleSpread from "./components/OracleSpread";
import { APP_TEXT } from "./config/appText";
import { useOracleAudio } from "./audio/useOracleAudio";
import AudioLab from "./components/AudioLab";
import TempleBackground from "./components/TempleBackground";
import ResultTransition from "./components/ResultTransition";

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
  const timersRef = useRef(new Set());
  const [assetsReady, setAssetsReady] = useState(false);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [ceremonyPhase, setCeremonyPhase] = useState("opening");
  const audio = useOracleAudio(soundEnabled);

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
    if (!soundEnabled) {
      audio.stopRandomAmbience();
      return;
    }

    if (ceremonyPhase === "ritual") {
      audio.playMusic(
        resultPhase === "result" ? "result" : "ritual",
      );
      audio.startRandomAmbience();
      return;
    }

    audio.stopRandomAmbience();
  }, [
    audio,
    ceremonyPhase,
    resultPhase,
    soundEnabled,
  ]);

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
    audio.playDrawEffect(realm);

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
        audio.playCompletionSequence();
      }, 1800);

      /*
        The transition screen now remains visible for about 4.8 seconds,
        which is three seconds longer than before.
      */
      schedule(() => {
        setResultPhase("result");
      }, 8600);
    }

  }, 450);
}

async function beginCeremony() {
  await audio.unlock();
  audio.playEffect("start");

  setCeremonyPhase("entering");

  schedule(() => {
    setCeremonyPhase("ritual");
  }, 1400);
}

function endCeremony() {
  setCeremonyPhase("closing");
  audio.stopRandomAmbience();
  audio.playEffect("end");
  audio.stopMusic();

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
      <TempleBackground
        activeRealm={activeRealm}
        sky={sky}
        earth={earth}
        human={human}
        ceremonyPhase={ceremonyPhase}
        resultPhase={resultPhase}
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

              <div className="opening-invocation bilingual-invocation">
                {APP_TEXT.opening.invocation.map((item) => (
                  <div className="invocation-pair" key={item.cn}>
                    <p className="invocation-cn">{item.cn}</p>
                    <p className="invocation-en">{item.en}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="begin-ritual-button"
                onClick={beginCeremony}
                disabled={ceremonyPhase === "entering"}
              >
                <span className="button-copy">
                  <span className="button-cn">{APP_TEXT.opening.beginButton}</span>
                  <span className="button-en">{APP_TEXT.opening.beginButtonEn}</span>
                </span>
              </button>

              <p className="opening-footer">{APP_TEXT.opening.footer}</p>
            </div>

            {ceremonyPhase === "entering" && (
              <div className="ceremony-entry-overlay" aria-hidden="true">
                <div className="entry-ripple" />
                <div className="ceremony-overlay-copy">
                  <p>{APP_TEXT.opening.entering}</p>
                  <span>{APP_TEXT.opening.enteringEn}</span>
                </div>
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
                <div className="ceremony-overlay-copy">
                  <p>{APP_TEXT.closing.title}</p>
                  <span>{APP_TEXT.closing.titleEn}</span>
                </div>
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
                  <div className="ritual-instruction-pair">
                    <p className="ritual-instruction-cn">
                      {resultPhase === "third-card-pause"
                        ? APP_TEXT.ritual.thirdCardPause
                        : resultPhase === "transition"
                        ? APP_TEXT.ritual.transitionMessage
                        : APP_TEXT.ritual.instruction}
                    </p>

                    <p className="ritual-instruction-en">
                      {resultPhase === "third-card-pause"
                        ? APP_TEXT.ritual.thirdCardPauseEn
                        : resultPhase === "transition"
                        ? APP_TEXT.ritual.transitionMessageEn
                        : APP_TEXT.ritual.instructionEn}
                    </p>
                  </div>
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

                <div className="ritual-bottom-blessing">
                  <span className="blessing-cloud" aria-hidden="true">☁</span>

                  <div className="blessing-copy">
                    <p className="blessing-cn">{APP_TEXT.ritual.footerBlessing}</p>
                    <p className="blessing-en">{APP_TEXT.ritual.footerBlessingEn}</p>
                  </div>

                  <span className="blessing-cloud" aria-hidden="true">☁</span>
                </div>

                {resultPhase === "transition" && (
                  <ResultTransition />
                )}
              </main>
            )}
          </>
        )}
      </div>
    {import.meta.env.DEV && <AudioLab />}
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