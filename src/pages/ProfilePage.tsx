import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { KeyRoundIcon } from "lucide-react";
import { getProfile, updateProfile, type Profile } from "@/api/profile";
import { getErrorMessage } from "@/lib/error";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChangePasswordDialog from "@/components/profile/ChangePasswordDialog";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await getProfile();
      setProfile(data);
    } catch {
      // 401 handled by interceptor
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName ?? "");
  }, [profile]);

  const handleSave = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { data } = await updateProfile({ displayName });
      setProfile(data);
      setSuccess(t("profile.success.updated"));
    } catch (err) {
      setError(getErrorMessage(err) ?? t("profile.errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSuccess = () => {
    logout();
  };

  if (!profile) return null;

  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.userInfo")}</CardTitle>
          <CardDescription>{t("profile.userInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("profile.username")}</Label>
              <Input value={profile.username} disabled />
            </div>
            <div className="grid gap-2">
              <Label>{t("profile.role")}</Label>
              <div>
                <Badge
                  variant={
                    profile.roleName === "root" ? "destructive" : "default"
                  }
                >
                  {profile.roleName}
                </Badge>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-displayName">
                {t("profile.displayName")}
              </Label>
              <Input
                id="profile-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profile.displayNamePlaceholder")}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-center text-muted-foreground">
                {success}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.security")}</CardTitle>
          <CardDescription>
            {t("profile.securityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setPasswordDialogOpen(true)}
          >
            <KeyRoundIcon className="size-4" />
            {t("profile.changePassword")}
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};

export default ProfilePage;
