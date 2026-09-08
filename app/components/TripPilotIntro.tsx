"use client";

import { useEffect, useState } from "react";
import styles from "./TripPilotIntro.module.css";

const INTRO_SESSION_KEY = "trippilot-intro-seen";

export default function TripPilotIntro() {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const alreadySeen = window.sessionStorage.getItem(
      INTRO_SESSION_KEY,
    );

    if (alreadySeen) {
      setVisible(false);
      return;
    }

    window.sessionStorage.setItem(INTRO_SESSION_KEY, "yes");
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;

    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 4000);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [visible]);

  function closeIntro() {
    setVisible(false);
    document.body.style.overflow = "";
  }

  if (visible !== true) return null;

  return (
    <div
      className={styles.intro}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        background: "#eef3ff",
      }}
    >
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
        <p>You’re the pilot. Zoya is your copilot.</p>
        <small>Preparing your next journey…</small>
      </div>
    </div>
  );
}
