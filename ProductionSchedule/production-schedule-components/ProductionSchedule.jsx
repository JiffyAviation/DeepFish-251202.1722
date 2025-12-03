import React, { useState, useEffect, useRef } from 'react';
import './ProductionSchedule.css';

const ProductionSchedule = () => {
  // State management
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 1 hour per 100px
  const [panOffset, setPanOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  
  // Refs for canvas and interaction
  const chartRef = useRef(null);
  const wsRef = useRef(null);
  const panStartRef = useRef({ x: 0, offset: 0 });

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Connect to your DeepFish backend WebSocket
    const ws = new WebSocket('ws://your-railway-url/ws/production');
    
    ws.onopen = () => {
      console.log('Production Schedule WebSocket connected');
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleAgentUpdate(update);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Handle real-time agent progress updates
  const handleAgentUpdate = (update) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === update.taskId) {
          return {
            ...task,
            agents: task.agents.map(agent => {
              if (agent.name === update.agentName) {
                return {
                  ...agent,
                  progress: update.progress,
                  status: update.status
                };
              }
              return agent;
            })
          };
        }
        return task;
      });
    });
  };

  // Zoom-to-cursor effect
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const oldZoom = zoomLevel;
    const newZoom = Math.max(0.1, Math.min(10, zoomLevel * (1 - e.deltaY * 0.001)));
    
    // Calculate new pan offset to keep cursor point fixed
    const focusPoint = (mouseX - panOffset) / oldZoom;
    const newOffset = mouseX - focusPoint * newZoom;
    
    setZoomLevel(newZoom);
    setPanOffset(newOffset);
  };

  // Pan with Ctrl+drag
  const handleMouseDown = (e) => {
    if (e.ctrlKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        offset: panOffset
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - panStartRef.current.x;
      setPanOffset(panStartRef.current.offset + deltaX);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Click handler for task selection
  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  return (
    <div className="production-schedule">
      <h1>Production Schedule</h1>
      
      <div 
        className="chart-container"
        ref={chartRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Timeline and task rows will be rendered here */}
        <div className="chart-content">
          <p>Chart rendering in progress...</p>
        </div>
      </div>

      {/* Task details panel */}
      {selectedTask && (
        <div className="task-detail-panel">
          <h3>{selectedTask.name}</h3>
          <p>Status: {selectedTask.status}</p>
          {/* More details to come */}
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <h4>Agent Legend</h4>
        {/* Legend items will be added */}
      </div>
    </div>
  );
};

export default ProductionSchedule;
