# AI Health Assistant - Complete Workflow Documentation

## 📋 Project Overview

This is an AI-powered symptom assessment application built with React, TypeScript, Supabase, and integrated with Gemini and OpenAI APIs for medical triage.

**Website URL**: http://localhost:8081/ (when `npm run dev` is running)

---

## 🔄 Complete Data Flow

### 1. **USER SIGNUP → AUTHENTICATION**

```
User fills signup form
    ↓
Supabase Auth creates user account
    ↓
User email verified
    ↓
Navigate to Dashboard (requires authentication)
```

**Files involved**: `src/pages/Auth.tsx`, `src/integrations/supabase/client.ts`

### 2. **CONSENT RECORDING**

```
User views ConsentForm on first login
    ↓
User accepts consent terms
    ↓
Data saved to `consent_records` table
    ↓
Dashboard unlocks - can start symptom assessment
```

**Files involved**: `src/components/ConsentForm.tsx`
**Database**: `supabase.consent_records`

### 3. **SYMPTOM FORM SUBMISSION**

```
User fills SymptomForm with:
  - Symptoms (required)
  - Severity (required)
  - Age (required)
  - Optional: onset, duration, conditions, medications, allergies, pregnancy status
    ↓
Form validates with Zod schema
    ↓
Session created in `symptom_sessions` table with initial data
    ↓
Optional: Upload medical report (JPG/PNG/PDF)
    ↓
All data sent to AI analysis service
```

**Files involved**: `src/components/SymptomForm.tsx`
**Database**: `supabase.symptom_sessions`, `supabase.report_files`

### 4. **AI ANALYSIS (CORE LOGIC)**

```
AI Service receives symptom data
    ↓
Try Gemini API first:
  - Send medical triage prompt to Google Gemini
  - Parse JSON response with: triage_level, recommendations, confidence_score
    ↓
If Gemini fails → Try OpenAI:
  - Send same prompt to OpenAI GPT-3.5-turbo
  - Parse JSON response
    ↓
If both fail → Return comprehensive fallback response with:
  - Generic self-care recommendations
  - Triage level based on severity
  - 35% confidence score
    ↓
Return AnalysisResponse object with:
  {
    triage_level: "self-care" | "see-doctor" | "urgent-visit" | "emergency",
    triage_reason: string,
    recommendations: {
      medicines: [{name, dose, notes, evidence_level}],
      home_remedies: [strings],
      what_to_do: [strings],
      what_not_to_do: [strings]
    },
    confidence_score: 0.0-1.0,
    disclaimer: string
  }
```

**Files involved**: `src/lib/aiService.ts`

### 5. **DATABASE UPDATE**

```
AI response returned to SymptomForm
    ↓
Session updated with:
  - triage_level
  - triage_reason
  - confidence_score
  - recommendations (JSONB)
    ↓
SessionId set in state
    ↓
Redirect to ResultsDisplay component
```

**Files involved**: `src/components/SymptomForm.tsx`
**Database**: `supabase.symptom_sessions` (UPDATE)

### 6. **RESULTS POLLING & DISPLAY**

```
ResultsDisplay mounts with sessionId
    ↓
Initial fetch from `symptom_sessions` table
    ↓
If no results yet → Show loading spinner
    ↓
Poll database every 1 second for updates
    ↓
When data arrives:
  ✅ Display Triage Card (headline, reason, icon)
  ✅ Show Confidence Score bar (percentage)
  ✅ Display Medications (OTC suggestions)
  ✅ Display Home Remedies (non-medication care)
  ✅ Display What To Do (positive actions)
  ✅ Display What Not To Do (warnings)
  ✅ Display Follow-Up Guidance (optional)
  ✅ Show Medical Disclaimer
    ↓
User can "Start New Assessment" to restart workflow
```

**Files involved**: `src/components/ResultsDisplay.tsx`
**Database**: `supabase.symptom_sessions` (SELECT with polling)

---

## 🛠️ Setup Requirements

### Required Environment Variables (`.env.local`)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://pfduadihoswvnemdqnek.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EL2CoNOCmyy5vQH_KQNZ5w_aplCV5sY

# AI API Keys (currently embedded in aiService.ts - see below)
# GEMINI_API_KEY=AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY
# OPENAI_API_KEY=sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop
```

### Database Setup

Supabase migrations have been applied with the following tables:

#### 1. **`profiles`** (Auto-created by Supabase Auth)

```sql
- id (UUID, FK to auth.users)
- email (text)
- full_name (text)
- date_of_birth (date)
- created_at (timestamp)
```

#### 2. **`consent_records`**

```sql
- id (UUID)
- user_id (UUID, FK to auth.users)
- consent_given (boolean)
- consent_text (text)
- created_at (timestamp)
```

#### 3. **`symptom_sessions`**

```sql
- id (UUID)
- user_id (UUID, FK to auth.users)
- symptoms_text (text)
- onset (text)
- severity (text)
- duration (text)
- existing_conditions (text)
- current_medications (text)
- allergies (text)
- age (integer)
- is_pregnant (boolean)
- triage_level (text)
- triage_reason (text)
- confidence_score (numeric)
- recommendations (jsonb) ← STORES ALL AI RECOMMENDATIONS
- created_at (timestamp)
- updated_at (timestamp)
```

#### 4. **`report_files`**

```sql
- id (UUID)
- session_id (UUID, FK to symptom_sessions)
- user_id (UUID, FK to auth.users)
- file_name (text)
- file_path (text)
- file_type (text)
- file_size (integer)
- created_at (timestamp)
```

### Row-Level Security (RLS) Policies

All tables have RLS enabled with policies:

- Users can only VIEW their own sessions
- Users can only INSERT their own data
- Users can only UPDATE their own data

---

## 🔌 API Integration

### Gemini API

- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Model**: `gemini-pro`
- **API Key**: `AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY`
- **Location**: `src/lib/aiService.ts` (line 108)

### OpenAI API

- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-3.5-turbo`
- **API Key**: `sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop`
- **Location**: `src/lib/aiService.ts` (line 155)

### Medical Triage Prompt

The prompt sent to both APIs is identical and instructs the models to:

1. Analyze symptoms and medical context
2. Return ONLY valid JSON (no markdown)
3. Provide structured recommendations with:
   - OTC medications (NOT prescriptions)
   - Home remedies
   - Actions to take
   - Actions to avoid
4. Rate confidence (0.0-1.0)
5. Include legal disclaimer

---

## 📂 File Structure & Responsibilities

```
src/
├── App.tsx                              # Main router
├── pages/
│   ├── Auth.tsx                        # Signup/Login
│   ├── Dashboard.tsx                   # Main dashboard with tabs
│   ├── Index.tsx                       # Landing page
│   └── NotFound.tsx                    # 404 page
├── components/
│   ├── SymptomForm.tsx                 # Captures symptoms, submits to AI
│   ├── ResultsDisplay.tsx              # Displays AI results with polling
│   ├── ConsentForm.tsx                 # Consent acceptance
│   ├── SessionHistory.tsx              # View previous assessments
│   ├── ProfilePanel.tsx                # User profile (demo)
│   ├── UserProfileCard.tsx             # User info display
│   ├── NavLink.tsx                     # Navigation
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── aiService.ts                    # Core AI integration (Gemini + OpenAI)
│   └── utils.ts                        # Utility functions
├── integrations/
│   └── supabase/
│       ├── client.ts                   # Supabase client initialization
│       └── types.ts                    # Type definitions
└── hooks/
    ├── use-toast.ts                    # Toast notifications
    └── use-mobile.tsx                  # Mobile detection
```

---

## 🚀 Running the Application

### 1. **Start Development Server**

```bash
cd c:\Users\satya\OneDrive\Documents\GitHub\AI-Health-Assistant---smart-symptom-checker
npm run dev
# or
bun run dev
```

Server will be available at: **http://localhost:8081/**

### 2. **Create Test Account**

- Navigate to signup page
- Create account with email/password
- Accept consent terms
- Dashboard loads

### 3. **Submit Symptom Assessment**

- Fill symptom form
- Select severity, age, pregnancy status
- Click "Run Symptom Assessment"
- Wait for AI analysis (2-5 seconds)

### 4. **View Results**

- Automatic polling displays results as they arrive
- See: Triage level, confidence, medications, remedies, actions, warnings
- Click "Start New Assessment" for another query

---

## 🐛 Debugging & Console Logs

All critical steps are logged to browser console:

### SymptomForm Logs

```
📱 Calling AI service for symptom analysis...
✅ AI analysis complete: {triage_level, medicines, home_remedies, ...}
💾 Updating session with analysis results...
✅ Session updated successfully with session ID: [uuid]
```

### aiService Logs

```
🔍 Starting symptom analysis...
Attempting Gemini API call...
✅ Gemini analysis successful with recommendations: {...}
[OR]
⚠️ Gemini failed, trying OpenAI fallback...
✅ OpenAI analysis successful with recommendations: {...}
[OR]
❌ All AI APIs failed, using fallback response with generic recommendations
```

### ResultsDisplay Logs

```
✅ Session data with recommendations found: {medicines: 3, remedies: 2, ...}
[OR]
⏳ Session data not yet ready - still waiting for AI analysis (polling...)
```

---

## ⚙️ Key Features

### Triage Levels

- **emergency**: 🚨 Call emergency services immediately
- **urgent-visit**: ⚠️ Visit clinic/ER soon
- **see-doctor**: 📋 Schedule appointment
- **self-care**: ✅ Home management with monitoring

### Confidence Score

- 0.0-1.0 represented as percentage bar
- Higher = more certain in triage assessment
- 0.35 = fallback response confidence

### Recommendations Structure

All recommendations are JSONB stored in database:

```json
{
  "medicines": [
    {
      "name": "Ibuprofen",
      "dose": "400mg every 6 hours",
      "notes": "For pain/fever"
    },
    { "name": "Acetaminophen", "dose": "500mg as needed" }
  ],
  "home_remedies": [
    "Rest 8 hours daily",
    "Stay hydrated",
    "Apply warm compress"
  ],
  "what_to_do": ["Monitor symptoms daily", "Contact doctor if worsens"],
  "what_not_to_do": ["Don't skip meals", "Don't ignore chest pain"],
  "disclaimer": "Educational only..."
}
```

---

## 🔐 Security Notes

### Current (Development)

- API keys embedded in `src/lib/aiService.ts`
- Frontend exposed keys for demo purposes
- Suitable for development/testing ONLY

### Production Recommendations

1. Move API keys to `.env` variables
2. Create Edge Function backend for API calls
3. Implement rate limiting
4. Add API key rotation
5. Use Supabase RLS policies (already in place)
6. Add CORS headers
7. Implement audit logging

---

## 📊 Database Queries (Supabase SQL Editor)

### View All Sessions for User

```sql
SELECT * FROM symptom_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### View Session with Recommendations

```sql
SELECT
  id,
  created_at,
  triage_level,
  confidence_score,
  recommendations
FROM symptom_sessions
WHERE id = '[session-uuid]';
```

### Check Consent Records

```sql
SELECT * FROM consent_records
WHERE user_id = auth.uid()
  AND consent_given = true
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🧪 Testing Checklist

- [ ] Can sign up and create account
- [ ] Consent form blocks until accepted
- [ ] Can submit symptom form with all fields
- [ ] AI analysis completes within 5 seconds
- [ ] Results display shows triage level
- [ ] Medications appear in results
- [ ] Home remedies appear in results
- [ ] What to do / What not to do sections visible
- [ ] Confidence score bar displays correctly
- [ ] Can start new assessment
- [ ] Previous assessments appear in history
- [ ] Emergency triage shows red alert
- [ ] API keys work (check console for errors)

---

## 🔧 Troubleshooting

### "Assessment is ready but no output displayed"

**Solution**:

1. Check browser console for errors
2. Verify `symptom_sessions` table has `recommendations` data
3. Ensure ResultsDisplay polling is active (check console logs)
4. Check Gemini/OpenAI API responses in Network tab

### "Failed to record consent"

**Solution**:

1. Supabase migrations must be applied
2. Run migrations in Supabase SQL Editor
3. Check RLS policies are correct

### "Forbidden use of API key"

**Solution**:

1. Gemini: Use public API key (not private)
2. OpenAI: Use API key (starts with `sk-`)
3. Check key hasn't been revoked

### "No results after waiting"

**Solution**:

1. Check API rate limits haven't been exceeded
2. Verify network request succeeded (Network tab)
3. Check `recommendations` column is being saved to database
4. Increase polling timeout if needed

---

## 📝 Notes

- UI uses Tailwind CSS + shadcn/ui components
- Form validation with Zod schema
- Real-time polling every 1 second (can be adjusted)
- Responsive design for mobile/tablet/desktop
- Dark mode support
- Sonner toast notifications

---

## 🎯 Next Steps (Optional Enhancements)

1. **Move API Keys to Edge Functions**

   - Create Supabase Edge Function for AI calls
   - Hide API keys from frontend
   - Better security + rate limiting

2. **Add OCR Processing**

   - Process uploaded medical reports
   - Extract text and include in AI analysis

3. **Enhanced History**

   - View detailed session history
   - Compare past assessments
   - Export reports

4. **Notifications**

   - Email follow-up reminders
   - Emergency alerts to guardians

5. **Analytics**
   - Track assessment patterns
   - Identify common symptoms
   - Generate health insights

---

**Last Updated**: November 20, 2025  
**Project Status**: ✅ Fully Functional - Ready for Testing
