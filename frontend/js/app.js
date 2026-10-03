const API_URL = "http://localhost:3000/api/expenses";
const CATEGORY_API_URL = "http://localhost:3000/api/categories";


const BOOTSTRAP_LTR = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css";
const BOOTSTRAP_RTL = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.rtl.min.css";

const SERVER_OFF = "SERVER_OFF";
const SERVER_ERROR = "SERVER_ERROR";


let CATEGORIES = [];


const BADGE_COLORS = {
  Food: "success",
  Transport: "primary",
  Bills: "danger",
  Entertainment: "warning",
  Other: "secondary"
};

const BADGE_COLOR_PALETTE = ["success", "primary", "danger", "warning", "secondary", "info", "dark"];

function getBadgeColor(category) {
  if (BADGE_COLORS[category]) {
    return BADGE_COLORS[category];
  }

  const index = CATEGORIES.indexOf(category);
  return BADGE_COLOR_PALETTE[index % BADGE_COLOR_PALETTE.length];
}


function setCategoryText(element, category) {
  const key = "cat_" + category;
  if (translations[currentLanguage][key]) {
    element.setAttribute("data-i18n", key);
    element.textContent = t(key);
  } else {
    element.removeAttribute("data-i18n");
    element.textContent = category;
  }
}
 

const alertBox = document.getElementById("alertBox");
const editAlertBox = document.getElementById("editAlertBox");
const spinner = document.getElementById("spinner");
const tableBody = document.getElementById("tableBody");
const filterSelect = document.getElementById("filterSelect");
const sortButtons = document.querySelectorAll(".sort-button");

const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const highestAmount = document.getElementById("highestAmount");
const highestTitle = document.getElementById("highestTitle");

const languageButton = document.getElementById("languageButton");
const themeButton = document.getElementById("themeButton");

// add form
const addForm = document.getElementById("addForm");
const titleInput = document.getElementById("titleInput");
const amountInput = document.getElementById("amountInput");
const categoryInput = document.getElementById("categoryInput");
const otherCategoryWrapper = document.getElementById("otherCategoryWrapper");
const otherCategoryInput = document.getElementById("otherCategoryInput");
const dateInput = document.getElementById("dateInput");
const addButton = document.getElementById("addButton");

// edit modal
const editForm = document.getElementById("editForm");
const editTitleInput = document.getElementById("editTitleInput");
const editAmountInput = document.getElementById("editAmountInput");
const editCategoryInput = document.getElementById("editCategoryInput");
const editDateInput = document.getElementById("editDateInput");
const saveButton = document.getElementById("saveButton");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

// ---------- data of the page ----------

let allExpenses = [];        // all the expenses that the server sent

// column is null until the user clicks an arrow for the first time
let sortState = { column: null, direction: "asc" };
let editingId = null;        // the id of the expense that is open in the edit modal
let currentLanguage = "en";  // "en" or "ar"


// gives the text of a key in the current language
function t(key) {
  return translations[currentLanguage][key];
}

// It goes over every element that has data-i18n (or data-i18n-placeholder) and puts the right text.
function translatePage() {
  const textElements = document.querySelectorAll("[data-i18n]");
  for (const element of textElements) {
    element.textContent = t(element.getAttribute("data-i18n"));
  }

  const placeholderElements = document.querySelectorAll("[data-i18n-placeholder]");
  for (const element of placeholderElements) {
    element.placeholder = t(element.getAttribute("data-i18n-placeholder"));
  }

  document.title = t("app_name");
}

// For Arabic the page must be right-to-left (dir="rtl"), and Bootstrap has a special RTL css file for that.
function setLanguage(language) {
  currentLanguage = language;
  localStorage.setItem("language", language);

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.getElementById("bootstrapCss").href = language === "ar" ? BOOTSTRAP_RTL : BOOTSTRAP_LTR;

  translatePage();
}



function setTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);

  // the button shows the mode we will go to when we click it
  const key = theme === "dark" ? "theme_light" : "theme_dark";
  themeButton.setAttribute("data-i18n", key);
  themeButton.textContent = t(key);
}


// one function for all the requests, so I don't repeat the fetch code 4 times
async function sendRequest(method, url, body) {
  const options = { method: method };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(SERVER_OFF);
  }

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    // 400, 404 ... the server sends { message: "..." } so we show it
    if (response.status < 500 && data && data.message) {
      throw new Error(data.message);
    }
    throw new Error(SERVER_ERROR);
  }

  return data;
}

async function getExpenses() {
  return await sendRequest("GET", API_URL);
}

async function getCategories() {
  return await sendRequest("GET", CATEGORY_API_URL);
}

async function addExpense(expense) {
  return await sendRequest("POST", API_URL, expense);
}

async function updateExpense(id, expense) {
  return await sendRequest("PUT", API_URL + "/" + id, expense);
}

async function deleteExpense(id) {
  return await sendRequest("DELETE", API_URL + "/" + id);
}


// shows a Bootstrap alert (it replaces the old one). type: "danger" or "success"
function showAlert(message, type, box) {
  box.innerHTML = "";

  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-" + type + " alert-dismissible fade show";
  alertDiv.setAttribute("role", "alert");

  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close";
  closeButton.setAttribute("data-bs-dismiss", "alert");
  closeButton.setAttribute("aria-label", "Close");

  alertDiv.appendChild(messageSpan);
  alertDiv.appendChild(closeButton);
  box.appendChild(alertDiv);

  // the success messages disappear after 3 seconds
  if (type === "success") {
    setTimeout(function () {
      alertDiv.remove();
    }, 3000);
  }

  return messageSpan;
}


function showAlertKey(key, type, box) {
  const messageSpan = showAlert(t(key), type, box);
  messageSpan.setAttribute("data-i18n", key);
}

// shows the right message for an error that came from sendRequest
function showError(error, box) {
  if (error.message === SERVER_OFF) {
    showAlertKey("err_server_off", "danger", box);
  } else if (error.message === SERVER_ERROR) {
    showAlertKey("err_server", "danger", box);
  } else {
    // a message that the server sent (400 or 404)
    showAlert(error.message, "danger", box);
  }
}

function showSpinner(show) {
  if (show) {
    spinner.classList.remove("d-none");
  } else {
    spinner.classList.add("d-none");
  }
}


// shows a red message under the field (key is a key from translations.js)
function showFieldError(field, key) {
  field.classList.add("is-invalid");
  const feedback = field.nextElementSibling;   // the div.invalid-feedback under the field
  feedback.setAttribute("data-i18n", key);
  feedback.textContent = t(key);
}

function clearFieldError(field) {
  field.classList.remove("is-invalid");
}


function validateFields(titleField, amountField, categoryField, dateField, otherCategoryField) {
  let isValid = true;

  // title: required, and 100 characters at most (like the database)
  const title = titleField.value.trim();
  if (title === "") {
    showFieldError(titleField, "err_title_required");
    isValid = false;
  } else if (title.length > 100) {
    showFieldError(titleField, "err_title_long");
    isValid = false;
  }

  const amountText = amountField.value.trim();
  const amount = Number(amountText);
  if (amountText === "") {
    showFieldError(amountField, "err_amount_required");
    isValid = false;
  } else if (isNaN(amount) || amount <= 0) {
    showFieldError(amountField, "err_amount_positive");
    isValid = false;
  } else if (amount > 99999999.99) {
    showFieldError(amountField, "err_amount_big");
    isValid = false;
  } else if (amountText.includes(".") && amountText.split(".")[1].length > 2) {
    showFieldError(amountField, "err_amount_decimals");
    isValid = false;
  }

  // category: must be one of the categories we got from the server
  if (!CATEGORIES.includes(categoryField.value)) {
    showFieldError(categoryField, "err_category_required");
    isValid = false;
  } else if (categoryField.value === "Other" && otherCategoryField) {
    // the add form only: when "Other" is picked, the text field under it is required
    const otherCategory = otherCategoryField.value.trim();
    if (otherCategory === "") {
      showFieldError(otherCategoryField, "err_other_category_required");
      isValid = false;
    } else if (otherCategory.length > 20) {
      showFieldError(otherCategoryField, "err_other_category_long");
      isValid = false;
    }
  }

  // date: required, in the format YYYY-MM-DD (10 characters)
  if (dateField.value === "" || dateField.value.length !== 10) {
    showFieldError(dateField, "err_date_required");
    isValid = false;
  }

  return isValid;
}


function renderSummary(list) {
  let total = 0;
  let highest = null;

  for (let i = 0; i < list.length; i++) {
    total = total + list[i].amount;
    if (highest === null || list[i].amount > highest.amount) {
      highest = list[i];
    }
  }

  totalAmount.textContent = total.toFixed(2);
  expenseCount.textContent = list.length;

  if (highest === null) {
    highestAmount.textContent = "0.00";
    highestTitle.textContent = "-";
  } else {
    highestAmount.textContent = highest.amount.toFixed(2);
    highestTitle.textContent = highest.title;
  }
}

// builds the rows of the table with the DOM
function renderTable(list) {
  tableBody.innerHTML = "";

  if (list.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.className = "text-center text-body-secondary py-4";
    emptyCell.setAttribute("data-i18n", "no_expenses");
    emptyCell.textContent = t("no_expenses");
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const expense = list[i];
    const row = document.createElement("tr");

    // textContent (not innerHTML), so the text that the user typed can never run as HTML
    const titleCell = document.createElement("td");
    titleCell.textContent = expense.title;

    const amountCell = document.createElement("td");
    amountCell.className = "text-nowrap";
    amountCell.textContent = expense.amount.toFixed(2);

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge text-bg-" + getBadgeColor(expense.category);
    setCategoryText(badge, expense.category);
    categoryCell.appendChild(badge);

    const dateCell = document.createElement("td");
    dateCell.className = "text-nowrap";
    dateCell.textContent = expense.date;

    const actionsCell = document.createElement("td");
    actionsCell.className = "text-nowrap actions-cell";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-sm btn-primary me-1";
    editButton.setAttribute("data-i18n", "btn_edit");
    editButton.textContent = t("btn_edit");
    editButton.addEventListener("click", function () {
      openEditModal(expense);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-sm btn-danger";
    deleteButton.setAttribute("data-i18n", "btn_delete");
    deleteButton.textContent = t("btn_delete");
    deleteButton.addEventListener("click", function () {
      handleDelete(expense.id);
    });

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(titleCell);
    row.appendChild(amountCell);
    row.appendChild(categoryCell);
    row.appendChild(dateCell);
    row.appendChild(actionsCell);
    tableBody.appendChild(row);
  }
}

// sorts a copy of the list by sortState.column and sortState.direction.
// if no column was clicked yet, the list is returned as it is (newest first)
function sortList(list) {
  if (!sortState.column) {
    return list;
  }

  const sorted = list.slice();   // slice() copies the array, so allExpenses itself never changes order

  sorted.sort(function (a, b) {
    let result;

    if (sortState.column === "amount") {
      result = a.amount - b.amount;
    } else if (sortState.column === "date") {
      // the date is text "YYYY-MM-DD", so comparing it as text already sorts it by time
      result = a.date < b.date ? -1 : (a.date > b.date ? 1 : 0);
    } else {
      // "title" or "category": compare the text, alphabet order
      result = a[sortState.column].localeCompare(b[sortState.column]);
    }

    return sortState.direction === "asc" ? result : -result;
  });

  return sorted;
}

// redraws every arrow: ▼ on the active column (next click goes back to asc),
// ▲ everywhere else (the default - next click sorts ascending)
function updateSortArrows() {
  for (const button of sortButtons) {
    const arrow = button.querySelector(".sort-arrow");
    const isActive = button.getAttribute("data-column") === sortState.column;
    if (isActive && sortState.direction === "asc") {
      arrow.textContent = "▼";
    } else {
      arrow.textContent = "▲";
    }
  }
}

// called when the user clicks one of the 4 sort arrows
function handleSortClick(column) {
  if (sortState.column !== column) {
    // a different column than before: start with ascending
    sortState.column = column;
    sortState.direction = "asc";
  } else if (sortState.direction === "asc") {
    sortState.direction = "desc";
  } else {
    sortState.direction = "asc";
  }

  updateSortArrows();
  applyFilter();
}

// shows only the expenses of the selected category ("" means All), sorted
function applyFilter() {
  const selectedCategory = filterSelect.value;

  let list = allExpenses;
  if (selectedCategory !== "") {
    list = allExpenses.filter(function (expense) {
      return expense.category === selectedCategory;
    });
  }

  list = sortList(list);
  renderTable(list);
}


// if something fails it throws the error, and the function that called refresh shows the alert
async function refresh() {
  showSpinner(true);
  try {
    CATEGORIES = await getCategories();
    fillCategorySelect(filterSelect, true);    // true: keep the filter the user had chosen
    fillCategorySelect(categoryInput, false);
    fillCategorySelect(editCategoryInput, false);

    allExpenses = await getExpenses();
    renderSummary(allExpenses);
    applyFilter();
  } finally {
    showSpinner(false);
  }
}


async function handleAdd(event) {
  event.preventDefault();

  if (!validateFields(titleInput, amountInput, categoryInput, dateInput, otherCategoryInput)) {
    return;
  }

  const expense = {
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  };

  // when "Other" is picked, send the typed name too. The server saves the
  // expense with that name as its category.
  if (categoryInput.value === "Other") {
    expense.otherCategory = otherCategoryInput.value.trim();
  }

  addButton.disabled = true;   // so the user can't click twice
  try {
    await addExpense(expense);
    addForm.reset();
    dateInput.value = getToday();
    hideOtherCategoryField();   // form.reset() does not hide it or clear its error by itself
    await refresh();
    showAlertKey("msg_added", "success", alertBox);
  } catch (error) {
    showError(error, alertBox);
  } finally {
    addButton.disabled = false;
  }
}

// fills the modal with the data of the expense and opens it
function openEditModal(expense) {
  editingId = expense.id;

  editTitleInput.value = expense.title;
  editAmountInput.value = expense.amount;
  editCategoryInput.value = expense.category;
  editDateInput.value = expense.date;

  const fields = [editTitleInput, editAmountInput, editCategoryInput, editDateInput];
  for (const field of fields) {
    clearFieldError(field);
  }
  editAlertBox.innerHTML = "";

  editModal.show();
}

async function handleSave(event) {
  event.preventDefault();

  if (!validateFields(editTitleInput, editAmountInput, editCategoryInput, editDateInput)) {
    return;
  }

  const expense = {
    title: editTitleInput.value.trim(),
    amount: Number(editAmountInput.value),
    category: editCategoryInput.value,
    date: editDateInput.value
  };

  saveButton.disabled = true;
  try {
    await updateExpense(editingId, expense);
    await refresh();
    editModal.hide();
    showAlertKey("msg_updated", "success", alertBox);
  } catch (error) {
    // the modal is still open, so the error is shown inside it
    showError(error, editAlertBox);
  } finally {
    saveButton.disabled = false;
  }
}

async function handleDelete(id) {
  if (!confirm(t("confirm_delete"))) {
    return;
  }

  try {
    await deleteExpense(id);
    await refresh();
    showAlertKey("msg_deleted", "success", alertBox);
  } catch (error) {
    showError(error, alertBox);
  }
}


// today's date as YYYY-MM-DD (I don't use toISOString because it can give yesterday's date)
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}


function fillCategorySelect(select, keepSelection) {
  const previousValue = select.value;

  while (select.options.length > 1) {
    select.remove(1);
  }

  for (const category of CATEGORIES) {
    const option = document.createElement("option");
    option.value = category;
    setCategoryText(option, category);
    select.appendChild(option);
  }

  if (keepSelection && CATEGORIES.includes(previousValue)) {
    select.value = previousValue;
  }
}

// shows the "Other category" text field under the Category select
function showOtherCategoryField() {
  otherCategoryWrapper.classList.remove("d-none");
}

// hides it again, and clears its value and its red error
function hideOtherCategoryField() {
  otherCategoryWrapper.classList.add("d-none");
  otherCategoryInput.value = "";
  clearFieldError(otherCategoryInput);
}


addForm.addEventListener("submit", handleAdd);
editForm.addEventListener("submit", handleSave);
filterSelect.addEventListener("change", applyFilter);

// each sort arrow calls handleSortClick with its own column name with its own column name
for (const button of sortButtons) {
  button.addEventListener("click", function () {
    handleSortClick(button.getAttribute("data-column"));
  });
}

// shows or hides the "Other category" text field as the user changes the select
categoryInput.addEventListener("change", function () {
  if (categoryInput.value === "Other") {
    showOtherCategoryField();
  } else {
    hideOtherCategoryField();
  }
});

// each item in the dropdown sets its own language
const languageItems = document.querySelectorAll("#languageButton + .dropdown-menu .dropdown-item");
for (const item of languageItems) {
  item.addEventListener("click", function () {
    setLanguage(item.getAttribute("data-lang"));
  });
}

themeButton.addEventListener("click", function () {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

// when the user types in a field, its red error disappears
const allFields = [
  titleInput, amountInput, categoryInput, otherCategoryInput, dateInput,
  editTitleInput, editAmountInput, editCategoryInput, editDateInput
];
for (const field of allFields) {
  field.addEventListener("input", function () {
    clearFieldError(field);
  });
}


async function start() {

  dateInput.value = getToday();
  document.getElementById("year").textContent = new Date().getFullYear();

  // the language and the theme that the user chose last time (or the default ones)
  setLanguage(localStorage.getItem("language") || "en");
  setTheme(localStorage.getItem("theme") || "light");

  try {
    await refresh();
  } catch (error) {
    showError(error, alertBox);
  }
}

start();
