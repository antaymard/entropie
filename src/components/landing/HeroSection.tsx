import { Button } from "@/components/shadcn/button";
import { useNavigate } from "@tanstack/react-router";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* Animated background - simplified canvas animation */}
      <div className="absolute inset-0 -z-10 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full bg-blue-500/10 blur-3xl delay-1000" />
      </div>

      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Your entire project ecosystem,{" "}
            <span className="text-brand">visualized and connected</span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Nolenor transforms how you work with complex information. Combine
            infinite canvas flexibility with real-time data, custom workflows,
            and AI—all in one spatial workspace.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate({ to: "/signin" })}
              className="w-full sm:w-auto"
            >
              Start building
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See it in action
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Free forever plan available • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
