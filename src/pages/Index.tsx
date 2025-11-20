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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background/80 via-background to-background/60">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 opacity-60 blur-3xl" />
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-[120px] animate-floaty" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-secondary/40 to-primary/20 blur-[120px] animate-floaty" />
      </div>

      <header className="relative z-10">
        <nav className="mx-auto mt-8 flex max-w-6xl items-center justify-between rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-foreground/70 backdrop-blur-2xl shadow-[0_20px_80px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3 text-left tracking-normal">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/70 to-secondary/70 text-white shadow-[0_18px_45px_rgba(10,26,56,0.35)]">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">Apna Doctor</p>
              <p className="font-display text-lg font-semibold text-foreground">
                AI Symptom Companion
              </p>
            </div>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold uppercase tracking-[0.35em]"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20">
        <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/10 p-12 text-center backdrop-blur-2xl shadow-[0_40px_160px_rgba(15,23,42,0.35)]">
          <h1 className="mt-4 font-display text-5xl leading-tight text-foreground md:text-6xl">
            A trusted AI symptom companion
            <span className="block bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Instant guidance with calming clarity
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
            A Duolingo-friendly assistant that turns complex health triage into a reassuring,
            sci-fi-grade experience. Instantly assess symptoms, track history, and celebrate progress
            with gamified insights.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base">
              Start Symptom Check
            </Button>
            <Button size="lg" variant="outline" className="text-base" onClick={() => navigate("/auth")}>
              Explore Demo
            </Button>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Activity,
                title: "Symptom Intelligence",
                description: "Glass-panel AI reads nuance and urgency instantly.",
              },
              {
                icon: FileText,
                title: "Report OCR",
                description: "Upload labs or prescriptions for rapid clinical parsing.",
              },
              {
                icon: Zap,
                title: "Smart Triage",
                description: "Get colorful triage cues and confident next steps.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group relative overflow-hidden border-white/10 bg-white/5 p-6 text-left shadow-[0_25px_80px_rgba(15,23,42,0.25)] backdrop-blur-2xl"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="mt-3 text-base text-foreground/70">{description}</CardDescription>
                <div className="pointer-events-none absolute inset-0 opacity-0 blur-2xl transition group-hover:opacity-100 group-hover:blur-3xl" />
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-20 w-full">
          <Card className="relative bg-destructive/5 p-8 text-left">
            <CardContent className="flex flex-col gap-6 p-0 md:flex-row md:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/15 text-destructive">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-display text-xl text-destructive">⚠️ Safety First</h3>
                <p className="mt-2 text-sm text-foreground/70">
                  This experience is a <strong>demo for educational inspiration only</strong>.
                  Not medical advice. In urgent situations, contact emergency services immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="relative z-10 mt-20 border-t border-white/10 bg-white/5 py-10 text-center backdrop-blur-xl">
        <p className="text-sm text-foreground/70">
          © 2025 Apna Doctor — Built with React · Supabase
        </p>
      </footer>
    </div>
  );
};

export default Index;
