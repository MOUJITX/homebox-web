import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthFormLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

const AuthFormLayout = ({
  title,
  description,
  children,
}: AuthFormLayoutProps) => (
  <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
    <img
      src="/logo-long-light.svg"
      alt="Homebox"
      className="h-10 shrink-0 dark:hidden"
    />
    <img
      src="/logo-long-dark.svg"
      alt="Homebox"
      className="h-10 shrink-0 hidden dark:block"
    />
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
    <p className="text-xs text-muted-foreground">
      HomeBox · v{__APP_VERSION__}
    </p>
  </div>
);

export default AuthFormLayout;
