import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
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
    imageUrl?: string;
  };
}

export function CardItem({ card }: CardItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only fetch price history when dialog is opened
  const priceHistory = useQuery(
    api.cards.getCardPriceHistory,
    isOpen ? { cardId: card._id, limit: 100 } : "skip"
  );
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="cursor-pointer"
        >
          <Card className="p-4 hover:border-primary transition-all hover:shadow-lg">
            <div className="space-y-3">
              {/* Card Image */}
              {card.imageUrl && (
                <div className="w-full aspect-[2/3] relative overflow-hidden rounded-lg border bg-secondary/20">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <h3 className="font-bold tracking-tight text-sm truncate">{card.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground truncate">{card.setName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${card.currentPrice.toFixed(2)}</span>
                  <span className={`text-xs font-medium ${card.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {card.percentChange >= 0 ? "+" : ""}{card.percentChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {card.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card Image */}
            {card.imageUrl && (
              <div className="w-full aspect-[2/3] relative overflow-hidden rounded-lg border bg-secondary/20">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
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
              <PriceChart
                data={priceHistory}
                currentPrice={card.currentPrice}
                percentChange={card.percentChange}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}