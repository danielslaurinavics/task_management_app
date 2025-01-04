async function populateSelectDiv() {
  const selectDiv = document.getElementById('select-div');
  const userId = document.getElementById('user-id').value;

  
  const companiesFetchUrl = `/company/info/${userId}`;
  const response = await fetch(companiesFetchUrl, { method: 'GET' });
  const responseData = await response.json();

  const companies = responseData.companies;
  companies.forEach(company => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'col';
    cardDiv.innerHTML = `
    <a href="/company/${company.id}" class="text-decoration-none text-reset d-block">
      <div class="card text-bg-danger">
        <div class="card-body">
          <h5 class="card-title">${company.name}</h5>
        </div>
      </div>
    </a>
    `;
    selectDiv.appendChild(cardDiv);
  });
}

populateSelectDiv();