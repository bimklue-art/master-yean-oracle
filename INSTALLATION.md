# MASTER YEAN ORACLE — Audio Engine v2 Installation

This is Phase 1. The engine is ready for real MP3 recordings.

## 1. Copy these files

```text
src/audio/audioConfig.js
src/audio/audioManager.js
src/audio/useOracleAudio.js
```

## 2. Add the audio folders

```text
src/assets/audio/
├── music/
├── sfx/
└── ambience/
```

The included folders contain filename lists.

## 3. Required filenames

### Music

```text
ritual-ambient.mp3
result-meditation.mp3
```

### Sound effects

```text
start-ritual.mp3
sky-draw.mp3
earth-draw.mp3
human-draw.mp3
card-flip.mp3
oracle-completion.mp3
golden-shimmer.mp3
end-ceremony.mp3
```

### Optional ambience

```text
bamboo-wind.mp3
mountain-birds.mp3
flowing-water.mp3
distant-temple-bell.mp3
```

## 4. Update App.jsx

Remove the old import:

```jsx
import { createOracleAudioEngine } from "./audio/oracleAudio";
```

Add:

```jsx
import { useOracleAudio } from "./audio/useOracleAudio";
```

Inside `App()`, after `soundEnabled` is declared, add:

```jsx
const audio = useOracleAudio(soundEnabled);
```

Delete the old:

```jsx
const audioEngineRef = useRef(null);
```

and delete the old effects that create or destroy `createOracleAudioEngine()`.

## 5. Replace old audio calls

### Opening button

Inside `beginCeremony()`:

```jsx
async function beginCeremony() {
  await audio.unlock();
  audio.playEffect("start");
  setCeremonyPhase("entering");

  schedule(() => {
    setCeremonyPhase("ritual");
    audio.playMusic("ritual");
    audio.startRandomAmbience();
  }, 1400);
}
```

### Drawing cards

Replace:

```jsx
audioEngineRef.current?.playDrawEffect(realm);
```

with:

```jsx
audio.playDrawEffect(realm);
```

### Completion

Replace the old completion effect call with:

```jsx
audio.playCompletionSequence();

schedule(() => {
  audio.playMusic("result");
}, 900);
```

### Restart

Inside `resetRitual()` add:

```jsx
audio.playMusic("ritual");
```

### End ceremony

Inside `endCeremony()`:

```jsx
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
```

## 6. Sound toggle

Your current sound toggle may remain unchanged because `useOracleAudio`
automatically responds to `soundEnabled`.

## Important

Until the MP3 files are added, Vite may report missing-file errors because
`audioConfig.js` imports the exact filenames.

Add the audio files before running the final build.
