import React from 'react';
import './TaskRow.css';

const TaskRow = ({ 
  task, 
  zoomLevel, 
  panOffset, 
  startTime, 
  indentLevel = 0,
  onTaskClick 
}) => {
  const hourWidth = 100 * zoomLevel;
  
  // Calculate task position on timeline
  const taskStartHours = (new Date(task.startTime) - startTime) / (1000 * 60 * 60);
  const taskX = taskStartHours * hourWidth + panOffset;
  const taskWidth = task.estimatedHours * hourWidth;
  
  // Calculate overall task completion
  const overallProgress = task.agents.reduce((sum, agent) => 
    sum + (agent.progress * agent.computePercent / 100), 0
  );
  
  // Determine task status glow
  const getTaskGlow = () => {
    if (task.status === 'completed') return 'golden-glow';
    if (task.status === 'blocked') return 'red-breathing-glow';
    return '';
  };
  
  return (
    <div className="task-row-container">
      <div className="task-row">
        {/* Task label on left with indentation */}
        <div 
          className="task-label" 
          style={{ paddingLeft: `${indentLevel * 20}px` }}
        >
          {indentLevel > 0 && <span className="indent-marker">└─</span>}
          <span className="task-name">{task.name}</span>
        </div>
        
        {/* Task timeline bar */}
        <div className="task-timeline">
          <svg width="100%" height="40">
            {/* Main task bar container */}
            <g onClick={() => onTaskClick(task)} style={{ cursor: 'pointer' }}>
              <rect
                x={taskX}
                y="10"
                width={taskWidth}
                height="20"
                fill="#1a1a1a"
                stroke="#666"
                strokeWidth="1"
                className={getTaskGlow()}
                rx="4"
              />
              
              {/* Agent segments */}
              {renderAgentSegments(task, taskX, taskWidth)}
              
              {/* Overall progress overlay */}
              <rect
                x={taskX}
                y="10"
                width={taskWidth * (overallProgress / 100)}
                height="20"
                fill="rgba(100, 200, 100, 0.2)"
                rx="4"
              />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Render child tasks recursively */}
      {task.children && task.children.map(childTask => (
        <TaskRow
          key={childTask.id}
          task={childTask}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          startTime={startTime}
          indentLevel={indentLevel + 1}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
};

// Render colored segments for each agent with progress indicators
const renderAgentSegments = (task, startX, totalWidth) => {
  let currentX = startX;
  const segments = [];
  
  task.agents.forEach((agent, index) => {
    const segmentWidth = totalWidth * (agent.computePercent / 100);
    
    // Agent's colored segment
    segments.push(
      <g key={`agent-${index}`}>
        {/* Background segment */}
        <rect
          x={currentX}
          y="10"
          width={segmentWidth}
          height="20"
          fill={agent.color}
          opacity="0.6"
        />
        
        {/* Agent's progress indicator line */}
        <line
          x1={currentX + (segmentWidth * agent.progress / 100)}
          y1="10"
          x2={currentX + (segmentWidth * agent.progress / 100)}
          y2="30"
          stroke={agent.color}
          strokeWidth="3"
          className="progress-marker"
          filter="url(#glow)"
        >
          <animate
            attributeName="opacity"
            values="0.7;1;0.7"
            dur="2s"
            repeatCount="indefinite"
          />
        </line>
        
        {/* Completion glow border for finished agents */}
        {agent.progress >= 100 && (
          <rect
            x={currentX}
            y="10"
            width={segmentWidth}
            height="20"
            fill="none"
            stroke={agent.color}
            strokeWidth="2"
            className="breathing-border"
          />
        )}
        
        {/* Segment divider */}
        {index < task.agents.length - 1 && (
          <line
            x1={currentX + segmentWidth}
            y1="10"
            x2={currentX + segmentWidth}
            y2="30"
            stroke="#000"
            strokeWidth="1"
          />
        )}
      </g>
    );
    
    currentX += segmentWidth;
  });
  
  // SVG filter for glow effect
  segments.push(
    <defs key="defs">
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  );
  
  return segments;
};

export default TaskRow;
