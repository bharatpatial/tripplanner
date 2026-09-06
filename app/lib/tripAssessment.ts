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

  const internationalTransport: Record<string, number> = {
    Train: 65000,
    Bus: 60000,
    Flight: 75000,
    Car: 90000,
    Taxi: 110000,
  };

  const transportPerTraveller = international
    ? internationalTransport[form.transport] || 75000
    : domesticTransport[form.transport]?.[distanceBand] || 4500;

  const transport = transportPerTraveller * travellers;
  const hotelPerRoom = international ? 10000 : 2500;
  const hotel = hotelPerRoom * rooms * nights;
  const food = (international ? 3500 : 1000) * travellers * days;
  const localFares = (international ? 1800 : 500) * travellers * days;
  const activities = (international ? 2500 : 600) * travellers * days;
  const subtotal = transport + hotel + food + localFares + activities;
  const minimumBudget = roundBudget(subtotal, startingCurrency.code);
  const recommendedBudget = roundBudget(subtotal * 1.15, startingCurrency.code);
  const other = Math.max(0, recommendedBudget - subtotal);
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
