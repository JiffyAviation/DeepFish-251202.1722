import React from 'react';
import './TaskDetailPanel.css';

const TaskDetailPanel = ({ task, onClose }) => {
  if (!task) return null;
  
  // Calculate overall completion
  const overallProgress = task.agents.reduce((sum, agent) => 
    sum + (agent.progress * agent.computePercent / 100), 0
  ).toFixed(1);
  
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Calculate expected completion time
  const expectedCompletion = new Date(task.startTime);
  expectedCompletion.setHours(expectedCompletion.getHours() + task.estimatedHours);
  
  return (
    <div className="task-detail-panel">
      <div className="panel-header">
        <h3>{task.name}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="panel-content">
        {/* Status indicator */}
        <div className="detail-section">
          <label>Status:</label>
          <span className={`status-badge status-${task.status}`}>
            {task.status.toUpperCase()}
          </span>
          <span className="progress-percent">{overallProgress}% Complete</span>
        </div>
        
        {/* Timeline info */}
        <div className="detail-section">
          <label>Timeline:</label>
          <div className="timeline-info">
            <div>Started: {formatDate(task.startTime)}</div>
            <div>Expected: {formatDate(expectedCompletion)}</div>
            <div>Duration: {task.estimatedHours} hours</div>
          </div>
        </div>
        
        {/* Assigned agents */}
        <div className="detail-section">
          <label>Assigned Agents:</label>
          <div className="agent-list">
            {task.agents.map((agent, index) => (
              <div key={index} className="agent-item">
                <div 
                  className="agent-color-dot" 
                  style={{ backgroundColor: agent.color }}
                />
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-stats">
                    <span>{agent.computePercent}% compute</span>
                    <span className="separator">•</span>
                    <span>{agent.progress}% done</span>
                  </div>
                </div>
                {agent.progress >= 100 && (
                  <span className="completion-badge">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Blockers and notes */}
        {task.blockers && task.blockers.length > 0 && (
          <div className="detail-section blockers-section">
            <label>⚠️ Blockers - CEO Attention Required:</label>
            <div className="blocker-list">
              {task.blockers.map((blocker, index) => (
                <div key={index} className="blocker-item">
                  <div className="blocker-type">{blocker.type}</div>
                  <div className="blocker-description">{blocker.description}</div>
                  {blocker.waitingOn && (
                    <div className="waiting-on">
                      Waiting on: {blocker.waitingOn}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Task notes */}
        {task.notes && (
          <div className="detail-section">
            <label>Notes:</label>
            <div className="task-notes">{task.notes}</div>
          </div>
        )}
        
        {/* Dependencies */}
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="detail-section">
            <label>Dependencies:</label>
            <div className="dependency-list">
              {task.dependencies.map((dep, index) => (
                <div key={index} className="dependency-item">
                  → {dep}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailPanel;
