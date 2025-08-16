import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemTitle, itemType = "task" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</h3>
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete <span className="font-semibold text-white">"{itemTitle}"</span>? 
            <br />
            <span className="text-red-400 text-sm">This action cannot be undone.</span>
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

function UpcomingView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: ""
  });

  // Warning modal state for task completion
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: "",
    currentStatus: ""
  });

  const fetchUpcomingTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/tasks/upcoming");
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching upcoming tasks:", err);
      setError("Failed to load upcoming tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingTasks();
  }, [fetchUpcomingTasks]);

  const toggleComplete = async (taskId, currentStatus) => {
    console.log("toggleComplete called with taskId:", taskId, "currentStatus:", currentStatus);
    if (currentStatus === 'COMPLETED') {
      // If already completed, just toggle back to pending without warning
    try {
        await api.put(`/tasks/${taskId}`, { status: 'PENDING' });
      fetchUpcomingTasks();
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
      }
    } else {
      // Show warning before marking as completed
      const taskTitle = tasks.find(t => t.id === taskId)?.title || "this task";
      console.log("Setting warning modal for task:", taskTitle);
      const newWarningModal = {
        isOpen: true,
        taskId: taskId,
        taskTitle: taskTitle,
        currentStatus: currentStatus
      };
      console.log("New warning modal state:", newWarningModal);
      setWarningModal(newWarningModal);
      console.log("Warning modal state set, should be visible now");
    }
  };

  const handleCompleteConfirm = async () => {
    console.log("handleCompleteConfirm called with taskId:", warningModal.taskId);
    
    // Validate that we have a valid taskId
    if (!warningModal.taskId) {
      console.error("No taskId found in warning modal state");
      setError("Invalid task ID");
      setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
      return;
    }
    
    try {
      console.log("Making API call to update task status to COMPLETED");
      console.log("API endpoint:", `/tasks/${warningModal.taskId}`);
      console.log("Request payload:", { status: 'COMPLETED' });
      
      const response = await api.put(`/tasks/${warningModal.taskId}`, { status: 'COMPLETED' });
      console.log("API response:", response);
      console.log("API response data:", response.data);
      console.log("API response status:", response.status);
      console.log("Task completed successfully");
      fetchUpcomingTasks();
      setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
    } catch (err) {
      console.error("Error updating task - Full error object:", err);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      console.error("Error config:", err.config);
      
      // More specific error message
      let errorMessage = "Failed to update task";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Task not found";
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid request data";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      // Still close the modal on error
      setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
    }
  };

  // Auto-delete completed tasks after 48 hours
  const cleanupCompletedTasks = useCallback(async () => {
    try {
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
      
      const tasksToDelete = tasks.filter(task => 
        task.status === 'COMPLETED' && 
        task.completedAt && 
        new Date(task.completedAt) < fortyEightHoursAgo
      );

      for (const task of tasksToDelete) {
        await api.delete(`/tasks/${task.id}`);
      }

      if (tasksToDelete.length > 0) {
        fetchUpcomingTasks();
      }
    } catch (err) {
      console.error("Error cleaning up completed tasks:", err);
    }
  }, [tasks, fetchUpcomingTasks]);

  // Run cleanup every hour
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupCompletedTasks, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(cleanupInterval);
  }, [cleanupCompletedTasks]);

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchUpcomingTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const handleDeleteClick = (taskId, taskTitle) => {
    setDeleteModal({
      isOpen: true,
      taskId: taskId,
      taskTitle: taskTitle
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.taskId) {
      await deleteTask(deleteModal.taskId);
      setDeleteModal({ isOpen: false, taskId: null, taskTitle: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, taskId: null, taskTitle: "" });
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const groupTasksByDate = () => {
    const grouped = {};
    tasks.forEach(task => {
      const date = task.dueDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    });
    return grouped;
  };

  const groupedTasks = groupTasksByDate();
  const sortedDates = Object.keys(groupedTasks).sort();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Debug display - remove this after fixing */}
      {warningModal.isOpen && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-[99999]">
          Debug: Modal is open for task {warningModal.taskId}
        </div>
      )}
      
      {/* Test button - remove this after fixing */}
      <button 
        onClick={() => {
          console.log("Test button clicked");
          setWarningModal({
            isOpen: true,
            taskId: 999,
            taskTitle: "Test Task",
            currentStatus: "PENDING"
          });
        }}
        className="fixed top-4 left-4 bg-blue-500 text-white p-2 rounded z-[99999]"
      >
        Test Modal
      </button>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemTitle={deleteModal.taskTitle}
        itemType="task"
      />

      {/* Warning Modal for Task Completion */}
      {warningModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
            }
          }}
        >
          {console.log("Warning modal is being rendered with taskId:", warningModal.taskId)}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500 bg-opacity-20 mb-6">
                <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Mark Task as Completed</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to mark <span className="font-semibold text-white">"{warningModal.taskTitle}"</span> as completed?
                <br />
                <span className="text-yellow-400 text-sm mt-2 block">
                  ⚠️ This task will be automatically removed after 48 hours.
                </span>
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    console.log("Cancel button clicked");
                    setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log("Complete Task button clicked");
                    handleCompleteConfirm();
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                >
                  Complete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced Header Section with Professional Colored Background */}
      <div className="mb-8 text-center">
        <div className="relative">
          {/* Enhanced Background Artwork with Professional Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 opacity-20 rounded-3xl blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500 via-purple-600 to-pink-700 opacity-15 rounded-3xl blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Main Header Container with Professional Gradient Background */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-indigo-500 to-pink-600 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Upcoming Tasks
              </h1>
              
              <p className="text-slate-300 text-xl font-medium mb-6">
                Upcoming Priorities - Plan ahead for success
              </p>
              
              {/* Enhanced Animated Dots */}
              <div className="flex justify-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.3s'}}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.6s'}}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.9s'}}></div>
              </div>
            </div>
          </div>
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

      {loading ? (
        <div className="text-center text-gray-400 py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{animationDelay: '0.5s'}}></div>
          </div>
          <p className="text-xl font-medium">Loading upcoming tasks...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your future schedule</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="text-8xl mb-6">📅</div>
          <h3 className="text-2xl font-bold text-white mb-3">No upcoming tasks!</h3>
          <p className="text-lg mb-4">Tasks with due dates will appear here. Time to plan ahead!</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {formatDate(date)}
              </h2>
              
              <div className="space-y-4">
                {groupedTasks[date]
                  .sort((a, b) => {
                    const priorityOrder = { HIGH: 4, URGENT: 3, MEDIUM: 2, LOW: 1 };
                    return priorityOrder[b.priority?.toUpperCase()] - priorityOrder[a.priority?.toUpperCase()];
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-4 border-l-4 transition-all duration-300 hover:from-gray-650 hover:to-gray-750 shadow-lg hover:shadow-xl ${
                        task.status === 'COMPLETED' ? 'border-green-500 opacity-75' : 
                        task.priority === 'HIGH' ? 'border-red-500' :
                        task.priority === 'MEDIUM' ? 'border-orange-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <button
                            onClick={() => toggleComplete(task.id, task.status)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 shadow-lg ${
                              task.status === 'COMPLETED'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500'
                                : 'border-gray-400 hover:border-green-500 hover:bg-gray-600'
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
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`text-sm font-medium px-3 py-1 rounded-full bg-gray-800 border border-gray-600 ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteClick(task.id, task.title)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 hover:bg-red-900 rounded-lg hover:scale-110"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Warning Modal for Task Completion */}
      {warningModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
            }
          }}
        >
          {console.log("Warning modal is being rendered with taskId:", warningModal.taskId)}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500 bg-opacity-20 mb-6">
                <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Mark Task as Completed</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to mark <span className="font-semibold text-white">"{warningModal.taskTitle}"</span> as completed?
                <br />
                <span className="text-yellow-400 text-sm mt-2 block">
                  ⚠️ This task will be automatically removed after 48 hours.
                </span>
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    console.log("Cancel button clicked");
                    setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log("Complete Task button clicked");
                    handleCompleteConfirm();
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                >
                  Complete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpcomingView;


