"use client";

import {
  TripPilotShell,
  useTripPilot,
} from "../context/TripContext";

const travelImages: Record<string, string> = {
  "Train tickets":
    "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=900&q=82",
  Flights:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=82",
  "Bus tickets":
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=82",
  "Car rentals":
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=82",
  "Airport taxis":
    "https://images.unsplash.com/photo-1515569067071-ec3b51335dd0?auto=format&fit=crop&w=900&q=84",
  "Bikes, autos & cabs":
    "https://images.unsplash.com/photo-1524591652733-73fa1ae7b5ee?auto=format&fit=crop&w=900&q=84",
};

export default function TravelsPage() {
  const controller = useTripPilot("travels");
  const { form, setForm, travelOptions } = controller;

  function displayDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  }

  function bookingCards(direction: "outbound" | "return") {
    const returning = direction === "return";
    const origin = returning ? form.destination : form.from;
    const destination = returning ? form.from : form.destination;
    const date = returning ? form.end : form.start;

    return (
      <div className="travelOptionGrid">
        {travelOptions.map((option) => (
          <article
            className={`travelOption ${option.tone}`}
            key={`${direction}-${option.title}`}
          >
            <div className="travelOptionTop">
              <span>{option.icon}</span>
              <i>{option.provider}</i>
            </div>

            <img
              className="travelOptionImage"
              src={travelImages[option.title]}
              alt={option.title}
            />

            <h2>{option.title}</h2>
            <p>{option.note}</p>

            <div className="travelRoute">
              <b>{origin}</b>
              <span>→</span>
              <b>{destination}</b>
            </div>

            <small>
              {displayDate(date)} · {form.travellers} travellers
            </small>

            <a
              href={returning ? option.returnHref : option.href}
              target="_blank"
              rel="noreferrer"
            >
              Book {returning ? "return" : "outbound"} on{" "}
              {option.provider} ↗
            </a>
          </article>
        ))}
      </div>
    );
  }

  return (
    <TripPilotShell controller={controller}>
      <section className="featurePage">
        <div className="featureHeading">
          <span>EVERY WAY TO GET THERE AND BACK</span>
          <h1>Plan your travels</h1>
          <p>
            Compare outbound and return options using your saved trip
            details.
          </p>
        </div>

        <div className="journeyBar">
          <label>
            FROM
            <input
              value={form.from}
              onChange={(event) =>
                setForm({ ...form, from: event.target.value })
              }
            />
          </label>

          <span className="journeyArrow">→</span>

          <label>
            DESTINATION
            <input
              value={form.destination}
              onChange={(event) =>
                setForm({ ...form, destination: event.target.value })
              }
            />
          </label>

          <label>
            DEPARTURE
            <input
              type="date"
              value={form.start}
              onChange={(event) =>
                setForm({ ...form, start: event.target.value })
              }
            />
          </label>

          <label>
            RETURN
            <input
              type="date"
              value={form.end}
              onChange={(event) =>
                setForm({ ...form, end: event.target.value })
              }
            />
          </label>

          <label>
            TRAVELLERS
            <input
              type="number"
              min="1"
              value={form.travellers}
              onChange={(event) =>
                setForm({ ...form, travellers: event.target.value })
              }
            />
          </label>
        </div>

        <div className="stayHeading">
          <h2>
            Outbound · {form.from} → {form.destination}
          </h2>
          <span>{displayDate(form.start)}</span>
        </div>
        {bookingCards("outbound")}

        <div className="stayHeading">
          <h2>
            Return · {form.destination} → {form.from}
          </h2>
          <span>{displayDate(form.end)}</span>
        </div>
        {bookingCards("return")}

        <div className="partnerNote">
          Booking availability and final prices are confirmed on each
          provider’s website.
        </div>
      </section>
    </TripPilotShell>
  );
}
