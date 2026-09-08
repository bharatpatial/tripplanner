export type CurrencyInfo = {
  code: string;
  symbol: string;
  locale: string;
};

export type PlannerForm = {
  from: string;
  destination: string;
  start: string;
  end: string;
  travellers: string;
  budget: string;
  travelType: string;
  transport: string;
};

export type BudgetAssessment = {
  minimumBudget: number;
  recommendedBudget: number;
  enteredBudget: number;
  isLow: boolean;
  breakdown: {
    travel: number;
    hotel: number;
    localFares: number;
    food: number;
    activities: number;
    other: number;
  };
};

function tripDays(start: string, end: string) {
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const difference = last.getTime() - first.getTime();

  if (!Number.isFinite(difference) || difference < 0) {
    return 1;
  }

  return Math.min(15, Math.max(1, Math.floor(difference / 86400000) + 1));
}

function roundBudget(amount: number, currencyCode: string) {
  const step = currencyCode === "INR" ? 500 : 10;
  return Math.ceil(amount / step) * step;
}

const indianCityCoordinates: Record<string, [number, number]> = {
  ahmedabad: [23.02, 72.57],
  amritsar: [31.63, 74.87],
  bangalore: [12.97, 77.59],
  bengaluru: [12.97, 77.59],
  chandigarh: [30.73, 76.78],
  chennai: [13.08, 80.27],
  delhi: [28.61, 77.21],
  ferozepur: [30.93, 74.62],
  firozpur: [30.93, 74.62],
  goa: [15.30, 74.12],
  hyderabad: [17.39, 78.49],
  jaipur: [26.91, 75.79],
  kolkata: [22.57, 88.36],
  lucknow: [26.85, 80.95],
  manali: [32.24, 77.19],
  mumbai: [19.08, 72.88],
  pune: [18.52, 73.86],
};

function cityCoordinates(location: string) {
  const value = location.toLowerCase();
  const city = Object.keys(indianCityCoordinates).find((name) =>
    value.includes(name),
  );

  return city ? indianCityCoordinates[city] : null;
}

function domesticDistance(from: string, destination: string) {
  const start = cityCoordinates(from);
  const end = cityCoordinates(destination);

  if (!start || !end) return 900;

  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitude = radians(end[0] - start[0]);
  const longitude = radians(end[1] - start[1]);
  const calculation =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(radians(start[0])) *
      Math.cos(radians(end[0])) *
      Math.sin(longitude / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
}

type InternationalCostProfile = {
  flightPerTraveller: number;
  hotelPerRoomNight: number;
  foodPerTravellerDay: number;
  localFaresPerTravellerDay: number;
  activitiesPerTravellerDay: number;
  visaInsurancePerTraveller: number;
};

function internationalCostProfile(
  destination: string,
  currencyCode: string,
): InternationalCostProfile {
  const place = destination.toLowerCase();

  if (/bali|indonesia|ubud|jakarta/.test(place)) {
    return {
      flightPerTraveller: 32000,
      hotelPerRoomNight: 4000,
      foodPerTravellerDay: 1500,
      localFaresPerTravellerDay: 700,
      activitiesPerTravellerDay: 1200,
      visaInsurancePerTraveller: 4000,
    };
  }

  if (/london|england|united kingdom|\buk\b/.test(place)) {
    return {
      flightPerTraveller: 60000,
      hotelPerRoomNight: 11000,
      foodPerTravellerDay: 3200,
      localFaresPerTravellerDay: 1800,
      activitiesPerTravellerDay: 2000,
      visaInsurancePerTraveller: 15000,
    };
  }

  const profilesByCurrency: Record<string, InternationalCostProfile> = {
    NPR: { flightPerTraveller: 18000, hotelPerRoomNight: 3500, foodPerTravellerDay: 1200, localFaresPerTravellerDay: 600, activitiesPerTravellerDay: 900, visaInsurancePerTraveller: 2000 },
    LKR: { flightPerTraveller: 26000, hotelPerRoomNight: 4500, foodPerTravellerDay: 1500, localFaresPerTravellerDay: 700, activitiesPerTravellerDay: 1100, visaInsurancePerTraveller: 3500 },
    THB: { flightPerTraveller: 30000, hotelPerRoomNight: 4500, foodPerTravellerDay: 1600, localFaresPerTravellerDay: 800, activitiesPerTravellerDay: 1400, visaInsurancePerTraveller: 4000 },
    MYR: { flightPerTraveller: 28000, hotelPerRoomNight: 4500, foodPerTravellerDay: 1600, localFaresPerTravellerDay: 800, activitiesPerTravellerDay: 1300, visaInsurancePerTraveller: 4000 },
    VND: { flightPerTraveller: 33000, hotelPerRoomNight: 4000, foodPerTravellerDay: 1400, localFaresPerTravellerDay: 650, activitiesPerTravellerDay: 1200, visaInsurancePerTraveller: 4500 },
    AED: { flightPerTraveller: 28000, hotelPerRoomNight: 7000, foodPerTravellerDay: 2200, localFaresPerTravellerDay: 1200, activitiesPerTravellerDay: 1800, visaInsurancePerTraveller: 6500 },
    SGD: { flightPerTraveller: 35000, hotelPerRoomNight: 9000, foodPerTravellerDay: 2500, localFaresPerTravellerDay: 1200, activitiesPerTravellerDay: 2000, visaInsurancePerTraveller: 4500 },
    EUR: { flightPerTraveller: 55000, hotelPerRoomNight: 9000, foodPerTravellerDay: 2800, localFaresPerTravellerDay: 1500, activitiesPerTravellerDay: 1900, visaInsurancePerTraveller: 12000 },
    CHF: { flightPerTraveller: 58000, hotelPerRoomNight: 12000, foodPerTravellerDay: 3800, localFaresPerTravellerDay: 2200, activitiesPerTravellerDay: 2400, visaInsurancePerTraveller: 12000 },
    USD: { flightPerTraveller: 70000, hotelPerRoomNight: 10500, foodPerTravellerDay: 3200, localFaresPerTravellerDay: 1800, activitiesPerTravellerDay: 2200, visaInsurancePerTraveller: 15000 },
    AUD: { flightPerTraveller: 70000, hotelPerRoomNight: 9500, foodPerTravellerDay: 3000, localFaresPerTravellerDay: 1700, activitiesPerTravellerDay: 2100, visaInsurancePerTraveller: 14000 },
    CAD: { flightPerTraveller: 75000, hotelPerRoomNight: 9500, foodPerTravellerDay: 3000, localFaresPerTravellerDay: 1700, activitiesPerTravellerDay: 2100, visaInsurancePerTraveller: 15000 },
    JPY: { flightPerTraveller: 48000, hotelPerRoomNight: 7500, foodPerTravellerDay: 2200, localFaresPerTravellerDay: 1400, activitiesPerTravellerDay: 1700, visaInsurancePerTraveller: 5000 },
  };

  return profilesByCurrency[currencyCode] || {
    flightPerTraveller: 50000,
    hotelPerRoomNight: 7500,
    foodPerTravellerDay: 2400,
    localFaresPerTravellerDay: 1200,
    activitiesPerTravellerDay: 1700,
    visaInsurancePerTraveller: 8000,
  };
}

export function assessTripBudget(
  form: PlannerForm,
  startingCurrency: CurrencyInfo,
  destinationCurrency: CurrencyInfo,
): BudgetAssessment {
  const days = tripDays(form.start, form.end);
  const nights = Math.max(0, days - 1);
  const travellers = Math.max(1, Number(form.travellers) || 1);
  const rooms = Math.max(1, Math.ceil(travellers / 2));
  const international = startingCurrency.code !== destinationCurrency.code;
  const distance = domesticDistance(form.from, form.destination);
  const distanceBand = distance > 1500 ? "long" : distance > 600 ? "medium" : "short";

  const domesticTransport: Record<string, Record<string, number>> = {
    Train: { short: 2200, medium: 3800, long: 5500 },
    Bus: { short: 2000, medium: 3600, long: 5200 },
    Flight: { short: 9000, medium: 13000, long: 17000 },
    Car: { short: 4500, medium: 7500, long: 12000 },
    Taxi: { short: 6500, medium: 11000, long: 18000 },
  };

  const internationalProfile = internationalCostProfile(
    form.destination,
    destinationCurrency.code,
  );

  const transportPerTraveller = international
    ? internationalProfile.flightPerTraveller
    : domesticTransport[form.transport]?.[distanceBand] || 4500;

  const transport = transportPerTraveller * travellers;
  const hotelPerRoom = international
    ? internationalProfile.hotelPerRoomNight
    : 2500;
  const hotel = hotelPerRoom * rooms * nights;
  const foodPerDay = international
    ? internationalProfile.foodPerTravellerDay
    : 1000;
  const localFaresPerDay = international
    ? internationalProfile.localFaresPerTravellerDay
    : 500;
  const activitiesPerDay = international
    ? internationalProfile.activitiesPerTravellerDay
    : 600;
  const food = foodPerDay * travellers * days;
  const localFares = localFaresPerDay * travellers * days;
  const activities = activitiesPerDay * travellers * days;
  const visaInsurance = international
    ? internationalProfile.visaInsurancePerTraveller * travellers
    : 0;
  const coreSubtotal = transport + hotel + food + localFares + activities;
  const minimumBudget = roundBudget(
    coreSubtotal + visaInsurance,
    startingCurrency.code,
  );
  const recommendedBudget = roundBudget(
    (coreSubtotal + visaInsurance) * 1.15,
    startingCurrency.code,
  );
  const other = Math.max(0, recommendedBudget - coreSubtotal);
  const enteredBudget = Math.max(0, Number(form.budget) || 0);

  return {
    minimumBudget,
    recommendedBudget,
    enteredBudget,
    isLow: enteredBudget > 0 && enteredBudget < recommendedBudget,
    breakdown: {
      travel: transport,
      hotel,
      localFares,
      food,
      activities,
      other,
    },
  };
}

export function getTransportWarning(
  form: PlannerForm,
  startingCurrency: CurrencyInfo,
  destinationCurrency: CurrencyInfo,
) {
  const international = startingCurrency.code !== destinationCurrency.code;

  if (international && form.transport !== "Flight") {
    return `This trip cannot realistically be completed from ${form.from} to ${form.destination} using ${form.transport} as the main transport. Please select Flight, which is the most practical and convenient option for this international journey.`;
  }

  return "";
}
