let originalExpenses = [];

// Fetching the data from the backend
async function fetchExpenses() {

  const tbody = document.getElementById('expense-table-body');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-4">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Loading expenses...</div>
      </td>
    </tr>
  `;

  try {
    const response = await fetch('http://localhost:3000/api/expenses');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const totalAmount = document.getElementById('total-amount');
    totalAmount.textContent = `$${data.totalAmount.toFixed(2)}`

    const expenseCount = document.getElementById('expense-count');
    expenseCount.textContent = `${data.totalCount}`;

    const highestExpenseEl = document.getElementById("highest-expense");
    const highestSubtitleEl = document.getElementById("highest-expense-subtitle");

    if (data.highestExpense) {
      highestExpenseEl.textContent = `$${data.highestExpense.amount.toFixed(2)}`;
      highestSubtitleEl.textContent = `${data.highestExpense.title} - ${data.highestExpense.date}`;
    } else {
      highestExpenseEl.textContent = "$0.00";
      highestSubtitleEl.textContent = "No data";
    }

    originalExpenses = [...data.expenses];
    expenses = [...data.expenses];
    renderTable(expenses);
  } catch (error) {
    console.error('Data fetch failed:', error);
    showError("Failed to connect to the server. Please check your connection and try again.");
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-start text-md-center text-danger py-4">Failed to load data. Please try again.</td>
      </tr>
    `;
  }
}
fetchExpenses();


// Rendering the Table Data
function renderTable(expenses) {
  const tbody = document.getElementById("expense-table-body");
  tbody.innerHTML = "";

  expenses.forEach(expense => {
    const badgeColors = {
      'Food': 'text-bg-danger',
      'Bills': 'text-bg-warning',
      'Transport': 'text-bg-info',
      'Entertainment': 'text-bg-secondary'
    };

    let badgeClass = badgeColors[expense.category] || 'text-bg-primary';

    const row = `
      <tr>
        <td class="py-3 text-capitalize">${expense.title}</td>
        <td class="py-3">$${expense.amount.toFixed(2)}</td>
        <td class="py-3"><span class="badge ${badgeClass}">${expense.category}</span></td>
        <td class="py-3">${expense.date}</td>
        <td class="py-3">
          <button class="btn btn-sm btn-outline-info me-2 edit-btn" data-id="${expense.id}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${expense.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>`
    tbody.insertAdjacentHTML('beforeend', row);
  });
}


// Post -> Creating new Expense through a Form
document.getElementById("expense-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const submitBtn = document.getElementById("submit-btn");

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Adding...`;

  const title = document.getElementById("title").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category-select").value;
  const date = document.getElementById("date").value;

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const response = await fetch("http://localhost:3000/api/expenses", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, amount, category, date })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    event.target.reset();

    fetchExpenses()
  } catch (error) {
    console.error('Data fetch failed:', error);
    showError("Failed to connect to the server. Please check your connection and try again.");
  } finally {
    // Post-flight
    submitBtn.disabled = false;
    submitBtn.innerText = "Add Expense";
  }
})


// Delete -> Deleting an Expense With a Confirm Alert
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
let expenseToDelete = null;

document.getElementById("expense-table-body").addEventListener("click", function (event) {
  const deleteBtn = event.target.closest('.delete-btn');

  if (deleteBtn) {
    expenseToDelete = deleteBtn.getAttribute('data-id');
    deleteModal.show();
  }
});

document.getElementById("confirm-delete-btn").addEventListener("click", async function () {
  if (!expenseToDelete) return;

  try {
    const response = await fetch(`http://localhost:3000/api/expenses/${expenseToDelete}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    deleteModal.hide();
    fetchExpenses();

  } catch (error) {
    console.error('Data fetch failed:', error);
    showError("Failed to connect to the server. Please check your connection and try again.");
  } finally {
    expenseToDelete = null;
  }
});


//PUT -> Updating an Expense
const updateModal = new bootstrap.Modal(document.getElementById('updateModal'));
let expenseToEdit = null;

document.getElementById("expense-table-body").addEventListener("click", async function (event) {
  const editBtn = event.target.closest(".edit-btn");

  if (editBtn) {
    expenseToEdit = editBtn.getAttribute("data-id");

    const row = event.target.closest('tr');
    const title = row.children[0].innerText;
    const amount = row.children[1].innerText.replace('$', '');
    const category = row.children[2].innerText;
    const date = row.children[3].innerText;

    document.getElementById('edit-title').value = title;
    document.getElementById('edit-amount').value = parseFloat(amount);
    document.getElementById('edit-category').value = category;
    document.getElementById('edit-date').value = date;

    updateModal.show();
  }
})

document.getElementById("confirm-update-btn").addEventListener("click", async function (event) {
  if (!expenseToEdit) return;

  const title = document.getElementById("edit-title").value;
  const amount = parseFloat(document.getElementById("edit-amount").value);
  const category = document.getElementById("edit-category").value;
  const date = document.getElementById("edit-date").value;

  try {
    const response = await fetch(`http://localhost:3000/api/expenses/${expenseToEdit}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, amount, category, date })
    })

    updateModal.hide();
    fetchExpenses();
  } catch (error) {
    console.error('Data fetch failed:', error);
    showError("Failed to connect to the server. Please check your connection and try again.");
  } finally {
    expenseToEdit = null;
  }
})


// Search and Filtering the table
document.getElementById("search-input").addEventListener("input", applyFilters);
document.getElementById("filter-category").addEventListener("change", applyFilters)
document.getElementById("filter-month").addEventListener("change", applyFilters)

document.getElementById("clear-filters-btn").addEventListener("click", function () {
  document.getElementById("search-input").value = "";
  document.getElementById("filter-category").value = "All";
  document.getElementById("filter-month").value = "All";
  applyFilters();
});

function applyFilters() {
  const tbody = document.getElementById("expense-table-body");
  const rows = tbody.children;

  const selectedSearchText = document.getElementById("search-input").value.toLowerCase();
  const selectedCategory = document.getElementById("filter-category").value;
  const selectedMonth = document.getElementById("filter-month").value;

  const existingNoMatch = document.getElementById("no-match-row");
  if (existingNoMatch) existingNoMatch.remove();
  let matchCount = 0;

  const clearBtn = document.getElementById("clear-filters-btn");
  if (selectedSearchText !== "" || selectedCategory !== "All" || selectedMonth !== "All") {
    clearBtn.classList.remove("invisible");
  } else {
    clearBtn.classList.add("invisible");
  }

  for (let row of rows) {
    const rowTitle = row.children[0].textContent.trim().toLowerCase();
    const rowCategory = row.children[2].textContent;
    const rowMonth = row.children[3].textContent;

    const matchTitle = selectedSearchText === "" || rowTitle.includes(selectedSearchText);
    const matchCategory = selectedCategory === "All" || rowCategory === selectedCategory;
    const matchMonth = selectedMonth === "All" || rowMonth.includes(selectedMonth);

    if (matchTitle && matchCategory && matchMonth) {
      row.style.display = "";
      matchCount++;
    } else {
      row.style.display = "none";
    }
  }

  if (matchCount === 0) {
    tbody.insertAdjacentHTML("beforeend", `
      <tr id="no-match-row">
        <td colspan="5" class="text-center py-4 text-muted">No expenses found matching these filters.</td>
      </tr>
    `);
  }

}


// Toggling between Dark (Default) and Light Themes
const darkBtn = document.getElementById("theme-dark-btn");
const lightBtn = document.getElementById("theme-light-btn");
const html = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

darkBtn.addEventListener("click", () => applyTheme("dark"));
lightBtn.addEventListener("click", () => applyTheme("light"));

function applyTheme(theme) {
  html.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    darkBtn.className = "btn btn-secondary active";
    lightBtn.className = "btn btn-outline-secondary";
  } else {
    lightBtn.className = "btn btn-warning active text-dark";
    darkBtn.className = "btn btn-outline-secondary";
  }
}


// Table Sorting
let activeColumn = null;
let sortState = 0; 
// 0: Unsorted, 1:   Ascending, 2: Descending

document.getElementById("table-header").addEventListener("click", function (event) {
  const header = event.target.closest("th");
  if (!header || !header.dataset.column) return;

  const column = header.dataset.column;

  // 1. Cycle the sort state
  if (activeColumn !== column) {
    activeColumn = column;
    sortState = 1;
  } else {
    sortState = (sortState + 1) % 3;
  }

  document.querySelectorAll(".sort-header i").forEach(icon => icon.remove());

  if (sortState === 0) {
    expenses = [...originalExpenses];
    activeColumn = null;
  } else {
    const isAscending = sortState === 1;
    const iconClass = isAscending ? "fa-arrow-up" : "fa-arrow-down";
    header.insertAdjacentHTML("beforeend", ` <i class="fa-solid ${iconClass}"></i>`);

    expenses.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (typeof valA === "number" && typeof valB === "number") {
        return isAscending ? valA - valB : valB - valA;
      } else {
        valA = String(valA);
        valB = String(valB);
        return isAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });
  }

  renderTable(expenses);
  applyFilters();
});

// CSV File
document.getElementById("export-csv-btn").addEventListener("click", () => {
  if (!expenses || expenses.length === 0) return;

  const headers = ["Title", "Amount", "Category", "Date"];

  const csvRows = expenses.map(e =>
    `"${e.title}",${e.amount},"${e.category}","${e.date}"`
  );

  const csvContent = [headers.join(","), ...csvRows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "expenses.csv";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
});


//Global Error
function showError(message) {
  const container = document.getElementById("error-container");
  container.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show mb-0 text-center" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}