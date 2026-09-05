"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import PassportStamp from "../components/PassportStamp";
import {
  TripPilotShell,
  useTripPilot,
  Calendar,
  ZoyaBadge,
  showTripCurrency
} from "../context/TripContext";
import styles from "./TripsPage.module.css";

export default function TripsPage() {
  const [showPassportStamp, setShowPassportStamp] =
    useState(false);
  const passportStampStarted = useRef(false);
  const controller = useTripPilot("dashboard");
  const {
    router,
    screen,
    setScreen,
    sessionReady,
    setSessionReady,
    pendingRoute,
    setPendingRoute,
    activeDay,
    setActiveDay,
    calendarDate,
    setCalendarDate,
    zoyaOpen,
    setZoyaOpen,
    authOpen,
    setAuthOpen,
    signup,
    setSignup,
    loading,
    setLoading,
    chatValue,
    setChatValue,
    authNotice,
    setAuthNotice,
    voiceListening,
    setVoiceListening,
    voiceReply,
    setVoiceReply,
    voiceNotice,
    setVoiceNotice,
    assistantLanguage,
    setAssistantLanguage,
    awaitingTripDetails,
    setAwaitingTripDetails,
    awaitingTripConfirmation,
    setAwaitingTripConfirmation,
    spokenTripDraft,
    setSpokenTripDraft,
    zoyaGreetingVisible,
    setZoyaGreetingVisible,
    darkMode,
    setDarkMode,
    topSearch,
    setTopSearch,
    roomLocation,
    setRoomLocation,
    attractionQuery,
    setAttractionQuery,
    attractionSearch,
    setAttractionSearch,
    attractionLoading,
    setAttractionLoading,
    liveAttractions,
    setLiveAttractions,
    attractionError,
    setAttractionError,
    aiError,
    setAiError,
    transportWarning,
    setTransportWarning,
    locationWarning,
    setLocationWarning,
    budgetWarning,
    setBudgetWarning,
    budgetStatus,
    setBudgetStatus,
    aiConfigured,
    setAiConfigured,
    preferences,
    setPreferences,
    generatedDays,
    setGeneratedDays,
    messages,
    setMessages,
    form,
    setForm,
    weatherLocation,
    setWeatherLocation,
    weatherData,
    setWeatherData,
    weatherLoading,
    setWeatherLoading,
    exchangeRate,
    setExchangeRate,
    exchangeLoading,
    setExchangeLoading,
    exchangeError,
    setExchangeError,
    routePath,
    saveTripSession,
    navigate,
    toggleTheme,
    startingCurrency,
    destinationCurrency,
    destinationBudget,
    current,
    zoyaTips,
    selectTripDay,
    tripDuration,
    expenses,
    tripBudgetBreakdown,
    tripEstimatedTotal,
    routePlaces,
    routeMapUrl,
    mapEmbedUrl,
    bookingOrigin,
    normalizedBookingDestination,
    knownRailHub,
    fallbackBookingDestination,
    bookingDestination,
    onwardTransfer,
    hotelBookingUrl,
    roomBookingUrl,
    bookingFlightUrl,
    uberRideUrl,
    rapidoRideUrl,
    googleAttractionsUrl,
    busBookingUrl,
    redRailUrl,
    transportBooking,
    travelOptions,
    nearbyAttractions,
    tripScene,
    tripSceneImage,
    buildItinerary,
    loadWeather,
    planTrip,
    loadAttractions,
    discoverAttractions,
    searchFromTopBar,
    openFeaturedDestination,
    languageFromText,
    tripQuestion,
    confirmationMessage,
    sendZoya,
    speakZoya,
    startZoyaVoice
  } = controller;

  useEffect(() => {
    if (passportStampStarted.current) {
      const repeatedEffectTimer = window.setTimeout(() => {
        setShowPassportStamp(false);
      }, 2000);

      return () => window.clearTimeout(repeatedEffectTimer);
    }

    const storedValue = window.sessionStorage.getItem(
      "trippilot-passport-stamp",
    );

    window.sessionStorage.removeItem(
      "trippilot-passport-stamp",
    );

    const createdAt = Number(storedValue);
    const wasJustCreated =
      Number.isFinite(createdAt) &&
      Date.now() - createdAt < 10000;

    if (!wasJustCreated) return;

    passportStampStarted.current = true;
    setShowPassportStamp(true);

    const timer = window.setTimeout(() => {
      setShowPassportStamp(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <TripPilotShell controller={controller}>
      <PassportStamp
        visible={showPassportStamp}
        destination={form.destination}
      />
      <section className="dashboard">
            <div className="dashboardMain">
              <div className="heroRow">
                <article
                  key={`${form.destination}-${form.start}-${form.end}`}
                  className="destinationHero scenicHero"
                  role="img"
                  aria-label={`${tripScene.type} scenery for ${form.destination}`}
                  style={{
                    backgroundImage: `linear-gradient(90deg,rgba(8,18,38,.82) 0%,rgba(8,18,38,.55) 48%,rgba(8,18,38,.12) 100%),url("${tripSceneImage}")`,
                  }}
                >
                  <div>
                    <span>
                      Nearest trip
                    </span>
                    <h1>
                      {form.destination}
                    </h1>
                    <p>
                      {new Date(
                        form.start +
                          "T12:00:00",
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                        },
                      )}
                      –
                      {new Date(
                        form.end +
                          "T12:00:00",
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                        },
                      )}{" "}
                      · {tripScene.type}
                    </p>
                    <div>
                      <button>←</button>
                      <button>→</button>
                    </div>
                  </div>
                </article>
                <article className="expenseCard">
                  <span>Expenses</span>
                  <div className="bubbles">
                    <i
                      className="bubble transport"
                      style={{
                        transform: `scale(${0.75 + expenses.transport / 100})`,
                      }}
                    >
                      {expenses.transport}%
                    </i>
                    <i
                      className="bubble hotel"
                      style={{
                        transform: `scale(${0.75 + expenses.hotel / 100})`,
                      }}
                    >
                      {expenses.hotel}%
                    </i>
                    <i
                      className="bubble other"
                      style={{
                        transform: `scale(${0.75 + expenses.other / 100})`,
                      }}
                    >
                      {expenses.other}%
                    </i>
                  </div>
                  <div className="legend">
                    <span>
                      <i /> Transport
                    </span>
                    <span>
                      <i /> Hotel
                    </span>
                    <span>
                      <i /> Other
                    </span>
                  </div>
                </article>
              </div>
              <div className="summaryRow">
                <article>
                  <span>Travel date</span>
                  <button>⋮</button>
                  <b>{tripDuration} days</b>
                  <small>
                    {new Date(`${form.start}T12:00:00`).toLocaleDateString("en-IN")} <i>⇄</i>{" "}
                    {new Date(`${form.end}T12:00:00`).toLocaleDateString("en-IN")}
                  </small>
                </article>
                <article>
                  <span>People</span>
                  <button>⋮</button>
                  <b>
                    {form.travellers}{" "}
                    <i>adults</i>
                  </b>
                  <small>
                    👨‍🦱👩‍🦰 You, friends
                  </small>
                </article>
                <article>
                  <span>Destination</span>
                  <button>⋮</button>
                  <b>
                    {form.destination}
                  </b>
                  <small>
                    🇮🇳 India <i>→</i>{" "}
                    {form.transport}
                  </small>
                </article>
              </div>
              <div className="bottomRow tasksOnly">
                <article className="zoyaTipsPanel">
                  <div className="zoyaTipsHead">
                    <div>
                      <ZoyaBadge />
                      <div>
                        <span>
                          ZOYA’S TRIP
                          INTELLIGENCE
                        </span>
                        <h2>
                          Tips for {form.destination}
                        </h2>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setZoyaOpen(true)
                      }
                    >
                      Ask Zoya ↗
                    </button>
                  </div>
                  <div className="zoyaTipTabs">
                    {zoyaTips.map((tip) => (
                      <button
                        type="button"
                        className={
                          tip.day === activeDay
                            ? "active"
                            : ""
                        }
                        key={tip.day}
                        onClick={() =>
                          selectTripDay(
                            tip.day,
                          )
                        }
                      >
                        Day {tip.day}
                      </button>
                    ))}
                  </div>
                  <article className="zoyaTipDetail">
                    <div>
                      <ZoyaBadge />
                      <span>
                        DAY {activeDay} ·{" "}
                        {current.place}
                      </span>
                    </div>
                    <h3>{current.title}</h3>
                    <ol>
                      {(zoyaTips[
                        activeDay - 1
                      ]?.tips || []).map(
                        (tip) => (
                          <li key={tip}>
                            {tip}
                          </li>
                        ),
                      )}
                    </ol>
                  </article>
                </article>
              </div>
              <section className="bookingSection">
                <div className={`routePlaces ${styles.routePlaces}`}>
                  <span>
                    YOUR MAPPED ITINERARY
                  </span>
                  {generatedDays.map(
                    (day) => (
                      <button
                        key={day.day}
                        className={
                          day.day ===
                          activeDay
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          selectTripDay(
                            day.day,
                          )
                        }
                      >
                        <i>{day.day}</i>
                        {day.place}
                      </button>
                    ),
                  )}
                </div>
              </section>
              <div className={`itinerarySection ${styles.itinerarySection}`}>
                <div className="itineraryTitle">
                  <h2>
                    Your detailed AI
                    itinerary
                  </h2>
                  <span>
                    <ZoyaBadge /> Created
                    by Zoya ·{" "}
                    {generatedDays.length}{" "}
                    days
                  </span>
                </div>
                <div className="dayTabs">
                  {generatedDays.map(
                    (d) => (
                      <button
                        key={d.day}
                        className={
                          d.day ===
                          activeDay
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          selectTripDay(
                            d.day,
                          )
                        }
                      >
                        Day {d.day}
                      </button>
                    ),
                  )}
                </div>
                <div className={`itineraryMapLayout ${styles.itineraryLayout}`}>
                  <article className="dayCard detailedDay">
                    <div>
                      <span>
                        {current.time} ·
                        FULL DAY PLAN
                      </span>
                      <h3>
                        {current.title}
                      </h3>
                      <p className="itinerarySummary">
  {current.summary}
</p>
                    </div>
                    <button
                      onClick={() =>
                        setZoyaOpen(true)
                      }
                    >
                      Refine with Zoya ↗
                    </button>
                  </article>
                  <article className={`mapPanel itinerarySideMap ${styles.mapPanel}`}>
                    <iframe
                      key={`${activeDay}-${current.place}`}
                      title={`Itinerary map highlighting ${current.place} in ${form.destination}`}
                      src={mapEmbedUrl}
                      loading="lazy"
                    />
                    <div className="mapStops">
                      {generatedDays.map(
                        (day) => (
                          <button
                            key={day.day}
                            className={
                              day.day ===
                              activeDay
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              selectTripDay(
                                day.day,
                              )
                            }
                            aria-label={`Show ${day.place} on the map`}
                          >
                            {day.day}
                          </button>
                        ),
                      )}
                    </div>
                    <a
                      href={routeMapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ↗ All{" "}
                      {
                        generatedDays.length
                      }{" "}
                      stops
                    </a>
                  </article>
                </div>

                <section className="afterItinerary">
                  <div className="afterItineraryHead">
                    <h3>
                      Ready to make this
                      trip happen?
                    </h3>
                    <p>
                      Continue with your
                      destination, dates
                      and travel
                      preferences already
                      selected.
                    </p>
                  </div>
                  <div className="bookingGrid postItineraryBookingGrid">
                    <article className="bookingCard transportBooking">
                      <div className="bookingIcon">
                        {
                          transportBooking.icon
                        }
                      </div>
                      <div>
                        <span>
                          {form.transport.toUpperCase()}{" "}
                          ·{" "}
                          {
                            transportBooking.provider
                          }
                        </span>
                        <h3>
                          {form.from} →{" "}
                          {
                            form.destination
                          }
                        </h3>
                        <p>
                          {new Date(
                            form.start +
                              "T12:00:00",
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month:
                                "short",
                              year: "numeric",
                            },
                          )}{" "}
                          ·{" "}
                          {
                            form.travellers
                          }{" "}
                          travellers
                        </p>
                      </div>
                      <a
                        href={
                          transportBooking.url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {
                          transportBooking.label
                        }{" "}
                        ↗
                      </a>
                    </article>

                    <article className="bookingCard hotelBooking">
                      <div className="bookingIcon hotelIcon">
                        ⌂
                      </div>
                      <div>
                        <span>
                          HOTELS ·
                          BOOKING.COM
                        </span>
                        <h3>
                          Stays in{" "}
                          {
                            form.destination
                          }
                        </h3>
                        <p>
                          {new Date(
                            form.start +
                              "T12:00:00",
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month:
                                "short",
                            },
                          )}{" "}
                          –{" "}
                          {new Date(
                            form.end +
                              "T12:00:00",
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month:
                                "short",
                            },
                          )}{" "}
                          ·{" "}
                          {
                            form.travellers
                          }{" "}
                          adults
                        </p>
                      </div>
                      <a
                        href={
                          hotelBookingUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Find hotels on
                        Booking.com ↗
                      </a>
                    </article>

                    <article className="bookingCard attractionBooking">
                      <div className="bookingIcon attractionIcon">
                        ⌖
                      </div>
                      <div>
                        <span>
                          ATTRACTIONS ·
                          ZOYA VERIFIED
                        </span>
                        <h3>
                          Places around{" "}
                          {
                            form.destination
                          }
                        </h3>
                        <p>
                          Verified nearby
                          attractions,
                          photos and maps
                        </p>
                      </div>
                      <button
                        type="button"
                        className="bookingAction attractionAction"
                        onClick={() => {
                          setAttractionQuery(
                            form.destination,
                          );
                          setAttractionSearch(
                            form.destination,
                          );
                          navigate(
                            "attractions",
                          );
                          void loadAttractions(
                            form.destination,
                          );
                          window.scrollTo(
                            {
                              top: 0,
                              behavior:
                                "smooth",
                            },
                          );
                        }}
                      >
                        Explore nearby
                        attractions ↗
                      </button>
                    </article>
                  </div>
                </section>
              </div>
            </div>

            <aside className="timelinePanel">
              <div className="timelineHeading">
                <h2>Timeline</h2>
                <button>
                  Add event ＋
                </button>
              </div>
              <Calendar
                selectedDate={calendarDate}
                onSelect={
                  (date, itineraryDay) => {
                    setCalendarDate(date);
                    selectTripDay(
                      itineraryDay,
                    );
                  }
                }
                startDate={form.start}
                endDate={form.end}
              />
              {tripEstimatedTotal > 0 && (
                <article className="timelineBudgetPanel">
                  <div className="timelineBudgetHead">
                    <div>
                      <span>
                        ZOYA’S TRIP ESTIMATE
                      </span>
                      <h3>
                        Budget breakdown
                      </h3>
                    </div>
                    <strong>
                      {showTripCurrency(
                        tripEstimatedTotal,
                        startingCurrency,
                      )}
                    </strong>
                  </div>
                  <div className="timelineBudgetList">
                    {tripBudgetBreakdown.map(
                      (item) => (
                        <div
                          className="timelineBudgetRow"
                          key={item.label}
                        >
                          <i>{item.icon}</i>
                          <div>
                            <span>
                              {item.label}
                            </span>
                            <b>
                              {showTripCurrency(
                                item.amount,
                                startingCurrency,
                              )}
                            </b>
                            <em>
                              <small
                                style={{
                                  width: `${Math.max(6, (item.amount / Math.max(...tripBudgetBreakdown.map((entry) => entry.amount), 1)) * 100)}%`,
                                }}
                              />
                            </em>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <p>
                    Estimated for all{" "}
                    {form.travellers} travellers in{" "}
                    {startingCurrency.code}. Confirm
                    live prices before booking.
                  </p>
                </article>
              )}
            </aside>
          </section>
    </TripPilotShell>
  );
}
