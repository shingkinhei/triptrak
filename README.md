🚀 Smart Travel Planner (AI-Powered)
A full-stack travel management platform built with Next.js, Supabase, and AI Integration. This application streamlines the travel experience by offering AI-driven itineraries, multi-currency expense tracking, and real-time weather integration.

🌟 Core Features
🤖 AI-Powered Itinerary Generation: Integrated with OpenRouter (Gemini) to generate personalized 1-day itineraries based on user preferences. Includes an AI Daily Usage Limit to manage API quotas and costs.

💰 Financial Management & Visualization:

Tracks expenses and shopping lists with multi-currency support.

All financial data is stored in USD as a Single Source of Truth.

Automatic Daily Exchange Rate Updates via API.

Visualizes spending habits using Recharts (Pie charts by category).

📸 Multimedia Diary: Users can upload and store photos for daily activities and shopping items using Supabase Storage.

🛒 Comprehensive Shopping List: Tracks item images, prices, store locations, quantities, and categories.

🌍 Localization & UX:

Internationalization (i18n): Toggle between English and Traditional Chinese.

Guest Access: Implementation of Anonymous Authentication, allowing users to try the app before signing up.

Real-time Weather: Fetches 5-day forecasts for travel destinations via Weather API.

🛠 Tech Stack
Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui

Backend/Database: Supabase (PostgreSQL, Auth, Storage, Edge Functions)

State Management: TanStack Query (React Query)

AI Integration: OpenRouter API

Data Visualization: Recharts

i18n: next-intl

🏗 Database Schema
The application utilizes a relational PostgreSQL schema designed for scalability:

trips: Metadata for each journey (Destination, dates, base currency).

trip_days: Individual day nodes within a trip.

activities: Detailed events (Time, description, location, and AI_plan flag).

shopping_items: Items linked to specific trips with price and status tracking.

exchange_rates: Cached daily rates to minimize external API calls.

🔒 Engineering Highlights
1. Robust Currency Conversion Logic
To handle global travel, I implemented a strategy where all transactions are normalized to USD at the database level. This prevents data inconsistency caused by fluctuating exchange rates and allows for accurate historical spending analysis.

2. AI Reliability & Schema Validation
To ensure the AI (LLM) returns stable data, I designed a strict JSON Schema Prompt. The backend validates the AI response using Zod before inserting it into the database, ensuring that malformed AI outputs never crash the UI.

3. Low-Friction Onboarding
By implementing Anonymous Login, I reduced user friction, allowing recruiters or potential users to test the AI features immediately. They can later "upgrade" their anonymous account to a permanent one without losing their saved trips.

4. Performance Optimization
Image Compression: Photos are optimized before being uploaded to Supabase Storage to reduce bandwidth.

Server Components: Leveraged Next.js Server Components to minimize client-side JavaScript bundle size.