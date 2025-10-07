import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Package, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CardItem } from "@/components/CardItem";

export default function Landing() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();
  const cards = useQuery(api.cards.getAllCards);
  const products = useQuery(api.products.getAllProducts);

  // Get top 3 cards by percentage change
  const topPercentageChanges = cards
    ?.filter(card => card.percentChange !== 0)
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 3) || [];

  // Get 3 most recently updated cards with actual price changes
  const recentlyUpdated = cards
    ?.filter(card => Math.abs(card.percentChange) > 0.1) // Filter cards with meaningful changes
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/68e40f71-217c-4c22-a34e-0b8e58109ee3" alt="Logo" className="h-12 w-12 opacity-20" />
            <span className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>PokéMarket</span>
          </div>
          {!isLoading && (
            <Button
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              variant="outline"
              className="cursor-pointer"
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          
          {/* Animated Logo Background */}
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 0.15, x: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px]"
          >
            <motion.img
              src="https://harmless-tapir-303.convex.cloud/api/storage/68e40f71-217c-4c22-a34e-0b8e58109ee3"
              alt="Logo Background"
              className="w-full h-full object-contain"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Track Valuable Pokemon Cards</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
            Real-Time Pokemon Card Market Tracker
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Monitor prices and trends for hollow rare cards and booster products. 
            Stay ahead of the market with live updates every minute.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer text-lg px-8"
            >
              View Market
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Market Activity Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Live Market Activity</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what's moving in the market right now
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Top Percentage Changes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top % Changes Today
              </h3>
              <div className="space-y-3">
                {topPercentageChanges.length > 0 ? (
                  topPercentageChanges.map((card, index) => (
                    <motion.div
                      key={card._id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <CardItem card={card} size="compact" />
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 border rounded-lg text-center text-muted-foreground">
                    Loading market data...
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recently Updated */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recently Updated
              </h3>
              <div className="space-y-3">
                {recentlyUpdated.length > 0 ? (
                  recentlyUpdated.map((card, index) => (
                    <motion.div
                      key={card._id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <CardItem card={card} size="compact" />
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 border rounded-lg text-center text-muted-foreground">
                    Loading market data...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-16"
        >
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tracking for serious collectors and investors
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-4 p-8 border rounded-lg"
            >
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Valuable Cards Only</h3>
              <p className="text-muted-foreground">
                Track hollow rare, ultra rare, and secret rare cards. No commons, only the valuable ones.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-4 p-8 border rounded-lg"
            >
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Price Charts</h3>
              <p className="text-muted-foreground">
                Visual price history with percentage changes. See trends at a glance.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-4 p-8 border rounded-lg"
            >
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Product Tracking</h3>
              <p className="text-muted-foreground">
                Monitor booster boxes, bundles, and elite trainer boxes across all sets.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-12 text-center"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="text-5xl font-bold tracking-tight">1min</div>
            </div>
            <p className="text-muted-foreground">Update Frequency</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <div className="text-5xl font-bold tracking-tight">100%</div>
            </div>
            <p className="text-muted-foreground">Valuable Cards</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div className="text-5xl font-bold tracking-tight">Live</div>
            </div>
            <p className="text-muted-foreground">Price Charts</p>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-8 py-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Start Tracking Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant access to real-time market data for Pokemon cards and products
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer text-lg px-8"
          >
            View Market Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground space-y-2">
          <p>© 2024 PokéMarket. Built for collectors and investors.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/terms")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}