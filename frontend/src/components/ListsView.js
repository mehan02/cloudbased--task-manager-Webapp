import React, { useState, useEffect, useCallback } from "react";
import { listsAPI, tasksAPI } from "../services/api";
import { format, isToday, isTomorrow, isThisWeek, isPast } from "date-fns";

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemTitle, itemType = "list" }) {
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
            {itemType === "list" && (
              <>
                <br />
                <span className="text-yellow-400 text-sm">All tasks in this list will be moved to 'No List'.</span>
              </>
            )}
            {itemType === "task" && (
              <>
                <br />
                <span className="text-red-400 text-sm">This task will be permanently deleted.</span>
              </>
            )}
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

function ListsView() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("MEDIUM");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemTitle: "",
    itemType: "list"
  });

  // Warning modal state for task completion
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: "",
    currentStatus: ""
  });

  // Success confirmation modal state
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    itemName: "",
    onConfirm: null
  });

  const fetchLists = useCallback(async () => {
    try {
      const res = await listsAPI.getAll();
      setLists(res.data);
    } catch (err) {
      console.error("Error fetching lists:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("Authentication error in fetchLists");
      }
    }
  }, []);

  const fetchTasksForList = async (listId) => {
    if (!listId) return;
    try {
      console.log("Fetching tasks for list:", listId);
      setLoading(true);
      setError(null);
      const res = await tasksAPI.getByList(listId);
      console.log("Tasks fetched:", res.data);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks for list:", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (selectedList) {
      fetchTasksForList(selectedList.id);
    }
  }, [selectedList]);

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

  const createList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    // Show confirmation modal
    setSuccessModal({
      isOpen: true,
      title: "Create New List",
      message: "Are you sure you want to create the list",
      itemName: newListName,
      onConfirm: async () => {
        try {
          await listsAPI.create({
            name: newListName,
            color: "#3B82F6", // Default blue color for lists
            description: ""
          });
      setNewListName("");
          setShowCreateForm(false);
      fetchLists();
          
          // Close modal after successful creation
          setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
    } catch (err) {
      console.error("Error creating list:", err);
      setError("Failed to create list");
          // Close modal on error
          setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
        }
      }
    });
  };

  const deleteList = async (listId) => {
    try {
      await listsAPI.delete(listId);
      if (selectedList && selectedList.id === listId) {
        setSelectedList(null);
      }
      fetchLists();
    } catch (err) {
      console.error("Error deleting list:", err);
      setError("Failed to delete list");
    }
  };

  const handleDeleteClick = (itemId, itemTitle, itemType = "list") => {
    setDeleteModal({
      isOpen: true,
      itemId: itemId,
      itemTitle: itemTitle,
      itemType: itemType
    });
  };

  const deleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      if (selectedList) {
        fetchTasksForList(selectedList.id);
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const toggleComplete = async (taskId, currentStatus) => {
    if (currentStatus === 'COMPLETED') {
      // If already completed, just toggle back to pending without warning
      try {
        const newStatus = 'PENDING';
        await tasksAPI.update(taskId, { status: newStatus });
        if (selectedList) {
          fetchTasksForList(selectedList.id);
        }
      } catch (err) {
        console.error("Error updating task:", err);
        setError("Failed to update task");
      }
    } else {
      // Show warning before marking as completed
      setWarningModal({
        isOpen: true,
        taskId: taskId,
        taskTitle: tasks.find(t => t.id === taskId)?.title || "this task",
        currentStatus: currentStatus
      });
    }
  };

  const handleCompleteConfirm = async () => {
    try {
      await tasksAPI.update(warningModal.taskId, { status: 'COMPLETED' });
      if (selectedList) {
        fetchTasksForList(selectedList.id);
      }
      setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" });
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
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
        await tasksAPI.delete(task.id);
      }

      if (tasksToDelete.length > 0 && selectedList) {
        fetchTasksForList(selectedList.id);
      }
    } catch (err) {
      console.error("Error cleaning up completed tasks:", err);
    }
  }, [tasks, selectedList, fetchTasksForList]);

  // Run cleanup every hour
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupCompletedTasks, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(cleanupInterval);
  }, [cleanupCompletedTasks]);

  const handleDeleteConfirm = async () => {
    if (deleteModal.itemId) {
      if (deleteModal.itemType === "list") {
        await deleteList(deleteModal.itemId);
      } else if (deleteModal.itemType === "task") {
        await deleteTask(deleteModal.itemId);
      }
      setDeleteModal({ isOpen: false, itemId: null, itemTitle: "", itemType: "list" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, itemId: null, itemTitle: "", itemType: "list" });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !selectedList) return;

    // Show confirmation modal
    setSuccessModal({
      isOpen: true,
      title: "Add New Task",
      message: "Are you sure you want to add the task",
      itemName: newTask,
      onConfirm: async () => {
        try {
          console.log("Creating task for list:", selectedList.id);
          const taskData = {
            title: newTask,
            description: "",
            priority: selectedPriority,
            taskListId: selectedList.id
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
               }

          console.log("Task data:", taskData);
          const result = await tasksAPI.create(taskData);
          console.log("Task created successfully:", result.data);
          
          setNewTask("");
          setNewTaskDueDate("");
          setSelectedPriority("MEDIUM");
          
          // Refresh the tasks list
          console.log("Refreshing tasks for list:", selectedList.id);
          await fetchTasksForList(selectedList.id);
          
          // Close modal after successful creation
          setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
        } catch (err) {
          console.error("Error adding task:", err);
          setError("Failed to add task");
          // Close modal on error
          setSuccessModal({ isOpen: false, title: "", message: "", itemName: "", onConfirm: null });
        }
      }
    });
  };

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemTitle={deleteModal.itemTitle}
        itemType={deleteModal.itemType}
      />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Task Lists
              </h1>
              
              <p className="text-slate-300 text-xl font-medium mb-6">
                Organize your tasks into lists
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Enhanced Lists Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                                 <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                Lists
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {showCreateForm ? "Cancel" : "+ New"}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={createList} className="mb-6 p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border border-gray-600 shadow-lg">
                <input
                  type="text"
                  placeholder="List name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl text-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Create List
                </button>
            </form>
            )}

            <div className="space-y-3">
              {Array.isArray(lists) && lists.map((list) => (
                  <div
                    key={list.id}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl ${
                    selectedList?.id === list.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white transform scale-105"
                      : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-650 hover:to-gray-750 text-gray-300 hover:text-white"
                  }`}
                  onClick={() => setSelectedList(list)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-5 h-5 rounded-full shadow-lg border-2 border-white/20"
                      style={{ backgroundColor: list.color }}
                    ></div>
                      <span className="font-medium">{list.name}</span>
                  </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                      handleDeleteClick(list.id, list.name, "list");
                        }}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-900 rounded-lg hover:scale-110"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                  </div>
                ))}
              </div>
          </div>
        </div>

        {/* Enhanced Tasks Area */}
        <div className="lg:col-span-3">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
          {selectedList ? (
              <>
                <div className="flex items-center space-x-4 mb-8">
                  <div
                    className="w-8 h-8 rounded-full shadow-lg border-2 border-white/20"
                    style={{ backgroundColor: selectedList.color }}
                  ></div>
                  <h2 className="text-3xl font-bold text-white">{selectedList.name}</h2>
                </div>

                {/* Enhanced Quick Add Bar */}
                <form onSubmit={addTask} className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <input
                    type="text"
                    placeholder="Add a new task..."
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
                    <div className="relative priority-dropdown">
                      <button
                        type="button"
                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
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
                      {showPriorityDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl">
                          <div
                            onClick={() => { setSelectedPriority("LOW"); setShowPriorityDropdown(false); }}
                            className="px-4 py-3 text-green-500 hover:bg-gray-600 cursor-pointer transition-colors rounded-t-xl"
                          >
                            🟢 Low
                          </div>
                          <div
                            onClick={() => { setSelectedPriority("MEDIUM"); setShowPriorityDropdown(false); }}
                            className="px-4 py-3 text-orange-500 hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            🟠 Medium
                          </div>
                          <div
                            onClick={() => { setSelectedPriority("HIGH"); setShowPriorityDropdown(false); }}
                            className="px-4 py-3 text-red-500 hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            🔴 High
                          </div>
                          <div
                            onClick={() => { setSelectedPriority("URGENT"); setShowPriorityDropdown(false); }}
                            className="px-4 py-3 text-red-600 hover:bg-gray-600 cursor-pointer transition-colors rounded-b-xl"
                          >
                            🚨 Urgent
                          </div>
                        </div>
                      )}
                    </div>
                  <button
                    type="submit"
                      className="px-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Add Task
                  </button>
                  </div>
                </form>

                {loading ? (
                  <div className="text-center text-gray-400 py-16">
                    <div className="relative">
                                <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{animationDelay: '0.5s'}}></div>
                    </div>
                    <p className="text-xl font-medium">Loading tasks...</p>
                    <p className="text-sm text-gray-500 mt-2">Preparing your list items</p>
                  </div>
                ) : tasks.length === 0 ? (
                                      <div className="text-center text-gray-400 py-20 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
                      <div className="text-8xl mb-6">📋</div>
                      <h3 className="text-2xl font-bold text-white mb-3">No tasks in this list!</h3>
                      <p className="text-lg mb-4">Create tasks and assign them to this list above.</p>
                      <div className="flex justify-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
                </div>
              ) : (
                  <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                        className={`bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-4 border-l-4 transition-all duration-300 hover:from-gray-650 hover:to-gray-750 shadow-lg hover:shadow-xl ${
                          task.status === 'COMPLETED' ? 'border-green-500 opacity-75' : 
                          task.priority?.toUpperCase() === 'HIGH' ? 'border-red-500' :
                          task.priority?.toUpperCase() === 'MEDIUM' ? 'border-orange-500' :
                          task.priority?.toUpperCase() === 'LOW' ? 'border-green-500' :
                          task.priority?.toUpperCase() === 'URGENT' ? 'border-red-600' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Enhanced Checkbox with Professional Design */}
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleComplete(task.id, task.status);
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                                task.status === 'COMPLETED'
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 shadow-lg'
                                  : 'border-gray-400 hover:border-green-500 hover:shadow-md hover:bg-gray-700'
                              }`}
                              aria-label={task.status === 'COMPLETED' ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {task.status === 'COMPLETED' && (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                              </div>
                            </div>
                        </div>
                        
                          <div className="flex items-center space-x-4">
                            <span className={`text-sm font-medium px-3 py-1 rounded-full bg-gray-800 border border-gray-600 ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          
                            {/* Delete Task Button */}
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteClick(task.id, task.title, "task");
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 rounded-full hover:bg-red-900 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer"
                              aria-label="Delete task"
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
              )}
              </>
            ) : (
              <div className="text-center text-gray-400 py-20 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
                <div className="text-8xl mb-6">📁</div>
                <h3 className="text-2xl font-bold text-white mb-3">Select a list to view tasks</h3>
                <p className="text-lg mb-4">Or create a new list to get started.</p>
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            </div>
          )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
              isOpen={deleteModal.isOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              itemTitle={deleteModal.itemTitle}
              itemType={deleteModal.itemType}
            />

            {/* Warning Modal for Task Completion */}
            {warningModal.isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
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
                        onClick={() => setWarningModal({ isOpen: false, taskId: null, taskTitle: "", currentStatus: "" })}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCompleteConfirm}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                      >
                        Complete Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

export default ListsView;


