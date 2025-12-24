import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Check } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function PricingSection() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out Nolenor",
      features: [
        "Unlimited nodes",
        "3 custom templates",
        "Basic integrations",
        "Community support",
      ],
      cta: "Start for free",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "/month",
      description: "For individuals and small teams",
      features: [
        "Everything in Free",
        "Unlimited custom templates",
        "Advanced integrations",
        "AI features",
        "Priority support",
      ],
      cta: "Coming soon",
      highlighted: true,
    },
    {
      name: "Team",
      price: "$20",
      period: "/user/month",
      description: "For teams that need collaboration",
      features: [
        "Everything in Pro",
        "Real-time collaboration",
        "SSO & team management",
        "Dedicated support",
        "Custom integrations",
      ],
      cta: "Coming soon",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="border-b bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">
            Start free, upgrade when you're ready
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border/50 ${
                plan.highlighted ? "border-brand shadow-lg" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                  Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 shrink-0 text-brand" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => {
                    if (plan.name === "Free") {
                      navigate({ to: "/signin" });
                    }
                  }}
                  disabled={plan.name !== "Free"}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
