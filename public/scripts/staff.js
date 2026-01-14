document.addEventListener("DOMContentLoaded", async () => {
  const menu = document.querySelector("#category-menu");
  const toggle = document.querySelector("#category-toggle");
  const label = document.querySelector("#category-label");
  const statusMenu = document.querySelector("#status-menu");
  const statusToggle = document.querySelector("#status-toggle");
  const statusLabel = document.querySelector("#status-label");

  const closeMenu = () => menu?.classList.add("hidden");
  const openMenu = () => menu?.classList.remove("hidden");
  const closeStatusMenu = () => statusMenu?.classList.add("hidden");
  const openStatusMenu = () => statusMenu?.classList.remove("hidden");

  const buildItem = (name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dropdown-item";
    button.textContent = name;
    button.addEventListener("click", () => {
      if (label) label.textContent = name;
      closeMenu();
    });
    return button;
  };

  const renderCategories = (names) => {
    if (!menu) return;
    menu.innerHTML = "";

    const allBtn = buildItem("All Categories");
    menu.appendChild(allBtn);

    let added = 0;
    names.forEach((name) => {
      if (typeof name === "string" && name.trim()) {
        menu.appendChild(buildItem(name.trim()));
        added += 1;
      }
    });

    if (added === 0) {
      const empty = document.createElement("div");
      empty.className = "dropdown-empty";
      empty.textContent = "No categories found";
      menu.appendChild(empty);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      const names = Array.isArray(data) ? data.map((c) => c.name).filter(Boolean) : [];
      renderCategories(names);
    } catch (err) {
      console.error(err);
      renderCategories([]);
    }
  };

  fetchCategories();

  toggle?.addEventListener("click", () => {
    if (!menu) return;
    menu.classList.contains("hidden") ? openMenu() : closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (!menu || !toggle) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });

  const renderStatuses = () => {
    if (!statusMenu) return;
    const statuses = ["All Statuses", "Open", "In Progress", "Resolved"];
    statusMenu.innerHTML = "";

    statuses.forEach((status) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dropdown-item";
      button.textContent = status;
      button.addEventListener("click", () => {
        if (statusLabel) statusLabel.textContent = status;
        closeStatusMenu();
      });
      statusMenu.appendChild(button);
    });
  };

  renderStatuses();

  statusToggle?.addEventListener("click", () => {
    if (!statusMenu) return;
    statusMenu.classList.contains("hidden") ? openStatusMenu() : closeStatusMenu();
  });

  document.addEventListener("click", (e) => {
    if (!statusMenu || !statusToggle) return;
    if (statusMenu.contains(e.target) || statusToggle.contains(e.target)) return;
    closeStatusMenu();
  });

  // Load assign-category modal markup and wire up modal behavior
  try {
    const modalRes = await fetch('/modals/admin/addCategoryModal.html');
    if (modalRes.ok) {
      const modalHtml = await modalRes.text();
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const overlay = document.getElementById('assign-modal');
      const closeBtn = document.getElementById('assign-modal-close');
      const cancelBtn = document.getElementById('assign-modal-cancel');
      const assignBtn = document.getElementById('assign-modal-assign');
      const categorySelect = document.getElementById('assign-category-select');

      const closeModal = () => overlay?.classList.add('hidden');
      const openModal = () => overlay?.classList.remove('hidden');

      // Populate category select with categories already loaded in the menu if available
      const populateCategories = () => {
        // try to read categories from category menu
        const menuItems = menu ? Array.from(menu.querySelectorAll('.dropdown-item')) : [];
        if (categorySelect && menuItems.length) {
          // Clear existing options (keep first placeholder)
          while (categorySelect.options.length > 1) categorySelect.remove(1);
          menuItems.forEach((btn) => {
            const val = btn.textContent.trim();
            if (val && val !== 'All Categories') {
              const opt = document.createElement('option');
              opt.value = val;
              opt.textContent = val;
              categorySelect.appendChild(opt);
            }
          });
        }
      };

      populateCategories();

      // Open modal when any "Assign Category" button is clicked
      document.querySelectorAll('.primary-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const tr = e.target.closest('tr');
          if (!tr) return openModal();
          const tds = tr.querySelectorAll('td');
          const id = tds[0]?.textContent.trim() || '';
          const desc = tds[1]?.textContent.trim() || '';
          const date = tds[2]?.textContent.trim() || '';

          const idEl = overlay.querySelector('.modal-ticket-id');
          const descEl = overlay.querySelector('.modal-desc');
          const dateEl = overlay.querySelector('.modal-date');

          if (idEl) idEl.textContent = id;
          if (descEl) descEl.textContent = desc;
          if (dateEl) dateEl.textContent = date;

          openModal();
        });
      });

      // Close handlers
      closeBtn?.addEventListener('click', closeModal);
      cancelBtn?.addEventListener('click', closeModal);
      overlay?.addEventListener('click', (ev) => {
        if (ev.target === overlay) closeModal();
      });

      // Assign button (placeholder behavior)
      assignBtn?.addEventListener('click', () => {
        // Retrieve selected category and ticket id
        const selected = categorySelect?.value || '';
        const ticketId = overlay.querySelector('.modal-ticket-id')?.textContent || '';
        if (!selected) {
          // simple feedback
          categorySelect?.focus();
          return;
        }
        // In a real app, send update to backend here
        console.log('Assigning', ticketId, 'to category', selected);
        closeModal();
      });
    }
  } catch (err) {
    console.error('Failed to load modal:', err);
  }
});
