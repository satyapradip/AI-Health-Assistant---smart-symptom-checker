import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Activity, FileText, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">AI Health Assistant</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Sign In
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              🏆 Hackathon Demo Project
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Your AI-Powered
              <br />
              <span className="text-primary">Health Assistant</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant symptom assessments, triage guidance, and health recommendations powered
              by advanced AI. Educational demonstration tool for hackathon showcase.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <Activity className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Symptom Analysis</CardTitle>
                <CardDescription>
                  Advanced AI analyzes your symptoms using medical knowledge to provide structured
                  health guidance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Report OCR</CardTitle>
                <CardDescription>
                  Upload medical reports, lab results, or prescriptions - AI extracts and analyzes
                  the data automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Smart Triage</CardTitle>
                <CardDescription>
                  Automatic emergency detection and appropriate triage recommendations based on
                  severity
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Safety Notice */}
          <Card className="bg-destructive/10 border-destructive/20 mt-16">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 text-left">
                <Shield className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-destructive mb-2">
                    ⚠️ Important Safety Disclaimer
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This is a <strong>demonstration tool for educational purposes only</strong>.
                    This is NOT medical advice and should not replace professional medical
                    consultation. In case of emergency, call emergency services immediately. This
                    hackathon project showcases AI + healthcare integration capabilities but is not
                    approved for clinical use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t mt-20 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 AI Health Assistant - Hackathon Demo Project</p>
          <p className="mt-2">Built with Supabase + Gemini AI + React + TypeScript</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
