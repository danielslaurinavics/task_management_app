async function populateManagerTable() {
  const managersTable = document.getElementById('managers-table');
  const coid = document.getElementById('company-id').value;
  const cuid = document.getElementById('user-id').value;
  const userId = parseInt(cuid, 10);
  const companyId = parseInt(coid, 10);

  // Get data about company's managers
  const fetchUrl = `/companies/${companyId}/managers`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) {
    alert(data.errors);
    return;
  }

  // Clear the managers table and fill it with new information.
  managersTable.innerHTML = '';
  const managers = data.managers;

  managers.forEach(manager => {
    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${manager.name}</td>
    <td>${manager.email}</td>
    <td>${manager.phone}</td>
    `;

    const actionCell = document.createElement('td');

    // Define the remove button and its functionality.
    const removeButton = document.createElement('button');
    removeButton.textContent = '✖';
    removeButton.className = 'btn btn-sm btn-danger fs-6';
    removeButton.addEventListener('click', async () => {
      confirmed = confirm(manager.allowed_to.remove_confirm);

      if (confirmed) {
        const fetchUrl = `/companies/${companyId}/managers`;
        const response = await fetch(fetchUrl, {
          method: 'DELETE',
          headers: { 'Content-Type' : 'application/json'},
          body: JSON.stringify({ userId: manager.id })
        });
        const data = await response.json();

        if (response.ok) {
          populateManagerTable();
          alert(data.message);
        } else alert(data.errors);
      }
    });
    // Add the delete button except for their own user.
    if (manager.id !== userId) actionCell.appendChild(removeButton);
    row.appendChild(actionCell);
    managersTable.appendChild(row);
  })
}

async function populateTeamsTable() {
  const teamsTable = document.getElementById('teams-table');
  const coid = document.getElementById('company-id').value;
  const companyId = parseInt(coid, 10);

  // Get data about company's teams
  const fetchUrl = `/companies/${companyId}/teams`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) {
    alert(data.errors);
    return;
  }

  // Clear the teams table and populate it with fetched data.
  teamsTable.innerHTML = '';
  const teams = data.teams;
  
  teams.forEach(team => {
    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${team.id}</td>
    <td>${team.name}</td>
    <td>${team.description}</td>
    `;

    const actionCell = document.createElement('td');

    // Define buttons used for team management.
    const addButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    addButton.textContent = '✚'
    deleteButton.textContent = '✖';

    addButton.className = 'btn btn-outline-primary btn-sm ms-1 fs-6';
    deleteButton.className = 'btn btn-danger btn-sm ms-1 fs-6';

    // Add functionality to the 'Add member to team button'.
    addButton.addEventListener('click', async () => {
      const user_email = prompt(team.allowed_to.add_prompt);

      if (user_email) {
        let confirm_text = team.allowed_to.add_confirm;
        confirm_text = confirm_text.replace('%user', user_email);
        const confirmed = confirm(confirm_text);

        if (confirmed) {
          const fetchUrl = `/teams/${team.id}/participants`;
          const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ email: user_email })
          });
          const data = await response.json();

          if (response.ok) {
            populateTeamsTable();
            alert(data.message);
          } else alert(data.errors);
        }
      }
    });

    // Add functionality to 'Delete team' button.
    deleteButton.addEventListener('click', async () => {
      const confirmed = confirm(team.allowed_to.delete_confirm);

      if (confirmed) {
        const fetchUrl = `/companies/${companyId}/teams`;
        const response = await fetch(fetchUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_id: team.id })
        });
        const data = await response.json();

        if (response.ok) {
          populateTeamsTable();
          alert(data.message);
        } else alert(data.errors);
      }
    });

    actionCell.appendChild(addButton);
    actionCell.appendChild(deleteButton);
    
    row.appendChild(actionCell);
    teamsTable.appendChild(row);
  });
}

populateManagerTable();
populateTeamsTable();