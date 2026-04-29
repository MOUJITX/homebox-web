import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { LogOutIcon, UserIcon, ChevronDownIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const navigate = useNavigate();

  const titleKey = routeTitleMap[location.pathname] ?? "nav.dashboard";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-4">
      <h1 className="font-heading text-base font-semibold">{t(titleKey)}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex cursor-default items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <span>{username}</span>
          {role && (
            <Badge variant={role === "root" ? "destructive" : "default"}>
              {role}
            </Badge>
          )}
          <ChevronDownIcon className="size-3.5 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuPopup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <UserIcon className="size-4" />
            {t("nav.profile")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOutIcon className="size-4" />
            {t("common.logout")}
          </DropdownMenuItem>
        </DropdownMenuPopup>
      </DropdownMenu>
    </header>
  );
};

export default Topbar;
