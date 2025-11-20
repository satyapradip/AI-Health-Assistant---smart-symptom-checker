# AI Health Assistant - Smart Symptom Checker

A modern AI-powered medical assistant that helps users assess symptoms, track health data, and get AI-based insights. Built with React, TypeScript, Tailwind CSS, and Supabase serverless functions.

---

## Features

- AI-based symptom assessment
- Session history tracking
- OCR-based document processing
- Responsive, interactive UI with shadcn-ui components
- Fast development with hot reload

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite  
- **UI Components:** Tailwind CSS, shadcn-ui  
- **Backend / Functions:** Supabase serverless functions  
- **Deployment:** Vercel / Netlify / Render or any Node.js static hosting  

---

## Getting Started Locally

### 1. Install Node.js & npm
Recommended to use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage Node versions.

### 2. Clone the repository
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```
### 3. Install dependencies
```
npm install
```
4. Set up environment variables

Create a .env file in the project root (do not commit this file). Example .env:
```
VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```
Replace placeholders with your actual keys.

5. Run the development server
```npm run dev```
