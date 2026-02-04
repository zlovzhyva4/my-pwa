document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-container');
  const tasksScreen = document.getElementById('tasks-container');

  const showBtn = document.getElementById('show-tasks-btn');
  const backBtn = document.getElementById('back-btn');

  const input = document.getElementById('new-task');
  const addBtn = document.getElementById('add-task-btn');
  const list = document.getElementById('tasks-list');

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  function renderTasks() {
    list.innerHTML = '';

    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.textContent = task;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '−';

      removeBtn.addEventListener('click', () => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
      });

      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  addBtn.addEventListener('click', () => {
    const value = input.value.trim();
    if (!value) return;

    tasks.push(value);
    input.value = '';
    saveTasks();
    renderTasks();
  });

  showBtn.addEventListener('click', () => {
    main.style.display = 'none';
    tasksScreen.style.display = 'block';
  });

  backBtn.addEventListener('click', () => {
    tasksScreen.style.display = 'none';
    main.style.display = 'block';
  });

  renderTasks();
});
