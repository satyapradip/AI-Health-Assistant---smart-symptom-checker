import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UserProfile = {
  name: string;
  age: string;
  gender: string;
  location: string;
};

interface UserProfileCardProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

const genderOptions = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
];

const UserProfileCard = ({ profile, onProfileChange }: UserProfileCardProps) => {
  const updateField = (field: keyof UserProfile, value: string) => {
    onProfileChange({ ...profile, [field]: value });
  };

  return (
    <Card className="rounded-[2rem] border border-white/60 bg-white/85 shadow-[0_25px_80px_rgba(12,23,44,0.15)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10">
      <CardHeader className="pb-4">
        <CardTitle>Patient Profile</CardTitle>
        <CardDescription>
          Provide quick context so the AI can adapt tone and guidance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Full Name
            </Label>
            <Input
              value={profile.name}
              placeholder="e.g., Drishti Rao"
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Age
            </Label>
            <Input
              type="number"
              value={profile.age}
              placeholder="32"
              onChange={(e) => updateField("age", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Gender
            </Label>
            <Select value={profile.gender} onValueChange={(value) => updateField("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Location
            </Label>
            <Input
              value={profile.location}
              placeholder="City, Country"
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;

