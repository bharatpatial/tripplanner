"use client";

import { useEffect, useState } from "react";
import styles from "./TripPilotIntro.module.css";

export default function TripPilotIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 4000);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  function closeIntro() {
    setVisible(false);
    document.body.style.overflow = "";
  }

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.intro}>
      <button
        className={styles.skip}
        onClick={closeIntro}
        type="button"
      >
        Skip
      </button>

      <div className={styles.skyGlow} />
      <div className={`${styles.cloud} ${styles.cloudOne}`} />
      <div className={`${styles.cloud} ${styles.cloudTwo}`} />

      <div className={styles.flightPath}>
        <span className={styles.startDot} />
        <span className={styles.endDot} />
      </div>

      <img
  className={styles.aircraft}
  src="/trippilot-plane.png?v=2"
  alt=""
/>

      <div className={styles.brand}>
        <div className={styles.logo}>✈</div>

        <h1>
          Trip<span>Pilot</span>
        </h1>

        <p>
          You’re the pilot. Zoya is your copilot.
        </p>

        <small>Preparing your next journey…</small>
      </div>
    </div>
  );
}
