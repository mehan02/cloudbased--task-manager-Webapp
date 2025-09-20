package com.example.cloudbased.taskmanager.controller;

import com.example.cloudbased.taskmanager.model.Task;
import com.example.cloudbased.taskmanager.model.TaskList;
import com.example.cloudbased.taskmanager.model.User;
import com.example.cloudbased.taskmanager.repository.TaskListRepository;
import com.example.cloudbased.taskmanager.repository.TaskRepository;
import com.example.cloudbased.taskmanager.repository.UserRepository;
import com.example.cloudbased.taskmanager.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "${frontend.url}")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskListRepository taskListRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User getUserFromToken(String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        List<Task> tasks = taskRepository.findByUserOrderBySortOrderAsc(user);
        
        // Create clean task objects without circular references
        List<Task> cleanTasks = tasks.stream().map(task -> {
            Task cleanTask = new Task();
            cleanTask.setId(task.getId());
            cleanTask.setTitle(task.getTitle());
            cleanTask.setDescription(task.getDescription());
            cleanTask.setStatus(task.getStatus());
            cleanTask.setPriority(task.getPriority());
            cleanTask.setCreatedAt(task.getCreatedAt());
            cleanTask.setCompletedAt(task.getCompletedAt());
            cleanTask.setDueDate(task.getDueDate());
            cleanTask.setSortOrder(task.getSortOrder());
            return cleanTask;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(cleanTasks);
    }
    
    @GetMapping("/list/{listId}")
    public ResponseEntity<List<Task>> getTasksByList(@RequestHeader("Authorization") String token, @PathVariable Long listId) {
        User user = getUserFromToken(token);
        List<Task> tasks = taskRepository.findByUserAndTaskListIdOrderBySortOrderAsc(user, listId);
        
        // Create clean task objects without circular references
        List<Task> cleanTasks = tasks.stream().map(task -> {
            Task cleanTask = new Task();
            cleanTask.setId(task.getId());
            cleanTask.setTitle(task.getTitle());
            cleanTask.setDescription(task.getDescription());
            cleanTask.setStatus(task.getStatus());
            cleanTask.setPriority(task.getPriority());
            cleanTask.setCreatedAt(task.getCreatedAt());
            cleanTask.setCompletedAt(task.getCompletedAt());
            cleanTask.setDueDate(task.getDueDate());
            cleanTask.setSortOrder(task.getSortOrder());
            return cleanTask;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(cleanTasks);
    }

    @GetMapping("/today")
    public ResponseEntity<List<Task>> getTodayTasks(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime todayEnd = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        System.out.println("Today filter - Start: " + todayStart + ", End: " + todayEnd);
        List<Task> tasks = taskRepository.findByUserAndDueDateBetween(user, todayStart, todayEnd);
        System.out.println("Found " + tasks.size() + " tasks for today");
        for (Task task : tasks) {
            System.out.println("Today task: " + task.getTitle() + " - Due: " + task.getDueDate());
        }
        
        // Create clean task objects without circular references
        List<Task> cleanTasks = tasks.stream().map(task -> {
            Task cleanTask = new Task();
            cleanTask.setId(task.getId());
            cleanTask.setTitle(task.getTitle());
            cleanTask.setDescription(task.getDescription());
            cleanTask.setStatus(task.getStatus());
            cleanTask.setPriority(task.getPriority());
            cleanTask.setCreatedAt(task.getCreatedAt());
            cleanTask.setCompletedAt(task.getCompletedAt());
            cleanTask.setDueDate(task.getDueDate());
            cleanTask.setSortOrder(task.getSortOrder());
            return cleanTask;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(cleanTasks);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Task>> getUpcomingTasks(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime tomorrowStart = today.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        // Remove the end date limit - include ALL future tasks
        System.out.println("Upcoming filter - Start: " + tomorrowStart + ", End: No limit (all future tasks)");
        List<Task> tasks = taskRepository.findByUserAndDueDateAfter(user, tomorrowStart);
        System.out.println("Found " + tasks.size() + " tasks for upcoming");
        for (Task task : tasks) {
            System.out.println("Upcoming task: " + task.getTitle() + " - Due: " + task.getDueDate());
        }
        
        // Create clean task objects without circular references
        List<Task> cleanTasks = tasks.stream().map(task -> {
            Task cleanTask = new Task();
            cleanTask.setId(task.getId());
            cleanTask.setTitle(task.getTitle());
            cleanTask.setDescription(task.getDescription());
            cleanTask.setStatus(task.getStatus());
            cleanTask.setPriority(task.getPriority());
            cleanTask.setCreatedAt(task.getCreatedAt());
            cleanTask.setCompletedAt(task.getCompletedAt());
            cleanTask.setDueDate(task.getDueDate());
            cleanTask.setSortOrder(task.getSortOrder());
            return cleanTask;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(cleanTasks);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestHeader("Authorization") String token, @RequestBody Map<String, Object> taskData) {
        User user = getUserFromToken(token);
        
        Task task = new Task();
        task.setUser(user);
        
        // Set basic fields
        if (taskData.containsKey("title")) {
            task.setTitle((String) taskData.get("title"));
        }
        if (taskData.containsKey("description")) {
            task.setDescription((String) taskData.get("description"));
        }
        if (taskData.containsKey("priority")) {
            task.setPriority(Task.TaskPriority.valueOf((String) taskData.get("priority")));
        }
        
        // Handle taskListId
        if (taskData.containsKey("taskListId")) {
            Long listId = Long.valueOf(taskData.get("taskListId").toString());
            TaskList taskList = taskListRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("TaskList not found"));
            task.setTaskList(taskList);
        }
        
        // Handle due date
        if (taskData.containsKey("dueDate")) {
            String dueDateStr = (String) taskData.get("dueDate");
            try {
                // Parse ISO string format with timezone handling
                LocalDateTime parsedDate;
                if (dueDateStr.endsWith("Z")) {
                    // Handle UTC timezone (Z suffix)
                    parsedDate = java.time.ZonedDateTime.parse(dueDateStr).toLocalDateTime();
                } else {
                    // Handle local datetime without timezone
                    parsedDate = LocalDateTime.parse(dueDateStr);
                }
                System.out.println("Parsed due date: " + parsedDate + " for task: " + taskData.get("title"));
                task.setDueDate(parsedDate);
            } catch (Exception e) {
                System.out.println("Error parsing due date: " + dueDateStr + " - " + e.getMessage());
                // If parsing fails, set to today's end of day
                task.setDueDate(LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999));
            }
        } else {
            // Set default due date to today if not provided
            task.setDueDate(LocalDateTime.now().withHour(18).withMinute(0).withSecond(0).withNano(0));
        }
        
        // Set default sort order if not provided
        List<Task> userTasks = taskRepository.findByUser(user);
        task.setSortOrder(userTasks.size());
        
        Task savedTask = taskRepository.save(task);
        
        // Create a clean task object without circular references
        Task cleanTask = new Task();
        cleanTask.setId(savedTask.getId());
        cleanTask.setTitle(savedTask.getTitle());
        cleanTask.setDescription(savedTask.getDescription());
        cleanTask.setStatus(savedTask.getStatus());
        cleanTask.setPriority(savedTask.getPriority());
        cleanTask.setCreatedAt(savedTask.getCreatedAt());
        cleanTask.setCompletedAt(savedTask.getCompletedAt());
        cleanTask.setDueDate(savedTask.getDueDate());
        cleanTask.setSortOrder(savedTask.getSortOrder());
        
        return ResponseEntity.ok(cleanTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@RequestHeader("Authorization") String token, @PathVariable Long id, @RequestBody Map<String, Object> updates) {
        User user = getUserFromToken(token);
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        // Update fields if they are provided in the request
        if (updates.containsKey("title")) {
            task.setTitle((String) updates.get("title"));
        }
        if (updates.containsKey("description")) {
            task.setDescription((String) updates.get("description"));
        }
        if (updates.containsKey("status")) {
            Task.TaskStatus newStatus = Task.TaskStatus.valueOf((String) updates.get("status"));
            task.setStatus(newStatus);
            
            // Set completedAt timestamp when task is completed or cleared
            if (newStatus == Task.TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (newStatus == Task.TaskStatus.PENDING) {
                task.setCompletedAt(null); // Clear completedAt when task is marked as pending
            }
        }
        if (updates.containsKey("priority")) {
            task.setPriority(Task.TaskPriority.valueOf((String) updates.get("priority")));
        }
        
        Task savedTask = taskRepository.save(task);
        
        // Create a clean task object without circular references
        Task cleanTask = new Task();
        cleanTask.setId(savedTask.getId());
        cleanTask.setTitle(savedTask.getTitle());
        cleanTask.setDescription(savedTask.getDescription());
        cleanTask.setStatus(savedTask.getStatus());
        cleanTask.setPriority(savedTask.getPriority());
        cleanTask.setCreatedAt(savedTask.getCreatedAt());
        cleanTask.setCompletedAt(savedTask.getCompletedAt());
        cleanTask.setDueDate(savedTask.getDueDate());
        cleanTask.setSortOrder(savedTask.getSortOrder());
        
        return ResponseEntity.ok(cleanTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@RequestHeader("Authorization") String token, @PathVariable Long id) {
        User user = getUserFromToken(token);
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        taskRepository.delete(task);
        return ResponseEntity.ok("Task deleted");
    }
    
    @PutMapping("/reorder")
    public ResponseEntity<List<Task>> reorderTasks(@RequestHeader("Authorization") String token, @RequestBody List<Map<String, Object>> taskOrders) {
        User user = getUserFromToken(token);
        
        for (Map<String, Object> taskOrder : taskOrders) {
            Long taskId = Long.valueOf(taskOrder.get("id").toString());
            Integer newOrder = Integer.valueOf(taskOrder.get("sortOrder").toString());
            
            Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));
            if (!task.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).build();
            }
            
            task.setSortOrder(newOrder);
            taskRepository.save(task);
        }
        
        List<Task> tasks = taskRepository.findByUserOrderBySortOrderAsc(user);
        
        // Create clean task objects without circular references
        List<Task> cleanTasks = tasks.stream().map(task -> {
            Task cleanTask = new Task();
            cleanTask.setId(task.getId());
            cleanTask.setTitle(task.getTitle());
            cleanTask.setDescription(task.getDescription());
            cleanTask.setStatus(task.getStatus());
            cleanTask.setPriority(task.getPriority());
            cleanTask.setCreatedAt(task.getCreatedAt());
            cleanTask.setCompletedAt(task.getCompletedAt());
            cleanTask.setDueDate(task.getDueDate());
            cleanTask.setSortOrder(task.getSortOrder());
            return cleanTask;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(cleanTasks);
    }
}

