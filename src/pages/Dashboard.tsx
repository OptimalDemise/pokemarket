import { CardItem } from "@/components/CardItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, X, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Maximize2, Minimize2, Filter, Heart } from "lucide-react";
import { useEffect, useMemo, useState, memo } from "react";
import { useNavigate } from "react-router";

type SortOption = "newest" | "highest-change" | "lowest-change" | "highest-price" | "lowest-price" | "no-change";

const ITEMS_PER_PAGE = 30;
const LIVE_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes for basic plan
const LIVE_UPDATES_LIMIT = 18; // Balanced limit for visibility of updates

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch data with manual refresh control
  const [refreshKey, setRefreshKey] = useState(0);
  const cards = useQuery(api.cards.getAllCards);
  const topDailyChanges = useQuery(api.dailySnapshots.getTopDailyChanges, { limit: 20 });
  const bigMovers = useQuery(api.cards.getBigMovers, { hoursAgo: 1, minPercentChange: 3, limit: 20 });
  
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("highest-price");
  const [hasError, setHasError] = useState(false);
  const [currentCardPage, setCurrentCardPage] = useState(1);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [rarityOpen, setRarityOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);
  const [showTopDailyMovers, setShowTopDailyMovers] = useState(true);
  const [topDailyMoversPage, setTopDailyMoversPage] = useState(0); // 0 for first 10, 1 for next 10
  const [showBigMovers, setShowBigMovers] = useState(true);
  const [showLiveUpdates, setShowLiveUpdates] = useState(true);
  const [isLiveUpdatesFullscreen, setIsLiveUpdatesFullscreen] = useState(false);
  const [showOnlyFavoritesInLiveUpdates, setShowOnlyFavoritesInLiveUpdates] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Determine loading state first
  const isLoading = cards === undefined;

  // Fetch user favorites
  const userFavorites = useQuery(api.favorites.getUserFavorites);
  const favoriteCardIds = useMemo(() => {
    return new Set(userFavorites?.map(fav => fav._id) || []);
  }, [userFavorites]);

  // Only fetch live updates if sidebar is open - with smooth rendering
  const threeMinutesAgo = Date.now() - 3 * 60 * 1000; // Reduced from 5 to 3 minutes for more recent updates
  const liveUpdates = useMemo(() => {
    if (!showLiveUpdates || !cards) return [];
    
    let filteredCards = cards.filter(card => {
      // Filter by time
      if (card.lastUpdated <= threeMinutesAgo) return false;
      
      // Remove this filter to allow 0.00% changes to appear
      // if (Math.abs(card.percentChange) < 0.01) return false;
      
      return true;
    });
    
    // Apply favorites filter if enabled
    if (showOnlyFavoritesInLiveUpdates) {
      filteredCards = filteredCards.filter(card => favoriteCardIds.has(card._id));
    }
    
    return filteredCards
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, LIVE_UPDATES_LIMIT)
      .map(card => ({
        ...card,
        // Add a stable key to prevent remounting
        _stableKey: card._id
      }));
  }, [cards, showLiveUpdates, showOnlyFavoritesInLiveUpdates, favoriteCardIds, threeMinutesAgo]);

  // Get the most recent update timestamp
  const mostRecentUpdate = liveUpdates.length > 0 
    ? Math.max(...liveUpdates.map(card => card.lastUpdated))
    : null;

  // Auto-refresh every 10 minutes (basic plan)
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setRefreshKey(prev => prev + 1);
    }, LIVE_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Check for data fetch errors
  useEffect(() => {
    if (cards === undefined) {
      setHasError(false);
    } else if (cards === null && !isLoading) {
      setHasError(true);
    }
  }, [cards, isLoading]);

  // Get unique sets from cards
  const availableSets = useMemo(() => {
    if (!cards) return [];
    const sets = new Set(cards.map(card => card.setName));
    return Array.from(sets).sort();
  }, [cards]);

  // Helper function for fuzzy string matching (Levenshtein distance)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Calculate similarity percentage
  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
  };

  // Filter and sort cards with partial matching search
  const filteredAndSortedCards = useMemo(() => {
    if (!cards) return [];
    
    let filtered = cards.filter(card => {
      // Partial matching search logic
      if (searchQuery.trim()) {
        const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
        const cardName = card.name.toLowerCase();
        const setName = card.setName.toLowerCase();
        const combinedText = `${cardName} ${setName}`;
        
        // Check if ALL search words are found in the card text
        const matchesSearch = searchWords.every(searchWord => {
          // Special case: "mew" must be exact match (not "mewtwo")
          if (searchWord === 'mew') {
            // Check if "mew" appears as a standalone word
            const regex = /\bmew\b/;
            return regex.test(cardName) || regex.test(setName);
          }
          
          // For all other searches, use partial matching (substring)
          return combinedText.includes(searchWord);
        });
        
        if (!matchesSearch) return false;
      }
      
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = card.currentPrice >= min && card.currentPrice <= max;
      
      const matchesRarity = selectedRarity === "all" || card.rarity === selectedRarity;
      
      const matchesSet = selectedSet === "all" || card.setName === selectedSet;
      
      return matchesPrice && matchesRarity && matchesSet;
    });

    return sortItems(filtered, sortOption);
  }, [cards, searchQuery, sortOption, minPrice, maxPrice, selectedRarity, selectedSet]);

  // Paginate cards
  const totalCardPages = Math.ceil(filteredAndSortedCards.length / ITEMS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentCardPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedCards.slice(startIndex, endIndex);
  }, [filteredAndSortedCards, currentCardPage]);

  // Generate search suggestions when no results found
  useEffect(() => {
    if (!searchQuery.trim() || !cards) {
      setSearchSuggestions([]);
      return;
    }

    const hasResults = filteredAndSortedCards.length > 0;
    
    if (!hasResults) {
      // Extract all unique words from card and product names
      const allWords = new Set<string>();
      
      cards.forEach(card => {
        card.name.toLowerCase().split(/\s+/).forEach((word: string) => {
          if (word.length > 2) allWords.add(word);
        });
        card.setName.toLowerCase().split(/\s+/).forEach((word: string) => {
          if (word.length > 2) allWords.add(word);
        });
      });
      
      // Find similar words for each search term
      const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
      const suggestions = new Map<string, { word: string; similarity: number; originalWord: string }>();
      
      searchWords.forEach(searchWord => {
        if (searchWord.length < 2) return;
        
        Array.from(allWords).forEach(word => {
          const similarity = calculateSimilarity(searchWord, word);
          
          // If similarity is high (70%+) and word is not already in search
          if (similarity >= 70 && similarity < 100 && !searchWords.includes(word)) {
            const key = `${searchWord}-${word}`;
            const currentScore = suggestions.get(key)?.similarity || 0;
            if (similarity > currentScore) {
              suggestions.set(key, { word, similarity, originalWord: searchWord });
            }
          }
        });
      });
      
      // Sort by similarity and take top 5
      const topSuggestions = Array.from(suggestions.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(({ word }) => word);
      
      setSearchSuggestions(topSuggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, filteredAndSortedCards, cards]);

  // Helper function to replace misspelled word in search query
  const handleSuggestionClick = (suggestion: string) => {
    if (!searchQuery.trim()) {
      setSearchQuery(suggestion);
      setSearchSuggestions([]);
      return;
    }

    const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
    const allWords = new Set<string>();
    
    // Collect all valid words from cards and products
    if (cards) {
      cards.forEach(card => {
        card.name.toLowerCase().split(/\s+/).forEach((word: string) => {
          if (word.length > 2) allWords.add(word);
        });
        card.setName.toLowerCase().split(/\s+/).forEach((word: string) => {
          if (word.length > 2) allWords.add(word);
        });
      });
    }

    // Find which word in the search query is most similar to the suggestion
    let bestMatchIndex = -1;
    let bestSimilarity = 0;

    searchWords.forEach((searchWord, index) => {
      const similarity = calculateSimilarity(searchWord, suggestion);
      if (similarity > bestSimilarity && similarity < 100) {
        bestSimilarity = similarity;
        bestMatchIndex = index;
      }
    });

    // Replace the misspelled word with the suggestion
    if (bestMatchIndex !== -1) {
      const originalWords = searchQuery.trim().split(/\s+/);
      originalWords[bestMatchIndex] = suggestion;
      setSearchQuery(originalWords.join(' '));
    } else {
      // If no good match found, just append the suggestion
      setSearchQuery(searchQuery.trim() + ' ' + suggestion);
    }
    
    setSearchSuggestions([]);
  };

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentCardPage(1);
  }, [searchQuery, sortOption, minPrice, maxPrice, selectedRarity, selectedSet]);

  if (isLoading) {
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
              <h2 className="text-2xl font-bold tracking-tight">Loading Market Data</h2>
            </div>
            <p className="text-muted-foreground">
              Please wait while we fetch the latest prices...
            </p>
            <p className="text-sm text-muted-foreground/70">
              This shouldn't take more than a minute
            </p>
          </motion.div>
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

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Main Content Wrapper */}
      <div className={cn(
        "flex-1 min-w-0 order-2 lg:order-1",
        isLiveUpdatesFullscreen && "hidden"
      )}>
        {/* Header */}
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
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
            
            {/* Search and Sort Controls - Now in sticky header */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="relative">
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
                      onClick={() => {
                        setSearchQuery("");
                        setSearchSuggestions([]);
                      }}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Search Suggestions */}
                {searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 bg-secondary/50 rounded-lg border"
                  >
                    <p className="text-xs text-muted-foreground mb-2">Did you mean:</p>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
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
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Ad Zone 1: Top Banner - Logo placeholder */}
          <div className="mb-6 min-h-[90px] sm:min-h-[120px] flex items-center justify-center bg-secondary/20 rounded-lg border border-dashed border-muted-foreground/20">
            <img 
              src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" 
              alt="PokéMarket" 
              className="h-16 w-16 opacity-20"
            />
          </div>

          {/* Rarity and Set Filters */}
          <div className="flex flex-col gap-4 mb-6">
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
                        {["Rare Holo", "Rare Holo EX", "Rare Holo GX", "Rare Holo V", "Rare Holo VMAX", "Rare Holo VSTAR", "Rare Ultra", "Rare Rainbow", "Rare Secret", "Rare Shining", "Rare ACE", "Rare BREAK", "Rare Prime", "Rare Prism Star", "Amazing Rare", "Radiant Rare", "Hyper Rare", "Illustration Rare", "Special Illustration Rare", "Double Rare", "Shiny Rare", "Shiny Ultra Rare", "Trainer Gallery Rare Holo", "Black White Rare", "Rare Shiny GX", "Rare Holo Star", "Rare Holo LV.X", "LEGEND", "Promo"].map((rarity) => (
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

          {/* Price Range Filter */}
          <div className="flex flex-col gap-4 mb-8">
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
          </div>

          <Tabs defaultValue="cards" className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="cards" className="cursor-pointer">
                Cards ({filteredAndSortedCards.length})
              </TabsTrigger>
              <TabsTrigger value="movers" className="cursor-pointer">
                Market Movers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {paginatedCards.map((card, index) => (
                    <>
                      <CardItemWrapper key={card._id} card={card} />
                      {/* Native Ad Card - Every 10th position - Logo placeholder */}
                      {(index + 1) % 10 === 0 && index < paginatedCards.length - 1 && (
                        <div key={`ad-${card._id}`} className="flex items-center justify-center bg-secondary/20 rounded-lg border border-dashed border-muted-foreground/20">
                          <img 
                            src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" 
                            alt="PokéMarket" 
                            className="h-16 w-16 opacity-20"
                          />
                        </div>
                      )}
                    </>
                  ))}
                </div>
                {filteredAndSortedCards.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery || minPrice || maxPrice || selectedRarity !== "all" || selectedSet !== "all" ? "No cards match your filters" : "No cards tracked yet"}
                  </div>
                )}
                
                {/* Ad Zone 3: Above Pagination - Logo placeholder */}
                {filteredAndSortedCards.length > 0 && (
                  <div className="mt-6 mb-4 min-h-[60px] sm:min-h-[90px] flex items-center justify-center bg-secondary/20 rounded-lg border border-dashed border-muted-foreground/20">
                    <img 
                      src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" 
                      alt="PokéMarket" 
                      className="h-16 w-16 opacity-20"
                    />
                  </div>
                )}

                {/* Pagination Controls for Cards */}
                {totalCardPages > 1 && (
                  <div className={cn(
                    "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t py-3 z-20",
                    showLiveUpdates && "lg:right-80"
                  )}>
                    <div className="flex items-center justify-center gap-2">
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
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          Page
                        </span>
                        <Select 
                          value={currentCardPage.toString()} 
                          onValueChange={(value) => setCurrentCardPage(parseInt(value))}
                        >
                          <SelectTrigger className="w-[80px] cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: totalCardPages }, (_, i) => i + 1).map((page) => (
                              <SelectItem key={page} value={page.toString()} className="cursor-pointer">
                                {page}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          of {totalCardPages}
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
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="movers" className="space-y-6">
              {/* Top Daily Movers */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-6 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">Top Daily Movers</h2>
                  <span className="text-sm text-muted-foreground ml-auto mr-2">Updates daily at midnight UTC</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTopDailyMovers(!showTopDailyMovers)}
                    className="cursor-pointer h-8 w-8"
                  >
                    {showTopDailyMovers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <AnimatePresence>
                  {showTopDailyMovers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      {topDailyChanges && topDailyChanges.length > 0 ? (
                        <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {topDailyChanges.slice(topDailyMoversPage * 10, (topDailyMoversPage + 1) * 10).map((item: any) => (
                            <div key={item._id} className="space-y-2">
                              <CardItem card={item} size="compact" />
                              <div className="px-2 py-1.5 bg-secondary/30 rounded text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Yesterday:</span>
                                  <span className="font-medium">${item.yesterdayPrice?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Today:</span>
                                  <span className="font-medium">${item.todayPrice?.toFixed(2) || item.currentPrice?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                                  <span className="text-muted-foreground">Change:</span>
                                  <span className={`font-bold ${(item.dailyPercentChange || item.percentChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(item.dailyPercentChange || item.percentChange || 0) >= 0 ? '+' : ''}{(item.dailyPercentChange || item.percentChange || 0).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {topDailyChanges.length > 10 && (
                          <div className="flex items-center justify-center gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTopDailyMoversPage(0)}
                              disabled={topDailyMoversPage === 0}
                              className="cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {topDailyMoversPage === 0 ? "1-10" : "11-20"} of {topDailyChanges.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTopDailyMoversPage(1)}
                              disabled={topDailyMoversPage === 1 || topDailyChanges.length <= 10}
                              className="cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <p>No daily changes yet</p>
                          <p className="mt-1 text-xs">Check back after midnight UTC</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Big Movers - Past Hour */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-4 border rounded-lg bg-card"
              >
                {bigMovers && bigMovers.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h2 className="text-lg font-bold tracking-tight">Big Movers - Past Hour</h2>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">Changes over 3%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowBigMovers(!showBigMovers)}
                        className="cursor-pointer h-8 w-8"
                      >
                        {showBigMovers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    <AnimatePresence>
                      {showBigMovers && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2">
                            {bigMovers.map((card) => (
                              <div key={card._id} className="flex-shrink-0 w-32">
                                <CardItem card={card} size="compact" />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-lg font-bold tracking-tight">Big Movers - Past Hour</h2>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">Changes over 3%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowBigMovers(!showBigMovers)}
                        className="cursor-pointer h-8 w-8"
                      >
                        {showBigMovers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    <AnimatePresence>
                      {showBigMovers && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <p>No significant movers in the past hour</p>
                            <p className="mt-1 text-xs">Waiting for changes over 3%...</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Live Market Updates - Vertical Sidebar (Right Side) */}
      <AnimatePresence>
        {showLiveUpdates && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "overflow-y-auto scroll-smooth flex-shrink-0 relative",
              isLiveUpdatesFullscreen 
                ? "fixed inset-0 z-50 w-full h-full bg-background" 
                : "bg-card/50 border-t lg:border-t-0 lg:border-l w-full lg:w-80 lg:sticky lg:top-0 lg:h-screen order-1 lg:order-2 max-h-[300px] lg:max-h-none"
            )}
          >
            {/* Close button positioned at left edge, vertically centered - sticky */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 lg:sticky lg:top-1/2 lg:-translate-y-1/2 z-20">
              <Button
                variant="default"
                size="icon"
                onClick={() => setShowLiveUpdates(false)}
                className="cursor-pointer h-10 w-10 rounded-full shadow-lg group hover:w-auto hover:rounded-full hover:px-4 transition-all duration-300 opacity-70 hover:opacity-100"
                title="Close Live Updates"
              >
                <div className="flex items-center justify-center">
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[120px] opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2">
                    Close Live Updates
                  </span>
                </div>
              </Button>
            </div>

            <div className={cn(
              "bg-background z-10",
              isLiveUpdatesFullscreen ? "sticky top-0 border-b-0" : "lg:sticky lg:top-0 border-b-0"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex-1 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${liveUpdates.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                    <h2 className="text-sm font-bold tracking-tight">Live Updates</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {mostRecentUpdate 
                      ? `Updated ${Math.floor((Date.now() - mostRecentUpdate) / 1000)}s ago`
                      : 'Last 5 minutes'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={showOnlyFavoritesInLiveUpdates ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setShowOnlyFavoritesInLiveUpdates(!showOnlyFavoritesInLiveUpdates)}
                    className="cursor-pointer h-8 w-8"
                    title={showOnlyFavoritesInLiveUpdates ? "Show All Updates" : "Show Only Favorites"}
                  >
                    <Heart className={`h-4 w-4 ${showOnlyFavoritesInLiveUpdates ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsLiveUpdatesFullscreen(!isLiveUpdatesFullscreen)}
                    className="cursor-pointer h-8 w-8"
                    title={isLiveUpdatesFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isLiveUpdatesFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className={cn("p-2 pl-4 overflow-y-auto", isLiveUpdatesFullscreen && "p-6 pl-4")}>
              {liveUpdates.length > 0 ? (
                <div className={cn(
                  "grid gap-2",
                  isLiveUpdatesFullscreen 
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" 
                    : "grid-cols-2"
                )}>
                  {liveUpdates.map((card) => (
                    <div key={`live-update-${card._id}`}>
                      <CardItem card={card} size={isLiveUpdatesFullscreen ? "default" : "compact"} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <p>No recent updates</p>
                  <p className="mt-1">Waiting for market changes...</p>
                  <p className="mt-2 text-[10px]">
                    Last refresh: {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle button when sidebar is closed */}
      {!showLiveUpdates && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-20"
        >
          <Button
            variant="default"
            onClick={() => setShowLiveUpdates(true)}
            className="cursor-pointer h-10 w-10 rounded-full shadow-lg group hover:w-auto hover:rounded-full hover:px-4 transition-all duration-300 opacity-70 hover:opacity-100"
            title="Open Live Updates"
            aria-label="Open Live Updates"
          >
            <div className="flex items-center justify-center">
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[120px] opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2">
                Open Live Updates
              </span>
            </div>
          </Button>
        </motion.div>
      )}
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

// Wrapper component for CardItem - memoized for performance
const CardItemWrapper = memo(({ card }: { card: any }) => {
  return <CardItem card={card} />;
});