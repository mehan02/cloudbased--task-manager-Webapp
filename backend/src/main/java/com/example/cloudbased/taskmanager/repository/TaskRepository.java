package com.example.cloudbased.taskmanager.repository;

import com.example.cloudbased.taskmanager.model.Task;
import com.example.cloudbased.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUser(User user);
    List<Task> findByUserOrderBySortOrderAsc(User user);
    List<Task> findByUserAndDueDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate);
    List<Task> findByUserAndDueDateAfter(User user, LocalDateTime startDate);
    List<Task> findByUserAndTaskListIdOrderBySortOrderAsc(User user, Long listId);
}

