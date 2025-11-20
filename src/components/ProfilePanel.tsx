import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { User } from "@supabase/supabase-js";
import { Award, Crown, Flame, HeartPulse, Shield, Sparkles, UserPen } from "lucide-react";

interface ProfilePanelProps {
  user: User | null;
}

const ProfilePanel = ({ user }: ProfilePanelProps) => {
  const xpProgress = 72;
  const healthScore = 86;
  const mockBadges = [
    { label: "Glow Guru", icon: Sparkles },
    { label: "Calm Captain", icon: Shield },
    { label: "Insight Ninja", icon: Crown },
    { label: "Resilience Star", icon: Flame },
  ];
  const sessionPreview = [
    { title: "Midday Headache", triage: "SEE-DOCTOR", tone: "bg-gradient-to-r from-primary/15 to-accent/10" },
    { title: "Travel Prep", triage: "SELF-CARE", tone: "bg-gradient-to-r from-secondary/15 to-primary/10" },
    { title: "Allergy Check", triage: "URGENT-VISIT", tone: "bg-gradient-to-r from-destructive/15 to-warning/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Your Clinical Persona</CardTitle>
              <CardDescription>Soft glass avatar with live XP pulse</CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-secondary text-xs uppercase tracking-[0.35em]">
              Level 05
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <Avatar className="h-16 w-16 border border-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/60 to-secondary/60 text-white text-xl">
                    {(user?.email?.[0] || "A").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-xl">{user?.email?.split("@")[0] || "Clinical Explorer"}</p>
                  <p className="text-sm uppercase tracking-[0.35em] text-foreground/60">Trust Circle</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-foreground/60">XP UPLINK</p>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-sm text-foreground/70">
                    <span>1,280 / 1,800 XP</span>
                    <span>{xpProgress}%</span>
                  </div>
                  <Progress
                    value={xpProgress}
                    className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"
                  />
                  <div className="mt-4 flex items-center gap-3 text-sm text-foreground/70">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Complete two more assessments to level up</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-foreground/60">Health Aura</p>
                <div
                  className="relative mt-6 flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-1 text-white"
                  style={{
                    backgroundImage: `conic-gradient(from 0deg, hsla(var(--primary)/0.85) 0% ${healthScore}%, hsla(var(--muted)/0.4) ${healthScore}% 100%)`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-foreground">
                    <div>
                      <p className="font-display text-4xl">{healthScore}</p>
                      <p className="text-xs uppercase tracking-[0.45em] text-foreground/60">Vitality</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-foreground/70">
                  Soft glow indicates consistent educational assessments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges & Streaks</CardTitle>
            <CardDescription>Collect calm, clinical distinctions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {mockBadges.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-4 text-center backdrop-blur-xl"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-secondary/25 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-foreground/60">Streak</p>
                  <p className="font-display text-xl">3 days glowing</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/70">
                Complete the daily check-in to keep your streak alive and unlock holographic confetti.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Data</CardTitle>
            <CardDescription>Edit profile details (UI only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input defaultValue={user?.user_metadata?.full_name || "Clinical Wanderer"} placeholder="Full Name" />
              <Input defaultValue={user?.email || "demo@apna.doctor"} placeholder="Email" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input defaultValue="Earth" placeholder="Location" />
              <Input defaultValue="English" placeholder="Preferred Language" />
            </div>
            <Button type="button" variant="outline" className="w-full" disabled>
              <UserPen className="mr-2 h-4 w-4" />
              Save Changes (Demo)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Highlights</CardTitle>
            <CardDescription>Quick peek at recent triage vibes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionPreview.map(({ title, triage, tone }) => (
              <div key={title} className={`rounded-3xl border border-white/15 ${tone} p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">AI Summary</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-white/20 text-[10px] tracking-[0.3em]">
                    {triage}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gamified Progress</CardTitle>
          <CardDescription>Celebrate every check-in</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Trust Meter", value: "92%", icon: Shield, color: "from-secondary/25 to-secondary/10" },
            { label: "Calm Factor", value: "88%", icon: HeartPulse, color: "from-primary/25 to-primary/10" },
            { label: "Focus Flow", value: "76%", icon: Award, color: "from-accent/25 to-accent/10" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-3xl border border-white/15 bg-gradient-to-br ${color} p-5`}>
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-white" />
                <p className="text-sm uppercase tracking-[0.35em] text-white/70">{label}</p>
              </div>
              <p className="mt-4 font-display text-3xl text-white">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePanel;


