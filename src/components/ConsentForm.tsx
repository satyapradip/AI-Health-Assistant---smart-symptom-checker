import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConsentFormProps {
  onConsentGiven: () => void;
}

const ConsentForm = ({ onConsentGiven }: ConsentFormProps) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const consentText = `I understand and acknowledge that:

1. This AI Health Assistant is a DEMONSTRATION TOOL for educational purposes only
2. This tool does NOT provide medical advice, diagnosis, or treatment
3. I should NOT use this tool for emergencies - call emergency services immediately
4. All information provided is for educational purposes and should not replace professional medical consultation
5. I will consult with qualified healthcare professionals for any medical concerns
6. The developers and operators of this tool are not liable for any decisions made based on its output
7. This is a hackathon project and not approved for clinical use
8. My data will be stored securely for the purpose of providing this service`;

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error("Please agree to the terms to continue");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      const { error } = await supabase.from("consent_records").insert({
        user_id: user.id,
        consent_given: true,
        consent_text: consentText,
        ip_address: null,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      toast.success("Consent recorded successfully");
      onConsentGiven();
    } catch (error: any) {
      console.error("Error recording consent:", error);
      toast.error("Failed to record consent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-destructive" />
            Important: Terms & Consent
          </CardTitle>
          <CardDescription>
            Please read and acknowledge the following before using this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>EMERGENCY DISCLAIMER:</strong> If you are experiencing a medical emergency
              (chest pain, difficulty breathing, severe bleeding, loss of consciousness, etc.),
              call emergency services immediately. Do NOT use this tool.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-muted rounded-lg">
            <pre className="text-sm whitespace-pre-wrap font-sans">{consentText}</pre>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="consent"
              className="text-sm leading-relaxed cursor-pointer select-none"
            >
              I have read and agree to the terms above. I understand this is an educational
              demonstration tool only and not a substitute for professional medical advice.
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={!agreed || loading} className="w-full">
            {loading ? "Recording Consent..." : "I Agree - Continue to Health Assistant"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentForm;