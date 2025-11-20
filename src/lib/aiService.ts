// API service for AI analysis using Gemini and OpenAI
const GEMINI_API_KEY = "AIzaSyCqvLtWdlHts1zDgLAhDpeUUODKk16sMaY";
const OPENAI_API_KEY = "sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop";

export interface SymptomAnalysisRequest {
  symptoms_text: string;
  severity: string;
  onset?: string;
  duration?: string;
  existing_conditions?: string;
  current_medications?: string;
  allergies?: string;
  age: number;
  is_pregnant: boolean;
}

export interface AnalysisResponse {
  triage_level: string;
  triage_reason: string;
  recommendations: {
    medicines: Array<{ name: string; dose?: string; notes?: string; evidence_level?: string }>;
    home_remedies: string[];
    what_to_do: string[];
    what_not_to_do: string[];
  };
  confidence_score: number;
  disclaimer: string;
}

function buildPrompt(symptoms: SymptomAnalysisRequest): string {
  const prompt = `You are a medical triage assistant for an educational demonstration tool. Analyze the following symptoms and provide structured health guidance.

SYMPTOM INFORMATION:
- Primary Symptoms: ${symptoms.symptoms_text}
- Severity Level: ${symptoms.severity}
- Patient Age: ${symptoms.age}
${symptoms.onset ? `- Symptom Onset: ${symptoms.onset}` : ""}
${symptoms.duration ? `- Duration: ${symptoms.duration}` : ""}
${symptoms.existing_conditions ? `- Existing Conditions: ${symptoms.existing_conditions}` : ""}
${symptoms.current_medications ? `- Current Medications: ${symptoms.current_medications}` : ""}
${symptoms.allergies ? `- Allergies: ${symptoms.allergies}` : ""}
${symptoms.is_pregnant ? "- Patient is pregnant" : ""}

CRITICAL SAFETY GUIDELINES:
1. If patient mentions chest pain, severe difficulty breathing, uncontrolled bleeding, sudden numbness, confusion, or loss of consciousness - return EMERGENCY triage only.
2. For ages < 2 or > 65, be conservative and escalate triage level.
3. For pregnant patients, automatically escalate at least one level.
4. ONLY suggest OTC medications - never prescribe medications.
5. If unsure about anything, escalate the triage level.

REQUIRED JSON RESPONSE FORMAT (RESPOND ONLY WITH VALID JSON, NO MARKDOWN):
{
  "triage_level": "emergency" | "urgent-visit" | "see-doctor" | "self-care",
  "triage_reason": "Brief explanation of the triage decision",
  "recommendations": {
    "medicines": [
      {
        "name": "OTC medication name",
        "dose": "dose and frequency",
        "notes": "why this medication",
        "evidence_level": "Strong/Moderate/Supportive"
      }
    ],
    "home_remedies": ["remedy 1", "remedy 2"],
    "what_to_do": ["action 1", "action 2"],
    "what_not_to_do": ["avoid 1", "avoid 2"]
  },
  "confidence_score": 0.0 to 1.0,
  "disclaimer": "This is an educational tool only and not medical advice. Always consult healthcare professionals."
}

Remember: For emergencies, return only emergency triage with minimal recommendations.`;

  return prompt;
}

async function analyzeWithGemini(symptoms: SymptomAnalysisRequest): Promise<AnalysisResponse | null> {
  try {
    console.log("Attempting Gemini API call...");
    const prompt = buildPrompt(symptoms);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            topP: 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No content in Gemini response");
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response:", content);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("✅ Gemini analysis successful with recommendations:", {
      triage: result.triage_level,
      medicines: result.recommendations?.medicines?.length || 0,
      remedies: result.recommendations?.home_remedies?.length || 0,
    });
    return result;
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    return null;
  }
}

async function analyzeWithOpenAI(symptoms: SymptomAnalysisRequest): Promise<AnalysisResponse | null> {
  try {
    console.log("Attempting OpenAI API call...");
    const prompt = buildPrompt(symptoms);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "You are a medical triage assistant for an educational demo. Respond ONLY with valid JSON, no markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ OpenAI API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in OpenAI response");
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in OpenAI response:", content);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("✅ OpenAI analysis successful with recommendations:", {
      triage: result.triage_level,
      medicines: result.recommendations?.medicines?.length || 0,
      remedies: result.recommendations?.home_remedies?.length || 0,
    });
    return result;
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    return null;
  }
}

function ensureCompleteResponse(result: Record<string, unknown>): AnalysisResponse {
  const recs = result.recommendations as Record<string, unknown> | undefined;
  
  return {
    triage_level: (result.triage_level as string) || "see-doctor",
    triage_reason: (result.triage_reason as string) || "Assessment completed based on provided information",
    recommendations: {
      medicines: Array.isArray(recs?.medicines) 
        ? (recs.medicines as Array<Record<string, unknown>>).map((med) => ({
            name: (med.name as string) || "Unknown medication",
            dose: (med.dose as string) || undefined,
            notes: (med.notes as string) || undefined,
            evidence_level: (med.evidence_level as string) || undefined,
          }))
        : [],
      home_remedies: Array.isArray(recs?.home_remedies) 
        ? (recs.home_remedies as string[])
        : [],
      what_to_do: Array.isArray(recs?.what_to_do) 
        ? (recs.what_to_do as string[])
        : [],
      what_not_to_do: Array.isArray(recs?.what_not_to_do) 
        ? (recs.what_not_to_do as string[])
        : [],
    },
    confidence_score: typeof result.confidence_score === "number" 
      ? Math.min(Math.max(result.confidence_score, 0), 1) 
      : 0.5,
    disclaimer: (result.disclaimer as string) || "This is an educational tool only. Always consult with qualified healthcare professionals.",
  };
}

export async function analyzeSymptoms(symptoms: SymptomAnalysisRequest): Promise<AnalysisResponse> {
  console.log("Starting symptom analysis...", {
    symptoms_text: symptoms.symptoms_text.substring(0, 50),
    severity: symptoms.severity,
    age: symptoms.age,
  });

  // Try Gemini first
  let result = await analyzeWithGemini(symptoms);
  
  if (result) {
    console.log("✅ Gemini API successful - returning analysis with recommendations");
    return ensureCompleteResponse(result as unknown as Record<string, unknown>);
  }

  // Fallback to OpenAI
  console.log("⚠️ Gemini failed, trying OpenAI fallback...");
  result = await analyzeWithOpenAI(symptoms);
  
  if (result) {
    console.log("✅ OpenAI API successful - returning analysis with recommendations");
    return ensureCompleteResponse(result as unknown as Record<string, unknown>);
  }

  // If both fail, return comprehensive fallback response
  console.warn("❌ All AI APIs failed, using fallback response with generic recommendations");
  
  const triageMap: Record<string, string> = {
    "emergency-level": "emergency",
    severe: "urgent-visit",
    significant: "see-doctor",
    moderate: "see-doctor",
    mild: "self-care",
  };
  
  return {
    triage_level: triageMap[symptoms.severity] || "see-doctor",
    triage_reason: `Based on reported ${symptoms.severity} symptoms: ${symptoms.symptoms_text.substring(0, 80)}... Professional medical consultation recommended.`,
    recommendations: {
      medicines: [
        { name: "Consult a pharmacist", dose: "Before any OTC medication", notes: "To avoid drug interactions" },
      ],
      home_remedies: [
        "Rest and adequate sleep",
        "Stay well hydrated with water or electrolyte beverages",
        "Monitor symptom progression",
        "Maintain comfortable room temperature",
        "Track symptom patterns in a log",
      ],
      what_to_do: [
        "Contact a healthcare provider for professional evaluation",
        "Keep a symptom diary with timing and severity",
        "Follow any prescribed treatment from your doctor",
        "Stay informed about your symptoms",
        "Maintain good hygiene practices",
      ],
      what_not_to_do: [
        "Do not self-diagnose or self-treat serious symptoms",
        "Do not ignore worsening symptoms",
        "Do not stop prescribed medications without consulting your doctor",
        "Do not delay seeking professional help if symptoms escalate",
      ],
    },
    confidence_score: 0.35,
    disclaimer: "This fallback assessment is for educational purposes only. Please consult with qualified healthcare professionals for accurate diagnosis and treatment.",
  };
}
