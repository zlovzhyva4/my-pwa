if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker зареєстрований!'))
    .catch(err => console.log('Service Worker не зареєстрований:', err));
}

// Перемикаємо видимість між головною і Tasks
const showTasksBtn = document.getElementById('show-tasks-btn');
const backBtn = document.getElementById('back-btn');
const mainContainer = document.getElementById('main-container');
const tasksContainer = document.getElementById('tasks-container');

showTasksBtn.addEventListener('click', () => {
  mainContainer.style.display = 'none';
  tasksContainer.style.display = 'block';
});

backBtn.addEventListener('click', () => {
  tasksContainer.style.display = 'none';
  mainContainer.style.display = 'block';
});

// Робота зі списком задач
const addTaskBtn = document.getElementById('add-task-btn');
const newTaskInput = document.getElementById('new-task');
const tasksList = document.getElementById('tasks-list');

// Завантаження задач з localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
  tasksList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.textContent = task;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '-';
    deleteBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(deleteBtn);
    tasksList.appendChild(li);
  });
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

addTaskBtn.addEventListener('click', () => {
  const taskText = newTaskInput.value.trim();
  if (taskText) {
    tasks.push(taskText);
    saveTasks();
    renderTasks();
    newTaskInput.value = '';
  }
});

// Рендер при завантаженні
renderTasks();
