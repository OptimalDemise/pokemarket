import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Maximize2 } from "lucide-react";
import { PriceChart } from "./PriceChart";
import { useState } from "react";

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

export function CardItem({ card, size = "default" }: CardItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Only fetch price history when dialog is opened
  const priceHistory = useQuery(
    api.cards.getCardPriceHistory,
    isOpen ? { cardId: card._id } : "skip"
  );

  const isCompact = size === "compact";
  
  // Check if card was updated in the last 5 minutes
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const isRecentlyUpdated = card.lastUpdated > fiveMinutesAgo;
  
  // Check if card was updated in the last minute (for "JUST UPDATED" badge)
  const oneMinuteAgo = now - 60 * 1000;
  const isJustUpdated = card.lastUpdated > oneMinuteAgo;

  return (
    <>
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
              {isJustUpdated && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    JUST UPDATED
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
                      alt={card.name}
                      className="w-full h-full object-contain"
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
                    <h3 className={`font-bold tracking-tight ${isCompact ? 'text-[10px]' : 'text-sm'} truncate`}>{card.name}</h3>
                  </div>
                  <p className={`${isCompact ? 'text-[8px]' : 'text-xs'} text-muted-foreground truncate`}>{card.setName}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {card.isRecentSale && card.averagePrice ? (
                        <>
                          <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-muted-foreground line-through`}>
                            Avg: ${card.averagePrice.toFixed(2)}
                          </span>
                          <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold text-primary`}>
                            Recent: ${card.currentPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold`}>${card.currentPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium ${card.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {card.percentChange >= 0 ? "+" : ""}{card.percentChange.toFixed(2)}%
                    </span>
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
              {card.name}
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
                      alt={card.name}
                      className="w-full h-full object-contain"
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
                  <p className="text-lg">{card.setName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Rarity</h4>
                  <span className="text-sm bg-secondary px-3 py-1.5 rounded inline-block">{card.rarity}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Card Number</h4>
                  <p className="text-lg">#{card.cardNumber}</p>
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
                    data={priceHistory}
                    currentPrice={card.currentPrice}
                    percentChange={card.percentChange}
                  />
                  {card.overallPercentChange !== undefined && priceHistory.length > 1 && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                      <h5 className="text-sm font-medium text-muted-foreground mb-1">Overall Trend</h5>
                      <div className={`text-lg font-bold ${card.overallPercentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {card.overallPercentChange >= 0 ? '+' : ''}{card.overallPercentChange.toFixed(2)}%
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
                alt={card.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
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
}