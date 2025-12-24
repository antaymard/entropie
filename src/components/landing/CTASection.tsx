import { Button } from "@/components/shadcn/button";
import { useNavigate } from "@tanstack/react-router";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Start visualizing your work differently
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join teams already building their command centers on Nolenor
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={() => navigate({ to: "/signin" })}>
              Create your first canvas
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                window.open(
                  "mailto:antoine@nolenor.com?subject=Schedule a demo",
                  "_blank"
                );
              }}
            >
              Schedule a demo
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand" />
              <span>Free forever plan available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
