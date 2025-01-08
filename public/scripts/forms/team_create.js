document.getElementById('create-team-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const coid = document.getElementById('company-id').value;
  const companyId = parseInt(coid, 10);

  // Get the new team's data.
  const formData = new FormData(event.target);
  const data = {
    name: formData.get('team_name')?.trim() || '',
    description: formData.get('team_description')?.trim() || '',
  };

  // Clear the message area.
  const messageArea = document.getElementById('message-area');
  messageArea.innerHTML = '';

  // Do the request to the team creation function.
  const response = await fetch(`/companies/${companyId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();

  // Display a message and redirect to the company management view if
  // successful, otherwise display all errors that occured during the process.
  if (response.ok) {
    if (responseData.success) {
      window.location.href = `/companies/${companyId}`;
      alert(responseData.message);
    }
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