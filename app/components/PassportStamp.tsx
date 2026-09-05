"use client";

import styles from "./PassportStamp.module.css";

type Props = {
  visible: boolean;
  destination: string;
};

export default function PassportStamp({
  visible,
  destination,
}: Props) {
  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      aria-live="polite"
    >
      <div className={styles.passport}>
        <div className={styles.stamp}>
          <span>TRIPPILOT</span>
          <strong>TRIP APPROVED</strong>
          <span>{destination}</span>
        </div>
        <p>Zoya has completed your itinerary</p>
      </div>
    </div>
  );
}
