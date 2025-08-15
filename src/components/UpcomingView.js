import React, { useState, useEffect } from "react";
import api from "../services/api";

function UpcomingView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchUpcomingTasks = async () => {
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
  };

  useEffect(() => {
    fetchUpcomingTasks();
  }, []);

  const toggleComplete = async (taskId, completed) => {
    try {
      await api.patch(`/tasks/${taskId}`, { completed: !completed });
      fetchUpcomingTasks();
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchUpcomingTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-orange-500";
      case "low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getPriorityText = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upcoming Tasks</h1>
        <p className="text-gray-400">Next 7 days overview</p>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Loading upcoming tasks...</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-xl">No upcoming tasks!</p>
          <p className="text-sm mt-2">Tasks with due dates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {formatDate(date)}
              </h2>
              
              <div className="space-y-3">
                {groupedTasks[date]
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`bg-gray-700 rounded-lg p-4 border-l-4 transition-all duration-200 hover:bg-gray-650 ${
                        task.completed ? 'border-green-500 opacity-75' : 
                        task.priority === 'high' ? 'border-red-500' :
                        task.priority === 'medium' ? 'border-orange-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <button
                            onClick={() => toggleComplete(task.id, task.completed)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              task.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-400 hover:border-green-500'
                            }`}
                          >
                            {task.completed && (
                              <svg className="w-4 h-4 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <h3 className={`text-lg font-medium transition-all duration-200 ${
                              task.completed ? 'text-gray-500 line-through' : 'text-white'
                            }`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className={`text-sm mt-1 ${
                                task.completed ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                          
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-900 rounded"
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
    </div>
  );
}

export default UpcomingView;


