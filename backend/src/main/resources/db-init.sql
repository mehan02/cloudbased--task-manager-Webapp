-- Database initialization script for Azure SQL Database
-- This script creates the necessary tables for the Task Manager application

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    -- Index for better performance
    CREATE INDEX idx_users_username ON users(username);
    CREATE INDEX idx_users_email ON users(email);
END

-- Create Task Lists table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'task_lists')
BEGIN
    CREATE TABLE task_lists (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        user_id BIGINT NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Index for better performance
    CREATE INDEX idx_task_lists_user_id ON task_lists(user_id);
END

-- Create Tasks table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tasks')
BEGIN
    CREATE TABLE tasks (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(1000),
        completed BIT DEFAULT 0,
        priority NVARCHAR(20) DEFAULT 'MEDIUM',
        due_date DATETIME2,
        user_id BIGINT NOT NULL,
        task_list_id BIGINT,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_list_id) REFERENCES task_lists(id) ON DELETE SET NULL
    );
    
    -- Indexes for better performance
    CREATE INDEX idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX idx_tasks_task_list_id ON tasks(task_list_id);
    CREATE INDEX idx_tasks_completed ON tasks(completed);
    CREATE INDEX idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX idx_tasks_priority ON tasks(priority);
END

-- Insert default admin user (password: admin123)
IF NOT EXISTS (SELECT * FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, email, password) 
    VALUES ('admin', 'admin@taskmanager.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
END

-- Insert sample data for testing
IF NOT EXISTS (SELECT * FROM task_lists WHERE name = 'Default List')
BEGIN
    DECLARE @admin_id BIGINT = (SELECT id FROM users WHERE username = 'admin');
    
    INSERT INTO task_lists (name, description, user_id) 
    VALUES ('Default List', 'Default task list for new users', @admin_id);
    
    DECLARE @list_id BIGINT = SCOPE_IDENTITY();
    
    INSERT INTO tasks (title, description, completed, priority, user_id, task_list_id) 
    VALUES 
        ('Welcome to Task Manager', 'Get familiar with the application features', 0, 'HIGH', @admin_id, @list_id),
        ('Create your first task', 'Add a new task to your list', 0, 'MEDIUM', @admin_id, @list_id),
        ('Mark task as complete', 'Complete this task when you understand the system', 0, 'LOW', @admin_id, @list_id);
END

PRINT 'Database initialization completed successfully!';