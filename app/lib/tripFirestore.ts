import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";

export type FirestoreTrip = {
  form: Record<string, string>;
  preferences: string;
  itinerary: unknown[];
  attractions: unknown[];
  language: string;
  recommendedBudget: number;
  budgetBreakdown: Record<string, number>;
};

export async function saveTripToFirestore(
  uid: string,
  trip: FirestoreTrip,
) {
  if (!uid) throw new Error("A signed-in user is required to save a trip.");

  // Firestore rejects undefined values. JSON normalization removes optional
  // undefined attraction fields while preserving the itinerary data.
  const cleanTrip = JSON.parse(JSON.stringify(trip)) as FirestoreTrip;

  const result = await addDoc(
    collection(firestore, "users", uid, "trips"),
    {
      ...cleanTrip,
      userId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  console.info("Trip saved to Firestore:", result.id);

  return result.id;
}
