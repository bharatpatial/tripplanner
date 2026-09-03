"use client";

import {
  TripPilotShell,
  useTripPilot
} from "../context/TripContext";

export default function TravelsPage() {
  const controller = useTripPilot("travels");
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

  return (
    <TripPilotShell controller={controller}>
      <section className="featurePage">
            <div className="featureHeading">
              <span>
                EVERY WAY TO GET THERE
              </span>
              <h1>Plan your travels</h1>
              <p>
                Choose a ride, compare
                your options, and continue
                to a trusted booking
                partner.
              </p>
            </div>
            <div className="journeyBar">
              <label>
                FROM
                <input
                  value={form.from}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      from: e.target
                        .value,
                    })
                  }
                />
              </label>
              <span className="journeyArrow">
                →
              </span>
              <label>
                DESTINATION
                <input
                  value={form.destination}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      destination:
                        e.target.value,
                    })
                  }
                />
              </label>
              <label>
                DEPARTURE
                <input
                  type="date"
                  value={form.start}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start:
                        e.target.value,
                    })
                  }
                />
              </label>
              <label>
                TRAVELLERS
                <select
                  value={form.travellers}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      travellers:
                        e.target.value,
                    })
                  }
                >
                  <option value="1">
                    1 traveller
                  </option>
                  <option value="2">
                    2 travellers
                  </option>
                  <option value="4">
                    4 travellers
                  </option>
                  <option value="6">
                    6 travellers
                  </option>
                </select>
              </label>
            </div>
            <div className="travelOptionGrid">
              {travelOptions.map(
                (option) => (
                  <article
                    className={`travelOption ${option.tone}`}
                    key={option.title}
                  >
                    <div className="travelOptionTop">
                      <span>
                        {option.icon}
                      </span>
                      <i>
                        {option.provider}
                      </i>
                    </div>
                    <h2>
                      {option.title}
                    </h2>
                    <p>{option.note}</p>
                    <div className="travelRoute">
                      <b>{form.from}</b>
                      <span>→</span>
                      <b>
                        {form.destination}
                      </b>
                    </div>
                    <small>
                      {new Date(
                        form.start +
                          "T12:00:00",
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                        },
                      )}{" "}
                      · {form.travellers}{" "}
                      travellers
                    </small>
                    <a
                      href={option.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Book on{" "}
                      {option.provider} ↗
                    </a>
                  </article>
                ),
              )}
            </div>
            <div className="partnerNote">
              Bookings are completeda
              securely on the provider’s
              own website.
            </div>
          </section>
    </TripPilotShell>
  );
}
