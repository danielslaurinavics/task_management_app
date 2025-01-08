async function populateTasks() {
  const cuid = document.getElementById('user-id').value;
  const userId = parseInt(cuid, 10);

  // Set up the DIVs where the tasks are stored
  const upcomingTasksDiv = document.getElementById('upcoming-tasks');
  const startedTasksDiv = document.getElementById('started-tasks');
  const ongoingTasksDiv = document.getElementById('ongoing-tasks');
  const completedTasksDiv = document.getElementById('completed-tasks');

  // Fetch tasks data
  const fetchUrl = `/list/user/${userId}`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  // Clear current tasks data from their DIVs
  upcomingTasksDiv.innerHTML = '';
  startedTasksDiv.innerHTML = '';
  ongoingTasksDiv.innerHTML = '';
  completedTasksDiv.innerHTML = '';

  // Return an error if the tasks data fetching was unsuccessful
  if (!response.ok) {
    alert(data.errors);
    return;
  }

  // Create a task card for each task
  const tasks = data.tasks;
  tasks.forEach(task => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'text-bg-dark mt-2 pb-2 rounded-3 ';
    taskDiv.style.minHeight = '100px';

    task.description = task.description || '';
    
    let dueDate = '';
    let dateSpanColor = '';
    if (task.due_date) {
      const date = new Date(task.due_date);
      const now = new Date();
      const pad = (num) => num.toString().padStart(2, '0');
      dueDate = `
      ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
      dateSpanColor = now < date ? 'light' : 'danger';
      if (task.status >= 3) dateSpanColor = 'light';
    }
    
    const findTaskPriorityColor = (priority) => {
      if (priority === 0) return 'info';
      if (priority === 1) return 'warning';
      if (priority === 2) return 'danger';
      else return 'info';
    }
    const priorityColor = findTaskPriorityColor(task.priority);

    taskDiv.innerHTML = `
    <div class="p-2 d-flex flex-column justify-content-start">
      <span class="fs-6 badge text-bg-${priorityColor}">${task.priority_word}</span>
      <span class="fs-5 fw-bold">${task.name}</span>
      <p class="fw-lighter">${task.description}</p>
      <span class="fs-6 badge text-bg-${dateSpanColor}">${dueDate}</span>
      <div class=""></div>
    </div>
    `;

    // Defines buttons for each task.
    const changeData = document.createElement('a');
    const changeStatus = document.createElement('button');
    const deleteTask = document.createElement('button');

    changeData.textContent = '⛭';
    changeStatus.textContent = '⇒';
    deleteTask.textContent = '✖';
    
    changeData.className = 'btn btn-sm btn-light ms-1 fs-6';
    changeStatus.className = 'btn btn-sm btn-light ms-1 fs-6';
    deleteTask.className = 'btn btn-sm btn-danger ms-1 fs-6';

    // Adds functionality for "Change data" button.
    changeData.href = `/tasks/user/edit/${task.id}`;
    changeStatus.addEventListener('click', async () => {
      const response = await fetch(`/list/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id })
      });
      const data = await response.json();
      
      if (response.ok) {
        populateTasks();
        alert(data.message);
      } else {
        alert(data.errors);
      }
    });
    
    // Adds functionality for "Delete task" button.
    deleteTask.addEventListener('click', async () => {
      const confirmed = confirm(task.allowed_to.delete_confirm);

      if (confirmed) {
        const response = await fetch(`/list/user/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id })
        });
        const data = await response.json();

        if (response.ok) {
          populateTasks();
          alert(data.message);
        } else {
          alert(data.errors);
        }
      }
    });

    // Show the buttons according to the completion status
    if (task.status < 3) taskDiv.appendChild(changeData);
    if (task.status < 3) taskDiv.appendChild(changeStatus);
    taskDiv.appendChild(deleteTask);

    // Add the task to the corresponding status's DIV.
    if (task.status === 0) upcomingTasksDiv.appendChild(taskDiv);
    else if (task.status === 1) startedTasksDiv.appendChild(taskDiv);
    else if (task.status === 2) ongoingTasksDiv.appendChild(taskDiv);
    else if (task.status === 3) completedTasksDiv.appendChild(taskDiv);
    else upcomingTasksDiv.appendChild(taskDiv);
  });
}

populateTasks();