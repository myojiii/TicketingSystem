document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".mgmt-tab");
  const tableBodyUsers = document.getElementById("mgmt-table-body");
  const tableBodyStaff = document.getElementById("mgmt-table-body-staff");
  const tableBodyCategory = document.getElementById("mgmt-table-body-category");
  const usersTable = document.querySelector('.mgmt-table[data-table="users"]');
  const staffTable = document.querySelector('.mgmt-table[data-table="staff"]');
  const categoryTable = document.querySelector('.mgmt-table[data-table="category"]');
  const staffActions = document.getElementById("staff-actions");
  const categoryActions = document.getElementById("category-actions");
  const addStaffBtn = document.getElementById("add-staff-btn");
  const addStaffModal = document.getElementById("add-staff-modal");
  const addStaffClose = document.getElementById("add-staff-close");
  const addStaffCancel = document.getElementById("add-staff-cancel");
  const addStaffSave = document.getElementById("add-staff-save");
  const staffNameInput = document.getElementById("staff-name");
  const staffEmailInput = document.getElementById("staff-email");
  const staffPasswordInput = document.getElementById("staff-password");
  const staffDeptInput = document.getElementById("staff-department");
  const staffNumberInput = document.getElementById("staff-number");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const addCategoryModal = document.getElementById("add-category-modal");
  const addCategoryClose = document.getElementById("add-category-close");
  const addCategoryCancel = document.getElementById("add-category-cancel");
  const addCategorySave = document.getElementById("add-category-save");
  const categoryCodeInput = document.getElementById("category-code");
  const categoryNameInput = document.getElementById("category-name");

  const data = {
    users: [],
    staff: [],
    category: [],
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  };

  const renderUsers = () => {
    if (!tableBodyUsers) return;
    const rows = data.users || [];
    if (!rows.length) {
      tableBodyUsers.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:24px;color:#6b7280;">No users found</td>
        </tr>
      `;
      return;
    }
    tableBodyUsers.innerHTML = rows
      .map(
        ({ name, email, date, tickets }) => `
          <tr>
            <td>${name || ""}</td>
            <td>${email || ""}</td>
            <td>${formatDate(date)}</td>
            <td class="center">${tickets ?? 0}</td>
            <td><button class="ghost-btn small"><span aria-hidden="true">👁</span> View Details</button></td>
          </tr>
        `
      )
      .join("");
  };

  const renderStaff = () => {
    if (!tableBodyStaff) return;
    const rows = data.staff || [];
    if (!rows.length) {
      tableBodyStaff.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:24px;color:#6b7280;">No staff found</td>
        </tr>
      `;
      return;
    }
    tableBodyStaff.innerHTML = rows
      .map(
        ({ name, department, date, tickets }) => `
          <tr>
            <td>${name || ""}</td>
            <td>${department || ""}</td>
            <td>${formatDate(date)}</td>
            <td class="center">${tickets ?? 0}</td>
            <td>
              <div class="action-icons">
                <button class="icon-action-btn view-btn" title="View">👁</button>
                <button class="icon-action-btn edit-btn" title="Update">✏️</button>
                <button class="icon-action-btn delete-btn" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
  };

  const renderCategory = () => {
    const rows = data.category || [];
    if (!rows.length) {
      tableBodyCategory.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:24px;color:#6b7280;">No categories found</td>
        </tr>
      `;
      return;
    }
    tableBodyCategory.innerHTML = rows
      .map(
        ({ name, date, staffCount, tickets }) => `
          <tr>
            <td>${name || ""}</td>
            <td>${formatDate(date)}</td>
            <td class="center">${staffCount ?? 0}</td>
            <td class="center">${tickets ?? 0}</td>
            <td>
              <div class="action-icons">
                <button class="icon-action-btn view-btn" title="View">👁</button>
                <button class="icon-action-btn edit-btn" title="Update">✏️</button>
                <button class="icon-action-btn delete-btn" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const key = tab.dataset.tab;
      if (key === "users") {
        usersTable?.classList.remove("hidden");
        staffTable?.classList.add("hidden");
        categoryTable?.classList.add("hidden");
        staffActions?.classList.add("hidden");
        categoryActions?.classList.add("hidden");
        renderUsers();
      } else if (key === "staff") {
        staffTable?.classList.remove("hidden");
        usersTable?.classList.add("hidden");
        categoryTable?.classList.add("hidden");
        staffActions?.classList.remove("hidden");
        categoryActions?.classList.add("hidden");
        renderStaff();
      } else {
        categoryTable?.classList.remove("hidden");
        usersTable?.classList.add("hidden");
        staffTable?.classList.add("hidden");
        staffActions?.classList.add("hidden");
        categoryActions?.classList.remove("hidden");
        renderCategory();
      }
    });
  });

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/management/users");
      if (!res.ok) throw new Error("Failed to load users");
      const users = await res.json();
      data.users = Array.isArray(users) ? users : [];
    } catch (err) {
      console.error(err);
      data.users = [];
    }
    renderUsers();
  };

  const loadStaff = async () => {
    try {
      const res = await fetch("/api/management/staff");
      if (!res.ok) throw new Error("Failed to load staff");
      const staff = await res.json();
      data.staff = Array.isArray(staff) ? staff : [];
    } catch (err) {
      console.error(err);
      data.staff = [];
    }
    renderStaff();
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/management/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const categories = await res.json();
      data.category = Array.isArray(categories) ? categories : [];
    } catch (err) {
      console.error(err);
      data.category = [];
    }
    renderCategory();
  };

  const openAddCategoryModal = () => {
    addCategoryModal?.classList.remove("hidden");
  };

  const closeAddCategoryModal = () => {
    addCategoryModal?.classList.add("hidden");
    categoryCodeInput.value = "";
    categoryNameInput.value = "";
  };

  addCategoryBtn?.addEventListener("click", openAddCategoryModal);
  addCategoryClose?.addEventListener("click", closeAddCategoryModal);
  addCategoryCancel?.addEventListener("click", closeAddCategoryModal);

  addCategorySave?.addEventListener("click", async () => {
    const payload = {
      code: categoryCodeInput.value.trim(),
      name: categoryNameInput.value.trim(),
    };

    if (!payload.code || !payload.name) {
      alert("Category code and name are required.");
      return;
    }

    try {
      const res = await fetch("/api/management/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create category");
      }

      await loadCategories();
      closeAddCategoryModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create category");
    }
  });

  const openAddStaffModal = () => {
    addStaffModal?.classList.remove("hidden");
  };

  const closeAddStaffModal = () => {
    addStaffModal?.classList.add("hidden");
    staffNameInput.value = "";
    staffEmailInput.value = "";
    staffPasswordInput.value = "";
    staffDeptInput.value = "";
    staffNumberInput.value = "";
  };

  addStaffBtn?.addEventListener("click", openAddStaffModal);
  addStaffClose?.addEventListener("click", closeAddStaffModal);
  addStaffCancel?.addEventListener("click", closeAddStaffModal);

  const loadDepartments = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const categories = await res.json();
      const select = staffDeptInput;
      if (!select) return;
      select.innerHTML = '<option value="">Select a department</option>';
      categories.forEach((c) => {
        const name = c.name || c["category name"] || "";
        if (name) {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  addStaffSave?.addEventListener("click", async () => {
    const payload = {
      name: staffNameInput.value.trim(),
      email: staffEmailInput.value.trim(),
      password: staffPasswordInput.value.trim(),
      department: staffDeptInput.value.trim(),
      number: staffNumberInput.value.trim(),
    };

    if (!payload.name || !payload.email || !payload.password || !payload.department) {
      alert("Name, email, password, and department are required.");
      return;
    }

    try {
      const res = await fetch("/api/management/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create staff");
      }

      await loadStaff();
      closeAddStaffModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create staff");
    }
  });

  Promise.all([loadUsers(), loadStaff(), loadCategories()]);
  // preload departments for the modal
  loadDepartments();
});
