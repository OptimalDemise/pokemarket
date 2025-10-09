import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  currentPrice: number;
  percentChange: number;
}

type ViewMode = "daily" | "weekly";

export function PriceChart({ data, currentPrice, percentChange }: PriceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<PriceDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  // Aggregate data into weekly summaries
  const weeklyData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const weeks = new Map<string, { prices: number[]; timestamp: number }>();
    
    data.forEach((point) => {
      const date = new Date(point.timestamp);
      // Get the start of the week (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString();

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, { prices: [], timestamp: weekStart.getTime() });
      }
      weeks.get(weekKey)!.prices.push(point.price);
    });

    // Calculate average price for each week
    return Array.from(weeks.entries())
      .map(([_, weekData]) => ({
        timestamp: weekData.timestamp,
        price: weekData.prices.reduce((sum, p) => sum + p, 0) / weekData.prices.length,
        minPrice: Math.min(...weekData.prices),
        maxPrice: Math.max(...weekData.prices),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const displayData = viewMode === "weekly" ? weeklyData : data;

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No price history (Within recent 90 days)</div>;
  }

  const maxPrice = Math.max(...displayData.map((d) => d.price));
  const minPrice = Math.min(...displayData.map((d) => d.price));
  const priceRange = maxPrice - minPrice || 1;

  const width = 400;
  const height = 120;
  const padding = 4;
  const leftPadding = 50;
  const bottomPadding = 30;
  const chartWidth = width - leftPadding;
  const chartHeight = height - bottomPadding;

  const isPositive = percentChange >= 0;

  // Format date based on view mode
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    
    if (viewMode === "weekly") {
      // For weekly view, show week start date
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      // For daily view, use existing logic
      const timeRangeMs = data[data.length - 1].timestamp - data[0].timestamp;
      const daysRange = timeRangeMs / (1000 * 60 * 60 * 24);
      
      if (daysRange > 365) {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (daysRange > 60) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
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

  // Determine number of X-axis labels
  const getXAxisLabels = () => {
    const labels: { value: string; x: number }[] = [];
    
    labels.push({
      value: formatDate(displayData[0].timestamp),
      x: leftPadding + padding
    });
    
    let numIntermediateLabels = 0;
    if (displayData.length > 100) numIntermediateLabels = 4;
    else if (displayData.length > 50) numIntermediateLabels = 3;
    else if (displayData.length > 20) numIntermediateLabels = 2;
    else if (displayData.length > 5) numIntermediateLabels = 1;
    
    for (let i = 1; i <= numIntermediateLabels; i++) {
      const index = Math.floor((displayData.length - 1) * (i / (numIntermediateLabels + 1)));
      const xPos = leftPadding + padding + ((index / (displayData.length - 1)) * (chartWidth - padding * 2));
      labels.push({
        value: formatDate(displayData[index].timestamp),
        x: xPos
      });
    }
    
    labels.push({
      value: formatDate(displayData[displayData.length - 1].timestamp),
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

  // Generate line chart points for daily view
  const linePoints = viewMode === "daily" ? displayData.map((point, index) => {
    const x = (index / (displayData.length - 1)) * (chartWidth - padding * 2) + padding + leftPadding;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding;
    return `${x},${y}`;
  }).join(" ") : "";

  // Handle mouse move over SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const viewBoxX = mouseX * scaleX;
    const viewBoxY = mouseY * scaleY;

    const chartX = viewBoxX - leftPadding - padding;
    
    if (viewBoxY < 0 || viewBoxY > height) {
      setHoveredPoint(null);
      setMousePosition(null);
      return;
    }
    
    const chartAreaWidth = chartWidth - padding * 2;
    if (chartX < 0 || chartX > chartAreaWidth) {
      setHoveredPoint(null);
      setMousePosition(null);
      return;
    }
    
    const relativeX = chartX / chartAreaWidth;
    const index = Math.round(relativeX * (displayData.length - 1));

    if (index >= 0 && index < displayData.length) {
      setHoveredPoint(displayData[index]);
      setMousePosition({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  // Handle touch events for mobile
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const viewBoxX = mouseX * scaleX;
    const viewBoxY = mouseY * scaleY;

    const chartX = viewBoxX - leftPadding - padding;
    
    if (viewBoxY < 0 || viewBoxY > height) {
      setHoveredPoint(null);
      setMousePosition(null);
      return;
    }
    
    const chartAreaWidth = chartWidth - padding * 2;
    if (chartX < 0 || chartX > chartAreaWidth) {
      setHoveredPoint(null);
      setMousePosition(null);
      return;
    }
    
    const relativeX = chartX / chartAreaWidth;
    const index = Math.round(relativeX * (displayData.length - 1));

    if (index >= 0 && index < displayData.length) {
      setHoveredPoint(displayData[index]);
      setMousePosition({ x: mouseX, y: mouseY });
    }
  };

  const handleTouchEnd = () => {
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
      
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-2">
        <Button
          variant={viewMode === "daily" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("daily")}
        >
          Daily
        </Button>
        <Button
          variant={viewMode === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("weekly")}
        >
          Weekly
        </Button>
      </div>

      <div className="relative">
        <svg 
          width={width} 
          height={height + bottomPadding} 
          className="w-full touch-none" 
          viewBox={`0 0 ${width} ${height + bottomPadding}`} 
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
          
          {/* Render based on view mode */}
          {viewMode === "daily" ? (
            <>
              {/* Price line for daily view */}
              <motion.polyline
                points={linePoints}
                fill="none"
                stroke={isPositive ? "#16a34a" : "#dc2626"}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              
              {/* Hover indicator circle */}
              {hoveredPoint && mousePosition && (() => {
                const index = displayData.indexOf(hoveredPoint);
                const x = leftPadding + padding + ((index / (displayData.length - 1)) * (chartWidth - padding * 2));
                const y = chartHeight - ((hoveredPoint.price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding;
                return (
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={isPositive ? "#16a34a" : "#dc2626"}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })()}
            </>
          ) : (
            <>
              {/* Bar chart for weekly view */}
              {weeklyData.map((week, index) => {
                const barWidth = Math.max(8, (chartWidth - padding * 2) / weeklyData.length * 0.7);
                const spacing = (chartWidth - padding * 2) / weeklyData.length;
                const x = leftPadding + padding + (index * spacing) + (spacing - barWidth) / 2;
                const barHeight = Math.max(2, ((week.price - minPrice) / priceRange) * (chartHeight - padding * 2));
                const y = chartHeight - barHeight - padding;
                
                const isHovered = hoveredPoint === week;
                
                return (
                  <motion.rect
                    key={index}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? (isPositive ? "#15803d" : "#b91c1c") : (isPositive ? "#16a34a" : "#dc2626")}
                    opacity={isHovered ? 1 : 0.8}
                    rx={1}
                    initial={{ height: 0, y: chartHeight - padding }}
                    animate={{ height: barHeight, y: y }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                );
              })}
            </>
          )}
          
          {/* X-axis labels */}
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
        {hoveredPoint && mousePosition && (() => {
          const index = displayData.indexOf(hoveredPoint);
          const pointX = (index / (displayData.length - 1)) * (chartWidth - padding * 2) + padding + leftPadding;
          const pointY = viewMode === "daily" 
            ? chartHeight - ((hoveredPoint.price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding
            : chartHeight - (((hoveredPoint as any).price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding;
          
          const svg = document.querySelector('svg');
          if (!svg) return null;
          const rect = svg.getBoundingClientRect();
          const scaleX = rect.width / width;
          const scaleY = rect.height / height;
          const screenX = pointX * scaleX;
          const screenY = pointY * scaleY;
          
          return (
            <div 
              className="absolute z-10 bg-popover border rounded-lg shadow-lg px-3 py-2 pointer-events-none"
              style={{
                left: `${screenX + 10}px`,
                top: `${screenY - 10}px`,
                transform: 'translateY(-100%)'
              }}
            >
              <div className="text-xs font-medium">${hoveredPoint.price.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">
                {viewMode === "weekly" ? `Week of ${formatDateTime(hoveredPoint.timestamp)}` : formatDateTime(hoveredPoint.timestamp)}
              </div>
              {viewMode === "weekly" && (hoveredPoint as any).minPrice && (
                <div className="text-[10px] text-muted-foreground">
                  Range: ${(hoveredPoint as any).minPrice.toFixed(2)} - ${(hoveredPoint as any).maxPrice.toFixed(2)}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}