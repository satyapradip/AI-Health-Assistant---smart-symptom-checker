import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { z } from "zod";
import ResultsDisplay from "./ResultsDisplay";

const symptomSchema = z.object({
  symptoms_text: z.string().min(10, "Please describe your symptoms in at least 10 characters"),
  severity: z.string().min(1, "Please select severity"),
  age: z.number().min(1).max(120),
});

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
    return <ResultsDisplay sessionId={sessionId} onNewAssessment={() => {
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
    }} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Symptom Assessment</CardTitle>
          <CardDescription>
            Describe your symptoms in detail. The more information you provide, the better the
            assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Primary Symptoms *</Label>
            <Textarea
              id="symptoms"
              placeholder="Describe your symptoms in detail..."
              value={formData.symptoms_text}
              onChange={(e) => setFormData({ ...formData, symptoms_text: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
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
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
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
                placeholder="e.g., 2 days ago"
                value={formData.onset}
                onChange={(e) => setFormData({ ...formData, onset: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., constant, intermittent"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Existing Medical Conditions</Label>
            <Input
              id="conditions"
              placeholder="Diabetes, hypertension, etc."
              value={formData.existing_conditions}
              onChange={(e) => setFormData({ ...formData, existing_conditions: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medications">Current Medications</Label>
            <Input
              id="medications"
              placeholder="List any medications you're taking"
              value={formData.current_medications}
              onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              placeholder="Drug allergies, food allergies, etc."
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pregnant"
              checked={formData.is_pregnant}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_pregnant: checked === true })
              }
            />
            <Label htmlFor="pregnant" className="cursor-pointer">
              Are you pregnant or could you be pregnant?
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Reports (Optional)</CardTitle>
          <CardDescription>
            Upload lab results, X-rays, or other medical reports (JPG, PNG, or PDF, max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              {uploadedFile ? (
                <div>
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, or PDF (max 10MB)</p>
                </div>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-destructive mb-1">Emergency Warning</p>
          <p className="text-foreground">
            If you're experiencing chest pain, difficulty breathing, severe bleeding, loss of
            consciousness, or other emergency symptoms, DO NOT use this tool. Call emergency
            services immediately.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          "Get Health Assessment"
        )}
      </Button>
    </form>
  );
};

export default SymptomForm;