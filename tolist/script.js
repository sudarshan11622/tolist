document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const prioritySelect = document.getElementById('priority-select');
    const addTaskBtn = document.getElementById('add-task-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    taskDate.min = today;
    
    // Load tasks from localStorage or initialize empty array
    let tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
    let currentFilter = 'all';
    
    // Initialize the app
    initApp();
    
    // Initialize the application
    function initApp() {
        updateStats();
        renderTasks();
        updateEmptyState();
        setupEventListeners();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Add task button click
        addTaskBtn.addEventListener('click', addTask);
        
        // Enter key in input field
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Clear completed tasks
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // Set current filter
                currentFilter = this.dataset.filter;
                // Re-render tasks
                renderTasks();
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl + / or Cmd + / to focus input
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                taskInput.focus();
            }
            
            // Escape to clear input
            if (e.key === 'Escape') {
                taskInput.value = '';
            }
        });
    }
    
    // Add a new task
    function addTask() {
        const text = taskInput.value.trim();
        const date = taskDate.value;
        const priority = prioritySelect.value;
        
        // Validate input
        if (text === '') {
            showAlert('Please enter a task description!', 'warning');
            taskInput.focus();
            return;
        }
        
        // Create task object
        const task = {
            id: Date.now(),
            text: text,
            date: date,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Add task to beginning of array
        tasks.unshift(task);
        
        // Update UI and storage
        saveTasks();
        renderTasks();
        updateStats();
        updateEmptyState();
        
        // Reset form
        taskInput.value = '';
        taskDate.value = '';
        prioritySelect.value = 'medium';
        taskInput.focus();
        
        // Show success message
        showAlert('Task added successfully!', 'success');
    }
    
    // Render tasks based on current filter
    function renderTasks() {
        // Clear the list
        todoList.innerHTML = '';
        
        // Get filtered tasks
        const filteredTasks = getFilteredTasks();
        
        // If no tasks, show empty state
        if (filteredTasks.length === 0) {
            updateEmptyState();
            return;
        }
        
        // Create task elements
        filteredTasks.forEach(task => {
            const todoItem = createTaskElement(task);
            todoList.appendChild(todoItem);
        });
        
        // Hide empty state
        emptyState.style.display = 'none';
    }
    
    // Create a task element
    function createTaskElement(task) {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${task.priority} ${task.completed ? 'completed' : ''}`;
        todoItem.dataset.id = task.id;
        
        // Check if task is overdue
        const isOverdue = task.date && !task.completed && task.date < today;
        
        // Priority label text
        const priorityText = {
            'high': 'High Priority',
            'medium': 'Medium Priority',
            'low': 'Low Priority'
        }[task.priority];
        
        todoItem.innerHTML = `
            <div class="checkbox-container">
                <input type="checkbox" class="checkbox" id="check-${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </div>
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    ${task.date ? `
                        <span class="task-date ${isOverdue ? 'overdue' : ''}">
                            <i class="far fa-calendar"></i> ${formatDate(task.date)}
                            ${isOverdue ? '<i class="fas fa-exclamation-circle"></i>' : ''}
                        </span>
                    ` : ''}
                    <span class="priority-badge ${task.priority}">
                        <i class="fas fa-flag"></i> ${priorityText}
                    </span>
                </div>
            </div>
            <button class="delete-btn" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Add event listeners
        const checkbox = todoItem.querySelector('.checkbox');
        const deleteBtn = todoItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return todoItem;
    }
    
    // Toggle task completion status
    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            updateStats();
            showAlert(`Task marked as ${task.completed ? 'completed' : 'pending'}!`, 'info');
        }
    }
    
    // Delete a task
    function deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            updateEmptyState();
            showAlert('Task deleted!', 'danger');
        }
    }
    
    // Clear all completed tasks
    function clearCompletedTasks() {
        const completedCount = tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            showAlert('No completed tasks to clear!', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateStats();
            updateEmptyState();
            showAlert('Completed tasks cleared!', 'success');
        }
    }
    
    // Get filtered tasks based on current filter
    function getFilteredTasks() {
        switch (currentFilter) {
            case 'pending':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            case 'high':
                return tasks.filter(task => task.priority === 'high');
            default:
                return tasks;
        }
    }
    
    // Update statistics
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksEl.textContent = `Total: ${total}`;
        pendingTasksEl.textContent = `Pending: ${pending}`;
        completedTasksEl.textContent = `Completed: ${completed}`;
    }
    
    // Update empty state visibility
    function updateEmptyState() {
        const filteredTasks = getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'flex';
            todoList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            todoList.style.display = 'flex';
        }
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }
    
    // Show alert message
    function showAlert(message, type) {
        // Remove any existing alert
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) existingAlert.remove();
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button class="alert-close">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(alert);
        
        // Add styles for alert
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : 
                        type === 'warning' ? '#f39c12' : 
                        type === 'danger' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        // Close button style
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            margin-left: 20px;
        `;
        
        // Add close event
        closeBtn.addEventListener('click', () => alert.remove());
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 3000);
        
        // Add CSS for animations
        if (!document.querySelector('#alert-styles')) {
            const style = document.createElement('style');
            style.id = 'alert-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});