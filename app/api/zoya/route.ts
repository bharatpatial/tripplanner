import {
  NextRequest,
  NextResponse,
} from "next/server";

function calculateTripDays(start: string, end: string) {
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);

  if (
    Number.isNaN(first.getTime()) ||
    Number.isNaN(last.getTime())
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.min(
      Math.floor(
        (last.getTime() - first.getTime()) / 86400000,
      ) + 1,
      15,
    ),
  );
}

function getPlaceNames(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((place) => {
      if (typeof place === "string") return place;

      if (place && typeof place === "object") {
        const item = place as {
          title?: string;
          name?: string;
        };

        return item.title || item.name || "";
      }

      return "";
    })
    .map((place) => String(place).trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, 15);
}

function normalizeSteps(day: any) {
  const source = Array.isArray(day.steps)
    ? day.steps
    : String(day.summary || "").split(
        /\n|(?=\d+[.)]\s+)/,
      );

  const result: string[] = [];

  source.forEach((value: unknown) => {
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

  return result.slice(0, 10);
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.GROQ_API_KEY),
    provider: "Groq",
    model:
      process.env.GROQ_MODEL ||
      "openai/gpt-oss-120b",
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Add GROQ_API_KEY to .env.local.",
      },
      {
        status: 503,
      },
    );
  }

  try {
    const body = await request.json();
    const isChat = body.mode === "chat";
    const isExtraction = body.mode === "extract";
    const trip = body.trip || body.form || {};
    const start = String(body.start || trip.start || "");
    const end = String(body.end || trip.end || "");
    const tripDays = calculateTripDays(start, end);
    const verifiedPlaces = getPlaceNames(
      body.verifiedPlaces ||
        body.places ||
        body.attractions ||
        trip.verifiedPlaces ||
        [],
    );

    const input = {
      message: String(
        body.question ||
          body.message ||
          body.prompt ||
          body.input ||
          "",
      ).slice(0, 1600),
      from: String(body.from || trip.from || "").slice(0, 80),
      destination: String(
        body.destination || trip.destination || "",
      ).slice(0, 80),
      start,
      end,
      tripDays,
      travellers: body.travellers || trip.travellers || "",
      budget: body.budget || trip.budget || "",
      transport: String(
        body.transport || trip.transport || "",
      ).slice(0, 30),
      travelType: String(
        body.travelType || trip.travelType || "",
      ).slice(0, 30),
      preferences: String(
        body.preferences || trip.preferences || "",
      ).slice(0, 300),
      language: String(body.language || "English"),
      verifiedPlaces,
    };

    const chatInstructions = `
You are Zoya, TripPilot's friendly travel copilot.
Answer only the latest question.
Reply in the same language as the user: English or Hindi.
Keep greetings and normal replies short.
Ask for trip details only when the user explicitly asks to plan a trip.
Never invent current prices, schedules, availability or weather.
`;

    const itineraryInstructions = `
You are Zoya, TripPilot's practical travel planner.
Return one valid JSON object only. Do not use Markdown.

Create exactly ${tripDays} day objects.
Every day must focus on a different verified place.
Day 1 must use the final destination and explain arrival.
Later days must use different names from verifiedPlaces.
Do not use a state, country, route stop or starting city as a tourist place.
The place, title, steps, tips and timeline of each day must describe the same place.

Each day must contain:
- day
- time in HH:MM format
- place
- title
- steps: an array of exactly 10 complete strings
- tips: exactly 3 useful and day-specific strings
- timeline: 2 to 4 events
- expenses
- estimatedCost

Rules for steps:
- Exactly 10 items, with no numbering inside the strings.
- Never split a time. Write 08:30, 13:30 and 15:00 as complete text.
- Use complete natural sentences.
- Include approximate journey or local-transfer duration where relevant.
- Include morning, afternoon, evening, meals, rest and practical guidance.
- Do not repeat the same generic template on different days.
- Never invent train numbers, flight numbers or guaranteed timings.

Day 1 must also contain bookingOrigin, bookingDestination and onwardTransfer.
Use the preferred transport for the practical main journey and explain any required connection.

Timeline event:
{"time":"09:00","title":"Activity","category":"activity"}

Expense item:
{"label":"Food","amount":1000}

Required result:
{"days":[]}
`;

    const extractionInstructions = `
You extract travel-form details from English, Hindi or Punjabi text.
Follow the extraction request inside input.message exactly.
Preserve the current saved details supplied in the message.
For a correction, change only the corrected field.
Do not erase a previously supplied field.
Return one compact valid JSON object only.
Do not add Markdown or conversational text.
`;

    const systemInstructions = isChat
      ? chatInstructions
      : isExtraction
        ? extractionInstructions
        : itineraryInstructions;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.GROQ_MODEL ||
            "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: systemInstructions,
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          temperature: isChat ? 0.3 : 0.15,
          reasoning_effort: "low",
          max_completion_tokens: isChat
            ? 500
            : isExtraction
              ? 700
              : 4200,
          ...(isChat
            ? {}
            : {
                response_format: {
                  type: "json_object",
                },
              }),
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Groq could not process the request.",
        },
        {
          status: response.status,
        },
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() || "";

    if (!text) {
      throw new Error("Zoya returned an empty response.");
    }

    if (isChat) {
      return NextResponse.json({ text });
    }

    if (isExtraction) {
      return NextResponse.json({ text });
    }

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const seenDays = new Set<number>();

    const days = Array.isArray(parsed.days)
      ? parsed.days
          .filter((day: any) => {
            const number = Number(day.day);

            if (!Number.isFinite(number) || seenDays.has(number)) {
              return false;
            }

            seenDays.add(number);
            return true;
          })
          .slice(0, tripDays)
          .map((day: any, index: number) => {
            const steps = normalizeSteps(day);

            return {
              ...day,
              day: index + 1,
              steps,
              summary: steps
                .map(
                  (step, stepIndex) =>
                    `${stepIndex + 1}. ${step}`,
                )
                .join("\n"),
            };
          })
      : [];

    if (days.length !== tripDays) {
      throw new Error("Zoya returned incomplete itinerary days.");
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Zoya API error:", error);

    return NextResponse.json(
      {
        error: "Zoya could not create the itinerary. Please try again.",
      },
      {
        status: 502,
      },
    );
  }
}
