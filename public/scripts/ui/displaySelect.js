async function populateSelectDiv() {
  const selectDiv = document.getElementById('select-div');
  const userId = document.getElementById('user-id').value;

  const settingsCard = document.createElement('div');
  settingsCard.className = 'card text-bg-secondary col-md-6 col-lg-4';
  settingsCard.innerHTML = `
  <a class="text-decoration-none" href="/settings">
    <div class="card-body">
      <h5 class="card-title">Lietotāja dati</h5>
    </div>
  </a>
  `;
  selectDiv.appendChild(settingsCard);

  const companiesFetchUrl = `/company/info/${userId}`;
  const response = await fetch(companiesFetchUrl, { method: 'GET' });
  const responseData = await response.json();

  const companies = responseData.companies;
  companies.forEach(company => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card text-bg-danger col-md-6 col-lg-4';
    cardDiv.innerHTML = `
    <a class="text-decoration-none" href="/company/${company.id}">
      <div class="card-body">
        <h5 class="card-title">${company.name}</h5>
      </div>
    </a>
    `;
    selectDiv.appendChild(cardDiv);
  });
}

populateSelectDiv();