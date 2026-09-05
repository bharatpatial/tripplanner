import {
  TripPilotController,
  ZoyaBadge,
} from "../context/TripContext";
import CurrencyConversion from "./CurrencyConversion";
import PlannerWarnings from "./PlannerWarnings";
import styles from "./TripPlannerForm.module.css";

type Props = {
  controller: TripPilotController;
};

export default function TripPlannerForm({ controller }: Props) {
  const {
    form,
    setForm,
    preferences,
    setPreferences,
    planTrip,
    loading,
    aiError,
    startingCurrency,
    destinationCurrency,
    destinationBudget,
    exchangeRate,
    exchangeLoading,
    exchangeError,
    locationWarning,
    budgetWarning,
    budgetStatus,
    transportWarning,
    setTransportWarning,
    setBudgetWarning,
    setBudgetStatus,
  } = controller;

  function setField(field: keyof typeof form, value: string) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  function changeBudget(value: string) {
    setBudgetWarning("");
    setBudgetStatus("");
    setField("budget", value);
  }

  function changeTransport(value: string) {
    setTransportWarning("");
    setField("transport", value);
  }

  return (
    <form
      id="tripPlannerForm"
      className="planCard"
      onSubmit={planTrip}
    >
      <div className="planCardHead">
        <div>
          <span>YOUR NEXT JOURNEY</span>
          <h2>Create a new trip</h2>
        </div>
        <div className="aiLabel">
          <ZoyaBadge /> Real AI
        </div>
      </div>

      <div className="inputGrid">
        <label>
          <span>STARTING FROM</span>
          <div>
            <i>⌖</i>
            <input
              value={form.from}
              onChange={(event) => setField("from", event.target.value)}
              placeholder="e.g. Ferozepur Cantt"
              required
            />
          </div>
        </label>

        <label>
          <span>DESTINATION</span>
          <div>
            <i>⌖</i>
            <input
              value={form.destination}
              onChange={(event) =>
                setField("destination", event.target.value)
              }
              placeholder="e.g. Mata Vaishno Devi Station"
              required
            />
          </div>
        </label>

        <label>
          <span>DEPARTURE</span>
          <div>
            <input
              type="date"
              value={form.start}
              onChange={(event) => setField("start", event.target.value)}
              required
            />
          </div>
        </label>

        <label>
          <span>RETURN</span>
          <div>
            <input
              type="date"
              value={form.end}
              onChange={(event) => setField("end", event.target.value)}
              required
            />
          </div>
        </label>

        <label>
          <span>TRAVELLERS</span>
          <div>
            <input
              type="number"
              min="1"
              max="50"
              value={form.travellers}
              onChange={(event) =>
                setField("travellers", event.target.value)
              }
              placeholder="Enter number of travellers"
              required
            />
          </div>
        </label>

        <label>
          <span>BUDGET ({startingCurrency.code})</span>
          <div>
            <b className={styles.currencySymbol}>
              {startingCurrency.symbol}
            </b>
            <input
              type="number"
              min="1"
              value={form.budget}
              onChange={(event) => changeBudget(event.target.value)}
              required
            />
            <b className={styles.currencyCode}>
              {startingCurrency.code}
            </b>
          </div>
        </label>

        <label>
          <span>TRAVEL STYLE</span>
          <div>
            <select
              value={form.travelType}
              onChange={(event) =>
                setField("travelType", event.target.value)
              }
            >
              <option value="Adventure">🏔️ Adventure</option>
              <option value="Relaxation">🌴 Relaxation</option>
              <option value="Romantic">❤️ Romantic</option>
              <option value="Family">👨‍👩‍👧‍👦 Family</option>
              <option value="Friends">🧑‍🤝‍🧑 Friends</option>
              <option value="Spiritual">🛕 Spiritual</option>
            </select>
          </div>
        </label>

        <label>
          <span>TRANSPORT</span>
          <div>
            <select
              value={form.transport}
              onChange={(event) =>
                changeTransport(event.target.value)
              }
            >
              <option value="Train">🚆 Train</option>
              <option value="Flight">✈️ Flight</option>
              <option value="Bus">🚌 Bus</option>
              <option value="Car">🚗 Car</option>
              <option value="Taxi">🚕 Taxi</option>
            </select>
          </div>
        </label>
      </div>

      <label className="preference">
        <span>ANYTHING SPECIAL?</span>
        <textarea
          value={preferences}
          onChange={(event) => setPreferences(event.target.value)}
          placeholder="Hidden cafés, mountain views, local food..."
        />
      </label>

      {aiError && <p className="dataError">{aiError}</p>}

      <CurrencyConversion
        form={form}
        startingCurrency={startingCurrency}
        destinationCurrency={destinationCurrency}
        destinationBudget={destinationBudget}
        exchangeRate={exchangeRate}
        exchangeLoading={exchangeLoading}
        exchangeError={exchangeError}
      />

      <PlannerWarnings
        locationWarning={locationWarning}
        budgetWarning={budgetWarning}
        budgetStatus={budgetStatus}
        transportWarning={transportWarning}
      />

      <button
        className="generateTrip"
        disabled={loading}
      >
        {loading
          ? "Zoya is verifying places and planning..."
          : "Create verified AI trip"}
        <span>→</span>
      </button>

      <small className="planFoot">
        AI uses verified nearby-place data · No invented attractions
      </small>
    </form>
  );
}
