export function createOracleAudioEngine() {
  let context = null;
  let masterGain = null;
  let musicGain = null;
  let effectsGain = null;
  let reverbGain = null;
  let reverbDelay = null;
  let enabled = true;
  let musicRunning = false;
  let musicTimers = new Set();
  let droneNodes = [];

  const pentatonic = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.0,  // G4
    440.0,  // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.0,  // A5
  ];

  function ensureContext() {
    if (!context) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      context = new AudioContextClass();

      masterGain = context.createGain();
      musicGain = context.createGain();
      effectsGain = context.createGain();
      reverbGain = context.createGain();
      reverbDelay = context.createDelay(2.0);

      masterGain.gain.value = enabled ? 1 : 0;
      musicGain.gain.value = 0.24;
      effectsGain.gain.value = 0.78;
      reverbGain.gain.value = 0.2;
      reverbDelay.delayTime.value = 0.32;

      musicGain.connect(masterGain);
      effectsGain.connect(masterGain);

      musicGain.connect(reverbDelay);
      reverbDelay.connect(reverbGain);
      reverbGain.connect(masterGain);

      masterGain.connect(context.destination);
    }

    if (context.state === "suspended") {
      context.resume();
    }

    return context;
  }

  function schedule(callback, delay) {
    const timerId = window.setTimeout(() => {
      musicTimers.delete(timerId);
      callback();
    }, delay);

    musicTimers.add(timerId);
    return timerId;
  }

  function clearMusicTimers() {
    musicTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });

    musicTimers.clear();
  }

  function setEnabled(nextEnabled) {
    enabled = nextEnabled;

    if (!context || !masterGain) return;

    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(
      Math.max(masterGain.gain.value, 0.0001),
      now,
    );
    masterGain.gain.linearRampToValueAtTime(
      enabled ? 1 : 0.0001,
      now + 0.3,
    );
  }

  function createOscillatorTone({
    frequency,
    duration = 0.8,
    volume = 0.05,
    type = "sine",
    destination,
    attack = 0.02,
    release = 0.75,
    detune = 0,
    lowpass = 2200,
  }) {
    if (!enabled) return;

    const audio = ensureContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.detune.setValueAtTime(detune, audio.currentTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(lowpass, audio.currentTime);

    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      audio.currentTime + attack,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + Math.max(release, attack + 0.05),
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination || musicGain);

    oscillator.start(audio.currentTime);
    oscillator.stop(audio.currentTime + duration + 0.05);
  }

  function playGuqinPluck(frequency, volume = 0.045) {
    if (!enabled) return;

    const audio = ensureContext();
    const bufferDuration = 1.2;
    const buffer = audio.createBuffer(
      1,
      Math.floor(audio.sampleRate * bufferDuration),
      audio.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      const time = index / audio.sampleRate;
      const decay = Math.exp(-4.8 * time);
      const harmonic =
        Math.sin(2 * Math.PI * frequency * time) +
        0.45 * Math.sin(2 * Math.PI * frequency * 2 * time) +
        0.18 * Math.sin(2 * Math.PI * frequency * 3 * time);

      data[index] =
        harmonic * decay * 0.3 +
        (Math.random() * 2 - 1) * decay * 0.035;
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();

    filter.type = "lowpass";
    filter.frequency.value = 1900;

    gain.gain.value = volume;

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    source.start();
  }

  function playDiziNote(frequency, duration = 1.25, volume = 0.028) {
    if (!enabled) return;

    const audio = ensureContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    const vibrato = audio.createOscillator();
    const vibratoGain = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    vibrato.frequency.value = 5.3;
    vibratoGain.gain.value = 4.5;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);

    filter.type = "bandpass";
    filter.frequency.value = frequency * 1.1;
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      audio.currentTime + 0.18,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration,
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    oscillator.start();
    vibrato.start();

    oscillator.stop(audio.currentTime + duration + 0.05);
    vibrato.stop(audio.currentTime + duration + 0.05);
  }

  function playTempleTap(volume = 0.018) {
    if (!enabled) return;

    const audio = ensureContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(185, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      92,
      audio.currentTime + 0.22,
    );

    filter.type = "lowpass";
    filter.frequency.value = 520;

    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + 0.35,
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.38);
  }

  function playWindChime(frequency, delay = 0) {
    schedule(() => {
      createOscillatorTone({
        frequency,
        duration: 1.8,
        volume: 0.018,
        type: "sine",
        attack: 0.015,
        release: 1.7,
        lowpass: 4200,
      });
    }, delay);
  }

  function playMelodyPhrase() {
    if (!musicRunning || !enabled) return;

    const phrases = [
      [0, 2, 3, 2, 1],
      [2, 3, 5, 4, 2],
      [4, 3, 2, 0, 1],
      [0, 1, 3, 4, 3],
      [3, 5, 4, 2, 1],
    ];

    const phrase =
      phrases[Math.floor(Math.random() * phrases.length)];

    phrase.forEach((noteIndex, index) => {
      schedule(() => {
        if (!musicRunning) return;

        const frequency = pentatonic[noteIndex + 2];

        if (index % 2 === 0) {
          playDiziNote(
            frequency,
            0.95 + Math.random() * 0.35,
            0.022,
          );
        } else {
          playGuqinPluck(frequency / 2, 0.038);
        }
      }, index * 620);
    });

    schedule(() => {
      if (musicRunning) {
        playMelodyPhrase();
      }
    }, 5200 + Math.random() * 2600);
  }

  function playAccompanimentPattern() {
    if (!musicRunning || !enabled) return;

    const roots = [130.81, 146.83, 164.81, 196.0, 220.0];
    const root = roots[Math.floor(Math.random() * roots.length)];

    playGuqinPluck(root, 0.05);

    schedule(() => {
      if (musicRunning) {
        playGuqinPluck(root * 1.5, 0.032);
      }
    }, 780);

    schedule(() => {
      if (musicRunning) {
        playGuqinPluck(root * 2, 0.028);
      }
    }, 1560);

    schedule(() => {
      if (musicRunning) {
        playTempleTap(0.013);
      }
    }, 2200);

    schedule(() => {
      if (musicRunning) {
        playAccompanimentPattern();
      }
    }, 3600 + Math.random() * 1300);
  }

  function playChimePattern() {
    if (!musicRunning || !enabled) return;

    const base = pentatonic[
      5 + Math.floor(Math.random() * 3)
    ];

    playWindChime(base, 0);
    playWindChime(base * 1.25, 160);
    playWindChime(base * 1.5, 310);

    schedule(() => {
      if (musicRunning) {
        playChimePattern();
      }
    }, 9200 + Math.random() * 5000);
  }

  function startDrone() {
    if (!enabled || droneNodes.length > 0) return;

    const audio = ensureContext();
    const droneFrequencies = [65.41, 98.0, 130.81];

    droneFrequencies.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const filter = audio.createBiquadFilter();

      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? -6 : index === 2 ? 5 : 0;

      filter.type = "lowpass";
      filter.frequency.value = 340;

      gain.gain.value = index === 0 ? 0.022 : 0.009;

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);

      oscillator.start();
      droneNodes.push({ oscillator, gain });
    });
  }

  function startAmbientMusic() {
    if (!enabled || musicRunning) return;

    ensureContext();
    musicRunning = true;

    startDrone();
    playAccompanimentPattern();

    schedule(() => {
      if (musicRunning) {
        playMelodyPhrase();
      }
    }, 900);

    schedule(() => {
      if (musicRunning) {
        playChimePattern();
      }
    }, 2600);
  }

  function stopAmbientMusic() {
    musicRunning = false;
    clearMusicTimers();

    if (!context) {
      droneNodes = [];
      return;
    }

    const now = context.currentTime;

    droneNodes.forEach(({ oscillator, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(
        Math.max(gain.gain.value, 0.0001),
        now,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1.1,
      );

      try {
        oscillator.stop(now + 1.15);
      } catch {
        // Node may already be stopped.
      }
    });

    droneNodes = [];
  }

  function createNoiseBurst({
    duration = 0.45,
    volume = 0.025,
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

    if (realm === "sky") {
      createNoiseBurst({
        duration: 0.32,
        volume: 0.014,
        highpass: 980,
      });

      playWindChime(659.25, 0);
      playWindChime(987.77, 90);
      playDiziNote(783.99, 0.75, 0.045);
    }

    if (realm === "earth") {
      playTempleTap(0.042);
      playGuqinPluck(146.83, 0.07);

      schedule(() => {
        playGuqinPluck(220, 0.045);
      }, 120);
    }

    if (realm === "human") {
      createNoiseBurst({
        duration: 0.26,
        volume: 0.012,
        highpass: 760,
      });

      playGuqinPluck(196, 0.055);
      playDiziNote(523.25, 0.72, 0.038);

      schedule(() => {
        playWindChime(783.99, 0);
      }, 120);
    }
  }

  function playCompletionEffect() {
    if (!enabled) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];

    notes.forEach((frequency, index) => {
      schedule(() => {
        playGuqinPluck(frequency / 2, 0.045);
        playWindChime(frequency, 0);
      }, index * 180);
    });

    schedule(() => {
      playDiziNote(783.99, 1.8, 0.036);
    }, 780);
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
    reverbGain = null;
    reverbDelay = null;
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
