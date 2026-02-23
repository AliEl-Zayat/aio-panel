"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-login";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { error?: string } } }).response;
    const msg = res?.data?.error;
    if (typeof msg === "string") return msg;
  }
  return "Something went wrong. Please try again.";
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {login.isError && (
                <div
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {getErrorMessage(login.error)}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={login.isPending}
                  autoComplete="email"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={login.isPending}
                  autoComplete="current-password"
                />
              </Field>
              <Field>
                <Button type="submit" disabled={login.isPending}>
                  {login.isPending ? "Signing in…" : "Login"}
                </Button>
                <Button variant="outline" type="button" disabled>
                  Login with Google (coming soon)
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? Sign up is not available yet.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
