import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSymptoms } from "@/lib/aiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Baby, EyeOff, HeartPulse, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import ResultsDisplay from "./ResultsDisplay";

// --- Validation Schema ---
const symptomSchema = z.object({
  symptoms_text: z.string().min(10, "Please describe your symptoms in at least 10 characters"),
  severity: z.string().min(1, "Please select severity"),
  age: z.number().min(1, "Age is required").max(120, "Invalid age"),
});

// --- Types & Constants ---
type PregnancyStatus = "pregnant" | "maybe" | "not" | "na";

const pregnancyOptions: { id: PregnancyStatus; label: string; description: string; icon: LucideIcon }[] = [
  {
    id: "pregnant",
    label: "I am pregnant",
    description: "Currently pregnant and want the AI to consider it",
    icon: Baby,
  },
  {
    id: "maybe",
    label: "I might be pregnant",
    description: "Possibility of pregnancy or undergoing evaluation",
    icon: HeartPulse,
  },
  {
    id: "not",
    label: "I am not pregnant",
    description: "No current or suspected pregnancy",
    icon: ShieldCheck,
  },
  {
    id: "na",
    label: "Prefer not to say",
    description: "Skip this detail for now",
    icon: EyeOff,
  },
];

const SymptomForm = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus>("not");
  
  const [formData, setFormData] = useState({
    symptoms_text: "",
    onset: "",
    severity: "",
    duration: "",
    existing_conditions: "",
    current_medications: "",
    allergies: "",
    age: "",
    is_pregnant: false,
  });

  // --- Handlers ---

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a JPG, PNG, or PDF file");
        return;
      }

      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setUploadedFile(file);
      toast.success("File selected");
    }
  };

  const handlePregnancySelect = (status: PregnancyStatus) => {
    setPregnancyStatus(status);
    setFormData((prev) => ({
      ...prev,
      is_pregnant: status === "pregnant" || status === "maybe",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      const validatedData = symptomSchema.parse({
        symptoms_text: formData.symptoms_text,
        severity: formData.severity,
        age: parseInt(String(formData.age), 10),
      });

      // Check Auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user ?? null;
      if (!user) {
        toast.error("Please log in to continue");
        setLoading(false);
        return;
      }

      // Create Symptom Session
      const { data: sessionData, error: sessionError } = await supabase
        .from("symptom_sessions")
        .insert({
          user_id: user.id,
          symptoms_text: validatedData.symptoms_text,
          onset: formData.onset,
          severity: validatedData.severity,
          duration: formData.duration,
          existing_conditions: formData.existing_conditions,
          current_medications: formData.current_medications,
          allergies: formData.allergies,
          age: validatedData.age,
          is_pregnant: formData.is_pregnant,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      if (!sessionData?.id) throw new Error("Failed to create symptom session");

      // Handle File Upload
      if (uploadedFile) {
        const safeFileName = `${user.id}/${Date.now()}-${uploadedFile.name.replace(/\s+/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-reports")
          .upload(safeFileName, uploadedFile, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data: fileRecord, error: fileError } = await supabase
          .from("report_files")
          .insert({
            session_id: sessionData.id,
            user_id: user.id,
            file_name: uploadedFile.name,
            file_path: safeFileName,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
          })
          .select()
          .single();

        if (fileError) throw fileError;

        // Trigger OCR
        try {
          await supabase.functions.invoke("process-ocr", {
            body: JSON.stringify({ fileId: fileRecord.id }),
          });
        } catch (fnErr) {
          console.warn("OCR processing not available or failed:", fnErr);
        }
      }

      // AI Analysis
      let analysisData = null;
      try {
        analysisData = await analyzeSymptoms({
          symptoms_text: validatedData.symptoms_text,
          severity: validatedData.severity,
          onset: formData.onset,
          duration: formData.duration,
          existing_conditions: formData.existing_conditions,
          current_medications: formData.current_medications,
          allergies: formData.allergies,
          age: validatedData.age,
          is_pregnant: formData.is_pregnant,
        });
        console.log("✅ Analysis data received:", analysisData);
      } catch (aiErr) {
        console.error("AI service error:", aiErr);
        toast.error("Analysis service temporarily unavailable");
        setLoading(false);
        return;
      }

      if (!analysisData || !analysisData.triage_level) {
        console.error("❌ Invalid analysis data:", analysisData);
        toast.error("Failed to analyze symptoms - invalid response");
        setLoading(false);
        return;
      }

      console.log("💾 Saving analysis to database...", {
        triage_level: analysisData.triage_level,
        triage_reason: analysisData.triage_reason,
        confidence_score: analysisData.confidence_score,
      });

      // Update Session
      const { data: updateData, error: updateError } = await supabase
        .from("symptom_sessions")
        .update({
          triage_level: analysisData.triage_level,
          triage_reason: analysisData.triage_reason,
          confidence_score: analysisData.confidence_score,
          recommendations: analysisData.recommendations,
        })
        .eq("id", sessionData.id)
        .select();

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        throw updateError;
      }

      console.log("✅ Successfully saved to database. Updated row:", updateData);
      setSessionId(sessionData.id);
      toast.success("Analysis completed!");
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors?.[0]?.message ?? "Validation error");
      } else {
        const message = error instanceof Error ? error.message : "Failed to submit symptoms";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

  if (sessionId) {
    return (
      <ResultsDisplay
        sessionId={sessionId}
        onNewAssessment={() => {
          setSessionId(null);
          setFormData({
            symptoms_text: "",
            onset: "",
            severity: "",
            duration: "",
            existing_conditions: "",
            current_medications: "",
            allergies: "",
            age: "",
            is_pregnant: false,
          });
          setUploadedFile(null);
          setPregnancyStatus("not");
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-up max-w-3xl mx-auto">
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Symptoms & Details
          </CardTitle>
          <CardDescription>
            Please describe your symptoms as accurately as possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Describe your symptoms *</Label>
            <Textarea
              id="symptoms"
              placeholder="E.g., Severe headache on the left side, sensitivity to light, nausea..."
              className="min-h-[120px]"
              value={formData.symptoms_text}
              onChange={(e) => handleInputChange("symptoms_text", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="Years"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(val) => handleInputChange("severity", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low (Mild discomfort)</SelectItem>
                  <SelectItem value="Medium">Medium (Manageable pain)</SelectItem>
                  <SelectItem value="High">High (Severe pain/Urgent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="onset">When did it start?</Label>
              <Input
                id="onset"
                placeholder="E.g., 2 days ago, this morning"
                value={formData.onset}
                onChange={(e) => handleInputChange("onset", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="E.g., Continuous, Intermittent"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conditions">Existing Conditions</Label>
            <Input
              id="conditions"
              placeholder="E.g., Diabetes, Hypertension, Asthma"
              value={formData.existing_conditions}
              onChange={(e) => handleInputChange("existing_conditions", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medications">Current Medications</Label>
            <Input
              id="medications"
              placeholder="E.g., Metformin, Ibuprofen"
              value={formData.current_medications}
              onChange={(e) => handleInputChange("current_medications", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              placeholder="E.g., Peanuts, Penicillin"
              value={formData.allergies}
              onChange={(e) => handleInputChange("allergies", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pregnancy Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Pregnancy Status
          </CardTitle>
          <CardDescription>This helps us provide safer recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pregnancyOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = pregnancyStatus === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => handlePregnancySelect(option.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 transition-all hover:border-primary",
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted bg-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{option.label}</h4>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Reports (Optional)
          </CardTitle>
          <CardDescription>Attach medical reports or prescriptions (IMG/PDF, max 10MB).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {uploadedFile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setUploadedFile(null)}
                className="text-destructive hover:text-destructive/90"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing Symptoms...
          </>
        ) : (
          "Analyze Symptoms"
        )}
      </Button>
    </form>
  );
};

export default SymptomForm;