document.addEventListener("DOMContentLoaded", async () => {
  const menu = document.querySelector("#category-menu");
  const toggle = document.querySelector("#category-toggle");
  const label = document.querySelector("#category-label");
  const statusMenu = document.querySelector("#status-menu");
  const statusToggle = document.querySelector("#status-toggle");
  const statusLabel = document.querySelector("#status-label");
  const ticketsSection = document.querySelector(".tickets");

  let ticketsCache = [];

  const closeMenu = () => menu?.classList.add("hidden");
  const openMenu = () => menu?.classList.remove("hidden");
  const closeStatusMenu = () => statusMenu?.classList.add("hidden");
  const openStatusMenu = () => statusMenu?.classList.remove("hidden");

  const normalize = (value = "") => value.toString().trim().toLowerCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusPillClass = (status = "") => {
    const s = normalize(status);
    if (s.includes("progress")) return "in-progress";
    if (s.includes("resolved")) return "resolved";
    if (s.includes("open") || s.includes("pending")) return "open";
    return "in-progress";
  };

  const priorityPillClass = (priority = "") => {
    const p = normalize(priority);
    if (p === "high") return "high";
    if (p === "medium") return "medium";
    if (p === "low") return "low";
    return "";
  };

  const buildTicketId = (id = "") => {
    if (!id) return "TKT";
    return `TKT-${id.slice(-6).toUpperCase()}`;
  };

  const clearTicketCards = () => {
    ticketsSection?.querySelectorAll(".ticket-card")?.forEach((card) => card.remove());
  };

  const renderTickets = (tickets) => {
    if (!ticketsSection) return;
    clearTicketCards();

    if (!Array.isArray(tickets) || tickets.length === 0) {
      const empty = document.createElement("article");
      empty.className = "ticket-card";
      empty.innerHTML = `
        <div class="ticket-info">
          <div class="ticket-row">
            <div class="ticket-id">No Tickets</div>
          </div>
          <h3 class="ticket-title">No tickets have been assigned to you yet.</h3>
          <div class="ticket-meta">
            <span class="meta-text">Assignments will appear here after an admin categorizes a ticket.</span>
          </div>
        </div>
      `;
      ticketsSection.appendChild(empty);
      return;
    }

    tickets.forEach((ticket) => {
      const article = document.createElement("article");
      article.className = "ticket-card";

      const statusText = ticket.status || "Pending";
      const priorityText = ticket.priority || "Not Set";
      const statusClass = statusPillClass(statusText);
      const priorityClass = priorityPillClass(priorityText);
      const statusGreen = normalize(statusText) === "resolved";
      const priorityGreen = normalize(priorityText) === "low";
      const greenBg = "#d8f5e3";
      const greenText = "#1f7a3f";

      article.innerHTML = `
        <div class="ticket-info">
          <div class="ticket-row">
            <div class="ticket-id">${buildTicketId(ticket.id)}</div>
            <div class="pill ${statusClass}" style="${statusGreen ? `background:${greenBg};color:${greenText};` : ""}">${statusText}</div>
            ${priorityText ? `<div class="pill ${priorityClass || ""}" style="${priorityGreen ? `background:${greenBg};color:${greenText};` : ""}">${priorityText}</div>` : ""}
          </div>
          <h3 class="ticket-title">${ticket.title || "Untitled Ticket"}</h3>
          <div class="ticket-meta">
            <span class="meta-text">${ticket.category || "Uncategorized"}</span>
            <span class="dot-sep">•</span>
            <span class="meta-text">${formatDate(ticket.date)}</span>
          </div>
        </div>
        <a href="/staff/details.html?ticketId=${encodeURIComponent(ticket.id || "")}" class="ghost-btn" role="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 6c-4.24 0-7.79 2.53-9.5 6 1.71 3.47 5.26 6 9.5 6s7.79-2.53 9.5-6c-1.71-3.47-5.26-6-9.5-6Zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4a4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
          </svg>
          <span>View Details</span>
        </a>
      `;

      ticketsSection.appendChild(article);
    });
  };

  const applyFilters = () => {
    const selectedPriority = (label?.textContent || "All Priorities").trim();
    const selectedStatus = (statusLabel?.textContent || "All Statuses").trim();

    const filtered = ticketsCache.filter((ticket) => {
      const priorityPass =
        selectedPriority === "All Priorities" ||
        normalize(ticket.priority) === normalize(selectedPriority);
      const statusPass =
        selectedStatus === "All Statuses" ||
        normalize(ticket.status) === normalize(selectedStatus);
      return priorityPass && statusPass;
    });

    renderTickets(filtered);
  };

  const buildItem = (name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dropdown-item";
    button.textContent = name;
    button.addEventListener("click", () => {
      if (label) label.textContent = name;
      closeMenu();
      applyFilters();
    });
    return button;
  };

  const renderCategories = (names) => {
    if (!menu) return;
    menu.innerHTML = "";

    const allBtn = buildItem("All Priorities");
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
      empty.textContent = "No priorities found";
      menu.appendChild(empty);
    }
  };

  const fetchCategories = async () => {
    const priorities = ["Low", "Medium", "High"];
    renderCategories(priorities);
    if (label) label.textContent = "All Priorities";
  };

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
        applyFilters();
      });
      statusMenu.appendChild(button);
    });
  };

  const loadStaffTickets = async () => {
    const staffId = localStorage.getItem("userId");
    if (!staffId) {
      renderTickets([]);
      return;
    }

    try {
      const res = await fetch(`/api/staff/${staffId}/tickets`);
      if (!res.ok) throw new Error("Failed to fetch staff tickets");
      const data = await res.json();
      ticketsCache = Array.isArray(data) ? data : [];
      applyFilters();
    } catch (err) {
      console.error(err);
      ticketsCache = [];
      renderTickets([]);
    }
  };

  await fetchCategories();
  renderStatuses();
  await loadStaffTickets();
  setInterval(loadStaffTickets, 10000);

  toggle?.addEventListener("click", () => {
    if (!menu) return;
    menu.classList.contains("hidden") ? openMenu() : closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (!menu || !toggle) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });

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
