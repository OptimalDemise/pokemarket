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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" alt="Logo" className="h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0" />
            <span className="text-lg sm:text-2xl font-bold tracking-tight cursor-pointer truncate" onClick={() => navigate("/")}>PokéMarket</span>
          </div>
          <Button
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            variant="outline"
            className="cursor-pointer flex-shrink-0 text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
            <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
            <span className="font-medium">Premium Features</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight px-4">
            Upgrade Your Market Tracking
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
            Get access to advanced features, priority support, and powerful tools to maximize your Pokemon card investments.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-6 sm:pt-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-6 sm:pb-8">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="pt-3 sm:pt-4">
                    {plan.originalPrice && (
                      <span className="text-lg sm:text-xl text-muted-foreground line-through mr-2">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.freeTrial && (
                    <div className="pt-2 sm:pt-3">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                        <span className="text-sm sm:text-base font-bold text-primary block break-words">
                          {plan.trialDays}-Day Free Trial (One Time Only)
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground block">
                          Cancel any time
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 block mt-1">
                          Subject to terms and conditions
                        </span>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 flex-1 flex flex-col px-4 sm:px-6">
                  <ul className="space-y-2 sm:space-y-3 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4 sm:pt-6">
                    <Button 
                      className="w-full cursor-pointer text-xs sm:text-sm" 
                      variant="outline"
                      onClick={handleGetStarted}
                      disabled={currentPlan === plan.name}
                    >
                      {currentPlan === plan.name ? "Current Plan" : "Get Started"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="pt-12 sm:pt-16 space-y-6 sm:space-y-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight px-4">Premium Features</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
              Unlock powerful tools designed for serious collectors and investors
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader className="px-4 sm:px-6">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <p className="text-muted-foreground text-sm sm:text-base">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="pt-12 sm:pt-16 pb-6 sm:pb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6 px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to upgrade?</h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Join thousands of collectors who are already using PokéMarket Premium to track and grow their collections.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button size="lg" className="cursor-pointer w-full sm:w-auto text-sm sm:text-base" onClick={handleGetStarted}>
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="cursor-pointer w-full sm:w-auto text-sm sm:text-base" onClick={() => navigate("/contact")}>
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 sm:py-8 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
          <p>© 2024 PokéMarket. Built for collectors and investors.</p>
        </div>
      </footer>
    </div>
  );
}