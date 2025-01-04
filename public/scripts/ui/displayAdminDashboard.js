async function populateUserTable() {
  const usersTable = document.getElementById('users-table');
  const cuid = document.getElementById('user-id').value;
  const currentUserId = parseInt(cuid, 10);

  const response = await fetch('/user/get', { method: 'GET' });
  const data = await response.json();

  if (!response.ok) return;

  usersTable.innerHTML = '';
  const users = data.users;

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
      const confirmed = confirm(user.allowed_to.block_confirm);

      if (confirmed) {
        const fetchUrl = `/user/${user.id}/block`;
        const response = await fetch(fetchUrl, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
          populateUserTable();
          alert(data.message);
        }
        else alert(data.errors);
      }
    });

    unblockButton.addEventListener('click', async () => {
      const confirmed = confirm(user.allowed_to.unblock_confirm);

      if (confirmed) {
        const fetchUrl = `/user/${user.id}/unblock`;
        const response = await fetch(fetchUrl, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
          populateUserTable();
          alert(data.message);
        }
        else alert(data.errors);
      }
    });

    deleteButton.addEventListener('click', async () => {
      const confirmed = confirm(user.allowed_to.delete_confirm);

      if (confirmed) {
        const fetchUrl = `/user/${user.id}/delete`;
        const response = await fetch(fetchUrl, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
          populateUserTable();
          alert(data.message);
        }
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
  });
}



async function populateCompanyTable() {
  const companiesTable = document.getElementById('companies-table');

  const response = await fetch('/get/company', { method: 'GET' });
  const data = await response.json();

  if (!response.ok) return;

  companiesTable.innerHTML = '';
  const companies = data.companies;
  companies.forEach(company => {
    const row = document.createElement('tr');

    row.innerHTML = `
    <td>${company.id}</td>
    <td>${company.name}</td>
    <td>${company.email}</td>
    <td>${company.phone}</td>
    `;

    const actionCell = document.createElement('td');

    const addUserButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    addUserButton.textContent = company.allowed_to.add_word;
    deleteButton.textContent = company.allowed_to.delete_word;

    addUserButton.className = 'btn btn-outline-primary btn-sm ms-1';
    deleteButton.className = 'btn btn-danger btn-sm ms-1';

    addUserButton.addEventListener('click', async () => {
      const user_email = prompt(company.allowed_to.add_prompt);
      
      if (user_email) {
        let confirm_text = company.allowed_to.add_confirm;
        confirm_text = confirm_text.replace('%user', user_email);
        const confirmed = confirm(confirm_text);
        
        if (confirmed) {
          const fetchUrl = `/company/${company.id}/manager/add`;
          const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: user_email.trim() })
          });
          const data = await response.json();

          if (response.ok) {
            populateCompanyTable();
            alert(data.message);
          } else alert(data.errors);
        }
      }
    });

    deleteButton.addEventListener('click', async () => {
      const confirmed = confirm(company.allowed_to.delete_confirm);
      
      if (confirmed) {
        const fetchUrl = `/company/${company.id}/delete`;
        const response = await fetch(fetchUrl, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
          populateCompanyTable();
          alert(data.message);
        } else alert(JSON.stringify(data.errors));
      }
    });

    actionCell.appendChild(addUserButton);
    actionCell.appendChild(deleteButton);

    row.appendChild(actionCell);
    
    companiesTable.appendChild(row);
  });
}

populateUserTable();
populateCompanyTable();