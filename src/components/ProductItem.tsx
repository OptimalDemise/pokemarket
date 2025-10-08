import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Package, Loader2, Maximize2 } from "lucide-react";
import { PriceChart } from "./PriceChart";
import { useState } from "react";

interface ProductItemProps {
  product: {
    _id: Id<"products">;
    name: string;
    productType: string;
    setName: string;
    currentPrice: number;
    percentChange: number;
    imageUrl?: string;
    averagePrice?: number;
    isRecentSale?: boolean;
    lastUpdated: number;
  };
}

export function ProductItem({ product }: ProductItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  
  // Only fetch price history when dialog is opened
  const priceHistory = useQuery(
    api.products.getProductPriceHistory,
    isOpen ? { productId: product._id } : "skip"
  );
  
  // Check if product was updated in the last 5 minutes
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const isRecentlyUpdated = product.lastUpdated > fiveMinutesAgo;
  
  // Check if product was updated in the last minute (for "JUST UPDATED" badge)
  const oneMinuteAgo = now - 60 * 1000;
  const isJustUpdated = product.lastUpdated > oneMinuteAgo;
  
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
            <Card className={`p-4 hover:border-primary transition-all hover:shadow-lg`}>
              {isJustUpdated && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    JUST UPDATED
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {/* Product Image */}
                {product.imageUrl && (
                  <div className="w-full aspect-[3/2] relative overflow-hidden rounded-lg border bg-secondary/20">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <h3 className="font-bold tracking-tight text-sm truncate">{product.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{product.setName}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.isRecentSale && product.averagePrice ? (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            Avg: ${product.averagePrice.toFixed(2)}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            Recent: ${product.currentPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">${product.currentPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${product.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {product.percentChange >= 0 ? "+" : ""}{product.percentChange.toFixed(2)}%
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
              <Package className="h-5 w-5 text-primary" />
              {product.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Product Image */}
              {product.imageUrl && (
                <div className="relative group">
                  <div 
                    className="w-full aspect-[3/2] relative overflow-hidden rounded-lg border bg-secondary/20 cursor-pointer transition-all hover:border-primary"
                    onClick={() => setIsImageEnlarged(true)}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
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
              
              {/* Product Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Set</h4>
                  <p className="text-lg">{product.setName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Product Type</h4>
                  <span className="text-sm bg-secondary px-3 py-1.5 rounded inline-block">{product.productType}</span>
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
                  currentPrice={product.currentPrice}
                  percentChange={product.percentChange}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enlarged Image Dialog */}
      <Dialog open={isImageEnlarged} onOpenChange={setIsImageEnlarged}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-2">
          <div className="relative w-full h-full flex items-center justify-center">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
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