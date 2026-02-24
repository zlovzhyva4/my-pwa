document.addEventListener('DOMContentLoaded', () => {

  // === СТАН ===
  let selectedTaskIndex = null;
  let timer = null;
  let timeLeft = 25 * 60;

// ВСТАВЛЯЙ СЮДИ:
const clickSound = new Audio("data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAACAAICAgICAgICA/v8AgP7/AIAAgP7/AIAAgP7/AIAAgP7/AIAAgP7/AIAAgP7/AIAAgP7/AAAAAA==");
clickSound.volume = 0.5;

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // === DOM ===
  const main = document.getElementById('main-container');
  const tasksScreen = document.getElementById('tasks-container');
  const learnScreen = document.getElementById('learn-container');

  const showBtn = document.getElementById('show-tasks-btn');
  const showLearnBtn = document.getElementById('show-learn-btn');
  const homeBtn = document.getElementById('home-btn');

  const input = document.getElementById('new-task');
  const coinsInput = document.getElementById('new-task-coins');
  const addBtn = document.getElementById('add-task-btn');
  const list = document.getElementById('tasks-list');

  const currentTaskEl = document.getElementById('current-task');
  const timerEl = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const stopBtn = document.getElementById('stop-btn');
  const crownContainer = document.querySelector('.win98-crown-container');
  const ridges = document.querySelector('.win98-ridges');

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

  function playClick() {
    clickSound.pause();
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.log("Sound blocked"));
  }

  function changeTimerValue(direction) {
    if (!timer) {
      timeLeft += direction * 60;
      if (timeLeft < 60) timeLeft = 60; 
      if (timeLeft > 60 * 60) timeLeft = 60 * 60; // Максимум 60 хвилин
      updateTimerUI();
      playClick();
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }

  function startTimer() {
    if (timer) return;

    if (selectedTaskIndex === null) {
      alert('Спочатку вибери задачу');
      return;
    }
    if (crownContainer) crownContainer.classList.add('disabled');

    timer = setInterval(() => {
      timeLeft--;
      updateTimerUI();

      if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;

        tasks[selectedTaskIndex].timeSpent += 1;

        // 👉 нарахування coins
        const reward = tasks[selectedTaskIndex].coins || 0;
        coins += reward;
        saveCoins();

        saveTasks();
        renderTasks();
        updateCoinsUI();

        alert(`Pomodoro завершено (+${reward} coins)`);
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    if (crownContainer) crownContainer.classList.remove('disabled');
  }

  function resetTimer() {
    clearInterval(timer);
    timer = null;
    timeLeft = 25 * 60;
    if (crownContainer) crownContainer.classList.remove('disabled');
    updateTimerUI();
  }

  function showStartOnly() {
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'none';
  }

  function showPauseAndStop() {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    stopBtn.style.display = 'inline-block';
  }

  // === TASKS ===
  function renderTasks() {
    list.innerHTML = '';

    tasks.forEach((task, index) => {
      const li = document.createElement('li');

      if (task.done) li.classList.add('done');
      if (index === selectedTaskIndex) li.classList.add('selected');

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

      const taskCoins = task.coins != null ? task.coins : 0;

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = `${task.text} (${task.timeSpent} хв)${taskCoins ? ` · ${taskCoins} coin` : ''}`;
      span.style.flexGrow = '1';

      const doneBtn = document.createElement('button');
      doneBtn.textContent = task.done ? '✓' : 'OK';

      doneBtn.onclick = () => {
        task.done = !task.done;
        saveTasks();
        renderTasks();
      };

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '−';

      removeBtn.onclick = () => {
        tasks.splice(index, 1);
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
    learnScreen.style.display = 'none';
    tasksScreen.style.display = 'block';
  });

  showLearnBtn.addEventListener('click', () => {
    main.style.display = 'none';
    tasksScreen.style.display = 'none';
    learnScreen.style.display = 'block';
  });

  homeBtn.addEventListener('click', () => {
    tasksScreen.style.display = 'none';
    learnScreen.style.display = 'none';
    main.style.display = 'block';
  });

  startBtn.addEventListener('click', () => {
    startTimer();
    showPauseAndStop();
  });

  pauseBtn.addEventListener('click', () => {
    stopTimer();
    showStartOnly();
  });

  stopBtn.addEventListener('click', () => {
    resetTimer();
    showStartOnly();
  });

  // === КРУТИЛКА (ОНОВЛЕНО) ===
if (crownContainer && ridges) {
    let currentY = 0;
    let startY = 0;
    let isDragging = false;
    const stepHeight = 5; // Висота однієї засічки в CSS

    const updateRotation = (delta) => {
        // Зупиняємо анімацію, якщо вперлися в ліміти (60с або 60хв)
        if (timeLeft >= 3600 && delta > 0 && currentY >= 0) return;
        if (timeLeft <= 60 && delta < 0 && currentY <= 0) return;

        currentY += delta;
        
        // Використовуємо % щоб візуально зациклити рух градієнта
        // 5 — це висота одного циклу градієнта в CSS
        const visualOffset = currentY % stepHeight;
        ridges.style.transform = `translateY(${visualOffset}px)`;

        // Додатково: змінюємо час таймера залежно від прокрутки
        if (Math.abs(currentY) >= stepHeight) {
            const direction = currentY > 0 ? 1 : -1;
            changeTimerValue(direction); 
            currentY = 0; // Скидаємо після кожного "кроку"
        }
    };

    // Touch події
    crownContainer.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        if (navigator.vibrate) navigator.vibrate(10);
    }, { passive: true });

    crownContainer.addEventListener('touchmove', (e) => {
        const moveY = e.touches[0].clientY;
        const delta = startY - moveY; // Інвертуємо: рух вниз зменшує значення
        updateRotation(delta);
        startY = moveY;
    }, { passive: false }); // false дозволяє preventDefault, якщо треба

    // Mouse події (для комп'ютера)
    crownContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        e.preventDefault(); // Щоб не виділявся текст
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const moveY = e.clientY;
        const delta = startY - moveY;
        updateRotation(delta);
        startY = moveY;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Mouse wheel (наведення на коронку)
    crownContainer.addEventListener('wheel', (e) => {
        e.preventDefault(); // Забороняємо скрол сторінки
        const delta = e.deltaY > 0 ? -5 : 5;
        updateRotation(delta);
    }, { passive: false });
}

  // === INIT ===
  updateCoinsUI();
  renderTasks();
  updateTimerUI();
  showStartOnly();

});