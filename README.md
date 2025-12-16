# 🩺 Doctor AI Agent (AI Doctor)

An **AI-powered medical assistant** built with **Next.js** that enables **real-time voice-based conversations** with an intelligent doctor agent.  
The system supports **multi-language interaction**, **speech-to-text**, **text-to-speech**, secure **authentication**, and is fully **deployed on Vercel**.

🌐 **Live Demo:**  
https://aidoctor-sable.vercel.app/en

---

## 🚀 Overview

Doctor AI Agent simulates a virtual doctor that can:
- Listen to users via microphone
- Understand speech in multiple languages
- Respond intelligently using AI
- Speak back naturally using TTS
- Maintain a natural, real-time conversation flow

This project demonstrates a **full-stack AI voice agent** suitable for **healthcare demos**, **AI assistants**, and **voice-based applications**.

---

## ✨ Features

### 🗣️ Voice Conversation
- Real-time voice conversation with AI doctor
- Natural turn-based conversation flow
- Automatic silence detection
- Live captions for both user and AI

### 🧠 AI Intelligence
- AI responses powered by **OpenRouter / OpenAI**
- Context-aware medical conversations
- Session-based chat history

### 🔊 Speech Systems
- **Speech-to-Text** using AssemblyAI (WebSocket)
- **Text-to-Speech** using Murf AI
- Browser TTS fallback if Murf is unavailable

### 🌍 Multi-Language Support
- Internationalization using Next.js routing
- Supports multiple languages
- Language routes like `/en`, `/hi`, etc.

### 🔐 Authentication & Data
- Secure authentication with **Clerk**
- PostgreSQL database
- Prisma ORM for database access

### ☁️ Deployment
- Fully deployed on **Vercel**
- Production-ready setup

---

## 🎥 Demo Video

▶️ **Watch Demo:**  
https://imagekit.io/player/embed/rmyd10ywi/Recording%202025-06-29%20204016.mp4

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | Next.js (App Router), React |
| Speech-to-Text | AssemblyAI (WebSocket) |
| Text-to-Speech | Murf AI + Browser TTS |
| AI Models | OpenRouter / OpenAI |
| Authentication | Clerk |
| Database | PostgreSQL |
| ORM | Prisma |
| Deployment | Vercel |

---

## ⚙️ Local Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/shreybadal-source/AI_DOCTOR.git
cd AI_DOCTOR
2️⃣ Install Dependencies
bash
Copy code
npm install
3️⃣ Environment Variables
Create a .env.local file:

env
Copy code
# Voice APIs
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key
MURF_API_KEY=your_murf_api_key

# AI
OPEN_ROUTER_API_KEY=your_openrouter_api_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/doctor_ai?schema=public"

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
4️⃣ Database Setup
bash
Copy code
npx prisma migrate dev
5️⃣ Run Development Server
bash
Copy code
npm run dev
App runs at:
http://localhost:3000

🔄 Voice Conversation Flow
Start Call – User clicks Start Call

AI Speaking – AI introduces itself (mic muted)

User Speaking – Mic auto-activates

Silence Detection – 2 seconds pause ends input

Processing – Speech → Text → AI → Voice

Repeat – Continues until call ends

🌍 Deployed Version
✅ Production URL:
https://aidoctor-sable.vercel.app/en

🧪 Troubleshooting
🎤 Microphone
Allow microphone permission in browser

Best supported in Chrome / Edge

🧠 AssemblyAI
Ensure API key is correct

Check account credits

Must use NEXT_PUBLIC_ prefix

🔊 Murf AI
Use MURF_API_KEY (not MURF_AI_API_KEY)

Browser TTS auto-fallback supported

🔐 Clerk
Verify all Clerk keys and redirect URLs

Ensure dashboard routes exist

🗄️ Database
PostgreSQL must be running

Check DATABASE_URL

App works with limited features without DB

📄 License
MIT License

markdown
Copy code

---

