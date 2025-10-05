import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { PriceChart } from "./PriceChart";

interface ProductItemProps {
  product: {
    _id: Id<"products">;
    name: string;
    productType: string;
    setName: string;
    currentPrice: number;
    percentChange: number;
    imageUrl?: string;
  };
  priceHistory: Array<{ timestamp: number; price: number }>;
}

export function ProductItem({ product, priceHistory }: ProductItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 hover:border-primary/50 transition-colors">
        <div className="space-y-4">
          {/* Product Image */}
          {product.imageUrl && (
            <div className="w-full aspect-[3/2] relative overflow-hidden rounded-lg border bg-secondary/20">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="font-bold tracking-tight text-lg truncate">{product.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{product.setName}</p>
              <span className="text-xs bg-secondary px-2 py-1 rounded inline-block mt-1">
                {product.productType}
              </span>
            </div>
          </div>
          <PriceChart
            data={priceHistory}
            currentPrice={product.currentPrice}
            percentChange={product.percentChange}
          />
        </div>
      </Card>
    </motion.div>
  );
}