document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  document.activeElement.blur();

  const formData = new FormData(event.target);
  
  // Get authentication data
  const data = {
    email: formData.get('email').trim(),
    password: formData.get('password').trim()
  };

  // Clear the message area and password input
  const messageArea = document.getElementById('message-area');
  const passwordInput = document.getElementById('password');

  messageArea.innerHTML = '';
  passwordInput.value = '';

  // Do the login request
  const response = await fetch("/login", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();

  // Redirect to the dashboard if the login is successful,
  // otherwise display all errors that occured during the process.
  if (response.ok) {
    if (responseData.success) {
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