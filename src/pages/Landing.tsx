import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Package, Sparkles, TrendingUp, TrendingDown, Sun, Moon, User, Settings, Crown, Heart, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CardItem } from "@/components/CardItem";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const cards = useQuery(api.cards.getAllCards);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isNavigating, setIsNavigating] = useState(false);

  // Initialize theme from localStorage or default to light
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  // Toggle theme function
  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Get top 3 cards by daily percentage change (resets daily at midnight UTC)
  const dailyChanges = useQuery(api.dailySnapshots.getTopDailyChanges, { limit: 10 });
  const topPercentageChanges = (dailyChanges || [])
    .filter((item): item is NonNullable<typeof item> => item !== null && item.itemType === "card")
    .slice(0, 3);

  // Get 3 most recently updated cards with actual price changes
  const recentlyUpdated = cards
    ?.filter(card => Math.abs(card.percentChange) > 0.1) // Filter cards with meaningful changes
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 3) || [];

  const handleNavigateToDashboard = () => {
    setIsNavigating(true);
    navigate("/dashboard");
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" alt="Logo" className="h-7 w-7 sm:h-12 sm:w-12 flex-shrink-0" />
            <span className="text-base sm:text-2xl font-bold tracking-tight cursor-pointer truncate" onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>PokéMarket</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Premium Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/premium")}
                className="cursor-pointer gap-1 h-6 sm:h-8 px-2 sm:px-3 group"
              >
                <Crown className="h-3 w-3 sm:h-4 sm:w-4 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:fill-amber-500 dark:group-hover:fill-amber-400 transition-colors" />
                <span className="hidden sm:inline text-xs sm:text-sm">Premium</span>
              </Button>

              {/* Theme Toggle Buttons */}
              <div className="flex items-center gap-0.5 sm:gap-1 border rounded-md p-0.5 sm:p-1">
                <Button
                  variant={theme === "light" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => toggleTheme("light")}
                  className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8 group"
                >
                  <Sun className="h-3 w-3 sm:h-4 sm:w-4 group-hover:fill-current transition-all" />
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => toggleTheme("dark")}
                  className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8 group"
                >
                  <Moon className="h-3 w-3 sm:h-4 sm:w-4 group-hover:fill-current transition-all" />
                </Button>
              </div>

              {/* Sign In Button - Now visible on all screen sizes */}
              <Button
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                variant="outline"
                size="sm"
                className="cursor-pointer h-6 sm:h-9 text-xs sm:text-sm px-2 sm:px-4"
              >
                {isAuthenticated ? "Market" : "Sign In"}
              </Button>

              {/* Profile Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={user?.image || ""} alt="Profile" />
                    <AvatarFallback>
                      <User className="h-4 w-4 sm:h-6 sm:w-6" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    Welcome back, {user?.name || user?.email || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account-settings")} className="group">
                    <Settings className="mr-2 h-4 w-4 transition-all" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/premium")} className="group">
                    <Crown className="mr-2 h-4 w-4 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:fill-amber-500 dark:group-hover:fill-amber-400 transition-all" />
                    <span>Premium Service</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/favorites")}
                    className="cursor-pointer group"
                  >
                    <Heart className="mr-2 h-4 w-4 group-hover:fill-red-500 group-hover:text-red-500 transition-all" />
                    <span>Favorites/Watchlist</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAuthenticated && (
                    <DropdownMenuItem 
                      variant="destructive"
                      onClick={async () => {
                        await signOut();
                        navigate("/");
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        {/* Animated Logo Background - Optimized for mobile */}
        <motion.div
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          animate={{ opacity: 0.15, x: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] z-20 pointer-events-none will-change-transform"
        >
          <motion.img
            src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a"
            alt="Logo Background"
            className="w-full h-full object-contain"
            animate={{ 
              x: [0, 20, -15, 20, 0],
              y: [0, -15, 10, -15, 0],
              rotate: [0, 2, -1.5, 2, 0],
              scale: [1, 1.02, 0.99, 1.02, 1]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
            style={{ willChange: 'transform' }}
          />
        </motion.div>
        
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
            Stay ahead of the market with live updates.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleNavigateToDashboard}
              className="cursor-pointer text-lg px-8"
            >
              View Market
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Ad Space 1: Subtle Banner */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="max-w-xl mx-auto p-3 border rounded-lg bg-secondary/10 flex items-center justify-center min-h-[80px]">
          <div className="text-center text-muted-foreground">
            <p className="text-xs font-medium">Advertisement</p>
            <p className="text-[10px] mt-1">Sponsored Content</p>
          </div>
        </div>
      </section>

      {/* Market Activity Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
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
              viewport={{ once: false }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top % Changes Today
              </h3>
              <div className="space-y-3">
                {topPercentageChanges.length > 0 ? (
                  topPercentageChanges.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: false }}
                    >
                      <CardItem card={item} size="compact" />
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
              viewport={{ once: false }}
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
                      viewport={{ once: false }}
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
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
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
              viewport={{ once: false }}
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
              viewport={{ once: false }}
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
              viewport={{ once: false }}
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

          {/* Ad Space 2: Native Ad below Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: false }}
            className="max-w-xl mx-auto p-3 border rounded-lg bg-secondary/5 min-h-[80px]"
          >
            <div className="flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-10 w-10 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Sponsored</p>
                <h3 className="text-base font-semibold">Ad Space</h3>
                <p className="text-xs text-muted-foreground">
                  Partner with us to reach collectors
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
          className="grid md:grid-cols-3 gap-12 text-center"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="text-5xl font-bold tracking-tight">Up to 1 min</div>
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
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
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
            onClick={handleNavigateToDashboard}
            className="cursor-pointer text-lg px-8"
          >
            View Market Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about PokéMarket
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What cards does PokéMarket track?</AccordionTrigger>
                <AccordionContent>
                  PokéMarket focuses exclusively on valuable Pokemon cards, including Rare Holo, Ultra Rare, Secret Rare, Hyper Rare, Illustration Rare, Special Illustration Rare, and many other premium rarities. We track cards from vintage to modern sets, prioritizing those with market values above $5 to ensure you're monitoring the most valuable collectibles.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How often are prices updated?</AccordionTrigger>
                <AccordionContent>
                  Card prices are updated every 10 minutes with staggered updates to ensure smooth performance, while product prices refresh every minute. Price history for charts is recorded every 10 minutes or when significant price changes occur (greater than 0.1%), ensuring you have accurate trend data without unnecessary noise.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Where does the pricing data come from?</AccordionTrigger>
                <AccordionContent>
                  All pricing data is sourced from the Pokemon TCG API, which aggregates market prices from TCGPlayer. We prioritize holofoil market prices, followed by 1st Edition holofoil, reverse holofoil, and normal market prices to give you the most relevant pricing information for valuable cards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What do the percentage changes mean?</AccordionTrigger>
                <AccordionContent>
                  The percentage change shows how much a card's price has changed since the last recorded price point. We also display an "Overall Trend" percentage that shows the total price change from the very first recorded price to the current price, giving you both short-term and long-term market insights.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>What does "Recent Sale" mean?</AccordionTrigger>
                <AccordionContent>
                  When you see "Recent: $X" instead of the regular price, it indicates that the current price deviates significantly (more than 10%) from the average price of recent history. This often suggests a recent sale or unusual market activity, and we show the average price with a strikethrough for comparison.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Can I buy cards directly through PokéMarket?</AccordionTrigger>
                <AccordionContent>
                  PokéMarket is a tracking and monitoring tool, not a marketplace. However, each card includes a direct link to TCGPlayer's search results where you can find sellers and make purchases. We help you track prices and trends so you can make informed buying decisions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>How far back does price history go?</AccordionTrigger>
                <AccordionContent>
                  We maintain price history data for up to 90 days for individual cards and products. Daily snapshots are kept for up to one year, allowing you to analyze both short-term fluctuations and long-term trends in the Pokemon card market.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>Do I need to create an account?</AccordionTrigger>
                <AccordionContent>
                  Yes, you need to sign in to access the market dashboard and track prices. We use a secure email OTP (one-time password) authentication system to protect your account. Simply enter your email, receive a verification code, and you're ready to start tracking the Pokemon card market.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </motion.div>
      </section>

      {/* Ad Space 3: Footer Banner */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="max-w-xl mx-auto p-3 border rounded-lg bg-secondary/10 flex items-center justify-center min-h-[80px]">
          <div className="text-center text-muted-foreground">
            <p className="text-xs font-medium">Advertisement</p>
            <p className="text-[10px] mt-1">Footer Banner Space</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
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
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => navigate("/contact")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}