# 🧪 API Testing & Debugging Guide

## Test AI APIs Directly

### 1️⃣ Test Gemini API

**Via Browser Console:**

```javascript
const GEMINI_API_KEY = "AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY";

fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'You are a medical assistant. Return ONLY JSON: {"triage_level": "self-care", "triage_reason": "Test", "recommendations": {"medicines": [], "home_remedies": ["Rest"], "what_to_do": [], "what_not_to_do": []}, "confidence_score": 0.8, "disclaimer": "Educational"}',
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  }
)
  .then((r) => r.json())
  .then((d) => console.log("Gemini Response:", d))
  .catch((e) => console.error("Gemini Error:", e));
```

**Via PowerShell:**

```powershell
$uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY"

$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "Return only JSON: {""triage_level"": ""self-care"", ""confidence_score"": 0.8}" }
            )
        }
    )
    generationConfig = @{
        temperature = 0.2
        maxOutputTokens = 1024
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri $uri -Method Post -Headers @{"Content-Type"="application/json"} -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

### 2️⃣ Test OpenAI API

**Via Browser Console:**

```javascript
const OPENAI_API_KEY = "sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop";

fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a medical triage assistant. Respond ONLY with valid JSON.",
      },
      {
        role: "user",
        content:
          'Patient has mild headache. Return JSON: {"triage_level": "self-care", "recommendations": {"medicines": [], "home_remedies": ["Rest"], "what_to_do": [], "what_not_to_do": []}, "confidence_score": 0.8}',
      },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  }),
})
  .then((r) => r.json())
  .then((d) => console.log("OpenAI Response:", d))
  .catch((e) => console.error("OpenAI Error:", e));
```

**Via PowerShell:**

```powershell
$uri = "https://api.openai.com/v1/chat/completions"
$headers = @{
    "Authorization" = "Bearer sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop"
    "Content-Type" = "application/json"
}

$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{ role = "system"; content = "You are a medical assistant. Respond only in JSON." },
        @{ role = "user"; content = "Return: {""triage_level"": ""self-care""}" }
    )
    temperature = 0.2
    max_tokens = 1024
} | ConvertTo-Json

Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

## 🔍 Database Testing

### Check Session Data

**Supabase SQL Editor:**

```sql
-- View all your sessions
SELECT
  id,
  created_at,
  triage_level,
  confidence_score,
  recommendations
FROM symptom_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
```

**Check Specific Recommendation:**

```sql
-- View medications from latest session
SELECT
  id,
  triage_level,
  (recommendations ->> 'medicines')::jsonb as medicines,
  (recommendations ->> 'home_remedies')::jsonb as home_remedies
FROM symptom_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
```

**Verify RLS Policy:**

```sql
-- Check if you can see your own sessions
SELECT COUNT(*) FROM symptom_sessions;
-- Should show your sessions only (not others')
```

---

## 📊 Response Format Testing

### Gemini Expected Response:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"triage_level\": \"self-care\", \"triage_reason\": \"Mild symptoms\", \"recommendations\": {\"medicines\": [{\"name\": \"Ibuprofen\", \"dose\": \"400mg\"}], \"home_remedies\": [\"Rest\"], \"what_to_do\": [\"Monitor\"], \"what_not_to_do\": [\"Ignore\"]}, \"confidence_score\": 0.85, \"disclaimer\": \"Educational\"}"
          }
        ]
      }
    }
  ]
}
```

### OpenAI Expected Response:

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"triage_level\": \"self-care\", \"triage_reason\": \"Mild symptoms\", \"recommendations\": {\"medicines\": [{\"name\": \"Ibuprofen\", \"dose\": \"400mg\"}], \"home_remedies\": [\"Rest\"], \"what_to_do\": [\"Monitor\"], \"what_not_to_do\": [\"Ignore\"]}, \"confidence_score\": 0.85, \"disclaimer\": \"Educational\"}"
      }
    }
  ]
}
```

---

## 🐛 Debugging Checklist

### API Call Fails?

```javascript
// In browser console, check:
1. API key present:
   "AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY".length > 0  // true?
   "sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop".length > 0  // true?

2. Check CORS:
   // If error: "Access to XMLHttpRequest blocked by CORS"
   // API might not allow frontend calls (normal)

3. Check quota:
   // If error: "401 Unauthorized" or "403 Forbidden"
   // API key might be invalid/revoked

4. Check response format:
   // If response is HTML (error page), API endpoint wrong
```

### Recommendations Not Displaying?

```javascript
// In browser console:
// 1. Get session ID from localStorage
let sessionId = localStorage.getItem("apna-session-id");

// 2. Check if data in database (you need to query Supabase)
// Go to Supabase console and run:
// SELECT recommendations FROM symptom_sessions WHERE id = '[sessionId]'

// 3. Check if component received data
// Add breakpoint in ResultsDisplay.tsx at line: setSession(data)
```

---

## 🧬 JSON Validation

### Validate Recommendation JSON

```javascript
// Copy this into browser console
const sampleResponse = {
  triage_level: "self-care",
  triage_reason: "Your symptoms suggest...",
  recommendations: {
    medicines: [
      {
        name: "Ibuprofen",
        dose: "400mg every 6 hours",
        notes: "For pain",
        evidence_level: "Strong",
      },
    ],
    home_remedies: [
      "Rest at least 8 hours daily",
      "Drink 2-3 liters of water",
      "Use a humidifier",
    ],
    what_to_do: ["Monitor your temperature", "Contact doctor if worse"],
    what_not_to_do: ["Don't ignore high fever", "Don't skip medications"],
  },
  confidence_score: 0.85,
  disclaimer: "This is educational only...",
};

// Validate structure
console.assert(sampleResponse.triage_level, "Missing triage_level");
console.assert(
  sampleResponse.recommendations.medicines?.length > 0,
  "Missing medicines"
);
console.assert(
  sampleResponse.confidence_score > 0 && sampleResponse.confidence_score <= 1,
  "Invalid confidence score"
);

console.log("✅ JSON structure valid!");
```

---

## 🚀 Full End-to-End Test Script

```javascript
// Paste entire script in browser console

async function testAIHealthAssistant() {
  console.log("🧪 Starting full test...\n");

  // Test 1: Gemini API
  console.log("1️⃣ Testing Gemini API...");
  try {
    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Return only: {"triage_level": "self-care", "confidence_score": 0.8}',
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
        }),
      }
    );

    if (gRes.ok) {
      console.log("   ✅ Gemini API working");
    } else {
      console.log("   ❌ Gemini API error:", gRes.status);
    }
  } catch (e) {
    console.log("   ❌ Gemini error:", e.message);
  }

  // Test 2: OpenAI API
  console.log("\n2️⃣ Testing OpenAI API...");
  try {
    const oRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: 'Return: {"status": "ok"}' }],
        max_tokens: 100,
      }),
    });

    if (oRes.ok) {
      console.log("   ✅ OpenAI API working");
    } else {
      console.log("   ❌ OpenAI API error:", oRes.status);
    }
  } catch (e) {
    console.log("   ❌ OpenAI error:", e.message);
  }

  // Test 3: Supabase connection
  console.log("\n3️⃣ Testing Supabase connection...");
  try {
    const { supabase } = await import("../../integrations/supabase/client.ts");
    const { data } = await supabase
      .from("symptom_sessions")
      .select("id")
      .limit(1);
    console.log("   ✅ Supabase connected");
  } catch (e) {
    console.log("   ❌ Supabase error:", e.message);
  }

  console.log("\n✅ Test complete!");
}

testAIHealthAssistant();
```

---

## 📈 Performance Metrics

### Expected Timings:

- Form validation: < 100ms
- Session creation: < 200ms
- AI API call: 2-5 seconds
- Database update: < 200ms
- Results polling: 1 second intervals
- **Total submission → results: 3-7 seconds**

---

## 🆘 Error Messages Reference

| Error                     | Cause                         | Solution                          |
| ------------------------- | ----------------------------- | --------------------------------- |
| `401 Unauthorized`        | Invalid API key               | Check key in aiService.ts         |
| `403 Forbidden`           | API key revoked               | Generate new key from API console |
| `500 Internal Server`     | API overloaded                | Retry in few seconds              |
| `CORS blocked`            | Frontend → API call blocked   | Normal for some APIs              |
| `No JSON found`           | Response not JSON             | Check API response format         |
| `Failed to fetch session` | Supabase down                 | Check Supabase status             |
| `RLS policy violation`    | Trying to access other's data | Check user_id filter              |

---

## 💡 Tips

1. **Test APIs before deployment**

   - Use provided scripts above
   - Verify responses match expected format

2. **Monitor costs**

   - Gemini: Free tier available
   - OpenAI: Pay-per-use (~$0.002 per analysis)
   - Supabase: Free tier sufficient for dev

3. **Cache responses**

   - Consider caching common symptoms
   - Reduces API calls & costs

4. **Rate limiting**
   - Implement per-user limits
   - Prevent API abuse

---

**For issues not covered here, check console logs for specific error messages!**
