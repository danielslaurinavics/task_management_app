document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  document.activeElement.blur();

  const formData = new FormData(event.target);
  
  const data = {
    email: formData.get('email').trim(),
    password: formData.get('password').trim()
  };

  const messageArea = document.getElementById('message-area');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  messageArea.innerHTML = '';
  emailInput.className = 'form-control';
  passwordInput.value = '';

  const response = await fetch("/login", {
    method: 'POST',
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

      window.location.href = '/home';
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