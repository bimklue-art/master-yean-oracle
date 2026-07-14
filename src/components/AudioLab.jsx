import { useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_FILES } from "../audio/audioConfig";
import "./AudioLab.css";

const MUSIC_ITEMS = [
  {
    key: "ritual",
    label: "Ritual Music",
    icon: "🎵",
  },
  {
    key: "result",
    label: "Result Music",
    icon: "🧘",
  },
];

const EFFECT_ITEMS = [
  {
    key: "start",
    label: "Start Ritual",
    icon: "🔔",
  },
  {
    key: "sky",
    label: "Heaven Draw",
    icon: "☁",
  },
  {
    key: "earth",
    label: "Earth Draw",
    icon: "🌿",
  },
  {
    key: "human",
    label: "Human Draw",
    icon: "🔥",
  },
  {
    key: "flip",
    label: "Card Flip",
    icon: "🃏",
  },
  {
    key: "completion",
    label: "Completion",
    icon: "🔔",
  },
  {
    key: "shimmer",
    label: "Golden Shimmer",
    icon: "✨",
  },
  {
    key: "end",
    label: "End Ceremony",
    icon: "◉",
  },
];

const AMBIENCE_ITEMS = [
  {
    key: "wind",
    label: "Bamboo Wind",
    icon: "🍃",
  },
  {
    key: "birds",
    label: "Mountain Birds",
    icon: "🐦",
  },
  {
    key: "water",
    label: "Flowing Water",
    icon: "💧",
  },
  {
    key: "bell",
    label: "Distant Bell",
    icon: "🔔",
  },
];

function createAudio(source, options = {}) {
  const audio = new Audio(source);

  audio.preload = "auto";
  audio.loop = Boolean(options.loop);
  audio.volume = options.volume ?? 1;

  return audio;
}

function AudioLab() {
  const [isOpen, setIsOpen] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [effectsVolume, setEffectsVolume] = useState(0.78);
  const [ambienceVolume, setAmbienceVolume] = useState(0.28);
  const [activeSound, setActiveSound] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const musicRef = useRef(null);
  const oneShotAudiosRef = useRef(new Set());

  const assetCount = useMemo(
    () =>
      MUSIC_ITEMS.length +
      EFFECT_ITEMS.length +
      AMBIENCE_ITEMS.length,
    [],
  );

  function stopMusic() {
    if (!musicRef.current) return;

    musicRef.current.pause();
    musicRef.current.currentTime = 0;
    musicRef.current = null;
  }

  function stopOneShots() {
    oneShotAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    oneShotAudiosRef.current.clear();
  }

  function stopAll() {
    stopMusic();
    stopOneShots();
    setActiveSound("");
    setErrorMessage("");
  }

  async function playMusic(key) {
    setErrorMessage("");

    const source = AUDIO_FILES.music[key];

    if (!source) {
      setErrorMessage(`Missing music configuration: ${key}`);
      return;
    }

    stopMusic();

    const audio = createAudio(source, {
      loop: true,
      volume: musicVolume,
    });

    musicRef.current = audio;

    try {
      await audio.play();
      setActiveSound(`Music: ${key}`);
    } catch (error) {
      setErrorMessage(
        `Could not play ${key}. Check the MP3 filename and browser console.`,
      );
    }
  }

  async function playOneShot(group, key, volume) {
    setErrorMessage("");

    const source = AUDIO_FILES[group]?.[key];

    if (!source) {
      setErrorMessage(`Missing ${group} configuration: ${key}`);
      return;
    }

    const audio = createAudio(source, {
      volume,
    });

    oneShotAudiosRef.current.add(audio);

    const cleanup = () => {
      oneShotAudiosRef.current.delete(audio);
    };

    audio.addEventListener("ended", cleanup, {
      once: true,
    });

    audio.addEventListener(
      "error",
      () => {
        cleanup();
        setErrorMessage(
          `Could not load ${key}. Confirm the MP3 exists and is named correctly.`,
        );
      },
      {
        once: true,
      },
    );

    try {
      await audio.play();
      setActiveSound(`${group}: ${key}`);
    } catch (error) {
      cleanup();
      setErrorMessage(
        `Could not play ${key}. Check the MP3 filename and browser console.`,
      );
    }
  }

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  return (
    <aside
      className={[
        "audio-lab",
        isOpen ? "audio-lab-open" : "audio-lab-collapsed",
      ].join(" ")}
      aria-label="MASTER YEAN Audio Lab"
    >
      <button
        type="button"
        className="audio-lab-toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">🎧</span>
        <span>{isOpen ? "Hide Audio Lab" : "Audio Lab"}</span>
      </button>

      {isOpen && (
        <div className="audio-lab-panel">
          <header className="audio-lab-header">
            <p>MASTER YEAN</p>
            <h2>Audio Lab</h2>
            <span>{assetCount} audio assets</span>
          </header>

          <section className="audio-lab-section">
            <div className="audio-lab-section-title">
              <h3>Background Music</h3>
              <output>
                {Math.round(musicVolume * 100)}%
              </output>
            </div>

            <input
              className="audio-lab-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(event) =>
                setMusicVolume(Number(event.target.value))
              }
              aria-label="Music volume"
            />

            <div className="audio-lab-grid audio-lab-grid-two">
              {MUSIC_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => playMusic(item.key)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="audio-lab-secondary"
              onClick={stopMusic}
            >
              Stop Music
            </button>
          </section>

          <section className="audio-lab-section">
            <div className="audio-lab-section-title">
              <h3>Sound Effects</h3>
              <output>
                {Math.round(effectsVolume * 100)}%
              </output>
            </div>

            <input
              className="audio-lab-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectsVolume}
              onChange={(event) =>
                setEffectsVolume(Number(event.target.value))
              }
              aria-label="Effects volume"
            />

            <div className="audio-lab-grid">
              {EFFECT_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() =>
                    playOneShot(
                      "sfx",
                      item.key,
                      effectsVolume,
                    )
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="audio-lab-section">
            <div className="audio-lab-section-title">
              <h3>Ambience</h3>
              <output>
                {Math.round(ambienceVolume * 100)}%
              </output>
            </div>

            <input
              className="audio-lab-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambienceVolume}
              onChange={(event) =>
                setAmbienceVolume(Number(event.target.value))
              }
              aria-label="Ambience volume"
            />

            <div className="audio-lab-grid">
              {AMBIENCE_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() =>
                    playOneShot(
                      "ambience",
                      item.key,
                      ambienceVolume,
                    )
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <footer className="audio-lab-footer">
            <button
              type="button"
              className="audio-lab-stop"
              onClick={stopAll}
            >
              ⏹ Stop All Audio
            </button>

            <p className="audio-lab-status">
              {errorMessage ||
                (activeSound
                  ? `Playing: ${activeSound}`
                  : "Ready")}
            </p>
          </footer>
        </div>
      )}
    </aside>
  );
}

export default AudioLab;
