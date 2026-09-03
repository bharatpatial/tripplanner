type Props = {
  onSelect: (destination: string) => void;
};

const destinations = [
  { name: "Manali", className: "manali" },
  { name: "Goa", className: "goa" },
  { name: "Jaipur", className: "jaipur" },
  { name: "London", className: "london" },
  { name: "Switzerland", className: "switzerland" },
  { name: "Egypt", className: "egypt" },
];

export default function FeaturedDestinations({ onSelect }: Props) {
  return (
    <div className="plannerMain">
      <div className="welcome">
        <span>PLAN WITH INTELLIGENCE</span>
        <h1>
          Where will your next
          <br />
          <em>story begin?</em>
        </h1>
        <p>
          You’re the pilot. Zoya is your copilot. Together, we make your
          trip easier to design.
        </p>
      </div>

      <div className="destinationStrip">
        {destinations.map((destination) => (
          <button
            key={destination.name}
            type="button"
            className={`destinationPhoto ${destination.className}`}
            onClick={() => onSelect(destination.name)}
            aria-label={`Ask Zoya to show attractions in ${destination.name}`}
          >
            <span>
              {destination.name}
              <small>Explore attractions →</small>
            </span>
          </button>
        ))}
      </div>

      <div className="happyTravellers">
        <span>
          <i>A</i>
          <i>R</i>
          <i>M</i>
        </span>
        <div>
          <b>12,000+ happy travellers</b>
          <small>Journeys planned with Zoya</small>
        </div>
      </div>
    </div>
  );
}
