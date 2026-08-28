import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — DIGIT Complaint Management" },
      { name: "description", content: "Prototype privacy notice for DIGIT Complaint Management." },
      { property: "og:title", content: "Privacy Notice — DIGIT Complaint Management" },
      { property: "og:description", content: "Prototype privacy notice for DIGIT Complaint Management." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Privacy Notice</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Placeholder document. The final privacy notice for DIGIT Complaint Management will be published here.
      </p>
      <Link to="/signup" search={{}} className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
        Back to sign up
      </Link>
    </div>
  );
}
