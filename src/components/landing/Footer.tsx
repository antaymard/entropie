import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const navigation = {
    product: [
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#pricing" },
      { name: "Use Cases", href: "#use-cases" },
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "GitHub", href: "https://github.com/antaymard/entropie" },
      { name: "Blog", href: "#" },
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Contact", href: "mailto:antoine@nolenor.com" },
    ],
  };

  const social = [
    {
      name: "Twitter",
      href: "#",
      icon: Twitter,
    },
    {
      name: "GitHub",
      href: "https://github.com/antaymard/entropie",
      icon: Github,
    },
    {
      name: "LinkedIn",
      href: "#",
      icon: Linkedin,
    },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <h3 className="mb-4 text-lg font-bold">Nolenor</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Your entire project ecosystem, visualized and connected.
            </p>
            <div className="flex gap-4">
              {social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-brand"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Product</h4>
            <ul className="space-y-2">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Resources</h4>
            <ul className="space-y-2">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Company</h4>
            <ul className="space-y-2">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nolenor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
