document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  document.activeElement.blur();

  const formData = new FormData(event.target);

  // Get registration form data
  const data = {
    name: formData.get('name').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim(),
    password: formData.get('password').trim(),
    password_confirm: formData.get('password_confirm').trim()
  };

  // Clear the message area and password fields.
  const messageArea = document.getElementById('message-area');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('password_confirm');

  messageArea.innerHTML = '';
  passwordInput.value = '';
  passwordConfirmInput.value = '';

  // Do the registration request.
  const response = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();

  // Notify the user and redirect to the login page if successful,
  // otherwise show all errors that occured during the process.
  if (response.ok) {
    alert(responseData.message);
    window.location.href = '/login';
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
})