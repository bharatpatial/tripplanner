"use client";

import FeaturedDestinations from "./components/FeaturedDestinations";
import TripPilotIntro from "./components/TripPilotIntro";
import TripPlannerForm from "./components/TripPlannerForm";
import {
  TripPilotShell,
  useTripPilot,
} from "./context/TripContext";

export default function HomePage() {
  const controller =
    useTripPilot("planner");

  return (
    <>
      <TripPilotIntro />

      <TripPilotShell
        controller={controller}
      >
        <section className="plannerScreen">
          <FeaturedDestinations
            onSelect={
              controller.openFeaturedDestination
            }
          />

          <TripPlannerForm
            controller={controller}
          />
        </section>
      </TripPilotShell>
    </>
  );
}
