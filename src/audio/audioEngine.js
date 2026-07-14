import {
  AUDIO_FILES,
  AUDIO_SETTINGS,
} from "./audioConfig";

const SOUND_STORAGE_KEY = "master-yean-oracle-sound";

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function createAudio(source, options = {}) {
  const audio = new Audio(source);

  audio.preload = options.preload ?? "auto";
  audio.loop = Boolean(options.loop);
  audio.volume = clamp(options.volume ?? 1);

  return audio;
}

class OracleAudioEngine {
  constructor() {
    this.enabled =
      window.localStorage.getItem(SOUND_STORAGE_KEY) !== "muted";

    this.musicTrack = null;
    this.musicName = null;
    this.musicGeneration = 0;

    this.effectPools = new Map();
    this.ambienceTracks = new Map();
    this.ambienceTimer = null;

    this.pendingTimers = new Set();
    this.fadeTokens = new WeakMap();

    this.unlocked = false;
    this.destroyed = false;
  }

  schedule(callback, milliseconds) {
    const timerId = window.setTimeout(() => {
      this.pendingTimers.delete(timerId);
      callback();
    }, milliseconds);

    this.pendingTimers.add(timerId);
    return timerId;
  }

  clearPendingTimers() {
    this.pendingTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });

    this.pendingTimers.clear();
  }

  async unlock() {
    if (this.destroyed || this.unlocked) return;

    const silentAudio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==",
    );

    silentAudio.volume = 0;

    try {
      await silentAudio.play();
      silentAudio.pause();
      this.unlocked = true;
    } catch {
      // A later direct user interaction will try again.
    }
  }

  setEnabled(nextEnabled) {
    this.enabled = Boolean(nextEnabled);

    window.localStorage.setItem(
      SOUND_STORAGE_KEY,
      this.enabled ? "enabled" : "muted",
    );

    if (!this.enabled) {
      this.stopRandomAmbience();
      this.stopAllEffects();
      this.pauseMusic();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async preload() {
    const sources = [
      ...Object.values(AUDIO_FILES.music),
      ...Object.values(AUDIO_FILES.sfx),
      ...Object.values(AUDIO_FILES.ambience),
    ];

    await Promise.allSettled(
      sources.map(
        (source) =>
          new Promise((resolve) => {
            const audio = new Audio();

            const finish = () => resolve();

            audio.preload = "auto";
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

  getMusicTargetVolume(trackName) {
    return clamp(
      (AUDIO_SETTINGS.musicVolume[trackName] ?? 0.35) *
        AUDIO_SETTINGS.masterVolume,
    );
  }

  async fadeAudio(audio, targetVolume, durationMs) {
    if (!audio) return;

    const token = Symbol("fade");
    this.fadeTokens.set(audio, token);

    const startVolume = audio.volume;
    const target = clamp(targetVolume);
    const duration = Math.max(50, durationMs);
    const startedAt = performance.now();

    return new Promise((resolve) => {
      const frame = (now) => {
        if (
          this.destroyed ||
          this.fadeTokens.get(audio) !== token
        ) {
          resolve();
          return;
        }

        const progress = clamp((now - startedAt) / duration);
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        audio.volume =
          startVolume + (target - startVolume) * eased;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          audio.volume = target;
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  }

  async playMusic(trackName, options = {}) {
    if (
      !this.enabled ||
      this.destroyed ||
      !AUDIO_FILES.music[trackName]
    ) {
      return;
    }

    await this.unlock();

    const generation = ++this.musicGeneration;
    const targetVolume = this.getMusicTargetVolume(trackName);
    const fadeDuration =
      options.fadeDurationMs ??
      (this.musicTrack
        ? AUDIO_SETTINGS.crossfadeMs
        : AUDIO_SETTINGS.fadeInMs);

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

      await this.fadeAudio(
        this.musicTrack,
        targetVolume,
        fadeDuration,
      );

      return;
    }

    const previousTrack = this.musicTrack;
    const nextTrack = createAudio(
      AUDIO_FILES.music[trackName],
      {
        loop: true,
        volume: 0,
      },
    );

    try {
      await nextTrack.play();
    } catch {
      return;
    }

    if (generation !== this.musicGeneration) {
      nextTrack.pause();
      return;
    }

    this.musicTrack = nextTrack;
    this.musicName = trackName;

    const fadeInPromise = this.fadeAudio(
      nextTrack,
      targetVolume,
      fadeDuration,
    );

    const fadeOutPromise = previousTrack
      ? this.fadeAudio(
          previousTrack,
          0,
          fadeDuration,
        ).then(() => {
          previousTrack.pause();
          previousTrack.currentTime = 0;
        })
      : Promise.resolve();

    await Promise.all([fadeInPromise, fadeOutPromise]);
  }

  pauseMusic() {
    if (!this.musicTrack) return;

    this.fadeTokens.delete(this.musicTrack);
    this.musicTrack.pause();
  }

  async stopMusic(options = {}) {
    if (!this.musicTrack) return;

    const track = this.musicTrack;
    const duration =
      options.fadeDurationMs ??
      AUDIO_SETTINGS.fadeOutMs;

    await this.fadeAudio(track, 0, duration);

    track.pause();
    track.currentTime = 0;

    if (this.musicTrack === track) {
      this.musicTrack = null;
      this.musicName = null;
    }
  }

  async duckMusic(options = {}) {
    const track = this.musicTrack;

    if (!track || track.paused) return;

    const normalVolume = this.getMusicTargetVolume(
      this.musicName,
    );

    const multiplier =
      options.volumeMultiplier ??
      AUDIO_SETTINGS.duck.volumeMultiplier;

    await this.fadeAudio(
      track,
      normalVolume * multiplier,
      options.fadeDownMs ??
        AUDIO_SETTINGS.duck.fadeDownMs,
    );

    await delay(
      options.holdMs ??
        AUDIO_SETTINGS.duck.holdMs,
    );

    if (
      this.enabled &&
      this.musicTrack === track &&
      !track.paused
    ) {
      await this.fadeAudio(
        track,
        normalVolume,
        options.fadeUpMs ??
          AUDIO_SETTINGS.duck.fadeUpMs,
      );
    }
  }

  getEffectPool(effectName) {
    if (!this.effectPools.has(effectName)) {
      const source = AUDIO_FILES.sfx[effectName];

      this.effectPools.set(
        effectName,
        Array.from({ length: 4 }, () =>
          createAudio(source),
        ),
      );
    }

    return this.effectPools.get(effectName);
  }

  async playEffect(effectName, options = {}) {
    if (
      !this.enabled ||
      this.destroyed ||
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
    audio.playbackRate = clamp(
      options.playbackRate ?? 1,
      0.75,
      1.3,
    );

    const configuredVolume =
      AUDIO_SETTINGS.sfxVolume[effectName] ?? 0.7;

    audio.volume = clamp(
      (options.volume ?? configuredVolume) *
        AUDIO_SETTINGS.masterVolume,
    );

    try {
      await audio.play();
    } catch {
      // A missing or unsupported MP3 should not break the app.
    }
  }

  playDrawEffect(realm) {
    this.playEffect("flip");

    this.schedule(() => {
      this.playEffect(realm);
    }, 125);
  }

  playCompletionSequence() {
    this.duckMusic();

    this.playEffect("completion");

    this.schedule(() => {
      this.playEffect("shimmer");
    }, 620);
  }

  getAmbienceTrack(name) {
    if (!this.ambienceTracks.has(name)) {
      this.ambienceTracks.set(
        name,
        createAudio(AUDIO_FILES.ambience[name]),
      );
    }

    return this.ambienceTracks.get(name);
  }

  async playAmbience(name) {
    if (
      !this.enabled ||
      this.destroyed ||
      !AUDIO_FILES.ambience[name]
    ) {
      return;
    }

    await this.unlock();

    const audio = this.getAmbienceTrack(name);
    const configuredVolume =
      AUDIO_SETTINGS.ambienceVolume[name] ?? 0.1;

    audio.pause();
    audio.currentTime = 0;
    audio.volume = clamp(
      configuredVolume *
        AUDIO_SETTINGS.masterVolume,
    );

    try {
      await audio.play();
    } catch {
      // Optional ambience failure is non-fatal.
    }
  }

  scheduleNextAmbience() {
    if (!this.enabled || this.destroyed) return;

    const { minimum, maximum } =
      AUDIO_SETTINGS.ambienceIntervalMs;

    const waitTime =
      minimum +
      Math.random() * (maximum - minimum);

    this.ambienceTimer = window.setTimeout(() => {
      const names = Object.keys(AUDIO_FILES.ambience);
      const selected =
        names[Math.floor(Math.random() * names.length)];

      this.playAmbience(selected);
      this.scheduleNextAmbience();
    }, waitTime);
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

    this.ambienceTracks.forEach((audio) => {
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

    this.ambienceTracks.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  async destroy() {
    if (this.destroyed) return;

    this.destroyed = true;
    this.clearPendingTimers();
    this.stopRandomAmbience();
    this.stopAllEffects();

    await this.stopMusic({
      fadeDurationMs: 180,
    });
  }
}

export function createOracleAudioEngineV2() {
  return new OracleAudioEngine();
}
