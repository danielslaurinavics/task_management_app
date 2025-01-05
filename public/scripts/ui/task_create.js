async function createTask(type = 'user') {
  const listId = parseInt(document.getElementById('list-id').value, 10);
  let id = '';
  if (type === 'team') id = parseInt(document.getElementById('team-id').value, 10);
  else id = parseInt(document.getElementById('user-id').value, 10);
  
  const response = await fetch(`/list/${type}/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({ type, list_id: listId })
  });
  const data = await response.json();

  if (response.ok) {
    location.reload();
    alert(data.message);
  } else alert(data.errors);
}