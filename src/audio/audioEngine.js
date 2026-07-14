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

    /*
      iPhone Safari is more reliable when sound effects reuse media elements
      that were created and unlocked during the first user gesture.
    */
    this.mobileSfxChannels = [];
    this.mobileSfxIndex = 0;
    this.mobileAmbienceChannel = null;

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

  unlock() {
    if (this.destroyed) return;
    this.unlocked = true;
  }

  primeMobileAudio() {
    if (!this.enabled || this.destroyed) return;

    this.unlock();
    this.ensureMobileChannels();

    /*
      Prime the ritual music during the user's first tap.
    */
    if (!this.musicTrack) {
      const ritualTrack = createAudio(
        AUDIO_FILES.music.ritual,
        {
          loop: true,
          volume: 0,
        },
      );

      const playPromise = ritualTrack.play();

      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }

      this.musicTrack = ritualTrack;
      this.musicName = "ritual";
    }

    /*
      Prime every persistent SFX channel during the same user gesture.
      Safari can then reuse these elements later for flips and bells.
    */
    this.mobileSfxChannels.forEach((channel, index) => {
      channel.pause();
      channel.currentTime = 0;
      channel.src = AUDIO_FILES.sfx.start;
      channel.volume =
        index === 0
          ? (AUDIO_SETTINGS.sfxVolume.start ?? 0.72) *
            AUDIO_SETTINGS.masterVolume
          : 0;

      const promise = channel.play();

      if (promise?.catch) {
        promise.catch(() => {});
      }

      if (index !== 0) {
        window.setTimeout(() => {
          channel.pause();
          channel.currentTime = 0;
        }, 40);
      }
    });

    /*
      Prime the optional ambience channel too.
    */
    this.mobileAmbienceChannel.pause();
    this.mobileAmbienceChannel.currentTime = 0;
    this.mobileAmbienceChannel.src =
      AUDIO_FILES.ambience.wind;
    this.mobileAmbienceChannel.volume = 0;

    const ambiencePromise =
      this.mobileAmbienceChannel.play();

    if (ambiencePromise?.catch) {
      ambiencePromise.catch(() => {});
    }

    window.setTimeout(() => {
      this.mobileAmbienceChannel?.pause();
      if (this.mobileAmbienceChannel) {
        this.mobileAmbienceChannel.currentTime = 0;
      }
    }, 40);
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

  isMobileSafariLike() {
    const userAgent = window.navigator.userAgent;
    const touchDevice =
      "ontouchstart" in window ||
      window.navigator.maxTouchPoints > 0;

    return (
      touchDevice &&
      /iPhone|iPad|iPod|Macintosh/i.test(userAgent)
    );
  }

  ensureMobileChannels() {
    if (this.mobileSfxChannels.length === 0) {
      this.mobileSfxChannels = Array.from(
        { length: 3 },
        () =>
          createAudio(AUDIO_FILES.sfx.start, {
            volume: 0,
          }),
      );
    }

    if (!this.mobileAmbienceChannel) {
      this.mobileAmbienceChannel = createAudio(
        AUDIO_FILES.ambience.wind,
        {
          volume: 0,
        },
      );
    }
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

    this.unlock();

    const generation = ++this.musicGeneration;
    const targetVolume = this.getMusicTargetVolume(trackName);
    const fadeDuration =
      options.fadeDurationMs ??
      AUDIO_SETTINGS.crossfadeMs;

    if (
      this.musicTrack &&
      this.musicName === trackName
    ) {
      if (this.musicTrack.paused) {
        try {
          const playPromise = this.musicTrack.play();
          if (playPromise?.catch) {
            await playPromise;
          }
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

    this.unlock();

    const configuredVolume =
      AUDIO_SETTINGS.sfxVolume[effectName] ?? 0.7;

    const finalVolume = clamp(
      (options.volume ?? configuredVolume) *
        AUDIO_SETTINGS.masterVolume,
    );

    const playbackRate = clamp(
      options.playbackRate ?? 1,
      0.75,
      1.3,
    );

    /*
      Reuse channels already unlocked by the initial tap on iPhone/iPad.
    */
    if (this.isMobileSafariLike()) {
      this.ensureMobileChannels();

      const audio =
        this.mobileSfxChannels[
          this.mobileSfxIndex %
            this.mobileSfxChannels.length
        ];

      this.mobileSfxIndex += 1;

      audio.pause();
      audio.currentTime = 0;
      audio.src = AUDIO_FILES.sfx[effectName];
      audio.volume = finalVolume;
      audio.playbackRate = playbackRate;
      audio.load();

      try {
        const playPromise = audio.play();

        if (playPromise?.catch) {
          await playPromise;
        }
      } catch {
        /*
          Retry once after load metadata. This handles slower iPhone networks.
        */
        await new Promise((resolve) => {
          const finish = () => resolve();

          audio.addEventListener(
            "canplay",
            finish,
            { once: true },
          );

          audio.addEventListener(
            "error",
            finish,
            { once: true },
          );

          window.setTimeout(finish, 700);
        });

        try {
          const retryPromise = audio.play();

          if (retryPromise?.catch) {
            await retryPromise;
          }
        } catch {
          // Never interrupt the oracle UI for an audio failure.
        }
      }

      return;
    }

    const pool = this.getEffectPool(effectName);
    const audio =
      pool.find((item) => item.paused || item.ended) ??
      pool[0];

    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = playbackRate;
    audio.volume = finalVolume;

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

    this.unlock();

    const configuredVolume =
      AUDIO_SETTINGS.ambienceVolume[name] ?? 0.1;

    const finalVolume = clamp(
      configuredVolume *
        AUDIO_SETTINGS.masterVolume,
    );

    if (this.isMobileSafariLike()) {
      this.ensureMobileChannels();

      const audio = this.mobileAmbienceChannel;

      audio.pause();
      audio.currentTime = 0;
      audio.src = AUDIO_FILES.ambience[name];
      audio.volume = finalVolume;
      audio.load();

      try {
        const playPromise = audio.play();

        if (playPromise?.catch) {
          await playPromise;
        }
      } catch {
        // Optional ambience is non-fatal.
      }

      return;
    }

    const audio = this.getAmbienceTrack(name);

    audio.pause();
    audio.currentTime = 0;
    audio.volume = finalVolume;

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
    this.mobileSfxChannels.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (this.mobileAmbienceChannel) {
      this.mobileAmbienceChannel.pause();
      this.mobileAmbienceChannel.currentTime = 0;
    }

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
