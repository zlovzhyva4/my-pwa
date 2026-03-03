document.addEventListener('DOMContentLoaded', () => {

  // === РЕЄСТРАЦІЯ SERVICE WORKER ===
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('Service Worker зареєстровано:', registration);
        })
        .catch(registrationError => {
          console.log('Помилка реєстрації Service Worker:', registrationError);
        });
    });
  }

  // === ORIENTATION LOCK (Спроба заблокувати поворот) ===
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('portrait').catch(e => console.log('Orientation lock failed (потрібен встановлений PWA):', e));
  }

  // === СТАН ===
  let selectedTaskIndex = null;
  let timer = null;
  let timeLeft = 25 * 60;
  let initialDuration = timeLeft;
  let endTime = null;
  let isRestMode = false;

// ВСТАВЛЯЙ СЮДИ:
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let clickBuffer = null;
const soundBase64 = "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAACAAICAgICAgICA/v8AgP7/AIAAgP7/AIAAgP7/AIAAgP7/AIAAgP7/AIAAgP7/AIAAgP7/AAAAAA==";

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
    // Декодуємо аудіо дані один раз для високої продуктивності
    fetch(soundBase64)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(decodedData => {
        clickBuffer = decodedData;
      })
      .catch(e => console.error("Failed to decode audio data", e));
  } catch (e) {
    console.error("Web Audio API is not supported in this browser", e);
  }
}

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
  const progressBar = document.getElementById('progress-bar');
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

    // Візуальна індикація: червоний - робота, зелений - відпочинок
    timerEl.style.color = isRestMode ? '#008000' : '#cc0000';

    // Оновлення прогрес-бару
    if (progressBar) {
      const percent = initialDuration > 0 ? (timeLeft / initialDuration) * 100 : 0;
      progressBar.style.width = `${percent}%`;
      progressBar.style.backgroundColor = isRestMode ? '#008000' : '#0a246a';
    }
  }

  function playClick() {
    if (!audioCtx || !clickBuffer) {
      return;
    }

    // Політика браузерів вимагає "прокидати" контекст після дій користувача
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const source = audioCtx.createBufferSource();
    source.buffer = clickBuffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // Гучність 0.5

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(0);
  }

  function playAlarm() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    
    // Генеруємо 3 коротких сигнали
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine'; // Синусоїда (м'який звук)
      osc.frequency.setValueAtTime(880, now + i * 0.5); // Нота A5
      
      gain.gain.setValueAtTime(0, now + i * 0.5);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.5 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.5 + 0.3);
      
      osc.start(now + i * 0.5);
      osc.stop(now + i * 0.5 + 0.3);
    }
  }

  function sendNotification(title, body) {
    // Використовуємо Service Worker для показу сповіщень
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: 'images/icon-180.png'
        });
      });
    }
  }

  function changeTimerValue(direction) {
    if (!timer) {
      timeLeft += direction * 60;
      if (timeLeft < 60) timeLeft = 60; 
      if (timeLeft > 60 * 60) timeLeft = 60 * 60; // Максимум 60 хвилин
      initialDuration = timeLeft;
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

    endTime = Date.now() + timeLeft * 1000;

    localStorage.setItem('endTime', endTime);
localStorage.setItem('isRestMode', isRestMode);
    

    timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);

      if (diff <= 0) {
        playAlarm();

        if (!isRestMode) {
          sendNotification('Робота завершена!', 'Час відпочити.');
          // === РОБОТА ЗАВЕРШЕНА ===
          tasks[selectedTaskIndex].timeSpent += Math.round(initialDuration / 60);
          const reward = tasks[selectedTaskIndex].coins || 0;
          coins += reward;
          saveCoins();
          saveTasks();
          renderTasks();
          updateCoinsUI();

          // Автоматичний старт відпочинку (5 хв)
          isRestMode = true;
          timeLeft = 5 * 60;
          initialDuration = timeLeft;
          endTime = Date.now() + timeLeft * 1000;
          updateTimerUI();
        } else {
          sendNotification('Відпочинок завершено!', 'Пора до роботи.');
          // === ВІДПОЧИНОК ЗАВЕРШЕНО ===
          resetTimer();
          showStartOnly();
        }
      } else {
        timeLeft = diff;
        updateTimerUI();
      }
    }, 200);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    if (crownContainer) crownContainer.classList.remove('disabled');
  }

  function resetTimer() {
    clearInterval(timer);
    timer = null;
    isRestMode = false;
    timeLeft = 25 * 60;
    initialDuration = timeLeft;
    if (crownContainer) crownContainer.classList.remove('disabled');
    updateTimerUI();

    localStorage.removeItem('endTime');
localStorage.removeItem('isRestMode');
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

  // === АНІМАЦІЯ МОНЕТКИ ===
  function animateCoin(startX, startY) {
    const coin = document.createElement('div');
    coin.className = 'flying-coin';
    coin.textContent = '🪙'; // Можна замінити на картинку
    document.body.appendChild(coin);

    // Початкова позиція (там де клікнули)
    coin.style.transform = `translate(${startX}px, ${startY}px)`;

    // Цільова позиція (контейнер з монетами)
    const targetRect = document.getElementById('coins-container').getBoundingClientRect();
    const targetX = targetRect.left + (targetRect.width / 2) - 12; // -12 для центрування (половина розміру)
    const targetY = targetRect.top + (targetRect.height / 2) - 12;

    // Запускаємо анімацію в наступному кадрі
    requestAnimationFrame(() => {
      coin.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.5)`;
      coin.style.opacity = '0';
    });

    coin.addEventListener('transitionend', () => {
      coin.remove();
    });
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

      doneBtn.onclick = (e) => {
        task.done = !task.done;

        const reward = task.coins || 0;
        if (task.done) {
          coins += reward;
          animateCoin(e.clientX, e.clientY);
        } else {
          coins = Math.max(0, coins - reward);
        }
        saveCoins();
        updateCoinsUI();

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
    initAudio(); // Активуємо аудіо контекст при старті
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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
        initAudio(); // Ініціалізуємо аудіо при першому дотику
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
        initAudio(); // Ініціалізуємо аудіо при першому кліку
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

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timer && endTime) {
    if (Date.now() >= endTime) {
      clearInterval(timer);
      timer = null;
      playAlarm();
      sendNotification('🍅 Помодоро завершено!', 'Час відпочити!');

      tasks[selectedTaskIndex].timeSpent += Math.round(initialDuration / 60);
      const reward = tasks[selectedTaskIndex].coins || 0;
      coins += reward;
      saveCoins();
      saveTasks();
      renderTasks();
      updateCoinsUI();

      isRestMode = true;
      timeLeft = 5 * 60;
      initialDuration = timeLeft;
      endTime = Date.now() + timeLeft * 1000;
      localStorage.setItem('endTime', endTime);
      localStorage.setItem('isRestMode', isRestMode);

      timer = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);
        if (diff <= 0) {
          sendNotification('✅ Відпочинок завершено!', 'Пора до роботи.');
          resetTimer();
          showStartOnly();
        } else {
          timeLeft = diff;
          updateTimerUI();
        }
      }, 200);

      updateTimerUI();
    }
  }
});
  // === INIT ===
  updateCoinsUI();
  renderTasks();
  updateTimerUI();
  showStartOnly();

});