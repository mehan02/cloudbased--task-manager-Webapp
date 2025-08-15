package com.example.cloudbased.taskmanager.controller;

import com.example.cloudbased.taskmanager.model.TaskList;
import com.example.cloudbased.taskmanager.model.User;
import com.example.cloudbased.taskmanager.repository.TaskListRepository;
import com.example.cloudbased.taskmanager.repository.UserRepository;
import com.example.cloudbased.taskmanager.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lists")
@CrossOrigin(origins = "*")
public class TaskListController {

    @Autowired
    private TaskListRepository taskListRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User getUserFromToken(String token) {
        String jwt = token.substring(7);
        String username = jwtUtil.extractUsername(jwt);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    @GetMapping
    public ResponseEntity<List<TaskList>> getAllLists(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<TaskList> lists = taskListRepository.findByUserOrderByCreatedAtDesc(user);
        
        // Create clean TaskList objects without circular references
        List<TaskList> cleanLists = lists.stream().map(list -> {
            TaskList cleanList = new TaskList();
            cleanList.setId(list.getId());
            cleanList.setName(list.getName());
            cleanList.setDescription(list.getDescription());
            cleanList.setColor(list.getColor());
            cleanList.setCreatedAt(list.getCreatedAt());
            cleanList.setUpdatedAt(list.getUpdatedAt());
            return cleanList;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(cleanLists);
    }

    @PostMapping
    public ResponseEntity<TaskList> createList(@RequestHeader("Authorization") String token, @RequestBody TaskList taskList) {
        User user = getUserFromToken(token);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        taskList.setUser(user);
        TaskList savedList = taskListRepository.save(taskList);
        
        // Create a clean TaskList object without circular references
        TaskList cleanList = new TaskList();
        cleanList.setId(savedList.getId());
        cleanList.setName(savedList.getName());
        cleanList.setDescription(savedList.getDescription());
        cleanList.setColor(savedList.getColor());
        cleanList.setCreatedAt(savedList.getCreatedAt());
        cleanList.setUpdatedAt(savedList.getUpdatedAt());
        
        return ResponseEntity.ok(cleanList);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskList> updateList(@RequestHeader("Authorization") String token, @PathVariable Long id, @RequestBody Map<String, Object> updates) {
        User user = getUserFromToken(token);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        TaskList taskList = taskListRepository.findById(id).orElseThrow(() -> new RuntimeException("List not found"));
        if (!taskList.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        if (updates.containsKey("name")) {
            taskList.setName((String) updates.get("name"));
        }
        if (updates.containsKey("description")) {
            taskList.setDescription((String) updates.get("description"));
        }
        if (updates.containsKey("color")) {
            taskList.setColor((String) updates.get("color"));
        }

        TaskList savedList = taskListRepository.save(taskList);
        
        // Create a clean TaskList object without circular references
        TaskList cleanList = new TaskList();
        cleanList.setId(savedList.getId());
        cleanList.setName(savedList.getName());
        cleanList.setDescription(savedList.getDescription());
        cleanList.setColor(savedList.getColor());
        cleanList.setCreatedAt(savedList.getCreatedAt());
        cleanList.setUpdatedAt(savedList.getUpdatedAt());
        
        return ResponseEntity.ok(cleanList);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteList(@RequestHeader("Authorization") String token, @PathVariable Long id) {
        User user = getUserFromToken(token);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        TaskList taskList = taskListRepository.findById(id).orElseThrow(() -> new RuntimeException("List not found"));
        if (!taskList.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        taskListRepository.delete(taskList);
        return ResponseEntity.ok().build();
    }
}
