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

  const domesticTransport: Record<string, number> = {
    Train: 3000,
    Bus: 2400,
    Flight: 12000,
    Car: 4500,
    Taxi: 6500,
  };

  const internationalTransport: Record<string, number> = {
    Train: 32000,
    Bus: 26000,
    Flight: 52000,
    Car: 42000,
    Taxi: 50000,
  };

  const transportPerTraveller = international
    ? internationalTransport[form.transport] || 52000
    : domesticTransport[form.transport] || 4500;

  const transport = transportPerTraveller * travellers;
  const hotelPerRoom = international ? 7000 : 1800;
  const hotel = hotelPerRoom * rooms * nights;
  const food = (international ? 2200 : 600) * travellers * days;
  const localFares = (international ? 1000 : 300) * travellers * days;
  const activities = (international ? 1500 : 400) * travellers * days;
  const subtotal = transport + hotel + food + localFares + activities;
  const minimumBudget = roundBudget(subtotal, startingCurrency.code);
  const recommendedBudget = roundBudget(subtotal * 1.1, startingCurrency.code);
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
