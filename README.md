<div align="center">

# 🔔 LEETO Push Notifications

### The backend that powers instant LeetCode alerts for the LEETO app

Polls LeetCode for new Accepted submissions and sends push notifications to your team.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

📱 **Mobile app:** [leettrack_app](https://github.com/Harshitverma677/leettrack_app)

</div>

---

## ✨ Features

- 🔍 Polls each tracked LeetCode username **once per cycle**
- ✅ Notifies only for **Accepted** submissions
- 🚫 **Firestore-based deduplication** stops repeat alerts
- 🔔 Sends push notifications via **Firebase Cloud Messaging**
- 🔐 Protected polling endpoint with a **Bearer token**
- ❤️ Built-in **health-check** endpoint

---

## 🧠 How It Works

```
cron-job.org ➜ POST /internal/run-poll ➜ Read usernames & FCM tokens (Firestore)
      ➜ Fetch recent submissions (LeetCode GraphQL) ➜ Accepted? ➜ Dedup check ➜ FCM push 📱
```

---

## 🛠️ Tech Stack

| Area | Tech |
| --- | --- |
| ⚙️ Runtime | Node.js, TypeScript, Express |
| 🗄️ Database | Cloud Firestore |
| 🔔 Notifications | Firebase Cloud Messaging (FCM) |
| 🌐 Data Source | LeetCode public GraphQL endpoint |
| ☁️ Hosting | Render Web Service |
| ⏰ Scheduler | cron-job.org |

---

## 🔌 API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check server status |
| `POST` | `/internal/run-poll` | Run one polling cycle (Bearer token required) |

Example:

```bash
curl -X POST https://<your-render-url>/internal/run-poll \
  -H "Authorization: Bearer <POLL_SECRET>"
```

---

## 🔑 Environment Variables

| Variable | Description |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (or a local file path for development) |
| `POLL_SECRET` | Secret token for the polling endpoint |
| `POLL_MAX_CONCURRENCY` | Max parallel LeetCode requests |
| `MAX_SUBMISSION_LOOKBACK` | How many recent submissions to check |
| `NODE_ENV` | `development` or `production` |

> 📄 Copy `.env.example` to `.env` and fill in the values.

---

## ⚡ Run Locally

```bash
git clone https://github.com/Harshitverma677/leeto-push-notifications.git
cd leeto-push-notifications
npm install
cp .env.example .env
```

Then run:

```bash
npm run check   # type check
npm test        # run tests
npm run dev     # start dev server
```

Health check: `GET http://localhost:3000/health`

---

## 🚀 Deploy on Render

| Setting | Value |
| --- | --- |
| Service type | Web Service |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `npm start` |
| Environment | Add all variables above in Render settings |

⏰ Then create a job on **cron-job.org** to call `POST /internal/run-poll` on your chosen schedule, with the header `Authorization: Bearer <POLL_SECRET>`.

---

## 🔒 Security

- 🚫 Never commit `.env` or service-account JSON files
- 🔑 Keep `POLL_SECRET` private
- 🛡️ Keep FCM credentials on the backend only

---

<div align="center">

### 👨‍💻 Built by [Harshit Verma](https://github.com/Harshitverma677)

⭐ Star this repo if you like it!

</div>
