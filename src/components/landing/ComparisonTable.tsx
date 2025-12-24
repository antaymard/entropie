import { Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";

export function ComparisonTable() {
  const features = [
    {
      name: "Infinite canvas",
      nolenor: true,
      miro: true,
      notion: false,
      n8n: false,
    },
    {
      name: "Live data integration",
      nolenor: true,
      miro: false,
      notion: "limited",
      n8n: true,
    },
    {
      name: "Custom node types",
      nolenor: true,
      miro: false,
      notion: "limited",
      n8n: false,
    },
    {
      name: "Visual automation",
      nolenor: true,
      miro: false,
      notion: false,
      n8n: true,
    },
    {
      name: "Real-time collaboration",
      nolenor: true,
      miro: true,
      notion: true,
      n8n: false,
    },
    {
      name: "Spatial organization",
      nolenor: true,
      miro: true,
      notion: false,
      n8n: false,
    },
  ];

  const renderCell = (value: boolean | string) => {
    if (value === true) {
      return <Check className="mx-auto h-5 w-5 text-green-500" />;
    }
    if (value === false) {
      return <X className="mx-auto h-5 w-5 text-muted-foreground/30" />;
    }
    return (
      <span className="mx-auto block text-center text-xs text-muted-foreground">
        {value}
      </span>
    );
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Why Nolenor?
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">
            The canvas Notion should have built. The automation Miro needs. The
            interface n8n deserves.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-x-auto border-border/50">
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-sm font-semibold">
                      Feature
                    </th>
                    <th className="pb-3 text-center text-sm font-semibold text-brand">
                      Nolenor
                    </th>
                    <th className="pb-3 text-center text-sm font-medium text-muted-foreground">
                      Miro/Figma
                    </th>
                    <th className="pb-3 text-center text-sm font-medium text-muted-foreground">
                      Notion
                    </th>
                    <th className="pb-3 text-center text-sm font-medium text-muted-foreground">
                      n8n
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.name} className="border-b last:border-0">
                      <td className="py-3 text-sm">{feature.name}</td>
                      <td className="py-3">{renderCell(feature.nolenor)}</td>
                      <td className="py-3">{renderCell(feature.miro)}</td>
                      <td className="py-3">{renderCell(feature.notion)}</td>
                      <td className="py-3">{renderCell(feature.n8n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
