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
  "confidence_score": 0.0,
  "sources": ["..."],
  "disclaimer": "This is an educational tool only and not medical advice. Always consult healthcare professionals."
}

If triage_level is "emergency", return ONLY emergency CTA with no medicines/remedies.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, symptoms, reportData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

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

    let analysis;
    
    // Try Gemini API first
    if (geminiApiKey) {
      try {
        console.log("Using Gemini API for analysis");
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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
                      text: `${SYSTEM_PROMPT}\n\nUser Query:\n${userPrompt}\n\nRespond ONLY with valid JSON, no markdown or additional text.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          try {
            // Try to parse JSON from response
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No JSON found in response");
            }
          } catch (e) {
            console.error("Failed to parse Gemini response as JSON, trying OpenAI");
            throw new Error("Gemini parsing failed");
          }
        } else {
          console.error("Gemini API error, trying OpenAI");
          throw new Error("Gemini API failed");
        }
      } catch (error) {
        console.log("Gemini failed, attempting OpenAI:", error);
        // Continue to OpenAI
      }
    }

    // Fallback to OpenAI if Gemini failed or not available
    if (!analysis && openaiApiKey) {
      try {
        console.log("Using OpenAI API for analysis");
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const analysisText = openaiData.choices?.[0]?.message?.content || "";
          
          try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No JSON found in response");
            }
          } catch (e) {
            console.error("Failed to parse OpenAI response as JSON");
            throw new Error("OpenAI response parsing failed");
          }
        } else {
          throw new Error("OpenAI API failed");
        }
      } catch (error) {
        console.error("OpenAI failed:", error);
        throw error;
      }
    }

    // If no API keys available
    if (!analysis) {
      throw new Error("No AI API keys configured");
    }

    // Ensure all required fields are present
    if (!analysis.triage_level) analysis.triage_level = "see-doctor";
    if (!analysis.triage_reason) analysis.triage_reason = "Assessment completed";
    if (!analysis.recommendations) analysis.recommendations = { medicines: [], home_remedies: [], what_to_do: [], what_not_to_do: [] };
    if (!analysis.confidence_score) analysis.confidence_score = 0.7;
    if (!analysis.disclaimer) analysis.disclaimer = "This is an educational tool only and not medical advice. Always consult healthcare professionals.";

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

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-symptoms:", error);
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        triage_level: "see-doctor",
        triage_reason: "Please consult a healthcare professional",
        recommendations: { medicines: [], home_remedies: [], what_to_do: [], what_not_to_do: [] },
        confidence_score: 0,
        disclaimer: "This is an educational tool only."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});