# Background Music and Card Sound Upgrade

This package adds a procedural Web Audio soundtrack, so no MP3 or WAV files are required.

## Files

- `App.jsx`
- `src/audio/oracleAudio.js`

## Audio behaviour

- Ambient music begins after the opening ceremony.
- Ambient music stops when the user ends the ceremony.
- The existing sound toggle controls both music and effects.
- The sound preference remains stored in the browser.
- Heaven, Earth, and Human now have different layered draw effects.
- The completion sequence uses a four-note ceremonial chord.

## Placement

Place `oracleAudio.js` at:

```text
src/audio/oracleAudio.js
```

Replace the existing:

```text
src/App.jsx
```

with the supplied App file.
