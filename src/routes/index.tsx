import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, BarChart3, Users, Zap, ArrowRight, Globe } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DIGIT PGR — Public Grievance Redressal" },
      { name: "description", content: "Operations console for public-service staff to receive, route, resolve, and monitor citizen complaints across departments and localities." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-bold text-primary-foreground text-sm">P</div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">DIGIT Platform</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PGR Console</div>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90"
          >
            Sign In <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-chrome text-chrome-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-chrome-muted/30 bg-chrome-muted/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-chrome-muted">
              <Globe className="h-3 w-3" />
              Trusted by 8+ governments
            </div>
            <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-tight md:text-[42px]">
              Public Grievance Redressal
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-chrome-muted">
              Operations console for public-service staff to receive, route, resolve, and monitor citizen complaints across departments and localities — on any account on the platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-5 text-[14px] font-medium text-primary-foreground hover:opacity-90"
              >
                Access Console <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10">
          <h2 className="text-[22px] font-semibold tracking-tight">Built for government operations</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Everything your team needs to manage citizen complaints end-to-end.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Real-time Dashboard"
            description="Track complaints, SLA compliance, and resolution trends at a glance."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Role-based Access"
            description="Tailored views for CSRs, GROs, department heads, and admins."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Workflow Routing"
            description="Automated escalation and routing to the right department or officer."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Audit Ready"
            description="Complete audit trails, reports, and compliance tracking built in."
          />
        </div>
      </section>

      {/* Tenants */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-[22px] font-semibold tracking-tight">Connected governments</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Live on the DIGIT platform across Africa and Asia.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Makueni County, Kenya",
              "Bomet County, Kenya",
              "eThekwini, South Africa",
              "Dire Dawa, Ethiopia",
              "Enugu State, Nigeria",
              "Maputo, Mozambique",
              "Banyuwangi, Indonesia",
              "Amritsar, India",
            ].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2.5 text-[13px] text-foreground"
              >
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-[22px] font-semibold tracking-tight">Ready to get started?</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">Sign in with your government account to access the console.</p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-6 text-[14px] font-medium text-primary-foreground hover:opacity-90"
          >
            Sign In to Console <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
          <div className="text-[11px] text-muted-foreground">
            &copy; 2026 eGovernments Foundation &middot; DIGIT 2.9
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span>Public Grievance Redressal</span>
            <span className="text-border">|</span>
            <span>DIGIT Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mt-3 text-[14px] font-semibold">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
