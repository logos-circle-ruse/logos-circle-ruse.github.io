async function loadComplaints(current_page, total_pages) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/complaints/${current_page}.json`);
    const data = await res.json();

    const table = document.getElementById("complaints-table");
    const rows = data.map(report => `
      <tr>
        <td>${report.id}</td>
        <td>${report.title}</td>
        <td>${report.category}</td>
        <td>${report.location}</td>
        <td>${report.date_reported}</td>
        <td>${report.status}</td>
      </tr>
    `).join("");

    table.innerHTML = rows;
    
    const next_btn = document.getElementById("next-page-btn");
    const previous_btn = document.getElementById("prev-page-btn");
    const current_page_text = document.getElementById("current-page");
    const total_pages_text = document.getElementById("total-pages");
    
    next_btn.classList.remove("disabled");
    previous_btn.classList.remove("disabled");
    
    if (current_page === 1){
        previous_btn.classList.add("disabled");
    }
    if (current_page === total_pages){
        next_btn.classList.add("disabled");
    }
    
    current_page_text.innerHTML = current_page;
    total_pages_text.innerHTML = total_pages;

  } catch (err) {
    console.error(err);
  }
}

async function run(){
    const res = await fetch(`https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/main.json`);
    const data = await res.json();
    const totalPages = parseInt(data.pages);
    const tableSection = document.getElementById("two");
    
    if (totalPages > 0){
        loadComplaints(1, totalPages);
    }
    else{
        tableSection.style.display = "none";
    }
}

document.getElementById("next-page-btn").addEventListener("click", () => {
    const current_page_text = document.getElementById("current-page");
    const total_pages_text = document.getElementById("total-pages");

    const currentPage = parseInt(current_page_text.innerHTML);
    const totalPages = parseInt(total_pages_text.innerHTML);

    if (currentPage < totalPages) {
        loadComplaints(currentPage + 1, totalPages);
    }
});

document.getElementById("prev-page-btn").addEventListener("click", () => {
    const current_page_text = document.getElementById("current-page");
    const total_pages_text = document.getElementById("total-pages");

    const currentPage = parseInt(current_page_text.innerHTML);
    const totalPages = parseInt(total_pages_text.innerHTML);

    if (currentPage > 1) {
        loadComplaints(currentPage - 1, totalPages);
    }
});

run()