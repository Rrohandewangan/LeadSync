# LeadSync

Real-time Facebook Lead Ads sync for mobile. When someone fills out a Meta Lead Ad form, their details show up instantly on your phone — no refresh needed.

---

## What it does

1. **Meta sends a webhook** to your backend when someone submits a lead form
2. **Backend fetches the full lead** from Meta's Graph API (webhooks only send the lead ID)
3. **Lead gets saved** to MongoDB
4. **Socket.IO pushes it** to every connected mobile client in real time

```
┌──────────────┐    webhook     ┌──────────────────┐    Socket.IO    ┌──────────────┐
│  Meta Lead   │ ──────────────▶│  Node.js/Express  │ ──────────────▶│  React Native │
│  Ad Form     │                │  Backend          │                │  Mobile App   │
└──────────────┘                └───────┬───────────┘                └──────────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │   MongoDB    │
                                 └──────────────┘
```

---

## Tech stack

| Technology | What it handles |
|---|---|
| Node.js + Express | Backend, REST API, webhook endpoint |
| React Native (Expo) | Mobile app |
| Meta Graph API | Fetching lead details |
| Meta Webhooks | Getting notified about new leads |
| Socket.IO | Real-time push to mobile clients |
| MongoDB + Mongoose | Persistent storage |

---

## Project structure

```
LeadSync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── leadController.js    # CRUD + webhook simulation
│   │   │   └── webhookController.js # Meta webhook handler
│   │   ├── models/
│   │   │   └── Lead.js             # Mongoose schema
│   │   ├── routes/
│   │   │   ├── leadRoutes.js
│   │   │   └── webhookRoutes.js
│   │   ├── services/
│   │   │   ├── metaService.js       # Graph API calls
│   │   │   └── socketService.js     # Socket.IO setup
│   │   └── app.js                   # Express app config
│   ├── server.js                    # Entry point
│   ├── .env.example
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   │   └── LeadCard.js          # Single lead display
│   │   ├── screens/
│   │   │   └── LeadsScreen.js       # Main screen
│   │   ├── services/
│   │   │   ├── api.js               # Axios client
│   │   │   └── socket.js            # Socket.IO client
│   │   └── config/
│   │       └── constants.js         # API URLs
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** running locally or a cloud instance (Atlas works fine)
- **Expo CLI** — install with `npm install -g expo-cli`
- **ngrok** — for exposing your local server to Meta during testing
- A **Meta Developer account** with a Facebook Page

### 1. Clone and install

```bash
git clone <your-repo-url>
cd LeadSync

# Backend
cd backend
npm install

# Mobile
cd ../mobile
npm install
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | Your MongoDB connection string |
| `META_APP_ID` | [Meta for Developers](https://developers.facebook.com) → Your App → Settings |
| `META_APP_SECRET` | Same place as above |
| `META_PAGE_ACCESS_TOKEN` | Graph API Explorer → generate a Page token with `leads_retrieval` and `pages_show_list` permissions |
| `WEBHOOK_VERIFY_TOKEN` | Make up any random string — you'll use the same one when setting up the webhook in Meta |

### 3. Start the backend

```bash
cd backend
npm run dev
```

Server starts at `http://localhost:3000`. You should see:
```
MongoDB connected: localhost
Server running on http://localhost:3000
Webhook endpoint: http://localhost:3000/webhook
```

### 4. Start the mobile app

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

> **Important:** Update the IP address in `mobile/src/config/constants.js` to match your machine's local IP if you're running on a physical device. Use `10.0.2.2` for Android emulator, `localhost` for iOS simulator.

---

## Testing — three phases

### Phase 1: Local test (no Meta at all)

With the backend and mobile app both running, test the entire real-time pipeline:

```bash
# Simulate a webhook-style lead
curl -X POST http://localhost:3000/api/leads/simulate-webhook \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890"}'
```

The lead should appear on your phone **instantly** without refreshing. If this works, your backend → MongoDB → Socket.IO → mobile pipeline is verified.

You can also use the simpler manual endpoint:

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@example.com", "phone": "+9876543210"}'
```

### Phase 2: Verify the webhook endpoint

Test that your webhook verification works:

```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=pick_any_random_string_here&hub.challenge=test123"
```

Should return: `test123`

Test with a simulated Meta webhook POST payload:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "TEST_PAGE_ID",
      "changes": [{
        "field": "leadgen",
        "value": {
          "leadgen_id": "FAKE_LEAD_ID",
          "form_id": "FAKE_FORM_ID",
          "page_id": "TEST_PAGE_ID"
        }
      }]
    }]
  }'
```

This will fail at the Graph API call (fake ID), but you'll see the webhook logging in your terminal — confirming the endpoint is wired correctly.

### Phase 3: Full Meta integration

Once Phase 1 and 2 pass, connect to the real Meta Lead Ads system.

---

## Setting up Meta Lead Ads integration

### Step 1 — Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app (Business type)
3. Add the **Webhooks** and **Facebook Login** products

### Step 2 — Set up a Facebook Page

You need a Facebook Page to run lead ads. If you don't have one, create one. Your Meta app needs to be connected to this page.

### Step 3 — Generate a Page Access Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Get a **User Token** with these permissions:
   - `pages_show_list`
   - `leads_retrieval`
   - `pages_manage_ads`
   - `pages_read_engagement`
4. Exchange for a **Page Access Token** — select your page from the dropdown
5. (Optional) Extend to a long-lived token so it doesn't expire in an hour

Put this token in your `.env` as `META_PAGE_ACCESS_TOKEN`.

### Step 4 — Expose your local server with ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`).

### Step 5 — Configure the Webhook

1. In your Meta App Dashboard, go to **Webhooks**
2. Subscribe to **Page** events
3. Callback URL: `https://abc123.ngrok-free.app/webhook`
4. Verify token: the same string you put in `WEBHOOK_VERIFY_TOKEN`
5. Subscribe to the **leadgen** field

### Step 6 — Subscribe your Page

You also need to subscribe your Page to the app's webhook. Do this via the Graph API:

```bash
curl -X POST "https://graph.facebook.com/v19.0/<PAGE_ID>/subscribed_apps?subscribed_fields=leadgen&access_token=<PAGE_ACCESS_TOKEN>"
```

### Step 7 — Test with Meta's Lead Ads Testing Tool

1. Open [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing)
2. Select your page and form
3. Click **Create Lead**
4. Check your terminal for the webhook log
5. Check the mobile app — the lead should appear in real time

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/webhook` | Meta webhook verification |
| `POST` | `/webhook` | Receives Meta webhook events |
| `GET` | `/api/leads` | Get all leads (newest first) |
| `POST` | `/api/leads` | Manually create a lead |
| `POST` | `/api/leads/simulate-webhook` | Simulate a full webhook pipeline locally |
| `DELETE` | `/api/leads/:id` | Delete a lead |

### Socket.IO events

| Event | Direction | Payload |
|---|---|---|
| `new_lead` | Server → Client | The full lead object |

---

## How the data flows

```
1. Someone fills a Facebook Lead Ad form
2. Meta fires POST /webhook with { leadgen_id }
3. webhookController.receive() picks it up
4. metaService.fetchLeadDetails(leadgen_id) hits Graph API
5. metaService.parseLeadFields() flattens the response
6. Lead.create() saves to MongoDB
7. socketService.getIO().emit('new_lead', lead)
8. Mobile app's socket.on('new_lead') fires
9. setLeads(prev => [newLead, ...prev]) updates the screen
```

Meta's webhook only sends the lead **ID**, not the actual contact info. That's why step 4 is crucial — we call the Graph API separately to get the name, email, and phone.

---

## Troubleshooting

**Webhook verification fails**
- Make sure `WEBHOOK_VERIFY_TOKEN` in `.env` matches exactly what you entered in Meta's dashboard
- Make sure ngrok is running and the URL is correct

**Leads aren't showing up in the app**
- Check the backend console for errors
- Verify MongoDB is running
- Check the IP address in `mobile/src/config/constants.js`
- Make sure the mobile app and backend are on the same network

**Meta API returns "Invalid OAuth access token"**
- Your page access token may have expired — generate a new one
- Make sure the token has `leads_retrieval` permission

**Socket.IO not connecting**
- Check that CORS is enabled on the backend (it is by default)
- Verify the socket URL in `constants.js` points to your backend
- On Android emulator, use `10.0.2.2` instead of `localhost`

**Leads appear in the database but not in the app**
- The app might have loaded before Socket.IO connected — pull down to refresh
- Check the green/red dot in the header — it shows connection status

---

## Extending this project

Some ideas if you want to take it further:

- **Push notifications** — Notify users when a lead comes in even if the app is closed
- **Lead details screen** — Tap a lead card to see all the raw fields
- **Multiple pages** — Support leads from multiple Facebook pages
- **Authentication** — Add login so not everyone can see the leads
- **Export to CSV** — Download leads as a spreadsheet
- **Status tracking** — Mark leads as contacted, converted, etc.

---

## License

ISC
