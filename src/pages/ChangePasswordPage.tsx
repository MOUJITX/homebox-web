import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/api/auth";
import AuthFormLayout from "@/components/AuthFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ChangePasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, clearSession } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const validate = (): string | null => {
    if (newPassword.length < 8) return t("changePassword.tooShort");
    if (newPassword !== confirmPassword) return t("changePassword.mismatch");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await changePassword({ currentPassword, newPassword });
      clearSession();
      navigate("/login", {
        replace: true,
        state: { message: t("changePassword.success") },
      });
    } catch {
      setError(t("changePassword.wrongCurrent"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormLayout
      title={t("changePassword.title")}
      description={t("changePassword.description")}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">
            {t("changePassword.currentPassword")}
          </Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("changePassword.currentPasswordPlaceholder")}
            required
            autoFocus
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">{t("changePassword.newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("changePassword.newPasswordPlaceholder")}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">
            {t("changePassword.confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("changePassword.confirmPasswordPlaceholder")}
            required
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? t("changePassword.submitting")
            : t("changePassword.submit")}
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default ChangePasswordPage;
