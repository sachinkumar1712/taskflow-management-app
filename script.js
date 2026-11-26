"use strict";

const STORAGE_KEY = "taskflow_tasks";
const THEME_KEY = "taskflow_theme";

const categories = ["Development", "Design", "Personal", "Other"];
const priorities = ["low", "medium", "high"];
const statuses = ["todo", "progress", "completed"];

const statusLabels = {
    todo: "To Do",
    progress: "In Progress",
    completed: "Completed"
};

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


// DOM Elements

const $ = (id) => document.getElementById(id);

const taskLists = {
    todo: $("todoTasks"),
    progress: $("inProgressTasks"),
    completed: $("completedTasksList")
};

const taskColumns = document.querySelectorAll(".task-column");
const menuItems = document.querySelectorAll(".menu-item");

const addTaskBtn = $("addTaskBtn");
const taskModal = $("taskModal");
const taskForm = $("taskForm");
const modalTitle = $("modalTitle");
const saveTaskBtn = $("saveTaskBtn");

const editingTaskId = $("editingTaskId");
const taskTitleInput = $("taskTitle");
const taskDescriptionInput = $("taskDescription");
const taskCategoryInput = $("taskCategory");
const taskPriorityInput = $("taskPriority");
const taskDueDateInput = $("taskDueDate");
const taskStatusInput = $("taskStatus");

const searchInput = $("searchInput");
const clearSearchBtn = $("clearSearchBtn");
const categoryFilter = $("categoryFilter");
const priorityFilter = $("priorityFilter");
const deadlineFilter = $("deadlineFilter");
const sortTasksSelect = $("sortTasks");

const importModal = $("importModal");
const importFileInput = $("importFileInput");
const importJsonBtn = $("importJsonBtn");

const shortcutsModal = $("shortcutsModal");
const toastContainer = $("toastContainer");

let tasks = loadTasks();
let draggedTaskId = null;
let pendingImportedTasks = null;
let previousFocus = null;


// Local Storage

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks === null) {
            return defaultTasks.map((task) => ({ ...task }));
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            throw new Error("Invalid saved task data.");
        }

        const migratedTasks = parsedTasks.map((task, index) => ({
            ...task,
            createdAt: task.createdAt ||
                new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString()
        }));

        return prepareReplacementTasks(
            migratedTasks.map(validateImportedTask)
        );

    } catch (error) {
        console.error("Unable to load tasks:", error);

        setTimeout(() => {
            showToast(
                "Saved data could not be loaded. Sample tasks are displayed.",
                "error"
            );
        }, 0);

        return defaultTasks.map((task) => ({ ...task }));
    }
}

function saveTasksToStorage(taskList) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(taskList)
        );

        return true;

    } catch (error) {
        console.error("Unable to save tasks:", error);

        showToast(
            "Unable to save tasks. Browser storage may be unavailable or full.",
            "error"
        );

        return false;
    }
}

function updateTasks(updatedTasks) {
    if (!saveTasksToStorage(updatedTasks)) {
        return false;
    }

    tasks = updatedTasks;
    renderTasks();

    return true;
}

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


// Notifications

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
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("p");
    text.className = "toast-message";
    text.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "toast-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Dismiss notification");

    const timer = setTimeout(() => {
        toast.remove();
    }, 4000);

    closeBtn.addEventListener("click", () => {
        clearTimeout(timer);
        toast.remove();
    });

    toast.append(icon, text, closeBtn);
    toastContainer.appendChild(toast);
}


// Theme Management

function getCurrentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function updateThemeButton() {
    const isDark = getCurrentTheme() === "dark";

    $("themeIcon").textContent = isDark ? "☀️" : "🌙";
    $("themeText").textContent = isDark ? "Light Mode" : "Dark Mode";

    $("themeToggle").setAttribute(
        "aria-pressed",
        String(isDark)
    );

    $("themeToggle").setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    document.querySelector('meta[name="theme-color"]').content =
        isDark ? "#141722" : "#695cf5";
}

function toggleTheme() {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;

    try {
        localStorage.setItem(THEME_KEY, nextTheme);

    } catch (error) {
        console.error("Unable to save theme:", error);
        showToast("Theme preference could not be saved.", "error");
    }

    updateThemeButton();
}


// Date Utilities

function getLocalDateString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDaysUntilDue(dueDate) {
    if (!dueDate) {
        return null;
    }

    const due = Date.parse(`${dueDate}T00:00:00Z`);

    const today = Date.parse(
        `${getLocalDateString()}T00:00:00Z`
    );

    return Math.round((due - today) / 86400000);
}

function getDeadlineStatus(task) {
    if (task.status === "completed") {
        return "completed";
    }

    if (!task.dueDate) {
        return "no-date";
    }

    const days = getDaysUntilDue(task.dueDate);

    if (days < 0) {
        return "overdue";
    }

    if (days === 0) {
        return "today";
    }

    return "upcoming";
}

function getDeadlineText(task) {
    const status = getDeadlineStatus(task);

    if (status === "completed") {
        return "✓ Completed";
    }

    if (status === "no-date") {
        return "";
    }

    const days = getDaysUntilDue(task.dueDate);

    if (days < 0) {
        const overdueDays = Math.abs(days);

        return `⚠ Overdue by ${overdueDays} ${
            overdueDays === 1 ? "day" : "days"
        }`;
    }

    if (days === 0) {
        return "⏰ Due Today";
    }

    if (days === 1) {
        return "📅 Due Tomorrow";
    }

    return `📅 Due in ${days} days`;
}


// Task Cards

function createTaskCard(task) {
    const card = document.createElement("article");

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
    description.hidden = !task.description;

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

    if (task.dueDate || task.status === "completed") {
        const deadline = document.createElement("div");

        deadline.className = `task-deadline deadline-${deadlineStatus}`;
        deadline.textContent = getDeadlineText(task);

        if (task.dueDate) {
            deadline.title = `Due date: ${task.dueDate}`;
        }

        card.appendChild(deadline);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", `Edit ${task.title}`);

    editBtn.addEventListener("click", () => {
        openEditTaskModal(task.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", `Delete ${task.title}`);

    deleteBtn.addEventListener("click", () => {
        deleteTask(task.id);
    });

    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);

    // Quick status change

    const statusSelect = document.createElement("select");

    statusSelect.className = "quick-status";

    statusSelect.setAttribute(
        "aria-label",
        `Change status of ${task.title}`
    );

    statuses.forEach((status) => {
        const option = document.createElement("option");

        option.value = status;
        option.textContent = statusLabels[status];

        statusSelect.appendChild(option);
    });

    statusSelect.value = task.status;

    statusSelect.addEventListener("change", () => {
        const updated = changeTaskStatus(
            task.id,
            statusSelect.value
        );

        if (!updated) {
            statusSelect.value = task.status;
        }
    });

    card.appendChild(statusSelect);

    // Drag and drop

    card.addEventListener("dragstart", (event) => {
        if (event.target !== card) {
            event.preventDefault();
            return;
        }

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

    card.addEventListener("dragend", () => {
        draggedTaskId = null;

        card.classList.remove("dragging");

        taskColumns.forEach((column) => {
            column.classList.remove("drag-over");
        });
    });

    return card;
}


// Search and Filters

function getFilteredTasks() {
    const search = searchInput.value.trim().toLowerCase();

    const selectedCategory = categoryFilter.value;
    const selectedPriority = priorityFilter.value;
    const selectedDeadline = deadlineFilter.value;

    return tasks.filter((task) => {
        const searchableText = [
            task.title,
            task.description,
            task.category,
            task.priority,
            task.status,
            statusLabels[task.status]
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(search);

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

function isFiltering() {
    return (
        searchInput.value.trim() !== "" ||
        categoryFilter.value !== "all" ||
        priorityFilter.value !== "all" ||
        deadlineFilter.value !== "all"
    );
}

function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "all";
    priorityFilter.value = "all";
    deadlineFilter.value = "all";
    sortTasksSelect.value = "newest";

    renderTasks();
}


// Sorting

function compareDueDates(a, b, descending = false) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return descending
        ? b.dueDate.localeCompare(a.dueDate)
        : a.dueDate.localeCompare(b.dueDate);
}

function sortTasks(taskList) {
    const priorityRank = {
        high: 3,
        medium: 2,
        low: 1
    };

    return [...taskList].sort((a, b) => {
        switch (sortTasksSelect.value) {

            case "newest":
                return Date.parse(b.createdAt) - Date.parse(a.createdAt);

            case "oldest":
                return Date.parse(a.createdAt) - Date.parse(b.createdAt);

            case "priority-high":
                return priorityRank[b.priority] - priorityRank[a.priority];

            case "priority-low":
                return priorityRank[a.priority] - priorityRank[b.priority];

            case "due-asc":
                return compareDueDates(a, b);

            case "due-desc":
                return compareDueDates(a, b, true);

            case "title-asc":
                return a.title.localeCompare(b.title);

            case "title-desc":
                return b.title.localeCompare(a.title);

            default:
                return 0;
        }
    });
}


// Empty Column States

function createEmptyState(status) {
    const emptyState = document.createElement("div");
    emptyState.className = "column-empty";

    const icons = {
        todo: "📋",
        progress: "⏳",
        completed: "🎯"
    };

    const messages = {
        todo: "No pending tasks. Add a task to get started.",
        progress: "Move a task here when you start working.",
        completed: "Completed tasks will appear here."
    };

    const icon = document.createElement("span");
    icon.textContent = icons[status];
    icon.setAttribute("aria-hidden", "true");

    const message = document.createElement("p");

    message.textContent = isFiltering()
        ? "No matching tasks in this column."
        : messages[status];

    emptyState.append(icon, message);

    return emptyState;
}


// Render Dashboard

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    const sortedTasks = sortTasks(filteredTasks);

    statuses.forEach((status) => {
        taskLists[status].replaceChildren();
    });

    sortedTasks.forEach((task) => {
        const card = createTaskCard(task);

        taskLists[task.status].appendChild(card);
    });

    statuses.forEach((status) => {
        if (taskLists[status].children.length === 0) {
            taskLists[status].appendChild(
                createEmptyState(status)
            );
        }
    });

    updateTaskCounts(filteredTasks);
    updateFilterResults(filteredTasks.length);
    updateAnalytics();
}

function updateTaskCounts(filteredTasks) {
    $("totalTasks").textContent = tasks.length;

    $("progressTasks").textContent = tasks.filter(
        (task) => task.status === "progress"
    ).length;

    $("completedTasks").textContent = tasks.filter(
        (task) => task.status === "completed"
    ).length;

    $("overdueTasks").textContent = tasks.filter(
        (task) => getDeadlineStatus(task) === "overdue"
    ).length;

    $("dueTodayTasks").textContent = tasks.filter(
        (task) => getDeadlineStatus(task) === "today"
    ).length;

    $("todoCount").textContent = filteredTasks.filter(
        (task) => task.status === "todo"
    ).length;

    $("progressCount").textContent = filteredTasks.filter(
        (task) => task.status === "progress"
    ).length;

    $("completedCount").textContent = filteredTasks.filter(
        (task) => task.status === "completed"
    ).length;
}

function updateFilterResults(count) {
    const filtering = isFiltering();

    $("searchResults").hidden = !filtering;

    $("emptySearch").hidden =
        !filtering || count > 0;

    clearSearchBtn.hidden =
        searchInput.value.length === 0;

    $("searchResultText").textContent =
        `${count} ${count === 1 ? "task" : "tasks"} match your search and filters.`;
}


// Analytics

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

    const completionRate = total
        ? Math.round((completed / total) * 100)
        : 0;

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

function updateAnalytics() {
    const data = calculateAnalytics();

    $("completionPercentage").textContent =
        `${data.completionRate}%`;

    $("completionProgressBar").style.width =
        `${data.completionRate}%`;

    $("completionProgress").setAttribute(
        "aria-valuenow",
        String(data.completionRate)
    );

    $("completionDetail").textContent =
        `${data.completed} of ${data.total} tasks completed`;

    let message;

    if (data.total === 0) {
        message = "Add tasks to start tracking your progress.";

    } else if (data.completionRate === 100) {
        message = "Excellent! You have completed all your tasks.";

    } else if (data.completionRate >= 75) {
        message = "Great progress! You are close to finishing.";

    } else if (data.completionRate >= 50) {
        message = "Good work! You have completed at least half your tasks.";

    } else {
        message = "Keep going! Every completed task makes a difference.";
    }

    $("productivityMessage").textContent = message;

    $("donutTotal").textContent = data.total;
    $("chartTodoCount").textContent = data.todo;
    $("chartProgressCount").textContent = data.progress;
    $("chartCompletedCount").textContent = data.completed;

    if (data.total === 0) {
        $("statusDonut").style.background = "var(--chart-empty)";

        $("statusDonut").setAttribute(
            "aria-label",
            "No tasks available"
        );

    } else {
        const todoEnd = (data.todo / data.total) * 100;

        const progressEnd =
            ((data.todo + data.progress) / data.total) * 100;

        $("statusDonut").style.background = `conic-gradient(
            #ffae43 0% ${todoEnd}%,
            #695cf5 ${todoEnd}% ${progressEnd}%,
            #28ba85 ${progressEnd}% 100%
        )`;

        $("statusDonut").setAttribute(
            "aria-label",
            `${data.todo} to do, ${data.progress} in progress, ${data.completed} completed`
        );
    }

    const priorityNames = ["high", "medium", "low"];

    priorityNames.forEach((priority) => {
        const percentage = data.total
            ? (data[priority] / data.total) * 100
            : 0;

        $(`${priority}PriorityCount`).textContent =
            data[priority];

        $(`${priority}PriorityBar`).style.width =
            `${percentage}%`;
    });
}


// Modal Management

function getActiveModal() {
    return document.querySelector(".modal:not([hidden])");
}

function openModal(modal, focusElement) {
    if (getActiveModal()) {
        return;
    }

    previousFocus = document.activeElement;

    modal.hidden = false;

    document.body.classList.add("modal-open");

    document.querySelector(".app-container").inert = true;

    focusElement.focus();
}

function closeModal(modal) {
    modal.hidden = true;

    document.body.classList.remove("modal-open");

    document.querySelector(".app-container").inert = false;

    if (previousFocus && previousFocus.isConnected) {
        previousFocus.focus();

    } else {
        addTaskBtn.focus();
    }

    previousFocus = null;
}

function openAddTaskModal(status = "todo") {
    taskForm.reset();

    editingTaskId.value = "";

    taskTitleInput.setCustomValidity("");

    taskStatusInput.value = status;

    modalTitle.textContent = "Add New Task";
    saveTaskBtn.textContent = "Save Task";

    openModal(taskModal, taskTitleInput);
}

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

    openModal(taskModal, taskTitleInput);
}

function closeTaskModal() {
    closeModal(taskModal);

    taskForm.reset();

    editingTaskId.value = "";
    taskTitleInput.setCustomValidity("");
}


// Add and Edit Tasks

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

    if (!isValidDateString(taskDueDateInput.value)) {
        showToast("Please enter a valid due date.", "error");
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

    const isEditing = editingTaskId.value !== "";

    let updatedTasks;

    if (isEditing) {
        const taskId = Number(editingTaskId.value);

        if (!tasks.some((task) => task.id === taskId)) {
            showToast("Task not found.", "error");
            return;
        }

        updatedTasks = tasks.map((task) => {
            return task.id === taskId
                ? { ...task, ...taskData }
                : task;
        });

    } else {
        const newTask = {
            id: generateTaskId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };

        updatedTasks = [...tasks, newTask];
    }

    if (!updateTasks(updatedTasks)) {
        return;
    }

    closeTaskModal();

    showToast(
        isEditing
            ? "Task updated successfully."
            : "Task added successfully.",
        "success"
    );
}


// Delete Task

function deleteTask(taskId) {
    const task = tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const updatedTasks = tasks.filter(
        (item) => item.id !== taskId
    );

    if (updateTasks(updatedTasks)) {
        addTaskBtn.focus();

        showToast(
            "Task deleted successfully.",
            "success"
        );
    }
}


// Change Task Status

function changeTaskStatus(taskId, newStatus) {
    if (!statuses.includes(newStatus)) {
        return false;
    }

    const task = tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return false;
    }

    if (task.status === newStatus) {
        return true;
    }

    const updatedTasks = tasks.map((item) => {
        return item.id === taskId
            ? { ...item, status: newStatus }
            : item;
    });

    if (!updateTasks(updatedTasks)) {
        return false;
    }

    showToast(
        `Task moved to ${statusLabels[newStatus]}.`,
        "success"
    );

    return true;
}


// Drag and Drop

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

        if (draggedTaskId !== null) {
            changeTaskStatus(
                draggedTaskId,
                column.dataset.status
            );
        }

        draggedTaskId = null;

        taskColumns.forEach((item) => {
            item.classList.remove("drag-over");
        });
    });
});


// Download Files

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


// Export JSON

function exportTasksAsJSON() {
    try {
        const backup = {
            application: "TaskFlow",
            version: 1,
            exportedAt: new Date().toISOString(),
            totalTasks: tasks.length,
            tasks
        };

        const content = JSON.stringify(backup, null, 4);

        downloadFile(
            content,
            `taskflow-backup-${getLocalDateString()}.json`,
            "application/json;charset=utf-8"
        );

        showToast(
            `JSON export started for ${tasks.length} tasks.`,
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast("Unable to export JSON file.", "error");
    }
}


// Export CSV

function escapeCSV(value) {
    let text = String(value ?? "");

    if (
        /^[\s\uFEFF]*[=+\-@]/.test(text) ||
        /^[\t\r\n]/.test(text)
    ) {
        text = "'" + text;
    }

    text = text.replace(/"/g, '""');

    return `"${text}"`;
}

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
            statusLabels[task.status],
            task.dueDate,
            task.createdAt
        ]);

        const content = [headers, ...rows]
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        downloadFile(
            "\uFEFF" + content,
            `taskflow-tasks-${getLocalDateString()}.csv`,
            "text/csv;charset=utf-8"
        );

        showToast(
            `CSV export started for ${tasks.length} tasks.`,
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast("Unable to export CSV file.", "error");
    }
}


// Import Validation

function isValidDateString(value) {
    if (value === "") {
        return true;
    }

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000")
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function validateImportedTask(task, index) {
    const taskNumber = index + 1;

    if (!task || typeof task !== "object" || Array.isArray(task)) {
        throw new Error(`Task ${taskNumber} is invalid.`);
    }

    if (
        typeof task.title !== "string" ||
        !task.title.trim() ||
        task.title.trim().length > 100
    ) {
        throw new Error(`Task ${taskNumber} has an invalid title.`);
    }

    if (
        task.description !== undefined &&
        typeof task.description !== "string"
    ) {
        throw new Error(`Task ${taskNumber} has an invalid description.`);
    }

    if (!categories.includes(task.category)) {
        throw new Error(`Task ${taskNumber} has an invalid category.`);
    }

    if (!priorities.includes(task.priority)) {
        throw new Error(`Task ${taskNumber} has an invalid priority.`);
    }

    if (!statuses.includes(task.status)) {
        throw new Error(`Task ${taskNumber} has an invalid status.`);
    }

    const dueDate = task.dueDate ?? "";

    if (!isValidDateString(dueDate)) {
        throw new Error(`Task ${taskNumber} has an invalid due date.`);
    }

    let createdAt = new Date().toISOString();

    if (task.createdAt !== undefined) {
        if (
            typeof task.createdAt !== "string" ||
            Number.isNaN(Date.parse(task.createdAt))
        ) {
            throw new Error(`Task ${taskNumber} has an invalid creation date.`);
        }

        createdAt = new Date(task.createdAt).toISOString();
    }

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

function validateImportedData(data) {
    let importedTasks;

    if (Array.isArray(data)) {
        importedTasks = data;

    } else if (data && Array.isArray(data.tasks)) {
        if (
            data.application !== undefined &&
            data.application !== "TaskFlow"
        ) {
            throw new Error("This backup belongs to another application.");
        }

        if (data.version !== undefined && data.version !== 1) {
            throw new Error("Unsupported backup version.");
        }

        importedTasks = data.tasks;

    } else {
        throw new Error("Invalid backup format.");
    }

    if (importedTasks.length > 10000) {
        throw new Error("A maximum of 10,000 tasks can be imported at once.");
    }

    return importedTasks.map(validateImportedTask);
}


// Merge and Replace Tasks

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

function prepareReplacementTasks(importedTasks) {
    const usedIds = new Set();
    const reservedIds = new Set(
        importedTasks
            .map((task) => task.id)
            .filter((id) => Number.isSafeInteger(id) && id > 0)
    );

    let nextId = 1;

    return importedTasks.map((task) => {
        let id = task.id;

        if (
            !Number.isSafeInteger(id) ||
            id <= 0 ||
            usedIds.has(id)
        ) {
            while (usedIds.has(nextId) || reservedIds.has(nextId)) {
                nextId++;
            }

            id = nextId++;
        }

        usedIds.add(id);

        return {
            ...task,
            id
        };
    });
}

function mergeImportedTasks(importedTasks) {
    const mergedTasks = [...tasks];

    const signatures = new Set(
        tasks.map(getTaskSignature)
    );

    let addedCount = 0;
    let skippedCount = 0;

    importedTasks.forEach((task) => {
        const signature = getTaskSignature(task);

        if (signatures.has(signature)) {
            skippedCount++;
            return;
        }

        mergedTasks.push(task);

        signatures.add(signature);

        addedCount++;
    });

    return {
        tasks: prepareReplacementTasks(mergedTasks),
        addedCount,
        skippedCount
    };
}


// Import JSON File

async function handleImportFile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    importJsonBtn.disabled = true;

    try {
        if (!file.name.toLowerCase().endsWith(".json")) {
            throw new Error("Please select a JSON file.");
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size must not exceed 5 MB.");
        }

        const content = await file.text();

        let parsedData;

        try {
            parsedData = JSON.parse(
                content.replace(/^\uFEFF/, "")
            );

        } catch {
            throw new Error("The selected file contains invalid JSON.");
        }

        const importedTasks = validateImportedData(parsedData);

        if (getActiveModal()) {
            throw new Error("Close the current dialog and try importing again.");
        }

        pendingImportedTasks = importedTasks;

        $("importSummaryText").textContent =
            `${importedTasks.length} valid tasks found in the backup. ` +
            `You currently have ${tasks.length} tasks. ` +
            "Choose how you want to import them.";

        document.querySelector(
            'input[name="importMode"][value="merge"]'
        ).checked = true;

        importJsonBtn.disabled = false;
        importJsonBtn.focus();

        openModal(
            importModal,
            $("confirmImportBtn")
        );

    } catch (error) {
        pendingImportedTasks = null;

        console.error(error);

        showToast(
            error.message || "Unable to import tasks.",
            "error"
        );

    } finally {
        importFileInput.value = "";
        importJsonBtn.disabled = false;
    }
}

function closeImportModal() {
    pendingImportedTasks = null;

    closeModal(importModal);
}

function confirmImportTasks() {
    if (!Array.isArray(pendingImportedTasks)) {
        showToast("No valid backup selected.", "error");
        return;
    }

    const mode = document.querySelector(
        'input[name="importMode"]:checked'
    ).value;

    let updatedTasks;
    let message;

    if (mode === "replace") {
        const confirmed = confirm(
            "This will replace all existing tasks. Continue?"
        );

        if (!confirmed) {
            return;
        }

        updatedTasks = prepareReplacementTasks(
            pendingImportedTasks
        );

        message = `${updatedTasks.length} tasks restored successfully.`;

    } else {
        const result = mergeImportedTasks(
            pendingImportedTasks
        );

        updatedTasks = result.tasks;

        message =
            `${result.addedCount} tasks imported. ` +
            `${result.skippedCount} duplicate tasks skipped.`;
    }

    if (!updateTasks(updatedTasks)) {
        return;
    }

    resetFilters();
    closeImportModal();

    showToast(message, "success");
}


// Keyboard Shortcuts

function openShortcutsModal() {
    openModal(
        shortcutsModal,
        $("closeShortcutsBtn")
    );
}

function closeActiveModal() {
    const activeModal = getActiveModal();

    if (activeModal === taskModal) {
        closeTaskModal();

    } else if (activeModal === importModal) {
        closeImportModal();

    } else if (activeModal === shortcutsModal) {
        closeModal(shortcutsModal);
    }
}

function trapModalFocus(event, modal) {
    const elements = Array.from(
        modal.querySelectorAll(
            "button, input, select, textarea, a[href], [tabindex]"
        )
    ).filter((element) => {
        return (
            !element.disabled &&
            element.type !== "hidden" &&
            element.tabIndex >= 0 &&
            element.getClientRects().length > 0
        );
    });

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (!first || !last) {
        return;
    }

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();

    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

document.addEventListener("keydown", (event) => {
    const activeModal = getActiveModal();

    if (activeModal) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeActiveModal();

        } else if (event.key === "Tab") {
            trapModalFocus(event, activeModal);
        }

        return;
    }

    const target = event.target;

    const isTyping =
        target.matches("input, textarea, select") ||
        target.isContentEditable;

    if (
        isTyping ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat
    ) {
        return;
    }

    switch (event.key.toLowerCase()) {

        case "n":
            event.preventDefault();
            openAddTaskModal();
            break;

        case "/":
            event.preventDefault();
            searchInput.focus();
            break;

        case "t":
            event.preventDefault();
            toggleTheme();
            break;

        case "r":
            event.preventDefault();
            resetFilters();
            showToast("Task controls reset.", "info");
            break;

        case "?":
            event.preventDefault();
            openShortcutsModal();
            break;
    }
});


// Sidebar Navigation

function updateActiveNavigation() {
    const hash = window.location.hash || "#dashboard";

    menuItems.forEach((item) => {
        const isActive = item.getAttribute("href") === hash;

        item.classList.toggle("active", isActive);

        if (isActive) {
            item.setAttribute("aria-current", "location");

        } else {
            item.removeAttribute("aria-current");
        }
    });
}

window.addEventListener(
    "hashchange",
    updateActiveNavigation
);


// Event Listeners

addTaskBtn.addEventListener("click", () => {
    openAddTaskModal();
});

document.querySelectorAll(".column-add-btn").forEach((button) => {
    button.addEventListener("click", () => {
        openAddTaskModal(button.dataset.addStatus);
    });
});

$("closeModal").addEventListener(
    "click",
    closeTaskModal
);

$("cancelTaskBtn").addEventListener(
    "click",
    closeTaskModal
);

taskForm.addEventListener(
    "submit",
    saveTask
);

taskTitleInput.addEventListener("input", () => {
    taskTitleInput.setCustomValidity("");
});

searchInput.addEventListener(
    "input",
    renderTasks
);

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";

    renderTasks();

    searchInput.focus();
});

[
    categoryFilter,
    priorityFilter,
    deadlineFilter,
    sortTasksSelect
].forEach((element) => {
    element.addEventListener("change", renderTasks);
});

$("resetFiltersBtn").addEventListener(
    "click",
    resetFilters
);

$("emptyResetBtn").addEventListener("click", () => {
    resetFilters();
    searchInput.focus();
});

$("themeToggle").addEventListener(
    "click",
    toggleTheme
);

$("exportJsonBtn").addEventListener(
    "click",
    exportTasksAsJSON
);

$("exportCsvBtn").addEventListener(
    "click",
    exportTasksAsCSV
);

importJsonBtn.addEventListener("click", () => {
    importFileInput.value = "";
    importFileInput.click();
});

importFileInput.addEventListener(
    "change",
    handleImportFile
);

$("closeImportModal").addEventListener(
    "click",
    closeImportModal
);

$("cancelImportBtn").addEventListener(
    "click",
    closeImportModal
);

$("confirmImportBtn").addEventListener(
    "click",
    confirmImportTasks
);

$("shortcutsBtn").addEventListener(
    "click",
    openShortcutsModal
);

$("closeShortcutsBtn").addEventListener("click", () => {
    closeModal(shortcutsModal);
});

document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeActiveModal();
        }
    });
});


// Refresh Deadlines

let currentDate = getLocalDateString();

function refreshDeadlines() {
    const today = getLocalDateString();

    if (today !== currentDate) {
        currentDate = today;
        renderTasks();
    }
}

setInterval(refreshDeadlines, 60000);

window.addEventListener("focus", refreshDeadlines);

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshDeadlines();
    }
});


// Initialize Application

updateThemeButton();
updateActiveNavigation();
renderTasks();