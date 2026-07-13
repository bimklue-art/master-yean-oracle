import { APP_TEXT } from "../config/appText";
import "./OracleSpread.css";

function OracleSpread({ sky, earth, human, onReset, onEnd }) {
  const cards = [
    {
      realm: "sky",
      label: APP_TEXT.decks.sky.realmLabel,
      symbol: APP_TEXT.decks.sky.symbol,
      card: sky,
    },
    {
      realm: "earth",
      label: APP_TEXT.decks.earth.realmLabel,
      symbol: APP_TEXT.decks.earth.symbol,
      card: earth,
    },
    {
      realm: "human",
      label: APP_TEXT.decks.human.realmLabel,
      symbol: APP_TEXT.decks.human.symbol,
      card: human,
    },
  ];

  return (
    <section
      className="oracle-result oracle-result-rc1"
      aria-labelledby="oracle-result-title"
    >
      <div className="result-particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            style={{
              "--particle-index": index,
              "--particle-delay": `${(index % 6) * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div
        className="result-light-ray result-light-ray-left"
        aria-hidden="true"
      />
      <div
        className="result-light-ray result-light-ray-right"
        aria-hidden="true"
      />

      <div className="ritual-halo" aria-hidden="true" />
      <div className="ritual-ring ritual-ring-outer" aria-hidden="true" />
      <div className="ritual-ring ritual-ring-inner" aria-hidden="true" />

      <header className="oracle-result-header">
        <p className="oracle-result-kicker">
          {APP_TEXT.result.kicker}
        </p>

        <h1 id="oracle-result-title">
          {APP_TEXT.result.title}
        </h1>

        <div className="oracle-result-divider" />
      </header>

      <div className="oracle-spread oracle-spread-rc1">
        <div className="oracle-blessing-sweep" aria-hidden="true" />

        {cards.map(({ realm, label, symbol, card }) => (
          <article
            className={`spread-position spread-${realm} reveal-${realm}`}
            key={realm}
          >
            <div className="spread-realm">
              <span aria-hidden="true">{symbol}</span>
              <span>{label}</span>
            </div>

            <div className="spread-card-shell living-oracle-card">
              <img
                src={card.image}
                alt={`${label} ${card.name}`}
                className="spread-card-image"
              />

              <div className="spread-card-glow" aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>

      <div className="oracle-result-message oracle-result-message-rc1">
        <div className="oracle-guidance-block">
          <p className="oracle-guidance-cn">
            {APP_TEXT.result.reflection}
          </p>

          <p className="oracle-guidance-en">
            {APP_TEXT.result.reflectionEn}
          </p>

          <p className="oracle-guidance-cn oracle-guidance-consultation">
            {APP_TEXT.result.consultation}
          </p>

          <p className="oracle-guidance-en">
            {APP_TEXT.result.consultationEn}
          </p>
        </div>

        <section
          className="master-consultation-card"
          aria-labelledby="consultation-card-title"
        >
          <div className="consultation-card-ornament" aria-hidden="true">
            <span />
            <span>◆</span>
            <span />
          </div>

          <p className="consultation-card-kicker">
            {APP_TEXT.result.contactCardKicker}
          </p>

          <h2 id="consultation-card-title">
            {APP_TEXT.result.contactCardTitle}
          </h2>

          <div className="consultation-methods">
            <a
              className="consultation-method"
              href={`mailto:${APP_TEXT.result.email}`}
            >
              <span
                className="consultation-method-icon"
                aria-hidden="true"
              >
                ✉
              </span>

              <span className="consultation-method-copy">
                <span className="consultation-method-label">
                  {APP_TEXT.result.emailLabel}
                </span>

                <span className="consultation-method-value">
                  {APP_TEXT.result.email}
                </span>
              </span>
            </a>

            <a
              className="consultation-method"
              href={`https://wa.me/${APP_TEXT.result.whatsappLink}`}
              target="_blank"
              rel="noreferrer"
            >
              <span
                className="consultation-method-icon"
                aria-hidden="true"
              >
                ☎
              </span>

              <span className="consultation-method-copy">
                <span className="consultation-method-label">
                  {APP_TEXT.result.contactLabel}
                </span>

                <span className="consultation-method-value">
                  {APP_TEXT.result.contact}
                </span>
              </span>
            </a>
          </div>
        </section>
      </div>

      <div className="result-actions result-actions-rc1">
        <button
          className="ritual-reset-button"
          type="button"
          onClick={onReset}
        >
          <span>{APP_TEXT.result.restartButton}</span>
        </button>

        <button
          className="end-ceremony-button"
          type="button"
          onClick={onEnd}
        >
          <span>{APP_TEXT.result.endButton}</span>
        </button>
      </div>
    </section>
  );
}

export default OracleSpread;
