import React, { useState, useEffect } from "react";
import { listsAPI, tasksAPI } from "../services/api";
import { format, isToday, isTomorrow, isThisWeek, isPast } from "date-fns";

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

  const fetchLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listsAPI.getAll();
      setLists(res.data);
      if (res.data.length > 0 && !selectedList) {
        setSelectedList(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
      setError("Failed to load lists");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForList = async (listId) => {
    if (!listId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await tasksAPI.getByList(listId);
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
  }, []);

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

    try {
      await listsAPI.create({
        name: newListName,
        color: "#3B82F6", // Default blue color for lists
        description: ""
      });
      setNewListName("");
      setShowCreateForm(false);
      fetchLists();
    } catch (err) {
      console.error("Error creating list:", err);
      setError("Failed to create list");
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this list? All tasks in it will be moved to 'No List'.")) {
      return;
    }

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

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !selectedList) return;

    try {
      const taskData = {
        title: newTask,
        description: "",
        priority: selectedPriority,
        taskListId: selectedList.id
      };

      if (newTaskDueDate) {
        taskData.dueDate = newTaskDueDate;
      }

      await tasksAPI.create(taskData);
      setNewTask("");
      setNewTaskDueDate("");
      setSelectedPriority("MEDIUM");
      fetchTasksForList(selectedList.id);
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add task");
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Task Lists</h1>
        <p className="text-gray-400">Organize your tasks into different lists</p>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lists Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Lists</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                {showCreateForm ? "Cancel" : "+ New"}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={createList} className="mb-4 p-3 bg-gray-700 rounded-md">
                <input
                  type="text"
                  placeholder="List name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <button
                  type="submit"
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Create List
                </button>
              </form>
            )}

            <div className="space-y-2">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    selectedList?.id === list.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                  onClick={() => setSelectedList(list)}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: list.color }}
                    ></div>
                    <span className="font-medium">{list.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteList(list.id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
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

        {/* Tasks Area */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg p-6">
            {selectedList ? (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: selectedList.color }}
                  ></div>
                  <h2 className="text-2xl font-bold text-white">{selectedList.name}</h2>
                </div>

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
                    <div className="relative priority-dropdown">
                      <button
                        type="button"
                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between"
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
                        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
                          <div
                            onClick={() => { setSelectedPriority("LOW"); setShowPriorityDropdown(false); }}
                            className="px-4 py-2 text-green-500 hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            🟢 Low
                          </div>
                          <div
                            onClick={() => { setSelectedPriority("MEDIUM"); setShowPriorityDropdown(false); }}
                            className="px-4 py-2 text-orange-500 hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            🟠 Medium
                          </div>
                          <div
                            onClick={() => { setSelectedPriority("HIGH"); setShowPriorityDropdown(false); }}
                            className="px-4 py-2 text-red-500 hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            🔴 High
                          </div>
                          <div
                            onClick={() => { setSelectedPriority("URGENT"); setShowPriorityDropdown(false); }}
                            className="px-4 py-2 text-red-600 hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            🚨 Urgent
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200 transform hover:scale-105"
                    >
                      Add Task
                    </button>
                  </div>
                </form>

                {loading ? (
                  <div className="text-center text-gray-400">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <p className="text-xl">No tasks in this list!</p>
                    <p className="text-sm mt-2">Create tasks and assign them to this list.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                                                 className={`bg-gray-700 rounded-lg p-4 border-l-4 transition-all duration-200 hover:bg-gray-650 ${
                           task.status === 'COMPLETED' ? 'border-green-500 opacity-75' : 
                           task.priority?.toUpperCase() === 'HIGH' ? 'border-red-500' :
                           task.priority?.toUpperCase() === 'MEDIUM' ? 'border-orange-500' :
                           task.priority?.toUpperCase() === 'LOW' ? 'border-green-500' :
                           task.priority?.toUpperCase() === 'URGENT' ? 'border-red-600' : 'border-blue-500'
                         }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p className="text-xl">Select a list to view tasks</p>
                <p className="text-sm mt-2">Or create a new list to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListsView;


