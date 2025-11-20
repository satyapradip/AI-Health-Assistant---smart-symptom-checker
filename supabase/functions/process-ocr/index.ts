import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aiGatewayUrl = Deno.env.get("AI_GATEWAY_URL");
    const aiGatewayApiKey = Deno.env.get("AI_GATEWAY_API_KEY");

    if (!aiGatewayUrl || !aiGatewayApiKey) {
      throw new Error("AI gateway configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get file record
    const { data: fileRecord, error: fileError } = await supabase
      .from("report_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError) throw fileError;

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("medical-reports")
      .download(fileRecord.file_path);

    if (downloadError) throw downloadError;

    // Convert to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use configured AI gateway for OCR and extraction
    const ocrPrompt = `Extract all text and structured data from this medical report. 
    
    Return JSON with:
    {
      "extracted_text": "Full OCR text",
      "structured_data": {
        "lab_values": [{"test": "", "value": "", "unit": "", "reference_range": "", "flag": ""}],
        "dates": [],
        "medications": [],
        "diagnoses": [],
        "vital_signs": {}
      }
    }`;

    const aiResponse = await fetch(aiGatewayUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${aiGatewayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ocrPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileRecord.file_type};base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("OCR processing failed");
    }

    const aiData = await aiResponse.json();
    const ocrText = aiData.choices[0].message.content;

    let parsedData;
    try {
      parsedData = JSON.parse(ocrText);
    } catch (e) {
      // If AI doesn't return valid JSON, store as text
      parsedData = {
        extracted_text: ocrText,
        structured_data: {},
      };
    }

    // Update file record
    const { error: updateError } = await supabase
      .from("report_files")
      .update({
        ocr_status: "completed",
        ocr_text: parsedData.extracted_text,
        parsed_data: parsedData.structured_data,
      })
      .eq("id", fileId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in process-ocr:", error);
    const errorMessage = error instanceof Error ? error.message : "OCR processing failed";
    
    // Mark as failed
    try {
      const body = await req.json().catch(() => ({}));
      const fileId = body?.fileId;
      if (fileId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        
        await supabase
          .from("report_files")
          .update({ ocr_status: "failed" })
          .eq("id", fileId);
      }
    } catch (e) {
      console.error("Failed to mark OCR as failed:", e);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});