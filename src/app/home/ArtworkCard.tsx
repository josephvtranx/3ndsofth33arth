"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./home.module.css";

type Work = {
  name: string;
  width: number;
  height: number;
  alt: string;
  materials: string;
  description: string;
};

export default function ArtworkCard({ work }: { work: Work }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (hovered || focused || pinned);
  const detailsId = `${work.name}-details`;

  return (
    <figure
      className={styles.artworkCard}
      data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          setHovered(true);
          setDismissed(false);
        }
      }}
      onPointerLeave={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setPinned(false);
          setDismissed(true);
        }
      }}
    >
      <button
        type="button"
        className={`${styles.artworkImage} ${styles.artworkTrigger}`}
        aria-label={`${work.name} — artwork details`}
        aria-expanded={open}
        aria-controls={detailsId}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) {
            setFocused(true);
            setDismissed(false);
          }
        }}
        onBlur={() => {
          setFocused(false);
          setPinned(false);
        }}
        onClick={() => {
          setPinned(!pinned);
          setDismissed(pinned);
        }}
      >
        <Image src={`/images/apoptosis/${work.name}.jpg`} alt={work.alt} width={work.width} height={work.height} sizes="(max-width: 600px) 90vw, 30vw" className={work.name === "death" ? styles.deathImage : work.name === "rebirth" ? styles.rebirthImage : undefined} />
      </button>
      <figcaption className={styles.artworkLabel}>{work.name}</figcaption>
      <div id={detailsId} className={styles.artworkOverlay} aria-hidden={!open}>
        <p className={styles.artworkTitle}>{work.name}</p>
        <p>2026</p>
        <p>{work.materials}</p>
        <p>24 × 36 in.</p>
        <p className={styles.artworkDescription}>{work.description}</p>
      </div>
    </figure>
  );
}
