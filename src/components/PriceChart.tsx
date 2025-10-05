import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";

interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  currentPrice: number;
  percentChange: number;
}

export function PriceChart({ data, currentPrice, percentChange }: PriceChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No price history</div>;
  }

  const maxPrice = Math.max(...data.map((d) => d.price));
  const minPrice = Math.min(...data.map((d) => d.price));
  const priceRange = maxPrice - minPrice || 1;

  const width = 400;
  const height = 120;
  const padding = 4;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((point.price - minPrice) / priceRange) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(" ");

  const isPositive = percentChange >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight">${currentPrice.toFixed(2)}</span>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(percentChange).toFixed(2)}%
        </div>
      </div>
      <svg width={width} height={height} className="w-full">
        <motion.polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#16a34a" : "#dc2626"}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
