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
  <div className="flex min-h-svh items-center justify-center p-4">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </div>
);

export default AuthFormLayout;
