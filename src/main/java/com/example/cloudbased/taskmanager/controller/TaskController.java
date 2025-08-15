package com.example.cloudbased.taskmanager.controller;

import com.example.cloudbased.taskmanager.model.Task;
import com.example.cloudbased.taskmanager.model.User;
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
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "${frontend.url}")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

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
        return ResponseEntity.ok(taskRepository.findByUserOrderBySortOrderAsc(user));
    }
    
    @GetMapping("/list/{listId}")
    public ResponseEntity<List<Task>> getTasksByList(@RequestHeader("Authorization") String token, @PathVariable Long listId) {
        User user = getUserFromToken(token);
        return ResponseEntity.ok(taskRepository.findByUserAndTaskListIdOrderBySortOrderAsc(user, listId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Task>> getTodayTasks(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(taskRepository.findByUserAndDueDateBetween(
            user, 
            today.atStartOfDay(), 
            today.atTime(23, 59, 59)
        ));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Task>> getUpcomingTasks(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        return ResponseEntity.ok(taskRepository.findByUserAndDueDateBetween(
            user, 
            today.plusDays(1).atStartOfDay(), 
            nextWeek.atTime(23, 59, 59)
        ));
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestHeader("Authorization") String token, @RequestBody Task task) {
        User user = getUserFromToken(token);
        task.setUser(user);
        
        // Set default due date to today if not provided
        if (task.getDueDate() == null) {
            task.setDueDate(LocalDateTime.now().withHour(18).withMinute(0).withSecond(0).withNano(0));
        }
        
        // Set default sort order if not provided
        if (task.getSortOrder() == null) {
            List<Task> userTasks = taskRepository.findByUser(user);
            task.setSortOrder(userTasks.size());
        }
        
        return ResponseEntity.ok(taskRepository.save(task));
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
            task.setStatus(Task.TaskStatus.valueOf((String) updates.get("status")));
        }
        if (updates.containsKey("priority")) {
            task.setPriority(Task.TaskPriority.valueOf((String) updates.get("priority")));
        }
        
        return ResponseEntity.ok(taskRepository.save(task));
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
        
        return ResponseEntity.ok(taskRepository.findByUserOrderBySortOrderAsc(user));
    }
}

