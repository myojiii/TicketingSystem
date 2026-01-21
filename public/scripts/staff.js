document.addEventListener("DOMContentLoaded", async () => {
  // ========================================
  // SIDEBAR TOGGLE FUNCTIONALITY
  // ========================================
  const sidebar = document.querySelector('.sidebar');
  const layout = document.querySelector('.layout');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  let sidebarCollapsed = false;
  
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    layout.classList.add('sidebar-collapsed');
  }
  
  toggleBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    layout.classList.toggle('sidebar-collapsed');
    sidebarCollapsed = sidebar.classList.contains('collapsed');
  });

  // ========================================
  // LOGOUT FUNCTIONALITY
  // ========================================
  const logoutBtn = document.getElementById('logout-btn');

  logoutBtn?.addEventListener('click', () => {
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      window.location.href = '/';
    }
  });

  // ========================================
  // TOAST NOTIFICATION SYSTEM
  // ========================================
  const showToastNotification = (title, message, type = "info", duration = 5000) => {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
    } else if (type === "error") {
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
    }

    notification.innerHTML = `
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <p class="notification-message">${message}</p>
      </div>
      <button class="notification-close" aria-label="Close notification">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
      </button>
    `;

    container.appendChild(notification);

    const closeBtn = notification.querySelector(".notification-close");
    const removeNotification = () => {
      notification.classList.add("removing");
      setTimeout(() => notification.remove(), 300);
    };
    closeBtn?.addEventListener("click", removeNotification);

    if (duration > 0) {
      setTimeout(removeNotification, duration);
    }
  };

  // Helper function to build ticket ID
  const buildTicketId = (id = "") => {
    if (!id) return "TKT";
    return `TKT-${id.slice(-6).toUpperCase()}`;
  };

  // Helper to get relative time
  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const date = new Date(timestamp);
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // ========================================
  // BACKEND-DRIVEN NOTIFICATION SYSTEM
  // ========================================
  const staffId = localStorage.getItem("userId");
  console.log("Staff ID:", staffId);
  
  let notifications = [];
  let lastCheckTimestamp = Date.now();

  // Load all notifications from backend
  const loadNotifications = async () => {
    if (!staffId) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        notifications = data.notifications || [];
        updateNotificationUI(data.unreadCount || 0);
        console.log('Loaded notifications:', notifications.length, 'Unread:', data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Check for new notifications since last check
  const checkForNewNotifications = async () => {
    if (!staffId) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/notifications/new?since=${lastCheckTimestamp}`);
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        
        if (newNotifications.length > 0) {
          console.log('Found new notifications:', newNotifications.length);
          
          // Show toast for each new notification
          newNotifications.forEach(notif => {
            const type = notif.type === 'new_message' ? 'success' : 'info';
            showToastNotification(notif.title, notif.message, type);
          });
          
          // Reload all notifications to update the list
          await loadNotifications();
        }
        
        lastCheckTimestamp = Date.now();
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  // Update notification UI
  const updateNotificationUI = (unreadCount) => {
    const notificationsList = document.getElementById('notifications-list');
    const bellBadge = document.getElementById('bell-badge');
    
    if (!notificationsList) return;

    // Update badge
    if (bellBadge) {
      if (unreadCount > 0) {
        bellBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        bellBadge.classList.add('active');
      } else {
        bellBadge.textContent = '0';
        bellBadge.classList.remove('active');
      }
    }

    // Clear list
    notificationsList.innerHTML = '';

    if (notifications.length === 0) {
      notificationsList.innerHTML = '<p class="empty-state">No notifications</p>';
      return;
    }

    // Render notifications
    notifications.forEach((notif, index) => {
      const item = document.createElement('div');
      item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
      
      // Determine notification style based on type
      if (notif.type === 'new_message') {
        item.classList.add('success');
      } else if (notif.type === 'ticket_assigned') {
        item.classList.add('info');
      }
      
      let icon = '📋';
      if (notif.type === 'new_message') icon = '💬';
      if (notif.type === 'ticket_assigned') icon = '📋';
      if (notif.type === 'status_changed') icon = '🔄';
      if (notif.type === 'priority_changed') icon = '⚠️';

// Check if this is a recently created notification (within last minute)
const createdTime = new Date(notif.createdAt).getTime();
const now = Date.now();
const isNew = (now - createdTime) < 60000; // Less than 1 minute old
if (isNew && !notif.read) {
  item.classList.add('new-notification');
}

const iconSvg = `<div class="notification-item-icon">${icon}</div>`;  // ✅ ADD THIS LINE

item.innerHTML = `
  ${iconSvg}
  <div class="notification-item-content">
    <div class="notification-item-title">${notif.title}</div>
    <div class="notification-item-message">${notif.message}</div>
    <div class="notification-item-time">${getRelativeTime(notif.createdAt)}</div>
  </div>
  <button class="notification-item-close" aria-label="Remove notification">
    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
  </button>
`;      // Click to mark as read and navigate to ticket
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.notification-item-close')) return;
        if (!notif.read) {
          await markAsRead(notif._id);
        }
        // Navigate to the ticket detail page
        if (notif.ticketId) {
          window.location.href = `/staff/details.html?ticketId=${notif.ticketId}`;
        }
      });

      // Delete button
      const closeBtn = item.querySelector('.notification-item-close');
      closeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteNotification(notif._id);
      });

      notificationsList.appendChild(item);
    });
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        // Reload notifications
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Reload notifications
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Initialize notification system
  if (staffId) {
    await loadNotifications();
    
    // Check for new notifications every 10 seconds
    setInterval(checkForNewNotifications, 10000);
  }

  // ========================================
  // TICKET FILTERING AND DISPLAY
  // ========================================
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

      // Check if this ticket has unread notifications
      const unreadNotifications = notifications.filter(n => 
        n.ticketId === ticket.id && !n.read
      );
      const hasUnread = unreadNotifications.length > 0;

      article.innerHTML = `
        <div class="ticket-info">
          <div class="ticket-row">
            <div class="ticket-id">${buildTicketId(ticket.id)}</div>
            ${hasUnread ? '<span class="ticket-notification-badge" title="New notifications"></span>' : ''}
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

    let filtered = ticketsCache.filter((ticket) => {
      const priorityPass =
        selectedPriority === "All Priorities" ||
        normalize(ticket.priority) === normalize(selectedPriority);
      const statusPass =
        selectedStatus === "All Statuses" ||
        normalize(ticket.status) === normalize(selectedStatus);
      return priorityPass && statusPass;
    });

    // Sort tickets: those with unread notifications go to the top
    filtered.sort((a, b) => {
      const aHasUnread = notifications.some(n => n.ticketId === a.id && !n.read);
      const bHasUnread = notifications.some(n => n.ticketId === b.id && !n.read);
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      return 0;
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
      console.warn("No userId found in localStorage");
      const article = document.createElement("article");
      article.className = "ticket-card";
      article.innerHTML = `
        <div class="ticket-info">
          <div class="ticket-row">
            <div class="ticket-id">Not Logged In</div>
          </div>
          <h3 class="ticket-title">Please log in to view your tickets</h3>
          <div class="ticket-meta">
            <span class="meta-text">Redirecting to login...</span>
          </div>
        </div>
      `;
      ticketsSection.innerHTML = '';
      ticketsSection.appendChild(article);
      setTimeout(() => window.location.href = '/', 2000);
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

  // ========================================
  // EVENT LISTENERS
  // ========================================
  const bellBtn = document.getElementById("bell-btn");
  const notificationsPanel = document.getElementById("notifications-panel");
  const closeNotificationsBtn = document.getElementById("close-notifications");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  bellBtn?.addEventListener("click", () => {
    notificationsPanel?.classList.toggle("hidden");
  });

  closeNotificationsBtn?.addEventListener("click", () => {
    notificationsPanel?.classList.add("hidden");
  });

  markAllReadBtn?.addEventListener("click", async () => {
    if (staffId) {
      try {
        const response = await fetch(`/api/staff/${staffId}/notifications/read-all`, {
          method: 'PATCH',
        });
        
        if (response.ok) {
          await loadNotifications();
        }
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!notificationsPanel || !bellBtn) return;
    if (notificationsPanel.contains(e.target) || bellBtn.contains(e.target)) return;
    notificationsPanel.classList.add("hidden");
  });

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

  // ========================================
  // INITIALIZE
  // ========================================
  await fetchCategories();
  renderStatuses();
  await loadStaffTickets();
  setInterval(loadStaffTickets, 10000);
});