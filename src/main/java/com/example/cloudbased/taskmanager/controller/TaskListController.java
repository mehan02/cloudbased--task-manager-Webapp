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
        return ResponseEntity.ok(taskListRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @PostMapping
    public ResponseEntity<TaskList> createList(@RequestHeader("Authorization") String token, @RequestBody TaskList taskList) {
        User user = getUserFromToken(token);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        taskList.setUser(user);
        return ResponseEntity.ok(taskListRepository.save(taskList));
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

        return ResponseEntity.ok(taskListRepository.save(taskList));
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
