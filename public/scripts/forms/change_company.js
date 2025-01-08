document.getElementById('change-company-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const coid = document.getElementById('company-id').value;
  const companyId = parseInt(coid, 10);

  // Get entered form data
  const formData = new FormData(event.target);
  const data = {
    name: formData.get('company_name')?.trim() || '',
    description: formData.get('company_description')?.trim() || '',
    email: formData.get('company_email')?.trim() || '',
    phone: formData.get('company_phone')?.trim() || ''
  };

  // Clear the message area
  const messageArea = document.getElementById('message-area');
  messageArea.innerHTML = '';

  // Do the data change request
  const response = await fetch(`/companies/${companyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();

  // Give a message if data change is successful, otherwise
  // display all errors which occured during the process.
  if (response.ok) {
    if (responseData.success) {
      const message = document.createElement('div');
      message.className = 'alert alert-success';
      message.role = 'alert';
      message.textContent = responseData.message;
      messageArea.appendChild(message);
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