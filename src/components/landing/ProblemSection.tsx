import { Card, CardContent } from "@/components/shadcn/card";
import { Database, FileText, Layout } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: Database,
      title: "Scattered information",
      description:
        "Your project data lives in Notion, Linear, Google Drive, Slack, your CRM...",
    },
    {
      icon: Layout,
      title: "Static visualizations",
      description:
        "Miro and Figma are great for design, terrible for live data and automation",
    },
    {
      icon: FileText,
      title: "Rigid project tools",
      description:
        "Notion and ClickUp force you into their structure, not yours",
    },
  ];

  return (
    <section className="border-b bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
            The tools you love don't talk to each other
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {problems.map((problem) => (
            <Card key={problem.title} className="border-border/50">
              <CardContent className="pt-6">
                <problem.icon className="mb-4 h-10 w-10 text-brand" />
                <h3 className="mb-2 text-lg font-semibold">{problem.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {problem.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
