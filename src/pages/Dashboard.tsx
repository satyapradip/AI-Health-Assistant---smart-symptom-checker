import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, FileText, Activity } from "lucide-react";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";
import ConsentForm from "@/components/ConsentForm";
import SymptomForm from "@/components/SymptomForm";
import SessionHistory from "@/components/SessionHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      checkConsent();
    }
  }, [user]);

  const checkConsent = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("consent_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("consent_given", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking consent:", error);
    }

    setHasConsent(!!data);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (hasConsent === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">AI Health Assistant</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!hasConsent ? (
          <ConsentForm onConsentGiven={() => setHasConsent(true)} />
        ) : (
          <>
            <div className="mb-6 flex gap-2">
              <Button
                onClick={() => setActiveTab("new")}
                variant={activeTab === "new" ? "default" : "outline"}
              >
                <Activity className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
              <Button
                onClick={() => setActiveTab("history")}
                variant={activeTab === "history" ? "default" : "outline"}
              >
                <FileText className="w-4 h-4 mr-2" />
                Session History
              </Button>
            </div>

            {activeTab === "new" ? <SymptomForm /> : <SessionHistory />}
          </>
        )}
      </main>

      <footer className="border-t mt-12 py-6 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-destructive mb-2">⚠️ IMPORTANT DISCLAIMER</p>
          <p>
            This is a demonstration tool for educational purposes only. This is NOT medical advice.
            Always consult qualified healthcare professionals for medical concerns.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;