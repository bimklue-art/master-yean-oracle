import { useEffect } from "react";
import { APP_TEXT } from "../config/appText";
import "./ResultTransition.css";

function ResultTransition() {
  useEffect(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([35, 60, 70]);
    }
  }, []);

  return (
    <div
      className="oracle-transition oracle-formation-ceremony"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="formation-darkening" aria-hidden="true" />

      <div className="formation-mist formation-mist-left" aria-hidden="true" />
      <div className="formation-mist formation-mist-right" aria-hidden="true" />

      <div className="formation-beam formation-beam-sky" aria-hidden="true" />
      <div className="formation-beam formation-beam-earth" aria-hidden="true" />
      <div className="formation-beam formation-beam-human" aria-hidden="true" />

      <div className="formation-symbol-stage" aria-hidden="true">
        <div className="formation-ring formation-ring-outer">
          <span className="formation-trigram trigram-1">☰</span>
          <span className="formation-trigram trigram-2">☷</span>
          <span className="formation-trigram trigram-3">☵</span>
          <span className="formation-trigram trigram-4">☲</span>
          <span className="formation-trigram trigram-5">☳</span>
          <span className="formation-trigram trigram-6">☴</span>
          <span className="formation-trigram trigram-7">☶</span>
          <span className="formation-trigram trigram-8">☱</span>
        </div>

        <div className="formation-ring formation-ring-inner" />

        <div className="formation-core" aria-label="Yin Yang">
          <span className="formation-yinyang-symbol">☯</span>
        </div>

        <div className="formation-seal">
          <span>天</span>
          <span>地</span>
          <span>人</span>
        </div>
      </div>

      <div className="formation-copy">
        <p className="transition-title">
          {APP_TEXT.transition.title}
        </p>

        <p className="transition-title-en">
          {APP_TEXT.transition.titleEn}
        </p>

        <div className="transition-divider" />

        <p className="transition-subtitle">
          {APP_TEXT.transition.subtitle}
        </p>

        <p className="transition-subtitle-en">
          {APP_TEXT.transition.subtitleEn}
        </p>
      </div>

      <div className="formation-gold-sweep" aria-hidden="true" />
    </div>
  );
}

export default ResultTransition;
