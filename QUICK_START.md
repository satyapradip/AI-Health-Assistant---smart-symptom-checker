# 🚀 QUICK START GUIDE

## 1️⃣ **Start the Server**

```bash
npm run dev
```

→ Open http://localhost:8081/

## 2️⃣ **Test Flow**

### Step 1: Signup

- Email: `test@example.com`
- Password: `Test123!`
- Click "Sign Up"

### Step 2: Accept Consent

- Read terms
- Click "I accept"

### Step 3: Fill Symptom Form

```
Primary Symptoms: "I have a sore throat and cough for 2 days"
Severity: "Moderate"
Age: 28
Onset: "2 days ago"
Duration: "constant"
Pregnancy: "Not pregnant"
(Other fields optional)
```

- Click "Run Symptom Assessment"

### Step 4: View Results

- Wait 2-5 seconds for AI analysis
- See:
  - 🏷️ **Triage Level** (Self-care, See Doctor, Urgent, Emergency)
  - 💊 **Medications** (OTC suggestions with doses)
  - 🌿 **Home Remedies** (Non-medication care)
  - ✅ **What To Do** (Positive actions)
  - ❌ **What Not To Do** (Warnings)
  - 📊 **Confidence Score** (Visual bar)

## 3️⃣ **Where's My Data?**

### Supabase Console

1. Go to: https://app.supabase.com/
2. Navigate to: `AI-Health-Assistant` project
3. View tables:
   - `symptom_sessions` → Contains AI results in `recommendations` column
   - `consent_records` → Tracks user consent
   - `report_files` → Medical documents uploaded

### Check Specific Session

In Supabase SQL Editor:

```sql
SELECT
  id,
  triage_level,
  confidence_score,
  recommendations
FROM symptom_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
```

## 4️⃣ **Debugging**

### Open Browser Console

- Press `F12` or `Ctrl+Shift+I`
- Go to "Console" tab
- Look for logs like:
  ```
  ✅ AI analysis complete: {triage_level: "self-care", medicines: 3, ...}
  ✅ Session updated successfully with session ID: [uuid]
  ```

### Common Issues

**❌ "Assessment is ready but no output displayed"**

- Check console for errors
- Verify Supabase connection
- Reload page

**❌ "API key error"**

- Check console for: `❌ Gemini API error` or `❌ OpenAI API error`
- Verify API keys in `src/lib/aiService.ts` lines 1-2
- Check API quotas/limits

**❌ "Failed to fetch session"**

- Check database table `symptom_sessions` exists
- Verify Supabase migrations were applied
- Check browser console for exact error

## 5️⃣ **Files You Modified**

### Core Files Updated Today:

1. **`src/lib/aiService.ts`**

   - ✅ Fixed API response parsing
   - ✅ Added comprehensive fallback
   - ✅ Improved error logging
   - ✅ Added recommendation validation

2. **`src/components/SymptomForm.tsx`**

   - ✅ Added AI call debugging
   - ✅ Better error messages
   - ✅ Proper data logging

3. **`src/components/ResultsDisplay.tsx`**

   - ✅ Fixed polling mechanism
   - ✅ Added session data logging
   - ✅ Fixed recommendations display
   - ✅ Proper TypeScript types

4. **`WORKFLOW.md`** (NEW)
   - Complete data flow documentation
   - Database schema explained
   - API integration details

## 6️⃣ **What Gets Stored?**

Every time user submits symptoms:

```
symptom_sessions table receives:
├── id: UUID
├── user_id: Who submitted
├── symptoms_text: "sore throat..."
├── severity: "moderate"
├── age: 28
├── triage_level: "self-care" ← FROM AI
├── triage_reason: "Minor cold symptoms..." ← FROM AI
├── confidence_score: 0.87 ← FROM AI (0.0-1.0)
└── recommendations: { ← FROM AI (JSONB)
    ├── medicines: [{name, dose, notes}...]
    ├── home_remedies: [strings...]
    ├── what_to_do: [strings...]
    ├── what_not_to_do: [strings...]
    └── disclaimer: "Educational only..."
```

## 7️⃣ **Why Results Aren't Showing?**

### Checklist:

1. ✅ Form submitted (see "Session updated successfully" in console)
2. ✅ ResultsDisplay mounted (see polling logs)
3. ✅ Database has `recommendations` data (check Supabase)
4. ✅ Recommendations object has arrays (medicines, remedies, etc.)
5. ✅ No TypeScript errors (check terminal output)

### Debug Steps:

```javascript
// In browser console, paste:
localStorage.getItem("apna-session-id"); // Get session ID

// Then query Supabase:
// SQL: SELECT recommendations FROM symptom_sessions WHERE id = '[paste-id]'
```

## 8️⃣ **Important API Info**

### Gemini API

- Tries first (faster, often better)
- Model: `gemini-pro`
- Key: `AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY`

### OpenAI API

- Fallback if Gemini fails
- Model: `gpt-3.5-turbo`
- Key: `sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop`

### Fallback Response

- Both APIs fail → Generic recommendations returned
- Confidence: 0.35 (vs 0.7-0.95 from AI)

## 9️⃣ **Expected User Experience**

```
1. Sign Up (2 min)
   ↓
2. Accept Consent (30 sec)
   ↓
3. Fill Form (2-3 min)
   ↓
4. Submit (instant)
   ↓
5. See Loading Spinner (2-5 sec)
   ↓
6. Results Display (instant)
   ├── Triage Card
   ├── Medications
   ├── Home Remedies
   ├── Action Items
   └── Warnings
```

## 🔟 **Environment Variables**

File: `.env.local` (already exists in project root)

```env
VITE_SUPABASE_URL=https://pfduadihoswvnemdqnek.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EL2CoNOCmyy5vQH_KQNZ5w_aplCV5sY
```

API keys are in `src/lib/aiService.ts` (hardcoded for dev)

---

## ✅ ALL SYSTEMS GO!

Your website is now fully configured to:

- Accept symptom input ✅
- Call Gemini/OpenAI AI ✅
- Store results in Supabase ✅
- Display formatted recommendations ✅
- Handle errors gracefully ✅

**Test it now at:** http://localhost:8081/
