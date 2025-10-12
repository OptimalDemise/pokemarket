import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Maximize2, Heart, DollarSign, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceChart } from "./PriceChart";
import { useState, memo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface CardItemProps {
  card: {
    _id: Id<"cards">;
    name: string;
    setName: string;
    cardNumber: string;
    rarity: string;
    currentPrice: number;
    percentChange: number;
    overallPercentChange?: number;
    imageUrl?: string;
    tcgplayerUrl?: string;
    averagePrice?: number;
    isRecentSale?: boolean;
    lastUpdated: number;
  };
  size?: "default" | "compact";
}

// Exchange rate interface
interface ExchangeRates {
  GBP: number;
  EUR: number;
  CNY: number;
  JPY: number;
  timestamp: number;
}

export const CardItem = memo(function CardItem({ card, size = "default" }: CardItemProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showUnfavoriteDialog, setShowUnfavoriteDialog] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  
  // Get user's preferred currency (default to USD) - MUST BE BEFORE selectedCurrencies
  const preferredCurrency = user?.preferredCurrency || "USD";
  
  // Check if user has Pro or Enterprise plan
  const hasProAccess = user?.plan === "Pro" || user?.plan === "Enterprise";
  
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<string>>(() => {
    // If preferred currency is not USD, include USD in the default selections
    const defaultCurrencies = new Set(['GBP', 'EUR', 'CNY', 'JPY']);
    if (preferredCurrency !== "USD") {
      defaultCurrencies.add('USD');
    }
    return defaultCurrencies;
  });
  
  // Only fetch price history when dialog is opened
  const priceHistory = useQuery(
    api.cards.getCardPriceHistory,
    isOpen ? { cardId: card._id } : "skip"
  );

  // Favorites functionality with null safety
  const isFavorited = useQuery(api.favorites.isFavorited, { cardId: card._id }) ?? false;
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  // Fetch exchange rates on mount if user has a non-USD preferred currency
  // Also refetch when preferred currency changes
  useEffect(() => {
    if (preferredCurrency !== "USD") {
      fetchExchangeRates();
    }
  }, [preferredCurrency]);

  // Also fetch when dialog opens if not already fetched
  useEffect(() => {
    if (isOpen && !exchangeRates) {
      fetchExchangeRates();
    }
  }, [isOpen]);

  // Update selected currencies when preferred currency changes
  useEffect(() => {
    setSelectedCurrencies((prev) => {
      const newSet = new Set(prev);
      if (preferredCurrency !== "USD") {
        newSet.add('USD');
      } else {
        // If switching back to USD, remove it from selections
        newSet.delete('USD');
      }
      return newSet;
    });
  }, [preferredCurrency]);

  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    setRatesError(null);
    
    try {
      // Check if we have cached rates (less than 1 hour old)
      const cachedRates = localStorage.getItem('exchangeRates');
      if (cachedRates) {
        const parsed = JSON.parse(cachedRates);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (parsed.timestamp > oneHourAgo) {
          setExchangeRates(parsed);
          setRatesLoading(false);
          return;
        }
      }

      // Fetch fresh rates from API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      
      const data = await response.json();
      const rates: ExchangeRates = {
        GBP: data.rates.GBP,
        EUR: data.rates.EUR,
        CNY: data.rates.CNY,
        JPY: data.rates.JPY,
        timestamp: Date.now()
      };
      
      setExchangeRates(rates);
      localStorage.setItem('exchangeRates', JSON.stringify(rates));
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setRatesError('Unable to fetch exchange rates');
      
      // Use fallback rates if API fails
      const fallbackRates: ExchangeRates = {
        GBP: 0.79,
        EUR: 0.92,
        CNY: 7.24,
        JPY: 149.50,
        timestamp: Date.now()
      };
      setExchangeRates(fallbackRates);
    } finally {
      setRatesLoading(false);
    }
  };

  const formatCurrency = (amount: number, decimals: number = 2): string => {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      return '0.00';
    }
    return amount.toFixed(decimals);
  };

  const getConvertedPrice = (currency: keyof Omit<ExchangeRates, 'timestamp'>): number => {
    if (!exchangeRates) return 0;
    return card.currentPrice * exchangeRates[currency];
  };

  // Get display price based on user's preferred currency
  const getDisplayPrice = (usdPrice: number): number => {
    if (!exchangeRates || preferredCurrency === "USD") return usdPrice;
    
    const currencyKey = preferredCurrency as keyof Omit<ExchangeRates, 'timestamp'>;
    const rate = exchangeRates[currencyKey];
    
    if (rate && typeof rate === 'number' && rate > 0) {
      return usdPrice * rate;
    }
    
    console.warn(`Invalid exchange rate for ${currencyKey}:`, rate);
    return usdPrice;
  };

  // Get currency symbol based on preferred currency
  const getCurrencySymbol = (): string => {
    switch (preferredCurrency) {
      case "GBP": return "£";
      case "EUR": return "€";
      case "CNY": return "¥";
      case "JPY": return "¥";
      default: return "$";
    }
  };

  // Get USD price from display price
  const getUSDFromDisplay = (displayPrice: number): number => {
    if (!exchangeRates || preferredCurrency === "USD") return displayPrice;
    
    const currencyKey = preferredCurrency as keyof Omit<ExchangeRates, 'timestamp'>;
    if (exchangeRates[currencyKey]) {
      return displayPrice / exchangeRates[currencyKey];
    }
    return displayPrice;
  };

  const getLastUpdatedTime = (): string => {
    if (!exchangeRates) return '';
    const minutes = Math.floor((Date.now() - exchangeRates.timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleFavoriteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isFavorited) {
      setShowUnfavoriteDialog(true);
      return;
    }
    
    toggleFavorite({ cardId: card._id })
      .catch((error) => {
        console.error("Failed to toggle favorite:", error);
      });
  };

  const handleConfirmUnfavorite = () => {
    toggleFavorite({ cardId: card._id })
      .then(() => {
        setShowUnfavoriteDialog(false);
      })
      .catch((error) => {
        console.error("Failed to unfavorite:", error);
        setShowUnfavoriteDialog(false);
      });
  };

  const isCompact = size === "compact";
  
  // Safe timestamp calculations with validation
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const oneMinuteAgo = now - 60 * 1000;
  
  // Validate lastUpdated timestamp
  const validLastUpdated = typeof card.lastUpdated === 'number' && card.lastUpdated > 0 ? card.lastUpdated : now;
  const isRecentlyUpdated = validLastUpdated > fiveMinutesAgo;
  const isJustUpdated = validLastUpdated > oneMinuteAgo;

  // Safe price formatting with validation
  const formatPrice = (price: number | undefined): string => {
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return '0.00';
    }
    return price.toFixed(2);
  };

  // Safe percentage formatting
  const formatPercentage = (percent: number | undefined): string => {
    if (typeof percent !== 'number' || isNaN(percent) || !isFinite(percent)) {
      return '0.00';
    }
    return percent.toFixed(2);
  };

  // Calculate display prices - only convert if exchange rates are loaded
  const displayPrice = (exchangeRates && preferredCurrency !== "USD") 
    ? getDisplayPrice(card.currentPrice) 
    : card.currentPrice;
  const displayAveragePrice = card.averagePrice 
    ? ((exchangeRates && preferredCurrency !== "USD") 
        ? getDisplayPrice(card.averagePrice) 
        : card.averagePrice)
    : undefined;
  const currencySymbol = getCurrencySymbol();

  // Additional debug for JPY conversion
  if (preferredCurrency === "JPY" && exchangeRates) {
    console.log("=== JPY Conversion Check ===");
    console.log("Input USD Price:", card.currentPrice);
    console.log("JPY Rate from exchangeRates:", exchangeRates.JPY);
    console.log("Direct calculation:", card.currentPrice * exchangeRates.JPY);
    console.log("getDisplayPrice result:", getDisplayPrice(card.currentPrice));
    console.log("Final displayPrice:", displayPrice);
  }

  // Debug logging to check exchange rates and conversion
  if (preferredCurrency === "JPY") {
    console.log("=== JPY Debug Info ===");
    console.log("Exchange Rates Loaded:", !!exchangeRates);
    if (exchangeRates) {
      console.log("JPY Exchange Rate:", exchangeRates.JPY);
      console.log("Card Current Price (USD):", card.currentPrice);
      console.log("Calculated JPY Price:", card.currentPrice * exchangeRates.JPY);
      console.log("Display Price (JPY):", displayPrice);
      console.log("Currency Symbol:", currencySymbol);
    }
  }

  return (
    <>
      {/* Unfavorite Confirmation Dialog */}
      <AlertDialog open={showUnfavoriteDialog} onOpenChange={setShowUnfavoriteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from favorites?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{card.name || 'this card'}" from your favorites?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.stopPropagation();
              handleConfirmUnfavorite();
            }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0
            }}
            transition={{ 
              duration: 0.3
            }}
            className="cursor-pointer relative"
          >
            <Card className={`${isCompact ? 'p-2' : 'p-2 sm:p-4'} hover:border-primary transition-all hover:shadow-lg`}>
              {/* Favorite Heart Icon */}
              <button
                onClick={handleFavoriteClick}
                onTouchEnd={handleFavoriteClick}
                className="absolute top-2 left-2 z-[5] p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all touch-manipulation"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                type="button"
              >
                <Heart
                  className={`h-4 w-4 transition-all ${
                    isFavorited 
                      ? "fill-red-500 text-red-500" 
                      : "text-muted-foreground hover:text-red-500"
                  }`}
                />
              </button>

              {isJustUpdated && (
                <div className="absolute top-2 right-2 z-[5]">
                  <span className="bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                    UPDATED
                  </span>
                </div>
              )}
              <div className={isCompact ? 'space-y-1.5' : 'space-y-3'}>
                {/* Card Image */}
                {card.imageUrl && (
                  <div className={`w-full ${isCompact ? 'aspect-[2/3] max-h-24' : 'aspect-[2/3] max-h-48 sm:max-h-none'} relative overflow-hidden rounded-lg bg-secondary/20`}>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <img
                      src={card.imageUrl}
                      alt={card.name || 'Card image'}
                      className="w-full h-full object-contain"
                      decoding="async"
                      onLoad={() => setImageLoading(false)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        setImageLoading(false);
                      }}
                      style={{ display: imageLoading ? 'none' : 'block' }}
                    />
                  </div>
                )}
                
                <div className={isCompact ? 'space-y-0.5' : 'space-y-2'}>
                  <div className="flex items-center gap-1">
                    <Sparkles className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} text-primary flex-shrink-0`} />
                    <h3 className={`font-bold tracking-tight ${isCompact ? 'text-[10px]' : 'text-sm'} truncate`}>{card.name || 'Unknown Card'}</h3>
                  </div>
                  <p className={`${isCompact ? 'text-[8px]' : 'text-xs'} text-muted-foreground truncate`}>{card.setName || 'Unknown Set'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {card.isRecentSale && displayAveragePrice ? (
                        <>
                          <motion.span 
                            key={`avg-${displayAveragePrice}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-muted-foreground line-through`}
                          >
                            Avg: {currencySymbol}{formatPrice(displayAveragePrice)}
                          </motion.span>
                          <motion.span 
                            key={`price-${displayPrice}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold text-primary`}
                          >
                            Recent: {currencySymbol}{formatPrice(displayPrice)}
                          </motion.span>
                        </>
                      ) : (
                        <motion.span 
                          key={`price-${displayPrice}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold`}
                        >
                          {currencySymbol}{formatPrice(displayPrice)}
                        </motion.span>
                      )}
                    </div>
                    <motion.span 
                      key={`change-${card.percentChange}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium ${card.percentChange === 0 ? "text-muted-foreground" : card.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {card.percentChange === 0 ? "—" : `${card.percentChange >= 0 ? "+" : ""}${formatPercentage(card.percentChange)}%`}
                    </motion.span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </DialogTrigger>
        
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {card.name || 'Unknown Card'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Image */}
              {card.imageUrl && (
                <div className="relative group">
                  <div 
                    className="w-full aspect-[2/3] relative overflow-hidden rounded-lg bg-secondary/20 cursor-pointer transition-all"
                    onClick={() => setIsImageEnlarged(true)}
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name || 'Card image'}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Card Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Set</h4>
                  <p className="text-lg">{card.setName || 'Unknown Set'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Rarity</h4>
                  <span className="text-sm bg-secondary px-3 py-1.5 rounded inline-block">{card.rarity || 'Unknown'}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Card Number</h4>
                  <p className="text-lg">#{card.cardNumber || 'N/A'}</p>
                </div>
                {card.tcgplayerUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Buy on TCGPlayer</h4>
                    <a 
                      href={card.tcgplayerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                    >
                      View on TCGPlayer →
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Currency Converter Section - Pro Feature */}
            {hasProAccess ? (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
                  className="w-full flex items-center justify-between p-2 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Currency Converter</span>
                  </div>
                  {showCurrencyConverter ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              
              <AnimatePresence>
                {showCurrencyConverter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-3">
                      {ratesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading exchange rates...</span>
                        </div>
                      ) : exchangeRates ? (
                        <>
                          {/* Currency Selection */}
                          <div className="flex flex-wrap gap-4 pb-3 border-b">
                            {preferredCurrency !== "USD" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedCurrencies.has('USD')}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCurrencies);
                                    if (checked) {
                                      newSet.add('USD');
                                    } else {
                                      newSet.delete('USD');
                                    }
                                    setSelectedCurrencies(newSet);
                                  }}
                                />
                                <span className="text-sm font-medium">US Dollar ($)</span>
                              </label>
                            )}
                            
                            {preferredCurrency !== "GBP" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedCurrencies.has('GBP')}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCurrencies);
                                    if (checked) {
                                      newSet.add('GBP');
                                    } else {
                                      newSet.delete('GBP');
                                    }
                                    setSelectedCurrencies(newSet);
                                  }}
                                />
                                <span className="text-sm font-medium">British Pound (£)</span>
                              </label>
                            )}
                            
                            {preferredCurrency !== "EUR" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedCurrencies.has('EUR')}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCurrencies);
                                    if (checked) {
                                      newSet.add('EUR');
                                    } else {
                                      newSet.delete('EUR');
                                    }
                                    setSelectedCurrencies(newSet);
                                  }}
                                />
                                <span className="text-sm font-medium">Euro (€)</span>
                              </label>
                            )}
                            
                            {preferredCurrency !== "CNY" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedCurrencies.has('CNY')}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCurrencies);
                                    if (checked) {
                                      newSet.add('CNY');
                                    } else {
                                      newSet.delete('CNY');
                                    }
                                    setSelectedCurrencies(newSet);
                                  }}
                                />
                                <span className="text-sm font-medium">Chinese Yuan (¥)</span>
                              </label>
                            )}
                            
                            {preferredCurrency !== "JPY" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedCurrencies.has('JPY')}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCurrencies);
                                    if (checked) {
                                      newSet.add('JPY');
                                    } else {
                                      newSet.delete('JPY');
                                    }
                                    setSelectedCurrencies(newSet);
                                  }}
                                />
                                <span className="text-sm font-medium">Japanese Yen (¥)</span>
                              </label>
                            )}
                          </div>
                          
                          {/* Currency Display */}
                          {selectedCurrencies.size > 0 ? (
                            <div className={`grid gap-3 ${
                              selectedCurrencies.size === 1 ? 'grid-cols-1' : 
                              selectedCurrencies.size === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                              'grid-cols-1 sm:grid-cols-3'
                            }`}>
                              {preferredCurrency !== "USD" && selectedCurrencies.has('USD') && exchangeRates && (
                                <div className="bg-secondary/30 rounded-lg p-3">
                                  <div className="text-xs text-muted-foreground mb-1">US Dollar</div>
                                  <div className="text-lg font-bold">${formatCurrency(card.currentPrice)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">USD</div>
                                </div>
                              )}
                              
                              {preferredCurrency !== "GBP" && selectedCurrencies.has('GBP') && exchangeRates && (
                                <div className="bg-secondary/30 rounded-lg p-3">
                                  <div className="text-xs text-muted-foreground mb-1">British Pound</div>
                                  <div className="text-lg font-bold">£{formatCurrency(getConvertedPrice('GBP'))}</div>
                                  <div className="text-xs text-muted-foreground mt-1">GBP</div>
                                </div>
                              )}
                              
                              {preferredCurrency !== "EUR" && selectedCurrencies.has('EUR') && exchangeRates && (
                                <div className="bg-secondary/30 rounded-lg p-3">
                                  <div className="text-xs text-muted-foreground mb-1">Euro</div>
                                  <div className="text-lg font-bold">€{formatCurrency(getConvertedPrice('EUR'))}</div>
                                  <div className="text-xs text-muted-foreground mt-1">EUR</div>
                                </div>
                              )}
                              
                              {preferredCurrency !== "CNY" && selectedCurrencies.has('CNY') && exchangeRates && (
                                <div className="bg-secondary/30 rounded-lg p-3">
                                  <div className="text-xs text-muted-foreground mb-1">Chinese Yuan</div>
                                  <div className="text-lg font-bold">¥{formatCurrency(getConvertedPrice('CNY'))}</div>
                                  <div className="text-xs text-muted-foreground mt-1">CNY</div>
                                </div>
                              )}
                              
                              {preferredCurrency !== "JPY" && selectedCurrencies.has('JPY') && exchangeRates && (
                                <div className="bg-secondary/30 rounded-lg p-3">
                                  <div className="text-xs text-muted-foreground mb-1">Japanese Yen</div>
                                  <div className="text-lg font-bold">¥{formatCurrency(getConvertedPrice('JPY'), 0)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">JPY</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              Select at least one currency to display conversions
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              {ratesError ? (
                                <span className="text-amber-600">Using fallback rates</span>
                              ) : (
                                `Updated ${getLastUpdatedTime()}`
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={fetchExchangeRates}
                              disabled={ratesLoading}
                              className="h-7 px-2"
                            >
                              <RefreshCw className={`h-3 w-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                              <span className="ml-1 text-xs">Refresh</span>
                            </Button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-secondary/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Currency Converter</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Convert prices to multiple currencies with real-time exchange rates.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => {
                      window.location.href = "/premium";
                    }, 100);
                  }}
                  className="w-full"
                >
                  Upgrade to Pro
                </Button>
              </div>
            )}
            
            {/* Price Chart */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold tracking-tight">Price History</h4>
                <span className="text-sm text-muted-foreground">(in USD)</span>
              </div>
              {!priceHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <PriceChart
                    data={priceHistory || []}
                    currentPrice={card.currentPrice}
                    percentChange={card.percentChange}
                  />
                  {card.overallPercentChange !== undefined && priceHistory && priceHistory.length > 1 && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                      <h5 className="text-sm font-medium text-muted-foreground mb-1">Overall Trend</h5>
                      <div className={`text-lg font-bold ${card.overallPercentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {card.overallPercentChange >= 0 ? '+' : ''}{formatPercentage(card.overallPercentChange)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Since first recorded price
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enlarged Image Dialog */}
      <Dialog open={isImageEnlarged} onOpenChange={setIsImageEnlarged}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-2">
          <div className="relative w-full h-full flex items-center justify-center">
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.name || 'Card image'}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});