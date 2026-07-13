import { useState } from "react";
import { APP_TEXT } from "../config/appText";

function Deck({
  title,
  color,
  value,
  locked,
  flipping,
  onClick,
}) {
  const [isPressing, setIsPressing] = useState(false);
  const isActive = !locked && !value && !flipping;

  function activateCard() {
    if (!isActive || isPressing) return;

    setIsPressing(true);
    setTimeout(() => {
      onClick();
      setIsPressing(false);
    }, 220);
  }

  const deckConfig = title.includes("SKY")
    ? APP_TEXT.decks.sky
    : title.includes("EARTH")
    ? APP_TEXT.decks.earth
    : APP_TEXT.decks.human;

  const deckName = deckConfig.name;
  const deckSymbol = deckConfig.symbol;

  return (
    <div className="deck-column">
      <h2
        className="deck-heading"
        style={{ color }}
      >
        {title}
      </h2>

      <div
        className={[
          "oracle-card",
          flipping ? "is-turning" : "",
          value ? "is-flipped" : "",
          locked ? "is-locked" : "",
          isActive ? "is-active" : "",
          isPressing ? "is-pressing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={isActive ? activateCard : undefined}
        style={{ "--realm-color": color }}
        role={isActive ? "button" : undefined}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={(event) => {
          if (isActive && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            activateCard();
          }
        }}
        aria-label={
          isActive
            ? `Draw from the ${deckName.toLowerCase()} deck`
            : `${deckName.toLowerCase()} deck`
        }
      >
        <div className="oracle-card-inner">
          <div className="oracle-card-face oracle-card-back">
            <div className="back-border" />

            <div className="back-content">
              {locked ? (
                <div className="back-locked">锁</div>
              ) : (
                <>
                  <div className="back-symbol">{deckSymbol}</div>

                  <div className="back-nine">
                    九
                    <br />
                    数
                  </div>

                  <div className="back-divider" />

                  <div className="back-brand">MASTER YEAN</div>

                  <div className="back-deck-name">
                    {deckName} DECK
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="oracle-card-face oracle-card-front">
            {value?.image && (
              <img
                src={value.image}
                alt={`${deckName} card ${value.name}`}
                className="oracle-card-artwork"
              />
            )}
          </div>
        </div>
      </div>

      <p className="deck-status">
        {value
          ? APP_TEXT.deckStatus.revealed
          : locked
          ? APP_TEXT.deckStatus.locked
          : flipping
          ? APP_TEXT.deckStatus.revealing
          : APP_TEXT.deckStatus.draw}
      </p>
    </div>
  );
}

export default Deck;
