import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { SolutionSection } from "./SolutionSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { UseCasesSection } from "./UseCasesSection";
import { TechnicalSection } from "./TechnicalSection";
import { ComparisonTable } from "./ComparisonTable";
import { PricingSection } from "./PricingSection";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <UseCasesSection />
        <TechnicalSection />
        <ComparisonTable />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
