export const AUDIO_FILES = {
  music: {
    ritual: new URL(
      "../assets/audio/music/ritual-ambient.mp3",
      import.meta.url,
    ).href,

    result: new URL(
      "../assets/audio/music/result-meditation.mp3",
      import.meta.url,
    ).href,
  },

  sfx: {
    start: new URL(
      "../assets/audio/sfx/start-ritual.mp3",
      import.meta.url,
    ).href,

    sky: new URL(
      "../assets/audio/sfx/sky-draw.mp3",
      import.meta.url,
    ).href,

    earth: new URL(
      "../assets/audio/sfx/earth-draw.mp3",
      import.meta.url,
    ).href,

    human: new URL(
      "../assets/audio/sfx/human-draw.mp3",
      import.meta.url,
    ).href,

    flip: new URL(
      "../assets/audio/sfx/card-flip.mp3",
      import.meta.url,
    ).href,

    completion: new URL(
      "../assets/audio/sfx/oracle-completion.mp3",
      import.meta.url,
    ).href,

    shimmer: new URL(
      "../assets/audio/sfx/golden-shimmer.mp3",
      import.meta.url,
    ).href,

    end: new URL(
      "../assets/audio/sfx/end-ceremony.mp3",
      import.meta.url,
    ).href,
  },

  ambience: {
    wind: new URL(
      "../assets/audio/ambience/bamboo-wind.mp3",
      import.meta.url,
    ).href,

    birds: new URL(
      "../assets/audio/ambience/mountain-birds.mp3",
      import.meta.url,
    ).href,

    water: new URL(
      "../assets/audio/ambience/flowing-water.mp3",
      import.meta.url,
    ).href,

    bell: new URL(
      "../assets/audio/ambience/distant-temple-bell.mp3",
      import.meta.url,
    ).href,
  },
};

export const AUDIO_SETTINGS = {
  masterVolume: 0.86,

  musicVolume: {
    ritual: 0.38,
    result: 0.31,
  },

  sfxVolume: {
    start: 0.72,
    sky: 0.72,
    earth: 0.82,
    human: 0.76,
    flip: 0.48,
    completion: 0.82,
    shimmer: 0.58,
    end: 0.68,
  },

  ambienceVolume: {
    wind: 0.12,
    birds: 0.1,
    water: 0.11,
    bell: 0.16,
  },

  fadeInMs: 2200,
  fadeOutMs: 1800,
  crossfadeMs: 2200,

  duck: {
    volumeMultiplier: 0.44,
    fadeDownMs: 360,
    holdMs: 2600,
    fadeUpMs: 950,
  },

  ambienceIntervalMs: {
    minimum: 22000,
    maximum: 42000,
  },
};
