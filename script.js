
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
function saveTasksToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
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

// Application State
let draggedTaskId = null;
let searchQuery = "";
let selectedCategory = "all";
let selectedPriority = "all";
let selectedDeadline = "all";
let selectedSort = "newest";

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
        localStorage.setItem(THEME_STORAGE_KEY, validTheme);
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
        event.dataTransfer.setData("text/plain", String(task.id));

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

        const matchesSearch = searchableText.includes(searchQuery);

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

    document.getElementById("totalTasks").textContent = tasks.length;
    document.getElementById("progressTasks").textContent = progress;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("overdueTasks").textContent = overdue;
    document.getElementById("dueTodayTasks").textContent = dueToday;

    document.getElementById("todoCount").textContent =
        filteredTasks.filter((task) => task.status === "todo").length;

    document.getElementById("progressCount").textContent =
        filteredTasks.filter((task) => task.status === "progress").length;

    document.getElementById("completedCount").textContent =
        filteredTasks.filter((task) => task.status === "completed").length;
}

// Update Filter Results
function updateFilterResults(resultCount) {
    const isFiltering =
        searchQuery !== "" ||
        selectedCategory !== "all" ||
        selectedPriority !== "all" ||
        selectedDeadline !== "all";

    searchResults.hidden = !isFiltering;
    emptySearch.hidden = !isFiltering || resultCount > 0;
    clearSearchBtn.hidden = searchInput.value.length === 0;

    if (isFiltering) {
        const taskWord = resultCount === 1 ? "task" : "tasks";

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
            "Good work! You have completed more than half your tasks.";
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
        statusDonut.style.background = "var(--chart-empty)";

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
        const progressEnd = todoPercentage + progressPercentage;

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

    highPriorityBar.style.width = `${highPercentage}%`;
    mediumPriorityBar.style.width = `${mediumPercentage}%`;
    lowPriorityBar.style.width = `${lowPercentage}%`;
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
    const task = tasks.find((item) => item.id === taskId);

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
function generateTaskId() {
    return Math.max(0, ...tasks.map((task) => task.id)) + 1;
}

// Save Task
function saveTask(event) {
    event.preventDefault();

    const title = taskTitleInput.value.trim();

    if (!title) {
        taskTitleInput.setCustomValidity("Please enter a task title.");
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

    if (currentTaskId !== "") {
        const task = tasks.find(
            (item) => item.id === Number(currentTaskId)
        );

        if (task) {
            Object.assign(task, taskData);
        }
    } else {
        const newTask = {
            id: generateTaskId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
    }

    saveTasksToStorage();
    renderTasks();
    closeTaskModal();
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

    tasks.splice(taskIndex, 1);

    saveTasksToStorage();
    renderTasks();
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

        if (task) {
            task.status = column.dataset.status;
            saveTasksToStorage();
        }

        draggedTaskId = null;

        taskColumns.forEach((item) => {
            item.classList.remove("drag-over");
        });

        renderTasks();
    });
});

// Event Listeners
addTaskBtn.addEventListener("click", openAddTaskModal);
closeModalBtn.addEventListener("click", closeTaskModal);
cancelTaskBtn.addEventListener("click", closeTaskModal);
taskForm.addEventListener("submit", saveTask);

searchInput.addEventListener("input", searchTasks);
clearSearchBtn.addEventListener("click", clearSearch);

categoryFilter.addEventListener("change", applyFilters);
priorityFilter.addEventListener("change", applyFilters);
deadlineFilter.addEventListener("change", applyFilters);
resetFiltersBtn.addEventListener("click", resetFilters);
sortTasksSelect.addEventListener("change", changeSortOrder);

// Theme Toggle Event
themeToggle.addEventListener("click", toggleTheme);

taskTitleInput.addEventListener("input", () => {
    taskTitleInput.setCustomValidity("");
});

taskModal.addEventListener("click", (event) => {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !taskModal.hidden) {
        closeTaskModal();
    }
});

// Refresh Dashboard When Page Becomes Active
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        renderTasks();
    }
});

window.addEventListener("focus", renderTasks);

// Initialize Dashboard
updateThemeButton();
renderTasks();
