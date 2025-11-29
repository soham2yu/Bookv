import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FloatingElements } from "@/components/floating-elements";
import { ParticleBackground } from "@/components/particle-background";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out BookVision",
      features: [
        "5 videos per month",
        "Basic OCR quality",
        "Standard processing speed",
        "PDF downloads",
      ],
      cta: "Get Started",
      href: "/signup",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29",
      description: "For serious book collectors",
      features: [
        "Unlimited videos",
        "Premium OCR quality",
        "Priority processing",
        "Advanced PDF features",
        "NFT ownership certificates",
        "Email support",
      ],
      cta: "Start Pro Trial",
      href: "/signup",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For libraries and organizations",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantees",
        "Team management",
        "Volume discounts",
      ],
      cta: "Contact Sales",
      href: "#contact",
      highlighted: false,
    },
  ];

  return (
    <>
      <ParticleBackground />
      <FloatingElements />
      <Navbar />
      <main className="min-h-screen bg-background relative">
        <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-16">
              <h1 className="text-pretty-display text-gradient mb-4">Simple, transparent pricing</h1>
              <p className="text-pretty-subheading max-w-2xl mx-auto">
                Choose the plan that's right for you. All plans include core features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`${
                    plan.highlighted
                      ? "luxury-card-premium border-2 border-accent/50 shadow-2xl scale-105"
                      : "luxury-card border border-border/50"
                  } p-8 rounded-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold pulse-glow">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground ml-2">/month</span>}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <svg
                          className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground hover:from-accent/90 hover:to-yellow-400/90 ai-glow"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    }`}
                    data-testid={`button-${plan.name.toLowerCase()}`}
                  >
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
