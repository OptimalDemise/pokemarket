<svg 
  width={width}  // width = 400
  height={height + bottomPadding} 
  className="w-full touch-none"  // ← This is the key!
  viewBox={`0 0 ${width} ${height + bottomPadding}`} 
  preserveAspectRatio="xMidYMid meet"
  ...
>

</svg>