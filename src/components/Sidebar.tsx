import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboardIcon,
  PackageIcon,
  PillIcon,
  BoxIcon,
  ReceiptIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/ui/tooltip";
import { cn, ROOT_ROLE } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string;
}

const navItems: NavItem[] = [
  { label: "nav.dashboard", path: "/dashboard", icon: LayoutDashboardIcon },
  { label: "nav.expiration", path: "/expiration", icon: PackageIcon },
  { label: "nav.medications", path: "/medications", icon: PillIcon },
  { label: "nav.assets", path: "/assets", icon: BoxIcon },
  { label: "nav.invoices", path: "/invoices", icon: ReceiptIcon },
  { label: "nav.medicalRecords", path: "/medical-records", icon: FileTextIcon },
  { label: "nav.subscriptions", path: "/subscriptions", icon: CreditCardIcon },
  {
    label: "nav.files",
    path: "/files",
    icon: FolderIcon,
    requiredRole: ROOT_ROLE,
  },
  {
    label: "nav.members",
    path: "/members",
    icon: UsersIcon,
    requiredRole: ROOT_ROLE,
  },
  {
    label: "nav.roles",
    path: "/roles",
    icon: ShieldIcon,
    requiredRole: ROOT_ROLE,
  },
  {
    label: "nav.settings",
    path: "/settings",
    icon: SettingsIcon,
    requiredRole: ROOT_ROLE,
  },
];

const STORAGE_KEY = "homebox_sidebar_collapsed";

const Sidebar = () => {
  const { t } = useTranslation();
  const { role } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  const visibleItems = navItems.filter(
    (item) => !item.requiredRole || item.requiredRole === role,
  );

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-[width] duration-200",
        collapsed ? "w-12" : "w-52",
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center border-b px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <span className="font-heading text-sm font-semibold">
            {t("app.name")}
          </span>
        )}
        <Button variant="ghost" size="icon-xs" onClick={toggleCollapsed}>
          {collapsed ? (
            <PanelLeftOpenIcon className="size-4" />
          ) : (
            <PanelLeftCloseIcon className="size-4" />
          )}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          const linkContent = (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span>{t(item.label)}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger render={linkContent} />
                <TooltipPopup>{t(item.label)}</TooltipPopup>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
