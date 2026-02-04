document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-container');
  const tasks = document.getElementById('tasks-container');

  const showBtn = document.getElementById('show-tasks-btn');
  const backBtn = document.getElementById('back-btn');

  showBtn.addEventListener('click', () => {
    main.style.display = 'none';
    tasks.style.display = 'block';
  });

  backBtn.addEventListener('click', () => {
    tasks.style.display = 'none';
    main.style.display = 'block';
  });
});
