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

async function displayUserCompanies() {
  const companiesDiv = document.getElementById('companies');
  const userId = document.getElementById('user-id').value;

  const fetchUrl = `/companies/user/${userId}`;
  const response = await fetch(fetchUrl, { method: 'GET' });
  const data = await response.json()

  if (!response.ok) return;

  const companies = data.companies;
  companies.forEach(company => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'col';
    cardDiv.innerHTML = `
    <a href="/companies/${company.id}" class="text-decoration-none text-reset d-block">
      <div class="card text-bg-danger">
        <div class="card-body">
          <h5 class="card-title">${company.name}</h5>
        </div>
      </div>
    </a>
    `;
    companiesDiv.appendChild(cardDiv);
  });
}



//displayUserTasks();
displayUserCompanies();