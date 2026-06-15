import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Account Administrator — DIGIT Complaints" },
      {
        name: "description",
        content:
          "Account Administrator console. Sign in or enter a fully configured demo environment.",
      },
    ],
  }),
  component: PlatformLanding,
});

function PlatformLanding() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const enterConsole = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("demoSetupActive");
    }
    navigate({ to: "/admin/home" });
  };

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
      toast.error("Please enter a valid work email.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      enterConsole();
    }, 250);
  };

  const onUseSample = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("demoSetupActive", "1");
    }
    setDemoOpen(false);
    toast.success("Sample environment loaded.");
    enterConsole();
  };

  return (
    <div className="min-h-screen w-full bg-[oklch(0.97_0.005_250)] text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-bold text-primary-foreground">
              P
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">DIGIT Complaint Management</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Complaints Management
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <LogIn className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 sm:py-16">
        <div className="mb-6 w-full max-w-[460px] text-center">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Account Administrator
          </div>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight">
            Account Administrator
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Setup or access account administration.
          </p>
        </div>

        <section className="w-full max-w-[460px] rounded-sm border border-border bg-background p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="text-[15px] font-semibold text-foreground">
            Enter Work Email
          </h2>
          <form onSubmit={onSignIn} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="work-email"
                className="text-[12px] font-medium text-foreground"
              >
                Work Email
              </label>
              <Input
                id="work-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@your-org.org"
                autoComplete="email"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full justify-center"
            >
              {submitting ? "Signing in…" : "Sign In"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setDemoOpen(true)}
            className="w-full justify-center"
          >
            Skip setup for demo
          </Button>
        </section>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          Console access is audited.
        </div>
      </main>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Skip setup for demo?</DialogTitle>
            <DialogDescription>
              We'll use sample settings so you can explore the admin console.
              You can complete setup later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDemoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onUseSample}>Use Sample Setup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
