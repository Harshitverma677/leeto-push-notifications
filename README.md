# LEETO Push Notifications Backend

TypeScript service that polls recent Accepted LeetCode submissions and sends FCM push notifications to every LEETO account owner who tracks the submitting username.

## Behavior

- Only Accepted submissions are eligible. The current LeetCode provider uses LeetCode's recent accepted-submission query, and the worker also checks the status before sending.
- Each LeetCode username is polled once per cycle, with notifications fanned out to every distinct owner tracking it.
- First run establishes a timestamp baseline and intentionally sends no historical notifications.
- Per-owner submission claims prevent duplicate notifications on later polls.
- FCM tokens are read from `users/{uid}.fcmTokens`.
- Tracked profiles are read from the Firestore `members` collection group.
- The poll endpoint requires a bearer secret.

## Requirements

- Node.js 20+
- Firebase project `leetrack-5284d`
- Firebase Admin service-account JSON with Firestore and FCM permissions

## Local setup

```bash
npm install
cp .env.example .env
```

Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON on one line. Generate `POLL_SECRET` with `openssl rand -hex 32`. Never commit `.env` or the service-account key.

```bash
npm run check
npm test
npm run dev
```

Health check: `GET /health`

Run one poll:

```bash
curl -X POST http://localhost:3000/internal/run-poll \
  -H "Authorization: Bearer $POLL_SECRET"
```

## Deployment

Deploy as a Node.js web service. Build command: `npm install && npm run build`. Start command: `npm start`. Configure a scheduler to POST to `/internal/run-poll` with the bearer secret at the chosen interval. Do not run overlapping poll jobs.

## Verify before production

LeetCode's GraphQL endpoint is unofficial and may change or restrict automated requests. Validate the response shape and polling behavior using a test profile. The endpoint currently returns recent accepted submissions, not a general event stream; polling frequency and lookback must be chosen to avoid missing submissions during high activity.

Firestore may request a collection-group index for `members`. Create it when prompted. Worker state is stored in `leetcodePollingState`, dedupe claims in `notificationDedupe`, and poll errors in `notificationWorkerErrors`.

## Expected Firestore fields

- `users/{uid}.fcmTokens: string[]`
- `users/{uid}/members/{memberId}.leetCodeUsername: string`
- Optional `leetCodeUsernameNormalized` and `ownerUid`

Firebase Admin access bypasses client rules. Keep the service-account key secret and restrict its IAM permissions.
