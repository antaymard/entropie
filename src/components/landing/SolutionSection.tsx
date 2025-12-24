import { Card, CardContent } from "@/components/shadcn/card";
import { BarChart3, Palette, Bot, Link2 } from "lucide-react";

export function SolutionSection() {
  const features = [
    {
      icon: BarChart3,
      title: "Live data, visualized your way",
      description:
        "Connect any tool or API. Your nodes update in real-time with live KPIs, project status, or competitive intel.",
    },
    {
      icon: Palette,
      title: "Fully customizable nodes",
      description:
        "Build your own node types with our template editor. From job applications to real estate comparisons to CI/CD pipelines.",
    },
    {
      icon: Bot,
      title: "AI that understands context",
      description:
        "Ask questions about your canvas. Have AI agents monitor sources, summarize changes, and flag what matters.",
    },
    {
      icon: Link2,
      title: "Everything, connected",
      description:
        "Link documents, data sources, and workflows spatially. See relationships, not just lists.",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            A canvas that works as hard as you do
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">
            Combine the power of visual thinking with real-time data and
            automation
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50">
              <CardContent className="pt-6">
                <feature.icon className="mb-4 h-12 w-12 text-brand" />
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
