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

  // Validate and sanitize input data
  const validData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(point => 
      point && 
      typeof point.timestamp === 'number' && 
      typeof point.price === 'number' &&
      !isNaN(point.price) &&
      isFinite(point.price) &&
      point.price >= 0
    );
  }, [data]);

  // Filter data for daily view to show only the most recent 7 days
  const dailyData = useMemo(() => {
    if (!validData || validData.length === 0) return [];
    
    try {
      // Sort by timestamp to ensure we get the most recent data
      const sortedData = [...validData].sort((a, b) => b.timestamp - a.timestamp);
      
      // Get the most recent timestamp
      const mostRecentTimestamp = sortedData[0].timestamp;
      const sevenDaysAgo = mostRecentTimestamp - (7 * 24 * 60 * 60 * 1000);
      
      // Filter to only include data from the last 7 days
      const recentData = sortedData.filter(point => point.timestamp >= sevenDaysAgo);
      
      // Sort back to ascending order for chart display
      return recentData.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Error filtering daily data:", error);
      return validData;
    }
  }, [validData]);

  // Aggregate data into weekly summaries with error handling
  const weeklyData = useMemo(() => {
    if (!validData || validData.length === 0) return [];

    try {
      const weeks = new Map<string, { prices: number[]; timestamp: number }>();
      
      validData.forEach((point) => {
        const date = new Date(point.timestamp);
        if (isNaN(date.getTime())) return; // Skip invalid dates
        
        // Get the start of the week (Monday)
        const weekStart = new Date(date);
        const dayOfWeek = date.getDay();
        // Calculate days to subtract to get to Monday (0=Sunday, 1=Monday, etc.)
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(date.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString();

        if (!weeks.has(weekKey)) {
          weeks.set(weekKey, { prices: [], timestamp: weekStart.getTime() });
        }
        weeks.get(weekKey)!.prices.push(point.price);
      });

      // Calculate average price for each week
      return Array.from(weeks.entries())
        .map(([_, weekData]) => {
          if (weekData.prices.length === 0) return null;
          const avgPrice = weekData.prices.reduce((sum, p) => sum + p, 0) / weekData.prices.length;
          return {
            timestamp: weekData.timestamp,
            price: avgPrice,
            minPrice: Math.min(...weekData.prices),
            maxPrice: Math.max(...weekData.prices),
          };
        })
        .filter((week): week is NonNullable<typeof week> => week !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Error aggregating weekly data:", error);
      return [];
    }
  }, [validData]);

  const displayData = viewMode === "weekly" ? weeklyData : dailyData;

  if (!validData || validData.length === 0) {
    return <div className="text-sm text-muted-foreground">No price history (Within recent 90 days)</div>;
  }

  if (viewMode === "daily" && dailyData.length === 0) {
    return <div className="text-sm text-muted-foreground">No price history in the last 7 days</div>;
  }

  // Safe min/max calculations with fallbacks
  const prices = displayData.map((d) => d.price);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
  // Ensure minimum price range to prevent division by zero and ensure visible bars
  const priceRange = Math.max(0.01, maxPrice - minPrice);

  const width = 400;
  const height = 120;
  const padding = 4;
  const leftPadding = 50;
  const bottomPadding = 30;
  const chartWidth = width - leftPadding;
  const chartHeight = height - bottomPadding;

  const isPositive = percentChange >= 0;

  // Format date based on view mode with error handling
  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      if (viewMode === "weekly") {
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6); // Monday to Sunday (6 days later)
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        if (validData.length < 2) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const timeRangeMs = validData[validData.length - 1].timestamp - validData[0].timestamp;
        const daysRange = timeRangeMs / (1000 * 60 * 60 * 24);
        
        if (daysRange > 365) {
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (daysRange > 60) {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  // Format date and time for hover tooltip with error handling
  const formatDateTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return 'Invalid Date';
    }
  };

  // Determine number of X-axis labels with bounds checking
  const getXAxisLabels = () => {
    const labels: { value: string; x: number }[] = [];
    
    if (displayData.length === 0) return labels;
    
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
      if (index >= 0 && index < displayData.length) {
        const xPos = leftPadding + padding + ((index / Math.max(1, displayData.length - 1)) * (chartWidth - padding * 2));
        labels.push({
          value: formatDate(displayData[index].timestamp),
          x: xPos
        });
      }
    }
    
    if (displayData.length > 0) {
      labels.push({
        value: formatDate(displayData[displayData.length - 1].timestamp),
        x: width - padding
      });
    }
    
    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  // Y-axis labels with safe formatting
  const yAxisLabels = [
    { value: maxPrice, y: padding },
    { value: (maxPrice + minPrice) / 2, y: chartHeight / 2 },
    { value: minPrice, y: chartHeight - padding }
  ];

  // Generate line chart points for daily view with bounds checking
  const linePoints = viewMode === "daily" && displayData.length > 0 ? displayData.map((point, index) => {
    const x = (index / Math.max(1, displayData.length - 1)) * (chartWidth - padding * 2) + padding + leftPadding;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding;
    return `${x},${y}`;
  }).join(" ") : "";

  // Handle mouse move over SVG with error handling
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    try {
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
      const index = Math.round(relativeX * Math.max(0, displayData.length - 1));

      if (index >= 0 && index < displayData.length) {
        setHoveredPoint(displayData[index]);
        setMousePosition({ x: mouseX, y: mouseY });
      }
    } catch (error) {
      console.error("Error handling mouse move:", error);
      setHoveredPoint(null);
      setMousePosition(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  // Handle touch events for mobile with error handling
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    try {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      
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
      const index = Math.round(relativeX * Math.max(0, displayData.length - 1));

      if (index >= 0 && index < displayData.length) {
        setHoveredPoint(displayData[index]);
        setMousePosition({ x: mouseX, y: mouseY });
      }
    } catch (error) {
      console.error("Error handling touch move:", error);
      setHoveredPoint(null);
      setMousePosition(null);
    }
  };

  const handleTouchEnd = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  // Safe price formatting
  const formatPrice = (price: number): string => {
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return '0.00';
    }
    return price.toFixed(2);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight">${formatPrice(currentPrice)}</span>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {formatPrice(Math.abs(percentChange))}%
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
              ${formatPrice(label.value)}
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
          {viewMode === "daily" && linePoints ? (
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
                if (index === -1 || displayData.length === 0) return null;
                
                const x = leftPadding + padding + ((index / Math.max(1, displayData.length - 1)) * (chartWidth - padding * 2));
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
          {/* Weekly Bar Chart */}
          {viewMode === "weekly" && weeklyData.length > 0 && (
            <>
              {weeklyData.map((week, index) => {
                const totalBars = weeklyData.length;
                // Calculate bar width: leave some gap between bars
                const chartAvailableWidth = chartWidth - leftPadding - padding;
                const barWidth = Math.min(40, Math.max(12, chartAvailableWidth / totalBars * 0.6));
                const gapWidth = (chartAvailableWidth - barWidth * totalBars) / (totalBars - 1 || 1);
                
                // X position for each bar
                const x = leftPadding + index * (barWidth + gapWidth);
                
                // Height calculation
                const availableHeight = chartHeight - padding; // top limit
                const normalizedPrice = (week.price - minPrice) / Math.max(0.01, priceRange);
                const barHeight = Math.max(3, normalizedPrice * availableHeight);
                const y = chartHeight - barHeight; // top of rect, starts at X-axis
                
                const isHovered = hoveredPoint?.timestamp === week.timestamp;
                
                return (
                  <motion.rect
                    key={`bar-${week.timestamp}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? (isPositive ? "#15803d" : "#b91c1c") : (isPositive ? "#16a34a" : "#dc2626")}
                    opacity={isHovered ? 1 : 0.8}
                    rx={2}
                    initial={{ height: 0, y: chartHeight }}
                    animate={{ height: barHeight, y }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                );
              })}
              
              {/* X-axis labels under each bar */}
              {weeklyData.map((week, index) => {
                const totalBars = weeklyData.length;
                const chartAvailableWidth = chartWidth - leftPadding - padding;
                const barWidth = Math.min(40, Math.max(12, chartAvailableWidth / totalBars * 0.6));
                const gapWidth = (chartAvailableWidth - barWidth * totalBars) / (totalBars - 1 || 1);
                const x = leftPadding + index * (barWidth + gapWidth) + barWidth / 2;
                
                return (
                  <text
                    key={`label-${week.timestamp}`}
                    x={x}
                    y={chartHeight + 18}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground"
                  >
                    {formatDate(week.timestamp)}
                  </text>
                );
              })}
            </>
          )}
            </>
          )}
          
          {/* X-axis labels - only for daily view */}
          {viewMode === "daily" && xAxisLabels.map((label, i) => (
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
          if (index === -1 || displayData.length === 0) return null;
          
          const pointX = (index / Math.max(1, displayData.length - 1)) * (chartWidth - padding * 2) + padding + leftPadding;
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
              <div className="text-xs font-medium">${formatPrice(hoveredPoint.price)}</div>
              <div className="text-[10px] text-muted-foreground">
                {viewMode === "weekly" ? `Week of ${formatDateTime(hoveredPoint.timestamp)}` : formatDateTime(hoveredPoint.timestamp)}
              </div>
              {viewMode === "weekly" && (hoveredPoint as any).minPrice && (
                <div className="text-[10px] text-muted-foreground">
                  Range: ${formatPrice((hoveredPoint as any).minPrice)} - ${formatPrice((hoveredPoint as any).maxPrice)}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}