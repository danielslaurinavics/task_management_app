document.getElementById('current_password').addEventListener('input', () => {
  const currentInput = document.getElementById('current_password');
  const newInput = document.getElementById('new_password');
  const confirmInput = document.getElementById('password_confirm');

  if (currentInput.value.trim().length > 0) {
    newInput.disabled = false;
    confirmInput.disabled = false;
  } else {
    newInput.value = '';
    newInput.disabled = true;
    confirmInput.value = '';
    confirmInput.disabled = true;
  }
});



document.getElementById('user-change-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  document.activeElement.blur();

  const formData = new FormData(event.target);
  
  const data = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    current_password: formData.get('current_password')?.trim() || '',
    new_password: formData.get('new_password')?.trim() || '',
    password_confirm: formData.get('password_confirm')?.trim() || '',
  };

  const messageArea = document.getElementById('message-area');
  const currentPassowrdInput = document.getElementById('current_password');
  const newPassowrdInput = document.getElementById('new_password');
  const confirmPassowrdInput = document.getElementById('password_confirm');

  messageArea.innerHTML = '';
  currentPassowrdInput.value = '';
  newPassowrdInput.value = '';
  confirmPassowrdInput.value = '';
  newPassowrdInput.disabled = true;
  confirmPassowrdInput.disabled = true;

  const user_id = document.getElementById('user-id').value;
  const fetchUrl = `/users/${user_id}`

  const response = await fetch(fetchUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();

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