document.addEventListener('DOMContentLoaded', async () => {

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
  // NAVIGATION ACTIVE STATE
  // ========================================
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      navButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Here you can add navigation logic
      const buttonText = btn.querySelector('.nav-text')?.textContent;
      console.log('Navigating to:', buttonText);
    });
  });

  // ========================================
  // LOGOUT FUNCTIONALITY
  // ========================================
  const logoutBtn = document.getElementById('logout-btn');

  logoutBtn?.addEventListener('click', () => {
    // Show confirmation dialog
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      // Clear any stored session data
      localStorage.removeItem('sidebarCollapsed');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      
      // Redirect to login page
      window.location.href = '/';
    }
  });

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================
  function showNotification(title, message, type = 'success', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) {
      console.error('Notification container not found');
      return;
    }
    
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
    
    // Auto-remove after duration
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // Make showNotification globally accessible
  window.showNotification = showNotification;

  // ========================================
  // GLOBAL STATE
  // ========================================
  let assignModalState = { ticketId: null };
  let editModalState = { ticketId: null };
  let deleteModalState = { ticketId: null };

  // ========================================
  // ADMIN NOTIFICATION SYSTEM
  // ========================================
  const adminId = localStorage.getItem("userId");
  console.log("Admin ID:", adminId);

  let notifications = [];
  let lastCheckTimestamp = Date.now();

  // Load all notifications from backend
  const loadNotifications = async () => {
    if (!adminId) return;

    try {
      const response = await fetch(`/api/staff/${adminId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        notifications = data.notifications || [];
        updateNotificationUI(data.unreadCount || 0);
        console.log('Loaded admin notifications:', notifications.length, 'Unread:', data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading admin notifications:', error);
    }
  };

  // Check for new notifications since last check
  const checkForNewNotifications = async () => {
    if (!adminId) return;

    try {
      const response = await fetch(`/api/staff/${adminId}/notifications/new?since=${lastCheckTimestamp}`);
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];

        if (newNotifications.length > 0) {
          console.log('Found new admin notifications:', newNotifications.length);

          // Show toast for each new notification
          newNotifications.forEach(notif => {
            const type = notif.type === 'new_ticket' ? 'success' : 'info';
            showNotification(notif.title, notif.message, type);
          });

          // Reload all notifications to update the list
          await loadNotifications();
        }

        lastCheckTimestamp = Date.now();
      }
    } catch (error) {
      console.error('Error checking for new admin notifications:', error);
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
// Render notifications
notifications.forEach((notif, index) => {
  const item = document.createElement('div');
  item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
  
  // Determine notification style based on type
  if (notif.type === 'new_ticket') {
    item.classList.add('success');
  } else if (notif.type === 'ticket_assigned') {
    item.classList.add('info');
  }
  
  let icon = '📋';
  if (notif.type === 'new_ticket') icon = '🎫';
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
      <div class="notification-item-time">${getRelativeTime(notif.createdAt)}</div>
    </div>
  `;

      // Click to mark as read and navigate to ticket
      item.addEventListener('click', async (e) => {
        if (!notif.read) {
          await markAsRead(notif._id);
        }
        // Navigate to the ticket detail page or reload tickets
        if (notif.ticketId) {
          // For admin, reload tickets to show the new one
          await loadTickets();
        }
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
      console.error('Error marking admin notification as read:', error);
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
      console.error('Error deleting admin notification:', error);
    }
  };

  // Helper function to get relative time
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

  // Initialize notification system
  if (adminId) {
    await loadNotifications();

    // Check for new notifications every 10 seconds
    setInterval(checkForNewNotifications, 10000);
  }

  // ========================================
  // MODAL ELEMENTS
  // ========================================
  const assignOverlay = document.getElementById('assign-modal');
  const editOverlay = document.getElementById('edit-modal');
  const deleteOverlay = document.getElementById('delete-modal');
  const viewOverlay = document.getElementById('view-modal');
  const messagesList = document.getElementById('messages-list');
  let lastMessagesSnapshot = null;

  // ========================================
  // MODAL HELPERS
  // ========================================
  const openAssignModal = () => assignOverlay?.classList.remove('hidden');
  const closeAssignModal = () => assignOverlay?.classList.add('hidden');

  const openEditModal = () => editOverlay?.classList.remove('hidden');
  const closeEditModal = () => editOverlay?.classList.add('hidden');

  const openDeleteModal = () => deleteOverlay?.classList.remove('hidden');
  const closeDeleteModal = () => deleteOverlay?.classList.add('hidden');

  const openViewModal = () => viewOverlay?.classList.remove('hidden');
  const closeViewModal = () => {
    viewOverlay?.classList.add('hidden');
    stopMessagesPolling();
    viewTicketId = null;
    viewTicketUserId = null;
    lastMessagesSnapshot = null;
  };

  let viewMessagesTimer = null;
  let viewTicketId = null;
  let viewTicketUserId = null;

  // ========================================
  // HELPERS
  // ========================================
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const escapeHtml = (str = '') =>
    str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c] || c));

  const getStatusClass = (status) =>
    status ? status.toLowerCase().replace(/\s+/g, '-') : '';

  function renderMessages(messages) {
    lastMessagesSnapshot = JSON.stringify(messages || []);

    if (!messagesList) return;
    if (!Array.isArray(messages) || messages.length === 0) {
      messagesList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          No conversation yet
        </div>
      `;
      return;
    }

    messagesList.innerHTML = messages.map(msg => {
      const isClient = viewTicketUserId && msg.senderId === viewTicketUserId;
      const senderClass = isClient ? 'client' : 'staff';
      const senderName = escapeHtml(msg.senderName || (isClient ? 'Client' : 'Staff'));
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
      const safeMessage = escapeHtml(msg.message || '');

      return `
        <div class="message ${senderClass}">
          <div class="message-header">
            <div class="message-sender ${senderClass}">${senderName}</div>
            <div class="message-time">${time}</div>
          </div>
          <div class="message-content">${safeMessage}</div>
        </div>
      `;
    }).join('');
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  async function fetchMessages() {
    if (!viewTicketId) return;
    try {
      const res = await fetch(`/api/tickets/${viewTicketId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();

      // Prepend ticket description as first message once
      const ticket = await fetchTicketForDescription();
      const descriptionMessage = ticket?.description ? [{
        senderId: ticket.userId,
        senderName: 'Client',
        message: ticket.description,
        timestamp: ticket.date,
      }] : [];

      const combined = [...descriptionMessage, ...(data || [])];
      const snapshot = JSON.stringify(combined || []);
      if (snapshot === lastMessagesSnapshot) return;
      renderMessages(combined);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }

  function stopMessagesPolling() {
    if (viewMessagesTimer) {
      clearInterval(viewMessagesTimer);
      viewMessagesTimer = null;
    }
  }

  function startMessagesPolling() {
    stopMessagesPolling();
    fetchMessages();
    viewMessagesTimer = setInterval(fetchMessages, 4000);
  }

  const fetchTicketForDescription = async () => {
    if (!viewTicketId) return null;
    try {
      const res = await fetch(`/api/tickets/${viewTicketId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error fetching ticket for description:', err);
      return null;
    }
  };

  // ========================================
  // ASSIGN BUTTONS
  // ========================================
  const attachAssignButtonListeners = () => {
    document.querySelectorAll('.assign-category-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tr = e.target.closest('tr');
        if (!tr || !assignOverlay) return;

        const tds = tr.querySelectorAll('td');
        assignModalState.ticketId = tr.dataset.ticketId;

        const modalTicketId = assignOverlay.querySelector('.modal-ticket-id');
        const modalTicketTitle = assignOverlay.querySelector('.modal-ticket-title');
        const modalDesc = assignOverlay.querySelector('.modal-desc');
        const modalDate = assignOverlay.querySelector('.modal-date');

        if (modalTicketId) modalTicketId.textContent = assignModalState.ticketId;
        if (modalTicketTitle) modalTicketTitle.textContent = tds[0]?.textContent || '';
        if (modalDesc) modalDesc.textContent = tds[1]?.textContent || '';
        if (modalDate) modalDate.textContent = tds[2]?.textContent || '';

        const categorySelect = document.getElementById('assign-category-select');
        if (categorySelect) categorySelect.value = '';
        openAssignModal();
      };
    });
  };

  // ========================================
  // EDIT BUTTONS
  // ========================================
  const attachEditButtonListeners = () => {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tr = e.target.closest('tr');
        if (!tr || !editOverlay) return;

        const tds = tr.querySelectorAll('td');
        editModalState.ticketId = tr.dataset.ticketId;

        const editTicketId = document.getElementById('edit-ticket-id');
        const editCurrentCategory = document.getElementById('edit-current-category');
        const editCategorySelect = document.getElementById('edit-category-select');

        if (editTicketId) editTicketId.textContent = editModalState.ticketId;
        if (editCurrentCategory) editCurrentCategory.textContent = tds[3]?.textContent || '';
        if (editCategorySelect) editCategorySelect.value = '';

        openEditModal();
      };
    });
  };

  // ========================================
  // VIEW BUTTONS
  // ========================================
  const attachViewButtonListeners = () => {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;

        try {
          const res = await fetch(`/api/tickets/${tr.dataset.ticketId}`);
          if (!res.ok) throw new Error('Failed to fetch');
          
          const ticket = await res.json();

          viewTicketId = ticket.id || null;
          viewTicketUserId = ticket.userId || null;
          renderMessages([]);

          const viewTicketIdEl = document.getElementById('view-ticket-id');
          const viewTicketTitleEl = document.getElementById('view-ticket-title');
          const viewTicketDescEl = document.getElementById('view-ticket-description');
          const viewTicketCategoryEl = document.getElementById('view-ticket-category');
          const viewTicketDateEl = document.getElementById('view-ticket-date');
          const viewClientUserIdEl = document.getElementById('view-client-userid');

          if (viewTicketIdEl) viewTicketIdEl.textContent = ticket.id || '-';
          if (viewTicketTitleEl) viewTicketTitleEl.textContent = ticket.title || '-';
          if (viewTicketDescEl) viewTicketDescEl.textContent = ticket.description || '-';
          if (viewTicketCategoryEl) viewTicketCategoryEl.textContent = ticket.category || 'Unassigned';
          if (viewTicketDateEl) viewTicketDateEl.textContent = formatDate(ticket.date);
          if (viewClientUserIdEl) viewClientUserIdEl.textContent = ticket.userId || '-';

          const statusEl = document.getElementById('view-ticket-status');
          if (statusEl) {
            statusEl.textContent = ticket.status || '';
            statusEl.className = `status-badge ${getStatusClass(ticket.status)}`;
          }

          const priorityEl = document.getElementById('view-ticket-priority');
          if (priorityEl) {
            priorityEl.textContent = ticket.priority || 'Not Set';
          }

          openViewModal();
          startMessagesPolling();
        } catch (err) {
          console.error('Error fetching ticket:', err);
          showNotification('Error', 'Failed to load ticket details', 'error');
        }
      };
    });
  };

  // ========================================
  // DELETE BUTTONS
  // ========================================
  const attachDeleteButtonListeners = () => {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        
        deleteModalState.ticketId = tr.dataset.ticketId;
        const deleteTicketId = document.getElementById('delete-ticket-id');
        if (deleteTicketId) deleteTicketId.textContent = deleteModalState.ticketId;
        openDeleteModal();
      };
    });
  };

  // ========================================
  // LOAD TICKETS
  // ========================================
  const loadTickets = async () => {
    const unassignedTbody = document.querySelector('.tickets-section:first-of-type tbody');
    const allTicketsTbody = document.querySelector('.tickets-section:last-of-type tbody');

    console.log('🎫 Starting to load tickets...');
    console.log('Unassigned tbody:', unassignedTbody ? 'Found' : 'NOT FOUND');
    console.log('All tickets tbody:', allTicketsTbody ? 'Found' : 'NOT FOUND');

    try {
      const res = await fetch('/api/tickets');
      console.log('📡 Response status:', res.status);
      console.log('📡 Response OK:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Response not OK. Status:', res.status, 'Error:', errorText);
        throw new Error(`Failed to fetch tickets: ${res.status}`);
      }
      
      const tickets = await res.json();
      console.log('✅ Fetched tickets:', tickets);
      console.log('📊 Total tickets:', tickets.length);
      
      if (tickets.length > 0) {
        console.log('🔍 Sample ticket structure:', tickets[0]);
      }

      const unassigned = tickets.filter(t => !t.category || t.category.trim() === '');
      const assigned = tickets.filter(t => t.category && t.category.trim() !== '');

      console.log('📋 Unassigned tickets:', unassigned.length);
      console.log('📋 Assigned tickets:', assigned.length);

      // Populate unassigned table
      if (unassignedTbody) {
        if (unassigned.length === 0) {
          console.log('ℹ️ No unassigned tickets, showing empty message');
          unassignedTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#666;">No unassigned tickets</td></tr>';
        } else {
          console.log('✏️ Rendering', unassigned.length, 'unassigned tickets');
          unassignedTbody.innerHTML = unassigned.map(t => `
            <tr data-ticket-id="${escapeHtml(t.id || '')}">
              <td>${escapeHtml(t.title || 'Untitled')}</td>
              <td>${escapeHtml(truncateText(t.description, 100))}</td>
              <td>${formatDate(t.date)}</td>
              <td><button class="action-btn primary-btn assign-category-btn">Assign Category</button></td>
            </tr>
          `).join('');
          attachAssignButtonListeners();
          console.log('✅ Unassigned tickets rendered and listeners attached');
        }
      } else {
        console.error('❌ Unassigned tbody element not found!');
      }

      // Populate assigned table
      if (allTicketsTbody) {
        if (assigned.length === 0) {
          console.log('ℹ️ No assigned tickets, showing empty message');
          allTicketsTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">No assigned tickets</td></tr>';
        } else {
          console.log('✏️ Rendering', assigned.length, 'assigned tickets');
          allTicketsTbody.innerHTML = assigned.map(t => `
            <tr data-ticket-id="${escapeHtml(t.id || '')}">
              <td>${escapeHtml(t.title || 'Untitled')}</td>
              <td>${escapeHtml(truncateText(t.description, 100))}</td>
              <td>${formatDate(t.date)}</td>
              <td>${escapeHtml(t.category || 'Unassigned')}</td>
              <td><span class="status-badge ${getStatusClass(t.status)}">${escapeHtml(t.status || '')}</span></td>
              <td>
                <div class="action-icons">
                  <button class="icon-action-btn view-btn" title="View">👁</button>
                  <button class="icon-action-btn edit-btn" title="Edit">✏️</button>
                  <button class="icon-action-btn delete-btn" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('');
          attachViewButtonListeners();
          attachEditButtonListeners();
          attachDeleteButtonListeners();
          console.log('✅ Assigned tickets rendered and listeners attached');
        }
      } else {
        console.error('❌ Assigned tbody element not found!');
      }

      console.log('🎉 Tickets loaded successfully');

    } catch (err) {
      console.error('💥 Failed to load tickets:', err);
      console.error('Error stack:', err.stack);
      
      if (unassignedTbody) {
        unassignedTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#d32f2f;">Error loading tickets: ${err.message}</td></tr>`;
      }
      if (allTicketsTbody) {
        allTicketsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#d32f2f;">Error loading tickets: ${err.message}</td></tr>`;
      }
      
      showNotification('Error', 'Failed to load tickets. Check console for details.', 'error');
    }
  };

  // ========================================
  // POPULATE CATEGORIES
  // ========================================
  const populateCategories = async () => {
    const categorySelect = document.getElementById('assign-category-select');
    const editCategorySelect = document.getElementById('edit-category-select');
    
    console.log('📂 Loading categories...');
    
    try {
      const res = await fetch('/api/categories');
      console.log('📡 Categories response status:', res.status);
      
      if (!res.ok) {
        console.error('❌ Failed to load categories');
        return;
      }
      
      const categories = await res.json();
      console.log('✅ Categories loaded:', categories);
      
      // Populate assign modal
      if (categorySelect) {
        while (categorySelect.options.length > 1) categorySelect.remove(1);
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          categorySelect.appendChild(opt);
        });
        console.log('✅ Assign category select populated');
      }
      
      // Populate edit modal
      if (editCategorySelect) {
        while (editCategorySelect.options.length > 1) editCategorySelect.remove(1);
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          editCategorySelect.appendChild(opt);
        });
        console.log('✅ Edit category select populated');
      }
    } catch (err) {
      console.error('💥 Error loading categories:', err);
    }
  };

  // ========================================
  // MODAL CLOSE HANDLERS
  // ========================================
  document.getElementById('assign-modal-close')?.addEventListener('click', closeAssignModal);
  document.getElementById('assign-modal-cancel')?.addEventListener('click', closeAssignModal);
  
  document.getElementById('edit-modal-close')?.addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-cancel')?.addEventListener('click', closeEditModal);
  
  document.getElementById('delete-modal-close')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-modal-cancel')?.addEventListener('click', closeDeleteModal);
  
  document.getElementById('view-modal-close')?.addEventListener('click', closeViewModal);
  document.getElementById('view-modal-close-btn')?.addEventListener('click', closeViewModal);

  // ========================================
  // ASSIGN CATEGORY ACTION
  // ========================================
  document.getElementById('assign-modal-assign')?.addEventListener('click', async () => {
    const category = document.getElementById('assign-category-select')?.value;
    if (!category || !assignModalState.ticketId) return;

    try {
      const res = await fetch(`/api/tickets/${assignModalState.ticketId}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });

      if (res.ok) {
        showNotification('Success', 'Category assigned successfully!', 'success', 3000);
        closeAssignModal();
        await loadTickets();
      } else {
        showNotification('Error', 'Failed to assign category', 'error', 3000);
      }
    } catch (err) {
      console.error('Error assigning category:', err);
      showNotification('Error', 'Failed to assign category', 'error', 3000);
    }
  });

  // ========================================
  // EDIT CATEGORY ACTION
  // ========================================
  document.getElementById('edit-modal-update')?.addEventListener('click', async () => {
    const category = document.getElementById('edit-category-select')?.value;
    if (!category || !editModalState.ticketId) return;

    try {
      const res = await fetch(`/api/tickets/${editModalState.ticketId}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });

      if (res.ok) {
        showNotification('Success', 'Category updated successfully!', 'success', 3000);
        closeEditModal();
        await loadTickets();
      } else {
        showNotification('Error', 'Failed to update category', 'error', 3000);
      }
    } catch (err) {
      console.error('Error updating category:', err);
      showNotification('Error', 'Failed to update category', 'error', 3000);
    }
  });

  // ========================================
  // DELETE TICKET ACTION
  // ========================================
  document.getElementById('delete-modal-delete')?.addEventListener('click', async () => {
    if (!deleteModalState.ticketId) return;

    try {
      const res = await fetch(`/api/tickets/${deleteModalState.ticketId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showNotification('Success', 'Ticket deleted successfully!', 'success', 3000);
        closeDeleteModal();
        await loadTickets();
      } else {
        showNotification('Error', 'Failed to delete ticket', 'error', 3000);
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      showNotification('Error', 'Failed to delete ticket', 'error', 3000);
    }
  });

  // ========================================
  // NEW TICKET NOTIFICATION SYSTEM
  // ========================================
  let lastTicketCount = 0;
  let knownTicketIds = new Set();
  let isFirstLoad = true;

  const checkForNewTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) return;
      
      const tickets = await res.json();
      const currentTicketIds = new Set(tickets.map(t => t.id));
      
      // Skip notification on first load
      if (isFirstLoad) {
        knownTicketIds = currentTicketIds;
        lastTicketCount = tickets.length;
        isFirstLoad = false;
        return;
      }
      
      // Check for new tickets
      const newTickets = tickets.filter(t => !knownTicketIds.has(t.id));
      
      if (newTickets.length > 0) {
        // Show notification for each new ticket
        newTickets.forEach(ticket => {
          const category = ticket.category ? `Category: ${ticket.category}` : 'Unassigned';
          showNotification(
            '🎫 New Ticket Received',
            `"${ticket.title}" - ${category}`,
            'info',
            5000
          );
        });
        
        // Play notification sound (optional)
        playNotificationSound();
        
        // Update known tickets
        knownTicketIds = currentTicketIds;
        lastTicketCount = tickets.length;
      }
    } catch (err) {
      console.error('Error checking for new tickets:', err);
    }
  };

  // Optional: Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PVqzn77BdGAk+ltryxnMnBSh+zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1rwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofszy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4PUqzn77BdGAk+ltryxnMnBSh9zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1pwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofczy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4PUqzn77BdGAk+ltryxnMnBSh9zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1pwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofczy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4PUqzn77BdGAk+ltryxnMnBSh9zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1pwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofczy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4=');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (err) {
      // Silently fail if audio doesn't work
    }
  };

  // ========================================
  // EVENT LISTENERS FOR NOTIFICATIONS
  // ========================================
  const bellBtn = document.getElementById("bell-btn");
  const notificationsPanel = document.getElementById("notifications-panel");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  bellBtn?.addEventListener("click", () => {
    notificationsPanel?.classList.toggle("hidden");
  });

  markAllReadBtn?.addEventListener("click", async () => {
    if (adminId) {
      try {
        const response = await fetch(`/api/staff/${adminId}/notifications/read-all`, {
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
  // INITIALIZE
  // ========================================
  console.log('🚀 Initializing admin dashboard...');
  await populateCategories();
  await loadTickets();

  // Check for new tickets every 10 seconds
  setInterval(() => {
    loadTickets();
    checkForNewTickets();
  }, 10000);

  console.log('✅ Initialization complete');
  console.log('📡 New ticket notification system active');
});
