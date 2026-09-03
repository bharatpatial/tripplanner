"use client";

import {
  TripPilotShell,
  useTripPilot,
} from "./context/TripContext";
import FeaturedDestinations from "./components/FeaturedDestinations";
import TripPlannerForm from "./components/TripPlannerForm";

export default function HomePage() {
  const controller = useTripPilot("planner");

  return (
    <TripPilotShell controller={controller}>
      <section className="plannerScreen">
        <FeaturedDestinations
          onSelect={controller.openFeaturedDestination}
        />
        <TripPlannerForm controller={controller} />
      </section>
    </TripPilotShell>
  );
}
