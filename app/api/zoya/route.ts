import {
  NextRequest,
  NextResponse
} from "next/server";


/* =========================================================
   CHECK WHETHER GROQ IS CONFIGURED
   ========================================================= */

export async function GET() {
  return NextResponse.json({
    configured: Boolean(
      process.env.GROQ_API_KEY
    ),

    provider: "Groq",

    model:
      process.env.GROQ_MODEL ||
      "openai/gpt-oss-120b",

    version: "compact-v2",

    itineraryTokenLimit: 1800
  });
}


/* =========================================================
   CALCULATE TRIP DURATION
   ========================================================= */

function calculateTripDays(
  start: string,
  end: string
) {
  if (!start || !end) {
    return 1;
  }

  const startDate = new Date(
    `${start}T12:00:00`
  );

  const endDate = new Date(
    `${end}T12:00:00`
  );

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||

    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return 1;
  }

  const difference =
    endDate.getTime() -
    startDate.getTime();

  const numberOfDays =
    Math.floor(
      difference / 86400000
    ) + 1;

  return Math.max(
    1,

    Math.min(
      numberOfDays,
      15
    )
  );
}


/* =========================================================
   KEEP ONLY VERIFIED ATTRACTION NAMES
   ========================================================= */

function getPlaceNames(
  places: unknown
) {
  if (
    !Array.isArray(places)
  ) {
    return [];
  }

  return places

    .slice(0, 6)

    .map((place) => {
      if (
        typeof place === "string"
      ) {
        return place.slice(
          0,
          80
        );
      }

      if (
        place &&
        typeof place === "object"
      ) {
        const item = place as {
          title?: string;
          name?: string;
        };

        return String(
          item.title ||
          item.name ||
          ""
        ).slice(
          0,
          80
        );
      }

      return "";
    })

    .filter(Boolean);
}


/* =========================================================
   HANDLE ZOYA REQUESTS
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  const apiKey =
    process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Add GROQ_API_KEY to your .env.local file."
      },

      {
        status: 503
      }
    );
  }

  try {
    const body =
      await request.json();

    const isChat =
      body.mode === "chat";

    const trip =
      body.trip ||
      body.form ||
      {};

    const start = String(
      body.start ||
      trip.start ||
      ""
    );

    const end = String(
      body.end ||
      trip.end ||
      ""
    );

    const tripDays =
      calculateTripDays(
        start,
        end
      );

    const verifiedPlaces =
      getPlaceNames(
        body.verifiedPlaces ||
        body.places ||
        body.attractions ||
        trip.verifiedPlaces ||
        []
      );


    /* =====================================================
       MINIMIZE THE MESSAGE SENT TO GROQ
       ===================================================== */

    const compactInput = {
      message: String(
  body.question ||
  body.message ||
  body.prompt ||
  body.input ||
  ""

      ).slice(
        0,
        1800
      ),

      from: String(
        body.from ||
        trip.from ||
        ""
      ).slice(
        0,
        80
      ),

      destination: String(
        body.destination ||
        trip.destination ||
        ""
      ).slice(
        0,
        80
      ),

      start,

      end,

      tripDays,

      travellers:
        body.travellers ||
        trip.travellers ||
        "",

      budget:
        body.budget ||
        trip.budget ||
        "",

      transport: String(
        body.transport ||
        trip.transport ||
        ""
      ).slice(
        0,
        30
      ),

      travelType: String(
        body.travelType ||
        trip.travelType ||
        ""
      ).slice(
        0,
        30
      ),

      preferences: String(
        body.preferences ||
        trip.preferences ||
        ""
      ).slice(
        0,
        120
      ),

      verifiedPlaces,

      requirements: String(
        body.requirements ||
        ""
      ).slice(
        0,
        2400
      )
    };


    /* =====================================================
       SHORT CHAT INSTRUCTIONS
       ===================================================== */

    const chatInstructions = `
You are Zoya, TripPilot's friendly travel assistant.

Answer only the user's question.

Keep greetings short.

Use clear separate lines when necessary.

Never invent prices, schedules, hotels or attractions.
`;


    /* =====================================================
       SHORT ITINERARY INSTRUCTIONS
       ===================================================== */

    const itineraryInstructions = `
Create an Indian travel itinerary.

Return valid JSON only.

Create exactly ${tripDays} days.

Use only the provided verified attraction names.

For trips up to 5 days:
Write 6 short numbered activities per day.

For trips longer than 5 days:
Write 4 short numbered activities per day.

Keep each activity under 10 words.

Do not invent fares, schedules or opening hours.

Required format:

{
  "days": [
    {
      "day": 1,
      "time": "Morning",
      "place": "Verified attraction",
      "title": "Short day title",
      "summary": "1. First activity\\n2. Second activity"
    }
  ]
}
`;

    const instructions = isChat
      ? chatInstructions
      : `
You are Zoya, TripPilot's practical travel planner.

Return valid JSON only. Do not use Markdown.
Create exactly ${tripDays} different day objects.
Follow compactInput.requirements.
Use only attraction names in compactInput.verifiedPlaces.
Do not invent hotel names, train numbers, schedules,
opening hours, availability or live prices.

Each day must contain:

- A detailed title
- A morning plan
- An afternoon plan
- An evening plan
- 10 to 15 practical itinerary steps
- Meal suggestions
- Local transport guidance
- Estimated daily expenses
- Three useful travel tips

The summary must contain 10 to 15 numbered lines.
Each summary must:

- Contain 8 to 10 numbered steps.
- Put every step on a new line.
- Include morning, afternoon and evening activities.
- Include meals, transfers and rest periods.
- Include practical instructions.
- Never return one short paragraph.
- Never repeat the same activity.
Every line must describe a separate activity or useful instruction.
Do not combine the complete day into one paragraph.

Day 1 must also contain:
- bookingOrigin: practical bookable station,
  airport or terminal serving the starting place
- bookingDestination: actual bookable station,
  airport or terminal reached by the preferred mode
- onwardTransfer: connection from that hub to the
  final destination, or an empty string if unnecessary

If the final destination cannot be reached directly
by the preferred transport, use a real well-known
nearby major hub. Mention that hub and the onward
connection in the Day 1 summary. Never invent a hub.

Timeline event format:
{
  "time": "09:00",
  "title": "Short event",
  "category": "travel"
}

Expense format:
{
  "label": "Food",
  "amount": 1000
}

Return this structure:
{
  "days": []
}
`;

    /* =====================================================
       SEND REQUEST TO GROQ
       ===================================================== */

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",

      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
  model:
    process.env.GROQ_MODEL ||
    "openai/gpt-oss-120b",

  messages: [
    {
      role: "system",

      content:
        instructions
    },

    {
      role: "user",

      content:
        JSON.stringify(
          compactInput
        )
    }
  ],

  temperature: 0.2,

  reasoning_effort: "low",

  max_completion_tokens:
    isChat

      ? 700

      : 4200,

  ...(isChat
    ? {}
    : {
        response_format: {
          type: "json_object"
        }
      })
})
      }
    );

    const data =
      await response.json();


    /* =====================================================
       SHOW GROQ ERRORS
       ===================================================== */

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Groq could not process the request."
        },

        {
          status:
            response.status
        }
      );
    }


    /* =====================================================
       READ ZOYA'S ANSWER
       ===================================================== */

    const responseText =
      data?.choices?.[0]
        ?.message
        ?.content
        ?.trim() || "";

    if (!responseText) {
      return NextResponse.json(
        {
          error:
            "Zoya returned an empty response."
        },

        {
          status: 502
        }
      );
    }

    if (isChat) {
      return NextResponse.json({
        text: responseText
      });
    }


    /* =====================================================
       DETECT AN INCOMPLETE ITINERARY
       ===================================================== */

    const finishReason =
      data?.choices?.[0]
        ?.finish_reason;

    if (
      finishReason === "length"
    ) {
      return NextResponse.json(
        {
          error:
            "The itinerary was too long. Reduce the number of travel days or activities."
        },

        {
          status: 502
        }
      );
    }


    /* =====================================================
       PARSE ITINERARY JSON
       ===================================================== */

    const cleanedResponse =
      responseText

        .replace(
          /^```json\s*/i,
          ""
        )

        .replace(
          /^```\s*/i,
          ""
        )

        .replace(
          /\s*```$/,
          ""
        )

        .trim();

    const jsonStart =
      cleanedResponse.indexOf("{");

    const jsonEnd =
      cleanedResponse.lastIndexOf("}");

    if (
      jsonStart < 0 ||
      jsonEnd < jsonStart
    ) {
      throw new Error(
        "Groq did not return valid itinerary JSON."
      );
    }

    const parsed =
      JSON.parse(
        cleanedResponse.slice(
          jsonStart,
          jsonEnd + 1
        )
      );

    const seenDays =
      new Set<number>();

    const days =
      Array.isArray(
        parsed.days
      )

        ? parsed.days.filter(
            (item: {
              day?: number;
            }) => {
              const day =
                Number(
                  item.day
                );

              if (
                !Number.isFinite(day)
              ) {
                return false;
              }

              if (
                seenDays.has(day)
              ) {
                return false;
              }

              seenDays.add(day);

              return true;
            }
          )

        : [];

    return NextResponse.json({
      days
    });
  } catch (error) {
    console.error(
      "Zoya API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Zoya could not create the itinerary. Please try again."
      },

      {
        status: 502
      }
    );
  }
}
