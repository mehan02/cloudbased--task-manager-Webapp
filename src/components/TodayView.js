import React, { useState, useEffect } from "react";
import { tasksAPI, listsAPI } from "../services/api";
import { format, isToday, isTomorrow, isThisWeek, isPast } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Task Item Component
function SortableTaskItem({ task, onToggleComplete, onDelete, getPriorityColor, getPriorityText, formatDueDate, getDueDateColor }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
                               className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-200 hover:bg-gray-750 cursor-move ${
                           task.status === 'COMPLETED' ? 'border-green-500 opacity-75' : 
                           task.priority?.toUpperCase() === 'HIGH' ? 'border-red-500' :
                           task.priority?.toUpperCase() === 'MEDIUM' ? 'border-orange-500' :
                           task.priority?.toUpperCase() === 'LOW' ? 'border-green-500' :
                           task.priority?.toUpperCase() === 'URGENT' ? 'border-red-600' : 'border-blue-500'
                         }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id, task.status);
            }}
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              task.status === 'COMPLETED'
                ? 'bg-green-500 border-green-500'
                : 'border-gray-400 hover:border-green-500'
            }`}
          >
            {task.status === 'COMPLETED' && (
              <svg className="w-4 h-4 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <h3 className={`text-lg font-medium transition-all duration-200 ${
              task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-white'
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm mt-1 ${
                task.status === 'COMPLETED' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {task.description}
              </p>
            )}
            <div className="flex items-center mt-2 space-x-4">
              <span className={`text-xs ${getDueDateColor(task.dueDate)}`}>
                📅 {formatDueDate(task.dueDate)}
              </span>
              {task.dueDate && (
                <span className="text-xs text-gray-500">
                  {format(new Date(task.dueDate), 'h:mm a')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
            {getPriorityText(task.priority)}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-900 rounded"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function TodayView() {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [selectedList, setSelectedList] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("MEDIUM");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTodayTasks = async () => {
    try {
      console.log("Fetching today's tasks...");
      setLoading(true);
      setError(null);
      const res = await tasksAPI.getToday();
      console.log("Today's tasks response:", res.data);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching today's tasks:", err);
      setError("Failed to load today's tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const res = await listsAPI.getAll();
      setLists(res.data);
    } catch (err) {
      console.error("Error fetching lists:", err);
    }
  };

  useEffect(() => {
    console.log("TodayView mounted, fetching tasks and lists...");
    fetchTodayTasks();
    fetchLists();
  }, []);

  // Close priority dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPriorityDropdown && !event.target.closest('.priority-dropdown')) {
        setShowPriorityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriorityDropdown]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update sort order in backend
        const taskOrders = newItems.map((task, index) => ({
          id: task.id,
          sortOrder: index
        }));
        
        // Send update to backend
        tasksAPI.reorder(taskOrders).catch(err => {
          console.error("Error reordering tasks:", err);
          setError("Failed to save task order");
        });
        
        return newItems;
      });
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const taskData = {
        title: newTask,
        priority: selectedPriority
      };

      if (newTaskDueDate) {
        taskData.dueDate = new Date(newTaskDueDate).toISOString();
      }

      if (selectedList) {
        taskData.listId = selectedList.id;
      }

      await tasksAPI.create(taskData);
      setNewTask("");
      setNewTaskDueDate("");
      setSelectedPriority("MEDIUM");
      fetchTodayTasks();
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add task");
    }
  };

  const toggleComplete = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await tasksAPI.update(taskId, { status: newStatus });
      fetchTodayTasks();
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      fetchTodayTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH": return "text-red-500";
      case "MEDIUM": return "text-orange-500";
      case "LOW": return "text-green-500";
      case "URGENT": return "text-red-600";
      default: return "text-gray-500";
    }
  };

  const getPriorityText = (priority) => {
    return priority?.toLowerCase().charAt(0).toUpperCase() + priority?.toLowerCase().slice(1) || "Medium";
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { HIGH: 4, URGENT: 3, MEDIUM: 2, LOW: 1 };
    return priorityOrder[b.priority?.toUpperCase()] - priorityOrder[a.priority?.toUpperCase()];
  });

  const formatDueDate = (dueDate) => {
    if (!dueDate) return "No due date";
    
    const date = new Date(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `Overdue - ${format(date, 'MMM d')}`;
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d, yyyy');
  };

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return "text-gray-500";
    
    const date = new Date(dueDate);
    if (isPast(date)) return "text-red-500";
    if (isToday(date)) return "text-orange-500";
    if (isTomorrow(date)) return "text-blue-500";
    return "text-gray-400";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Today's Tasks</h1>
        <p className="text-gray-400">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Quick Add Bar */}
      <form onSubmit={addTask} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <input
            type="datetime-local"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <select
            value={selectedList?.id || ""}
            onChange={(e) => {
              const list = lists.find(l => l.id === parseInt(e.target.value));
              setSelectedList(list || null);
            }}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">No List</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          <div className="relative priority-dropdown">
            <button
              type="button"
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between"
            >
              <span className={`${getPriorityColor(selectedPriority)}`}>
                {selectedPriority === 'LOW' && '🟢 Low'}
                {selectedPriority === 'MEDIUM' && '🟠 Medium'}
                {selectedPriority === 'HIGH' && '🔴 High'}
                {selectedPriority === 'URGENT' && '🚨 Urgent'}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPriorityDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriority('LOW');
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-green-500 hover:bg-gray-600 transition-colors duration-200"
                  >
                    🟢 Low
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriority('MEDIUM');
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-orange-500 hover:bg-gray-600 transition-colors duration-200"
                  >
                    🟠 Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriority('HIGH');
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-600 transition-colors duration-200"
                  >
                    🔴 High
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriority('URGENT');
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-600 transition-colors duration-200"
                  >
                    🚨 Urgent
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 transform hover:scale-105"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center text-gray-400">Loading tasks...</div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-xl">No tasks for today!</p>
          <p className="text-sm mt-2">Add a task above to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
        <div className="space-y-3">
          {sortedTasks.map((task) => (
                <SortableTaskItem
              key={task.id}
                  task={task}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getPriorityText={getPriorityText}
                  formatDueDate={formatDueDate}
                  getDueDateColor={getDueDateColor}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default TodayView;
