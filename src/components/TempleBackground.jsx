import "./TempleBackground.css";

function TempleBackground({
  activeRealm,
  sky,
  earth,
  human,
  ceremonyPhase,
  resultPhase,
}) {
  const atmosphereClasses = [
    "oracle-atmosphere",
    `atmosphere-${activeRealm}`,
    sky ? "atmosphere-has-sky" : "",
    earth ? "atmosphere-has-earth" : "",
    human ? "atmosphere-has-human" : "",
    ceremonyPhase === "ritual" ? "atmosphere-awake" : "",
    resultPhase === "transition" ? "atmosphere-converging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={atmosphereClasses} aria-hidden="true">
        <div className="temple-decoration temple-decoration-left" />
        <div className="temple-decoration temple-decoration-right" />

        <div className="living-cloud living-cloud-one" />
        <div className="living-cloud living-cloud-two" />
        <div className="living-cloud living-cloud-three" />

        <div className="living-light-ray living-light-ray-one" />
        <div className="living-light-ray living-light-ray-two" />

        <div className="living-lantern-glow living-lantern-left" />
        <div className="living-lantern-glow living-lantern-right" />

        <div className="cosmology-disc cosmology-disc-outer">
          <span className="cosmology-mark mark-1">☰</span>
          <span className="cosmology-mark mark-2">☷</span>
          <span className="cosmology-mark mark-3">☵</span>
          <span className="cosmology-mark mark-4">☲</span>
          <span className="cosmology-mark mark-5">☳</span>
          <span className="cosmology-mark mark-6">☴</span>
          <span className="cosmology-mark mark-7">☶</span>
          <span className="cosmology-mark mark-8">☱</span>
        </div>

        <div className="cosmology-disc cosmology-disc-middle">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              className={`cosmology-dot dot-${index + 1}`}
              key={index}
            />
          ))}
        </div>

        <div className="cosmology-core">
          <span>九</span>
        </div>

        <div className="realm-light realm-light-sky" />
        <div className="realm-light realm-light-earth" />
        <div className="realm-light realm-light-human" />

        <div className="ambient-particle-field">
          {Array.from({ length: 28 }).map((_, index) => (
            <span
              key={index}
              style={{
                "--ambient-index": index,
                "--ambient-delay": `${(index % 7) * 0.55}s`,
              }}
            />
          ))}
        </div>

        <div className="living-gold-dust">
          {Array.from({ length: 22 }).map((_, index) => (
            <span
              key={index}
              style={{
                "--dust-index": index,
                "--dust-delay": `${(index % 8) * 0.7}s`,
              }}
            />
          ))}
        </div>

        <div className="living-temple-aura" />
      </div>

      <div className="mist living-mist living-mist-one" />
      <div className="mist living-mist living-mist-two" />
      <div className="mist living-mist living-mist-three" />

      <div className="gold-particle living-gold-particle particle-one" />
      <div className="gold-particle living-gold-particle particle-two" />
      <div className="gold-particle living-gold-particle particle-three" />
    </>
  );
}

export default TempleBackground;
