import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { LogOutIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const routeTitleMap: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/members": "nav.members",
  "/roles": "nav.roles",
  "/profile": "nav.profile",
};

const Topbar = () => {
  const { t } = useTranslation();
  const { username, role, logout } = useAuth();
  const location = useLocation();

  const titleKey = routeTitleMap[location.pathname] ?? "nav.dashboard";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-4">
      <h1 className="font-heading text-base font-semibold">{t(titleKey)}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{username}</span>
          {role && (
            <Badge variant={role === "root" ? "destructive" : "default"}>
              {role}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={logout}>
          <LogOutIcon className="size-4" />
          <span className="sr-only">{t("common.logout")}</span>
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
