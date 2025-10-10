import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Maximize2, Heart } from "lucide-react";
import { PriceChart } from "./PriceChart";
import { useState, memo } from "react";

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

export const CardItem = memo(function CardItem({ card, size = "default" }: CardItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showUnfavoriteDialog, setShowUnfavoriteDialog] = useState(false);
  
  // Only fetch price history when dialog is opened
  const priceHistory = useQuery(
    api.cards.getCardPriceHistory,
    isOpen ? { cardId: card._id } : "skip"
  );

  // Favorites functionality with null safety
  const isFavorited = useQuery(api.favorites.isFavorited, { cardId: card._id }) ?? false;
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

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
    return Math.abs(percent).toFixed(2);
  };

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
                      {card.isRecentSale && card.averagePrice ? (
                        <>
                          <motion.span 
                            key={`avg-${card.averagePrice}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-muted-foreground line-through`}
                          >
                            Avg: ${formatPrice(card.averagePrice)}
                          </motion.span>
                          <motion.span 
                            key={`price-${card.currentPrice}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold text-primary`}
                          >
                            Recent: ${formatPrice(card.currentPrice)}
                          </motion.span>
                        </>
                      ) : (
                        <motion.span 
                          key={`price-${card.currentPrice}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold`}
                        >
                          ${formatPrice(card.currentPrice)}
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
            
            {/* Price Chart */}
            <div className="space-y-3">
              <h4 className="text-lg font-bold tracking-tight">Price History</h4>
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