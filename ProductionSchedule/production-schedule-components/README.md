# DeepFish Production Schedule - Real-Time Gantt Chart

A live, interactive Gantt chart for tracking AI agent workload in real-time.

## Features

- **Zoom-to-Cursor**: Mouse wheel zooms in/out while keeping the cursor point fixed
- **Pan Control**: Ctrl+drag to pan left/right across timeline
- **Hierarchical Tasks**: Indented task structure showing dependencies
- **Agent Segments**: Color-coded segments showing compute allocation per agent
- **Live Progress**: Animated progress markers traveling through each agent's segment
- **Status Indicators**:
  - Golden glow: Completed tasks
  - Red breathing glow: Blocked tasks requiring CEO attention
  - Breathing borders: Individual agent completion
- **Task Details**: Click any task to see full details, blockers, and notes
- **Real-Time Updates**: WebSocket integration for live agent progress

## Installation

1. Copy all component files to your DeepFish project:
   - ProductionScheduleComplete.jsx (main component)
   - GanttTimeline.jsx
   - TaskRow.jsx
   - TaskDetailPanel.jsx
   - All CSS files

2. Install dependencies (if not already installed):
```bash
npm install react
```

3. Import and use in your app:
```javascript
import ProductionSchedule from './ProductionScheduleComplete';

function App() {
  return <ProductionSchedule />;
}
```

## WebSocket Integration

Update the WebSocket URL in `ProductionScheduleComplete.jsx`:

```javascript
const wsUrl = 'ws://your-railway-app.railway.app/ws/production';
```

### Expected WebSocket Message Format

```json
{
  "taskId": 1,
  "agentName": "Hanna",
  "progress": 75,
  "status": "active"
}
```

## Backend Requirements

Your DeepFish backend needs to:

1. Provide WebSocket endpoint at `/ws/production`
2. Send progress updates when agents complete work
3. Include task data structure with:
   - Task ID, name, start time, estimated hours
   - Agent assignments with compute percentages
   - Status (active/completed/blocked)
   - Blockers (if any)

## Task Data Structure

```javascript
{
  id: 1,
  name: "Task Name",
  startTime: new Date(),
  estimatedHours: 8,
  status: "active", // or "completed" or "blocked"
  agents: [
    {
      name: "Hanna",
      color: "#ff6b6b",
      computePercent: 40,
      progress: 65
    }
  ],
  blockers: [
    {
      type: "Dependencies",
      description: "Waiting for X",
      waitingOn: "Team/Resource"
    }
  ],
  notes: "Additional context",
  dependencies: ["Task A", "Task B"],
  children: [] // Nested subtasks
}
```

## Controls

- **Mouse Wheel**: Zoom in/out (zoom-to-cursor)
- **Ctrl + Drag**: Pan timeline left/right
- **Click Task**: Show details panel
- **Hover**: Highlight task segments

## Customization

### Agent Colors

Define in your task data:
```javascript
agents: [
  { name: "Hanna", color: "#ff6b6b", ... },
  { name: "Oracle", color: "#a29bfe", ... }
]
```

### Timeline Range

Adjust in `GanttTimeline.jsx`:
```javascript
const hourWidth = 100 * zoomLevel; // Pixels per hour
```

### Animation Speed

Modify CSS animations in `TaskRow.css`:
```css
animation: golden-pulse 2s ease-in-out infinite;
```

## Next Steps

1. Connect to your DeepFish backend WebSocket
2. Map your agent task assignments to the data structure
3. Implement task creation/assignment in your CEO interface
4. Add export/reporting features as needed
