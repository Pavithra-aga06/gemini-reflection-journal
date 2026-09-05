# Gemini Reflection Journal

A secure, user-authenticated personal reflection and journaling application powered by **Google Gemini 3.6 Flash** and **Cloud Firestore**.

---

## Architecture Overview

- **User Identity**: Firebase Authentication with Federated Google Sign-In (zero password storage).
- **Database & Persistence**: Cloud Firestore with owner-bound, isolated security rules (`/users/{userId}/interactions/{interactionId}`).
- **AI Processing Engine**: Server-side Google Gemini 3.6 Flash API with an automated, resilient multi-tier fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
- **Secret Management**: Google Cloud Secret Manager & Environment Variables (`GEMINI_API_KEY`), never exposed to client browsers.

---

## 1. Environment & Prerequisites

Ensure the Google Cloud SDK (`gcloud`) and Node.js (18+) are installed, and authenticate your CLI:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

Enable required Google Cloud services:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 2. Cloud Firestore & Security Rules Configuration

Deploy the owner-bound security rules to ensure data isolation across authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## 3. Secret Management Setup (Google Cloud Secret Manager)

Store your Gemini API key securely in Google Cloud Secret Manager and grant the default Cloud Run service account access:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run runtime service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Run Deployment Flow

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
gcloud run deploy gemini-reflection-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

---

## 5. Campaign Verification Binding

To register the Cloud Run deployment for automated verification with the mandatory campaign label, run:

```bash
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Location-Aware Entries & Google Maps Security

Authenticated users can optionally attach their geographical setting to journal entries. This follows strict Google Maps security best practices:

- **Explicit User Consent**: Browser geolocation is invoked only after explicit user interaction via the "Attach Location" modal.
- **Zero Client-Side API Key Exposure**: Reverse geocoding occurs strictly on the backend (`POST /api/location/reverse-geocode`). No Google Maps API keys are bundled or exposed to the client.
- **Minimum Information Principle**: Only minimal required location attributes (`latitude`, `longitude`, `placeName`, `formattedAddress`, `attachedAt`) are stored.
- **Strict Data Isolation**: Location records reside exclusively within `/users/{userId}/interactions/{interactionId}`, governed by Firestore security rules.
- **Optional Secret Manager Binding for Google Maps API Key**:

```bash
# Store Google Maps API key in Secret Manager (Optional)
gcloud secrets create GOOGLE_MAPS_API_KEY --replication-policy="automatic"
echo -n "YOUR_GOOGLE_MAPS_API_KEY" | gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-

# Grant service account access
gcloud secrets add-iam-policy-binding GOOGLE_MAPS_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 7. Agentic Threat Modeling (5 Threat Zones)

| Threat Zone | Potential Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malformed coordinates, NaN injection, or malicious payload in reverse-geocoding requests. | Strict schema & boundary validation in `/api/location/reverse-geocode` (lat: `[-90, 90]`, lng: `[-180, 180]`). Text length capped and sanitized. |
| **Planning & Reasoning** | Prompt injection via untrusted user location data attempting to override AI instructions. | Location data is labeled strictly as passive declarative context (`[Journal Location Context: ...]`). System prompt enforces strict non-executable data handling. |
| **Tool Execution** | SSRF or API key exposure when querying mapping endpoints. | All reverse-geocoding calls are made from the server proxy using parameterized URLs. No client-supplied URLs or headers are accepted. |
| **Memory & State** | Cross-user location exposure or unauthorized document writes. | Enforced owner-bound Firestore security rules (`request.auth.uid == userId`). No shared or global location indexing. Sanitization removes `undefined` properties. |
| **Inter-System Comm** | API key leakage in browser dev tools or logs. | Google Maps and Gemini API keys are retrieved securely via environment/Secret Manager on the server. Zero keys sent to browser. |

---

## 8. Functional Verification & Test Walkthroughs

The following test walkthroughs cover every user-facing interaction:

### Test Case 1: Federated Google Authentication
1. Navigate to the application home page (`http://localhost:3000`).
2. Verify that unauthenticated visitors see the Welcome screen with security guarantees and the "Continue with Google" button.
3. Click "Continue with Google" and complete Google Sign-In popup.
4. Verify immediate redirect to the private Journal Dashboard with the user's name and avatar in the navigation bar.

### Test Case 2: Creating and Customizing a Reflection
1. Click the "New Reflection" button or start typing in the title and textarea.
2. Select an AI mode: `Reflect`, `Summarize`, or `Brainstorm`.
3. Type a reflection into the composer and click "Send Reflection" (or press `Cmd+Enter`).
4. Verify that the user's message appears on the right, followed by Gemini's formatted Markdown response.
5. Verify that the "Saved in Firestore" status indicator confirms persistence.

### Test Case 3: Location-Aware Entry Attachment
1. In the journal toolbar, click the "Attach Location" button.
2. Verify the Consent Modal opens, detailing the privacy and security guarantees.
3. Click "Use My Current Location".
4. When the browser prompts for location permission, click "Allow".
5. Verify the modal transitions from "Requesting location permission..." to "Resolving place details..." to the Detected Location preview.
6. Verify the detected coordinates, place name, and address are displayed. Optionally edit the display name.
7. Click "Attach to Reflection".
8. Verify that the `LocationCard` appears below the toolbar with the place name and coordinates badge.
9. Click "View Map" to toggle the embedded Google Map preview.
10. Click the external link icon to verify it opens the location on Google Maps in a new tab.

### Test Case 4: Manual Location Fallback
1. Open the Location Modal and select "Enter Place Name Manually".
2. Type a custom landmark or city (e.g., "Kyoto, Japan").
3. Click "Save Location".
4. Verify that the custom place name is attached to the entry and persisted to Firestore.

### Test Case 5: Detaching / Removing Location
1. On an entry with an attached location, click the trash icon on the LocationCard.
2. Verify that the location is immediately removed from the entry.
3. Verify that the Firestore document is updated to reflect the removal.

### Test Case 6: User-Isolated History & Deletion
1. Verify the left sidebar lists all past reflections with their title, date, message count, and location badge (if location-tagged).
2. Use the search bar to filter entries by keyword or location name.
3. Click on a past entry to load its thread, title, and attached location.
4. Click the delete icon on an entry item and confirm the deletion prompt.
5. Verify the entry is removed from both the sidebar and Firestore.

---

## 9. Local Development

Install dependencies and start the unified full-stack dev server:

```bash
npm install
npm run dev
```

The application will bind to `http://localhost:3000`.
