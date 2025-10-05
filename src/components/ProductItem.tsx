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
