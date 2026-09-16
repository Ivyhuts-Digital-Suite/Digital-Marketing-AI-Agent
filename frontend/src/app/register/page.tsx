"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";

export default function RegisterPage() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      await login(email, password);
      router.replace("/calendar");
    } catch (err) {
      setError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <h1 className="text-lg font-semibold text-foreground">Create your account</h1>
            <p className="text-sm text-foreground-muted">Start planning and generating Instagram content.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Full name" htmlFor="name">
              <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
