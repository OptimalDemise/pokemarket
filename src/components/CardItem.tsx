import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PriceChart } from "./PriceChart";

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
  priceHistory: Array<{ timestamp: number; price: number }>;
}

export function CardItem({ card, priceHistory }: CardItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 hover:border-primary/50 transition-colors">
        <div className="space-y-4">
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
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="font-bold tracking-tight text-lg truncate">{card.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{card.setName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-secondary px-2 py-1 rounded">{card.rarity}</span>
                <span className="text-xs text-muted-foreground">#{card.cardNumber}</span>
              </div>
            </div>
          </div>
          <PriceChart
            data={priceHistory}
            currentPrice={card.currentPrice}
            percentChange={card.percentChange}
          />
        </div>
      </Card>
    </motion.div>
  );
}