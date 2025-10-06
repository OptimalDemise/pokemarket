import { CardItem } from "@/components/CardItem";
import { ProductItem } from "@/components/ProductItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

type SortOption = "newest" | "highest-change" | "lowest-change" | "highest-price" | "lowest-price" | "no-change";

const ITEMS_PER_PAGE = 50;

export default function Dashboard() {
  const navigate = useNavigate();
  const cards = useQuery(api.cards.getAllCards);
  const products = useQuery(api.products.getAllProducts);
  const topDailyChanges = useQuery(api.dailySnapshots.getTopDailyChanges, { limit: 10 });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("highest-price");
  const [hasError, setHasError] = useState(false);
  const [currentCardPage, setCurrentCardPage] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [rarityOpen, setRarityOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);

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
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Loading Market Data</h2>
            <p className="text-muted-foreground">Please wait while we fetch the latest prices...</p>
            <p className="text-sm text-muted-foreground">This shouldn't take more than a minute</p>
          </div>
        </div>
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

  const oneMinuteAgo = Date.now() - 60 * 1000;
  const liveUpdates = (cards || [])
    .filter(card => card.lastUpdated > oneMinuteAgo)
    .sort((a, b) => a.lastUpdated - b.lastUpdated) // Oldest first (bottom to top)
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Main Content Wrapper */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
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
        {/* Top Daily Changes Section */}
        {topDailyChanges && topDailyChanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 p-6 border rounded-lg bg-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Top Daily Movers</h2>
              <span className="text-sm text-muted-foreground ml-auto">Updates daily at midnight UTC</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {topDailyChanges.slice(0, 5).map((item: any) => (
                <div
                  key={item._id}
                  className="p-3 border rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                    {item.dailyPercentChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Yesterday:</span>
                      <span>${item.yesterdayPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-semibold">${item.todayPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold pt-1 border-t">
                      <span>Change:</span>
                      <span className={item.dailyPercentChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {item.dailyPercentChange >= 0 ? "+" : ""}{item.dailyPercentChange?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
              <Popover open={rarityOpen} onOpenChange={setRarityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={rarityOpen}
                    className="w-full sm:w-[200px] justify-between"
                  >
                    {selectedRarity === "all" ? "All Rarities" : selectedRarity}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search rarity..." />
                    <CommandList>
                      <CommandEmpty>No rarity found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedRarity("all");
                            setRarityOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRarity === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Rarities
                        </CommandItem>
                        {["Rare Holo", "Rare Holo EX", "Rare Holo GX", "Rare Holo V", "Rare Holo VMAX", "Rare Holo VSTAR", "Holo Rare", "Ultra Rare", "Secret Rare", "Rare Ultra", "Rare Rainbow", "Rare Secret", "Rare Shining", "Rare ACE", "Rare BREAK", "Rare Prime", "Rare Prism Star", "Amazing Rare", "Radiant Rare", "Hyper Rare", "Illustration Rare", "Special Illustration Rare", "Double Rare", "Shiny Rare", "Shiny Ultra Rare", "Trainer Gallery Rare Holo", "Promo"].map((rarity) => (
                          <CommandItem
                            key={rarity}
                            value={rarity}
                            onSelect={() => {
                              setSelectedRarity(rarity);
                              setRarityOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRarity === rarity ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {rarity}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <span className="text-sm font-medium whitespace-nowrap sm:ml-4">Set:</span>
              <Popover open={setOpen} onOpenChange={setSetOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={setOpen}
                    className="w-full sm:w-[250px] justify-between"
                  >
                    {selectedSet === "all" ? "All Sets" : selectedSet}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Search set..." />
                    <CommandList>
                      <CommandEmpty>No set found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedSet("all");
                            setSetOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSet === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Sets
                        </CommandItem>
                        {availableSets.map((set) => (
                          <CommandItem
                            key={set}
                            value={set}
                            onSelect={() => {
                              setSelectedSet(set);
                              setSetOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSet === set ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {set}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Big Movers - Past Hour (Cards Only) */}
        {(() => {
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          const recentBigMovers = (cards || [])
            .filter(card => 
              card.lastUpdated > oneHourAgo && Math.abs(card.percentChange) > 3
            )
            .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
            .slice(0, 20);

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 p-4 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold tracking-tight">Big Movers - Past Hour</h2>
                <span className="text-xs text-muted-foreground ml-auto">Changes over 3%</span>
              </div>
              {recentBigMovers.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2">
                  {recentBigMovers.map((card) => (
                    <div key={card._id} className="flex-shrink-0 w-32">
                      <CardItem card={card} size="compact" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No significant movers in the past hour</p>
                  <p className="text-xs mt-1">Waiting for changes over 3%...</p>
                </div>
              )}
            </motion.div>
          );
        })()}

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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

      {/* Live Market Updates - Vertical Sidebar (Right Side) */}
      <aside className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l bg-card/50 lg:sticky lg:top-0 lg:h-screen overflow-y-auto scroll-smooth flex-shrink-0 order-1 lg:order-2 max-h-[300px] lg:max-h-none">
        <div className="p-4 border-b bg-background/95 backdrop-blur lg:sticky top-0 z-10 flex items-center h-[73px]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-bold tracking-tight">Live Updates</h2>
            </div>
            <span className="text-xs text-muted-foreground">Last minute</span>
          </div>
        </div>
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : liveUpdates.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {liveUpdates.map((card) => (
                <div key={card._id}>
                  <CardItem card={card} size="compact" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <p>No recent updates</p>
              <p className="mt-1">Waiting for market changes...</p>
            </div>
          )}
        </div>
      </aside>
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