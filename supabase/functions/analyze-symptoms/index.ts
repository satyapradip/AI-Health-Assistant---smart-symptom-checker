import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a medical triage assistant for an educational demonstration tool. Your role is to analyze symptoms and provide structured health guidance following strict safety rules.

CRITICAL SAFETY RULES:
1. EMERGENCY DETECTION (MUST return emergency triage for these):
   - Chest pain or pressure
   - Severe difficulty breathing
   - Uncontrolled bleeding
   - Sudden weakness/numbness (especially one-sided)
   - Slurred speech or confusion
   - Loss of consciousness
   - Severe allergic reaction (anaphylaxis)
   - Severe burns

2. AUTOMATIC ESCALATION:
   - Age < 2 or > 65: conservative triage
   - Pregnant: escalate one level minimum
   - Severe comorbidities: conservative approach
   - Any uncertainty: escalate triage level

3. MEDICATION RULES:
   - ONLY suggest OTC medications (no prescription drugs)
   - Include dosing ONLY for common OTC meds
   - Check allergies before suggesting anything
   - If prescription needed, advise seeing doctor

4. OUTPUT FORMAT (JSON only, no additional text):
{
  "triage_level": "emergency" | "urgent-visit" | "see-doctor" | "self-care",
  "triage_reason": "Brief explanation of triage decision",
  "recommendations": {
    "medicines": [{"name": "", "dose": "", "notes": "", "evidence_level": ""}],
    "home_remedies": ["..."],
    "what_to_do": ["..."],
    "what_not_to_do": ["..."]
  },
  "report_findings": [{"field": "", "value": "", "unit": "", "interpretation": ""}],
  "follow_up": {
    "when_to_see_provider": "",
    "suggested_doctor_type": ""
  },
  "confidence_score": 0.0,
  "sources": ["..."],
  "disclaimer": "This is an educational tool only and not medical advice. Always consult healthcare professionals."
}

If triage_level is "emergency", return ONLY emergency CTA with no medicines/remedies.`;

const FEW_SHOT_EXAMPLES = [
  {
    scenario: "Chest pain",
    response: {
      triage_level: "emergency",
      triage_reason: "Chest pain requires immediate evaluation to rule out heart attack or other life-threatening conditions.",
      recommendations: {
        medicines: [],
        home_remedies: [],
        what_to_do: ["Call emergency services immediately", "Do not drive yourself"],
        what_not_to_do: ["Do not wait to see if it passes", "Do not take aspirin unless directed by emergency services"]
      },
      follow_up: {
        when_to_see_provider: "NOW - Call 911",
        suggested_doctor_type: "Emergency Medicine"
      },
      confidence_score: 1.0,
      disclaimer: "This is an educational tool only and not medical advice. CALL EMERGENCY SERVICES NOW."
    }
  },
  {
    scenario: "Mild fever 100.4F, mild sore throat, 28yo, no conditions",
    response: {
      triage_level: "self-care",
      triage_reason: "Mild cold/flu symptoms in healthy adult, manageable at home with monitoring.",
      recommendations: {
        medicines: [
          { name: "Acetaminophen (Tylenol)", dose: "500mg every 6 hours as needed", notes: "For fever reduction", evidence_level: "Strong" },
          { name: "Ibuprofen (Advil)", dose: "400mg every 6-8 hours as needed", notes: "Alternative for fever/pain", evidence_level: "Strong" }
        ],
        home_remedies: ["Rest", "Stay hydrated", "Gargle warm salt water", "Use humidifier"],
        what_to_do: ["Monitor temperature", "Rest for 24-48 hours", "Drink plenty of fluids"],
        what_not_to_do: ["Do not take antibiotics without prescription", "Avoid alcohol"]
      },
      follow_up: {
        when_to_see_provider: "If fever >103F, symptoms worsen after 3 days, or difficulty breathing develops",
        suggested_doctor_type: "Primary Care Physician"
      },
      confidence_score: 0.85,
      disclaimer: "This is an educational tool only and not medical advice. Consult healthcare professionals for medical concerns."
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, symptoms, reportData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build the analysis prompt
    let userPrompt = `Analyze these symptoms and provide structured guidance:\n\n`;
    userPrompt += `Symptoms: ${symptoms.symptoms_text}\n`;
    userPrompt += `Severity: ${symptoms.severity}\n`;
    userPrompt += `Age: ${symptoms.age}\n`;
    
    if (symptoms.onset) userPrompt += `Onset: ${symptoms.onset}\n`;
    if (symptoms.duration) userPrompt += `Duration: ${symptoms.duration}\n`;
    if (symptoms.existing_conditions) userPrompt += `Existing conditions: ${symptoms.existing_conditions}\n`;
    if (symptoms.current_medications) userPrompt += `Current medications: ${symptoms.current_medications}\n`;
    if (symptoms.allergies) userPrompt += `Allergies: ${symptoms.allergies}\n`;
    if (symptoms.is_pregnant) userPrompt += `Patient is pregnant\n`;
    
    if (reportData) {
      userPrompt += `\nMedical Report Data:\n${JSON.stringify(reportData, null, 2)}\n`;
    }

    // Build the full prompt with system instructions and examples
    const fullPrompt = `${SYSTEM_PROMPT}\n\nExamples:\n\nExample 1:\nScenario: ${FEW_SHOT_EXAMPLES[0].scenario}\nResponse: ${JSON.stringify(FEW_SHOT_EXAMPLES[0].response)}\n\nExample 2:\nScenario: ${FEW_SHOT_EXAMPLES[1].scenario}\nResponse: ${JSON.stringify(FEW_SHOT_EXAMPLES[1].response)}\n\nNow analyze:\n${userPrompt}`;

    // Call Gemini API directly
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.candidates[0].content.parts[0].text;
    
    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error("Failed to parse AI response:", analysisText);
      throw new Error("Invalid AI response format");
    }

    // Update session with results
    const { error: updateError } = await supabase
      .from("symptom_sessions")
      .update({
        triage_level: analysis.triage_level,
        triage_reason: analysis.triage_reason,
        confidence_score: analysis.confidence_score,
        recommendations: analysis.recommendations,
      })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    // Log to audit trail
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get("Authorization")?.replace("Bearer ", "") || ""
    );

    if (user) {
      await supabase.from("llm_audit_log").insert({
        session_id: sessionId,
        user_id: user.id,
        prompt_data: { symptoms, reportData },
        response_data: analysis,
        model_used: "gemini-2.0-flash-exp",
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-symptoms:", error);
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});