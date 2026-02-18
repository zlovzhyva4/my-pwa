document.addEventListener('DOMContentLoaded', () => {

  // === СТАН ===
  let selectedTaskIndex = null;
  let timer = null;
  let timeLeft = 25 * 60;

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // === DOM ===
  const main = document.getElementById('main-container');
  const tasksScreen = document.getElementById('tasks-container');

  const showBtn = document.getElementById('show-tasks-btn');
  const homeBtn = document.getElementById('home-btn');

  const input = document.getElementById('new-task');
  const coinsInput = document.getElementById('new-task-coins');
  const addBtn = document.getElementById('add-task-btn');
  const list = document.getElementById('tasks-list');

  const currentTaskEl = document.getElementById('current-task');
  const timerEl = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-btn');

  // === COINS ===
  const COINS_STORAGE_KEY = 'pwa-coins';
  let coins = parseInt(localStorage.getItem(COINS_STORAGE_KEY), 10) || 0;
  const coinsEl = document.getElementById('coins-count');

  function updateCoinsUI() {
    coinsEl.textContent = coins;
  }

  function saveCoins() {
    localStorage.setItem(COINS_STORAGE_KEY, String(coins));
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
    timeLeft = 25 * 60;
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
      const taskCoins = task.coins != null ? task.coins : 0;
      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = `${task.text} (${task.timeSpent} хв)${taskCoins ? ` · ${taskCoins} coin${taskCoins !== 1 ? 's' : ''}` : ''}`;
      span.style.flexGrow = '1';

      // done
      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'task-done-btn' + (task.done ? ' is-done' : '');
      doneBtn.textContent = task.done ? '✓ Виконано' : 'Готово';
      doneBtn.onclick = (e) => {
        e.stopPropagation();
        const wasDone = task.done;
        task.done = !task.done;
        const alreadyAwarded = task.coinsAwarded === true;
        if (!wasDone && task.done && !alreadyAwarded) {
          const toAdd = task.coins != null ? task.coins : 0;
          coins += toAdd;
          task.coinsAwarded = true;
          saveCoins();
          updateCoinsUI();
        }
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

    const coinCount = Math.max(0, parseInt(coinsInput.value, 10) || 0);

    tasks.push({
      text: value,
      done: false,
      timeSpent: 0,
      coins: coinCount
    });

    input.value = '';
    coinsInput.value = '0';
    saveTasks();
    renderTasks();
  });

  showBtn.addEventListener('click', () => {
    main.style.display = 'none';
    tasksScreen.style.display = 'block';
  });

  homeBtn.addEventListener('click', () => {
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
