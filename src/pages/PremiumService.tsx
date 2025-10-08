import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, Crown, Zap, TrendingUp, Bell, Star, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function PremiumService() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const { user } = useAuth();
  
  // Default to "Basic" if no plan is set
  const currentPlan = user?.plan || "Basic";

  const handleGetStarted = () => {
    // Placeholder for future premium service functionality
    console.log("Get Started clicked - functionality coming soon");
  };

  if (isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <img 
              src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" 
              alt="PokéMarket Logo" 
              className="h-24 w-24 opacity-90"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Accessing market...</h2>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "",
      description: "Perfect for casual collectors",
      features: [
        "Real-time price tracking",
        "Price history up to 90 days",
        "Email notifications",
        "Basic analytics",
        "Mobile access"
      ],
      icon: Star,
      popular: false,
      freeTrial: false
    },
    {
      name: "Pro",
      price: "$14.99",
      originalPrice: "$29.99",
      period: "/month",
      description: "For serious collectors and investors",
      features: [
        "Everything in Basic",
        "Advanced price alerts",
        "Portfolio tracking",
        "Market trend analysis",
        "Priority support",
        "Export data to CSV",
        "Custom watchlists (unlimited)"
      ],
      icon: Crown,
      popular: true,
      freeTrial: true,
      trialDays: 7
    },
    {
      name: "Enterprise",
      price: "$24.99",
      originalPrice: "$49.99",
      period: "/month",
      description: "For professional traders and stores",
      features: [
        "Everything in Pro",
        "API access",
        "Bulk import/export",
        "Advanced analytics dashboard",
        "Dedicated account manager",
        "Custom integrations",
        "White-label options",
        "Team collaboration tools"
      ],
      icon: Zap,
      popular: false,
      freeTrial: true,
      trialDays: 7
    }
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Get detailed insights into market trends and price movements with our advanced analytics tools."
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Set custom price alerts and get notified instantly when cards hit your target prices."
    },
    {
      icon: Shield,
      title: "Portfolio Protection",
      description: "Track your collection's value and get alerts when significant market changes affect your portfolio."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" alt="Logo" className="h-12 w-12" />
            <span className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate("/")}>PokéMarket</span>
          </div>
          <Button
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            variant="outline"
            className="cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-medium">Premium Features</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Upgrade Your Market Tracking
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get access to advanced features, priority support, and powerful tools to maximize your Pokemon card investments.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 pt-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    {plan.originalPrice && (
                      <span className="text-xl text-muted-foreground line-through mr-2">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.freeTrial && (
                    <div className="pt-3">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                        <span className="text-base font-bold text-primary block">
                          {plan.trialDays}-Day Free Trial (One Time Only)
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Cancel any time
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 block mt-1">
                          Subject to terms and conditions
                        </span>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full cursor-pointer" 
                    variant="outline"
                    onClick={handleGetStarted}
                    disabled={currentPlan === plan.name}
                  >
                    {currentPlan === plan.name ? "Current Plan" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="pt-16 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Premium Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unlock powerful tools designed for serious collectors and investors
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="pt-16 pb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="text-center py-12 space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Ready to upgrade?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join thousands of collectors who are already using PokéMarket Premium to track and grow their collections.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" className="cursor-pointer" onClick={handleGetStarted}>
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="cursor-pointer" onClick={() => navigate("/contact")}>
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 PokéMarket. Built for collectors and investors.</p>
        </div>
      </footer>
    </div>
  );
}