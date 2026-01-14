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
});
