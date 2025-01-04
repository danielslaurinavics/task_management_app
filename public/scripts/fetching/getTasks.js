async function getUsersTasks() {
  const userId = document.getElementById('user-id').value;
  const tasksPanel = document.getElementById('user-tasks');
  tasksPanel.innerHTML = '';
  
  const fetchUrl = `/tasks/user/${userId}`
  const response = await fetch(fetchUrl, { method: 'GET' });
  const responseData = await response.json();

  if (response.ok) {
    const tasks = responseData.tasks;
    console.log(tasks);
    tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.innerHTML = `
      <span class="badge text-bg-primary">${task.priority}</span>
      <span class="badge text-bg-danger">${task.status}</span>
      <span>${task.name}</span>
      <span>${task.description}</span>
      <span>${task.dueDate}</span>
      `
      tasksPanel.appendChild(taskDiv);
    })
  } else {

  }
}

async function displayUsersTasks() {

}

getUsersTasks();