import { useState, type SubmitEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/api/auth";
import AuthFormLayout from "@/components/AuthFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const successMessage = (location.state as { message?: string })?.message;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const { data } = await login({ username, password });
      auth.login(data.token);

      if (data.forceChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormLayout
      title={t("login.title")}
      description={t("login.description")}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {successMessage && (
          <p className="text-sm text-center text-muted-foreground">
            {successMessage}
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="username">{t("login.username")}</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("login.usernamePlaceholder")}
            required
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("login.password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordPlaceholder")}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default LoginPage;
