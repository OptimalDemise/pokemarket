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
  const leftPadding = 50;
  const bottomPadding = 30;
  const chartWidth = width - leftPadding;
  const chartHeight = height - bottomPadding;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (chartWidth - padding * 2) + padding + leftPadding;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding;
    return `${x},${y}`;
  }).join(" ");

  const isPositive = percentChange >= 0;

  // Format date for axis labels
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Get first, middle, and last dates for x-axis
  const firstDate = formatDate(data[0].timestamp);
  const lastDate = formatDate(data[data.length - 1].timestamp);
  const middleDate = data.length > 2 ? formatDate(data[Math.floor(data.length / 2)].timestamp) : null;

  // Y-axis labels
  const yAxisLabels = [
    { value: maxPrice, y: padding },
    { value: (maxPrice + minPrice) / 2, y: chartHeight / 2 },
    { value: minPrice, y: chartHeight - padding }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight">${currentPrice.toFixed(2)}</span>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(percentChange).toFixed(2)}%
        </div>
      </div>
      <svg width={width} height={height + bottomPadding} className="w-full">
        {/* Y-axis labels */}
        {yAxisLabels.map((label, i) => (
          <text
            key={i}
            x={leftPadding - 8}
            y={label.y}
            textAnchor="end"
            className="text-[10px] fill-muted-foreground"
            dominantBaseline="middle"
          >
            ${label.value.toFixed(0)}
          </text>
        ))}
        
        {/* Y-axis line */}
        <line
          x1={leftPadding}
          y1={padding}
          x2={leftPadding}
          y2={chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          className="stroke-border"
        />
        
        {/* X-axis line */}
        <line
          x1={leftPadding}
          y1={chartHeight}
          x2={width}
          y2={chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          className="stroke-border"
        />
        
        {/* Price line */}
        <motion.polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#16a34a" : "#dc2626"}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* X-axis labels */}
        <text
          x={leftPadding + padding}
          y={chartHeight + 20}
          textAnchor="start"
          className="text-[10px] fill-muted-foreground"
        >
          {firstDate}
        </text>
        {middleDate && (
          <text
            x={leftPadding + chartWidth / 2}
            y={chartHeight + 20}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {middleDate}
          </text>
        )}
        <text
          x={width - padding}
          y={chartHeight + 20}
          textAnchor="end"
          className="text-[10px] fill-muted-foreground"
        >
          {lastDate}
        </text>
      </svg>
    </div>
  );
}