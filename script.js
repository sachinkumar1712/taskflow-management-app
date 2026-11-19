
"use strict";

// Sample Tasks
const tasks = [
    {
        id: 1,
        title: "Design Dashboard UI",
        description: "Create a modern task management dashboard.",
        category: "Design",
        priority: "high",
        status: "todo",
        dueDate: ""
    },
    {
        id: 2,
        title: "Build Navigation Sidebar",
        description: "Develop a responsive sidebar using CSS.",
        category: "Development",
        priority: "medium",
        status: "todo",
        dueDate: ""
    },
    {
        id: 3,
        title: "Implement Task Management",
        description: "Create task management functionality.",
        category: "Development",
        priority: "high",
        status: "progress",
        dueDate: ""
    },
    {
        id: 4,
        title: "Project Setup",
        description: "Initialize project files and GitHub repository.",
        category: "Development",
        priority: "low",
        status: "completed",
        dueDate: ""
    }
];

// DOM Elements
const todoTasks = document.getElementById("todoTasks");
const inProgressTasks = document.getElementById("inProgressTasks");
const completedTasksList = document.getElementById("completedTasksList");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");

// Create Task Card
function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.dataset.id = task.id;

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

    if (task.dueDate) {
        const dueDate = document.createElement("span");
        dueDate.className = "task-due-date";
        dueDate.textContent = `Due: ${task.dueDate}`;
        card.appendChild(dueDate);
    }

    return card;
}

// Render Tasks
function renderTasks() {
    todoTasks.innerHTML = "";
    inProgressTasks.innerHTML = "";
    completedTasksList.innerHTML = "";

    tasks.forEach((task) => {
        const card = createTaskCard(task);

        if (task.status === "todo") {
            todoTasks.appendChild(card);
        } else if (task.status === "progress") {
            inProgressTasks.appendChild(card);
        } else if (task.status === "completed") {
            completedTasksList.appendChild(card);
        }
    });

    updateTaskCounts();
}

// Update Task Counters
function updateTaskCounts() {
    const todo = tasks.filter((task) => task.status === "todo").length;
    const progress = tasks.filter((task) => task.status === "progress").length;
    const completed = tasks.filter((task) => task.status === "completed").length;

    document.getElementById("totalTasks").textContent = tasks.length;
    document.getElementById("progressTasks").textContent = progress;
    document.getElementById("completedTasks").textContent = completed;

    document.getElementById("todoCount").textContent = todo;
    document.getElementById("progressCount").textContent = progress;
    document.getElementById("completedCount").textContent = completed;
}

// Open Task Modal
function openTaskModal() {
    taskForm.reset();
    taskModal.hidden = false;
    document.body.classList.add("modal-open");
    taskTitleInput.focus();
}

// Close Task Modal
function closeTaskModal() {
    taskModal.hidden = true;
    document.body.classList.remove("modal-open");
    addTaskBtn.focus();
}

// Generate Task ID
function generateTaskId() {
    return Math.max(0, ...tasks.map((task) => task.id)) + 1;
}

// Add New Task
function addNewTask(event) {
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const category = document.getElementById("taskCategory").value;
    const priority = document.getElementById("taskPriority").value;
    const dueDate = document.getElementById("taskDueDate").value;
    const status = document.getElementById("taskStatus").value;

    if (!title) {
        taskTitleInput.setCustomValidity("Please enter a task title.");
        taskTitleInput.reportValidity();
        return;
    }

    const newTask = {
        id: generateTaskId(),
        title,
        description,
        category,
        priority,
        status,
        dueDate
    };

    tasks.push(newTask);
    renderTasks();
    closeTaskModal();
}

// Event Listeners
addTaskBtn.addEventListener("click", openTaskModal);
closeModalBtn.addEventListener("click", closeTaskModal);
cancelTaskBtn.addEventListener("click", closeTaskModal);
taskForm.addEventListener("submit", addNewTask);

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

// Initialize Dashboard
renderTasks();
