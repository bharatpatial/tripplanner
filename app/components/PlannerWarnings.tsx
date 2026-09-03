import { ZoyaBadge } from "../context/TripContext";
import styles from "./PlannerWarnings.module.css";

type Props = {
  locationWarning: string;
  budgetWarning: string;
  budgetStatus: "" | "suitable" | "low";
  transportWarning: string;
};

export default function PlannerWarnings({
  locationWarning,
  budgetWarning,
  budgetStatus,
  transportWarning,
}: Props) {
  return (
    <>
      {locationWarning && (
        <div className="plannerPopup locationPopup">
          ⚠️ {locationWarning}
        </div>
      )}

      {budgetWarning && (
        <div className={`plannerPopup budgetPopup ${budgetStatus}`}>
          <ZoyaBadge />
          <span>{budgetWarning}</span>
        </div>
      )}

      {transportWarning && (
        <div className={styles.transportWarning}>
          ⚠️ {transportWarning}
        </div>
      )}
    </>
  );
}
