async function createTask(type = 'user') {
  // Get the ID of the list and set the type of the list.
  const listId = parseInt(document.getElementById('list-id').value, 10);
  let id = '';
  if (type === 'team') id = parseInt(document.getElementById('team-id').value, 10);
  else id = parseInt(document.getElementById('user-id').value, 10);
  
  // Do the task creation request.
  const response = await fetch(`/list/${type}/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({ type, list_id: listId })
  });
  const data = await response.json();

  // Reload the page if task creation is successful, otherwise
  // display errors.
  if (response.ok) {
    location.reload();
    alert(data.message);
  } else alert(data.errors);
}