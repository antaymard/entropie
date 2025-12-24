import { Button } from "@/components/shadcn/button";
import { useNavigate } from "@tanstack/react-router";

export function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <a href="/" className="text-xl font-bold">
            Nolenor
          </a>
          <div className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#use-cases"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Use Cases
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="https://github.com/antaymard/entropie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate({ to: "/signin" })}>
            Sign in
          </Button>
          <Button onClick={() => navigate({ to: "/signin" })}>
            Get started
          </Button>
        </div>
      </div>
    </nav>
  );
}
