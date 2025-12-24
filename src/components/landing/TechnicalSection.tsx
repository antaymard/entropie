import { Card, CardContent } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Code2, Zap } from "lucide-react";

export function TechnicalSection() {
  const architectureFeatures = [
    "TypeScript + React + Convex backend",
    "Real-time collaboration out of the box",
    "Custom node system with visual builder",
    "n8n integration for workflows",
    "Rich text with Plate.js",
    "Infinite canvas with React Flow",
  ];

  const developerFeatures = [
    {
      title: "API-first",
      description: "Connect any data source via REST/GraphQL",
    },
    {
      title: "Template SDK",
      description: "Build and share custom node types",
    },
    {
      title: "Webhook support",
      description: "Real-time updates from your tools",
    },
    {
      title: "LLM integration",
      description: "Claude API built-in for AI features",
    },
    {
      title: "Open extensibility",
      description: "Your workspace, your rules",
    },
  ];

  return (
    <section className="border-b bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Built for developers, by developers
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">
            Modern stack, extensible architecture, developer-friendly APIs
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Code2 className="h-6 w-6 text-brand" />
                <h3 className="text-xl font-semibold">Architecture</h3>
              </div>
              <ul className="space-y-2">
                {architectureFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1.5 text-brand">•</span>
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-brand" />
                <h3 className="text-xl font-semibold">Developer Experience</h3>
              </div>
              <div className="space-y-4">
                {developerFeatures.map((feature) => (
                  <div key={feature.title}>
                    <h4 className="mb-1 font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="outline" asChild>
              <a
                href="https://github.com/antaymard/entropie"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </Button>
            <Button variant="outline" disabled>
              Read the docs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
