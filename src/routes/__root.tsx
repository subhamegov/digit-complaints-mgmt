import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { RbacProvider, useRbac } from "@/lib/rbac";
import { Sidebar, MobileSidebar, TopBar } from "@/components/pgr/Shell";
import { useState } from "react";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or return to the dashboard.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a href="/dashboard" className="rounded-sm border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DIGIT CMS" },
      { name: "description", content: "CMS" },
      { property: "og:title", content: "DIGIT CMS" },
      { name: "twitter:title", content: "DIGIT CMS" },
      { property: "og:description", content: "CMS" },
      { name: "twitter:description", content: "CMS" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/baa10947-d438-41b0-9294-e0b2ba4c58b4/id-preview-718efe93--c94a8e68-f48f-43f4-8f4f-60fcedd0cd15.lovable.app-1779958516066.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/baa10947-d438-41b0-9294-e0b2ba4c58b4/id-preview-718efe93--c94a8e68-f48f-43f4-8f4f-60fcedd0cd15.lovable.app-1779958516066.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <RbacProvider>
        <AppLayout />
      </RbacProvider>
    </QueryClientProvider>
  );
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useRbac();
  const isChromeless =
    pathname === "/login" ||
    pathname.endsWith("/login") ||
     pathname.startsWith("/signup") ||

     pathname === "/auth/google" ||
     pathname === "/auth/github" ||
     pathname === "/setup/organisation" ||
     pathname === "/" ||
     pathname === "/platform" ||
     pathname.startsWith("/admin") ||
     pathname.startsWith("/operations");


  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isChromeless) {
    return <Outlet />;
  }

  const isPlatformAdmin = role === "PLATFORM_ADMIN";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {!isPlatformAdmin && <Sidebar />}
      {!isPlatformAdmin && (
        <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setMobileNavOpen(true)}
          showSearch={!isPlatformAdmin}
          showMenu={!isPlatformAdmin}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


