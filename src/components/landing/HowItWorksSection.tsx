import { Card, CardContent } from "@/components/shadcn/card";

export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Start with templates or build your own",
      description:
        "Choose from our library or create custom node types with fields, visuals, and data sources.",
    },
    {
      number: "2",
      title: "Connect your tools",
      description:
        "Link APIs, webhooks, n8n workflows, Google Drive, or any data source. Nodes fetch and display live data.",
    },
    {
      number: "3",
      title: "Organize spatially, work visually",
      description:
        "Drag, connect, zoom. Your canvas becomes your command center—not just another dashboard.",
    },
  ];

  return (
    <section id="how-it-works" className="border-b bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
            How it works
          </h2>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          {steps.map((step) => (
            <Card key={step.number} className="border-border/50">
              <CardContent className="flex gap-6 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xl font-bold text-brand">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
