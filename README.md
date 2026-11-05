# LEETO Push Notifications Backend

TypeScript service that polls recent **Accepted** LeetCode submissions and sends FCM push notifications to LEETO account owners who track the submitting username.

## Current behavior

- Only Accepted submissions are eligible.
- Other statuses are ignored.
- Firestore records a per-owner submission claim to avoid duplicate notifications.
- FCM device tokens are read from `users/{uid}.fcmTokens`.
- Tracked members are read from the `members` collection group.
- Firebase Admin credentials are supplied only through environment variables.

## Requirements

- Node.js 20+
- Firebase project `leetrack-5284d`
- Firebase Admin service-account JSON with Firestore and FCM permissions

## Local setup

```bash
npm install
cp .env.example .env
```

Set `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env` to the complete service-account JSON as a single line. Never commit `.env` or the service-account key.

```bash
npm run check
npm run dev
```

Health check: `GET /health`

Run one poll: `POST /internal/run-poll`

## Important setup notes

1. The polling endpoint is currently intended for a trusted scheduler. Before public deployment, add a shared-secret or platform-level authentication check to `POST /internal/run-poll`.
2. Configure a scheduler to call `POST /internal/run-poll` at the desired interval. Do not run several overlapping workers.
3. Verify the exact LeetCode GraphQL response shape against a test account before enabling production notifications. LeetCode may change or restrict this unofficial endpoint.
4. Create a Firestore collection-group index if Firestore requests one for `members`.
5. The current member deduplication behavior polls each LeetCode username once per run. If multiple users track the same username, notification fan-out should be expanded to each owner before production use.

## Firestore fields expected

- `users/{uid}.fcmTokens: string[]`
- `users/{uid}/members/{memberId}.leetCodeUsername: string`
- Optional: `leetCodeUsernameNormalized`
- Optional: `ownerUid`

The worker uses Firebase Admin SDK and bypasses client security rules. Restrict service-account permissions and keep credentials private.
