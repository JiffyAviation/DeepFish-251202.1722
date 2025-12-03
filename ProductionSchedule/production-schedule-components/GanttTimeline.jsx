import React from 'react';
import './GanttTimeline.css';

const GanttTimeline = ({ zoomLevel, panOffset, startTime, duration }) => {
  // Calculate visible time range based on container width
  const containerWidth = 1200; // This will be dynamic based on actual container
  const hourWidth = 100 * zoomLevel; // Base: 100px per hour, scaled by zoom
  
  // Calculate which hours are visible
  const visibleStartHour = Math.floor(-panOffset / hourWidth);
  const visibleEndHour = Math.ceil((containerWidth - panOffset) / hourWidth);
  
  // Generate hour markers
  const hours = [];
  for (let i = visibleStartHour; i <= visibleEndHour; i++) {
    const date = new Date(startTime);
    date.setHours(date.getHours() + i);
    
    const x = i * hourWidth + panOffset;
    
    // Only render if within viewport
    if (x >= -hourWidth && x <= containerWidth + hourWidth) {
      hours.push({
        hour: i,
        x: x,
        label: formatHourLabel(date, zoomLevel)
      });
    }
  }
  
  return (
    <div className="gantt-timeline" style={{ width: '100%', height: '60px' }}>
      <svg width="100%" height="60">
        {/* Hour grid lines and labels */}
        {hours.map(({ hour, x, label }) => (
          <g key={hour}>
            {/* Vertical grid line */}
            <line
              x1={x}
              y1="0"
              x2={x}
              y2="60"
              stroke="#444"
              strokeWidth="1"
            />
            
            {/* Hour label */}
            <text
              x={x + 5}
              y="20"
              fill="#ccc"
              fontSize={Math.min(12, 12 * Math.sqrt(zoomLevel))}
              fontFamily="monospace"
            >
              {label}
            </text>
            
            {/* Sub-hour markers (every 15 minutes) when zoomed in */}
            {zoomLevel > 2 && renderSubHourMarkers(x, hourWidth)}
          </g>
        ))}
        
        {/* Current time indicator */}
        <CurrentTimeMarker 
          startTime={startTime} 
          hourWidth={hourWidth} 
          panOffset={panOffset}
        />
      </svg>
    </div>
  );
};

// Render 15-minute interval markers when zoomed in
const renderSubHourMarkers = (hourX, hourWidth) => {
  const markers = [];
  for (let i = 1; i < 4; i++) {
    const x = hourX + (i * hourWidth / 4);
    markers.push(
      <line
        key={`sub-${i}`}
        x1={x}
        y1="40"
        x2={x}
        y2="60"
        stroke="#333"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
    );
  }
  return markers;
};

// Current time indicator line
const CurrentTimeMarker = ({ startTime, hourWidth, panOffset }) => {
  const now = new Date();
  const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);
  const x = hoursSinceStart * hourWidth + panOffset;
  
  return (
    <g>
      <line
        x1={x}
        y1="0"
        x2={x}
        y2="60"
        stroke="#ff6600"
        strokeWidth="2"
      />
      <circle
        cx={x}
        cy="30"
        r="4"
        fill="#ff6600"
      />
    </g>
  );
};

// Format hour labels based on zoom level
const formatHourLabel = (date, zoomLevel) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (zoomLevel < 0.5) {
    // Very zoomed out: show date
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (zoomLevel < 2) {
    // Normal zoom: show hour in 12-hour format
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'pm' : 'am';
    return `${hour12}${ampm}`;
  } else {
    // Zoomed in: show hour:minute
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
};

export default GanttTimeline;
