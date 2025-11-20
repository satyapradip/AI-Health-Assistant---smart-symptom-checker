# AI Health Assistant

## Project Overview

AI-powered health assistant providing symptom assessment, triage guidance, and medical report OCR. Educational demonstration tool for hackathon showcase.

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Backend)
- Google Gemini AI

## Setup Instructions

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Navigate to the project directory
cd apna-doctor-main

# Step 2: Install the necessary dependencies
npm install

# Step 3: Set up environment variables
# Create a .env file in the root directory with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
# GEMINI_API_KEY=your_gemini_api_key

# Step 4: Start the development server
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

For Supabase Edge Functions, you'll also need to set:
- `SUPABASE_URL` (same as VITE_SUPABASE_URL)
- `SUPABASE_SERVICE_ROLE_KEY` (your Supabase service role key)
- `GEMINI_API_KEY` (same as above)

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in the `supabase/migrations` folder
3. Set up storage bucket named `medical-reports` for file uploads
4. Configure the Edge Functions with the required environment variables

## Important Disclaimer

⚠️ **This is a demonstration tool for educational purposes only. This is NOT medical advice and should not replace professional medical consultation. In case of emergency, call emergency services immediately.**

## License

This project is for educational and demonstration purposes only.
