document.addEventListener("DOMContentLoaded", () => {
  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================
  function showNotification(title, message, type = 'success', duration = 3000) {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconSvg = type === 'success' ? `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ` : type === 'error' ? `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ` : `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    
    notification.innerHTML = `
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

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
  const editStaffModal = document.getElementById("edit-staff-modal");
  const editStaffClose = document.getElementById("edit-staff-close");
  const editStaffCancel = document.getElementById("edit-staff-cancel");
  const editStaffSave = document.getElementById("edit-staff-save");
  const esName = document.getElementById("es-name");
  const esEmail = document.getElementById("es-email");
  const esId = document.getElementById("es-id");
  const esDate = document.getElementById("es-date");
  const esTickets = document.getElementById("es-tickets");
  const esDept = document.getElementById("es-dept");
  const esNumber = document.getElementById("es-number");
  const esCity = document.getElementById("es-city");
  const esProvince = document.getElementById("es-province");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const addCategoryModal = document.getElementById("add-category-modal");
  const addCategoryClose = document.getElementById("add-category-close");
  const addCategoryCancel = document.getElementById("add-category-cancel");
  const addCategorySave = document.getElementById("add-category-save");
  const categoryCodeInput = document.getElementById("category-code");
  const categoryNameInput = document.getElementById("category-name");
  const viewUserModal = document.getElementById("view-user-modal");
  const viewUserClose = document.getElementById("view-user-close");
  const viewUserCloseBtn = document.getElementById("view-user-close-btn");
  const vuName = document.getElementById("vu-name");
  const vuEmail = document.getElementById("vu-email");
  const vuId = document.getElementById("vu-id");
  const vuTickets = document.getElementById("vu-tickets");
  const vuDate = document.getElementById("vu-date");
  const vuNumber = document.getElementById("vu-number");
  const vuAddress = document.getElementById("vu-address");
  const viewStaffModal = document.getElementById("view-staff-modal");
  const viewStaffClose = document.getElementById("view-staff-close");
  const viewStaffCloseBtn = document.getElementById("view-staff-close-btn");
  const vsName = document.getElementById("vs-name");
  const vsEmail = document.getElementById("vs-email");
  const vsId = document.getElementById("vs-id");
  const vsDept = document.getElementById("vs-dept");
  const vsDate = document.getElementById("vs-date");
  const vsTickets = document.getElementById("vs-tickets");
  const vsNumber = document.getElementById("vs-number");
  const vsAddress = document.getElementById("vs-address");
  const viewCategoryModal = document.getElementById("view-category-modal");
  const viewCategoryClose = document.getElementById("view-category-close");
  const viewCategoryCloseBtn = document.getElementById("view-category-close-btn");
  const vcCode = document.getElementById("vc-code");
  const vcName = document.getElementById("vc-name");
  const vcDate = document.getElementById("vc-date");
  const vcStaff = document.getElementById("vc-staff");
  const vcTickets = document.getElementById("vc-tickets");
  const editCategoryModal = document.getElementById("edit-category-modal");
  const editCategoryClose = document.getElementById("edit-category-close");
  const editCategoryCancel = document.getElementById("edit-category-cancel");
  const editCategorySave = document.getElementById("edit-category-save");
  const ecCode = document.getElementById("ec-code");
  const ecName = document.getElementById("ec-name");
  const ecDate = document.getElementById("ec-date");
  const ecStaff = document.getElementById("ec-staff");
  const ecTickets = document.getElementById("ec-tickets");

  let editingStaffId = null;

  const data = {
    users: [],
    staff: [],
    category: [],
    categoriesList: [],
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
        ({ id, name, email, date, tickets }) => `
          <tr data-user-id="${id || ""}">
            <td>${name || ""}</td>
            <td>${email || ""}</td>
            <td>${formatDate(date)}</td>
            <td class="center">${tickets ?? 0}</td>
            <td><button class="ghost-btn small view-user-btn"><span aria-hidden="true">👁</span> View Details</button></td>
          </tr>
        `
      )
      .join("");
    attachUserViewHandlers();
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
        ({ id, name, department, date, tickets }) => `
          <tr data-staff-id="${id || ""}">
            <td>${name || ""}</td>
            <td>${department || ""}</td>
            <td>${formatDate(date)}</td>
            <td class="center">${tickets ?? 0}</td>
            <td>
              <div class="action-icons">
                <button class="icon-action-btn view-btn staff-view-btn" title="View">👁</button>
                <button class="icon-action-btn edit-btn" title="Update">✏️</button>
                <button class="icon-action-btn delete-btn" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
    attachStaffViewHandlers();
    attachStaffEditHandlers();
    attachStaffDeleteHandlers();
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
        ({ id, code, name, date, staffCount, tickets }) => `
          <tr data-category-id="${id || ""}" data-category-code="${code || ""}">
            <td>${name || ""}</td>
            <td>${formatDate(date)}</td>
            <td class="center">${staffCount ?? 0}</td>
            <td class="center">${tickets ?? 0}</td>
            <td>
              <div class="action-icons">
                <button class="icon-action-btn view-btn category-view-btn" title="View">👁</button>
                <button class="icon-action-btn edit-btn" title="Update">✏️</button>
                <button class="icon-action-btn delete-btn" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
    attachCategoryViewHandlers();
    attachCategoryEditHandlers();
    attachCategoryDeleteHandlers();
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

  const setDepartmentOptions = (selectEl) => {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Select a department</option>';
    data.categoriesList.forEach((c) => {
      const name = c.name || c["category name"] || "";
      if (!name) return;
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      selectEl.appendChild(opt);
    });
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/management/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const categories = await res.json();
      data.category = Array.isArray(categories) ? categories : [];
      data.categoriesList = data.category.map((c) => ({ name: c.name || c["category name"] || "" }));
    } catch (err) {
      console.error(err);
      data.category = [];
    }
    setDepartmentOptions(staffDeptInput);
    setDepartmentOptions(esDept);
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

      showNotification('Success', `Category "${payload.name}" created successfully`, 'success');
      await loadCategories();
      closeAddCategoryModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create category");
    }
  });

  const openUserModal = (user) => {
    if (!viewUserModal) return;
    vuName.textContent = user?.name || "—";
    vuEmail.textContent = user?.email || "—";
    vuId.textContent = user?.userId || user?.id || "—";
    vuTickets.textContent = user?.tickets ?? 0;
    vuDate.textContent = formatDate(user?.date);
    vuNumber.textContent = user?.number || "Not provided";
    const address = user?.address || [user?.city, user?.province].filter(Boolean).join(", ");
    vuAddress.textContent = address || "Not provided";
    viewUserModal.classList.remove("hidden");
  };

  const closeUserModal = () => {
    viewUserModal?.classList.add("hidden");
  };

  viewUserClose?.addEventListener("click", closeUserModal);
  viewUserCloseBtn?.addEventListener("click", closeUserModal);

  const fetchUserDetails = async (userId) => {
    try {
      const res = await fetch(`/api/users/id/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const attachUserViewHandlers = () => {
    document.querySelectorAll(".view-user-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const tr = e.currentTarget.closest("tr");
        const userId = tr?.dataset.userId;
        if (!userId) return;
        const summary = data.users.find((u) => u.id === userId);
        const details = await fetchUserDetails(userId);
        openUserModal({
          ...summary,
          ...details,
          userId: userId,
        });
      });
    });
  };

  const openStaffModal = (staff) => {
    if (!viewStaffModal) return;
    vsName.textContent = staff?.name || "—";
    vsEmail.textContent = staff?.email || "—";
    vsId.textContent = staff?.id || "—";
    vsDept.textContent = staff?.department || "—";
    vsDate.textContent = formatDate(staff?.date);
    vsTickets.textContent = staff?.tickets ?? 0;
    vsNumber.textContent = staff?.number || "Not provided";
    const address = staff?.address || [staff?.city, staff?.province].filter(Boolean).join(", ");
    vsAddress.textContent = address || "Not provided";
    viewStaffModal.classList.remove("hidden");
  };

  const closeStaffModal = () => {
    viewStaffModal?.classList.add("hidden");
  };

  viewStaffClose?.addEventListener("click", closeStaffModal);
  viewStaffCloseBtn?.addEventListener("click", closeStaffModal);

  const openCategoryModal = (category) => {
    if (!viewCategoryModal) return;
    vcCode.textContent = category?.code || "—";
    vcName.textContent = category?.name || "—";
    vcDate.textContent = formatDate(category?.date);
    vcStaff.textContent = category?.staffCount ?? 0;
    vcTickets.textContent = category?.tickets ?? 0;
    viewCategoryModal.classList.remove("hidden");
  };

  const closeCategoryModal = () => {
    viewCategoryModal?.classList.add("hidden");
  };

  viewCategoryClose?.addEventListener("click", closeCategoryModal);
  viewCategoryCloseBtn?.addEventListener("click", closeCategoryModal);

  let editingCategoryId = null;

  const openEditCategoryModal = (category) => {
    if (!editCategoryModal) return;
    editingCategoryId = category?.id || null;
    ecCode.value = category?.code || "";
    ecName.value = category?.name || "";
    ecDate.textContent = formatDate(category?.date);
    ecStaff.textContent = category?.staffCount ?? 0;
    ecTickets.textContent = category?.tickets ?? 0;
    editCategoryModal.classList.remove("hidden");
  };

  const closeEditCategoryModal = () => {
    editCategoryModal?.classList.add("hidden");
    editingCategoryId = null;
    ecCode.value = "";
    ecName.value = "";
    ecDate.textContent = "—";
    ecStaff.textContent = "0";
    ecTickets.textContent = "0";
  };

  editCategoryClose?.addEventListener("click", closeEditCategoryModal);
  editCategoryCancel?.addEventListener("click", closeEditCategoryModal);

  const attachStaffViewHandlers = () => {
    document.querySelectorAll(".staff-view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tr = e.currentTarget.closest("tr");
        const staffId = tr?.dataset.staffId;
        if (!staffId) return;
        const summary = data.staff.find((s) => s.id === staffId);
        openStaffModal(summary || {});
      });
    });
  };

  const openEditStaffModal = (staff) => {
    if (!editStaffModal) return;
    editingStaffId = staff?.id || null;
    esName.textContent = staff?.name || "—";
    esEmail.textContent = staff?.email || "—";
    esId.textContent = staff?.id || "—";
    esDate.textContent = formatDate(staff?.date);
    esTickets.textContent = staff?.tickets ?? 0;
    setDepartmentOptions(esDept);
    esDept.value = staff?.department || "";
    esNumber.value = staff?.number || "";
    esCity.value = staff?.city || "";
    esProvince.value = staff?.province || "";
    editStaffModal.classList.remove("hidden");
  };

  const closeEditStaffModal = () => {
    editStaffModal?.classList.add("hidden");
    editingStaffId = null;
    esId.textContent = "—";
    esDate.textContent = "—";
    esTickets.textContent = "0";
    esDept.value = "";
    esNumber.value = "";
    esCity.value = "";
    esProvince.value = "";
  };

  editStaffClose?.addEventListener("click", closeEditStaffModal);
  editStaffCancel?.addEventListener("click", closeEditStaffModal);

  const attachStaffEditHandlers = () => {
    document.querySelectorAll("#mgmt-table-body-staff .edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tr = e.currentTarget.closest("tr");
        const staffId = tr?.dataset.staffId;
        if (!staffId) return;
        const summary = data.staff.find((s) => s.id === staffId);
        if (!summary) return;
        openEditStaffModal(summary);
      });
    });
  };

  const attachCategoryViewHandlers = () => {
    document.querySelectorAll("#mgmt-table-body-category .category-view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tr = e.currentTarget.closest("tr");
        const catId = tr?.dataset.categoryId;
        if (!catId) return;
        const category = data.category.find((c) => c.id === catId) || {};
        openCategoryModal(category);
      });
    });
  };

  const attachCategoryEditHandlers = () => {
    document.querySelectorAll("#mgmt-table-body-category .edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tr = e.currentTarget.closest("tr");
        const catId = tr?.dataset.categoryId;
        if (!catId) return;
        const category = data.category.find((c) => c.id === catId) || {};
        openEditCategoryModal(category);
      });
    });
  };

  const attachCategoryDeleteHandlers = () => {
    document.querySelectorAll("#mgmt-table-body-category .delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const tr = e.currentTarget.closest("tr");
        const catId = tr?.dataset.categoryId;
        if (!catId) return;
        const category = data.category.find((c) => c.id === catId);
        const name = category?.name || "this category";
        const confirmed = window.confirm(`Delete ${name}? This action can't be undone.`);
        if (!confirmed) return;

        try {
          const res = await fetch(`/api/management/categories/${encodeURIComponent(catId)}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Failed to delete category");
          }
          showNotification('Success', `Category \"${name}\" deleted successfully`, 'success');
          await Promise.all([loadCategories(), loadDepartments()]);
        } catch (err) {
          console.error(err);
          alert(err.message || "Failed to delete category");
        }
      });
    });
  };

  const attachStaffDeleteHandlers = () => {
    document.querySelectorAll("#mgmt-table-body-staff .delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const tr = e.currentTarget.closest("tr");
        const staffId = tr?.dataset.staffId;
        if (!staffId) return;
        const staff = data.staff.find((s) => s.id === staffId);
        const name = staff?.name || "this staff";
        const confirmed = window.confirm(`Delete ${name}? This action can't be undone.`);
        if (!confirmed) return;

        try {
          const res = await fetch(`/api/management/staff/${encodeURIComponent(staffId)}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Failed to delete staff");
          }
          showNotification('Success', `Staff member \"${name}\" deleted successfully`, 'success');
          await Promise.all([loadStaff(), loadCategories()]);
        } catch (err) {
          console.error(err);
          alert(err.message || "Failed to delete staff");
        }
      });
    });
  };

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
      data.categoriesList = Array.isArray(categories) ? categories : [];
      setDepartmentOptions(staffDeptInput);
      setDepartmentOptions(esDept);
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

      showNotification('Success', `Staff member "${payload.name}" created successfully`, 'success');
      await loadStaff();
      closeAddStaffModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create staff");
    }
  });

  editStaffSave?.addEventListener("click", async () => {
    if (!editingStaffId) {
      closeEditStaffModal();
      return;
    }

    const payload = {
      department: esDept.value.trim(),
      number: esNumber.value.trim(),
      city: esCity.value.trim(),
      province: esProvince.value.trim(),
    };

    if (!payload.department) {
      alert("Department is required.");
      return;
    }

    try {
      const res = await fetch(`/api/management/staff/${encodeURIComponent(editingStaffId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update staff");
      }

      showNotification('Success', 'Staff member updated successfully', 'success');
      await loadStaff();
      closeEditStaffModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update staff");
    }
  });

  editCategorySave?.addEventListener("click", async () => {
    if (!editingCategoryId) {
      closeEditCategoryModal();
      return;
    }

    const payload = {
      code: ecCode.value.trim(),
      name: ecName.value.trim(),
    };

    if (!payload.code || !payload.name) {
      alert("Category code and name are required.");
      return;
    }

    try {
      const res = await fetch(`/api/management/categories/${encodeURIComponent(editingCategoryId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update category");
      }

      showNotification('Success', 'Category updated successfully', 'success');
      await loadCategories();
      await loadDepartments();
      closeEditCategoryModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update category");
    }
  });

  Promise.all([loadUsers(), loadStaff(), loadCategories()]);
  // preload departments for the modal
  loadDepartments();
});
