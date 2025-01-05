async function populateManagerTable() {
  const managersTable = document.getElementById('managers-table');
  const coid = document.getElementById('company-id').value;
  const cuid = document.getElementById('user-id').value;
  const userId = parseInt(cuid, 10);
  const companyId = parseInt(coid, 10);

  const fetchUrl = `/companies/${companyId}/managers`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) return;

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
    const removeButton = document.createElement('button');
    removeButton.textContent = manager.allowed_to.remove_word;
    removeButton.className = 'btn btn-sm btn-danger';
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
    if (manager.id !== userId) actionCell.appendChild(removeButton);
    row.appendChild(actionCell);
    managersTable.appendChild(row);
  })
}

async function populateTeamsTable() {
  const teamsTable = document.getElementById('teams-table');
  const coid = document.getElementById('company-id').value;
  const companyId = parseInt(coid, 10);

  const fetchUrl = `/companies/${companyId}/teams`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) return;

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

    const addButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    addButton.textContent = team.allowed_to.add_word;
    deleteButton.textContent = team.allowed_to.delete_word;

    addButton.className = 'btn btn-outline-primary btn-sm ms-1';
    deleteButton.className = 'btn btn-danger btn-sm ms-1';

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