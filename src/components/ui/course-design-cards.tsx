import React from "react";

export interface CardAvatar {
  src?: string;
  /** Shown if `src` fails to load. */
  fallback?: string;
  alt: string;
  /** Letter shown when there is no image. */
  initial: string;
}

// Define the type for the card data
export interface CardData {
  id: number;
  colorClass: string;
  date: string;
  title: string;
  description: string;
  progressPercent: string;
  progressValue: string;
  label?: string;
  imgSrc1?: string;
  imgAlt1?: string;
  imgSrc2?: string;
  imgAlt2?: string;
  avatars?: CardAvatar[];
  /** Cover picture across the top of the card. */
  image?: { src: string; fallback?: string; alt: string };
  countdownText: string;
  /** Shown when the card is open. */
  summary?: string;
  /** Names listed under "Watch first" when the card is open. */
  prerequisiteNames?: string[];
}

// Define the props for the Card component
export interface CardProps {
  data: CardData;
  onAdd?: () => void;
  onCountdownClick?: () => void;
  countdownActive?: boolean;
  addLabel?: string;
  /** Click on the card (not on its buttons) calls this. */
  onToggle?: () => void;
  expanded?: boolean;
}

const EllipsisIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cc-icon" aria-hidden="true">
    <circle cx="12" cy="5.5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="18.5" r="1.7" />
  </svg>
);

const AddIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cc-icon" aria-hidden="true">
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);

const Card: React.FC<CardProps> = ({
  data,
  onAdd,
  onCountdownClick,
  countdownActive,
  addLabel = "Add",
  onToggle,
  expanded = false,
}) => {
  const {
    colorClass,
    date,
    title,
    description,
    progressPercent,
    progressValue,
    label = "Progress",
    imgSrc1,
    imgAlt1,
    imgSrc2,
    imgAlt2,
    countdownText,
    summary,
    prerequisiteNames = [],
    image,
  } = data;

  const avatars: CardAvatar[] =
    data.avatars ??
    [
      imgSrc1 && { src: imgSrc1, alt: imgAlt1 || "user avatar", initial: "?" },
      imgSrc2 && { src: imgSrc2, alt: imgAlt2 || "user avatar", initial: "?" },
    ].filter(Boolean) as CardAvatar[];

  return (
    <div
      className={`cc-card ${colorClass}${onToggle ? " is-clickable" : ""}${expanded ? " is-open" : ""}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle?.();
        }
      }}
      tabIndex={onToggle ? 0 : undefined}
      aria-expanded={onToggle ? expanded : undefined}
    >
      <div className={"cc-header" + (image ? " has-cover" : "")}>
        {image && (
          <img
            className="cc-cover"
            src={image.src}
            alt={image.alt}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (image.fallback && !img.src.endsWith(image.fallback)) img.src = image.fallback;
            }}
          />
        )}
        <div className="cc-date">{date}</div>
        <EllipsisIcon />
      </div>
      <div className="cc-body">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="cc-progress">
          <span>{label}</span>
          <div className="cc-progress-bar" style={{ "--p": progressPercent } as React.CSSProperties} />
          <span>{progressValue}</span>
        </div>
      </div>
      <div className="cc-details" aria-hidden={!expanded}>
        <div className="cc-details-inner">
          <p className="cc-summary">{summary || "No description yet."}</p>
          <p className="cc-details-label">Watch first</p>
          {prerequisiteNames.length ? (
            <div className="cc-chips">
              {prerequisiteNames.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          ) : (
            <p className="cc-none">Nothing. You can start here.</p>
          )}
        </div>
      </div>
      <div className="cc-footer">
        <ul>
          {avatars.map((a) => (
            <li key={a.alt} title={a.alt}>
              {a.src ? (
                <img
                  src={a.src}
                  alt={a.alt}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (a.fallback && !img.src.endsWith(a.fallback)) img.src = a.fallback;
                  }}
                />
              ) : (
                <span className="cc-initial">{a.initial}</span>
              )}
            </li>
          ))}
          <li>
            <button type="button" className="cc-btn-add" onClick={(e) => { e.stopPropagation(); onAdd?.(); }} aria-label={addLabel} title={addLabel}>
              <AddIcon />
            </button>
          </li>
        </ul>
        <button
          type="button"
          className={"cc-btn-countdown" + (countdownActive ? " is-active" : "")}
          onClick={(e) => {
            e.stopPropagation();
            onCountdownClick?.();
          }}
        >
          {countdownText}
        </button>
      </div>
    </div>
  );
};

export default Card;
