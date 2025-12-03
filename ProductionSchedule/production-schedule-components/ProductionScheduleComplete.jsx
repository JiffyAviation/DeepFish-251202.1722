import React, { useState, useEffect, useRef } from 'react';
import GanttTimeline from './GanttTimeline';
import TaskRow from './TaskRow';
import TaskDetailPanel from './TaskDetailPanel';
import './ProductionSchedule.css';

const ProductionScheduleComplete = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [startTime] = useState(new Date());
  
  const chartRef = useRef(null);
  const wsRef = useRef(null);
  const panStartRef = useRef({ x: 0, offset: 0 });

  // Initialize with mock data
  useEffect(() => {
    const mockTasks = [
      {
        id: 1,
        name: "Landing Page Redesign",
        startTime: new Date(),
        estimatedHours: 12,
        status: "active",
        agents: [
          { name: "Hanna", color: "#ff6b6b", computePercent: 40, progress: 65 },
          { name: "IT", color: "#4ecdc4", computePercent: 35, progress: 45 },
          { name: "Mei", color: "#ffe66d", computePercent: 25, progress: 30 }
        ],
        notes: "Focus on modern, clean aesthetic",
        children: [
          {
            id: 2,
            name: "Concept Development",
            startTime: new Date(),
            estimatedHours: 3,
            status: "completed",
            agents: [
              { name: "Hanna", color: "#ff6b6b", computePercent: 100, progress: 100 }
            ]
          },
          {
            id: 3,
            name: "UI Implementation",
            startTime: new Date(Date.now() + 3 * 3600000),
            estimatedHours: 5,
            status: "active",
            agents: [
              { name: "IT", color: "#4ecdc4", computePercent: 60, progress: 55 },
              { name: "Mei", color: "#ffe66d", computePercent: 40, progress: 40 }
            ]
          }
        ]
      },
      {
        id: 4,
        name: "API Integration",
        startTime: new Date(Date.now() + 8 * 3600000),
        estimatedHours: 8,
        status: "blocked",
        agents: [
          { name: "Oracle", color: "#a29bfe", computePercent: 100, progress: 25 }
        ],
        blockers: [
          {
            type: "Dependencies",
            description: "Waiting for external API credentials from client",
            waitingOn: "Client team (credentials)"
          }
        ],
        notes: "Critical path item - needs CEO attention"
      },
      {
        id: 5,
        name: "Voice Training Module",
        startTime: new Date(Date.now() - 6 * 3600000),
        estimatedHours: 15,
        status: "active",
        agents: [
          { name: "Hanna", color: "#ff6b6b", computePercent: 50, progress: 80 },
          { name: "Oracle", color: "#a29bfe", computePercent: 30, progress: 70 },
          { name: "Cipher", color: "#fd79a8", computePercent: 20, progress: 90 }
        ],
        children: [
          {
            id: 6,
            name: "Pitch Detection Algorithm",
            startTime: new Date(Date.now() - 6 * 3600000),
            estimatedHours: 5,
            status: "completed",
            agents: [
              { name: "Cipher", color: "#fd79a8", computePercent: 100, progress: 100 }
            ]
          }
        ]
      }
    ];
    
    setTasks(mockTasks);
  }, []);

  // WebSocket connection
  useEffect(() => {
    // Replace with your actual WebSocket URL
    const wsUrl = 'ws://localhost:8000/ws/production';
    
    try {
      const ws = new WebSocket(wsUrl);
      
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
    } catch (error) {
      console.log('WebSocket not available - using mock data');
    }
  }, []);

  const handleAgentUpdate = (update) => {
    setTasks(prevTasks => 
      updateTaskProgress(prevTasks, update.taskId, update.agentName, update)
    );
  };

  const updateTaskProgress = (tasks, taskId, agentName, update) => {
    return tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          agents: task.agents.map(agent => 
            agent.name === agentName 
              ? { ...agent, progress: update.progress, status: update.status }
              : agent
          )
        };
      }
      if (task.children) {
        return {
          ...task,
          children: updateTaskProgress(task.children, taskId, agentName, update)
        };
      }
      return task;
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const oldZoom = zoomLevel;
    const newZoom = Math.max(0.1, Math.min(10, zoomLevel * (1 - e.deltaY * 0.001)));
    
    const focusPoint = (mouseX - panOffset) / oldZoom;
    const newOffset = mouseX - focusPoint * newZoom;
    
    setZoomLevel(newZoom);
    setPanOffset(newOffset);
  };

  const handleMouseDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

  // Get all unique agents with colors
  const getAllAgents = () => {
    const agentMap = new Map();
    const extractAgents = (taskList) => {
      taskList.forEach(task => {
        task.agents.forEach(agent => {
          if (!agentMap.has(agent.name)) {
            agentMap.set(agent.name, agent.color);
          }
        });
        if (task.children) {
          extractAgents(task.children);
        }
      });
    };
    extractAgents(tasks);
    return Array.from(agentMap.entries());
  };

  const renderAllTasks = (taskList) => {
    return taskList.map(task => (
      <TaskRow
        key={task.id}
        task={task}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        startTime={startTime}
        indentLevel={0}
        onTaskClick={handleTaskClick}
      />
    ));
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
        <GanttTimeline 
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          startTime={startTime}
          duration={24}
        />
        
        <div className="tasks-container">
          {renderAllTasks(tasks)}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailPanel 
          task={selectedTask}
          onClose={handleCloseDetail}
        />
      )}

      <div className="legend">
        <h4>Agent Legend</h4>
        <div className="legend-items">
          {getAllAgents().map(([name, color]) => (
            <div key={name} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: color }}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionScheduleComplete;
