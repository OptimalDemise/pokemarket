import { CardItem } from "@/components/CardItem";
import { ProductItem } from "@/components/ProductItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

type SortOption = "newest" | "highest-change" | "lowest-change" | "highest-price" | "lowest-price" | "no-change";

const ITEMS_PER_PAGE = 50;

export default function Dashboard() {
  const navigate = useNavigate();
  const cards = useQuery(api.cards.getAllCards);
  const products = useQuery(api.products.getAllProducts);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [hasError, setHasError] = useState(false);
  const [currentCardPage, setCurrentCardPage] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedSet, setSelectedSet] = useState<string>("all");

  // Determine loading state first
  const isLoading = cards === undefined || products === undefined;

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  // Check for data fetch errors
  useEffect(() => {
    if (cards === undefined || products === undefined) {
      setHasError(false);
    } else if ((cards === null || products === null) && !isLoading) {
      setHasError(true);
    }
  }, [cards, products, isLoading]);

  // Get unique sets from cards
  const availableSets = useMemo(() => {
    if (!cards) return [];
    const sets = new Set(cards.map(card => card.setName));
    return Array.from(sets).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    if (!cards) return [];
    
    let filtered = cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.setName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = card.currentPrice >= min && card.currentPrice <= max;
      
      const matchesRarity = selectedRarity === "all" || card.rarity === selectedRarity;
      
      const matchesSet = selectedSet === "all" || card.setName === selectedSet;
      
      return matchesSearch && matchesPrice && matchesRarity && matchesSet;
    });

    return sortItems(filtered, sortOption);
  }, [cards, searchQuery, sortOption, minPrice, maxPrice, selectedRarity, selectedSet]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.setName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = product.currentPrice >= min && product.currentPrice <= max;
      
      return matchesSearch && matchesPrice;
    });

    return sortItems(filtered, sortOption);
  }, [products, searchQuery, sortOption, minPrice, maxPrice]);

  // Paginate cards
  const totalCardPages = Math.ceil(filteredAndSortedCards.length / ITEMS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentCardPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedCards.slice(startIndex, endIndex);
  }, [filteredAndSortedCards, currentCardPage]);

  // Paginate products
  const totalProductPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentProductPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentProductPage]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentCardPage(1);
    setCurrentProductPage(1);
  }, [searchQuery, sortOption, minPrice, maxPrice, selectedRarity, selectedSet]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="text-destructive text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold tracking-tight">Failed to Load Data</h2>
          <p className="text-muted-foreground">
            Unable to retrieve market data. Please check your connection and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="cursor-pointer">
              Retry
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="cursor-pointer">
              Go Home
            </Button>
          </div>
        </div>
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
        {/* Search and Sort Controls */}
          <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cards or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px] cursor-pointer">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="cursor-pointer hover:bg-primary/10">Newest First</SelectItem>
                <SelectItem value="highest-change" className="cursor-pointer hover:bg-primary/10">Highest % Change</SelectItem>
                <SelectItem value="lowest-change" className="cursor-pointer hover:bg-primary/10">Lowest % Change</SelectItem>
                <SelectItem value="no-change" className="cursor-pointer hover:bg-primary/10">No Change</SelectItem>
                <SelectItem value="highest-price" className="cursor-pointer hover:bg-primary/10">Highest Price</SelectItem>
                <SelectItem value="lowest-price" className="cursor-pointer hover:bg-primary/10">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Price and Rarity Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <span className="text-sm font-medium whitespace-nowrap">Price Range:</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  placeholder="Min ($)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full sm:w-32"
                  min="0"
                  step="0.01"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max ($)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full sm:w-32"
                  min="0"
                  step="0.01"
                />
                {(minPrice || maxPrice) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <span className="text-sm font-medium whitespace-nowrap">Rarity:</span>
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-full sm:w-[200px] cursor-pointer">
                  <SelectValue placeholder="All Rarities" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all" className="cursor-pointer hover:bg-primary/10">All Rarities</SelectItem>
                  <SelectItem value="Holo Rare" className="cursor-pointer hover:bg-primary/10">Holo Rare</SelectItem>
                  <SelectItem value="Ultra Rare" className="cursor-pointer hover:bg-primary/10">Ultra Rare</SelectItem>
                  <SelectItem value="Secret Rare" className="cursor-pointer hover:bg-primary/10">Secret Rare</SelectItem>
                  <SelectItem value="Rare Holo" className="cursor-pointer hover:bg-primary/10">Rare Holo</SelectItem>
                  <SelectItem value="Rare Holo EX" className="cursor-pointer hover:bg-primary/10">Rare Holo EX</SelectItem>
                  <SelectItem value="Rare Holo GX" className="cursor-pointer hover:bg-primary/10">Rare Holo GX</SelectItem>
                  <SelectItem value="Rare Holo V" className="cursor-pointer hover:bg-primary/10">Rare Holo V</SelectItem>
                  <SelectItem value="Rare Holo VMAX" className="cursor-pointer hover:bg-primary/10">Rare Holo VMAX</SelectItem>
                  <SelectItem value="Rare Holo VSTAR" className="cursor-pointer hover:bg-primary/10">Rare Holo VSTAR</SelectItem>
                  <SelectItem value="Rare Ultra" className="cursor-pointer hover:bg-primary/10">Rare Ultra</SelectItem>
                  <SelectItem value="Rare Rainbow" className="cursor-pointer hover:bg-primary/10">Rare Rainbow</SelectItem>
                  <SelectItem value="Special Illustration Rare" className="cursor-pointer hover:bg-primary/10">Special Illustration Rare</SelectItem>
                  <SelectItem value="Rare Secret" className="cursor-pointer hover:bg-primary/10">Rare Secret</SelectItem>
                  <SelectItem value="Rare Shining" className="cursor-pointer hover:bg-primary/10">Rare Shining</SelectItem>
                  <SelectItem value="Rare ACE" className="cursor-pointer hover:bg-primary/10">Rare ACE</SelectItem>
                  <SelectItem value="Rare BREAK" className="cursor-pointer hover:bg-primary/10">Rare BREAK</SelectItem>
                  <SelectItem value="Rare Prime" className="cursor-pointer hover:bg-primary/10">Rare Prime</SelectItem>
                  <SelectItem value="Rare Prism Star" className="cursor-pointer hover:bg-primary/10">Rare Prism Star</SelectItem>
                  <SelectItem value="Amazing Rare" className="cursor-pointer hover:bg-primary/10">Amazing Rare</SelectItem>
                  <SelectItem value="Radiant Rare" className="cursor-pointer hover:bg-primary/10">Radiant Rare</SelectItem>
                  <SelectItem value="Hyper Rare" className="cursor-pointer hover:bg-primary/10">Hyper Rare</SelectItem>
                  <SelectItem value="Illustration Rare" className="cursor-pointer hover:bg-primary/10">Illustration Rare</SelectItem>
                  <SelectItem value="Double Rare" className="cursor-pointer hover:bg-primary/10">Double Rare</SelectItem>
                  <SelectItem value="Shiny Rare" className="cursor-pointer hover:bg-primary/10">Shiny Rare</SelectItem>
                  <SelectItem value="Shiny Ultra Rare" className="cursor-pointer hover:bg-primary/10">Shiny Ultra Rare</SelectItem>
                  <SelectItem value="Trainer Gallery Rare Holo" className="cursor-pointer hover:bg-primary/10">Trainer Gallery Rare Holo</SelectItem>
                </SelectContent>
              </Select>
              
              <span className="text-sm font-medium whitespace-nowrap sm:ml-4">Set:</span>
              <Select value={selectedSet} onValueChange={setSelectedSet}>
                <SelectTrigger className="w-full sm:w-[250px] cursor-pointer">
                  <SelectValue placeholder="All Sets" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all" className="cursor-pointer hover:bg-primary/10">All Sets</SelectItem>
                  {availableSets.map((set) => (
                    <SelectItem key={set} value={set} className="cursor-pointer hover:bg-primary/10">
                      {set}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="cards" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cards" className="cursor-pointer">
              Cards ({filteredAndSortedCards.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="cursor-pointer">
              Products ({filteredAndSortedProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedCards.map((card) => (
                  <CardItemWrapper key={card._id} card={card} />
                ))}
              </div>
              {filteredAndSortedCards.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery || minPrice || maxPrice || selectedRarity !== "all" || selectedSet !== "all" ? "No cards match your filters" : "No cards tracked yet"}
                </div>
              )}
              
              {/* Pagination Controls for Cards */}
              {totalCardPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCardPage(p => Math.max(1, p - 1))}
                    disabled={currentCardPage === 1}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentCardPage} of {totalCardPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCardPage(p => Math.min(totalCardPages, p + 1))}
                    disabled={currentCardPage === totalCardPages}
                    className="cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedProducts.map((product) => (
                  <ProductItemWrapper key={product._id} product={product} />
                ))}
              </div>
              {filteredAndSortedProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery || minPrice || maxPrice ? "No products match your filters" : "No products tracked yet"}
                </div>
              )}
              
              {/* Pagination Controls for Products */}
              {totalProductPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentProductPage(p => Math.max(1, p - 1))}
                    disabled={currentProductPage === 1}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentProductPage} of {totalProductPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentProductPage(p => Math.min(totalProductPages, p + 1))}
                    disabled={currentProductPage === totalProductPages}
                    className="cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Helper function to sort items
function sortItems<T extends { percentChange: number; currentPrice: number; _creationTime: number; lastUpdated: number }>(
  items: T[],
  sortOption: SortOption
): T[] {
  const sorted = [...items];
  
  switch (sortOption) {
    case "newest":
      return sorted.sort((a, b) => b.lastUpdated - a.lastUpdated);
    case "highest-change":
      return sorted.sort((a, b) => b.percentChange - a.percentChange);
    case "lowest-change":
      return sorted.sort((a, b) => a.percentChange - b.percentChange);
    case "no-change":
      return sorted.sort((a, b) => Math.abs(a.percentChange) - Math.abs(b.percentChange));
    case "highest-price":
      return sorted.sort((a, b) => b.currentPrice - a.currentPrice);
    case "lowest-price":
      return sorted.sort((a, b) => a.currentPrice - b.currentPrice);
    default:
      return sorted;
  }
}

// Wrapper component for CardItem - no longer pre-fetches price history
function CardItemWrapper({ card }: { card: any }) {
  return <CardItem card={card} />;
}

// Wrapper component for ProductItem - no longer pre-fetches price history
function ProductItemWrapper({ product }: { product: any }) {
  return <ProductItem product={product} />;
}