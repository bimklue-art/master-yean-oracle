import {
  AUDIO_FILES,
  AUDIO_SETTINGS,
} from "./audioConfig";

const SOUND_STORAGE_KEY = "master-yean-oracle-sound";

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createAudioElement(source, options = {}) {
  const audio = new Audio(source);

  audio.preload = options.preload || "auto";
  audio.loop = Boolean(options.loop);
  audio.volume = clamp(options.volume ?? 1);

  return audio;
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

class OracleAudioManager {
  constructor() {
    this.enabled =
      window.localStorage.getItem(SOUND_STORAGE_KEY) !== "muted";

    this.masterVolume = AUDIO_SETTINGS.masterVolume;
    this.musicTrack = null;
    this.musicName = null;
    this.musicFadeToken = 0;

    this.effectPools = new Map();
    this.ambienceAudios = new Map();
    this.ambienceTimer = null;

    this.isDestroyed = false;
    this.isUnlocked = false;
  }

  async unlock() {
    if (this.isDestroyed || this.isUnlocked) return;

    /*
      Mobile browsers require audio playback to begin from a direct user
      gesture. Playing a silent audio element unlocks later sound playback.
    */
    const silent = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==",
    );

    silent.volume = 0;

    try {
      await silent.play();
      silent.pause();
      this.isUnlocked = true;
    } catch {
      // The next direct button press will try again.
    }
  }

  setEnabled(nextEnabled) {
    this.enabled = Boolean(nextEnabled);

    window.localStorage.setItem(
      SOUND_STORAGE_KEY,
      this.enabled ? "enabled" : "muted",
    );

    if (!this.enabled) {
      this.pauseMusic();
      this.stopRandomAmbience();
      this.stopAllEffects();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async preload() {
    const allSources = [
      ...Object.values(AUDIO_FILES.music),
      ...Object.values(AUDIO_FILES.sfx),
      ...Object.values(AUDIO_FILES.ambience),
    ];

    await Promise.allSettled(
      allSources.map(
        (source) =>
          new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = "auto";

            const finish = () => resolve();

            audio.addEventListener("canplaythrough", finish, {
              once: true,
            });

            audio.addEventListener("error", finish, {
              once: true,
            });

            audio.src = source;
            audio.load();
          }),
      ),
    );
  }

  getMusicVolume(trackName) {
    return clamp(
      AUDIO_SETTINGS.musicVolume[trackName] ??
        AUDIO_SETTINGS.musicVolume.ritual,
    );
  }

  async fade(audio, from, to, durationMs) {
    const token = ++this.musicFadeToken;
    const duration = Math.max(80, durationMs);
    const startTime = performance.now();

    audio.volume = clamp(from);

    return new Promise((resolve) => {
      const frame = (now) => {
        if (
          token !== this.musicFadeToken ||
          this.isDestroyed
        ) {
          resolve();
          return;
        }

        const progress = clamp(
          (now - startTime) / duration,
        );

        audio.volume = clamp(
          from + (to - from) * progress,
        );

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  }

  async playMusic(trackName, options = {}) {
    if (
      !this.enabled ||
      this.isDestroyed ||
      !AUDIO_FILES.music[trackName]
    ) {
      return;
    }

    await this.unlock();

    const targetVolume =
      this.getMusicVolume(trackName) *
      this.masterVolume;

    const fadeDuration =
      options.fadeDurationMs ??
      AUDIO_SETTINGS.fadeDurationMs;

    if (
      this.musicTrack &&
      this.musicName === trackName
    ) {
      if (this.musicTrack.paused) {
        try {
          await this.musicTrack.play();
        } catch {
          return;
        }
      }

      await this.fade(
        this.musicTrack,
        this.musicTrack.volume,
        targetVolume,
        fadeDuration,
      );

      return;
    }

    const previousTrack = this.musicTrack;

    const nextTrack = createAudioElement(
      AUDIO_FILES.music[trackName],
      {
        loop: true,
        volume: 0,
      },
    );

    this.musicTrack = nextTrack;
    this.musicName = trackName;

    try {
      await nextTrack.play();
    } catch {
      this.musicTrack = previousTrack;
      this.musicName = null;
      return;
    }

    const fadeIn = this.fade(
      nextTrack,
      0,
      targetVolume,
      fadeDuration,
    );

    const fadeOut = previousTrack
      ? this.fade(
          previousTrack,
          previousTrack.volume,
          0,
          fadeDuration,
        ).then(() => {
          previousTrack.pause();
          previousTrack.currentTime = 0;
        })
      : Promise.resolve();

    await Promise.all([fadeIn, fadeOut]);
  }

  pauseMusic() {
    if (!this.musicTrack) return;

    this.musicFadeToken += 1;
    this.musicTrack.pause();
  }

  async stopMusic(options = {}) {
    if (!this.musicTrack) return;

    const current = this.musicTrack;
    const fadeDuration =
      options.fadeDurationMs ??
      AUDIO_SETTINGS.fadeDurationMs;

    await this.fade(
      current,
      current.volume,
      0,
      fadeDuration,
    );

    current.pause();
    current.currentTime = 0;

    if (this.musicTrack === current) {
      this.musicTrack = null;
      this.musicName = null;
    }
  }

  async duckMusic(options = {}) {
    if (!this.musicTrack || this.musicTrack.paused) {
      return;
    }

    const music = this.musicTrack;
    const originalVolume = music.volume;
    const duckVolume =
      (options.volume ?? AUDIO_SETTINGS.duckVolume) *
      this.masterVolume;

    const durationMs =
      options.durationMs ??
      AUDIO_SETTINGS.duckDurationMs;

    await this.fade(
      music,
      originalVolume,
      duckVolume,
      420,
    );

    await wait(durationMs);

    if (
      this.musicTrack === music &&
      this.enabled &&
      !music.paused
    ) {
      await this.fade(
        music,
        music.volume,
        this.getMusicVolume(this.musicName) *
          this.masterVolume,
        900,
      );
    }
  }

  getEffectPool(effectName) {
    if (!this.effectPools.has(effectName)) {
      const source = AUDIO_FILES.sfx[effectName];

      const pool = Array.from({ length: 4 }, () =>
        createAudioElement(source, {
          volume:
            AUDIO_SETTINGS.effectsVolume *
            this.masterVolume,
        }),
      );

      this.effectPools.set(effectName, pool);
    }

    return this.effectPools.get(effectName);
  }

  async playEffect(effectName, options = {}) {
    if (
      !this.enabled ||
      this.isDestroyed ||
      !AUDIO_FILES.sfx[effectName]
    ) {
      return;
    }

    await this.unlock();

    const pool = this.getEffectPool(effectName);

    const audio =
      pool.find((item) => item.paused || item.ended) ??
      pool[0];

    audio.pause();
    audio.currentTime = 0;

    audio.volume = clamp(
      (options.volume ??
        AUDIO_SETTINGS.effectsVolume) *
        this.masterVolume,
    );

    audio.playbackRate = clamp(
      options.playbackRate ?? 1,
      0.7,
      1.35,
    );

    try {
      await audio.play();
    } catch {
      // Missing or unsupported files should not break the ritual.
    }
  }

  playDrawEffect(realm) {
    this.playEffect("flip", {
      volume: 0.54,
    });

    window.setTimeout(() => {
      this.playEffect(realm, {
        volume: realm === "earth" ? 0.9 : 0.82,
      });
    }, 120);
  }

  async playCompletionSequence() {
    this.duckMusic({
      volume: 0.17,
      durationMs: 3600,
    });

    await this.playEffect("completion", {
      volume: 0.92,
    });

    window.setTimeout(() => {
      this.playEffect("shimmer", {
        volume: 0.7,
      });
    }, 650);
  }

  getAmbienceAudio(name) {
    if (!this.ambienceAudios.has(name)) {
      this.ambienceAudios.set(
        name,
        createAudioElement(
          AUDIO_FILES.ambience[name],
          {
            volume:
              AUDIO_SETTINGS.ambienceVolume *
              this.masterVolume,
          },
        ),
      );
    }

    return this.ambienceAudios.get(name);
  }

  async playAmbience(name) {
    if (
      !this.enabled ||
      this.isDestroyed ||
      !AUDIO_FILES.ambience[name]
    ) {
      return;
    }

    await this.unlock();

    const audio = this.getAmbienceAudio(name);

    audio.pause();
    audio.currentTime = 0;
    audio.volume =
      AUDIO_SETTINGS.ambienceVolume *
      this.masterVolume;

    try {
      await audio.play();
    } catch {
      // Do not interrupt the app for an optional ambience file.
    }
  }

  scheduleNextAmbience() {
    if (!this.enabled || this.isDestroyed) return;

    const { minimum, maximum } =
      AUDIO_SETTINGS.ambienceIntervalMs;

    const delay =
      minimum +
      Math.random() * (maximum - minimum);

    this.ambienceTimer = window.setTimeout(() => {
      const options = Object.keys(
        AUDIO_FILES.ambience,
      );

      const selected =
        options[
          Math.floor(Math.random() * options.length)
        ];

      this.playAmbience(selected);
      this.scheduleNextAmbience();
    }, delay);
  }

  startRandomAmbience() {
    this.stopRandomAmbience();

    if (this.enabled) {
      this.scheduleNextAmbience();
    }
  }

  stopRandomAmbience() {
    if (this.ambienceTimer) {
      window.clearTimeout(this.ambienceTimer);
      this.ambienceTimer = null;
    }

    this.ambienceAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  stopAllEffects() {
    this.effectPools.forEach((pool) => {
      pool.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    });

    this.ambienceAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  async destroy() {
    this.isDestroyed = true;
    this.stopRandomAmbience();
    this.stopAllEffects();
    await this.stopMusic({
      fadeDurationMs: 250,
    });
  }
}

export const oracleAudioManager =
  new OracleAudioManager();
