const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

let tasks = JSON.parse(localStorage.getItem('tasks')) || {};

days.forEach((_, i) => {
  if (!tasks[i]) {
    tasks[i] = [];
  }
});

let habitsData = JSON.parse(localStorage.getItem('habitsData')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveHabitsData() {
  localStorage.setItem('habitsData', JSON.stringify(habitsData));
  if (currentView === 'habits') {
    updateAllWeekCircles();
  }
}

function clearAllTasks() {
  if (confirm("Вы уверены, что хотите удалить все задачи?")) {
    days.forEach((_, i) => {
      tasks[i] = [];
    });
    saveTasks();
    renderPlanner();
  }
}

function renderBarChart(updatedDayIndex = null) {
  const chartsContainer = document.getElementById('dayCharts');
  if (updatedDayIndex === null) {
    chartsContainer.innerHTML = '';

    days.forEach((day, index) => {
      const barItem = document.createElement('div');
      barItem.className = 'bar-item';

      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = '0%';
      barItem.appendChild(bar);

      const label = document.createElement('div');
      label.className = 'bar-label';
      label.textContent = day;
      barItem.appendChild(label);

      chartsContainer.appendChild(barItem);

      const completed = tasks[index].filter(t => t.completed).length;
      const total = tasks[index].length;
      const value = total ? Math.round((completed / total) * 100) : 0;

      requestAnimationFrame(() => {
        bar.style.height = `${value}%`;
      });
    });
  } else {
    const barItems = chartsContainer.querySelectorAll('.bar-item');
    const barItem = barItems[updatedDayIndex];
    if (barItem) {
      const bar = barItem.querySelector('.bar');
      const completed = tasks[updatedDayIndex].filter(t => t.completed).length;
      const total = tasks[updatedDayIndex].length;
      const value = total ? Math.round((completed / total) * 100) : 0;

      bar.style.height = '0%'; 
      requestAnimationFrame(() => {
        bar.style.height = `${value}%`;
      });
    }
  }
}

function renderPlanner() {
  const container = document.getElementById('daysContainer');
  if (!container) return;

  container.innerHTML = '';

  let totalCompleted = 0;
  let totalTasks = 0;

  days.forEach((day, index) => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-container';

    const title = document.createElement('div');
    title.className = 'day-title';
    title.textContent = day;
    dayDiv.appendChild(title);

    const taskList = document.createElement('ul');
    taskList.className = 'task-list';
    taskList.id = `taskList-${index}`;
    dayDiv.appendChild(taskList);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Добавить задачу...';
    input.className = 'task-input';
    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        const text = input.value.trim();
        if (text) {
          tasks[index].push({ text, completed: false });
          input.value = '';
          saveTasks();
          renderPlanner(); 
        }
      }
    };
    dayDiv.appendChild(input);

    let completedCount = 0;
    tasks[index].forEach((task, taskIndex) => {
      const li = document.createElement('li');
      li.className = 'task-item';

      if (task.completed) {
        li.classList.add('completed');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.onchange = () => {
        tasks[index][taskIndex].completed = checkbox.checked;
        saveTasks();
        renderPlanner(); 
      };

      const span = document.createElement('span');
      span.textContent = task.text;

      li.appendChild(checkbox);
      li.appendChild(span);
      taskList.appendChild(li);

      if (task.completed) {
        completedCount++;
      }
    });

    totalCompleted += completedCount;
    totalTasks += tasks[index].length;

    container.appendChild(dayDiv);
  });

  renderBarChart(null);

  const weekValue = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const progressBar = document.getElementById('weekProgressBar');
  const progressText = document.getElementById('weekProgressText');
  if (progressBar && progressText) {
    progressBar.style.setProperty('--value', weekValue + '%');
    progressText.textContent = weekValue + '%';
  }
}

function calculateWeekCompletion(weekIndex) {
  if (habitsData.length === 0) return 0;
  let totalCheckboxes = 0;
  let completedCheckboxes = 0;

  habitsData.forEach(habit => {
    if (habit.weeks[weekIndex] && habit.weeks[weekIndex].days) {
      days.forEach(dayIndex => {
        totalCheckboxes++;
        if (habit.weeks[weekIndex].days[dayIndex]) {
          completedCheckboxes++;
        }
      });
    } else {
      totalCheckboxes += 7;
    }
  });

  if (totalCheckboxes === 0) return 0;
  return Math.round((completedCheckboxes / totalCheckboxes) * 100);
}

function updateWeekCircle(weekIndex) {
  const circleContainer = document.querySelector(`.week-circle-container[data-week="${weekIndex}"]`);
  if (!circleContainer) return;

  const fill = circleContainer.querySelector('.circle-fill');
  const text = circleContainer.querySelector('.circle-text');

  const percentage = calculateWeekCompletion(weekIndex);
  text.textContent = `${percentage}%`;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const dashOffset = (1 - percentage / 100) * circumference;

  fill.style.strokeDasharray = `${circumference} ${circumference}`;
  fill.style.strokeDashoffset = circumference; 

  fill.style.transition = 'stroke-dashoffset 0.5s ease-in-out';
  fill.style.strokeDashoffset = dashOffset;
}

function updateAllWeekCircles() {
  for (let w = 0; w < 16; w++) {
    updateWeekCircle(w);
  }
}

function initHabitsTracker() {
  const habitsView = document.getElementById('habitsView');
  if (!habitsView) return;

  const addHabitButton = document.createElement('button');
  addHabitButton.textContent = 'Добавить привычку';
  addHabitButton.onclick = addNewHabit;
  habitsView.appendChild(addHabitButton);

  const tableContainer = document.createElement('div');
  tableContainer.id = 'habitsTableContainer';
  habitsView.appendChild(tableContainer);

  renderHabitsTable();
}

function addNewHabit() {
  const habitName = prompt("Введите название новой привычки:");
  if (habitName && habitName.trim() !== "") {
    const weeks = [];
    for (let w = 0; w < 16; w++) {
      const weekData = {
        days: [false, false, false, false, false, false, false] // Пн-Вс
      };
      weeks.push(weekData);
    }
    const newHabit = {
      name: habitName.trim(),
      weeks: weeks
    };
    habitsData.push(newHabit);
    saveHabitsData();
    renderHabitsTable();
  }
}

function createWeekCircle(weekIndex) {
  const container = document.createElement('div');
  container.className = 'week-circle-container';
  container.setAttribute('data-week', weekIndex);

  const size = 80; 
  const viewBoxSize = size;
  const strokeWidth = 10; 
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const circumference = 2 * Math.PI * radius;

  container.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
      <circle
        class="circle-bg"
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        fill="none"
        stroke="#ddd"
        stroke-width="${strokeWidth}"
      />
      <circle
        class="circle-fill"
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        fill="none"
        stroke="#4CAF50"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        transform="rotate(-90 ${centerX} ${centerY})"
        stroke-dasharray="${circumference} ${circumference}"
        stroke-dashoffset="${circumference}"
      />
      <text
        class="circle-text"
        x="${centerX}"
        y="${centerY}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="12"
        fill="white"
      >0%</text>
    </svg>
  `;
  return container;
}

function renderHabitsTable() {
  const container = document.getElementById('habitsTableContainer');
  if (!container) return;

  container.innerHTML = '';

  if (habitsData.length === 0) {
    container.textContent = 'Нет добавленных привычек.';
    return;
  }

  const table = document.createElement('table');
  table.className = 'habits-table';

  const headerRow = document.createElement('tr');
  const nameHeader = document.createElement('th');
  nameHeader.rowSpan = 2; 
  nameHeader.textContent = 'Привычка';
  headerRow.appendChild(nameHeader);

  for (let w = 0; w < 16; w++) {
    const weekHeader = document.createElement('th');
    weekHeader.colSpan = 7; 
    const circleContainer = createWeekCircle(w);
    weekHeader.appendChild(circleContainer);
    weekHeader.appendChild(document.createElement('br'));
    weekHeader.appendChild(document.createTextNode(`Неделя ${w + 1}`));
    headerRow.appendChild(weekHeader);
  }
  table.appendChild(headerRow);

  const subHeaderRow = document.createElement('tr');
  subHeaderRow.appendChild(document.createElement('th')); 

  for (let w = 0; w < 16; w++) {
    days.forEach(day => {
      const dayHeader = document.createElement('th');
      dayHeader.textContent = day;
      subHeaderRow.appendChild(dayHeader);
    });
  }
  table.appendChild(subHeaderRow);

  habitsData.forEach((habit, habitIndex) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.rowSpan = 1; 
    nameCell.textContent = habit.name;
    row.appendChild(nameCell);

    for (let w = 0; w < 16; w++) {
      days.forEach((_, dayIndex) => {
        const cell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        if (!habit.weeks[w] || !habit.weeks[w].days) {
          if (!habit.weeks[w]) {
            habit.weeks[w] = { days: [] };
          }
          habit.weeks[w].days = [false, false, false, false, false, false, false];
        }

        checkbox.checked = habit.weeks[w].days[dayIndex];
        checkbox.onchange = function() {
          habitsData[habitIndex].weeks[w].days[dayIndex] = this.checked;
          saveHabitsData(); 
        };
        cell.appendChild(checkbox);
        row.appendChild(cell);
      });
    }

    table.appendChild(row);
  });

  container.appendChild(table);

  updateAllWeekCircles();
}

function initClearButton() {
  const plannerView = document.getElementById('plannerView');
  if (!plannerView) return;

  const button = document.createElement('button');
  button.textContent = 'Очистить все задачи';
  button.onclick = clearAllTasks;
  plannerView.appendChild(button);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.style.left === '0px') {
    sidebar.style.left = '-250px';
  } else {
    sidebar.style.left = '0px';
  }
}

let currentView = 'planner'; 

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}View`).classList.add('active');

  const weekSummary = document.getElementById('weekSummary');
  if (weekSummary) {
    if (viewName === 'habits') {
      weekSummary.style.display = 'none';
    } else {
      weekSummary.style.display = 'block';
    }
  }

  currentView = viewName;

  if (viewName === 'planner') {
    setTimeout(renderPlanner, 0);
  } else if (viewName === 'habits') {
    const habitsView = document.getElementById('habitsView');
    if (habitsView && !habitsView.querySelector('.habits-table') && !habitsView.querySelector('button')) {
      initHabitsTracker();
    } else {
      updateAllWeekCircles();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('menuToggle').addEventListener('click', toggleSidebar);

  document.getElementById('sidebar').addEventListener('click', (e) => {
    const target = e.target.closest('.menu-link');
    if (target) {
      e.preventDefault();
      const viewName = target.getAttribute('data-view');
      switchView(viewName);
      document.getElementById('sidebar').style.left = '-250px';
    }
  });

  initClearButton();

  const initialActiveView = document.querySelector('.view.active').id.replace('View', '');
  if (initialActiveView === 'habits') {
    currentView = 'habits';
    const weekSummary = document.getElementById('weekSummary');
    if (weekSummary) {
      weekSummary.style.display = 'none';
    }
    initHabitsTracker();
  } else {
    renderPlanner();
  }
});