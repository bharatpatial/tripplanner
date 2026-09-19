# TripPilot Firebase setup

1. Open the Firebase Console and create a project.
2. Add a Web app to that project, then copy its configuration values.
3. In **Authentication → Sign-in method**, enable **Google** and **Email/Password**.
4. In **Firestore Database**, create the database in production mode and select a nearby region.
5. Copy `.env.local.example` to `.env.local` and replace every placeholder with the Web app values.
6. Copy the rules in `firestore.rules` into **Firestore Database → Rules**, then publish them.
7. Run `npm install`, clear `.next`, and run `npm run dev`.

For Google login on a deployed site, add the deployment domain under **Authentication → Settings → Authorized domains**.

## Stored data

User profiles are saved at:

```text
users/{uid}
```

Generated trips are saved at:

```text
users/{uid}/trips/{tripId}
```

Only the signed-in owner can read or modify their own data under the supplied Firestore rules. Signed-out visitors can still generate trips, but those trips remain in browser session storage only.
