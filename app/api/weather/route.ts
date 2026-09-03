import { NextRequest, NextResponse } from "next/server";

const WEATHER_ICONS: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "❄️",
  73: "❄️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️"
};

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get("location")?.trim();

  if (!location) {
    return NextResponse.json({ error: "Location is required." }, { status: 400 });
  }

  try {
    const geoParams = new URLSearchParams({
      name: location,
      count: "1",
      language: "en",
      format: "json"
    });
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${geoParams}`,
      { cache: "no-store" }
    );

    if (!geoResponse.ok) throw new Error("Location search failed.");

    const geoData = await geoResponse.json();
    const place = geoData?.results?.[0];

    if (!place) {
      return NextResponse.json(
        { error: `Weather location not found for ${location}.` },
        { status: 404 }
      );
    }

    const forecastParams = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      forecast_days: "5",
      timezone: "auto"
    });
    const forecastResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?${forecastParams}`,
      { cache: "no-store" }
    );

    if (!forecastResponse.ok) throw new Error("Weather forecast failed.");

    const weather = await forecastResponse.json();
    const forecast = weather.daily.time.map((date: string, index: number) => ({
      date,
      day: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
        weekday: "short"
      }),
      icon: WEATHER_ICONS[weather.daily.weather_code[index]] || "🌦️",
      maximum: Math.round(weather.daily.temperature_2m_max[index]),
      minimum: Math.round(weather.daily.temperature_2m_min[index])
    }));

    return NextResponse.json({
      location: place.name,
      fullLocation: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
      latitude: place.latitude,
      longitude: place.longitude,
      temperature: Math.round(weather.current.temperature_2m),
      icon: WEATHER_ICONS[weather.current.weather_code] || "🌦️",
      forecast
    });
  } catch (error) {
    console.error("Sidebar weather error:", error);
    return NextResponse.json(
      { error: "Live weather is temporarily unavailable." },
      { status: 502 }
    );
  }
}