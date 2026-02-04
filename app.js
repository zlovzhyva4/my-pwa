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

// Pomodoro таймер
let selectedTaskIndex = null;
let timerSeconds = 25 * 60;
let interval = null;

const currentTaskEl = document.getElementById('current-task');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');

// Оновлення відліку
function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  timerEl.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

// Start / Stop / Reset
function startTimer() {
  if (interval || selectedTaskIndex === null) return;
  interval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(interval);
      interval = null;
      alert(`Час Pomodoro для "${tasks[selectedTaskIndex]}" закінчився!`);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
  interval = null;
}

function resetTimer() {
  stopTimer();
  timerSeconds = 25 * 60;
  updateTimerDisplay();
}

// Додаємо радіо-кнопку при рендері задач
function addRadioButtons() {
  const lis = document.querySelectorAll('#tasks-list li');
  lis.forEach((li, idx) => {
    // якщо радіо вже є, не додаємо вдруге
    if (li.querySelector('input[type="radio"]')) return;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'selected-task';
    radio.addEventListener('change', () => {
      selectedTaskIndex = idx;
      currentTaskEl.textContent = tasks[idx];
      resetTimer();
      highlightSelectedTask();
    });

    li.prepend(radio);
  });
}

function highlightSelectedTask() {
  const lis = document.querySelectorAll('#tasks-list li');
  lis.forEach((li, idx) => {
    if (idx === selectedTaskIndex) li.classList.add('selected');
    else li.classList.remove('selected');
  });
}

// Виклики
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

// Після рендера задач додаємо радіо-кнопки
renderTasks = (function(origRender) {
  return function() {
    origRender();
    addRadioButtons();
  }
})(renderTasks);

updateTimerDisplay();
