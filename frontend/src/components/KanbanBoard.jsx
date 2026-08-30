import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SlaCountdown from './SlaCountdown';
import AIExplainerModal from './AIExplainerModal';
import TaskChatDrawer from './TaskChatDrawer';
import { 
  Sparkles, 
  Plus, 
  MessageSquare, 
  BrainCircuit, 
  AlertCircle, 
  CheckCircle, 
  UserPlus,
  Zap,
  Filter
} from 'lucide-react';

const COLUMNS = [
  { id: 'TO_DO', title: 'To-Do Tasks', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress (Active Ops)', color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300' },
  { id: 'UNDER_REVIEW', title: 'QA Coding Review', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' }
];

export default function KanbanBoard() {
  const { user } = useAuth();
  const canCreateTask = user && ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER'].includes(user.role);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskForAI, setSelectedTaskForAI] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [activeChatTask, setActiveChatTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    complexityIndex: 7.5,
    estimatedHours: 8,
    batchId: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchTasks(); // revert on failure
    }
  };

  const handleRunAIWorkloadBalancer = async (task) => {
    setSelectedTaskForAI(task);
    try {
      const res = await api.post('/ai/recommend-assignment', { taskId: task.id });
      setAiRecommendation({
        taskTitle: task.title,
        topRecommendation: res.data.topRecommendation,
        allCandidates: res.data.allCandidates
      });
    } catch (err) {
      console.error('AI Recommendation Error:', err);
    }
  };

  const handleConfirmAssignment = async (userId) => {
    if (!selectedTaskForAI) return;
    try {
      await api.patch(`/tasks/${selectedTaskForAI.id}/assign`, { assignedTo: userId });
      setAiRecommendation(null);
      setSelectedTaskForAI(null);
      fetchTasks();
    } catch (err) {
      console.error('Failed to assign task:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      await api.post('/tasks', newTask);
      setShowNewTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'HIGH', complexityIndex: 7.5, estimatedHours: 8, batchId: '' });
      fetchTasks();
    } catch (err) {
      console.error('Task creation error:', err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading RCM Tasks Kanban Board...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            RCM Operations Kanban Board
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {tasks.length} Active Tasks
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Drag-and-drop claim tasks across columns. Integrated with Scikit-Learn AI auto-dispatching.
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create RCM Task
          </button>
        )}
      </div>

      {/* Drag and Drop Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="glass-panel p-4 rounded-2xl space-y-4 flex flex-col min-h-[600px]">
                {/* Column Header */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${col.color}`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900/60">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Droppable Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 rounded-xl p-1 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-950/30 border border-dashed border-indigo-500/40' : ''
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`glass-card p-4 rounded-xl border space-y-3 relative group ${
                                snapshot.isDragging ? 'shadow-2xl border-indigo-500 glow-indigo' : 'border-slate-800'
                              }`}
                            >
                              {/* Priority & Complexity */}
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                                  ⚡ {task.complexityIndex} Complexity
                                </span>
                              </div>

                              {/* Task Title & Description */}
                              <div>
                                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {task.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                                  {task.description}
                                </p>
                              </div>

                              {/* SLA Timer */}
                              <SlaCountdown deadline={task.dueDate} />

                              {/* Footer: User & Actions */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                {/* User Avatar */}
                                <div className="flex items-center space-x-2">
                                  {task.assignedUserAvatar ? (
                                    <img src={task.assignedUserAvatar} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                                      ?
                                    </div>
                                  )}
                                  <span className="text-[11px] text-slate-300 font-medium truncate max-w-[90px]">
                                    {task.assignedUserName}
                                  </span>
                                </div>

                                {/* AI Dispatcher & Chat Triggers */}
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => handleRunAIWorkloadBalancer(task)}
                                    title="Run AI Workload Balancer"
                                    className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 transition-all"
                                  >
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setActiveChatTask(task)}
                                    title="Open Task Chat Thread"
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* AI Recommendation Explainer Modal */}
      {aiRecommendation && (
        <AIExplainerModal
          recommendation={aiRecommendation}
          onClose={() => setAiRecommendation(null)}
          onConfirmAssign={handleConfirmAssignment}
        />
      )}

      {/* Task Chat Drawer */}
      {activeChatTask && (
        <TaskChatDrawer
          task={activeChatTask}
          onClose={() => setActiveChatTask(null)}
        />
      )}

      {/* Create Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4">
            <h3 className="text-base font-bold text-white">Create New RCM Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  placeholder="e.g., ICD-10 Audit Cardiology Batch"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  placeholder="Encounter validation details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Complexity (1-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTask.complexityIndex}
                    onChange={(e) => setNewTask({ ...newTask, complexityIndex: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
