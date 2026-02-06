document.addEventListener('DOMContentLoaded', () => {

  // === СТАН ===
  let selectedTaskIndex = null;
  let timer = null;
  let timeLeft = 1 * 60;

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // === DOM ===
  const main = document.getElementById('main-container');
  const tasksScreen = document.getElementById('tasks-container');

  const showBtn = document.getElementById('show-tasks-btn');
  const backBtn = document.getElementById('back-btn');

  const input = document.getElementById('new-task');
  const addBtn = document.getElementById('add-task-btn');
  const list = document.getElementById('tasks-list');

  const currentTaskEl = document.getElementById('current-task');
  const timerEl = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-btn');

  // === COINS ===
  let coins = 0;
  const coinsEl = document.getElementById('coins-count');

  function updateCoinsUI() {
    coinsEl.textContent = coins;
  }

  // === STORAGE ===
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // === TIMER ===
  function updateTimerUI() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
        tasks[selectedTaskIndex].timeSpent += 1;
  saveTasks();
  renderTasks();
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
    timeLeft = 1 * 60;
    updateTimerUI();
  }

  // === TASKS ===
  function renderTasks() {
    list.innerHTML = '';

    tasks.forEach((task, index) => {
      const li = document.createElement('li');

      if (task.done) li.classList.add('done');
      if (index === selectedTaskIndex) li.classList.add('selected');

      // radio
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selected-task';
      radio.checked = index === selectedTaskIndex;

      radio.addEventListener('change', () => {
        selectedTaskIndex = index;
        currentTaskEl.textContent = task.text;
        resetTimer();
        renderTasks();
      });

      // text
      const span = document.createElement('span');
      span.textContent = `${task.text} (${task.timeSpent} хв)`;
      span.style.flexGrow = '1';

      // done
      const doneBtn = document.createElement('button');
      doneBtn.textContent = '✓';
      doneBtn.onclick = () => {
        task.done = !task.done;
        saveTasks();
        renderTasks();
      };

      // remove
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

      li.appendChild(radio);
      li.appendChild(span);
      li.appendChild(doneBtn);
      li.appendChild(removeBtn);

      list.appendChild(li);
    });
  }

  // === EVENTS ===
  addBtn.addEventListener('click', () => {
    const value = input.value.trim();
    if (!value) return;

    tasks.push({
      text: value,
      done: false,
      timeSpent: 0
    });

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

  // === INIT ===
  updateCoinsUI();
  renderTasks();
  updateTimerUI();

});
