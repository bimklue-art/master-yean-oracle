export function createOracleAudioEngine() {
  let context = null;
  let masterGain = null;
  let musicGain = null;
  let effectsGain = null;
  let ambientNodes = [];
  let ambientTimer = null;
  let enabled = true;

  function ensureContext() {
    if (!context) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      context = new AudioContextClass();

      masterGain = context.createGain();
      musicGain = context.createGain();
      effectsGain = context.createGain();

      masterGain.gain.value = enabled ? 1 : 0;
      musicGain.gain.value = 0.18;
      effectsGain.gain.value = 0.75;

      musicGain.connect(masterGain);
      effectsGain.connect(masterGain);
      masterGain.connect(context.destination);
    }

    if (context.state === "suspended") {
      context.resume();
    }

    return context;
  }

  function setEnabled(nextEnabled) {
    enabled = nextEnabled;

    if (!context || !masterGain) return;

    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(
      enabled ? 1 : 0,
      now + 0.25,
    );
  }

  function createTone({
    frequency,
    duration = 0.5,
    volume = 0.08,
    type = "sine",
    destination = effectsGain,
    detune = 0,
    attack = 0.03,
  }) {
    if (!enabled) return;

    const audio = ensureContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.detune.setValueAtTime(detune, audio.currentTime);

    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      audio.currentTime + attack,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration,
    );

    oscillator.connect(gain);
    gain.connect(destination || effectsGain);

    oscillator.start(audio.currentTime);
    oscillator.stop(audio.currentTime + duration + 0.03);
  }

  function createNoiseBurst({
    duration = 0.45,
    volume = 0.03,
    highpass = 700,
  }) {
    if (!enabled) return;

    const audio = ensureContext();
    const bufferLength = Math.floor(audio.sampleRate * duration);
    const buffer = audio.createBuffer(
      1,
      bufferLength,
      audio.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let index = 0; index < bufferLength; index += 1) {
      const fade = 1 - index / bufferLength;
      data[index] = (Math.random() * 2 - 1) * fade;
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();

    filter.type = "highpass";
    filter.frequency.value = highpass;

    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration,
    );

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(effectsGain);

    source.start();
  }

  function playDrawEffect(realm) {
    if (!enabled) return;

    ensureContext();
    createNoiseBurst({
      duration: 0.34,
      volume: 0.018,
      highpass: realm === "earth" ? 420 : 760,
    });

    if (realm === "sky") {
      createTone({
        frequency: 523.25,
        duration: 0.72,
        volume: 0.08,
        type: "sine",
      });
      window.setTimeout(() => {
        createTone({
          frequency: 783.99,
          duration: 0.62,
          volume: 0.052,
          type: "sine",
        });
      }, 90);
    }

    if (realm === "earth") {
      createTone({
        frequency: 196,
        duration: 0.82,
        volume: 0.085,
        type: "triangle",
      });
      window.setTimeout(() => {
        createTone({
          frequency: 293.66,
          duration: 0.68,
          volume: 0.045,
          type: "sine",
        });
      }, 110);
    }

    if (realm === "human") {
      createTone({
        frequency: 392,
        duration: 0.64,
        volume: 0.07,
        type: "triangle",
      });
      window.setTimeout(() => {
        createTone({
          frequency: 659.25,
          duration: 0.7,
          volume: 0.058,
          type: "sine",
        });
      }, 80);
      window.setTimeout(() => {
        createTone({
          frequency: 987.77,
          duration: 0.46,
          volume: 0.032,
          type: "sine",
        });
      }, 160);
    }
  }

  function playCompletionEffect() {
    if (!enabled) return;

    const notes = [
      [392, 0],
      [523.25, 170],
      [659.25, 340],
      [783.99, 520],
    ];

    notes.forEach(([frequency, delay], index) => {
      window.setTimeout(() => {
        createTone({
          frequency,
          duration: 1.15 - index * 0.08,
          volume: 0.055 - index * 0.004,
          type: index === 0 ? "triangle" : "sine",
        });
      }, delay);
    });
  }

  function scheduleAmbientBell() {
    if (!context || !enabled) return;

    const scale = [261.63, 293.66, 392, 440, 523.25];
    const frequency =
      scale[Math.floor(Math.random() * scale.length)];

    createTone({
      frequency,
      duration: 2.4,
      volume: 0.018,
      type: "sine",
      destination: musicGain,
      attack: 0.22,
      detune: Math.random() * 8 - 4,
    });

    ambientTimer = window.setTimeout(
      scheduleAmbientBell,
      4200 + Math.random() * 4200,
    );
  }

  function startAmbientMusic() {
    if (!enabled || ambientNodes.length > 0) return;

    const audio = ensureContext();
    const droneFrequencies = [98, 146.83, 196];

    droneFrequencies.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const filter = audio.createBiquadFilter();

      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? -5 : index === 2 ? 4 : 0;

      filter.type = "lowpass";
      filter.frequency.value = 620;

      gain.gain.value = index === 0 ? 0.024 : 0.012;

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);

      oscillator.start();

      ambientNodes.push({ oscillator, gain });
    });

    scheduleAmbientBell();
  }

  function stopAmbientMusic() {
    if (ambientTimer) {
      window.clearTimeout(ambientTimer);
      ambientTimer = null;
    }

    if (!context) {
      ambientNodes = [];
      return;
    }

    const now = context.currentTime;

    ambientNodes.forEach(({ oscillator, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      try {
        oscillator.stop(now + 0.85);
      } catch {
        // The oscillator may already be stopped.
      }
    });

    ambientNodes = [];
  }

  async function destroy() {
    stopAmbientMusic();

    if (context) {
      await context.close().catch(() => {});
    }

    context = null;
    masterGain = null;
    musicGain = null;
    effectsGain = null;
  }

  return {
    setEnabled,
    startAmbientMusic,
    stopAmbientMusic,
    playDrawEffect,
    playCompletionEffect,
    destroy,
  };
}
