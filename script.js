"use strict";

// Sample Tasks
const defaultTasks = [
    {
        id: 1,
        title: "Design Dashboard UI",
        description: "Create a modern task management dashboard.",
        category: "Design",
        priority: "high",
        status: "todo",
        dueDate: "",
        createdAt: "2026-11-01T09:00:00.000Z"
    },
    {
        id: 2,
        title: "Build Navigation Sidebar",
        description: "Develop a responsive sidebar using CSS.",
        category: "Development",
        priority: "medium",
        status: "todo",
        dueDate: "",
        createdAt: "2026-11-02T09:00:00.000Z"
    },
    {
        id: 3,
        title: "Implement Task Management",
        description: "Create task management functionality.",
        category: "Development",
        priority: "high",
        status: "progress",
        dueDate: "",
        createdAt: "2026-11-03T09:00:00.000Z"
    },
    {
        id: 4,
        title: "Project Setup",
        description: "Initialize project files and GitHub repository.",
        category: "Development",
        priority: "low",
        status: "completed",
        dueDate: "",
        createdAt: "2026-11-04T09:00:00.000Z"
    }
];

// Storage Keys
const STORAGE_KEY = "taskflow_tasks";
const THEME_STORAGE_KEY = "taskflow_theme";

// Import Configuration
const MAX_IMPORT_SIZE = 5 * 1024 * 1024;
const MAX_IMPORT_TASKS = 10000;

const VALID_CATEGORIES = [
    "Development",
    "Design",
    "Personal",
    "Other"
];

const VALID_PRIORITIES = [
    "low",
    "medium",
    "high"
];

const VALID_STATUSES = [
    "todo",
    "progress",
    "completed"
];

// Load Tasks
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks === null) {
            return defaultTasks.map((task) => ({ ...task }));
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            throw new Error("Invalid task data");
        }

        // Support tasks saved in previous steps
        return parsedTasks.map((task, index) => ({
            ...task,
            createdAt: task.createdAt ||
                new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString()
        }));

    } catch (error) {
        console.error("Unable to load saved tasks:", error);

        return defaultTasks.map((task) => ({ ...task }));
    }
}

let tasks = loadTasks();

// Save Tasks
function saveTasksToStorage(taskList = tasks) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(taskList)
        );

        return true;

    } catch (error) {
        console.error("Unable to save tasks:", error);

        showToast(
            "Unable to save tasks. Browser storage may be full.",
            "error"
        );

        return false;
    }
}

// DOM Elements
const todoTasks = document.getElementById("todoTasks");
const inProgressTasks = document.getElementById("inProgressTasks");
const completedTasksList = document.getElementById("completedTasksList");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const taskForm = document.getElementById("taskForm");

const modalTitle = document.getElementById("modalTitle");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const editingTaskId = document.getElementById("editingTaskId");

const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskCategoryInput = document.getElementById("taskCategory");
const taskPriorityInput = document.getElementById("taskPriority");
const taskDueDateInput = document.getElementById("taskDueDate");
const taskStatusInput = document.getElementById("taskStatus");

const taskColumns = document.querySelectorAll(".task-column");

// Search and Filter Elements
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchResults = document.getElementById("searchResults");
const searchResultText = document.getElementById("searchResultText");
const emptySearch = document.getElementById("emptySearch");

const categoryFilter = document.getElementById("categoryFilter");
const priorityFilter = document.getElementById("priorityFilter");
const deadlineFilter = document.getElementById("deadlineFilter");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const sortTasksSelect = document.getElementById("sortTasks");

// Analytics Elements
const completionPercentage = document.getElementById("completionPercentage");
const completionProgress = document.getElementById("completionProgress");
const completionProgressBar = document.getElementById("completionProgressBar");
const completionDetail = document.getElementById("completionDetail");
const productivityMessage = document.getElementById("productivityMessage");

const statusDonut = document.getElementById("statusDonut");
const donutTotal = document.getElementById("donutTotal");

const chartTodoCount = document.getElementById("chartTodoCount");
const chartProgressCount = document.getElementById("chartProgressCount");
const chartCompletedCount = document.getElementById("chartCompletedCount");

const highPriorityCount = document.getElementById("highPriorityCount");
const mediumPriorityCount = document.getElementById("mediumPriorityCount");
const lowPriorityCount = document.getElementById("lowPriorityCount");

const highPriorityBar = document.getElementById("highPriorityBar");
const mediumPriorityBar = document.getElementById("mediumPriorityBar");
const lowPriorityBar = document.getElementById("lowPriorityBar");

// Theme Elements
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

// Data Management Elements - Step 14
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const importFileInput = document.getElementById("importFileInput");

const importModal = document.getElementById("importModal");
const closeImportModalBtn = document.getElementById("closeImportModal");
const cancelImportBtn = document.getElementById("cancelImportBtn");
const confirmImportBtn = document.getElementById("confirmImportBtn");
const importSummaryText = document.getElementById("importSummaryText");

const toastContainer = document.getElementById("toastContainer");

// Application State
let draggedTaskId = null;
let searchQuery = "";
let selectedCategory = "all";
let selectedPriority = "all";
let selectedDeadline = "all";
let selectedSort = "newest";

let pendingImportedTasks = null;

// Toast Notifications - Step 14
function showToast(message, type = "info") {
    const icons = {
        success: "✓",
        error: "⚠",
        info: "ℹ"
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.textContent = icons[type] || icons.info;

    const messageElement = document.createElement("p");
    messageElement.className = "toast-message";
    messageElement.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.textContent = "×";

    closeButton.setAttribute(
        "aria-label",
        "Dismiss notification"
    );

    const timeoutId = setTimeout(() => {
        toast.remove();
    }, 4000);

    closeButton.addEventListener("click", () => {
        clearTimeout(timeoutId);
        toast.remove();
    });

    toast.append(
        icon,
        messageElement,
        closeButton
    );

    toastContainer.appendChild(toast);
}

// Theme Functions
function getCurrentTheme() {
    return document.documentElement.dataset.theme === "dark"
        ? "dark"
        : "light";
}

function updateThemeButton() {
    const currentTheme = getCurrentTheme();
    const isDark = currentTheme === "dark";

    themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeText.textContent = isDark ? "Light Mode" : "Dark Mode";

    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    themeToggle.setAttribute(
        "aria-pressed",
        String(isDark)
    );

    themeToggle.title = isDark
        ? "Switch to light mode"
        : "Switch to dark mode";
}

function setTheme(theme) {
    const validTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = validTheme;

    try {
        localStorage.setItem(
            THEME_STORAGE_KEY,
            validTheme
        );

    } catch (error) {
        console.error("Unable to save theme:", error);
    }

    updateThemeButton();
}

function toggleTheme() {
    const nextTheme = getCurrentTheme() === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);
}

// Date Utilities
function getDaysUntilDue(dueDate) {
    if (!dueDate) {
        return null;
    }

    const [year, month, day] = dueDate.split("-").map(Number);

    const dueUTC = Date.UTC(year, month - 1, day);
    const today = new Date();

    const todayUTC = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    return Math.round((dueUTC - todayUTC) / 86400000);
}

// Get Local Date String
function getLocalDateString() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Deadline Status
function getDeadlineStatus(task) {
    if (task.status === "completed") {
        return "completed";
    }

    if (!task.dueDate) {
        return "no-date";
    }

    const daysLeft = getDaysUntilDue(task.dueDate);

    if (daysLeft < 0) {
        return "overdue";
    }

    if (daysLeft === 0) {
        return "today";
    }

    return "upcoming";
}

// Deadline Text
function getDeadlineText(task) {
    const status = getDeadlineStatus(task);

    if (status === "completed") {
        return "✓ Completed";
    }

    if (status === "no-date") {
        return "";
    }

    const daysLeft = getDaysUntilDue(task.dueDate);

    if (status === "overdue") {
        const days = Math.abs(daysLeft);

        return `⚠ Overdue by ${days} ${days === 1 ? "day" : "days"}`;
    }

    if (status === "today") {
        return "⏰ Due Today";
    }

    if (daysLeft === 1) {
        return "📅 Due Tomorrow";
    }

    return `📅 Due in ${daysLeft} days`;
}

// Create Task Card
function createTaskCard(task) {
    const card = document.createElement("div");

    card.className = "task-card";
    card.dataset.id = task.id;
    card.draggable = true;

    const deadlineStatus = getDeadlineStatus(task);

    if (deadlineStatus === "overdue") {
        card.classList.add("is-overdue");

    } else if (deadlineStatus === "today") {
        card.classList.add("is-due-today");

    } else if (deadlineStatus === "completed") {
        card.classList.add("is-completed");
    }

    const title = document.createElement("h3");
    title.textContent = task.title;

    const description = document.createElement("p");
    description.textContent = task.description;

    const footer = document.createElement("div");
    footer.className = "task-card-footer";

    const category = document.createElement("span");
    category.className = "task-category";
    category.textContent = task.category;

    const priority = document.createElement("span");
    priority.className = `task-priority priority-${task.priority}`;
    priority.textContent = task.priority.toUpperCase();

    footer.append(category, priority);
    card.append(title, description, footer);

    // Deadline Indicator
    if (task.dueDate || task.status === "completed") {
        const deadline = document.createElement("div");

        deadline.className = `task-deadline deadline-${deadlineStatus}`;
        deadline.textContent = getDeadlineText(task);

        if (task.dueDate) {
            deadline.title = `Due date: ${task.dueDate}`;
        }

        card.appendChild(deadline);
    }

    // Task Action Buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");

    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.draggable = false;

    editBtn.addEventListener("click", () => {
        openEditTaskModal(task.id);
    });

    const deleteBtn = document.createElement("button");

    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.draggable = false;

    deleteBtn.addEventListener("click", () => {
        deleteTask(task.id);
    });

    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);

    // Drag Start
    card.addEventListener("dragstart", (event) => {
        draggedTaskId = task.id;

        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
            "text/plain",
            String(task.id)
        );

        requestAnimationFrame(() => {
            card.classList.add("dragging");
        });
    });

    // Drag End
    card.addEventListener("dragend", () => {
        draggedTaskId = null;

        card.classList.remove("dragging");

        taskColumns.forEach((column) => {
            column.classList.remove("drag-over");
        });
    });

    return card;
}

// Filter Tasks
function getFilteredTasks() {
    return tasks.filter((task) => {
        const searchableText = [
            task.title,
            task.description,
            task.category,
            task.priority,
            task.status
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(searchQuery);

        const matchesCategory =
            selectedCategory === "all" ||
            task.category === selectedCategory;

        const matchesPriority =
            selectedPriority === "all" ||
            task.priority === selectedPriority;

        const matchesDeadline =
            selectedDeadline === "all" ||
            getDeadlineStatus(task) === selectedDeadline;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesPriority &&
            matchesDeadline
        );
    });
}

// Sort Tasks
function sortTasks(taskList) {
    const priorityRank = {
        high: 3,
        medium: 2,
        low: 1
    };

    return [...taskList].sort((a, b) => {
        switch (selectedSort) {

            case "newest":
                return Date.parse(b.createdAt) - Date.parse(a.createdAt);

            case "oldest":
                return Date.parse(a.createdAt) - Date.parse(b.createdAt);

            case "priority-high":
                return priorityRank[b.priority] - priorityRank[a.priority];

            case "priority-low":
                return priorityRank[a.priority] - priorityRank[b.priority];

            case "due-asc":
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                return a.dueDate.localeCompare(b.dueDate);

            case "due-desc":
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                return b.dueDate.localeCompare(a.dueDate);

            case "title-asc":
                return a.title.localeCompare(b.title);

            case "title-desc":
                return b.title.localeCompare(a.title);

            default:
                return 0;
        }
    });
}

// Render Tasks
function renderTasks() {
    todoTasks.innerHTML = "";
    inProgressTasks.innerHTML = "";
    completedTasksList.innerHTML = "";

    const filteredTasks = getFilteredTasks();
    const sortedTasks = sortTasks(filteredTasks);

    sortedTasks.forEach((task) => {
        const card = createTaskCard(task);

        if (task.status === "todo") {
            todoTasks.appendChild(card);

        } else if (task.status === "progress") {
            inProgressTasks.appendChild(card);

        } else if (task.status === "completed") {
            completedTasksList.appendChild(card);
        }
    });

    updateTaskCounts(filteredTasks);
    updateFilterResults(filteredTasks.length);
    updateAnalytics();
}

// Update Task Counters
function updateTaskCounts(filteredTasks) {
    const progress = tasks.filter(
        (task) => task.status === "progress"
    ).length;

    const completed = tasks.filter(
        (task) => task.status === "completed"
    ).length;

    const overdue = tasks.filter(
        (task) => getDeadlineStatus(task) === "overdue"
    ).length;

    const dueToday = tasks.filter(
        (task) => getDeadlineStatus(task) === "today"
    ).length;

    document.getElementById("totalTasks").textContent =
        tasks.length;

    document.getElementById("progressTasks").textContent =
        progress;

    document.getElementById("completedTasks").textContent =
        completed;

    document.getElementById("overdueTasks").textContent =
        overdue;

    document.getElementById("dueTodayTasks").textContent =
        dueToday;

    document.getElementById("todoCount").textContent =
        filteredTasks.filter(
            (task) => task.status === "todo"
        ).length;

    document.getElementById("progressCount").textContent =
        filteredTasks.filter(
            (task) => task.status === "progress"
        ).length;

    document.getElementById("completedCount").textContent =
        filteredTasks.filter(
            (task) => task.status === "completed"
        ).length;
}

// Update Filter Results
function updateFilterResults(resultCount) {
    const isFiltering =
        searchQuery !== "" ||
        selectedCategory !== "all" ||
        selectedPriority !== "all" ||
        selectedDeadline !== "all";

    searchResults.hidden = !isFiltering;

    emptySearch.hidden =
        !isFiltering || resultCount > 0;

    clearSearchBtn.hidden =
        searchInput.value.length === 0;

    if (isFiltering) {
        const taskWord = resultCount === 1
            ? "task"
            : "tasks";

        searchResultText.textContent =
            `${resultCount} ${taskWord} match your search and filters.`;
    }
}

// Calculate Analytics
function calculateAnalytics() {
    const total = tasks.length;

    const todo = tasks.filter(
        (task) => task.status === "todo"
    ).length;

    const progress = tasks.filter(
        (task) => task.status === "progress"
    ).length;

    const completed = tasks.filter(
        (task) => task.status === "completed"
    ).length;

    const high = tasks.filter(
        (task) => task.priority === "high"
    ).length;

    const medium = tasks.filter(
        (task) => task.priority === "medium"
    ).length;

    const low = tasks.filter(
        (task) => task.priority === "low"
    ).length;

    const completionRate = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return {
        total,
        todo,
        progress,
        completed,
        high,
        medium,
        low,
        completionRate
    };
}

// Update Analytics Dashboard
function updateAnalytics() {
    const analytics = calculateAnalytics();

    // Completion Percentage
    completionPercentage.textContent =
        `${analytics.completionRate}%`;

    completionProgressBar.style.width =
        `${analytics.completionRate}%`;

    completionProgress.setAttribute(
        "aria-valuenow",
        String(analytics.completionRate)
    );

    completionDetail.textContent =
        `${analytics.completed} of ${analytics.total} tasks completed`;

    // Productivity Message
    if (analytics.total === 0) {
        productivityMessage.textContent =
            "Add tasks to start tracking your progress.";

    } else if (analytics.completionRate === 100) {
        productivityMessage.textContent =
            "Excellent! You have completed all your tasks.";

    } else if (analytics.completionRate >= 75) {
        productivityMessage.textContent =
            "Great progress! You are close to finishing your tasks.";

    } else if (analytics.completionRate >= 50) {
        productivityMessage.textContent =
            "Good work! You have completed at least half your tasks.";

    } else {
        productivityMessage.textContent =
            "Keep going! Complete more tasks to improve your progress.";
    }

    // Task Status Counts
    donutTotal.textContent = analytics.total;
    chartTodoCount.textContent = analytics.todo;
    chartProgressCount.textContent = analytics.progress;
    chartCompletedCount.textContent = analytics.completed;

    // Doughnut Chart
    if (analytics.total === 0) {
        statusDonut.style.background =
            "var(--chart-empty)";

        statusDonut.setAttribute(
            "aria-label",
            "No tasks available"
        );

    } else {
        const todoPercentage =
            (analytics.todo / analytics.total) * 100;

        const progressPercentage =
            (analytics.progress / analytics.total) * 100;

        const todoEnd = todoPercentage;

        const progressEnd =
            todoPercentage + progressPercentage;

        statusDonut.style.background = `conic-gradient(
            #ffae43 0% ${todoEnd}%,
            #695cf5 ${todoEnd}% ${progressEnd}%,
            #28ba85 ${progressEnd}% 100%
        )`;

        statusDonut.setAttribute(
            "aria-label",
            `${analytics.todo} to do, ` +
            `${analytics.progress} in progress, ` +
            `${analytics.completed} completed`
        );
    }

    // Priority Counts
    highPriorityCount.textContent = analytics.high;
    mediumPriorityCount.textContent = analytics.medium;
    lowPriorityCount.textContent = analytics.low;

    // Priority Progress Bars
    const highPercentage = analytics.total === 0
        ? 0
        : (analytics.high / analytics.total) * 100;

    const mediumPercentage = analytics.total === 0
        ? 0
        : (analytics.medium / analytics.total) * 100;

    const lowPercentage = analytics.total === 0
        ? 0
        : (analytics.low / analytics.total) * 100;

    highPriorityBar.style.width =
        `${highPercentage}%`;

    mediumPriorityBar.style.width =
        `${mediumPercentage}%`;

    lowPriorityBar.style.width =
        `${lowPercentage}%`;
}

// Search Tasks
function searchTasks() {
    searchQuery = searchInput.value.trim().toLowerCase();

    renderTasks();
}

// Clear Search
function clearSearch() {
    searchInput.value = "";
    searchQuery = "";

    renderTasks();

    searchInput.focus();
}

// Apply Filters
function applyFilters() {
    selectedCategory = categoryFilter.value;
    selectedPriority = priorityFilter.value;
    selectedDeadline = deadlineFilter.value;

    renderTasks();
}

// Change Sort Order
function changeSortOrder() {
    selectedSort = sortTasksSelect.value;

    renderTasks();
}

// Reset Controls
function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "all";
    priorityFilter.value = "all";
    deadlineFilter.value = "all";
    sortTasksSelect.value = "newest";

    searchQuery = "";
    selectedCategory = "all";
    selectedPriority = "all";
    selectedDeadline = "all";
    selectedSort = "newest";

    renderTasks();
}

// Open Add Task Modal
function openAddTaskModal() {
    taskForm.reset();

    taskTitleInput.setCustomValidity("");
    editingTaskId.value = "";

    modalTitle.textContent = "Add New Task";
    saveTaskBtn.textContent = "Save Task";

    taskModal.hidden = false;

    document.body.classList.add("modal-open");

    taskTitleInput.focus();
}

// Open Edit Task Modal
function openEditTaskModal(taskId) {
    const task = tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return;
    }

    taskForm.reset();

    taskTitleInput.setCustomValidity("");

    editingTaskId.value = task.id;
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description;
    taskCategoryInput.value = task.category;
    taskPriorityInput.value = task.priority;
    taskDueDateInput.value = task.dueDate;
    taskStatusInput.value = task.status;

    modalTitle.textContent = "Edit Task";
    saveTaskBtn.textContent = "Save Changes";

    taskModal.hidden = false;

    document.body.classList.add("modal-open");

    taskTitleInput.focus();
}

// Close Task Modal
function closeTaskModal() {
    taskModal.hidden = true;

    document.body.classList.remove("modal-open");

    taskForm.reset();

    taskTitleInput.setCustomValidity("");
    editingTaskId.value = "";

    addTaskBtn.focus();
}

// Generate Task ID
function generateTaskId(taskList = tasks) {
    const usedIds = new Set(
        taskList.map((task) => task.id)
    );

    let maxId = 0;

    taskList.forEach((task) => {
        if (Number.isSafeInteger(task.id)) {
            maxId = Math.max(maxId, task.id);
        }
    });

    if (maxId < Number.MAX_SAFE_INTEGER) {
        return maxId + 1;
    }

    let newId = 1;

    while (usedIds.has(newId)) {
        newId++;
    }

    return newId;
}

// Save Task
function saveTask(event) {
    event.preventDefault();

    const title = taskTitleInput.value.trim();

    if (!title) {
        taskTitleInput.setCustomValidity(
            "Please enter a task title."
        );

        taskTitleInput.reportValidity();

        return;
    }

    const taskData = {
        title,
        description: taskDescriptionInput.value.trim(),
        category: taskCategoryInput.value,
        priority: taskPriorityInput.value,
        dueDate: taskDueDateInput.value,
        status: taskStatusInput.value
    };

    const currentTaskId = editingTaskId.value;
    let updatedTasks;
    let successMessage;

    if (currentTaskId !== "") {
        const task = tasks.find(
            (item) => item.id === Number(currentTaskId)
        );

        if (!task) {
            showToast("Task not found.", "error");
            return;
        }

        updatedTasks = tasks.map((item) => {
            return item.id === Number(currentTaskId)
                ? { ...item, ...taskData }
                : item;
        });

        successMessage = "Task updated successfully.";

    } else {
        const newTask = {
            id: generateTaskId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };

        updatedTasks = [...tasks, newTask];

        successMessage = "Task added successfully.";
    }

    if (!saveTasksToStorage(updatedTasks)) {
        return;
    }

    tasks = updatedTasks;

    renderTasks();
    closeTaskModal();

    showToast(successMessage, "success");
}

// Delete Task
function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(
        (task) => task.id === taskId
    );

    if (taskIndex === -1) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
        return;
    }

    const updatedTasks = tasks.filter(
        (task) => task.id !== taskId
    );

    if (!saveTasksToStorage(updatedTasks)) {
        return;
    }

    tasks = updatedTasks;

    renderTasks();

    showToast(
        "Task deleted successfully.",
        "success"
    );
}

// Download File Utility - Step 14
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob(
        [content],
        { type: mimeType }
    );

    const fileUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = fileName;

    document.body.appendChild(link);

    try {
        link.click();

    } finally {
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(fileUrl);
        }, 1000);
    }
}

// Export Tasks as JSON - Step 14
function exportTasksAsJSON() {
    try {
        const backupData = {
            application: "TaskFlow",
            version: 1,
            exportedAt: new Date().toISOString(),
            totalTasks: tasks.length,
            tasks: tasks
        };

        const jsonContent = JSON.stringify(
            backupData,
            null,
            4
        );

        const fileName =
            `taskflow-backup-${getLocalDateString()}.json`;

        downloadFile(
            jsonContent,
            fileName,
            "application/json;charset=utf-8"
        );

        showToast(
            `JSON export started for ${tasks.length} tasks.`,
            "success"
        );

    } catch (error) {
        console.error("JSON export failed:", error);

        showToast(
            "Unable to export JSON file.",
            "error"
        );
    }
}

// Escape CSV Values - Step 14
function escapeCSV(value) {
    let text = String(value ?? "");

    // Reduce spreadsheet formula injection risk
    if (/^[\s\uFEFF]*[=+\-@]/.test(text) ||
        /^[\t\r\n]/.test(text)) {
        text = "'" + text;
    }

    // Escape double quotes
    text = text.replace(/"/g, '""');

    return `"${text}"`;
}

// Format Task Status
function formatTaskStatus(status) {
    const statusLabels = {
        todo: "To Do",
        progress: "In Progress",
        completed: "Completed"
    };

    return statusLabels[status] || status;
}

// Export Tasks as CSV - Step 14
function exportTasksAsCSV() {
    try {
        const headers = [
            "ID",
            "Title",
            "Description",
            "Category",
            "Priority",
            "Status",
            "Due Date",
            "Created At"
        ];

        const rows = tasks.map((task) => [
            task.id,
            task.title,
            task.description,
            task.category,
            task.priority,
            formatTaskStatus(task.status),
            task.dueDate,
            task.createdAt
        ]);

        const csvRows = [
            headers,
            ...rows
        ];

        const csvContent = csvRows
            .map((row) => {
                return row.map(escapeCSV).join(",");
            })
            .join("\r\n");

        // UTF-8 BOM for spreadsheet compatibility
        const finalContent = "\uFEFF" + csvContent;

        const fileName =
            `taskflow-tasks-${getLocalDateString()}.csv`;

        downloadFile(
            finalContent,
            fileName,
            "text/csv;charset=utf-8"
        );

        showToast(
            `CSV export started for ${tasks.length} tasks.`,
            "success"
        );

    } catch (error) {
        console.error("CSV export failed:", error);

        showToast(
            "Unable to export CSV file.",
            "error"
        );
    }
}

// Validate Date Format - Step 14
function isValidDateString(value) {
    if (value === "") {
        return true;
    }

    if (typeof value !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.toISOString().slice(0, 10) === value;
}

// Validate Imported Task - Step 14
function validateImportedTask(task, index) {
    const taskNumber = index + 1;

    if (
        task === null ||
        typeof task !== "object" ||
        Array.isArray(task)
    ) {
        throw new Error(
            `Task ${taskNumber} is not a valid object.`
        );
    }

    if (
        typeof task.title !== "string" ||
        task.title.trim() === "" ||
        task.title.trim().length > 100
    ) {
        throw new Error(
            `Task ${taskNumber} has an invalid title.`
        );
    }

    if (
        task.description !== undefined &&
        typeof task.description !== "string"
    ) {
        throw new Error(
            `Task ${taskNumber} has an invalid description.`
        );
    }

    if (!VALID_CATEGORIES.includes(task.category)) {
        throw new Error(
            `Task ${taskNumber} has an invalid category.`
        );
    }

    if (!VALID_PRIORITIES.includes(task.priority)) {
        throw new Error(
            `Task ${taskNumber} has an invalid priority.`
        );
    }

    if (!VALID_STATUSES.includes(task.status)) {
        throw new Error(
            `Task ${taskNumber} has an invalid status.`
        );
    }

    const dueDate = task.dueDate ?? "";

    if (!isValidDateString(dueDate)) {
        throw new Error(
            `Task ${taskNumber} has an invalid due date.`
        );
    }

    let createdAt;

    if (task.createdAt === undefined) {
        createdAt = new Date().toISOString();

    } else {
        if (
            typeof task.createdAt !== "string" ||
            Number.isNaN(Date.parse(task.createdAt))
        ) {
            throw new Error(
                `Task ${taskNumber} has an invalid creation date.`
            );
        }

        createdAt = new Date(task.createdAt).toISOString();
    }

    // Only accept known task properties
    return {
        id: Number.isSafeInteger(task.id) && task.id > 0
            ? task.id
            : null,

        title: task.title.trim(),
        description: (task.description ?? "").trim(),
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate,
        createdAt
    };
}

// Validate Imported JSON - Step 14
function validateImportedData(data) {
    let importedTasks;

    // Support raw task arrays
    if (Array.isArray(data)) {
        importedTasks = data;

    // Support TaskFlow backup objects
    } else if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.tasks)
    ) {
        if (
            data.application !== undefined &&
            data.application !== "TaskFlow"
        ) {
            throw new Error(
                "This backup belongs to another application."
            );
        }

        if (
            data.version !== undefined &&
            data.version !== 1
        ) {
            throw new Error(
                "Unsupported backup version."
            );
        }

        importedTasks = data.tasks;

    } else {
        throw new Error(
            "Invalid backup format. A tasks array is required."
        );
    }

    if (importedTasks.length > MAX_IMPORT_TASKS) {
        throw new Error(
            `A maximum of ${MAX_IMPORT_TASKS} tasks can be imported at once.`
        );
    }

    return importedTasks.map(
        (task, index) => validateImportedTask(task, index)
    );
}

// Create Task Signature - Step 14
function getTaskSignature(task) {
    return JSON.stringify([
        task.title,
        task.description,
        task.category,
        task.priority,
        task.status,
        task.dueDate
    ]);
}

// Merge Imported Tasks - Step 14
function mergeImportedTasks(existingTasks, importedTasks) {
    const mergedTasks = existingTasks.map(
        (task) => ({ ...task })
    );

    const signatures = new Set(
        mergedTasks.map(getTaskSignature)
    );

    const usedIds = new Set(
        mergedTasks.map((task) => task.id)
    );

    let addedCount = 0;
    let skippedCount = 0;

    importedTasks.forEach((task) => {
        const signature = getTaskSignature(task);

        // Skip identical tasks
        if (signatures.has(signature)) {
            skippedCount++;
            return;
        }

        let taskId = task.id;

        // Prevent duplicate IDs
        if (
            !Number.isSafeInteger(taskId) ||
            taskId <= 0 ||
            usedIds.has(taskId)
        ) {
            taskId = generateTaskId(mergedTasks);
        }

        const newTask = {
            ...task,
            id: taskId
        };

        mergedTasks.push(newTask);

        usedIds.add(taskId);
        signatures.add(signature);

        addedCount++;
    });

    return {
        tasks: mergedTasks,
        addedCount,
        skippedCount
    };
}

// Prepare Replacement Tasks - Step 14
function prepareReplacementTasks(importedTasks) {
    const replacementTasks = [];
    const usedIds = new Set();

    importedTasks.forEach((task) => {
        let taskId = task.id;

        if (
            !Number.isSafeInteger(taskId) ||
            taskId <= 0 ||
            usedIds.has(taskId)
        ) {
            taskId = generateTaskId(replacementTasks);
        }

        replacementTasks.push({
            ...task,
            id: taskId
        });

        usedIds.add(taskId);
    });

    return replacementTasks;
}

// Open Import File Picker
function openImportFilePicker() {
    importFileInput.value = "";
    importFileInput.click();
}

// Read Imported File - Step 14
async function handleImportFile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    importJsonBtn.disabled = true;

    try {
        if (!file.name.toLowerCase().endsWith(".json")) {
            throw new Error(
                "Please select a valid JSON file."
            );
        }

        if (file.size > MAX_IMPORT_SIZE) {
            throw new Error(
                "File size must not exceed 5 MB."
            );
        }

        const fileContent = await file.text();

        let parsedData;

        try {
            parsedData = JSON.parse(
                fileContent.replace(/^\uFEFF/, "")
            );

        } catch (error) {
            throw new Error(
                "The selected file contains invalid JSON."
            );
        }

        const importedTasks =
            validateImportedData(parsedData);

        pendingImportedTasks = importedTasks;

        openImportModal(importedTasks.length);

    } catch (error) {
        pendingImportedTasks = null;

        console.error("Import failed:", error);

        showToast(
            error.message || "Unable to import tasks.",
            "error"
        );

    } finally {
        importFileInput.value = "";
        importJsonBtn.disabled = false;
    }
}

// Open Import Confirmation Modal
function openImportModal(importedCount) {
    importSummaryText.textContent =
        `${importedCount} valid tasks found in the backup. ` +
        `You currently have ${tasks.length} tasks. ` +
        "Choose how you want to import them.";

    document.querySelector(
        'input[name="importMode"][value="merge"]'
    ).checked = true;

    importModal.hidden = false;

    document.body.classList.add("modal-open");

    confirmImportBtn.focus();
}

// Close Import Modal
function closeImportModal() {
    importModal.hidden = true;

    pendingImportedTasks = null;

    document.body.classList.remove("modal-open");

    importJsonBtn.focus();
}

// Confirm Import - Step 14
function confirmImportTasks() {
    if (!Array.isArray(pendingImportedTasks)) {
        showToast(
            "No valid backup file selected.",
            "error"
        );

        return;
    }

    const selectedMode = document.querySelector(
        'input[name="importMode"]:checked'
    ).value;

    let updatedTasks;
    let successMessage;

    if (selectedMode === "replace") {
        const confirmed = confirm(
            "This will replace all existing tasks. Continue?"
        );

        if (!confirmed) {
            return;
        }

        updatedTasks = prepareReplacementTasks(
            pendingImportedTasks
        );

        successMessage =
            `${updatedTasks.length} tasks restored successfully.`;

    } else {
        const result = mergeImportedTasks(
            tasks,
            pendingImportedTasks
        );

        updatedTasks = result.tasks;

        successMessage =
            `${result.addedCount} tasks imported. ` +
            `${result.skippedCount} duplicate tasks skipped.`;
    }

    // Save before replacing the current task array
    if (!saveTasksToStorage(updatedTasks)) {
        return;
    }

    tasks = updatedTasks;

    resetFilters();
    closeImportModal();

    showToast(
        successMessage,
        "success"
    );
}

// Drag and Drop Events
taskColumns.forEach((column) => {

    column.addEventListener("dragover", (event) => {
        if (draggedTaskId === null) {
            return;
        }

        event.preventDefault();

        event.dataTransfer.dropEffect = "move";

        column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", (event) => {
        if (!column.contains(event.relatedTarget)) {
            column.classList.remove("drag-over");
        }
    });

    column.addEventListener("drop", (event) => {
        event.preventDefault();

        if (draggedTaskId === null) {
            return;
        }

        const task = tasks.find(
            (item) => item.id === draggedTaskId
        );

        if (task && task.status !== column.dataset.status) {
            const newStatus = column.dataset.status;

            const updatedTasks = tasks.map((item) => {
                return item.id === draggedTaskId
                    ? { ...item, status: newStatus }
                    : item;
            });

            if (saveTasksToStorage(updatedTasks)) {
                tasks = updatedTasks;

                showToast(
                    `Task moved to ${formatTaskStatus(newStatus)}.`,
                    "success"
                );
            }
        }

        draggedTaskId = null;

        taskColumns.forEach((item) => {
            item.classList.remove("drag-over");
        });

        renderTasks();
    });
});

// Sidebar Navigation
document.querySelectorAll(".menu-item").forEach((item) => {

    item.addEventListener("click", () => {
        document.querySelectorAll(".menu-item").forEach((link) => {
            link.classList.remove("active");
        });

        item.classList.add("active");
    });
});

// Task Event Listeners
addTaskBtn.addEventListener(
    "click",
    openAddTaskModal
);

closeModalBtn.addEventListener(
    "click",
    closeTaskModal
);

cancelTaskBtn.addEventListener(
    "click",
    closeTaskModal
);

taskForm.addEventListener(
    "submit",
    saveTask
);

// Search Event Listeners
searchInput.addEventListener(
    "input",
    searchTasks
);

clearSearchBtn.addEventListener(
    "click",
    clearSearch
);

// Filter Event Listeners
categoryFilter.addEventListener(
    "change",
    applyFilters
);

priorityFilter.addEventListener(
    "change",
    applyFilters
);

deadlineFilter.addEventListener(
    "change",
    applyFilters
);

resetFiltersBtn.addEventListener(
    "click",
    resetFilters
);

sortTasksSelect.addEventListener(
    "change",
    changeSortOrder
);

// Theme Toggle Event
themeToggle.addEventListener(
    "click",
    toggleTheme
);

// Export and Import Events - Step 14
exportJsonBtn.addEventListener(
    "click",
    exportTasksAsJSON
);

exportCsvBtn.addEventListener(
    "click",
    exportTasksAsCSV
);

importJsonBtn.addEventListener(
    "click",
    openImportFilePicker
);

importFileInput.addEventListener(
    "change",
    handleImportFile
);

closeImportModalBtn.addEventListener(
    "click",
    closeImportModal
);

cancelImportBtn.addEventListener(
    "click",
    closeImportModal
);

confirmImportBtn.addEventListener(
    "click",
    confirmImportTasks
);

// Clear Form Validation
taskTitleInput.addEventListener("input", () => {
    taskTitleInput.setCustomValidity("");
});

// Close Task Modal on Outside Click
taskModal.addEventListener("click", (event) => {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

// Close Import Modal on Outside Click
importModal.addEventListener("click", (event) => {
    if (event.target === importModal) {
        closeImportModal();
    }
});

// Keyboard Events
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {

        if (!importModal.hidden) {
            closeImportModal();

        } else if (!taskModal.hidden) {
            closeTaskModal();
        }
    }

    // Keep keyboard focus inside an open modal
    if (event.key === "Tab") {
        const activeModal = !importModal.hidden
            ? importModal
            : !taskModal.hidden
                ? taskModal
                : null;

        if (!activeModal) {
            return;
        }

        const focusableElements = Array.from(
            activeModal.querySelectorAll(
                'button, input, select, textarea, a[href], [tabindex]'
            )
        ).filter((element) => {
            return !element.disabled &&
                element.type !== "hidden" &&
                element.getClientRects().length > 0 &&
                element.tabIndex >= 0;
        });

        const firstElement = focusableElements[0];

        const lastElement =
            focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
            return;
        }

        if (
            event.shiftKey &&
            document.activeElement === firstElement
        ) {
            event.preventDefault();
            lastElement.focus();

        } else if (
            !event.shiftKey &&
            document.activeElement === lastElement
        ) {
            event.preventDefault();
            firstElement.focus();
        }
    }
});

// Refresh Dashboard When Page Becomes Active
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        renderTasks();
    }
});

window.addEventListener(
    "focus",
    renderTasks
);

// Initialize Dashboard
updateThemeButton();
renderTasks();