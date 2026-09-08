"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  assessTripBudget,
  getTransportWarning,
} from "../lib/tripAssessment";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

type TripCurrency = {
  code: string;
  symbol: string;
  locale: string;
  places: string[];
};

const indianCurrency: TripCurrency = {
  code: "INR",
  symbol: "₹",
  locale: "en-IN",
  places: ["india"],
};

const internationalCurrencies: TripCurrency[] =
  [
    {
      code: "GBP",
      symbol: "£",
      locale: "en-GB",
      places: [
        "london",
        "uk",
        "united kingdom",
        "england",
        "manchester",
        "edinburgh",
      ],
    },
    {
      code: "USD",
      symbol: "$",
      locale: "en-US",
      places: [
        "usa",
        "united states",
        "america",
        "new york",
        "los angeles",
        "chicago",
        "miami",
      ],
    },
    {
      code: "EUR",
      symbol: "€",
      locale: "de-DE",
      places: [
        "paris",
        "france",
        "germany",
        "berlin",
        "italy",
        "rome",
        "venice",
        "spain",
        "madrid",
        "barcelona",
        "amsterdam",
        "greece",
        "athens",
        "portugal",
        "lisbon",
      ],
    },
    {
      code: "AED",
      symbol: "د.إ",
      locale: "en-AE",
      places: [
        "dubai",
        "abu dhabi",
        "sharjah",
        "uae",
        "united arab emirates",
      ],
    },
    {
      code: "JPY",
      symbol: "¥",
      locale: "ja-JP",
      places: [
        "japan",
        "tokyo",
        "kyoto",
        "osaka",
      ],
    },
    {
      code: "CNY",
      symbol: "¥",
      locale: "zh-CN",
      places: [
        "china",
        "beijing",
        "shanghai",
      ],
    },
    {
      code: "THB",
      symbol: "฿",
      locale: "th-TH",
      places: [
        "thailand",
        "bangkok",
        "phuket",
        "pattaya",
        "krabi",
      ],
    },
    {
      code: "SGD",
      symbol: "S$",
      locale: "en-SG",
      places: ["singapore", "sentosa"],
    },
    {
      code: "AUD",
      symbol: "A$",
      locale: "en-AU",
      places: [
        "australia",
        "sydney",
        "melbourne",
        "brisbane",
      ],
    },
    {
      code: "CAD",
      symbol: "C$",
      locale: "en-CA",
      places: [
        "canada",
        "toronto",
        "vancouver",
        "montreal",
      ],
    },
    {
      code: "CHF",
      symbol: "CHF",
      locale: "de-CH",
      places: [
        "switzerland",
        "zurich",
        "geneva",
        "interlaken",
      ],
    },
    {
      code: "NPR",
      symbol: "रू",
      locale: "ne-NP",
      places: [
        "nepal",
        "kathmandu",
        "pokhara",
      ],
    },
    {
      code: "LKR",
      symbol: "Rs",
      locale: "en-LK",
      places: [
        "sri lanka",
        "colombo",
        "kandy",
      ],
    },
    {
      code: "IDR",
      symbol: "Rp",
      locale: "id-ID",
      places: [
        "indonesia",
        "bali",
        "jakarta",
        "ubud",
      ],
    },
    {
      code: "MYR",
      symbol: "RM",
      locale: "ms-MY",
      places: [
        "malaysia",
        "kuala lumpur",
        "langkawi",
      ],
    },
    {
      code: "TRY",
      symbol: "₺",
      locale: "tr-TR",
      places: [
        "turkey",
        "turkiye",
        "istanbul",
        "ankara",
      ],
    },
    {
      code: "KRW",
      symbol: "₩",
      locale: "ko-KR",
      places: [
        "south korea",
        "seoul",
        "busan",
      ],
    },
    {
      code: "VND",
      symbol: "₫",
      locale: "vi-VN",
      places: [
        "vietnam",
        "hanoi",
        "ho chi minh",
      ],
    },
    {
      code: "SAR",
      symbol: "﷼",
      locale: "ar-SA",
      places: [
        "saudi arabia",
        "riyadh",
        "jeddah",
        "mecca",
      ],
    },
    {
      code: "QAR",
      symbol: "ر.ق",
      locale: "ar-QA",
      places: ["qatar", "doha"],
    },
  ];

function findTripCurrency(
  location: string,
): TripCurrency {
  const normalized = ` ${location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

  return (
    internationalCurrencies.find(
      (currency) =>
        currency.places.some((place) =>
          normalized.includes(
            ` ${place} `,
          ),
        ),
    ) || indianCurrency
  );
}

function showTripCurrency(
  amount: number,
  currency: TripCurrency,
) {
  return `${currency.symbol} ${amount.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 2,
    },
  )}`;
}

type TimelineEvent = {
  time: string;
  title: string;
  category: "travel" | "stay" | "activity" | "food";
};

type TripExpense = {
  label: string;
  amount: number;
};

type AssistantLanguage =
  | "English"
  | "Hindi"
  | "Punjabi";

export type AppScreen =
  | "planner"
  | "dashboard"
  | "travels"
  | "rooms"
  | "attractions";

type SpokenTripDraft = {
  from?: string;
  destination?: string;
  start?: string;
  end?: string;
  travellers?: string;
  budget?: string;
  travelType?: string;
  transport?: string;
  preferences?: string;
};

type TripDay = {
  day: number;
  title: string;
  place: string;
  summary: string;
  time: string;
  tip: string;
  tips?: string[];
  timeline: TimelineEvent[];
  estimatedCost?: number;
  expenses?: TripExpense[];
  bookingOrigin?: string;
  bookingDestination?: string;
  onwardTransfer?: string;
};

const administrativePlaceNames = new Set([
  "andhra pradesh", "arunachal pradesh", "assam", "bihar",
  "chandigarh", "chhattisgarh", "delhi", "goa", "gujarat",
  "haryana", "himachal pradesh", "india", "jammu and kashmir",
  "jharkhand", "karnataka", "kerala", "ladakh", "madhya pradesh",
  "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland",
  "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
  "telangana", "tripura", "uttar pradesh", "uttarakhand",
  "west bengal",
]);

function normalizedPlaceKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isAdministrativePlace(title: string, category = "") {
  const name = title.trim().toLowerCase();

  return (
    administrativePlaceNames.has(name) ||
    /\b(state|district|region|province|division|territory|municipality|built-up area|country|city|town|village)\b/i.test(
      `${title} ${category}`,
    )
  );
}

function replacePlaceReference(
  value: string,
  oldPlace: string,
  newPlace: string,
) {
  if (!oldPlace || oldPlace === newPlace) return value;
  return value.replaceAll(oldPlace, newPlace);
}

function readItinerarySteps(
  summary: unknown,
  steps: unknown,
) {
  const source = Array.isArray(steps)
    ? steps.map(String)
    : String(summary || "").split(
        /\n|(?=\d+[.)]\s+)/,
      );

  const result: string[] = [];

  source.forEach((value) => {
    const line = String(value)
      .replace(/^\s*\d+[.)]\s*/, "")
      .trim();

    if (!line) return;

    const previousIndex = result.length - 1;
    const previous = result[previousIndex] || "";

    if (/^\d$/.test(line) && /\d{1,2}:$/.test(previous)) {
      result[previousIndex] = `${previous}${line}0`;
      return;
    }

    if (/^\d$/.test(line) && /\d{1,2}:\d$/.test(previous)) {
      result[previousIndex] = `${previous}${line}`;
      return;
    }

    if (line.length > 2) result.push(line);
  });

  return result;
}

const tripDays: TripDay[] = [
  {
    day: 1,
    title: "Arrival & Old Town",
    place: "Mall Road",
    summary:
      "Check in, explore the old town and find a sunset café.",
    time: "09:30",
    tip: "Keep your hotel confirmation and local transport details ready before arrival.",
    timeline: [
      {
        time: "09:30",
        title: "Arrive and check in",
        category: "stay",
      },
      {
        time: "17:30",
        title: "Explore Mall Road",
        category: "activity",
      },
    ],
  },
  {
    day: 2,
    title: "Mountain Adventures",
    place: "Solang Valley",
    summary:
      "Take the ropeway and enjoy a mountain-view lunch.",
    time: "08:00",
    tip: "Leave early and confirm ropeway availability before travelling to Solang Valley.",
    timeline: [
      {
        time: "08:00",
        title: "Travel to Solang Valley",
        category: "travel",
      },
      {
        time: "12:30",
        title: "Mountain-view lunch",
        category: "food",
      },
    ],
  },
  {
    day: 3,
    title: "Snow Pass Escape",
    place: "Rohtang Pass",
    summary:
      "Drive through the pass with scenic stops along the way.",
    time: "07:15",
    tip: "Check road and permit conditions before leaving for the mountain pass.",
    timeline: [
      {
        time: "07:15",
        title: "Depart for Rohtang Pass",
        category: "travel",
      },
      {
        time: "11:00",
        title: "Scenic viewpoint stop",
        category: "activity",
      },
    ],
  },
  {
    day: 4,
    title: "Temples & Cafés",
    place: "Hidimba Temple",
    summary:
      "Discover cedar forests, local markets and riverside cafés.",
    time: "10:00",
    tip: "Wear comfortable shoes and keep respectful clothing for the temple visit.",
    timeline: [
      {
        time: "10:00",
        title: "Visit Hidimba Temple",
        category: "activity",
      },
      {
        time: "16:00",
        title: "Riverside café break",
        category: "food",
      },
    ],
  },
  {
    day: 5,
    title: "Slow Goodbye",
    place: "Vashisht",
    summary:
      "Enjoy a relaxed breakfast and hot springs before departure.",
    time: "09:00",
    tip: "Pack before breakfast and leave enough buffer time for your return journey.",
    timeline: [
      {
        time: "09:00",
        title: "Breakfast and hot springs",
        category: "activity",
      },
      {
        time: "13:00",
        title: "Begin return journey",
        category: "travel",
      },
    ],
  },
];

const attractionPhotos = [
  "photo-1626621341517-bbf3d9990a23",
  "photo-1477587458883-47145ed94245",
  "photo-1501785888041-af3ef285b470",
  "photo-1599661046289-e31897846e41",
  "photo-1512343879784-a960bf40e7f2",
  "photo-1464822759023-fed622ff2c3b",
];
const attractionCatalog: Record<
  string,
  string[]
> = {
  manali: [
    "Solang Valley",
    "Hidimba Devi Temple",
    "Rohtang Pass",
    "Old Manali",
    "Vashisht Hot Springs",
    "Jogini Falls",
  ],
  goa: [
    "Baga Beach",
    "Fort Aguada",
    "Basilica of Bom Jesus",
    "Dudhsagar Falls",
    "Anjuna Beach",
    "Chapora Fort",
  ],
  jaipur: [
    "Amber Fort",
    "Hawa Mahal",
    "City Palace",
    "Jantar Mantar",
    "Nahargarh Fort",
    "Jal Mahal",
  ],
  delhi: [
    "India Gate",
    "Red Fort",
    "Qutub Minar",
    "Humayun’s Tomb",
    "Lotus Temple",
    "Chandni Chowk",
  ],
  agra: [
    "Taj Mahal",
    "Agra Fort",
    "Mehtab Bagh",
    "Fatehpur Sikri",
    "Itimad-ud-Daulah",
    "Akbar’s Tomb",
  ],
  udaipur: [
    "City Palace",
    "Lake Pichola",
    "Jag Mandir",
    "Monsoon Palace",
    "Fateh Sagar Lake",
    "Saheliyon Ki Bari",
  ],
  paris: [
    "Eiffel Tower",
    "Louvre Museum",
    "Montmartre",
    "Arc de Triomphe",
    "Seine River",
    "Notre-Dame Cathedral",
  ],
  shimla: [
    "The Ridge",
    "Jakhu Temple",
    "Mall Road",
    "Kufri",
    "Christ Church",
    "Green Valley",
  ],
};

const destinationScenes = {
  mountain:
    "photo-1519681393784-d120267933ba",
  beach:
    "photo-1507525428034-b723cf961d3e",
  urban:
    "photo-1519501025264-65ba15a82390",
  rural:
    "photo-1500382017468-9049fed747ef",
  heritage:
    "photo-1477587458883-47145ed94245",
  spiritual:
    "photo-1561361058-c24cecae35ca",
  desert:
    "photo-1509316785289-025f5b846b35",
  forest:
    "photo-1448375240586-882707db888b",
  lake: "photo-1476514525535-07fb3b4ae5f1",
};

function destinationScene(
  destination: string,
  places: Array<{
    title: string;
    description: string;
    image?: string;
  }>,
  travelType: string,
) {
  const place = destination.toLowerCase();
  const evidence =
    `${place} ${places.map((item) => `${item.title} ${item.description}`).join(" ")}`.toLowerCase();
  const verifiedImage = places.find(
    (item) => Boolean(item.image),
  )?.image;
  const sceneImage = (fallback: string) =>
    verifiedImage || fallback;
  if (
    /\b(bali|indonesia|goa|gokarna|varkala|kovalam|andaman|nicobar|puducherry|pondicherry|puri|digha|alibaug|lakshadweep|maldives|phuket|krabi|mauritius|seychelles|fiji|hawaii|beach|island|seaside|coast|oceanfront)\b/.test(
      place,
    ) ||
    /\b(beach resort|arabian sea|bay of bengal|coastal town|seaside)\b/.test(
      evidence,
    )
  )
    return {
      type: "Coastal escape",
      image: sceneImage(
        destinationScenes.beach,
      ),
    };
  if (
    /\b(manali|shimla|kullu|kasol|dharamshala|dalhousie|mussoorie|nainital|auli|ladakh|leh|srinagar|gulmarg|pahalgam|spiti|ooty|munnar|darjeeling|gangtok|mountain|hill station|himalaya|valley)\b/.test(
      place,
    ) ||
    /\b(himalayan|hill station|mountain range|snow-capped|mountain resort)\b/.test(
      evidence,
    )
  )
    return {
      type: "Mountain escape",
      image: sceneImage(
        destinationScenes.mountain,
      ),
    };
  if (
    /\b(jaisalmer|bikaner|thar|desert|sand dune)\b/.test(
      place,
    ) ||
    /\b(thar desert|sand dunes)\b/.test(
      evidence,
    )
  )
    return {
      type: "Desert landscapes",
      image: sceneImage(
        destinationScenes.desert,
      ),
    };
  if (
    /\b(vaishno|katra|haridwar|rishikesh|kedarnath|badrinath|amritsar|varanasi|ayodhya|tirupati|shirdi|temple|pilgrimage)\b/.test(
      place,
    ) ||
    travelType.toLowerCase() ===
      "spiritual"
  )
    return {
      type: "Spiritual journey",
      image: sceneImage(
        destinationScenes.spiritual,
      ),
    };
  if (
    /\b(jaipur|agra|udaipur|jodhpur|hampi|orchha|khajuraho|heritage|palace|fort)\b/.test(
      place,
    )
  )
    return {
      type: "Heritage and culture",
      image: sceneImage(
        destinationScenes.heritage,
      ),
    };
  if (
    /\b(delhi|mumbai|bangalore|bengaluru|hyderabad|kolkata|chennai|pune|chandigarh|gurgaon|gurugram|noida|paris|london|dubai|singapore|new york|city|urban|metro)\b/.test(
      place,
    )
  )
    return {
      type: "City exploration",
      image: sceneImage(
        destinationScenes.urban,
      ),
    };
  if (
    /\b(lake|lakeside|backwater|dal lake)\b/.test(
      place,
    ) ||
    /\b(lakeside|backwaters|lake town)\b/.test(
      evidence,
    )
  )
    return {
      type: "Lakeside retreat",
      image: sceneImage(
        destinationScenes.lake,
      ),
    };
  if (
    /\b(forest|jungle|wildlife|corbett|ranthambore|bandhavgarh|kaziranga)\b/.test(
      place,
    ) ||
    /\b(national park|wildlife sanctuary|forest reserve)\b/.test(
      evidence,
    )
  )
    return {
      type: "Nature and wildlife",
      image: sceneImage(
        destinationScenes.forest,
      ),
    };
  return {
    type: "Countryside and local life",
    image: sceneImage(
      destinationScenes.rural,
    ),
  };
}

function Logo() {
  return (
    <div className="logo">
      <span
        className="logoIcon"
        aria-label="TripPilot captain logo"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path
            d="M8.5 12.4c0-4.2 3.1-7 7.5-7s7.5 2.8 7.5 7H8.5z"
            fill="#fff"
          />
          <path
            d="M10 12.8h12l-1.3 2.7H11.3L10 12.8z"
            fill="#ffd45f"
          />
          <circle
            cx="16"
            cy="9.3"
            r="1.6"
            fill="#4666ed"
          />
          <path
            d="M12 16.1h8v2.2a4 4 0 0 1-8 0v-2.2z"
            fill="#fff"
          />
          <path
            d="M4.8 20h7l2 2.8h4.4l2-2.8h7l-3.8 4.3h-6.2l-1.2 1.2h-1.2l-1.2-1.2H8.6L4.8 20z"
            fill="#fff"
          />
        </svg>
      </span>
      <span>
        Trip<span>Pilot</span>
      </span>
    </div>
  );
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function Calendar({
  selectedDate,
  onSelect,
  startDate,
  endDate,
}: {
  selectedDate: string;
  onSelect: (
    date: string,
    itineraryDay: number,
  ) => void;
  startDate: string;
  endDate: string;
}) {
  const start = useMemo(
    () => new Date(`${startDate}T12:00:00`),
    [startDate],
  );
  const end = useMemo(
    () => new Date(`${endDate}T12:00:00`),
    [endDate],
  );
  const [viewMonth, setViewMonth] =
    useState(
      () =>
        new Date(
          start.getFullYear(),
          start.getMonth(),
          1,
        ),
    );

  useEffect(() => {
    setViewMonth(
      new Date(
        start.getFullYear(),
        start.getMonth(),
        1,
      ),
    );
  }, [start]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();
  const mondayOffset =
    (new Date(year, month, 1).getDay() +
      6) %
    7;
  const days = Array.from(
    { length: 42 },
    (_, index) =>
      index - mondayOffset + 1,
  );
  const monthName =
    viewMonth.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

  function isInTrip(date: Date) {
    return date >= start && date <= end;
  }

  function changeMonth(amount: number) {
    setViewMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + amount,
          1,
        ),
    );
  }
  return (
    <div className="calendar">
      <div className="calendarTitle">
        <b>{monthName}</b>
        <div>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>
      <div className="weekNames">
        {[
          "Mo",
          "Tu",
          "We",
          "Th",
          "Fr",
          "Sa",
          "Su",
        ].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendarGrid">
        {days.map((day, index) => {
          const isValidDay =
            day > 0 && day <= daysInMonth;
          const date = new Date(
            year,
            month,
            Math.max(day, 1),
            12,
          );
          const dateValue = isValidDay
            ? toLocalIsoDate(date)
            : "";
          const inTrip =
            isValidDay && isInTrip(date);
          const itineraryDay = inTrip
            ? Math.round(
                (date.getTime() -
                  start.getTime()) /
                  86400000,
              ) + 1
            : 0;

          return (
            <button
              key={`${year}-${month}-${index}`}
              type="button"
              disabled={!isValidDay}
              className={
                dateValue === selectedDate
                  ? "selected"
                  : inTrip
                    ? "range"
                    : ""
              }
              onClick={() => {
                if (inTrip) {
                  onSelect(
                    dateValue,
                    itineraryDay,
                  );
                }
              }}
              aria-label={
                inTrip
                  ? `Open itinerary day ${itineraryDay}`
                  : isValidDay
                    ? date.toLocaleDateString(
                        "en-IN",
                      )
                    : undefined
              }
            >
              {isValidDay ? day : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type WeatherData = {
  location: string;
  temperature: number;
  icon: string;
  condition?: string;
  description?: string;
  forecast: Array<{
    date: string;
    day: string;
    icon: string;
    maximum: number;
    minimum: number;
  }>;
};

function Weather({
  data,
  loading,
  location,
}: {
  data: WeatherData | null;
  loading: boolean;
  location: string;
}) {
  return (
    <div className="weatherCard">
      <div className="weatherTop">
        <span>
          {loading
            ? "⌛"
            : data?.icon || "🌦"}
        </span>
        <div>
          <b>
            {loading
              ? "…"
              : data
                ? `${data.temperature}°`
                : "--°"}
          </b>
          <small>
            {loading
              ? `Checking ${location}...`
              : data?.location ||
                location}
          </small>
        </div>
        <button aria-label="Live destination weather">
          ⋮
        </button>
      </div>
      <div className="forecast">
        {(data?.forecast || [])
          .slice(0, 5)
          .map((day) => (
            <span
              key={day.date}
              title={`${day.minimum}°C to ${day.maximum}°C`}
            >
              <i>{day.icon}</i>
              <b>{day.maximum}°</b>
              <small>{day.day}</small>
            </span>
          ))}
      </div>
    </div>
  );
}

function ZoyaBadge({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <span
      className={`zoyaIcon ${active ? "zoyaPlanning" : ""}`}
    >
      Z
    </span>
  );
}

export function useTripPilot(
  initialScreen: AppScreen,
) {
  const router = useRouter();
  const [screen, setScreen] =
    useState<AppScreen>(initialScreen);
  const [sessionReady, setSessionReady] =
    useState(false);
  const [pendingRoute, setPendingRoute] =
    useState<AppScreen | null>(null);
  const [activeDay, setActiveDay] =
      useState(1),
    [calendarDate, setCalendarDate] =
      useState("2026-09-12");
  const [zoyaOpen, setZoyaOpen] =
      useState(false),
    [authOpen, setAuthOpen] =
      useState(false),
    [signup, setSignup] = useState(false);
  const [loading, setLoading] =
      useState(false),
    [chatValue, setChatValue] =
      useState("");
  const [authNotice, setAuthNotice] =
    useState("");
  const [voiceListening, setVoiceListening] =
    useState(false);
  const [voiceReply, setVoiceReply] =
    useState(false);
  const [voiceNotice, setVoiceNotice] =
    useState("");
  const [
    assistantLanguage,
    setAssistantLanguage,
  ] = useState<AssistantLanguage>(
    "English",
  );
  const [
    awaitingTripDetails,
    setAwaitingTripDetails,
  ] = useState(false);
  const [
    awaitingTripConfirmation,
    setAwaitingTripConfirmation,
  ] = useState(false);
  const [spokenTripDraft, setSpokenTripDraft] =
    useState<SpokenTripDraft>({});
  const [
    zoyaGreetingVisible,
    setZoyaGreetingVisible,
  ] = useState(false);
  const [darkMode, setDarkMode] =
    useState(false);
  const [topSearch, setTopSearch] =
    useState("");
  const [roomLocation, setRoomLocation] =
    useState("Manali");
  const [
      attractionQuery,
      setAttractionQuery,
    ] = useState("Manali"),
    [
      attractionSearch,
      setAttractionSearch,
    ] = useState("Manali");
  const [
    attractionLoading,
    setAttractionLoading,
  ] = useState(false);
  const [
    liveAttractions,
    setLiveAttractions,
  ] = useState<
    Array<{
      title: string;
      description: string;
      image?: string;
      mapsUrl?: string;
      source?: string;
      category?: string;
      lat?: number;
      lon?: number;
    }>
  >([]);
  const [
    attractionError,
    setAttractionError,
  ] = useState("");
  const [aiError, setAiError] =
    useState("");
  const [
    transportWarning,
    setTransportWarning,
  ] = useState("");
  const [
    locationWarning,
    setLocationWarning,
  ] = useState("");
  const [
    budgetWarning,
    setBudgetWarning,
  ] = useState("");
  const [
    budgetStatus,
    setBudgetStatus,
  ] = useState<"" | "suitable" | "low">(
    "",
  );
  const [aiConfigured, setAiConfigured] =
    useState<boolean | null>(null);
  const [preferences, setPreferences] =
    useState(
      "Local food, scenic views and a comfortable pace",
    );
  const [
    generatedDays,
    setGeneratedDays,
  ] = useState(tripDays);
  const [messages, setMessages] =
    useState([
      {
        from: "zoya",
        text: "Hi! I’m Zoya, your AI travel copilot. Where should we go?",
      },
    ]);
  const lastAnnouncedWarning = useRef("");
  const [form, setForm] = useState({
    from: "Ferozepur",
    destination: "Manali",
    start: "2026-09-12",
    end: "2026-09-16",
    travellers: "2",
    budget: "30000",
    travelType: "Adventure",
    transport: "Train",
  });
  const [
    weatherLocation,
    setWeatherLocation,
  ] = useState("Manali");
  const [weatherData, setWeatherData] =
    useState<WeatherData | null>(null);
  const [
    weatherLoading,
    setWeatherLoading,
  ] = useState(true);
  const [exchangeRate, setExchangeRate] =
    useState<number | null>(null);
  const [
    exchangeLoading,
    setExchangeLoading,
  ] = useState(false);
  const [
    exchangeError,
    setExchangeError,
  ] = useState("");

  const routePath: Record<
    AppScreen,
    string
  > = {
    planner: "/",
    dashboard: "/trips",
    travels: "/travels",
    rooms: "/rooms",
    attractions: "/attractions",
  };

  function saveTripSession(
    nextScreen: AppScreen = screen,
  ) {
    window.sessionStorage.setItem(
      "trippilot-session",
      JSON.stringify({
        screen: nextScreen,
        form,
        preferences,
        generatedDays,
        liveAttractions,
        attractionSearch,
        assistantLanguage,
        messages,
        activeDay,
        calendarDate,
        awaitingTripDetails,
        awaitingTripConfirmation,
        spokenTripDraft,
        zoyaOpen,
        roomLocation,
        attractionQuery,
        weatherLocation,
        weatherData,
      }),
    );
  }

  function navigate(
    nextScreen: AppScreen,
  ) {
    setScreen(nextScreen);
    setPendingRoute(nextScreen);
  }

  useEffect(() => {
    try {
      const saved =
        window.sessionStorage.getItem(
          "trippilot-session",
        );

      if (saved) {
        const session = JSON.parse(saved);

        if (session.form)
          setForm(session.form);
        if (session.preferences)
          setPreferences(
            session.preferences,
          );
        if (Array.isArray(session.generatedDays)) {
          const savedDestination = String(
            session.form?.destination || "",
          )
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const savedOrigin = String(
            session.form?.from || "",
          )
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const savedAttractions = Array.isArray(
            session.liveAttractions,
          )
            ? session.liveAttractions
                .filter(
                  (place: any) =>
                    !isAdministrativePlace(
                      String(place?.title || ""),
                      String(place?.category || ""),
                    ),
                )
                .map((place: any) => String(place?.title || "").trim())
                .filter(
                  (place: string) => {
                    const key = normalizedPlaceKey(place);

                    return (
                      Boolean(place) &&
                      ![savedDestination, savedOrigin].includes(key) &&
                      !isAdministrativePlace(place)
                    );
                  },
                )
            : [];
          const usedSavedPlaces = new Set<string>();

          const repairedDays = session.generatedDays.map(
            (day: TripDay, index: number) => {
              const savedPlace = String(day?.place || "").trim();
              const savedPlaceKey = savedPlace
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

              if (index === 0) {
                usedSavedPlaces.add(savedDestination);
                return {
                  ...day,
                  place: session.form?.destination || savedPlace,
                  title: `${session.form?.from || "Starting point"} to ${session.form?.destination || savedPlace} – Arrival and first exploration`,
                };
              }

              const invalidSavedPlace =
                [savedDestination, savedOrigin].includes(savedPlaceKey) ||
                isAdministrativePlace(savedPlace) ||
                usedSavedPlaces.has(savedPlaceKey);
              const replacement = savedAttractions.find((place: string) => {
                const key = place.toLowerCase().replace(/[^a-z0-9]/g, "");
                return !usedSavedPlaces.has(key);
              });
              const correctedPlace = invalidSavedPlace
                ? replacement || savedPlace
                : savedPlace;
              const correctedKey = correctedPlace
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              usedSavedPlaces.add(correctedKey);
              const correctedSummary = replacePlaceReference(
                String(day.summary || ""),
                savedPlace,
                correctedPlace,
              );
              const correctedTips = Array.isArray(day.tips)
                ? day.tips.map((tip) =>
                    replacePlaceReference(
                      String(tip),
                      savedPlace,
                      correctedPlace,
                    ),
                  )
                : day.tips;
              const correctedTimeline = Array.isArray(day.timeline)
                ? day.timeline.map((event) => ({
                    ...event,
                    title: replacePlaceReference(
                      String(event.title),
                      savedPlace,
                      correctedPlace,
                    ),
                  }))
                : day.timeline;
              const finalDay = index === session.generatedDays.length - 1;

              return {
                ...day,
                place: correctedPlace,
                title: finalDay
                  ? `Final exploration at ${correctedPlace}`
                  : `Explore ${correctedPlace}`,
                summary: correctedSummary,
                tip: replacePlaceReference(
                  String(day.tip || ""),
                  savedPlace,
                  correctedPlace,
                ),
                tips: correctedTips,
                timeline: correctedTimeline,
              };
            },
          );

          setGeneratedDays(repairedDays);
        }
        if (Array.isArray(session.liveAttractions))
          setLiveAttractions(
            session.liveAttractions,
          );
        if (session.attractionSearch)
          setAttractionSearch(
            session.attractionSearch,
          );
        if (session.assistantLanguage)
          setAssistantLanguage(
            session.assistantLanguage,
          );
        if (Array.isArray(session.messages))
          setMessages(session.messages);
        if (session.activeDay)
          setActiveDay(session.activeDay);
        if (session.calendarDate)
          setCalendarDate(
            session.calendarDate,
          );
        setAwaitingTripDetails(
          Boolean(
            session.awaitingTripDetails,
          ),
        );
        setAwaitingTripConfirmation(
          Boolean(
            session.awaitingTripConfirmation,
          ),
        );
        if (session.spokenTripDraft)
          setSpokenTripDraft(
            session.spokenTripDraft,
          );
        setZoyaOpen(
          Boolean(session.zoyaOpen),
        );
        if (session.roomLocation)
          setRoomLocation(
            session.roomLocation,
          );
        if (session.attractionQuery)
          setAttractionQuery(
            session.attractionQuery,
          );
        if (session.weatherLocation)
          setWeatherLocation(session.weatherLocation);
        if (session.weatherData) {
          setWeatherData(session.weatherData);
          setWeatherLoading(false);
        }

      }

      const pendingFeaturedAttraction =
        window.sessionStorage.getItem(
          "trippilot-featured-attraction",
        );

      if (
        initialScreen === "attractions" &&
        pendingFeaturedAttraction
      ) {
        setAttractionQuery(pendingFeaturedAttraction);
        setAttractionSearch(pendingFeaturedAttraction);
        window.sessionStorage.removeItem(
          "trippilot-featured-attraction",
        );
        window.setTimeout(() => {
          void loadAttractions(pendingFeaturedAttraction);
        }, 0);
      }
    } catch {
      window.sessionStorage.removeItem(
        "trippilot-session",
      );
    } finally {
      setScreen(initialScreen);
      setSessionReady(true);
    }
  }, [initialScreen]);

  useEffect(() => {
    if (!sessionReady) return;

    saveTripSession();
  }, [
    sessionReady,
    screen,
    form,
    preferences,
    generatedDays,
    liveAttractions,
    attractionSearch,
    assistantLanguage,
    messages,
    activeDay,
    calendarDate,
    awaitingTripDetails,
    awaitingTripConfirmation,
    spokenTripDraft,
    zoyaOpen,
    roomLocation,
    attractionQuery,
    weatherLocation,
    weatherData,
  ]);

  useEffect(() => {
    if (
      !sessionReady ||
      !pendingRoute
    )
      return;

    saveTripSession(pendingRoute);
    const stampToken =
      pendingRoute === "dashboard"
        ? window.sessionStorage.getItem(
            "trippilot-passport-stamp",
          )
        : null;
    const nextPath =
      pendingRoute === "dashboard" && stampToken
        ? `/trips?stamp=${encodeURIComponent(stampToken)}`
        : routePath[pendingRoute];

    router.push(nextPath);
    setPendingRoute(null);
  }, [
    pendingRoute,
    sessionReady,
    router,
  ]);

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem(
        "trippilot-theme",
      );

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const shouldUseDark = savedTheme
      ? savedTheme === "dark"
      : prefersDark;

    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle(
      "tripPilotDark",
      shouldUseDark,
    );
  }, []);

  useEffect(() => {
    let hideTimer:
      | number
      | undefined;

    const greetingTimer =
      window.setInterval(() => {
        if (zoyaOpen) return;

        setZoyaGreetingVisible(true);
        window.clearTimeout(hideTimer);

        hideTimer = window.setTimeout(
          () => {
            setZoyaGreetingVisible(false);
          },
          3000,
        );
      }, 10000);

    return () => {
      window.clearInterval(
        greetingTimer,
      );
      window.clearTimeout(hideTimer);
    };
  }, [zoyaOpen]);

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current;

      window.localStorage.setItem(
        "trippilot-theme",
        next ? "dark" : "light",
      );
      document.documentElement.classList.toggle(
        "tripPilotDark",
        next,
      );

      return next;
    });
  }

 const startingCurrency = useMemo(
  () => findTripCurrency(form.from),
  [form.from],
);

const destinationCurrency = useMemo(
  () => findTripCurrency(
    form.destination,
  ),
  [form.destination],
);

  useEffect(() => {
    if (
      startingCurrency.code ===
      destinationCurrency.code
    ) {
      setExchangeRate(1);
      setExchangeLoading(false);
      setExchangeError("");
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        setExchangeLoading(true);
        setExchangeError("");

        try {
          const response = await fetch(
            `https://open.er-api.com/v6/latest/${startingCurrency.code}`,
            { signal: controller.signal },
          );

          const result =
            await response.json();

          const rate = Number(
            result?.rates?.[
              destinationCurrency.code
            ],
          );

          if (
            !response.ok ||
            !Number.isFinite(rate) ||
            rate <= 0
          ) {
            throw new Error(
              "Currency conversion unavailable.",
            );
          }

          setExchangeRate(rate);
        } catch {
          if (controller.signal.aborted)
            return;

          setExchangeRate(null);
          setExchangeError(
            "Live exchange rate is temporarily unavailable.",
          );
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setExchangeLoading(false);
          }
        }
      },
      350,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    startingCurrency.code,
    destinationCurrency.code,
  ]);

  const destinationBudget =
    useMemo(() => {
      if (
        !exchangeRate ||
        exchangeRate <= 0
      )
        return null;

      return (
        Number(form.budget || 0) *
        exchangeRate
      );
    }, [exchangeRate, form.budget]);

  useEffect(() => {
    fetch(`${API_BASE}/api/zoya`)
      .then((response) => response.json())
      .then((data) =>
        setAiConfigured(
          Boolean(data.configured),
        ),
      )
      .catch(() =>
        setAiConfigured(false),
      );
  }, []);
  useEffect(() => {
    if (!sessionReady) return;

    const destination = form.destination.trim();

    if (!destination) return;

    const timer = window.setTimeout(() => {
      void loadWeather(destination);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form.destination, sessionReady]);

  useEffect(() => {
    const warning =
      locationWarning ||
      budgetWarning ||
      transportWarning ||
      aiError;

    if (!warning) {
      lastAnnouncedWarning.current = "";
      return;
    }

    if (lastAnnouncedWarning.current === warning) {
      return;
    }

    lastAnnouncedWarning.current = warning;
    if (zoyaOpen) {
      setMessages((currentMessages) => {
        const lastMessage =
          currentMessages[currentMessages.length - 1];

        if (
          lastMessage?.from === "zoya" &&
          lastMessage.text === warning
        ) {
          return currentMessages;
        }

        return [
          ...currentMessages,
          {
            from: "zoya",
            text: warning,
          },
        ];
      });
    }

    speakZoya(
      warning,
      languageFromText(warning),
    );
  }, [
    locationWarning,
    budgetWarning,
    transportWarning,
    aiError,
  ]);

  const current = useMemo(
    () =>
      generatedDays[
        Math.min(
          activeDay - 1,
          generatedDays.length - 1,
        )
      ] || generatedDays[0],
    [activeDay, generatedDays],
  );
  const zoyaTips = useMemo(
    () => {
      const styleAdvice: Record<
        string,
        string
      > = {
        Adventure:
          "wear activity-ready shoes, check terrain and weather conditions, and keep recovery time",
        Relaxation:
          "keep generous breaks, avoid rushing between stops, and reserve quiet time",
        Romantic:
          "reserve scenic moments, quieter dining and enough private time",
        Family:
          "keep child-friendly breaks, simple meal options and extra transfer time",
        Friends:
          "set a group meeting point, share booking details and keep everyone’s pace in mind",
        Spiritual:
          "check dress rules, prayer timings and respectful local customs",
      };

      return generatedDays.map((day) => {
        const firstEvent =
          day.timeline?.[0];
        const secondEvent =
          day.timeline?.[1] ||
          firstEvent;
        const firstTitle =
          firstEvent?.title || day.title;
        const secondTitle =
          secondEvent?.title || day.title;
        const firstTime =
          firstEvent?.time ||
          day.time ||
          "09:00";
        const specialRequest =
          preferences.trim() ||
          "your selected preferences";

        const tips =
          assistantLanguage === "Hindi"
            ? [
                `${firstTitle} के लिए सही समय: लगभग ${firstTime} बजे शुरू करें, ताकि दिन ${day.day} आराम से पूरा हो सके।`,
                `${secondTitle} से पहले मौजूदा खुलने का समय, बुकिंग, प्रवेश और मौसम की जानकारी जाँच लें।`,
                `${day.place} में ${day.title} के दौरान अपनी “${specialRequest}” वाली पसंद को प्राथमिकता दें और पर्याप्त स्थानीय यात्रा समय रखें।`,
              ]
            : assistantLanguage ===
                "Punjabi"
              ? [
                  `${firstTitle} ਲਈ ਵਧੀਆ ਸਮਾਂ: ਲਗਭਗ ${firstTime} ਵਜੇ ਸ਼ੁਰੂ ਕਰੋ, ਤਾਂ ਜੋ ਦਿਨ ${day.day} ਆਰਾਮ ਨਾਲ ਪੂਰਾ ਹੋ ਸਕੇ।`,
                  `${secondTitle} ਤੋਂ ਪਹਿਲਾਂ ਮੌਜੂਦਾ ਖੁੱਲ੍ਹਣ ਦਾ ਸਮਾਂ, ਬੁਕਿੰਗ, ਦਾਖਲਾ ਅਤੇ ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ ਜਾਂਚ ਲਵੋ।`,
                  `${day.place} ਵਿੱਚ ${day.title} ਦੌਰਾਨ ਆਪਣੀ “${specialRequest}” ਪਸੰਦ ਨੂੰ ਤਰਜੀਹ ਦਿਓ ਅਤੇ ਸਥਾਨਕ ਯਾਤਰਾ ਲਈ ਵਾਧੂ ਸਮਾਂ ਰੱਖੋ।`,
                ]
              : [
                  `Best time for ${firstTitle}: begin around ${firstTime} so Day ${day.day} stays comfortably paced.`,
                  `Before ${secondTitle}, confirm its current opening, booking, access and weather conditions; live details can change.`,
                  `While completing ${day.title} at ${day.place}, ${styleAdvice[form.travelType] || "keep a comfortable pace and allow extra local-travel time"}. Also prioritise “${specialRequest}”.`,
                ];

        return {
          day: day.day,
          place: day.place,
          tips,
        };
      });
    },
    [
      generatedDays,
      form.travelType,
      preferences,
      assistantLanguage,
    ],
  );

  function selectTripDay(day: number) {
    const safeDay = Math.max(
      1,
      Math.min(day, generatedDays.length),
    );
    const date = new Date(
      `${form.start}T12:00:00`,
    );

    date.setDate(date.getDate() + safeDay - 1);
    setActiveDay(safeDay);
    setCalendarDate(toLocalIsoDate(date));
  }

  const tripDuration = useMemo(() => {
    const start = new Date(
      `${form.start}T12:00:00`,
    );
    const end = new Date(
      `${form.end}T12:00:00`,
    );
    return Math.max(
      1,
      Math.round(
        (end.getTime() - start.getTime()) /
          86400000,
      ) + 1,
    );
  }, [form.start, form.end]);
  const expenses = useMemo(() => {
    let travelAmount = 0;
    let hotelAmount = 0;
    let otherAmount = 0;

    generatedDays.forEach((day) => {
      day.expenses?.forEach((expense) => {
        const label = expense.label.toLowerCase();
        const amount = Number(expense.amount || 0);

        if (/travel|transport|train|flight|bus/.test(label)) {
          travelAmount += amount;
        } else if (/hotel|stay|room/.test(label)) {
          hotelAmount += amount;
        } else {
          otherAmount += amount;
        }
      });
    });

    const total = travelAmount + hotelAmount + otherAmount;

    if (total <= 0) {
      return {
        transport: 0,
        hotel: 0,
        other: 0,
      };
    }

    const transport = Math.round((travelAmount / total) * 100);
    const hotel = Math.round((hotelAmount / total) * 100);

    return {
      transport,
      hotel,
      other: 100 - transport - hotel,
    };
  }, [generatedDays]);
  const tripBudgetBreakdown = useMemo(
    () => {
      const totals: Record<
        string,
        number
      > = {
        Travel: 0,
        Hotel: 0,
        "Local fares": 0,
        Food: 0,
        Activities: 0,
        Other: 0,
      };

      generatedDays.forEach((day) => {
        day.expenses?.forEach((expense) => {
          const label =
            expense.label.toLowerCase();
          const category =
            /hotel|stay|room/.test(label)
              ? "Hotel"
              : /local|taxi|cab|metro|auto/.test(
                    label,
                  )
                ? "Local fares"
                : /travel|transport|train|flight|bus/.test(
                      label,
                    )
                  ? "Travel"
                  : /food|meal|drink/.test(
                        label,
                      )
                    ? "Food"
                    : /activity|attraction|entry|ticket/.test(
                          label,
                        )
                      ? "Activities"
                      : "Other";

          totals[category] += Number(
            expense.amount || 0,
          );
        });
      });

      const icons: Record<string, string> = {
        Travel: "↗",
        Hotel: "⌂",
        "Local fares": "⌁",
        Food: "◉",
        Activities: "✦",
        Other: "＋",
      };

      return Object.entries(totals)
        .map(([label, amount]) => ({
          label,
          amount,
          icon: icons[label],
        }))
        .filter((item) => item.amount > 0);
    },
    [generatedDays],
  );
  const tripEstimatedTotal = useMemo(
    () =>
      tripBudgetBreakdown.reduce(
        (total, item) =>
          total + item.amount,
        0,
      ),
    [tripBudgetBreakdown],
  );
  const routePlaces = useMemo(
    () => {
      const origin = form.from.trim().toLowerCase();
      const destination = form.destination.trim().toLowerCase();

      return generatedDays.map((day) => {
        const place = day.place.trim();
        const normalized = place.toLowerCase();

        if (
          normalized.includes(origin) ||
          normalized.includes(destination)
        ) {
          return place;
        }

        return `${place}, ${form.destination}`;
      });
    },
    [form.from, form.destination, generatedDays],
  );
  const routeMapUrl = useMemo(() => {
    const params = new URLSearchParams({
      api: "1",
      origin: routePlaces[0],
      destination:
        routePlaces[
          routePlaces.length - 1
        ],
      waypoints: routePlaces
        .slice(1, -1)
        .join("|"),
      travelmode: "driving",
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [routePlaces]);
  const mapEmbedUrl = useMemo(() => {
    const selectedPlace =
      generatedDays[activeDay - 1]?.place || form.destination;
    const selectedKey = selectedPlace
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const matchedAttraction = liveAttractions.find(
      (place) =>
        place.title.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        selectedKey,
    );
    const hasCoordinates =
      Number.isFinite(Number(matchedAttraction?.lat)) &&
      Number.isFinite(Number(matchedAttraction?.lon));
    const query = hasCoordinates
      ? `${selectedPlace} @${matchedAttraction?.lat},${matchedAttraction?.lon}`
      : routePlaces[activeDay - 1] || form.destination;

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  }, [
    activeDay,
    form.destination,
    generatedDays,
    liveAttractions,
    routePlaces,
  ]);
  const bookingOrigin =
    generatedDays[0]?.bookingOrigin ||
    form.from;
  const normalizedBookingDestination =
    form.destination
      .trim()
      .toLowerCase();
  const knownRailHub: Record<
    string,
    string
  > = {
    manali: "Chandigarh Railway Station",
    dharamshala: "Pathankot Cantt Railway Station",
    mcleodganj: "Pathankot Cantt Railway Station",
    mussoorie: "Dehradun Railway Station",
    nainital: "Kathgodam Railway Station",
    gangtok: "New Jalpaiguri Railway Station",
    munnar: "Aluva Railway Station",
    coorg: "Mysuru Junction",
  };
  const fallbackBookingDestination =
    form.transport === "Train"
      ? knownRailHub[
          normalizedBookingDestination
        ] || form.destination
      : form.destination;
  const bookingDestination =
    generatedDays[0]?.bookingDestination ||
    fallbackBookingDestination;
  const onwardTransfer =
    generatedDays[0]?.onwardTransfer ||
    (bookingDestination !== form.destination
      ? `${bookingDestination} to ${form.destination} by a practical onward bus or taxi connection.`
      : "");
  const hotelBookingUrl = useMemo(() => {
    const params = new URLSearchParams({
      ss: form.destination,
      checkin: form.start,
      checkout: form.end,
      group_adults: form.travellers,
      group_children: "0",
      no_rooms: "1",
    });
    return `https://www.booking.com/searchresults.html?${params.toString()}`;
  }, [form]);
  const roomBookingUrl = useMemo(() => {
    const params = new URLSearchParams({
      ss:
        roomLocation || form.destination,
      checkin: form.start,
      checkout: form.end,
      group_adults: form.travellers,
      group_children: "0",
      no_rooms: "1",
    });
    return `https://www.booking.com/searchresults.html?${params.toString()}`;
  }, [roomLocation, form]);
  const bookingFlightUrl = useMemo(
    () =>
      `https://www.booking.com/flights/?${new URLSearchParams({ type: "ONEWAY", cabinClass: "ECONOMY", children: "0", adults: form.travellers, from: bookingOrigin, to: bookingDestination, depart: form.start }).toString()}`,
    [
      bookingOrigin,
      bookingDestination,
      form.travellers,
      form.start,
    ],
  );
  const returnFlightUrl = useMemo(
    () =>
      `https://www.booking.com/flights/?${new URLSearchParams({ type: "ONEWAY", cabinClass: "ECONOMY", children: "0", adults: form.travellers, from: bookingDestination, to: bookingOrigin, depart: form.end }).toString()}`,
    [
      bookingOrigin,
      bookingDestination,
      form.travellers,
      form.end,
    ],
  );
  const uberRideUrl = useMemo(() => {
    const params = new URLSearchParams({
      action: "setPickup",
      "pickup[formatted_address]":
        form.from,
      "pickup[nickname]": form.from,
      "dropoff[formatted_address]":
        form.destination,
      "dropoff[nickname]":
        form.destination,
    });
    return `https://m.uber.com/ul/?${params.toString()}`;
  }, [form.from, form.destination]);
  const returnUberRideUrl = useMemo(() => {
    const params = new URLSearchParams({
      action: "setPickup",
      "pickup[formatted_address]":
        form.destination,
      "pickup[nickname]": form.destination,
      "dropoff[formatted_address]":
        form.from,
      "dropoff[nickname]": form.from,
    });
    return `https://m.uber.com/ul/?${params.toString()}`;
  }, [form.from, form.destination]);
  const rapidoRideUrl = useMemo(
    () =>
      `https://www.rapido.bike/?${new URLSearchParams({ pickup: form.from, drop: form.destination, date: form.start }).toString()}`,
    [
      form.from,
      form.destination,
      form.start,
    ],
  );
  const returnRapidoRideUrl = useMemo(
    () =>
      `https://www.rapido.bike/?${new URLSearchParams({ pickup: form.destination, drop: form.from, date: form.end }).toString()}`,
    [form.from, form.destination, form.end],
  );
  const googleAttractionsUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`tourist attractions in ${attractionSearch}`)}`,
    [attractionSearch],
  );
  const busBookingUrl = useMemo(() => {
    const slug = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return `https://www.redbus.in/bus-tickets/${slug(bookingOrigin)}-to-${slug(bookingDestination)}?onward=${encodeURIComponent(form.start)}`;
  }, [
    bookingOrigin,
    bookingDestination,
    form.start,
  ]);
  const returnBusBookingUrl = useMemo(() => {
    const slug = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return `https://www.redbus.in/bus-tickets/${slug(bookingDestination)}-to-${slug(bookingOrigin)}?onward=${encodeURIComponent(form.end)}`;
  }, [bookingOrigin, bookingDestination, form.end]);
  const redRailUrl = useMemo(
    () =>
      `https://www.redbus.in/railways?${new URLSearchParams({ src: bookingOrigin, dst: bookingDestination, doj: form.start }).toString()}`,
    [
      bookingOrigin,
      bookingDestination,
      form.start,
    ],
  );
  const returnRedRailUrl = useMemo(
    () =>
      `https://www.redbus.in/railways?${new URLSearchParams({ src: bookingDestination, dst: bookingOrigin, doj: form.end }).toString()}`,
    [bookingOrigin, bookingDestination, form.end],
  );
  const transportBooking = useMemo(() => {
    if (form.transport === "Train")
      return {
        icon: "🚆",
        provider: "redRail by redBus",
        url: redRailUrl,
        label: "Search trains",
      };
    if (form.transport === "Bus")
      return {
        icon: "🚌",
        provider: "redBus",
        url: busBookingUrl,
        label: "Book bus tickets",
      };
    if (form.transport === "Flight")
      return {
        icon: "✈️",
        provider: "Booking.com",
        url: bookingFlightUrl,
        label: "Book on Booking.com",
      };
    if (form.transport === "Car")
      return {
        icon: "🚘",
        provider: "Uber",
        url: uberRideUrl,
        label: "Book with Uber",
      };
    return {
      icon: "🚕",
      provider: "Uber",
      url: uberRideUrl,
      label: "Book an Uber taxi",
    };
  }, [
    form.transport,
    redRailUrl,
    busBookingUrl,
    bookingFlightUrl,
    uberRideUrl,
  ]);
  const travelOptions = [
    {
      icon: "🚆",
      title: "Train tickets",
      provider: "redRail by redBus",
      note: "Train search with your stations and date",
      href: redRailUrl,
      returnHref: returnRedRailUrl,
      tone: "train",
    },
    {
      icon: "✈️",
      title: "Flights",
      provider: "Booking.com",
      note: "Compare flights with your route details",
      href: bookingFlightUrl,
      returnHref: returnFlightUrl,
      tone: "flight",
    },
    {
      icon: "🚌",
      title: "Bus tickets",
      provider: "redBus",
      note: "Intercity buses with your route selected",
      href: busBookingUrl,
      returnHref: returnBusBookingUrl,
      tone: "bus",
    },
    {
      icon: "🚘",
      title: "Car rentals",
      provider: "Uber",
      note: "Open Uber with your pickup and destination",
      href: uberRideUrl,
      returnHref: returnUberRideUrl,
      tone: "rental",
    },
    {
      icon: "🚕",
      title: "Airport taxis",
      provider: "Uber",
      note: "Airport and city rides with your route",
      href: uberRideUrl,
      returnHref: returnUberRideUrl,
      tone: "taxi",
    },
    {
      icon: "🛵",
      title: "Bikes, autos & cabs",
      provider: "Rapido",
      note: "Open Rapido for local vehicle bookings",
      href: rapidoRideUrl,
      returnHref: returnRapidoRideUrl,
      tone: "rapido",
    },
  ];
  const nearbyAttractions =
    liveAttractions;
  const tripScene = useMemo(
    () =>
      destinationScene(
        form.destination,
        liveAttractions,
        form.travelType,
      ),
    [
      form.destination,
      liveAttractions,
      form.travelType,
    ],
  );
  const tripSceneImage = useMemo(
    () =>
      tripScene.image.startsWith("http")
        ? tripScene.image
        : `https://images.unsplash.com/${tripScene.image}?auto=format&fit=crop&w=1100&q=88`,
    [tripScene.image],
  );
  function buildItinerary() {
    const start = new Date(
        form.start + "T12:00:00",
      ),
      end = new Date(
        form.end + "T12:00:00",
      );
    const count = Math.max(
      1,
      Math.min(
        15,
        Math.round(
          (end.getTime() -
            start.getTime()) /
            86400000,
        ) + 1,
      ),
    );
    const places = attractionCatalog[
      form.destination
        .trim()
        .toLowerCase()
    ] || [
      `${form.destination} city center`,
      `${form.destination} heritage area`,
      `${form.destination} viewpoint`,
      `${form.destination} local market`,
      `${form.destination} nature escape`,
      `${form.destination} cultural district`,
    ];
    return Array.from(
      { length: count },
      (_, index) => {
        const place =
          places[index % places.length];
        const arrival = index === 0,
          departure =
            index === count - 1 &&
            count > 1;
        return {
          day: index + 1,
          time: arrival
            ? "10:00"
            : "08:30",
          place,
          title: arrival
            ? `Arrival & first look at ${form.destination}`
            : departure
              ? `Final discoveries & departure`
              : `Explore ${place}`,
          summary: `Morning: ${arrival ? `arrive from ${form.from}, check in and settle` : `start early at ${place}`}. Afternoon: enjoy a well-paced ${form.travelType.toLowerCase()} experience, local lunch and nearby sights. Evening: sample local food, review the next route and relax. Zoya considered ${preferences.toLowerCase()}, ${showTripCurrency(Number(form.budget), startingCurrency)} total budget${destinationBudget === null ? "" : ` (approximately ${showTripCurrency(destinationBudget, destinationCurrency)})`} and ${form.travellers} travellers.`,
        };
      },
    );
  }
  async function loadWeather(
    location: string,
  ) {
    const cleanLocation = location.trim();
    if (!cleanLocation) return;

    const cacheKey = "trippilot-weather-cache";
    const normalizedLocation = cleanLocation.toLowerCase();

    try {
      const cachedValue = window.sessionStorage.getItem(cacheKey);
      const cached = cachedValue ? JSON.parse(cachedValue) : null;

      if (
        cached?.location?.toLowerCase() === normalizedLocation &&
        cached?.data &&
        Date.now() - Number(cached.savedAt) < 30 * 60 * 1000
      ) {
        setWeatherLocation(cleanLocation);
        setWeatherData(cached.data);
        setWeatherLoading(false);
        return;
      }
    } catch {
      window.sessionStorage.removeItem(cacheKey);
    }

    setWeatherLocation(cleanLocation);
    setWeatherLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/weather?location=${encodeURIComponent(cleanLocation)}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error);
      setWeatherData(data);
      window.sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          location: cleanLocation,
          data,
          savedAt: Date.now(),
        }),
      );
    } catch {
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  }
  async function planTrip(e: FormEvent) {
    e.preventDefault();
    setAiError("");
    setLocationWarning("");
    setBudgetWarning("");
    setTransportWarning("");
    setBudgetStatus("");

    const normalizedStart = form.from
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const normalizedDestination =
      form.destination
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    if (
      normalizedStart &&
      normalizedStart ===
        normalizedDestination
    ) {
      setLocationWarning(
        "Starting location and destination are the same. Please change one of them.",
      );

      window.setTimeout(() => {
        setLocationWarning("");
      }, 10000);

      return;
    }

    let assessment = assessTripBudget(
      form,
      startingCurrency,
      destinationCurrency,
    );

    let worldwideTransportWarning = "";

    if (startingCurrency.code === "INR") {
      try {
        const budgetResponse = await fetch(
          `${API_BASE}/api/trip-budget`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...form,
              transport:
                startingCurrency.code !==
                destinationCurrency.code
                  ? "Flight"
                  : form.transport,
            }),
          },
        );
        const worldwideAssessment =
          await budgetResponse.json();

        if (
          budgetResponse.ok &&
          Number.isFinite(
            worldwideAssessment.recommendedBudget,
          )
        ) {
          assessment = worldwideAssessment;
          worldwideTransportWarning =
            worldwideAssessment.transportWarning || "";
        }
      } catch (error) {
        console.warn(
          "Using local budget estimate:",
          error,
        );
      }
    }

    if (assessment.isLow) {
      setBudgetStatus("low");
      setBudgetWarning(
        `This budget is insufficient. For these exact trip details, Zoya's one-time recommended budget is ${showTripCurrency(assessment.recommendedBudget, startingCurrency)} for all ${form.travellers} travellers. Enter this amount or more to continue.`,
      );
      return;
    }

    const modeWarning =
      worldwideTransportWarning ||
      getTransportWarning(
        form,
        startingCurrency,
        destinationCurrency,
      );

    if (modeWarning) {
      setTransportWarning(modeWarning);
      return;
    }

    setLoading(true);
    void loadWeather(form.destination);
    try {
      const placesResponse = await fetch(
        `${API_BASE}/api/places?location=${encodeURIComponent(form.destination)}`,
      );
      const placesData =
        await placesResponse.json();
      if (
        !placesResponse.ok ||
        !placesData.places?.length
      )
        throw new Error(
          placesData.error ||
            `No verified attractions were found near ${form.destination}. Try a city or landmark name.`,
        );

      const allVerifiedPlaces = placesData.places.filter(
        (place: any) => Boolean(String(place?.title || "").trim()),
      );
      const destinationKey = form.destination
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const originKey = form.from
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const seenVerifiedPlaces = new Set<string>();
      const touristPlaceNames = allVerifiedPlaces
        .filter((place: any) => {
        const title = String(place.title).trim();
        const key = normalizedPlaceKey(title);
        const isAdministrative = isAdministrativePlace(
          title,
          String(place.category || ""),
        );
        const isGeneralLocation =
          key === destinationKey || key === originKey;
        const duplicate = seenVerifiedPlaces.has(key);

        if (!key || isAdministrative || isGeneralLocation || duplicate) {
          return false;
        }

        seenVerifiedPlaces.add(key);
        return true;
      })
        .map((place: any) => String(place.title).trim());
      const verifiedPlaceNames = touristPlaceNames;

      if (verifiedPlaceNames.length < Math.max(0, tripDuration - 1)) {
        throw new Error(
          `Only ${verifiedPlaceNames.length} unique verified tourist attractions were found in ${form.destination}. Try a shorter trip or a more specific destination.`,
        );
      }
      const verifiedPlaceLookup = new Map(
        verifiedPlaceNames.map((place) => [
          place.toLowerCase().replace(/[^a-z0-9]/g, ""),
          place,
        ]),
      );
      const verifiedPlacePool =
        verifiedPlaceNames.length > 0
          ? verifiedPlaceNames
          : [];
      const usedDayPlaceKeys = new Set<string>();

      const aiResponse = await fetch(
        `${API_BASE}/api/zoya`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            mode: "itinerary",
            trip: {
              ...form,
              budget:
                destinationBudget === null
                  ? form.budget
                  : destinationBudget.toFixed(
                      2,
                    ),
              currency:
                destinationCurrency.code,
              currencySymbol:
                destinationCurrency.symbol,
              startingCurrency:
                startingCurrency.code,
              startingCurrencySymbol:
                startingCurrency.symbol,
              startingBudget: Number(
                form.budget,
              ),
              destinationBudget,
              exchangeRate,
            },
            preferences,
            verifiedPlaces: verifiedPlaceNames
              .slice(0, 6)
              .map((name) => ({ name })),
            requirements:
              `Write every user-facing title, summary, tip and timeline event in ${assistantLanguage}. Use only that language throughout the itinerary. Create exactly ${tripDuration} day objects, one for every travel date, maximum 15 days. Use only verifiedPlaces. The selected travel style is ${form.travelType}; make the pace, activities, food and experiences clearly match this style. The user's special request is: "${preferences.trim() || "No additional request"}". Treat this as an important instruction and include it throughout the itinerary whenever realistic and safe. Treat ${form.transport} as the preferred primary transport, not the only allowed transport. Use it for the largest practical part of the route. If it cannot directly reach ${form.destination}, connect through the nearest practical airport, railway station, bus terminal or port and add any required flight, train, bus, ferry, taxi or local transfer. Never reject the trip merely because one transport cannot complete every segment. On Day 1 include bookingOrigin, bookingDestination and onwardTransfer. bookingOrigin must be the practical station, airport or terminal serving ${form.from}. bookingDestination must be the real bookable major station, airport or terminal reached by ${form.transport}. If ${form.destination} has no direct ${form.transport} access, never use the final city as bookingDestination; use the best-known practical nearby hub and explain the remaining connection to ${form.destination} in onwardTransfer and the Day 1 summary. Never invent a station or airport. Clearly explain connections without inventing schedules or service numbers. Every day must include day, time, place, title, summary, tips, timeline, estimatedCost and expenses.Every summary must contain exactly 8 to 10 numbered itinerary steps. Put every step on a separate line using \n. Include morning, afternoon and evening activities, meals, transfers, rest time and practical instructions. Never return the complete day as one short paragraph.Every summary must contain exactly 8 to 10 numbered itinerary steps. Put every step on a separate line using \n. Include morning, afternoon and evening activities, meals, transfers, rest time and practical instructions. Never return the complete day as one short paragraph. tips must be an array of exactly 3 short tips tied to that day's actual activities: the best time for a named activity, specific booking or access advice, and relevant weather, clothing, food or local-transport advice. Every tip must mention an activity or situation unique to its day. Never reuse the same tip template on another day, and changing only the place name does not make a tip unique. timeline must contain 2 to 4 events with time, title and category. category must be travel, stay, activity or food. expenses must contain realistic estimated amounts labelled Travel, Hotel, Local fares, Food, Activities and Other when applicable. estimatedCost must equal the total of that day's expenses for all ${form.travellers} travellers together.Calculate costs for all travellers together. Transport must include the outward and return journeys. Hotel must cover every night and use one room for every two travellers. Food, activities and local fares must be multiplied by the number of travellers and trip days where applicable. Add a 10 percent safety buffer under Other. Never lower costs merely to fit the entered budget. All costs must use ${startingCurrency.code}, the starting-location currency. Do not force estimates to fit the user's budget; return reasonable estimates so TripPilot can warn when the budget is too low.`,
            detailRequirements:
              "Every day summary must contain exactly 10 numbered steps on 10 separate lines. Include approximate journey duration, expected transfer time, morning/afternoon/evening activities, meal timing, rest time and a live-schedule confirmation reminder. Label durations as approximate and never invent a train number, flight number or guaranteed departure time.",
          }),
        },
      );
      const aiData =
        await aiResponse.json();
      if (!aiResponse.ok)
        throw new Error(aiData.error);
      if (!aiData.days?.length)
        throw new Error(
          "Zoya did not return a usable itinerary.",
        );
      let normalizedDays: TripDay[] =
        Array.from(
          {
            length: Math.min(
              tripDuration,
              15,
            ),
          },
          (_, index) => {
            const day =
              aiData.days[index] || {};
            const rawPlace = String(
              day.place || "",
            ).trim();
            const normalizedPlace = rawPlace
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const normalizedDestination = form.destination
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const verifiedRawPlace = verifiedPlaceLookup.get(normalizedPlace);
            const unusedFallback = verifiedPlacePool.find((place) => {
              const key = place.toLowerCase().replace(/[^a-z0-9]/g, "");
              return !usedDayPlaceKeys.has(key);
            });
            const dayPlace =
              index === 0
                ? form.destination
                : verifiedRawPlace &&
                    !usedDayPlaceKeys.has(normalizedPlace)
                  ? verifiedRawPlace
                  : unusedFallback;
            if (!dayPlace) {
              throw new Error(
                `Only ${verifiedPlacePool.length} unique verified tourist places were found near ${form.destination}. Try a shorter trip or search a larger nearby city.`,
              );
            }
            const dayPlaceKey = dayPlace
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            usedDayPlaceKeys.add(dayPlaceKey);
            const rawSummary = String(
              day.summary || "",
            );
            const summary = replacePlaceReference(
              rawSummary,
              rawPlace,
              dayPlace,
            );
            const summarySteps = readItinerarySteps(
              summary,
              day.steps,
            );
            const supportingSteps = [
              `Confirm the live departure time and approximate journey duration for today's route to ${dayPlace}.`,
              "Keep a 30–60 minute transfer buffer and verify the correct platform, terminal or pickup point.",
              "Plan a meal and hydration break around the main travel or sightseeing period.",
              `Check the weather for ${dayPlace} and carry suitable clothing before leaving.`,
              "Keep tickets, identification and booking confirmations available throughout the day.",
              "Use verified local transport for the final connection and confirm the fare before boarding.",
              "Pause for a short rest between the main activities to keep the day comfortable.",
              "Record the day's transport, food and activity spending to keep the trip within budget.",
              "Keep emergency contacts, offline maps and the accommodation address available.",
              "Review the next day's route, weather and bookings before resting for the night.",
            ];
            const includesJourneyTime =
              /duration|journey time|\bminutes?\b|\bhours?\b/i.test(
                summarySteps.join(" "),
              );
            const requiredSummarySteps = includesJourneyTime
              ? summarySteps
              : [supportingSteps[0], ...summarySteps];
            const normalizedSummary = [
              ...requiredSummarySteps,
              ...supportingSteps.slice(1),
            ]
              .slice(0, 10)
              .map((step, stepIndex) =>
                `${stepIndex + 1}. ${step}`,
              )
              .join("\n");
            const usefulSummaryLine =
              summary
                .split(/\n|(?=\d+\.\s)/)
                .map((line) =>
                  line
                    .replace(
                      /^\s*\d+[.)]\s*/,
                      "",
                    )
                    .trim(),
                )
                .find(
                  (line) =>
                    line.length > 18,
                ) ||
              `Follow the planned route for ${day.place || form.destination}.`;
            const practicalTipLine =
              summary
                .split(/\n|(?=\d+\.\s)/)
                .map((line) =>
                  line
                    .replace(
                      /^\s*\d+[.)]\s*/,
                      "",
                    )
                    .trim(),
                )
                .filter(
                  (line) =>
                    line.length > 18,
                )
                .find((line) =>
                  /book|confirm|carry|keep|wear|leave|check|avoid|allow|pack|reserve/i.test(
                    line,
                  ),
                ) || usefulSummaryLine;
            const timeline = Array.isArray(
              day.timeline,
            )
              ? day.timeline
                  .filter(
                    (event: any) =>
                      event?.time &&
                      event?.title,
                  )
                  .slice(0, 4)
                  .map((event: any) => ({
                    time: String(event.time),
                    title: replacePlaceReference(
                      String(event.title),
                      rawPlace,
                      dayPlace,
                    ),
                    category: [
                      "travel",
                      "stay",
                      "activity",
                      "food",
                    ].includes(event.category)
                      ? (event.category as TimelineEvent["category"])
                      : "activity",
                  }))
              : [];
            const expenses: TripExpense[] =
              Array.isArray(day.expenses)
                ? day.expenses
                    .filter(
                      (expense: any) =>
                        expense?.label &&
                        Number.isFinite(
                          Number(
                            expense.amount,
                          ),
                        ) &&
                        Number(
                          expense.amount,
                        ) >= 0,
                    )
                    .slice(0, 6)
                    .map((expense: any) => ({
                      label: String(
                        expense.label,
                      ),
                      amount: Number(
                        expense.amount,
                      ),
                    }))
                : [];
            const expenseTotal =
              expenses.reduce(
                (total, expense) =>
                  total + expense.amount,
                0,
              );
            const estimatedCost =
              expenseTotal > 0
                ? expenseTotal
                : Number.isFinite(
                      Number(
                        day.estimatedCost,
                      ),
                    ) &&
                    Number(
                      day.estimatedCost,
                    ) > 0
                  ? Number(
                      day.estimatedCost,
                    )
                  : 0;
            const aiTips = Array.isArray(
              day.tips,
            )
              ? day.tips
                  .map((tip: any) =>
                    replacePlaceReference(
                      String(tip || "").trim(),
                      rawPlace,
                      dayPlace,
                    ),
                  )
                  .filter(Boolean)
              : [];
            const tips = [
              ...aiTips,
              replacePlaceReference(
                String(day.tip || "").trim(),
                rawPlace,
                dayPlace,
              ),
              practicalTipLine,
              `Best time: Reach ${dayPlace} around ${day.time || "09:00"} for a comfortable visit.`,
              `Confirm current opening hours, entry rules and bookings for ${dayPlace} before leaving.`,
              `Carry water, comfortable footwear and weather-appropriate clothing for Day ${index + 1}.`,
            ]
              .filter(
                (tip, tipIndex, allTips) =>
                  tip.length > 0 &&
                  allTips.indexOf(tip) ===
                    tipIndex,
              )
              .slice(0, 3);

            return {
              day: index + 1,
              title:
                index === 0
                  ? `${form.from} to ${form.destination} – Arrival and first exploration`
                  : index === Math.min(tripDuration, 15) - 1
                    ? `Final exploration at ${dayPlace}`
                    : `Explore ${dayPlace}`,
              place: String(
                dayPlace,
              ),
              summary:
                normalizedSummary ||
                usefulSummaryLine,
              time: String(
                day.time || "09:00",
              ),
              tip: String(
                tips[0] || practicalTipLine,
              ),
              tips,
              timeline:
                timeline.length > 0
                  ? timeline
                  : [
                      {
                        time: String(
                          day.time ||
                            "09:00",
                        ),
                        title:
                          index === 0
                            ? `${form.from} to ${form.destination} – Arrival and first exploration`
                            : `Explore ${dayPlace}`,
                        category:
                          "activity" as const,
                      },
                      {
                        time: "18:00",
                        title: `Complete Day ${index + 1} and review the next plan`,
                        category:
                          "stay" as const,
                      },
                    ],
              estimatedCost,
              expenses,
              bookingOrigin: String(
                day.bookingOrigin || "",
              ),
              bookingDestination: String(
                day.bookingDestination || "",
              ),
              onwardTransfer: String(
                day.onwardTransfer || "",
              ),
            };
          },
        );

      const dayCount = normalizedDays.length;
      const stayDayCount = Math.max(1, dayCount - 1);
      const travelDayCount = dayCount > 1 ? 2 : 1;

      function share(total: number, count: number, position: number) {
        if (total <= 0 || count <= 0 || position < 0 || position >= count) {
          return 0;
        }

        const base = Math.floor(total / count);
        const remainder = Math.round(total - base * count);

        return base + (position < remainder ? 1 : 0);
      }

      normalizedDays = normalizedDays.map((day, index) => {
        const isFirstDay = index === 0;
        const isLastDay = index === dayCount - 1;
        const travelPosition = isFirstDay
          ? 0
          : isLastDay
            ? travelDayCount - 1
            : -1;

        const expenses: TripExpense[] = [
          {
            label: "Travel",
            amount: share(
              assessment.breakdown.travel,
              travelDayCount,
              travelPosition,
            ),
          },
          {
            label: "Hotel",
            amount: isLastDay
              ? 0
              : share(
                  assessment.breakdown.hotel,
                  stayDayCount,
                  index,
                ),
          },
          {
            label: "Local fares",
            amount: share(
              assessment.breakdown.localFares,
              dayCount,
              index,
            ),
          },
          {
            label: "Food",
            amount: share(
              assessment.breakdown.food,
              dayCount,
              index,
            ),
          },
          {
            label: "Activities",
            amount: share(
              assessment.breakdown.activities,
              dayCount,
              index,
            ),
          },
          {
            label: "Other",
            amount: share(
              assessment.breakdown.other,
              dayCount,
              index,
            ),
          },
        ];

        return {
          ...day,
          expenses,
          estimatedCost: expenses.reduce(
            (sum, expense) => sum + expense.amount,
            0,
          ),
        };
      });

      setGeneratedDays(normalizedDays);
      setLiveAttractions(
        placesData.places,
      );
      setAttractionSearch(
        form.destination,
      );
      setActiveDay(1);
      setCalendarDate(form.start);
      window.sessionStorage.setItem(
        "trippilot-passport-stamp",
        String(Date.now()),
      );

      const successMessage =
        assistantLanguage === "Hindi"
          ? "आपकी यात्रा सफलतापूर्वक बन गई है।"
          : assistantLanguage === "Punjabi"
            ? "ਤੁਹਾਡੀ ਯਾਤਰਾ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਈ ਹੈ।"
            : "Your trip has been created successfully.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          from: "zoya",
          text: successMessage,
        },
      ]);

      if (zoyaOpen) {
        speakZoya(
          successMessage,
          assistantLanguage,
        );
      }

      navigate("dashboard");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error: any) {
      setAiError(
        error.message ||
          "Zoya could not create this trip.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function loadAttractions(
    location: string,
  ) {
    setAttractionQuery(location);
    setAttractionSearch(location);
    setAttractionLoading(true);
    setAttractionError("");
    setLiveAttractions([]);
    try {
      const response = await fetch(
        `${API_BASE}/api/places?location=${encodeURIComponent(location)}`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error);
      if (!data.places?.length)
        throw new Error(
          `No verified attraction records were found within 10 km of ${location}. Try a nearby city or landmark.`,
        );
      const imageFirst = [
        ...data.places,
      ].sort(
        (a: any, b: any) =>
          Number(Boolean(b.image)) -
          Number(Boolean(a.image)),
      );
      setLiveAttractions(imageFirst);
    } catch (error: any) {
      setAttractionError(
        error.message ||
          "Verified place search is unavailable.",
      );
    } finally {
      setAttractionLoading(false);
    }
  }
  async function discoverAttractions(
    e: FormEvent,
  ) {
    e.preventDefault();
    await loadAttractions(
      attractionQuery.trim() ||
        form.destination,
    );
  }
  async function searchFromTopBar(
    e: FormEvent,
  ) {
    e.preventDefault();

    const location = topSearch.trim();

    if (!location) return;

    setAttractionQuery(location);
    setAttractionSearch(location);
    window.sessionStorage.setItem(
      "trippilot-featured-attraction",
      location,
    );
    navigate("attractions");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  }
  function openFeaturedDestination(
    destination: string,
  ) {
    setAttractionQuery(destination);
    setAttractionSearch(destination);
    window.sessionStorage.setItem(
      "trippilot-featured-attraction",
      destination,
    );
    navigate("attractions");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    void loadWeather(destination);
    void loadAttractions(destination);
  }
  function languageFromText(
    text: string,
  ): AssistantLanguage {
    const phoneticEnglishWords =
      text.match(
        /आई|वांट|फ्रॉम|टू|विथ|फ्रेंड्स|प्रेफर|मूव|एन्जॉय|सनसेट|बीच|कैन|क्रिएट|व्हाय|आर|यू|गिविंग|एक्सप्लेनेशन|सैड|टॉक|मी|इंग्लिश/gi,
      )?.length || 0;

    if (phoneticEnglishWords >= 2)
      return "English";

    if (
      /व्हाट|वेदर|वेधर|इंग्लिश|अंग्रेज़ी/i.test(
        text,
      )
    )
      return "English";
    if (/[\u0900-\u097F]/.test(text))
      return "Hindi";
    if (
      /\b(mainu|saanu|assi|sadde|naal|hanji)\b/i.test(
        text,
      )
    )
      return "Hindi";
    if (
      /\b(mujhe|humein|humko|jaana|jana|mere|hamara|chahte|haan|kaise|hindi|baat|karo|banao|banaao|kya|tum|hum|se|tak)\b/i.test(
        text,
      )
    )
      return "Hindi";
    if (
      /\b(what|weather|hello|please|can|will|would|create|trip|from|destination|budget|travellers?|change|yes|no)\b/i.test(
        text,
      )
    )
      return "English";
    return /[\u0900-\u097F\u0A00-\u0A7F]/.test(text)
      ? "Hindi"
      : "English";
  }

  function tripQuestion(
    language: AssistantLanguage,
  ) {
    if (language === "Hindi")
      return "कृपया शुरुआत की जगह, मंज़िल, जाने और लौटने की तारीख, यात्रियों की संख्या, बजट, ट्रैवल स्टाइल, पसंदीदा ट्रांसपोर्ट और कोई खास इच्छा बताइए।";
    if (language === "Punjabi")
      return "ਕਿਰਪਾ ਕਰਕੇ ਸ਼ੁਰੂਆਤੀ ਥਾਂ, ਮੰਜ਼ਿਲ, ਜਾਣ ਅਤੇ ਵਾਪਸੀ ਦੀ ਤਾਰੀਖ, ਯਾਤਰੀਆਂ ਦੀ ਗਿਣਤੀ, ਬਜਟ, ਟ੍ਰੈਵਲ ਸਟਾਈਲ, ਪਸੰਦੀਦਾ ਟ੍ਰਾਂਸਪੋਰਟ ਅਤੇ ਕੋਈ ਖਾਸ ਇੱਛਾ ਦੱਸੋ।";
    return "Please tell me your starting place, destination, departure and return dates, number of travellers, budget, travel style, preferred transport and anything special.";
  }

  function confirmationMessage(
    language: AssistantLanguage,
    details: typeof form,
  ) {
    const summary = [
      `${details.from} → ${details.destination}`,
      `${details.start} → ${details.end}`,
      `${details.travellers} travellers`,
      `${details.budget} budget`,
      `${details.travelType} · ${details.transport}`,
    ].join("\n");

    if (language === "Hindi")
      return `मैंने होमपेज का ट्रिप फॉर्म भर दिया है:\n\n${summary}\n\nक्या मैं आपकी यात्रा बनाऊँ? हाँ या नहीं कहें।`;
    if (language === "Punjabi")
      return `ਮੈਂ ਹੋਮਪੇਜ ਦਾ ਟ੍ਰਿਪ ਫਾਰਮ ਭਰ ਦਿੱਤਾ ਹੈ:\n\n${summary}\n\nਕੀ ਮੈਂ ਤੁਹਾਡੀ ਯਾਤਰਾ ਬਣਾਵਾਂ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।`;
    return `I filled the homepage trip form:\n\n${summary}\n\nShall I create your trip? Say yes or no.`;
  }

  function missingDetailsMessage(
    language: AssistantLanguage,
    missing: string[],
  ) {
    const englishLabels: Record<string, string> = {
      "starting place": "starting place",
      destination: "destination",
      "departure date": "departure date",
      "return date": "return date",
      travellers: "number of travellers",
      budget: "budget",
      "travel style": "travel style",
      transport: "preferred transport",
    };
    const hindiLabels: Record<string, string> = {
      "starting place": "शुरुआत की जगह",
      destination: "मंज़िल",
      "departure date": "जाने की तारीख",
      "return date": "लौटने की तारीख",
      travellers: "यात्रियों की संख्या",
      budget: "बजट",
      "travel style": "ट्रैवल स्टाइल",
      transport: "पसंदीदा ट्रांसपोर्ट",
    };
    const punjabiLabels: Record<string, string> = {
      "starting place": "ਸ਼ੁਰੂਆਤੀ ਥਾਂ",
      destination: "ਮੰਜ਼ਿਲ",
      "departure date": "ਜਾਣ ਦੀ ਤਾਰੀਖ",
      "return date": "ਵਾਪਸੀ ਦੀ ਤਾਰੀਖ",
      travellers: "ਯਾਤਰੀਆਂ ਦੀ ਗਿਣਤੀ",
      budget: "ਬਜਟ",
      "travel style": "ਟ੍ਰੈਵਲ ਸਟਾਈਲ",
      transport: "ਪਸੰਦੀਦਾ ਟ੍ਰਾਂਸਪੋਰਟ",
    };
    const labels =
      language === "Hindi"
        ? hindiLabels
        : language === "Punjabi"
          ? punjabiLabels
          : englishLabels;
    const list = missing
      .map((field) => labels[field] || field)
      .join(", ");

    if (language === "Hindi") {
      return `बाकी जानकारी में केवल ${list} चाहिए। कृपया ये जानकारी बताइए।`;
    }

    if (language === "Punjabi") {
      return `ਬਾਕੀ ਜਾਣਕਾਰੀ ਵਿੱਚ ਸਿਰਫ਼ ${list} ਚਾਹੀਦੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਇਹ ਜਾਣਕਾਰੀ ਦੱਸੋ।`;
    }

    return `I only need the remaining details: ${list}.`;
  }

  async function sendZoya(e: FormEvent) {
    e.preventDefault();
    if (!chatValue.trim()) return;
    const question = chatValue.trim();
    const detectedLanguage =
      languageFromText(question);

    setMessages((messages) => [
      ...messages,
      { from: "user", text: question },
    ]);
    setChatValue("");
    setAssistantLanguage(
      detectedLanguage,
    );

    const currentTripDraft: SpokenTripDraft = {
      from: form.from,
      destination: form.destination,
      start: form.start,
      end: form.end,
      travellers: form.travellers,
      budget: form.budget,
      travelType: form.travelType,
      transport: form.transport,
      preferences,
    };

    const asksForHindi =
      /(hindi|हिंदी)[\s\S]{0,30}(baat|बात|speak|talk|बोल)|(baat|बात|speak|talk)[\s\S]{0,30}(hindi|हिंदी)/i.test(
        question,
      );
    const asksForPunjabi =
      /(punjabi|ਪੰਜਾਬੀ)[\s\S]{0,30}(baat|ਗੱਲ|speak|talk|ਬੋਲ)|(baat|ਗੱਲ|speak|talk)[\s\S]{0,30}(punjabi|ਪੰਜਾਬੀ)/i.test(
        question,
      );
    const asksForEnglish =
      /(english|इंग्लिश|अंग्रेज़ी|ਅੰਗਰੇਜ਼ੀ)[\s\S]{0,30}(baat|बात|ਗੱਲ|speak|talk|टॉक)|(baat|बात|ਗੱਲ|speak|talk|टॉक)[\s\S]{0,30}(english|इंग्लिश|अंग्रेज़ी|ਅੰਗਰੇਜ਼ੀ)/i.test(
        question,
      );

    const wantsNewTrip =
      /\b(create|make|build|plan|start)\b[\s\S]{0,40}\b(trip|journey|itinerary)\b/i.test(
        question,
      ) ||
      /\b(trip|journey|itinerary)\b[\s\S]{0,40}\b(create|make|build|plan|start)\b/i.test(
        question,
      ) ||
      /(यात्रा|ट्रिप)[\s\S]{0,40}(बना|बनाओ|बना सकती|योजना)|(बना|बनाओ|बना सकती|योजना)[\s\S]{0,40}(यात्रा|ट्रिप)/i.test(
        question,
      ) ||
      /\btrip\b[\s\S]{0,40}\b(ban|bana|banao|banaao|banaoge|bana sakti|create|plan)\b|\b(ban|bana|banao|banaao|banaoge|bana sakti)\b[\s\S]{0,40}\btrip\b/i.test(
        question,
      );

    if (
      asksForHindi ||
      asksForPunjabi ||
      asksForEnglish
    ) {
      const language: AssistantLanguage =
        asksForHindi
          ? "Hindi"
          : asksForPunjabi
            ? "Punjabi"
            : "English";
      const reply =
        language === "Hindi"
          ? "हाँ, अब मैं आपसे हिंदी में बात करूँगी। बताइए, मैं आपकी कैसे मदद कर सकती हूँ?"
          : language === "Punjabi"
            ? "ਹਾਂ, ਹੁਣ ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਾਂਗੀ। ਦੱਸੋ, ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?"
            : "Sure, I’ll speak with you in English. How can I help?";

      setAssistantLanguage(language);
      setMessages((messages) => [
        ...messages,
        { from: "zoya", text: reply },
      ]);
      if (voiceReply)
        speakZoya(reply, language);
      setVoiceReply(false);
      return;
    }

    const asksToChangeBudget =
      /\b(change|update|set|replace|edit|correct)\b[\s\S]{0,45}\bbudget\b|\bbudget\b[\s\S]{0,45}\b(change|update|set|replace|edit|correct)\b|बजट[\s\S]{0,35}(बदल|कर दो|करें|रखो)|ਬਜਟ[\s\S]{0,35}(ਬਦਲ|ਕਰ ਦਿਓ|ਰੱਖੋ)/i.test(
        question,
      );

    if (asksToChangeBudget) {
      const amounts = question.match(/\d[\d,]*/g) || [];
      const requestedBudget = String(
        amounts[amounts.length - 1] || "",
      ).replace(/,/g, "");
      const budgetNumber = Number(requestedBudget);

      if (Number.isFinite(budgetNumber) && budgetNumber > 0) {
        const wasBudgetBlocked =
          budgetStatus === "low" ||
          Boolean(budgetWarning);
        const nextForm = {
          ...form,
          budget: requestedBudget,
        };

        setForm(nextForm);
        setSpokenTripDraft((draft) => ({
          ...draft,
          budget: requestedBudget,
        }));
        setBudgetWarning("");
        setBudgetStatus("");
        setAiError("");
        navigate("planner");

        const formattedBudget = Number(
          requestedBudget,
        ).toLocaleString("en-IN");
        const changedReply =
          detectedLanguage === "Hindi"
            ? `होमपेज का बजट ${startingCurrency.symbol}${formattedBudget} कर दिया गया है।`
            : detectedLanguage === "Punjabi"
              ? `ਹੋਮਪੇਜ ਦਾ ਬਜਟ ${startingCurrency.symbol}${formattedBudget} ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ।`
              : `Done. I changed the homepage trip budget to ${startingCurrency.symbol}${formattedBudget}.`;
        const reply = wasBudgetBlocked
          ? `${changedReply}\n\n${confirmationMessage(
              detectedLanguage,
              nextForm,
            )}`
          : changedReply;

        if (wasBudgetBlocked) {
          setAwaitingTripDetails(false);
          setAwaitingTripConfirmation(true);
        }

        setMessages((messages) => [
          ...messages,
          {
            from: "zoya",
            text: reply,
          },
        ]);

        if (voiceReply) {
          speakZoya(reply, detectedLanguage);
        }

        setVoiceReply(false);
        return;
      }

      const reply =
        detectedLanguage === "Hindi"
          ? "कृपया नया बजट अंकों में बताइए, जैसे 180000।"
          : detectedLanguage === "Punjabi"
            ? "ਕਿਰਪਾ ਕਰਕੇ ਨਵਾਂ ਬਜਟ ਅੰਕਾਂ ਵਿੱਚ ਦੱਸੋ, ਜਿਵੇਂ 180000।"
            : "Please provide the new budget as a number, for example 180000.";

      setMessages((messages) => [
        ...messages,
        {
          from: "zoya",
          text: reply,
        },
      ]);
      setVoiceReply(false);
      return;
    }

    const asksToBook =
      /\b(book|booking|reserve|reservation|open)\b|बुक|बुकिंग|रिज़र्व|खोल|ਬੁੱਕ|ਬੁਕਿੰਗ|ਰਿਜ਼ਰਵ|ਖੋਲ੍ਹ/i.test(
        question,
      );

    if (asksToBook) {
      const wantsHotel =
        /\b(hotel|room|stay|accommodation)\b|होटल|रूम|कमरा|स्टे|ਹੋਟਲ|ਕਮਰਾ|ਰੂਮ/i.test(
          question,
        );
      const wantsTrain =
        /\b(train|rail|railway)\b|ट्रेन|रेल|ਰੇਲ|ਟ੍ਰੇਨ/i.test(
          question,
        );
      const wantsFlight =
        /\b(flight|plane|air ticket)\b|फ्लाइट|प्लेन|विमान|ਫਲਾਈਟ|ਜਹਾਜ਼/i.test(
          question,
        );
      const wantsBus =
        /\b(bus|coach)\b|बस|ਬੱਸ/i.test(
          question,
        );
      const wantsRapido =
        /\b(rapido|bike|auto)\b|रैपिडो|बाइक|ऑटो|ਰੈਪਿਡੋ|ਬਾਈਕ|ਆਟੋ/i.test(
          question,
        );
      const wantsTaxi =
        /\b(taxi|cab|uber|car rental|rental car)\b|टैक्सी|कैब|उबर|कार रेंटल|ਟੈਕਸੀ|ਕੈਬ|ਉਬਰ/i.test(
          question,
        );
      const wantsAttractions =
        /\b(attraction|attractions|things to do|tourist places?)\b|आकर्षण|घूमने की जगह|पर्यटन स्थल|ਦਰਸ਼ਨੀ ਥਾਂ|ਘੁੰਮਣ ਵਾਲੀ/i.test(
          question,
        );

      let bookingUrl = "";
      let bookingName = "";

      if (wantsHotel) {
        bookingUrl = hotelBookingUrl;
        bookingName = "Booking.com";
      } else if (wantsTrain) {
        bookingUrl = redRailUrl;
        bookingName = "redRail by redBus";
      } else if (wantsFlight) {
        bookingUrl = bookingFlightUrl;
        bookingName = "Booking.com Flights";
      } else if (wantsBus) {
        bookingUrl = busBookingUrl;
        bookingName = "redBus";
      } else if (wantsRapido) {
        bookingUrl = rapidoRideUrl;
        bookingName = "Rapido";
      } else if (wantsTaxi) {
        bookingUrl = uberRideUrl;
        bookingName = "Uber";
      } else if (wantsAttractions) {
        bookingUrl = googleAttractionsUrl;
        bookingName = "Google Maps";
      } else if (
        /\b(transport|travel ticket|ride)\b|ट्रांसपोर्ट|सफर|यात्रा टिकट|ਟਰਾਂਸਪੋਰਟ|ਸਫ਼ਰ/i.test(
          question,
        )
      ) {
        bookingUrl = transportBooking.url;
        bookingName =
          transportBooking.provider;
      }

      if (bookingUrl) {
        const openedWindow = window.open(
          bookingUrl,
          "_blank",
        );
        if (openedWindow) {
          openedWindow.opener = null;
        }
        const bookingRoute =
          wantsHotel || wantsAttractions
            ? form.destination
            : `${bookingOrigin} → ${bookingDestination}`;
        const transferMessage =
          onwardTransfer &&
          !wantsHotel &&
          !wantsAttractions
            ? ` ${onwardTransfer}`
            : "";
        const reply =
          detectedLanguage === "Hindi"
            ? `${bookingName} खोल रही हूँ। बुकिंग रूट: ${bookingRoute}.${transferMessage} तारीखें और यात्रियों की जानकारी भी भेजी गई है। अंतिम जानकारी और कीमत बुकिंग साइट पर जाँच लें।`
            : detectedLanguage === "Punjabi"
              ? `${bookingName} ਖੋਲ੍ਹ ਰਹੀ ਹਾਂ। ਬੁਕਿੰਗ ਰੂਟ: ${bookingRoute}.${transferMessage} ਤਾਰੀਖਾਂ ਅਤੇ ਯਾਤਰੀਆਂ ਦੀ ਜਾਣਕਾਰੀ ਵੀ ਭੇਜੀ ਗਈ ਹੈ। ਅੰਤਿਮ ਜਾਣਕਾਰੀ ਅਤੇ ਕੀਮਤ ਬੁਕਿੰਗ ਸਾਈਟ ਉੱਤੇ ਜਾਂਚੋ।`
              : `Opening ${bookingName} for ${bookingRoute}.${transferMessage} Your dates and traveller details are also included. Please verify the final details and price on the booking site.`;
        const finalReply = openedWindow
          ? reply
          : detectedLanguage === "Hindi"
            ? `${reply} यदि साइट नहीं खुली, तो ब्राउज़र में pop-ups की अनुमति दें।`
            : detectedLanguage === "Punjabi"
              ? `${reply} ਜੇ ਸਾਈਟ ਨਹੀਂ ਖੁੱਲ੍ਹੀ, ਤਾਂ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ pop-ups ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ।`
              : `${reply} If it did not open, allow pop-ups in your browser.`;

        setMessages((messages) => [
          ...messages,
          {
            from: "zoya",
            text: finalReply,
          },
        ]);
        if (voiceReply)
          speakZoya(
            finalReply,
            detectedLanguage,
          );
        setVoiceReply(false);
        return;
      }
    }

    const asksForWeather =
      /\b(weather|temperature|forecast)\b|मौसम|तापमान|वेदर|वेधर|ਮੌਸਮ|ਤਾਪਮਾਨ/i.test(
        question,
      );

    if (asksForWeather) {
      const englishLocation =
        question.match(
          /(?:weather|temperature|forecast)\s+(?:of|in|at|for)\s+([a-z][a-z .'-]*)/i,
        )?.[1];
      const hindiLocation =
        question.match(
          /(?:जोया\s+)?([\u0900-\u097F]+)\s+में[\s\S]*(?:मौसम|तापमान)/i,
        )?.[1] ||
        question.match(
          /(?:ऑफ|इन)\s+([\u0900-\u097F]+)/i,
        )?.[1];
      const punjabiLocation =
        question.match(
          /(?:ਜ਼ੋਇਆ\s+)?([\u0A00-\u0A7F]+)\s+(?:ਦਾ|ਵਿੱਚ)[\s\S]*(?:ਮੌਸਮ|ਤਾਪਮਾਨ)/i,
        )?.[1];
      const requestedLocation = String(
        englishLocation ||
          hindiLocation ||
          punjabiLocation ||
          form.destination,
      )
        .replace(/[?.!,।]+$/g, "")
        .trim();

      try {
        const response = await fetch(
          `${API_BASE}/api/weather?location=${encodeURIComponent(requestedLocation)}`,
          { cache: "no-store" },
        );
        const data: WeatherData & {
          feelsLike?: number;
          humidity?: number;
        } = await response.json();

        if (!response.ok) {
          throw new Error(
            "Weather unavailable",
          );
        }

        const condition =
          data.description ||
          data.condition ||
          "current conditions";
        const reply =
          detectedLanguage === "Hindi"
            ? `${data.location || requestedLocation} में अभी तापमान ${data.temperature}°C है और मौसम ${condition} है।`
            : detectedLanguage === "Punjabi"
              ? `${data.location || requestedLocation} ਵਿੱਚ ਇਸ ਵੇਲੇ ਤਾਪਮਾਨ ${data.temperature}°C ਹੈ ਅਤੇ ਮੌਸਮ ${condition} ਹੈ।`
              : `It is currently ${data.temperature}°C in ${data.location || requestedLocation}, with ${condition}.`;

        setAssistantLanguage(
          detectedLanguage,
        );
        setMessages((messages) => [
          ...messages,
          { from: "zoya", text: reply },
        ]);
        if (voiceReply)
          speakZoya(
            reply,
            detectedLanguage,
          );
        setVoiceReply(false);
        return;
      } catch {
        const reply =
          detectedLanguage === "Hindi"
            ? `${requestedLocation} का मौसम अभी नहीं मिल पाया। कृपया शहर का नाम दोबारा बोलें।`
            : detectedLanguage === "Punjabi"
              ? `${requestedLocation} ਦਾ ਮੌਸਮ ਹੁਣੇ ਨਹੀਂ ਮਿਲ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਸ਼ਹਿਰ ਦਾ ਨਾਮ ਦੁਬਾਰਾ ਬੋਲੋ।`
              : `I could not get the weather for ${requestedLocation}. Please say the city name again.`;
        setMessages((messages) => [
          ...messages,
          { from: "zoya", text: reply },
        ]);
        if (voiceReply)
          speakZoya(
            reply,
            detectedLanguage,
          );
        setVoiceReply(false);
        return;
      }
    }

    const yesAnswer =
      /^(yes|yeah|yep|sure|ok|okay|go ahead|create it|haan|hanji|ji|हाँ|हां|जी|ਹਾਂ|ਹਾਂਜੀ|ਜੀ)(?:[\s,.!।]*(please|ji|प्लीज़|प्लीज|कृपया|जी|बना दो|बनाओ|कर दो|ਕਿਰਪਾ|ਜੀ|ਬਣਾ ਦਿਓ|ਕਰ ਦਿਓ))*[\s,.!।]*$/i.test(
        question,
      ) ||
      /^(कर दो|बना दो|बनाओ|ਬਣਾ ਦਿਓ|ਕਰ ਦਿਓ)[\s,.!।]*$/i.test(
        question,
      );
    const noAnswer =
      /^(no|nope|not yet|nahi|नहीं|ਨਾ|ਨਹੀਂ)[.! ]*$/i.test(
        question,
      );
    const cancelPlanning =
      /^(cancel|stop|leave it|forget it|cancel planning|नहीं रहने दो|रहने दो|कैंसल|बंद करो|योजना रद्द करो)[.! ]*$/i.test(
        question,
      );
    const continuePlanning =
      /^(continue|continue planning|go on|जारी रखो|जारी रखें|आगे बढ़ो|हाँ जारी रखो)[.! ]*$/i.test(
        question,
      );
    const correctionIntent =
      /\b(change|correct|replace|update|instead|not|note)\b|बदलो|बदल|सही|की जगह|नहीं|ਬਦਲੋ|ਸਹੀ|ਦੀ ਥਾਂ/i.test(
        question,
      );
    const tripFieldCommand =
      /\b(starting place|start(?:ing)? from|destination|departure|return|travellers?|travel style|transport|budget|preferences?|anything special)\b|शुरुआत|मंज़िल|जाने की तारीख|लौटने की तारीख|यात्री|बजट|ट्रैवल स्टाइल|ट्रांसपोर्ट/i.test(
        question,
      );

    const tripDetailSignals =
      question.match(
        /\b(from|to|starting|destination|depart|return|budget|traveller|travellers|friend|friends|train|flight|bus|car|taxi|adventure|relaxation|romantic|family|spiritual|se|tak|jaana|jana|dost|bajat|rail|gaddi|mainu|saanu|naal)\b|शुरू|मंज़िल|से|तक|तारीख|बजट|दोस्त|ट्रेन|फ्लाइट|बस|जाना/gi,
      )?.length || 0;
    const looksLikeTripDetails =
      tripDetailSignals >= 2;

    if (
      (awaitingTripDetails || awaitingTripConfirmation) &&
      cancelPlanning
    ) {
      const reply =
        detectedLanguage === "Hindi"
          ? "ठीक है, मैंने पिछली ट्रिप प्लानिंग रद्द कर दी है। अब बताइए, मैं आपकी कैसे मदद कर सकती हूँ?"
          : "Okay, I cancelled the previous trip planning. How else can I help?";

      setAwaitingTripDetails(false);
      setAwaitingTripConfirmation(false);
      setSpokenTripDraft({});
      setMessages((messages) => [
        ...messages,
        { from: "zoya", text: reply },
      ]);
      if (voiceReply) speakZoya(reply, detectedLanguage);
      setVoiceReply(false);
      return;
    }

    if (
      (awaitingTripDetails || awaitingTripConfirmation) &&
      continuePlanning
    ) {
      const reply = awaitingTripConfirmation
        ? confirmationMessage(detectedLanguage, form)
        : tripQuestion(detectedLanguage);

      setMessages((messages) => [
        ...messages,
        { from: "zoya", text: reply },
      ]);
      if (voiceReply) speakZoya(reply, detectedLanguage);
      setVoiceReply(false);
      return;
    }

    if (awaitingTripConfirmation) {
      if (yesAnswer) {
        setVoiceReply(false);
        setAwaitingTripConfirmation(false);
        setSpokenTripDraft(currentTripDraft);

        void planTrip({
          preventDefault: () => {},
        } as FormEvent);
        return;
      }

      if (noAnswer) {
        const reply =
          tripQuestion(detectedLanguage);
        setAwaitingTripConfirmation(false);
        setAwaitingTripDetails(true);
        setMessages((messages) => [
          ...messages,
          { from: "zoya", text: reply },
        ]);
        if (voiceReply)
          speakZoya(
            reply,
            detectedLanguage,
          );
        setVoiceReply(false);
        return;
      }

      if (correctionIntent || looksLikeTripDetails) {
        setAwaitingTripConfirmation(false);
        setAwaitingTripDetails(true);
      }
    }

    if (
      wantsNewTrip &&
      !awaitingTripDetails &&
      !looksLikeTripDetails
    ) {
      const language = detectedLanguage;
      const requiredFields = [
        ["starting place", currentTripDraft.from],
        ["destination", currentTripDraft.destination],
        ["departure date", currentTripDraft.start],
        ["return date", currentTripDraft.end],
        ["travellers", currentTripDraft.travellers],
        ["budget", currentTripDraft.budget],
        ["travel style", currentTripDraft.travelType],
        ["transport", currentTripDraft.transport],
      ];
      const missing = requiredFields
        .filter(([, value]) => !String(value || "").trim())
        .map(([label]) => String(label));
      const reply = missing.length
        ? missingDetailsMessage(language, missing)
        : confirmationMessage(language, form);
      setSpokenTripDraft(currentTripDraft);
      setAssistantLanguage(language);
      setAwaitingTripDetails(missing.length > 0);
      setAwaitingTripConfirmation(missing.length === 0);
      navigate("planner");
      setMessages((messages) => [
        ...messages,
        { from: "zoya", text: reply },
      ]);
      if (voiceReply) speakZoya(reply);
      setVoiceReply(false);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    if (
      awaitingTripDetails ||
      (awaitingTripConfirmation &&
        (correctionIntent || looksLikeTripDetails)) ||
      (wantsNewTrip && looksLikeTripDetails) ||
      (correctionIntent && tripFieldCommand)
    ) {
      try {
        const extractionResponse =
          await fetch(
            `${API_BASE}/api/zoya`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                mode: "extract",
                question: `Extract trip-form details from the latest English, Hindi or Punjabi message. Return place names in English Latin letters even when spoken in Hindi or Punjabi. For a correction, return only the new corrected value, never the old value. Correct obvious speech-recognition spelling only when confident. Interpret "friends with me" as total travellers including the user. Infer Adventure from mountains, trekking or adventure activities and Relaxation from beaches or a peaceful trip. Convert dates to YYYY-MM-DD using year 2026 when omitted. Preferences are optional and must never be listed as missing. Current homepage details: ${JSON.stringify(currentTripDraft)}. Return ONLY compact JSON, no Markdown: {"from":"","destination":"","start":"","end":"","travellers":"","budget":"","travelType":"Adventure|Relaxation|Romantic|Family|Friends|Spiritual","transport":"Train|Flight|Bus|Car|Taxi","preferences":"","language":"English|Hindi|Punjabi","missing":[]}. Latest user speech: ${JSON.stringify(question)}`,
              }),
            },
          );
        const extractionData =
          await extractionResponse.json();
        if (!extractionResponse.ok)
          throw new Error(
            extractionData.error,
          );

        const rawText = String(
          extractionData.text || "",
        );
        const jsonStart =
          rawText.indexOf("{");
        const jsonEnd =
          rawText.lastIndexOf("}");
        if (jsonStart < 0 || jsonEnd < 0)
          throw new Error(
            "Trip details were not understood.",
          );

        const extracted = JSON.parse(
          rawText.slice(
            jsonStart,
            jsonEnd + 1,
          ),
        );
        const language: AssistantLanguage =
          detectedLanguage;
        const inferredTravelType =
          /adventure|एडवेंचर|पहाड़|पहाड़|trek|hiking|ਐਡਵੈਂਚਰ|ਪਹਾੜ/i.test(
            question,
          )
            ? "Adventure"
            : /relax|beach|beaches|आराम|समुद्र|बीच|ਸ਼ਾਂਤ|ਸਮੁੰਦਰ/i.test(
                  question,
                )
              ? "Relaxation"
              : /romantic|romance|रोमांटिक|ਰੋਮਾਂਟਿਕ/i.test(
                    question,
                  )
                ? "Romantic"
                : /family|परिवार|ਪਰਿਵਾਰ/i.test(
                      question,
                    )
                  ? "Family"
                  : /spiritual|धार्मिक|मंदिर|तीर्थ|ਧਾਰਮਿਕ|ਮੰਦਰ/i.test(
                        question,
                      )
                    ? "Spiritual"
                    : /friends?|दोस्त|ਦੋਸਤ/i.test(
                          question,
                        )
                      ? "Friends"
                      : "";
        const inferredTransport =
          /train|rail|ट्रेन|रेल|ਟ੍ਰੇਨ|ਰੇਲ/i.test(
            question,
          )
            ? "Train"
            : /flight|plane|फ्लाइट|विमान|ਫਲਾਈਟ|ਜਹਾਜ਼/i.test(
                  question,
                )
              ? "Flight"
              : /bus|बस|ਬੱਸ/i.test(question)
                ? "Bus"
                : /taxi|टैक्सी|ਟੈਕਸੀ/i.test(
                      question,
                    )
                  ? "Taxi"
                  : /car|कार|ਗੱਡੀ/i.test(question)
                    ? "Car"
                    : "";
        const allowedTravelTypes = [
          "Adventure",
          "Relaxation",
          "Romantic",
          "Family",
          "Friends",
          "Spiritual",
        ];
        const allowedTransports = [
          "Train",
          "Flight",
          "Bus",
          "Car",
          "Taxi",
        ];
        const extractedTravelType =
          allowedTravelTypes.find(
            (value) =>
              value.toLowerCase() ===
              String(
                extracted.travelType || "",
              ).toLowerCase(),
          ) || "";
        const extractedTransport =
          allowedTransports.find(
            (value) =>
              value.toLowerCase() ===
              String(
                extracted.transport || "",
              ).toLowerCase(),
          ) || "";
        const latestDraft: SpokenTripDraft = {
          ...(extracted.from && {
            from: String(extracted.from),
          }),
          ...(extracted.destination && {
            destination: String(
              extracted.destination,
            ),
          }),
          ...(extracted.start && {
            start: String(extracted.start),
          }),
          ...(extracted.end && {
            end: String(extracted.end),
          }),
          ...(extracted.travellers && {
            travellers: String(
              extracted.travellers,
            ),
          }),
          ...(extracted.budget && {
            budget: String(extracted.budget),
          }),
          ...((extractedTravelType ||
            inferredTravelType) && {
            travelType: String(
              extractedTravelType ||
                inferredTravelType,
            ),
          }),
          ...((extractedTransport ||
            inferredTransport) && {
            transport: String(
              extractedTransport ||
                inferredTransport,
            ),
          }),
          ...(extracted.preferences && {
            preferences: String(
              extracted.preferences,
            ),
          }),
        };
        const mergedDraft = {
          ...currentTripDraft,
          ...latestDraft,
        };
        const nextForm = {
          ...form,
          from: mergedDraft.from || form.from,
          destination:
            mergedDraft.destination ||
            form.destination,
          start: mergedDraft.start || form.start,
          end: mergedDraft.end || form.end,
          travellers:
            mergedDraft.travellers ||
            form.travellers,
          budget:
            mergedDraft.budget || form.budget,
          travelType:
            mergedDraft.travelType ||
            form.travelType,
          transport:
            mergedDraft.transport ||
            form.transport,
        };
        const requiredMissing = [
          ["starting place", mergedDraft.from],
          ["destination", mergedDraft.destination],
          ["departure date", mergedDraft.start],
          ["return date", mergedDraft.end],
          ["travellers", mergedDraft.travellers],
          ["budget", mergedDraft.budget],
          ["travel style", mergedDraft.travelType],
          ["transport", mergedDraft.transport],
        ]
          .filter(
            ([, value]) =>
              !String(value || "").trim(),
          )
          .map(([label]) => label);
        const missing = requiredMissing;

        setAssistantLanguage(language);
        setSpokenTripDraft(mergedDraft);
        setForm(nextForm);
        if (mergedDraft.preferences)
          setPreferences(
            mergedDraft.preferences,
          );
        navigate("planner");

        if (missing.length > 0) {
          const reply = missingDetailsMessage(
            language,
            missing,
          );
          setMessages((messages) => [
            ...messages,
            { from: "zoya", text: reply },
          ]);
          if (voiceReply)
            speakZoya(reply, language);
          setVoiceReply(false);
          return;
        }

        const reply =
          confirmationMessage(
            language,
            nextForm,
          );
        setAwaitingTripDetails(false);
        setAwaitingTripConfirmation(true);
        setMessages((messages) => [
          ...messages,
          { from: "zoya", text: reply },
        ]);
        if (voiceReply)
          speakZoya(reply, language);
        setVoiceReply(false);
        return;
      } catch {
        const reply =
          tripQuestion(detectedLanguage);
        setMessages((messages) => [
          ...messages,
          { from: "zoya", text: reply },
        ]);
        if (voiceReply) speakZoya(reply);
        setVoiceReply(false);
        return;
      }
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/zoya`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            mode: "chat",
            question: `Reply only in ${detectedLanguage}. Answer only the user's latest question. Use 1 to 4 short sentences. Never ask for trip details unless the latest message explicitly asks you to create, make, build or plan a trip. Never generate an itinerary inside chat. Latest question: ${question}`,
            trip: form,
          }),
        },
      );
      const data = await response.json();
      let reply = response.ok
        ? data.text
        : data.error;
      const generatedItineraryInChat =
        String(reply || "").length > 500 &&
        /\bday\s*1\b|दिन\s*1|ਦਿਨ\s*1|यात्रा योजना|trip itinerary|approx(?:imate)?\.? cost/i.test(
          String(reply || ""),
        );

      if (generatedItineraryInChat) {
        const language =
          detectedLanguage;
        reply = tripQuestion(language);
        setAssistantLanguage(language);
        setAwaitingTripDetails(true);
        setAwaitingTripConfirmation(false);
        navigate("planner");
      }
      setMessages((messages) => [
        ...messages,
        { from: "zoya", text: reply },
      ]);
      if (voiceReply)
        speakZoya(
          reply,
          detectedLanguage,
        );
      setVoiceReply(false);
    } catch {
      const reply =
        "I could not reach the AI service right now.";
      setMessages((messages) => [
        ...messages,
        { from: "zoya", text: reply },
      ]);
      if (voiceReply) speakZoya(reply);
      setVoiceReply(false);
    }
  }

  function speakZoya(
    text: string,
    language: AssistantLanguage =
      assistantLanguage,
  ) {
    if (!("speechSynthesis" in window))
      return;

    const cleanText = String(text || "")
      .replace(/[*#_|`~]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 900);

    if (!cleanText) return;

    window.speechSynthesis.cancel();

    const requestedLanguage =
      language === "Hindi"
        ? "hi-IN"
        : "en-IN";

    const femaleVoiceNames =
      language === "Hindi"
        ? [
            "swara",
            "kalpana",
            "heera",
            "google हिन्दी",
            "google hindi",
          ]
        : [
            "neerja",
            "aria",
            "jenny",
            "zira",
            "sonia",
            "samantha",
            "google uk english female",
          ];

    const maleVoiceNames = [
      "hemant",
      "madhur",
      "ravi",
      "david",
      "mark",
      "guy",
    ];

    const playSpeech = () => {
      const voices =
        window.speechSynthesis.getVoices();
      const languageCode =
        requestedLanguage.toLowerCase();
      const matchingVoices = voices.filter(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith(
              languageCode.slice(0, 2),
            ),
      );
      const preferredVoice =
        matchingVoices.find((voice) => {
          const name =
            voice.name.toLowerCase();
          return femaleVoiceNames.some(
            (femaleName) =>
              name.includes(femaleName),
          );
        }) ||
        matchingVoices.find((voice) => {
          const name =
            voice.name.toLowerCase();
          return !maleVoiceNames.some(
            (maleName) =>
              name.includes(maleName),
          );
        });

      const speech =
        new SpeechSynthesisUtterance(
          cleanText,
        );

      speech.lang = requestedLanguage;
      if (preferredVoice) {
        speech.voice = preferredVoice;
      }
      speech.rate = 0.94;
      speech.pitch = preferredVoice
        ? 1.08
        : 1.18;
      window.speechSynthesis.speak(
        speech,
      );
    };

    if (
      window.speechSynthesis.getVoices()
        .length
    ) {
      playSpeech();
    } else {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        playSpeech,
        { once: true },
      );
    }
  }

  function startZoyaVoice() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const browserWindow = window as any;
    const SpeechRecognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice(
        "Voice input needs Chrome or Microsoft Edge.",
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      assistantLanguage === "Hindi"
        ? "hi-IN"
        : assistantLanguage === "Punjabi"
          ? "pa-IN"
          : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setVoiceListening(true);
      setVoiceNotice("Listening…");
    };

    recognition.onresult = (event: any) => {
      const spokenText = String(
        event.results?.[0]?.[0]
          ?.transcript || "",
      ).trim();

      if (!spokenText) return;

      setChatValue(spokenText);
      setVoiceReply(true);
      setVoiceNotice("Got it — asking Zoya…");

      window.setTimeout(() => {
        const chatForm =
          document.getElementById(
            "zoyaChatForm",
          ) as HTMLFormElement | null;

        chatForm?.requestSubmit();
      }, 150);
    };

    recognition.onerror = () => {
      setVoiceListening(false);
      setVoiceReply(false);
      setVoiceNotice(
        "I couldn’t hear that. Tap the microphone and try again.",
      );
    };

    recognition.onend = () => {
      setVoiceListening(false);
      window.setTimeout(
        () => setVoiceNotice(""),
        2500,
      );
    };

    recognition.start();
  }

  
  return {
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
  };
}

export type TripPilotController =
  ReturnType<typeof useTripPilot>;

export function TripPilotShell({
  controller,
  children,
}: {
  controller: TripPilotController;
  children: ReactNode;
}) {
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
    <main
      className={`app ${darkMode ? "darkMode" : ""}`}
    >
      <aside className="sidebar">
        <Logo />
        <button
          className="newTrip"
          onClick={() =>
            navigate("planner")
          }
        >
          New trip <span>＋</span>
        </button>
        <nav className="sideNav">
          <button
            className={
              screen === "planner"
                ? "active"
                : ""
            }
            onClick={() =>
              navigate("planner")
            }
          >
            <span>⌂</span> Home
          </button>
          <button
            className={
              screen === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              navigate("dashboard")
            }
          >
            <span>▦</span> All trips
          </button>
          <button
            className={
              screen === "travels"
                ? "active"
                : ""
            }
            onClick={() =>
              navigate("travels")
            }
          >
            <span>✈</span> Travels
          </button>
          <button
            className={
              screen === "rooms"
                ? "active"
                : ""
            }
            onClick={() => {
              setRoomLocation(
                form.destination,
              );
              navigate("rooms");
            }}
          >
            <span>▤</span> Rooms
          </button>
          <button
            className={
              screen === "attractions"
                ? "active"
                : ""
            }
            onClick={() => {
              setAttractionQuery(
                form.destination,
              );
              setAttractionSearch(
                form.destination,
              );
              navigate("attractions");
            }}
          >
            <span>♜</span> Attractions
          </button>
        </nav>
        <div className="sideBottom">
          <Weather
            data={weatherData}
            loading={weatherLoading}
            location={weatherLocation}
          />
          <button className="support">
            <span>◉</span> Support
          </button>
        </div>
      </aside>

      <section className="mainArea">
        <header className="topbar">
          <div className="topLeft">
            <button>
              {screen === "rooms"
                ? "Rooms"
                : screen === "attractions"
                  ? "Attractions"
                  : "Travels"}{" "}
              <span>⌄</span>
            </button>
            <form
              className="search"
              onSubmit={searchFromTopBar}
              role="search"
            >
              <button
                type="submit"
                aria-label="Search destination attractions"
                style={{
                  border: 0,
                  padding: 0,
                  background:
                    "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ⌕
              </button>
              <input
                value={topSearch}
                onChange={(e) =>
                  setTopSearch(
                    e.target.value,
                  )
                }
                placeholder="Search destination"
                aria-label="Search destination"
                style={{
                  width: "150px",
                  border: 0,
                  outline: 0,
                  background:
                    "transparent",
                  color: "#50515c",
                  fontSize: "11px",
                }}
              />
            </form>
          </div>
          <div className="topRight">
            <button
              className="themeToggle"
              onClick={toggleTheme}
              type="button"
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to night mode"
              }
              title={
                darkMode
                  ? "Light mode"
                  : "Night mode"
              }
            >
              <span>
                {darkMode ? "☀️" : "🌙"}
              </span>
              <small>
                {darkMode
                  ? "Light"
                  : "Night"}
              </small>
            </button>
            <button
              className={`aiStatus ${aiConfigured ? "ready" : "needsKey"}`}
              onClick={() =>
                setZoyaOpen(true)
              }
            >
              <i />
              {aiConfigured
                ? "AI ready"
                : "Add AI key"}
            </button>
            <span className="flag">
              🇮🇳
            </span>
            <button className="topIcon notification">
              ♧<i />
            </button>
            <button
              className="account"
              onClick={() =>
                setAuthOpen(true)
              }
            >
              <span>Explorer</span>
              <i>E</i>
            </button>
          </div>
        </header>

        {children}
      </section>

      {zoyaGreetingVisible &&
        !zoyaOpen && (
          <button
            type="button"
            className="zoyaGreetingPopup"
            onClick={() => {
              setZoyaGreetingVisible(
                false,
              );
              setZoyaOpen(true);
            }}
          >
            <ZoyaBadge />
            <span>Hi, Zoya here 👋</span>
          </button>
        )}
      <button
        className="floatingZoya"
        onClick={() => {
          setZoyaGreetingVisible(false);
          setZoyaOpen(!zoyaOpen);
        }}
      >
        <ZoyaBadge active={loading} />
        <span>
          <b>Zoya AI</b>
          <small>Ask me anything</small>
        </span>
      </button>
      {zoyaOpen && (
        <section className="zoyaChat">
          <div className="chatHead">
            <ZoyaBadge />
            <div>
              <b>Zoya</b>
              <small>
                ● Your AI travel copilot
              </small>
            </div>
            <button
              onClick={() =>
                setZoyaOpen(false)
              }
            >
              ×
            </button>
          </div>
          <div className="chatMessages">
            {messages.map((m, i) => (
              <p
                key={i}
                className={m.from}
              >
                {m.text}
              </p>
            ))}
          </div>
          <form
            id="zoyaChatForm"
            onSubmit={sendZoya}
          >
            <input
              value={chatValue}
              onChange={(e) =>
                setChatValue(
                  e.target.value,
                )
              }
              placeholder="Ask Zoya anything..."
            />
            <button
              type="button"
              className={`voiceButton ${voiceListening ? "listening" : ""}`}
              onClick={startZoyaVoice}
              aria-label="Speak to Zoya"
              title="Speak to Zoya"
            >
              {voiceListening ? "●" : "🎙"}
            </button>
            <button
              type="submit"
              aria-label="Send message"
            >
              →
            </button>
          </form>
          {voiceNotice && (
            <small className="voiceNotice">
              {voiceNotice}
            </small>
          )}
        </section>
      )}
      {authOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={() =>
            setAuthOpen(false)
          }
        >
          <section
            className="authModal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="closeModal"
              onClick={() =>
                setAuthOpen(false)
              }
            >
              ×
            </button>
            <Logo />
            <h2>
              {signup
                ? "Create your TripPilot account"
                : "Welcome back to TripPilot"}
            </h2>
            <p>
              Save every journey and let
              Zoya remember your travel
              style.
            </p>
            <button
              className="googleSignIn"
              onClick={() =>
                setAuthNotice(
                  "Google sign-in requires a Google OAuth Client ID and this site must be added as an authorized JavaScript origin.",
                )
              }
            >
              <span>G</span> Continue with
              Google
            </button>
            {authNotice && (
              <p className="authNotice">
                {authNotice}
              </p>
            )}
            <div className="authDivider">
              <i />
              or use your email
              <i />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthOpen(false);
              }}
            >
              {signup && (
                <input
                  placeholder="Full name"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                required
              />
              <input
                type="password"
                placeholder="Password"
                required
              />
              <button>
                {signup
                  ? "Create account"
                  : "Log in"}
              </button>
            </form>
            <small>
              {signup
                ? "Already have an account? "
                : "New to TripPilot? "}
              <button
                onClick={() =>
                  setSignup(!signup)
                }
              >
                {signup
                  ? "Log in"
                  : "Create account"}
              </button>
            </small>
          </section>
        </div>
      )}
    </main>
  );
}

export {
  Calendar,
  ZoyaBadge,
  showTripCurrency,
};
