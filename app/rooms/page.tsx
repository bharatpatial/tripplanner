"use client";

import {
  TripPilotShell,
  useTripPilot
} from "../context/TripContext";

export default function RoomsPage() {
  const controller = useTripPilot("rooms");
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
                FIND YOUR KIND OF STAY
              </span>
              <h1>Rooms & hotels</h1>
              <p>
                Enter any destination to
                discover hotels,
                apartments, and memorable
                stays on Booking.com.
              </p>
            </div>
            <div className="roomSearch">
              <label>
                WHERE ARE YOU GOING?
                <input
                  value={roomLocation}
                  onChange={(e) =>
                    setRoomLocation(
                      e.target.value,
                    )
                  }
                  placeholder="Enter a city or destination"
                />
              </label>
              <label>
                CHECK-IN
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
                CHECK-OUT
                <input
                  type="date"
                  value={form.end}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                GUESTS
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
                    1 guest
                  </option>
                  <option value="2">
                    2 guests
                  </option>
                  <option value="4">
                    4 guests
                  </option>
                  <option value="6">
                    6 guests
                  </option>
                </select>
              </label>
              <a
                href={roomBookingUrl}
                target="_blank"
                rel="noreferrer"
              >
                Search stays →
              </a>
            </div>
            <div className="stayHeading">
              <h2>
                Explore stays in{" "}
                {roomLocation ||
                  "your destination"}
              </h2>
              <span>
                Powered by Booking.com
              </span>
            </div>
            <div className="stayGrid">
              {[
                {
                  title:
                    "Hotels & boutique stays",
                  image:
                    "photo-1566073771259-6a8506099945",
                  tag: "HOTELS",
                },
                {
                  title:
                    "Apartments & homestays",
                  image:
                    "photo-1522708323590-d24dbb6b0267",
                  tag: "APARTMENTS",
                },
                {
                  title:
                    "Resorts & scenic escapes",
                  image:
                    "photo-1571896349842-33c89424de2d",
                  tag: "RESORTS",
                },
              ].map((stay) => (
                <a
                  className="stayCard"
                  href={roomBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  key={stay.title}
                >
                  <img
                    src={`https://images.unsplash.com/${stay.image}?auto=format&fit=crop&w=760&q=82`}
                    alt={stay.title}
                  />
                  <div>
                    <span>
                      {stay.tag} ·{" "}
                      {roomLocation ||
                        form.destination}
                    </span>
                    <h3>{stay.title}</h3>
                    <small>
                      View available stays
                      on Booking.com ↗
                    </small>
                  </div>
                </a>
              ))}
            </div>
          </section>
    </TripPilotShell>
  );
}
