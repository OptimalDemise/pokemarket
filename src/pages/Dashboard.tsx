import { CardItem } from "@/components/CardItem";
import { ProductItem } from "@/components/ProductItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const navigate = useNavigate();
  const cards = useQuery(api.cards.getAllCards);
  const products = useQuery(api.products.getAllProducts);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all price histories for cards
  const cardPriceHistories = cards?.map((card) => 
    useQuery(api.cards.getCardPriceHistory, {
      cardId: card._id,
      limit: 20,
    })
  ) || [];

  // Fetch all price histories for products
  const productPriceHistories = products?.map((product) => 
    useQuery(api.products.getProductPriceHistory, {
      productId: product._id,
      limit: 20,
    })
  ) || [];

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const isLoading = cards === undefined || products === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Pokemon Market Tracker</h1>
                <p className="text-sm text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastUpdate(new Date())}
              className="cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="cards" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cards" className="cursor-pointer">
              Cards ({cards?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="products" className="cursor-pointer">
              Products ({products?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards?.map((card, index) => (
                  <CardItem
                    key={card._id}
                    card={card}
                    priceHistory={cardPriceHistories[index] || []}
                  />
                ))}
              </div>
              {cards?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No cards tracked yet
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((product, index) => (
                  <ProductItem
                    key={product._id}
                    product={product}
                    priceHistory={productPriceHistories[index] || []}
                  />
                ))}
              </div>
              {products?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No products tracked yet
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}