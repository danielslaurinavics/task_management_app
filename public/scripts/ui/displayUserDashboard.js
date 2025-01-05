async function displayUserTasks() {
  const tasksDiv = document.getElementById('tasks');
  const userId = document.getElementById('user-id').value;

  const fetchUrl = ``;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) return;
  const tasks = data.tasks;
  tasks.forEach(task => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'col';
  })
}

async function displayUserSelect() {
  const selectDiv = document.getElementById('select-card');
  const userId = document.getElementById('user-id').value;

  const companyFetchUrl = `/companies/user/${userId}`;
  const companyResponse = await fetch(companyFetchUrl, { method: 'GET' });
  const companyData = await companyResponse.json()

  if (!companyResponse.ok) return;

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


  const teamFetchUrl = `/teams/user/${userId}`;
  const teamResponse = await fetch(teamFetchUrl, { method: 'GET' });
  const teamData = await teamResponse.json();

  if (!teamResponse.ok) return;
  
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



//displayUserTasks();
displayUserSelect();