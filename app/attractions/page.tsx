"use client";

import {
  TripPilotShell,
  useTripPilot,
  ZoyaBadge
} from "../context/TripContext";

export default function AttractionsPage() {
  const controller = useTripPilot("attractions");
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
                ZOYA’S VERIFIED
                DESTINATION GUIDE
              </span>
              <h1>
                Places you can cover in{" "}
                {attractionSearch}
              </h1>
              <p>
                Zoya showing the
                attraction of your
                destination
              </p>
            </div>
            <form
              className="attractionSearch"
              onSubmit={
                discoverAttractions
              }
            >
              <span>⌖</span>
              <input
                value={attractionQuery}
                onChange={(e) =>
                  setAttractionQuery(
                    e.target.value,
                  )
                }
                placeholder="Search a city, town, station, or landmark"
              />
              <button
                disabled={
                  attractionLoading
                }
              >
                {attractionLoading
                  ? `Zoya is exploring ${attractionSearch}...`
                  : "Find places with Zoya →"}
              </button>
            </form>
            <div className="stayHeading">
              <h2>
                {attractionLoading
                  ? "Finding places you can visit..."
                  : `Zoya’s picks around ${attractionSearch}`}
              </h2>
              <a
                href={
                  googleAttractionsUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                Explore all on Google Maps
                ↗
              </a>
            </div>
            {attractionError ? (
              <div className="emptyPlaces">
                <ZoyaBadge />
                <h3>
                  No fake suggestions
                </h3>
                <p>{attractionError}</p>
              </div>
            ) : attractionLoading ? (
              <div className="emptyPlaces attractionLoadingState">
                <ZoyaBadge />
                <h3>
                  Zoya is checking the map
                </h3>
                <p>
                  Finding verified
                  attractions and matching
                  source photographs
                  around{" "}
                  {attractionSearch}.
                </p>
              </div>
            ) : !nearbyAttractions.length ? (
              <div className="emptyPlaces">
                <ZoyaBadge />
                <h3>
                  Search to verify this
                  location
                </h3>
                <p>
                  Only genuine nearby
                  records with matching
                  place information will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="attractionGrid">
                {nearbyAttractions.map(
                  (place) => (
                    <article
                      className="attractionCard"
                      key={`${place.title}-${place.mapsUrl}`}
                    >
                      {place.image ? (
                        <img
                          src={
                            place.image
                          }
                          alt={`${place.title}, ${attractionSearch}`}
                        />
                      ) : (
                        <div className="verifiedNoImage">
                          <span>✓</span>
                          <small>
                            Verified place
                            <br />
                            No free source
                            image
                            available
                          </small>
                        </div>
                      )}
                      <div>
                        <span>
                          ZOYA PICK ·{" "}
                          {place.category ||
                            "VERIFIED PLACE"}
                        </span>
                        <h3>
                          {place.title}
                        </h3>
                        <p>
                          {
                            place.description
                          }
                        </p>
                        <div>
                          {place.source && (
                            <a
                              href={
                                place.source
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Verify
                              source ↗
                            </a>
                          )}
                          <a
                            href={
                              place.mapsUrl ||
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.title}, ${attractionSearch}`)}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Google
                            Maps ↗
                          </a>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
    </TripPilotShell>
  );
}
