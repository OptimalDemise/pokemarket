import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

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
  const [hoveredPoint, setHoveredPoint] = useState<PriceDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

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

  // Calculate time range to determine appropriate date format
  const timeRangeMs = data[data.length - 1].timestamp - data[0].timestamp;
  const daysRange = timeRangeMs / (1000 * 60 * 60 * 24);

  // Format date based on time range
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    
    if (daysRange > 365) {
      // For over a year: show "MMM YYYY" (e.g., "Jan 2024")
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (daysRange > 60) {
      // For 2+ months: show "MMM DD" (e.g., "Jan 15")
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For under 2 months: show "M/D" (e.g., "1/15")
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // Format date and time for hover tooltip
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine number of X-axis labels based on data density
  const getXAxisLabels = () => {
    const labels: { value: string; x: number }[] = [];
    
    // Always show first and last
    labels.push({
      value: formatDate(data[0].timestamp),
      x: leftPadding + padding
    });
    
    // Add intermediate labels based on data length
    let numIntermediateLabels = 1;
    if (data.length > 50) numIntermediateLabels = 3;
    else if (data.length > 20) numIntermediateLabels = 2;
    
    for (let i = 1; i <= numIntermediateLabels; i++) {
      const index = Math.floor((data.length - 1) * (i / (numIntermediateLabels + 1)));
      const xPos = leftPadding + padding + ((index / (data.length - 1)) * (chartWidth - padding * 2));
      labels.push({
        value: formatDate(data[index].timestamp),
        x: xPos
      });
    }
    
    labels.push({
      value: formatDate(data[data.length - 1].timestamp),
      x: width - padding
    });
    
    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  // Y-axis labels
  const yAxisLabels = [
    { value: maxPrice, y: padding },
    { value: (maxPrice + minPrice) / 2, y: chartHeight / 2 },
    { value: minPrice, y: chartHeight - padding }
  ];

  // Handle mouse move over SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    // Get mouse position relative to the SVG element
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Scale mouse position to viewBox coordinates
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const viewBoxX = mouseX * scaleX;
    const viewBoxY = mouseY * scaleY;

    // Calculate position within the chart area (accounting for left padding)
    const chartX = viewBoxX - leftPadding - padding;
    
    // Ensure we're within the chart bounds
    if (chartX < 0 || chartX > (chartWidth - padding * 2) || viewBoxY < 0 || viewBoxY > chartHeight) {
      setHoveredPoint(null);
      setMousePosition(null);
      return;
    }
    
    // Calculate which data point we're closest to
    const relativeX = chartX / (chartWidth - padding * 2);
    const index = Math.max(0, Math.min(data.length - 1, Math.round(relativeX * (data.length - 1))));

    if (index >= 0 && index < data.length) {
      setHoveredPoint(data[index]);
      // Store the actual mouse position for tooltip placement
      setMousePosition({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight">${currentPrice.toFixed(2)}</span>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(percentChange).toFixed(2)}%
        </div>
      </div>
      <div className="relative">
        <svg 
          width={width} 
          height={height + bottomPadding} 
          className="w-full" 
          viewBox={`0 0 ${width} ${height + bottomPadding}`} 
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
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
          
          {/* Hover indicator circle */}
          {hoveredPoint && mousePosition && (
            <circle
              cx={leftPadding + padding + ((data.indexOf(hoveredPoint) / (data.length - 1)) * (chartWidth - padding * 2))}
              cy={chartHeight - ((hoveredPoint.price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding}
              r="4"
              fill={isPositive ? "#16a34a" : "#dc2626"}
              stroke="white"
              strokeWidth="2"
            />
          )}
          
          {/* X-axis labels - dynamically positioned */}
          {xAxisLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={chartHeight + 20}
              textAnchor={i === 0 ? "start" : i === xAxisLabels.length - 1 ? "end" : "middle"}
              className="text-[10px] fill-muted-foreground"
            >
              {label.value}
            </text>
          ))}
        </svg>
        
        {/* Hover tooltip */}
        {hoveredPoint && mousePosition && (
          <div 
            className="absolute z-10 bg-popover border rounded-lg shadow-lg px-3 py-2 pointer-events-none"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="text-xs font-medium">${hoveredPoint.price.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">{formatDateTime(hoveredPoint.timestamp)}</div>
          </div>
        )}
      </div>
    </div>
  );
}