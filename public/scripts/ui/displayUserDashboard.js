async function displayUserSelect() {
  const selectDiv = document.getElementById('select-card');
  const userId = document.getElementById('user-id').value;

  const companyFetchUrl = `/companies/user/${userId}`;
  const companyResponse = await fetch(companyFetchUrl, { method: 'GET' });
  const companyData = await companyResponse.json()

  if (!companyResponse.ok) {
    alert(companyData.errors);
    return;
  }

  // Create a company card for each company the user is
  // manager in
  const companies = companyData.companies;
  companies.forEach(company => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'col';
    cardDiv.innerHTML = `
    <a href="/companies/${company.id}" class="text-decoration-none text-reset d-block">
      <div class="card text-bg-danger" style="height: 100px;">
        <div class="card-body">
          <h5 class="card-title">${company.name}</h5>
        </div>
      </div>
    </a>
    `;
    selectDiv.appendChild(cardDiv);
  });

  // Get information about the teams the user is participating in.
  const teamFetchUrl = `/teams/user/${userId}`;
  const teamResponse = await fetch(teamFetchUrl, { method: 'GET' });
  const teamData = await teamResponse.json();

  if (!teamResponse.ok) {
    alert(teamData.errors);
    return;
  }
  
  // Create a team card for each team the user is participating.
  const teams = teamData.teams;
  teams.forEach(team => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'col';
    cardDiv.innerHTML = `
    <a href="/teams/${team.id}" class="text-decoration-none text-reset d-block">
      <div class="card text-bg-primary" style="height: 100px;">
        <div class="card-body">
          <h5 class="card-title">${team.name}</h5>
        </div>
      </div>
    </a>
    `;
    selectDiv.appendChild(cardDiv);
  })
}

displayUserSelect();