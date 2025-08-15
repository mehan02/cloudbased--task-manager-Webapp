import React, { useState, useEffect, useRef } from "react";
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

// Enhanced Sortable Task Item Component with Professional Design
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
      className={`bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-5 border-l-4 transition-all duration-300 hover:from-gray-700 hover:to-gray-600 shadow-lg hover:shadow-xl backdrop-blur-sm ${
        task.status === 'COMPLETED' ? 'border-green-500 opacity-80' : 
        task.priority?.toUpperCase() === 'HIGH' ? 'border-red-500' :
        task.priority?.toUpperCase() === 'MEDIUM' ? 'border-orange-500' :
        task.priority?.toUpperCase() === 'LOW' ? 'border-green-500' :
        task.priority?.toUpperCase() === 'URGENT' ? 'border-red-600' : 'border-blue-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-4 flex-1 cursor-move"
          {...listeners}
          onMouseDown={(e) => {
            // Don't start drag if clicking on elements with data-no-dnd
            if (e.target.closest('[data-no-dnd]')) {
              e.stopPropagation();
              return;
            }
          }}
        >
          {/* Drag Handle */}
          <div className="text-gray-500 hover:text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
            </svg>
          </div>
          
          {/* Enhanced Checkbox with Professional Design - Made More Clickable */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleComplete(task.id, task.status);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              task.status === 'COMPLETED'
                ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 shadow-lg'
                : 'border-gray-400 hover:border-green-500 hover:shadow-md hover:bg-gray-700'
            }`}
            aria-label={task.status === 'COMPLETED' ? 'Mark as incomplete' : 'Mark as complete'}
            data-no-dnd="true"
          >
            {task.status === 'COMPLETED' && (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold transition-all duration-300 ${
              task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-white'
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm mt-2 ${
                task.status === 'COMPLETED' ? 'text-gray-600 line-through' : 'text-gray-400'
              }`}>
                {task.description}
              </p>
            )}
            <div className="flex items-center mt-3 space-x-4">
              <span className={`text-xs font-medium ${getDueDateColor(task.dueDate)}`}>
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
        
        <div className="flex items-center space-x-4">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getPriorityColor(task.priority)} bg-opacity-10`}>
            {getPriorityText(task.priority)}
          </span>
          
          {/* Enhanced Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log("Delete button clicked for task:", task.id, task.title);
              onDelete(task.id, task.title);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 rounded-full hover:bg-red-900 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer z-10 relative"
            aria-label="Delete task"
            style={{ pointerEvents: 'auto' }}
            data-no-dnd="true"
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

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, taskTitle }) {
  console.log("DeleteConfirmationModal render - isOpen:", isOpen, "taskTitle:", taskTitle);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">Delete Task</h3>
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete <span className="font-semibold text-white">"{taskTitle}"</span>? 
            This action cannot be undone.
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success Confirmation Modal Component
function SuccessConfirmationModal({ isOpen, onClose, title, message, itemName, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
          <p className="text-gray-300 mb-6">
            {message} <span className="font-semibold text-white">"{itemName}"</span>?
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Confirm
            </button>
          </div>
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
  
  // Ref for priority dropdown positioning
  const priorityDropdownRef = useRef(null);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: ""
  });

  // Success confirmation modal state
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    itemName: "",
    onConfirm: null
  });

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
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired. Please login again.");
      } else {
      setError("Failed to load today's tasks");
      }
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
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("Authentication error in fetchLists");
      }
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

    if (showPriorityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
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

    // Show confirmation modal
    setSuccessModal({
      isOpen: true,
      title: "Add New Task",
      message: "Are you sure you want to add the task",
      itemName: newTask,
      onConfirm: async () => {
        try {
          console.log("Creating task with priority:", selectedPriority);
          const taskData = {
        title: newTask,
            priority: selectedPriority
          };

          if (newTaskDueDate) {
            // Create a proper date object and set it to end of day (23:59:59)
            const selectedDate = new Date(newTaskDueDate);
            selectedDate.setHours(23, 59, 59, 999);
            // Format as ISO string without timezone to avoid parsing issues
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const hours = String(selectedDate.getHours()).padStart(2, '0');
            const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
            const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
            const milliseconds = String(selectedDate.getMilliseconds()).padStart(3, '0');
            
            taskData.dueDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
            console.log("Selected date:", newTaskDueDate);
            console.log("Processed date:", selectedDate);
            console.log("ISO string:", taskData.dueDate);
          }

          if (selectedList) {
            taskData.taskListId = selectedList.id;
          }

          console.log("Task data being sent:", taskData);
          const response = await tasksAPI.create(taskData);
          console.log("Task created successfully:", response.data);
          
      setNewTask("");
          setNewTaskDueDate("");
          setSelectedPriority("MEDIUM");
      fetchTodayTasks();
          
          // Close modal after successful creation
          setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
    } catch (err) {
      console.error("Error adding task:", err);
          if (err.response?.status === 401 || err.response?.status === 403) {
            setError("Session expired. Please login again.");
          } else {
            setError("Failed to add task. Please try again.");
          }
          // Close modal on error
          setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
        }
      }
    });
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

  // Updated delete function with confirmation
  const handleDeleteClick = (taskId, taskTitle) => {
    console.log("Delete button clicked for task:", taskId, taskTitle);
    setDeleteModal({
      isOpen: true,
      taskId: taskId,
      taskTitle: taskTitle
    });
  };

  const confirmDelete = async () => {
    console.log("Confirming delete for task:", deleteModal.taskId);
    try {
      await tasksAPI.delete(deleteModal.taskId);
      console.log("Task deleted successfully");
      setDeleteModal({ isOpen: false, taskId: null, taskTitle: "" });
      fetchTodayTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
      setDeleteModal({ isOpen: false, taskId: null, taskTitle: "" });
    }
  };

  const cancelDelete = () => {
    console.log("Delete cancelled");
    setDeleteModal({ isOpen: false, taskId: null, taskTitle: "" });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Main Content Box with Colored Background */}
      <div className="relative">
        {/* Enhanced Background Artwork with Professional Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 opacity-20 rounded-3xl blur-3xl animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500 via-purple-600 to-pink-700 opacity-15 rounded-3xl blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Main Container with Professional Gradient Background */}
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-indigo-500 to-pink-600 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Today's Tasks Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Today's Tasks
              </h1>
              
              <p className="text-slate-300 text-xl font-medium mb-6">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
              
              {/* Enhanced Animated Dots */}
              <div className="flex justify-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.3s'}}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.6s'}}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.9s'}}></div>
              </div>
      </div>

      {error && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl mb-6 shadow-lg border border-red-400">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
          {error}
                </div>
        </div>
      )}

            {/* Enhanced Task Creation Section */}
            <div className="mb-12">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-700 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative">
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Add New Task</h2>
                    <p className="text-gray-400 text-lg">Create a new task to add to your today's list</p>
                  </div>

                  <form onSubmit={addTask}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
                        placeholder="What needs to be done?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
                        className="px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-lg"
                      />
                      <div className="relative">
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-lg w-full"
                          placeholder="Select due date"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Quick Date Selector */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setNewTaskDueDate(new Date().toISOString().split('T')[0])}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            setNewTaskDueDate(tomorrow.toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200"
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextWeek = new Date();
                            nextWeek.setDate(nextWeek.getDate() + 7);
                            setNewTaskDueDate(nextWeek.toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors duration-200"
                        >
                          Next Week
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTaskDueDate("")}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors duration-200"
                        >
                          Clear
                        </button>
                      </div>
                      <select
                        value={selectedList?.id || ""}
                        onChange={(e) => {
                          const list = lists.find(l => l.id === parseInt(e.target.value));
                          setSelectedList(list || null);
                        }}
                        className="px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-lg"
                      >
                        <option value="">📁 No List</option>
                        {lists.map((list) => (
                          <option key={list.id} value={list.id}>
                            📁 {list.name}
                          </option>
                        ))}
                      </select>
                      <div className="relative priority-dropdown" ref={priorityDropdownRef}>
                        <button
                          type="button"
                          onClick={() => {
                            console.log("Dropdown toggle clicked, current state:", showPriorityDropdown);
                            setShowPriorityDropdown(!showPriorityDropdown);
                          }}
                          className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between shadow-lg"
                        >
                          <span className={selectedPriority === "LOW" ? "text-green-500" : 
                                          selectedPriority === "MEDIUM" ? "text-orange-500" : 
                                          selectedPriority === "HIGH" ? "text-red-500" : "text-red-600"}>
                            {selectedPriority === "LOW" ? "🟢 Low" : 
                             selectedPriority === "MEDIUM" ? "🟠 Medium" : 
                             selectedPriority === "HIGH" ? "🔴 High" : "🚨 Urgent"}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
          <button
            type="submit"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
                        ➕ Add Task
          </button>
        </div>
      </form>
                </div>
              </div>
            </div>

                         {/* Enhanced Tasks List Section */}
             <div className="mb-12">

      {loading ? (
                <div className="text-center text-gray-400 py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  <p className="text-xl font-medium">Loading your tasks...</p>
                  <p className="text-sm text-gray-500 mt-2">Preparing your productivity dashboard</p>
                </div>
      ) : sortedTasks.length === 0 ? (
                <div className="text-center text-gray-400 py-20 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
                  <div className="text-8xl mb-6">✨</div>
                  <h3 className="text-2xl font-bold text-white mb-3">No tasks for today!</h3>
                  <p className="text-lg mb-4">You're all caught up. Time to add some new tasks above!</p>
                  <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
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
                    <div className="space-y-4">
          {sortedTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={toggleComplete}
                          onDelete={handleDeleteClick}
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

            {/* Priority Dropdown Portal */}
            {showPriorityDropdown && priorityDropdownRef.current && (() => {
              const rect = priorityDropdownRef.current.getBoundingClientRect();
              return (
                <div 
                  className="fixed z-[9999] bg-gray-700 border border-gray-600 rounded-xl shadow-2xl"
                  style={{
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Setting priority to LOW");
                      setSelectedPriority("LOW");
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-green-500 hover:bg-gray-600 cursor-pointer transition-colors rounded-t-xl text-left"
                  >
                    🟢 Low
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Setting priority to MEDIUM");
                      setSelectedPriority("MEDIUM");
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-orange-500 hover:bg-gray-600 cursor-pointer transition-colors text-left"
                  >
                    🟠 Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Setting priority to HIGH");
                      setSelectedPriority("HIGH");
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-red-500 hover:bg-gray-600 cursor-pointer transition-colors text-left"
                  >
                    🔴 High
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Setting priority to URGENT");
                      setSelectedPriority("URGENT");
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-red-600 hover:bg-gray-600 cursor-pointer transition-colors rounded-b-xl text-left"
                  >
                    🚨 Urgent
                  </button>
                </div>
              );
            })()}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
              isOpen={deleteModal.isOpen}
              onClose={cancelDelete}
              onConfirm={confirmDelete}
              taskTitle={deleteModal.taskTitle}
            />

            {/* Success Confirmation Modal */}
            <SuccessConfirmationModal
              isOpen={successModal.isOpen}
              onClose={closeSuccessModal}
              onConfirm={successModal.onConfirm}
              title={successModal.title}
              message={successModal.message}
              itemName={successModal.itemName}
            />
            </div>
        </div>
      </div>
    </div>
  );
}

export default TodayView;
