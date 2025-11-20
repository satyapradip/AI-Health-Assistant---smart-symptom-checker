import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Baby, EyeOff, HeartPulse, Loader2, ShieldCheck, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import ResultsDisplay from "./ResultsDisplay";

const symptomSchema = z.object({
  symptoms_text: z.string().min(10, "Please describe your symptoms in at least 10 characters"),
  severity: z.string().min(1, "Please select severity"),
  age: z.number().min(1).max(120),
});

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
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus>("not");

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
      const validatedData = symptomSchema.parse({
        symptoms_text: formData.symptoms_text,
        severity: formData.severity,
        age: parseInt(formData.age),
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      // Create symptom session
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

      // Upload file if present
      let fileData = null;
      if (uploadedFile) {
        const fileName = `${user.id}/${Date.now()}-${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-reports")
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: fileRecord, error: fileError } = await supabase
          .from("report_files")
          .insert({
            session_id: sessionData.id,
            user_id: user.id,
            file_name: uploadedFile.name,
            file_path: fileName,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
          })
          .select()
          .single();

        if (fileError) throw fileError;
        fileData = fileRecord;

        // Trigger OCR processing
        const { error: ocrError } = await supabase.functions.invoke("process-ocr", {
          body: { fileId: fileRecord.id },
        });

        if (ocrError) console.error("OCR processing error:", ocrError);
      }

      // Call analysis function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-symptoms",
        {
          body: {
            sessionId: sessionData.id,
            symptoms: {
              symptoms_text: validatedData.symptoms_text,
              severity: validatedData.severity,
              onset: formData.onset,
              duration: formData.duration,
              existing_conditions: formData.existing_conditions,
              current_medications: formData.current_medications,
              allergies: formData.allergies,
              age: validatedData.age,
              is_pregnant: formData.is_pregnant,
            },
            reportData: fileData?.parsed_data,
          },
        }
      );

      if (analysisError) throw analysisError;

      setSessionId(sessionData.id);
      toast.success("Analysis completed!");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to submit symptoms");
      }
    } finally {
      setLoading(false);
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-up">
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Symptom Assessment</CardTitle>
              <CardDescription>
                A refined clinical interface where AI evaluates your symptoms with clarity and empathy.
              </CardDescription>
            </div>
            <div className="rounded-full border border-white/50 bg-white/70 px-4 py-1 text-xs uppercase tracking-[0.35em] text-foreground/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              Avg. completion • 02 min
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="symptoms" className="text-sm uppercase tracking-[0.3em] text-foreground/60">
              Primary Symptoms *
            </Label>
            <Textarea
              id="symptoms"
              placeholder="Describe your sensations, location, intensity, triggers, and patterns…"
              value={formData.symptoms_text}
              onChange={(e) => setFormData({ ...formData, symptoms_text: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-sm uppercase tracking-[0.3em] text-foreground/60">
                Severity *
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="significant">Significant</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="emergency-level">Emergency-level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm uppercase tracking-[0.3em] text-foreground/60">
                Age *
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Your age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="onset">When did symptoms start?</Label>
              <Input
                id="onset"
                placeholder="When did symptoms begin? e.g., 2 days ago, this morning, sudden onset."
                value={formData.onset}
                onChange={(e) => setFormData({ ...formData, onset: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="constant, intermittent, recurring, worsening, improving"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions" className="text-sm uppercase tracking-[0.3em] text-foreground/60">
              Existing Medical Conditions
            </Label>
            <Input
              id="conditions"
              placeholder="Diabetes, hypertension, asthma, thyroid disorders…"
              value={formData.existing_conditions}
              onChange={(e) => setFormData({ ...formData, existing_conditions: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medications" className="text-sm uppercase tracking-[0.3em] text-foreground/60">
              Current Medications
            </Label>
            <Input
              id="medications"
              placeholder="Prescriptions, OTC drugs, supplements, inhalers…"
              value={formData.current_medications}
              onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies" className="text-sm uppercase tracking-[0.3em] text-foreground/60">
              Allergies
            </Label>
            <Input
              id="allergies"
              placeholder="Drug, food, environmental allergies…"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            />
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-white/50 bg-white/70 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/10">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">
                Pregnancy Status (Optional)
              </p>
              <p className="text-sm text-foreground/70">
                Select the option that best reflects your current status.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pregnancyOptions.map((option) => {
                const active = pregnancyStatus === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handlePregnancySelect(option.id)}
                    className={cn(
                      "lift-on-hover flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                      active
                        ? "border-primary/40 bg-primary/5 shadow-[0_18px_50px_rgba(12,32,62,0.18)]"
                        : "border-white/60 bg-white/60 text-foreground/70 shadow-[0_10px_30px_rgba(12,32,62,0.08)] dark:border-white/15 dark:bg-white/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/15 dark:bg-white/10",
                        active && "border-transparent bg-gradient-to-br from-primary to-secondary text-white",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-sm text-foreground/65">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Medical Reports (Optional)</CardTitle>
          <CardDescription>
            Securely add lab reports, imaging, or prescriptions (JPG, PNG, or PDF · max 10MB) for contextual review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="group rounded-3xl border border-dashed border-white/60 bg-white/70 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition hover:border-primary/40 hover:bg-white">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary shadow-[0_20px_55px_rgba(15,23,42,0.16)]">
                <Upload className="h-10 w-10" />
              </div>
              {uploadedFile ? (
                <div>
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-foreground/60">JPG, PNG, or PDF (max 10MB)</p>
                </div>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 rounded-3xl border border-destructive/35 bg-destructive/10 p-5 text-sm text-foreground shadow-[0_12px_45px_rgba(124,45,45,0.15)]">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">Emergency Guidance</p>
          <p className="text-foreground/80">
            Chest pain, severe breathing difficulty, heavy bleeding, sudden confusion, or loss of consciousness
            require immediate attention. Contact emergency services before using this assessment.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full text-base" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reviewing…
          </>
        ) : (
          "Run Symptom Assessment"
        )}
      </Button>
    </form>
  );
};

export default SymptomForm;