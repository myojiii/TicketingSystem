document.addEventListener("DOMContentLoaded", async () => {
  // ========================================
  // HIDE NOTIFICATION BADGE
  // ========================================
  // When staff opens a ticket, clear the notification badge
  const badge = document.getElementById("notification-badge");
  if (badge) {
    badge.classList.remove("active");
  }

  // ========================================
  // SIDEBAR TOGGLE FUNCTIONALITY
  // ========================================
  const sidebar = document.querySelector('.sidebar');
  const layout = document.querySelector('.layout');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  // Load saved state from localStorage
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState === 'true') {
    sidebar?.classList.add('collapsed');
    layout?.classList.add('sidebar-collapsed');
  }
  
  // Toggle sidebar on button click
  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
    layout?.classList.toggle('sidebar-collapsed');
    
    // Save state to localStorage
    const isCollapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  });

  // ========================================
  // LOGOUT FUNCTIONALITY
  // ========================================
  const logoutBtn = document.getElementById('logout-btn');

  logoutBtn?.addEventListener('click', () => {
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      // Clear session data
      localStorage.removeItem('sidebarCollapsed');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      
      // Redirect to login
      window.location.href = '/';
    }
  });

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================
  const staffId = localStorage.getItem('userId');
  let notifications = [];
  let lastCheckTimestamp = Date.now();

  // Toast notification helper
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
      
      const iconSvg = `<div class="notification-item-icon">${icon}</div>`;
      
      item.innerHTML = `
        ${iconSvg}
        <div class="notification-item-content">
          <div class="notification-item-title">${notif.title}</div>
          <div class="notification-item-message">${notif.message}</div>
          <div class="notification-item-time">${new Date(notif.createdAt).toLocaleDateString()}</div>
        </div>
        <button class="notification-item-close" aria-label="Remove notification">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
        </button>
      `;

      // Click to mark as read and navigate to ticket
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

  // Bell button and notifications panel
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



  // ========================================
  // ATTACHMENT FUNCTIONALITY
  // ========================================
  const attachBtn = document.getElementById('attach-btn');
  const fileInput = document.getElementById('file-input');
  const attachmentsPreview = document.getElementById('attachments-preview');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');

  let selectedFiles = [];

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    }
    
    if (['pdf'].includes(ext)) {
      return `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
    }
    
    if (['doc', 'docx'].includes(ext)) {
      return `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    }
    
    return `<svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  };

  // Render attachments preview
  const renderAttachments = () => {
    if (!attachmentsPreview) return;
    
    attachmentsPreview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'attachment-item';
      item.innerHTML = `
        <div class="attachment-icon">${getFileIcon(file.name)}</div>
        <span class="attachment-name" title="${file.name}">${file.name}</span>
        <span class="attachment-size">${formatFileSize(file.size)}</span>
        <button type="button" class="attachment-remove" data-index="${index}">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      attachmentsPreview.appendChild(item);
    });

    // Add remove listeners
    attachmentsPreview.querySelectorAll('.attachment-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        selectedFiles.splice(index, 1);
        renderAttachments();
      });
    });
  };

  // Handle file selection
  attachBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Add to selected files
    selectedFiles = [...selectedFiles, ...validFiles];
    
    // Limit to 5 files
    if (selectedFiles.length > 5) {
      alert('You can only attach up to 5 files at once.');
      selectedFiles = selectedFiles.slice(0, 5);
    }

    renderAttachments();
    
    // Reset file input
    if (fileInput) fileInput.value = '';
  });

  // Handle Enter key to send (Shift+Enter for new line)
  messageInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn?.click();
    }
  });
  const toggle = document.getElementById("toggle-convo");
  const convo = document.getElementById("conversation-card");
  const closeBtn = document.getElementById("close-panel-btn");

  if (toggle && convo) {
    toggle.addEventListener("click", () => {
      if (convo.classList.contains("active")) {
        convo.classList.remove("active");
        toggle.textContent = "View Conversation";
      } else {
        convo.classList.add("active");
        toggle.textContent = "Hide Conversation";
      }
    });
  }

  if (closeBtn && convo) {
    closeBtn.addEventListener("click", () => {
      convo.classList.remove("active");
      toggle.textContent = "View Conversation";
    });
  }

  // Mark all notifications for a specific ticket as read
  const markTicketNotificationsAsRead = async (ticketIdToMark) => {
    if (!ticketIdToMark) return;

    try {
      await fetch(`/api/notifications/ticket/${encodeURIComponent(ticketIdToMark)}/read`, {
        method: "PATCH",
      }).catch(() => {});
      await loadNotifications();
    } catch (error) {
      console.error('Error marking ticket notifications as read:', error);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("ticketId");
  
  const debugEl = document.getElementById("debug-info");
  const updateDebug = (msg) => {
    if (debugEl) debugEl.textContent = msg;
    console.log(msg);
  };
  
  updateDebug(`URL Parameters: ticketId=${ticketId}`);
  
  if (!ticketId) {
    const heroTitleEl = document.querySelector(".hero-title");
    if (heroTitleEl) {
      heroTitleEl.textContent = "No ticket selected";
    }
    const heroDescEl = document.querySelector(".hero-desc");
    if (heroDescEl) {
      heroDescEl.textContent = "Please select a ticket from the list to view details.";
    }
    updateDebug("Error: No ticketId found in URL");
    return;
  }

  // Mark notifications for this ticket as read when details page loads
  if (ticketId) {
    await loadNotifications();
    // Give a moment for notifications to load, then mark ticket's notifications as read
    setTimeout(() => markTicketNotificationsAsRead(ticketId), 100);
  }

  const heroIdEl = document.querySelector(".hero-id");
  const heroTitleEl = document.querySelector(".hero-title");
  const heroDescEl = document.querySelector(".hero-desc");
  const heroPills = document.querySelectorAll(".hero-header .pill");

  const findRowByLabel = (labelText) => {
    const rows = document.querySelectorAll(".detail-row");
    const target = (labelText || "").toLowerCase();
    for (const row of rows) {
      const label = row.querySelector(".detail-label");
      if (label && label.textContent.trim().toLowerCase().includes(target)) {
        return row;
      }
    }
    return null;
  };

  const assignedEl = document.getElementById("detail-assigned-staff");
  const statusEl = document.getElementById("detail-status");
  const statusBox = document.getElementById("detail-status-box");
  const priorityEl = document.getElementById("detail-priority");
  const priorityBox = document.getElementById("detail-priority-box");
  const createdEl = document.getElementById("detail-created-date");
  const categoryEl = document.getElementById("detail-category");
  const contactNameEl = document.getElementById("detail-client-name");
  const contactEmailEl = document.getElementById("detail-client-email");
  const contactPhoneEl = document.getElementById("detail-client-phone");

  let currentTicket = null;

  const normalize = (value = "") => value.toString().trim().toLowerCase();
  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const buildTicketId = (id = "") => {
    if (!id) return "TKT";
    return `TKT-${id.slice(-6).toUpperCase()}`;
  };

  const statusClass = (status = "") => {
    const s = normalize(status);
    if (s.includes("progress")) return "in-progress";
    if (s.includes("resolved")) return "open";
    if (s.includes("open")) return "open";
    return "in-progress";
  };

  const priorityClass = (priority = "") => {
    const p = normalize(priority);
    if (p === "high") return "high";
    if (p === "medium") return "medium";
    if (p === "low") return "low";
    return "";
  };

  const applyPillColor = (el, isGreen) => {
    if (!el) return;
    const greenBg = "#d8f5e3";
    const greenText = "#1f7a3f";
    el.style.background = isGreen ? greenBg : "";
    el.style.color = isGreen ? greenText : "";
  };

  const renderTicket = (ticket) => {
    if (!ticket) return;
    currentTicket = ticket;

    if (heroIdEl) heroIdEl.textContent = buildTicketId(ticket.id);
    if (heroTitleEl) heroTitleEl.textContent = ticket.title || "Untitled Ticket";
    if (heroDescEl) heroDescEl.textContent = ticket.description || "No description provided.";

    const statusText = ticket.status || "Open";
    const priorityText = ticket.priority || "Not Set";
    const isResolved = normalize(statusText) === "resolved";
    const isLow = normalize(priorityText) === "low";

    if (heroPills?.[0]) {
      heroPills[0].textContent = statusText;
      heroPills[0].className = `pill ${statusClass(statusText)}`;
      applyPillColor(heroPills[0], isResolved);
    }
    if (heroPills?.[1]) {
      heroPills[1].textContent = priorityText;
      const pClass = priorityClass(priorityText);
      heroPills[1].className = pClass ? `pill ${pClass}` : "pill";
      applyPillColor(heroPills[1], isLow);
    }

    if (assignedEl) {
      assignedEl.textContent = ticket.assignedStaffName || "Unassigned";
    }
    if (statusEl) {
      statusEl.textContent = statusText;
    }
    if (priorityEl) {
      priorityEl.textContent = priorityText;
    }
    if (createdEl) {
      createdEl.textContent = formatDate(ticket.date);
    }
    if (categoryEl) {
      categoryEl.textContent = ticket.category || "Uncategorized";
    }
  };

  const fetchTicket = async () => {
    try {
      updateDebug(`Fetching: /api/tickets/${ticketId}`);
      const res = await fetch(`/api/tickets/${ticketId}`);
      updateDebug(`Response: ${res.status} ${res.statusText}`);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`Failed to load ticket: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      updateDebug(`Ticket received: ${data?.title || 'Unknown'}`);
      console.log('Ticket data received:', data);
      
      if (!data || !data.id) {
        throw new Error("Invalid ticket data received");
      }
      
      renderTicket(data);
      if (data?.userId) await fetchUser(data.userId);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      updateDebug(`Error: ${err.message}`);
      const heroTitleEl = document.querySelector(".hero-title");
      if (heroTitleEl) {
        heroTitleEl.textContent = "Error loading ticket";
      }
      const heroDescEl = document.querySelector(".hero-desc");
      if (heroDescEl) {
        heroDescEl.textContent = "Could not load ticket details: " + err.message;
      }
    }
  };

  const fetchUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/id/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Failed to load user");
      const user = await res.json();
      const isClient = normalize(user.role) === "client";
      if (isClient) {
        if (contactNameEl) contactNameEl.textContent = user.name || "N/A";
        if (contactEmailEl) contactEmailEl.textContent = user.email || "N/A";
        const phoneVal = user.number || user.phone;
        if (contactPhoneEl) contactPhoneEl.textContent = phoneVal || "Not provided";
      } else {
        if (contactNameEl) contactNameEl.textContent = "N/A";
        if (contactEmailEl) contactEmailEl.textContent = "N/A";
        if (contactPhoneEl) contactPhoneEl.textContent = "Not provided";
      }
    } catch (err) {
      console.error(err);
      if (contactNameEl) contactNameEl.textContent = "N/A";
      if (contactEmailEl) contactEmailEl.textContent = "N/A";
      if (contactPhoneEl) contactPhoneEl.textContent = "Not provided";
    }
  };

  const updateTicket = async (payload) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      if (data?.ticket) renderTicket(data.ticket);
    } catch (err) {
      console.error(err);
      alert("Failed to update ticket.");
    }
  };

  const statuses = ["Open", "In Progress", "Resolved"];
  const priorities = ["Low", "Medium", "High"];

  const removeMenu = () => {
    const existing = document.getElementById("inline-menu");
    if (existing) existing.remove();
    document.removeEventListener("click", handleOutsideClick, true);
  };

  const handleOutsideClick = (e) => {
    const menu = document.getElementById("inline-menu");
    if (!menu) return;
    if (!menu.contains(e.target)) removeMenu();
  };

  const openMenu = (anchorEl, options, currentValue, onSelect) => {
    removeMenu();
    if (!anchorEl) return;

    const rect = anchorEl.getBoundingClientRect();
    const menu = document.createElement("div");
    menu.id = "inline-menu";
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.minWidth = `${rect.width}px`;
    menu.style.background = "#fff";
    menu.style.border = "1px solid #d8dfea";
    menu.style.borderRadius = "10px";
    menu.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
    menu.style.zIndex = "9999";
    menu.style.padding = "6px 0";

    options.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = opt;
      item.style.width = "100%";
      item.style.textAlign = "left";
      item.style.padding = "10px 14px";
      item.style.background = "transparent";
      item.style.border = "none";
      item.style.cursor = "pointer";
      item.style.fontSize = "14px";
      item.style.color = normalize(opt) === normalize(currentValue) ? "#4a3bff" : "#1f2d4a";
      item.style.fontWeight = normalize(opt) === normalize(currentValue) ? "700" : "600";

      item.addEventListener("click", () => {
        onSelect(opt);
        removeMenu();
      });

      item.addEventListener("mouseenter", () => {
        item.style.background = "#f7f9fd";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick, true);
    }, 0);
  };

  // Status and Priority Dropdowns
  if (statusBox) {
    statusBox.style.cursor = "pointer";
    statusBox.addEventListener("click", () => {
      openMenu(statusBox, statuses, currentTicket?.status || "Open", async (choice) => {
        await updateTicket({ status: choice });
      });
    });
  }

  if (priorityBox) {
    priorityBox.style.cursor = "pointer";
    priorityBox.addEventListener("click", () => {
      openMenu(priorityBox, priorities, currentTicket?.priority || "Medium", async (choice) => {
        await updateTicket({ priority: choice });
      });
    });
  }

  await fetchTicket();

  // Message functionality for staff
  const messagesContainer = document.querySelector(".messages");
  const composerTextarea = document.querySelector(".composer textarea");
  const sendButton = document.querySelector(".composer .send-btn");
  let currentStaffId = localStorage.getItem("userId");

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderMessages = async () => {
    if (!messagesContainer || !ticketId) return;

    try {
      // Get ticket details first
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticket = ticketRes.ok ? await ticketRes.json() : null;

      // Get messages
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (!res.ok) return;

      const messages = await res.json();
      const allMessages = [];

      // Add ticket description as first message
      if (ticket && ticket.description) {
        allMessages.push({
          isDescription: true,
          message: ticket.description,
          senderId: ticket.userId,
          timestamp: ticket.date,
        });
      }

      allMessages.push(...messages);

      messagesContainer.innerHTML = allMessages
        .map((msg) => {
          const isStaff = msg.senderId === currentStaffId;
          const senderName = isStaff ? "You" : msg.senderName || "Client";
          const cssClass = isStaff ? "reply" : "";

          return `
            <div class="message ${cssClass}">
              <div class="message-row">
                <div class="sender">${senderName}</div>
                <div class="timestamp">${formatMessageDate(msg.timestamp)} ${formatMessageTime(msg.timestamp)}</div>
              </div>
              <p class="message-body">${msg.message || msg.text || ""}</p>
            </div>
          `;
        })
        .join("");

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const sendStaffMessage = async () => {
    if (!composerTextarea || !ticketId || !currentStaffId) return;
    const text = composerTextarea.value.trim();
    if (!text) return;

    try {
      // Get ticket to determine receiver (client)
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticket = ticketRes.ok ? await ticketRes.json() : null;
      if (!ticket) {
        alert("Could not load ticket details");
        return;
      }

      const receiverId = ticket.userId; // Client is the receiver

      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentStaffId,
          receiverId: receiverId,
          staffId: currentStaffId,
          senderName: localStorage.getItem("userName") || "Staff",
          message: text,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        composerTextarea.value = "";
        selectedFiles = [];
        renderAttachments();
        await renderMessages();
      } else {
        const errorData = await res.json();
        console.error("Send error:", errorData);
        alert("Failed to send message: " + (errorData.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Error sending message");
    }
  };

  if (sendButton) {
    sendButton.addEventListener("click", sendStaffMessage);
  }

  if (composerTextarea) {
    composerTextarea.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendStaffMessage();
      }
    });
  }

  // Load messages on page load and poll every 5 seconds (only if ticketId exists)
  if (ticketId) {
    await renderMessages();
    setInterval(renderMessages, 5000);
  }
});
