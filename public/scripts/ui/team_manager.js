async function populateTeamParticipants() {
  const table = document.getElementById('participants-table');
  const cuid = document.getElementById('user-id').value;
  const teid = document.getElementById('team-id').value;
  const userId = parseInt(cuid, 10);
  const teamId = parseInt(teid, 10);

  // Get information about the team's members.
  const response = await fetch(`/teams/${teamId}/participants`, { method: 'GET' });
  const data = await response.json();

  // Display an error if an error occured during the request.
  if (!response.ok) {
    alert(data.errors);
    return;
  }

  // Clear the participant table and start populating the current one.
  table.innerHTML = '';
  const members = data.participants;
  members.forEach(member => {
    const row = document.createElement('tr');
    if (member.is_manager) row.className = 'table-primary';

    row.innerHTML = `
    <td>${member.name}</td>
    <td>${member.email}</td>
    <td>${member.phone}</td>
    <td>${member.role}</td>
    `;

    const actionCell = document.createElement('td');

    // Define action buttons
    const elevateRoleBtn = document.createElement('button');
    const lowerRoleBtn = document.createElement('button');
    const removeRoleBtn = document.createElement('button');

    elevateRoleBtn.textContent = '⇑';
    lowerRoleBtn.textContent = '⇓';
    removeRoleBtn.textContent = "✖"

    elevateRoleBtn.className = 'btn btn-sm btn-outline-primary ms-1 fs-6';
    lowerRoleBtn.className = 'btn btn-sm btn-outline-primary ms-1 fs-6';
    removeRoleBtn.className = 'btn btn-sm btn-danger ms-1 fs-6';
  
    // Add participant's role elevation button functionality.
    elevateRoleBtn.addEventListener('click', async () => {
      const confirmed = confirm(member.allowed_to.elevate_confirm);
      if (confirmed) {
        const response = await fetch(`/teams/${teamId}/participants`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ user_id: member.id })
        });
        const data = await response.json();

        if (response.ok) {
          populateTeamParticipants();
          alert(data.message);
        } else alert(data.errors);
      }
    });

    // Add participant's role lowering button functionality.
    lowerRoleBtn.addEventListener('click', async () => {
      const confirmed = confirm(member.allowed_to.lower_confirm);
      if (confirmed) {
        const response = await fetch(`/teams/${teamId}/participants`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ user_id: member.id })
        });
        const data = await response.json();

        if (response.ok) {
          populateTeamParticipants();
          alert(data.message);
        } else alert(data.errors);
      }
    });

    // Adding functionality to the remove role button.
    removeRoleBtn.addEventListener('click', async () => {
      const confirmed = confirm(member.allowed_to.remove_confirm);
      if (confirmed) {
        const response = await fetch(`/teams/${teamId}/participants`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ user_id: member.id })
        });
        const data = await response.json();

        if (response.ok) {
          populateTeamParticipants();
          alert(data.message);
        } else alert(data.errors);
      }
    });

    // Add member management buttons except for their own user.
    if (!member.is_manager) actionCell.appendChild(elevateRoleBtn);
    else {
      if (member.id !== userId) actionCell.appendChild(lowerRoleBtn);
    }
    if (member.id !== userId) actionCell.appendChild(removeRoleBtn);

    row.appendChild(actionCell);
    table.appendChild(row);
  })
}

populateTeamParticipants()