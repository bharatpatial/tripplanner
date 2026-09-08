import { NextRequest, NextResponse } from "next/server";

type GeoPlace = {
  lat: string;
  lon: string;
  address?: {
    country_code?: string;
    country?: string;
  };
};

const USER_AGENT = "TripPilot/1.0 (travel budget estimator)";

const veryHighCostCountries = new Set([
  "ch",
  "is",
  "no",
  "dk",
  "sg",
  "lu",
]);

const highCostCountries = new Set([
  "gb",
  "us",
  "ca",
  "au",
  "nz",
  "fr",
  "de",
  "nl",
  "ie",
  "se",
  "fi",
  "at",
  "be",
  "jp",
  "kr",
  "it",
  "es",
]);

const budgetCountries = new Set([
  "id",
  "th",
  "vn",
  "np",
  "lk",
  "my",
  "kh",
  "la",
  "ph",
  "eg",
  "tr",
  "ge",
  "uz",
  "bd",
]);

async function geocode(location: string) {
  const params = new URLSearchParams({
    q: location,
    format: "json",
    limit: "1",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
      },
      next: {
        revalidate: 86400,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Location lookup failed");
  }

  const places: GeoPlace[] = await response.json();

  if (!places.length) {
    throw new Error(`Could not identify ${location}`);
  }

  return places[0];
}

function distanceInKm(start: GeoPlace, end: GeoPlace) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const startLat = Number(start.lat);
  const startLon = Number(start.lon);
  const endLat = Number(end.lat);
  const endLon = Number(end.lon);
  const latitude = radians(endLat - startLat);
  const longitude = radians(endLon - startLon);
  const calculation =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(radians(startLat)) *
      Math.cos(radians(endLat)) *
      Math.sin(longitude / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(calculation),
      Math.sqrt(1 - calculation),
    )
  );
}

function tripDays(start: string, end: string) {
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const difference = last.getTime() - first.getTime();

  if (!Number.isFinite(difference) || difference < 0) {
    return 1;
  }

  return Math.min(
    15,
    Math.max(1, Math.floor(difference / 86400000) + 1),
  );
}

function costMultiplier(countryCode: string) {
  if (veryHighCostCountries.has(countryCode)) return 2.30;
  if (highCostCountries.has(countryCode)) return 1.7;
  if (budgetCountries.has(countryCode)) return 0.82;
  return 1.15;
}

function roundToFiveHundred(amount: number) {
  return Math.ceil(amount / 500) * 500;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const from = String(body.from || "").trim();
    const destination = String(body.destination || "").trim();

    if (!from || !destination) {
      return NextResponse.json(
        { error: "Starting place and destination are required." },
        { status: 400 },
      );
    }

    const [origin, arrival] = await Promise.all([
      geocode(from),
      geocode(destination),
    ]);

    const originCountry = origin.address?.country_code || "";
    const destinationCountry = arrival.address?.country_code || "";
    const international =
      Boolean(originCountry && destinationCountry) &&
      originCountry !== destinationCountry;
    const distance = distanceInKm(origin, arrival);
    const days = tripDays(String(body.start), String(body.end));
    const nights = Math.max(0, days - 1);
    const travellers = Math.max(1, Number(body.travellers) || 1);
    const rooms = Math.max(1, Math.ceil(travellers / 2));
    const transport = String(body.transport || "Flight");
    const multiplier = costMultiplier(destinationCountry);

    let travelPerTraveller = 0;

    if (international) {
      const distanceFare = 12000 + distance * 5;
      travelPerTraveller = Math.max(18000, distanceFare) *
        Math.max(0.72, Math.min(1.45, multiplier * 0.78));
    } else {
      const distanceBand =
        distance > 1500 ? "long" : distance > 600 ? "medium" : "short";
      const domesticTransport: Record<string, Record<string, number>> = {
        Train: { short: 2200, medium: 3800, long: 5500 },
        Bus: { short: 2000, medium: 3600, long: 5200 },
        Flight: { short: 9000, medium: 13000, long: 17000 },
        Car: { short: 4500, medium: 7500, long: 12000 },
        Taxi: { short: 6500, medium: 11000, long: 18000 },
      };

      travelPerTraveller =
        domesticTransport[transport]?.[distanceBand] || 4500;
    }

    const travel = roundToFiveHundred(
      travelPerTraveller * travellers,
    );
    const hotelPerRoomNight = international
      ? 4600 * multiplier
      : 2500;
    const foodPerTravellerDay = international
      ? 1650 * multiplier
      : 1000;
    const localPerTravellerDay = international
      ? 750 * multiplier
      : 500;
    const activitiesPerTravellerDay = international
      ? 1050 * multiplier
      : 600;
    const visaInsurancePerTraveller = international
      ? 4500 * Math.max(0.8, multiplier)
      : 0;

    const hotel = roundToFiveHundred(
      hotelPerRoomNight * rooms * nights,
    );
    const food = roundToFiveHundred(
      foodPerTravellerDay * travellers * days,
    );
    const localFares = roundToFiveHundred(
      localPerTravellerDay * travellers * days,
    );
    const activities = roundToFiveHundred(
      activitiesPerTravellerDay * travellers * days,
    );
    const visaInsurance = roundToFiveHundred(
      visaInsurancePerTraveller * travellers,
    );
    const coreTotal =
      travel + hotel + food + localFares + activities;
    const minimumBudget = roundToFiveHundred(
      coreTotal + visaInsurance,
    );
    const recommendedBudget = roundToFiveHundred(
      minimumBudget * 1.30,
    );
    const other = recommendedBudget - coreTotal;
    const enteredBudget = Math.max(0, Number(body.budget) || 0);
    const transportWarning =
      international && transport !== "Flight"
        ? `This international trip cannot realistically use ${transport} as its main transport. Please select Flight.`
        : "";

    return NextResponse.json({
      sourceCountry: origin.address?.country || originCountry,
      destinationCountry:
        arrival.address?.country || destinationCountry,
      international,
      distance: Math.round(distance),
      minimumBudget,
      recommendedBudget,
      enteredBudget,
      isLow:
        enteredBudget > 0 && enteredBudget < recommendedBudget,
      transportWarning,
      breakdown: {
        travel,
        hotel,
        localFares,
        food,
        activities,
        other,
      },
    });
  } catch (error) {
    console.error("Worldwide budget estimation error:", error);

    return NextResponse.json(
      {
        error: "Worldwide budget estimation is temporarily unavailable.",
      },
      {
        status: 502,
      },
    );
  }
}
