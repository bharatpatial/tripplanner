import {
  showTripCurrency,
  TripPilotController,
} from "../context/TripContext";
import styles from "./CurrencyConversion.module.css";

type Props = Pick<
  TripPilotController,
  | "form"
  | "startingCurrency"
  | "destinationCurrency"
  | "destinationBudget"
  | "exchangeRate"
  | "exchangeLoading"
  | "exchangeError"
>;

export default function CurrencyConversion({
  form,
  startingCurrency,
  destinationCurrency,
  destinationBudget,
  exchangeRate,
  exchangeLoading,
  exchangeError,
}: Props) {
  if (startingCurrency.code === destinationCurrency.code) {
    return null;
  }

  return (
    <article className={`${styles.card} currencyConversionCard`}>
      <div className={styles.head}>
        <span>LIVE CURRENCY CONVERSION</span>
        <span>
          {startingCurrency.code} → {destinationCurrency.code}
        </span>
      </div>

      {exchangeLoading && <p>Checking the latest exchange rate...</p>}
      {!exchangeLoading && exchangeError && <p>{exchangeError}</p>}

      {!exchangeLoading && !exchangeError && destinationBudget !== null && (
        <>
          <div className={styles.amount}>
            <strong>
              {showTripCurrency(Number(form.budget), startingCurrency)}
            </strong>
            <span>≈</span>
            <strong>
              {showTripCurrency(destinationBudget, destinationCurrency)}
            </strong>
          </div>
          <small>
            {startingCurrency.symbol}1 = {destinationCurrency.symbol}
            {exchangeRate?.toLocaleString("en-US", {
              maximumFractionDigits: 6,
            })}{" "}
            · Rates may change
          </small>
        </>
      )}
    </article>
  );
}
