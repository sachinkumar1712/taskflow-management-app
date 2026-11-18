"use strict";
// Sample Tasks
const tasks = [
    {
        id: 1,
        title: "Design Dashboard UI",
        description: "Create a modern task management dashboard.",
        category: "Design",
        priority: "high",
        status: "todo"
    },
    {
        id: 2,
        title: "Build Navigation Sidebar",
        description: "Develop a responsive sidebar using CSS.",
        category: "Development",
        priority: "medium",
        status: "todo"
    },
    {
        id: 3,
        title: "Implement Task Management",
        description: "Create task management functionality.",
        category: "Development",
        priority: "high",
        status: "progress"
    },
    {
        id: 4,
        title: "Project Setup",
        description: "Initialize project files and GitHub repository.",
        category: "Development",
        priority: "low",
        status: "completed"
    }
];

// DOM Elements
const todoTasks = document.getElementById("todoTasks");
const inProgressTasks = document.getElementById("inProgressTasks");
const completedTasksList = document.getElementById("completedTasksList");
const addTaskBtn = document.getElementById("addTaskBtn");

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

// Add Task Button
addTaskBtn.addEventListener("click", () => {
    alert("Add Task functionality is coming soon!");
});

// Initialize Dashboard
renderTasks();
