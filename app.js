document.addEventListener('DOMContentLoaded', () => {

  // === Глобальні змінні ===
  let selectedTaskIndex = null;
  const currentTaskEl = document.getElementById('current-task');

  // Таймер Pomodoro
  let timer = null;
  let timeLeft = 25 * 60;
  const timerEl = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Елементи екрану задач
  const main = document.getElementById('main-container');
  const tasksScreen = document.getElementById('tasks-container');
  const showBtn = document.getElementById('show-tasks-btn');
  const backBtn = document.getElementById('back-btn');

  // Додавання задач
  const input = document.getElementById('new-task');
  const addBtn = document.getElementById('add-task-btn');
  const list = document.getElementById('tasks-list');

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // === Функції ===

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function updateTimerUI() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  }

  function startTimer() {
    if (timer) return;

    if (selectedTaskIndex === null) {
      alert('Спочатку вибери задачу');
      return;
    }

    timer = setInterval(() => {
      timeLeft--;
      updateTimerUI();

      if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        alert('Pomodoro завершено 🍅');
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function resetTimer() {
    clearInterval(timer);
    timer = null;
    timeLeft = 25 * 60;
    updateTimerUI();
  }

  function renderTasks() {
    list.innerHTML = '';

    tasks.forEach((task, index) => {
      const li = document.createElement('li');

      // Радіо-кнопка для вибору задачі
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selected-task';
      radio.checked = index === selectedTaskIndex;

      radio.addEventListener('change', () => {
        selectedTaskIndex = index;
        currentTaskEl.textContent = task;
        resetTimer();
        renderTasks();
      });

      // Назва задачі
      const span = document.createElement('span');
      span.textContent = task;
      span.style.flexGrow = '1';

      // Кнопка видалення
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '−';
      removeBtn.onclick = () => {
        tasks.splice(index, 1);

        if (selectedTaskIndex === index) {
          selectedTaskIndex = null;
          currentTaskEl.textContent = '—';
          resetTimer();
        } else if (selectedTaskIndex > index) {
          selectedTaskIndex--;
        }

        saveTasks();
        renderTasks();
      };

      // Підсвітка вибраної задачі
      if (index === selectedTaskIndex) {
        li.classList.add('selected');
      } else {
        li.classList.remove('selected');
      }

      li.appendChild(radio);
      li.appendChild(span);
      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  }

  // === Обробники кнопок ===
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

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);

  // === Перший рендер ===
  renderTasks();
  updateTimerUI();

});
