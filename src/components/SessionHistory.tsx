import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText } from "lucide-react";
import ResultsDisplay from "./ResultsDisplay";

const SessionHistory = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("symptom_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  if (selectedSessionId) {
    return (
      <ResultsDisplay
        sessionId={selectedSessionId}
        onNewAssessment={() => setSelectedSessionId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No assessment history yet. Complete your first assessment to see results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTriageBadgeVariant = (level: string) => {
    switch (level) {
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

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Assessment History</h2>
        <p className="text-muted-foreground">View your previous health assessments</p>
      </div>

      {sessions.map((session) => (
        <Card key={session.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {new Date(session.created_at).toLocaleDateString()}
                </CardTitle>
                <CardDescription>
                  {new Date(session.created_at).toLocaleTimeString()}
                </CardDescription>
              </div>
              {session.triage_level && (
                <Badge variant={getTriageBadgeVariant(session.triage_level)}>
                  {session.triage_level.replace(/-/g, " ").toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Symptoms</p>
                <p className="text-sm line-clamp-2">{session.symptoms_text}</p>
              </div>

              {session.triage_reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Assessment</p>
                  <p className="text-sm line-clamp-2">{session.triage_reason}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSelectedSessionId(session.id)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Full Results
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionHistory;