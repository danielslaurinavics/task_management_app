const userId = parseInt(document.getElementById('user-id').value, 10);

// Get the data about the task for automatic 
async function getTaskData() {
  // Get the task's ID.
  const path = window.location.pathname;
  const segments = path.split('/');
  const taskId = parseInt(segments[segments.length - 1], 10);
  
  // Get the data about the task.
  document.getElementById('task-id').value = taskId;
  const fetchUrl = `/tasks/${taskId}/data`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  // Alert in case of an error during data fetching request,
  if (!response.ok) {
    alert(data.errors);
    return;
  }
  
  // Format the date in order for the datetime-local input object to accept.
  const task = data.task;
  let formattedDate = '';
  if (task.due_date) {
    const date = new Date(task.due_date)
    const timestamp = date.valueOf();
    const tz = date.getTimezoneOffset() * 60 * 1000;
    formattedDate = new Date(timestamp - tz).toISOString().slice(0, 16);
  }

  // Write the acquired task values to the UI.
  document.getElementById('task_name').value = task.name;
  document.getElementById('task_description').innerHTML = task.description;
  document.getElementById('task_priority').value = task.priority;
  document.getElementById('task_due').value = formattedDate;

  const lowPrioritySpan = document.getElementById('low-priority');
  const mediumPrioritySpan = document.getElementById('medium-priority');
  const highPrioritySpan = document.getElementById('high-priority');

  lowPrioritySpan.style.display = 'none';
  mediumPrioritySpan.style.display = 'none';
  highPrioritySpan.style.display = 'none';

  if (task.priority <= 0) {
    lowPrioritySpan.style.display = 'block';
    mediumPrioritySpan.style.display = 'none';
    highPrioritySpan.style.display = 'none';
  } else if (task.priority == 1) {
    lowPrioritySpan.style.display = 'none';
    mediumPrioritySpan.style.display = 'block';
    highPrioritySpan.style.display = 'none';
  } else if (task.priority <= 2) {
    lowPrioritySpan.style.display = 'none';
    mediumPrioritySpan.style.display = 'none';
    highPrioritySpan.style.display = 'block';
  } else {
    lowPrioritySpan.style.display = 'none';
    mediumPrioritySpan.style.display = 'none';
    highPrioritySpan.style.display = 'none';
  }
}

getTaskData();

document.getElementById('change-task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const taskId = parseInt(document.getElementById('task-id').value, 10);

  // Get form data and change them accordingly.
  const formData = new FormData(event.target);
  let due_date = formData.get('task_due')?.trim();
  if (due_date) {
    const date = new Date(due_date);
    due_date = date.toISOString();
  }
  const data = {
    task_id: taskId,
    name: formData.get('task_name')?.trim(),
    description: formData.get('task_description')?.trim(),
    priority: formData.get('task_priority'),
    due_date: due_date
  };

  // Clear the message area
  const messageArea = document.getElementById('message-area');
  messageArea.innerHTML = '';

  // Do the request to the task data change controller function.
  const response = await fetch(`/list/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();

  // Display a success message if the request was successful, otherwise
  // display all errors which happened during the request.
  if (response.ok) {
    const message = responseData.message;
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.role = 'alert';
    alert.textContent = message;
    messageArea.appendChild(alert);
    getTaskData();
  } else {
    const errors = responseData.errors;
    errors.forEach(error => {
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger';
      alert.role = 'alert';
      alert.textContent = error;
      messageArea.appendChild(alert);
    });
  }
});

// Changes the task priority text in case of value change.
document.getElementById('task_priority').addEventListener('input', async () => {
  const value = document.getElementById('task_priority').value;

  const lowPrioritySpan = document.getElementById('low-priority');
  const mediumPrioritySpan = document.getElementById('medium-priority');
  const highPrioritySpan = document.getElementById('high-priority');

  lowPrioritySpan.style.display = 'none';
  mediumPrioritySpan.style.display = 'none';
  highPrioritySpan.style.display = 'none';

  if (value <= 0) {
    lowPrioritySpan.style.display = 'block';
    mediumPrioritySpan.style.display = 'none';
    highPrioritySpan.style.display = 'none';
  } else if (value == 1) {
    lowPrioritySpan.style.display = 'none';
    mediumPrioritySpan.style.display = 'block';
    highPrioritySpan.style.display = 'none';
  } else if (value <= 2) {
    lowPrioritySpan.style.display = 'none';
    mediumPrioritySpan.style.display = 'none';
    highPrioritySpan.style.display = 'block';
  } else {
    lowPrioritySpan.style.display = 'none';
    mediumPrioritySpan.style.display = 'none';
    highPrioritySpan.style.display = 'none';
  }
});