import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Code2, BookOpen, TrendingUp, Briefcase } from "lucide-react";

export function UseCasesSection() {
  const useCases = [
    {
      id: "engineering",
      icon: Code2,
      label: "Engineering",
      title: "Our entire release pipeline, visualized",
      features: [
        "GitHub PRs linked to Linear tickets",
        "CI/CD status monitoring",
        "Dependencies mapped spatially",
        "AI summaries of code changes",
      ],
    },
    {
      id: "research",
      icon: BookOpen,
      label: "Research",
      title: "All my sources, in one place",
      features: [
        "PDFs, papers, and notes connected",
        "Citation trails visualized",
        "AI-powered literature review",
        "Automated monitoring of new publications",
      ],
    },
    {
      id: "business",
      icon: TrendingUp,
      label: "Business",
      title: "360° view of what matters",
      features: [
        "CRM data + ad metrics + support tickets",
        "Real-time KPI monitoring",
        "Team tasks linked to customer outcomes",
        "Automated competitive tracking",
      ],
    },
    {
      id: "personal",
      icon: Briefcase,
      label: "Personal",
      title: "My job hunt, organized",
      features: [
        "Company research nodes",
        "Contact tracking",
        "Application status pipeline",
        "Market analysis side-by-side",
      ],
    },
  ];

  return (
    <section id="use-cases" className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Built for how you work
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">
            From engineering teams to solo researchers, Nolenor adapts to your
            workflow
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Tabs defaultValue="engineering" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {useCases.map((useCase) => (
                <TabsTrigger
                  key={useCase.id}
                  value={useCase.id}
                  className="gap-2"
                >
                  <useCase.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{useCase.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {useCases.map((useCase) => (
              <TabsContent key={useCase.id} value={useCase.id}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {useCase.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
}
