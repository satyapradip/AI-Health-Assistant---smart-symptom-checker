import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, CheckCircle, PhoneCall } from "lucide-react";

interface ResultsDisplayProps {
  sessionId: string;
  onNewAssessment: () => void;
}

const ResultsDisplay = ({ sessionId, onNewAssessment }: ResultsDisplayProps) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    const { data, error } = await supabase
      .from("symptom_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) {
      console.error("Error fetching session:", error);
    } else {
      setSession(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load session results</AlertDescription>
      </Alert>
    );
  }

  const getTriageIcon = () => {
    switch (session.triage_level) {
      case "emergency":
        return <PhoneCall className="w-6 h-6 text-emergency" />;
      case "urgent-visit":
        return <AlertTriangle className="w-6 h-6 text-urgent" />;
      case "see-doctor":
        return <AlertCircle className="w-6 h-6 text-warning" />;
      case "self-care":
        return <CheckCircle className="w-6 h-6 text-success" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getTriageBadgeVariant = () => {
    switch (session.triage_level) {
      case "emergency":
        return "destructive";
      case "urgent-visit":
      case "see-doctor":
        return "default";
      case "self-care":
        return "secondary";
      default:
        return "outline";
    }
  };

  const recommendations = session.recommendations || {};

  return (
    <div className="space-y-6">
      {session.triage_level === "emergency" && (
        <Alert variant="destructive" className="border-2">
          <PhoneCall className="h-5 w-5" />
          <AlertDescription className="text-base font-semibold">
            🚨 EMERGENCY: CALL EMERGENCY SERVICES IMMEDIATELY 🚨
            <br />
            <span className="text-sm font-normal mt-2 block">
              Based on your symptoms, you need immediate medical attention. Do not wait.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTriageIcon()}
              <div>
                <CardTitle className="text-2xl">Assessment Results</CardTitle>
                <CardDescription>Generated on {new Date(session.created_at).toLocaleString()}</CardDescription>
              </div>
            </div>
            <Badge variant={getTriageBadgeVariant()} className="text-sm px-3 py-1">
              {session.triage_level?.replace(/-/g, " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Triage Assessment
            </h3>
            <p className="text-muted-foreground">{session.triage_reason}</p>
          </div>

          {session.confidence_score && (
            <div>
              <h3 className="font-semibold mb-2">Confidence Score</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${session.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{(session.confidence_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}

          {recommendations.medicines && recommendations.medicines.length > 0 && session.triage_level !== "emergency" && (
            <div>
              <h3 className="font-semibold mb-3">Over-the-Counter Suggestions</h3>
              <div className="space-y-2">
                {recommendations.medicines.map((med: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{med.name}</p>
                    {med.dose && <p className="text-sm text-muted-foreground">Dose: {med.dose}</p>}
                    {med.notes && <p className="text-sm text-muted-foreground">{med.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.home_remedies && recommendations.home_remedies.length > 0 && session.triage_level !== "emergency" && (
            <div>
              <h3 className="font-semibold mb-3">Home Care Recommendations</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {recommendations.home_remedies.map((remedy: string, idx: number) => (
                  <li key={idx}>{remedy}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.what_to_do && recommendations.what_to_do.length > 0 && session.triage_level !== "emergency" && (
            <div>
              <h3 className="font-semibold mb-3 text-success">✓ What To Do</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {recommendations.what_to_do.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.what_not_to_do && recommendations.what_not_to_do.length > 0 && session.triage_level !== "emergency" && (
            <div>
              <h3 className="font-semibold mb-3 text-destructive">✗ What NOT To Do</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {recommendations.what_not_to_do.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.follow_up && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Follow-Up Guidance</h3>
              {recommendations.follow_up.when_to_see_provider && (
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>When to see a provider:</strong> {recommendations.follow_up.when_to_see_provider}
                </p>
              )}
              {recommendations.follow_up.suggested_doctor_type && (
                <p className="text-sm text-muted-foreground">
                  <strong>Suggested provider:</strong> {recommendations.follow_up.suggested_doctor_type}
                </p>
              )}
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Disclaimer:</strong> {recommendations.disclaimer || "This assessment is for educational purposes only and does not constitute medical advice. Always consult with qualified healthcare professionals for medical concerns."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Button onClick={onNewAssessment} className="w-full" size="lg">
        Start New Assessment
      </Button>
    </div>
  );
};

export default ResultsDisplay;