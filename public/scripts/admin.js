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
    sidebar.classList.add('collapsed');
    layout.classList.add('sidebar-collapsed');
  }
  
  // Toggle sidebar on button click
  toggleBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    layout.classList.toggle('sidebar-collapsed');
    
    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
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
    const buttonText = btn.querySelector('.nav-text').textContent;
    console.log('Navigating to:', buttonText);
    
    // Example: You can add routing logic here
    // if (buttonText === 'Management') {
    //   window.location.href = '/admin/management';
    // }
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
    // Add any other session data you want to clear
    
    // Redirect to login page
    window.location.href = '/';
  }
});
  // ========================================
  // GLOBAL STATE
  // ========================================
  let assignModalState = { ticketId: null };
  let editModalState = { ticketId: null };
  let deleteModalState = { ticketId: null };

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, 20) + '...';
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

  const normalize = (val = '') => val.toString().trim().toLowerCase();

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

        assignOverlay.querySelector('.modal-ticket-id').textContent = assignModalState.ticketId;
        assignOverlay.querySelector('.modal-ticket-title').textContent = tds[0]?.textContent || '';
        assignOverlay.querySelector('.modal-desc').textContent = tds[1]?.textContent || '';
        assignOverlay.querySelector('.modal-date').textContent = tds[2]?.textContent || '';

        document.getElementById('assign-category-select').value = '';
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

        document.getElementById('edit-ticket-id').textContent = editModalState.ticketId;
        document.getElementById('edit-current-category').textContent = tds[3]?.textContent || '';
        document.getElementById('edit-category-select').value = '';

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

          document.getElementById('view-ticket-id').textContent = ticket.id || '-';
          document.getElementById('view-ticket-title').textContent = ticket.title || '-';
          document.getElementById('view-ticket-description').textContent = ticket.description || '-';
          document.getElementById('view-ticket-category').textContent = ticket.category || 'Unassigned';
          document.getElementById('view-ticket-date').textContent = formatDate(ticket.date);
          document.getElementById('view-client-userid').textContent = ticket.userId || '-';

          const statusEl = document.getElementById('view-ticket-status');
          statusEl.textContent = ticket.status || 'Pending';
          statusEl.className = `status-badge ${getStatusClass(ticket.status)}`;

          const priorityEl = document.getElementById('view-ticket-priority');
          priorityEl.textContent = ticket.priority || 'Not Set';

          openViewModal();
          startMessagesPolling();
        } catch (err) {
          console.error('Error fetching ticket:', err);
          alert('Failed to load ticket details');
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
        document.getElementById('delete-ticket-id').textContent = deleteModalState.ticketId;
        openDeleteModal();
      };
    });
  };

  // ========================================
  // LOAD TICKETS
  // ========================================
  const loadTickets = async () => {
    try {
      const unassignedTbody = document.querySelector('.tickets-section:first-of-type tbody');
      const allTicketsTbody = document.querySelector('.tickets-section:last-of-type tbody');

      console.log('Starting to load tickets...'); // Debug

      const res = await fetch('/api/tickets');
      console.log('Response status:', res.status); // Debug
      
      if (!res.ok) throw new Error('Failed to fetch tickets');
      
      const tickets = await res.json();
      console.log('Fetched tickets:', tickets); // Debug

      const unassigned = tickets.filter(t => !t.category || t.category.trim() === '');
      const assigned = tickets.filter(t => t.category && t.category.trim() !== '');

      console.log('Unassigned:', unassigned.length, 'Assigned:', assigned.length); // Debug

      // Populate unassigned table
      if (unassignedTbody) {
        if (unassigned.length === 0) {
          unassignedTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#666;">No unassigned tickets</td></tr>';
        } else {
          unassignedTbody.innerHTML = unassigned.map(t => `
            <tr data-ticket-id="${t.id}">
              <td>${t.title || 'Untitled'}</td>
              <td>${truncateText(t.description, 100)}</td>
              <td>${formatDate(t.date)}</td>
              <td><button class="action-btn primary-btn assign-category-btn">Assign Category</button></td>
            </tr>
          `).join('');
          attachAssignButtonListeners();
        }
      }

      // Populate assigned table
      if (allTicketsTbody) {
        if (assigned.length === 0) {
          allTicketsTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">No assigned tickets</td></tr>';
        } else {
          allTicketsTbody.innerHTML = assigned.map(t => `
            <tr data-ticket-id="${t.id}">
              <td>${t.title || 'Untitled'}</td>
              <td>${truncateText(t.description, 100)}</td>
              <td>${formatDate(t.date)}</td>
              <td>${t.category || 'Unassigned'}</td>
              <td><span class="status-badge ${getStatusClass(t.status)}">${t.status || 'Pending'}</span></td>
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
        }
      }

      console.log('Tickets loaded successfully'); // Debug

    } catch (err) {
      console.error('Failed to load tickets:', err);
      
      const unassignedTbody = document.querySelector('.tickets-section:first-of-type tbody');
      const allTicketsTbody = document.querySelector('.tickets-section:last-of-type tbody');
      
      if (unassignedTbody) {
        unassignedTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#d32f2f;">Error loading tickets. Check console.</td></tr>';
      }
      if (allTicketsTbody) {
        allTicketsTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#d32f2f;">Error loading tickets. Check console.</td></tr>';
      }
    }
  };

  // ========================================
  // POPULATE CATEGORIES
  // ========================================
  const populateCategories = async () => {
    const categorySelect = document.getElementById('assign-category-select');
    const editCategorySelect = document.getElementById('edit-category-select');
    
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;
      
      const categories = await res.json();
      
      // Populate assign modal
      if (categorySelect) {
        while (categorySelect.options.length > 1) categorySelect.remove(1);
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          categorySelect.appendChild(opt);
        });
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
      }
    } catch (err) {
      console.error('Error loading categories:', err);
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
        closeAssignModal();
        await loadTickets();
      } else {
        alert('Failed to assign category');
      }
    } catch (err) {
      console.error('Error assigning category:', err);
      alert('Failed to assign category');
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
        closeEditModal();
        await loadTickets();
      } else {
        alert('Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
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
        closeDeleteModal();
        await loadTickets();
      } else {
        alert('Failed to delete ticket');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert('Failed to delete ticket');
    }
  });

  // ========================================
  // INITIALIZE
  // ========================================
  await populateCategories();
  await loadTickets();
  setInterval(loadTickets, 10000);
}); 
