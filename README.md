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

## 6. Local Development

Install dependencies and start the unified full-stack dev server:

```bash
npm install
npm run dev
```

The application will bind to `http://localhost:3000`.
