async function populateTasks() {
  const cuid = document.getElementById('user-id').value;
  const tid = document.getElementById('team-id').value;
  const isManager = JSON.parse(document.getElementById('team-manager').value);
  const userId = parseInt(cuid, 10);
  const teamId = parseInt(tid, 10);

  const upcomingTasksDiv = document.getElementById('upcoming-tasks');
  const startedTasksDiv = document.getElementById('started-tasks');
  const ongoingTasksDiv = document.getElementById('ongoing-tasks');
  const completedTasksDiv = document.getElementById('completed-tasks');

  const fetchUrl = `/list/team/${teamId}`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  upcomingTasksDiv.innerHTML = '';
  startedTasksDiv.innerHTML = '';
  ongoingTasksDiv.innerHTML = '';
  completedTasksDiv.innerHTML = '';

  if (!response.ok) {
    alert(data.errors);
    return;
  }


  const tasks = data.tasks;
  tasks.forEach(task => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'text-bg-dark mt-2 pb-2 rounded-3 ';
    taskDiv.style.minHeight = '100px';

    task.description = task.description || '';
    
    const findTaskPriorityColor = (priority) => {
      if (priority === 0) return 'info';
      if (priority === 1) return 'warning';
      if (priority === 2) return 'danger';
      else return 'info';
    }
    const priorityColor = findTaskPriorityColor(task.priority);

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
    
    const persons = task.assigned_users;
    const isAssigned = persons.find(person => person.id === userId);

    taskDiv.innerHTML = `
    <div class="p-2 d-flex flex-column justify-content-start align-items-start">
      <span class="fs-6 badge text-bg-${priorityColor}">${task.priority_word}</span>
      <span class="fs-5 fw-bold">${task.name}</span>
      <p class="fw-lighter">${task.description}</p>
      <span class="fs-6 badge text-bg-${dateSpanColor}">${dueDate}</span>
    </div>
    `;
    
    const personData = document.createElement('div');
    personData.className = 'd-flex flex-column align-items-start ms-1 my-1';
    persons.forEach(person => {
      const span = document.createElement('span');
      span.className = 'fs-6 badge text-bg-warning mb-1';
      span.textContent = person.name;
      if (isManager && task.status < 3) {
        const remove = document.createElement('button');
        remove.textContent = 'X';
        remove.className = 'btn btn-sm btn-danger ms-2';
        remove.addEventListener('click', async () => {
          const response = await fetch(`/tasks/${teamId}/persons`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: task.id, user_id: person.id })
          });
          const data = await response.json()

          if (response.ok) {
            populateTasks();
            alert(data.message);
          } else {
            alert(data.errors);
          }
        });
        span.appendChild(remove);
      }
      personData.appendChild(span);
    })
    taskDiv.appendChild(personData);
    
    const changeData = document.createElement('a');
    const changeStatus = document.createElement('button');
    const deleteTask = document.createElement('button');
    const addPerson = document.createElement('button');

    changeData.textContent = task.allowed_to.change_word;
    changeStatus.textContent = task.allowed_to.status_word;
    deleteTask.textContent = task.allowed_to.delete_word;
    addPerson.textContent = '+';
    
    changeData.className = 'btn btn-sm btn-light ms-1';
    changeStatus.className = 'btn btn-sm btn-light ms-1';
    deleteTask.className = 'btn btn-sm btn-danger ms-1';
    addPerson.className = 'btn btn-sm btn-light ms-1';

    changeData.href = `/tasks/team/${teamId}/edit/${task.id}`;
    changeStatus.addEventListener('click', async () => {
      const response = await fetch(`/list/team/${teamId}`, {
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
    
    deleteTask.addEventListener('click', async () => {
      const confirmed = confirm(task.allowed_to.delete_confirm);

      if (confirmed) {
        const response = await fetch(`/list/team/${teamId}`, {
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

    addPerson.addEventListener('click', async () => {
      const email = prompt(task.allowed_to.add_prompt);

      if (email) {
        const response = await fetch(`/tasks/${teamId}/persons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id, email: email })
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

    if (task.status < 3 && isManager) taskDiv.appendChild(changeData);
    if (task.status < 3 && (isAssigned || isManager)) taskDiv.appendChild(changeStatus);
    if (isManager) taskDiv.appendChild(addPerson);
    if (isManager) taskDiv.appendChild(deleteTask);

    switch (task.status) {
      case 0:
        upcomingTasksDiv.appendChild(taskDiv);
        break;

      case 1:
        startedTasksDiv.appendChild(taskDiv);
        break;

      case 2:
        ongoingTasksDiv.appendChild(taskDiv);
        break;

      case 3:
        completedTasksDiv.appendChild(taskDiv);;
        break;

      default:
        upcomingTasksDiv.appendChild(taskDiv);
        break;
    }
  });
}

populateTasks();