package com.example.cloudbased.taskmanager.repository;

import com.example.cloudbased.taskmanager.model.TaskList;
import com.example.cloudbased.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    List<TaskList> findByUser(User user);
    List<TaskList> findByUserOrderByCreatedAtDesc(User user);
}
