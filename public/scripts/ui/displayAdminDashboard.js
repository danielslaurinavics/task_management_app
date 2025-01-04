async function populateUserTable() {
  const usersTable = document.getElementById('users-table');
  const cuid = document.getElementById('user-id').value;
  const currentUserId = parseInt(cuid, 10);

  const response = await fetch('/user/get', { method: 'GET' });
  const data = await response.json();

  if (!response.ok) return;

  usersTable.innerHTML = '';
  const users = data.users;
  console.log(users);

  users.forEach(user => {
    const row = document.createElement('tr');
    if (user.block) row.className = 'table-danger';
    else if (user.admin) row.className = 'table-primary';

    row.innerHTML = `
    <td>${user.id}</td>
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>${user.phone}</td>
    <td>${user.role}</td>
    <td>${user.blocked}</td>
    `;

    const actionCell = document.createElement('td');

    const blockButton = document.createElement('button');
    const unblockButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    blockButton.textContent = user.allowed_to.block_word;
    unblockButton.textContent = user.allowed_to.unblock_word;
    deleteButton.textContent = user.allowed_to.delete_word;

    blockButton.className = 'btn btn-outline-primary btn-sm ms-1';
    unblockButton.className = 'btn btn-outline-primary btn-sm ms-1';
    deleteButton.className = 'btn btn-danger btn-sm ms-1';

    blockButton.addEventListener('click', async () => {
      const fetchUrl = `/user/block/${user.id}`;
      const response = await fetch(fetchUrl, { method: 'PUT' });
      const data = await response.json();

      if (response.ok) populateUserTable();
      else alert(data.errors);
    });

    unblockButton.addEventListener('click', async () => {
      const fetchUrl = `/user/unblock/${user.id}`;
      const response = await fetch(fetchUrl, { method: 'PUT' });
      const data = await response.json();

      if (response.ok) populateUserTable();
      else alert(data.errors);
    });

    deleteButton.addEventListener('click', async () => {
      const confirmed = confirm(user.allowed_to.delete_confirm);

      if (confirmed) {
        const fetchUrl = `/user/${user.id}/delete`;
        const response = await fetch(fetchUrl, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) populateUserTable();
        else alert(data.errors);
      }
    });

    if (user.id !== currentUserId) {
      if (!user.block) actionCell.appendChild(blockButton);
      else actionCell.appendChild(unblockButton);
      actionCell.appendChild(deleteButton);
    }

    row.appendChild(actionCell);

    usersTable.appendChild(row);
  })
}



async function populateCompanyTable() {
  return;
}

populateUserTable();
populateCompanyTable();