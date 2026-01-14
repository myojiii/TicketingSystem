document.addEventListener('DOMContentLoaded', async () => {
  // ========================================
  // LOAD AND SETUP ASSIGN CATEGORY MODAL
  // ========================================
  try {
    const modalRes = await fetch('/modals/admin/assignCategoryModal.html');
    if (!modalRes.ok) return;

    const modalHtml = await modalRes.text();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const overlay = document.getElementById('assign-modal');
    const closeBtn = document.getElementById('assign-modal-close');
    const cancelBtn = document.getElementById('assign-modal-cancel');
    const assignBtn = document.getElementById('assign-modal-assign');
    const categorySelect = document.getElementById('assign-category-select');

    const closeModal = () => overlay?.classList.add('hidden');
    const openModal = () => overlay?.classList.remove('hidden');

    // Populate category select from API first, fallback to reading menu items
    const populateCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          // clear extra options beyond placeholder
          while (categorySelect.options.length > 1) categorySelect.remove(1);
          if (Array.isArray(data)) {
            data.forEach((c) => {
              const name = c?.name || c;
              if (name) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                categorySelect.appendChild(opt);
              }
            });
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // fallback: try to read categories from existing menu items
      const menu = document.querySelector('#category-menu');
      const menuItems = menu ? Array.from(menu.querySelectorAll('.dropdown-item')) : [];
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
    };

    await populateCategories();

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
    assignBtn?.addEventListener('click', async () => {
      const selected = categorySelect?.value || '';
      const ticketId = overlay.querySelector('.modal-ticket-id')?.textContent || '';
      if (!selected) {
        categorySelect?.focus();
        return;
      }
      // TODO: hook up to backend API. For now, simple UX behavior
      console.log('Assigning', ticketId, 'to category', selected);
      closeModal();
    });
  } catch (err) {
    console.error('Failed to load assign category modal:', err);
  }

  // ========================================
  // LOAD AND SETUP VIEW CONVERSATION MODAL
  // ========================================
  try {
    const viewModalRes = await fetch('/modals/admin/viewConversationModal.html');
    if (!viewModalRes.ok) throw new Error('Failed to load view modal');

    const viewModalHtml = await viewModalRes.text();
    document.body.insertAdjacentHTML('beforeend', viewModalHtml);

    const viewOverlay = document.getElementById('view-modal');
    const viewCloseBtn = document.getElementById('view-modal-close');
    const viewCancelBtn = document.getElementById('view-modal-cancel');

    const closeViewModal = () => viewOverlay?.classList.add('hidden');
    const openViewModal = () => viewOverlay?.classList.remove('hidden');

    // Sample ticket data (replace with API call)
    const ticketData = {
      'TKT-101': {
        id: 'TKT-101',
        status: 'In Progress',
        priority: 'High',
        category: 'Network & VPN',
        date: '9/27/2025',
        clientName: 'Sarah Johnson',
        clientEmail: 'sarah.johnson@company.com',
        staffName: 'John Smith',
        messages: [
          {
            sender: 'Sarah Johnson',
            role: 'client',
            time: '9/27/2025 10:30 AM',
            content: 'I am experiencing frequent disconnections with the VPN. It drops every 5 minutes and I have to reconnect manually.'
          },
          {
            sender: 'John Smith',
            role: 'staff',
            time: '9/27/2025 11:15 AM',
            content: "Hi Sarah, I'm looking into this issue. Can you please tell me which VPN client you're using and your operating system version?"
          },
          {
            sender: 'Sarah Johnson',
            role: 'client',
            time: '9/27/2025 11:30 AM',
            content: "I'm using Cisco AnyConnect on Windows 11 Pro."
          }
        ]
      },
      'TKT-102': {
        id: 'TKT-102',
        status: 'In Progress',
        priority: 'Medium',
        category: 'Software Installation',
        date: '11/28/2025',
        clientName: 'Michael Brown',
        clientEmail: 'michael.brown@company.com',
        staffName: 'Jane Doe',
        messages: [
          {
            sender: 'Michael Brown',
            role: 'client',
            time: '11/28/2025 09:00 AM',
            content: 'I need Microsoft Office 365 installed on my workstation.'
          },
          {
            sender: 'Jane Doe',
            role: 'staff',
            time: '11/28/2025 09:30 AM',
            content: "I'll process the license and schedule the installation. What's your preferred time?"
          }
        ]
      },
      'TKT-103': {
        id: 'TKT-103',
        status: 'In Progress',
        priority: 'High',
        category: 'Account Management',
        date: '12/12/2025',
        clientName: 'Emily Davis',
        clientEmail: 'emily.davis@company.com',
        staffName: 'Robert Lee',
        messages: [
          {
            sender: 'Emily Davis',
            role: 'client',
            time: '12/12/2025 02:15 PM',
            content: 'I need to reset my password. I cannot access my account.'
          },
          {
            sender: 'Robert Lee',
            role: 'staff',
            time: '12/12/2025 02:20 PM',
            content: "I'll send you a password reset link to your email immediately."
          }
        ]
      }
    };

    const loadMessages = (messages) => {
      const messagesList = document.getElementById('messages-list');
      if (!messagesList) return;
      messagesList.innerHTML = '';
      
      messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.role}`;
        messageDiv.innerHTML = `
          <div class="message-header">
            <span class="message-sender ${msg.role}">${msg.sender}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-content">${msg.content}</div>
        `;
        messagesList.appendChild(messageDiv);
      });
      
      messagesList.scrollTop = messagesList.scrollHeight;
    };

    // Attach click handlers to all "View" icon buttons
    document.querySelectorAll('.icon-action-btn[title="View"]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const ticketId = tr.querySelector('td:first-child')?.textContent.trim() || 'TKT-101';
        
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/tickets/${ticketId}`);
        // const ticket = await response.json();
        
        const ticket = ticketData[ticketId] || ticketData['TKT-101'];
        
        // Update ticket info
        const idEl = document.getElementById('view-ticket-id');
        const statusEl = document.getElementById('view-ticket-status');
        const priorityEl = document.getElementById('view-ticket-priority');
        const categoryEl = document.getElementById('view-ticket-category');
        const dateEl = document.getElementById('view-ticket-date');
        const clientNameEl = document.getElementById('view-client-name');
        const clientEmailEl = document.getElementById('view-client-email');
        const staffNameEl = document.getElementById('view-staff-name');
        
        if (idEl) idEl.textContent = ticket.id;
        if (statusEl) statusEl.textContent = ticket.status;
        if (priorityEl) priorityEl.textContent = ticket.priority;
        if (categoryEl) categoryEl.textContent = ticket.category;
        if (dateEl) dateEl.textContent = ticket.date;
        if (clientNameEl) clientNameEl.textContent = ticket.clientName;
        if (clientEmailEl) clientEmailEl.textContent = ticket.clientEmail;
        if (staffNameEl) staffNameEl.textContent = ticket.staffName;
        
        loadMessages(ticket.messages);
        openViewModal();
      });
    });

    viewCloseBtn?.addEventListener('click', closeViewModal);
    viewCancelBtn?.addEventListener('click', closeViewModal);
    viewOverlay?.addEventListener('click', (ev) => {
      if (ev.target === viewOverlay) closeViewModal();
    });
  } catch (err) {
    console.error('Failed to load view conversation modal:', err);
  }

  // ========================================
  // LOAD AND SETUP EDIT CATEGORY MODAL
  // ========================================
  try {
    const editModalRes = await fetch('/modals/admin/editCategoryModal.html');
    if (!editModalRes.ok) throw new Error('Failed to load edit modal');

    const editModalHtml = await editModalRes.text();
    document.body.insertAdjacentHTML('beforeend', editModalHtml);

    const editOverlay = document.getElementById('edit-modal');
    const editCloseBtn = document.getElementById('edit-modal-close');
    const editCancelBtn = document.getElementById('edit-modal-cancel');
    const editUpdateBtn = document.getElementById('edit-modal-update');
    const editCategorySelect = document.getElementById('edit-category-select');

    const closeEditModal = () => editOverlay?.classList.add('hidden');
    const openEditModal = () => editOverlay?.classList.remove('hidden');

    // Populate categories in edit modal
    const populateEditCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          while (editCategorySelect.options.length > 1) editCategorySelect.remove(1);
          if (Array.isArray(data)) {
            data.forEach((c) => {
              const name = c?.name || c;
              if (name) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                editCategorySelect.appendChild(opt);
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to load categories for edit modal:', e);
      }
    };

    await populateEditCategories();

    // Attach click handlers to all "Edit" icon buttons
    document.querySelectorAll('.icon-action-btn[title="Edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const tds = tr.querySelectorAll('td');
        const ticketId = tds[0]?.textContent.trim() || '';
        const currentCategory = tds[3]?.textContent.trim() || '';

        const idEl = document.getElementById('edit-ticket-id');
        const currentCategoryEl = document.getElementById('edit-current-category');

        if (idEl) idEl.textContent = ticketId;
        if (currentCategoryEl) currentCategoryEl.textContent = currentCategory;

        openEditModal();
      });
    });

    editCloseBtn?.addEventListener('click', closeEditModal);
    editCancelBtn?.addEventListener('click', closeEditModal);
    editOverlay?.addEventListener('click', (ev) => {
      if (ev.target === editOverlay) closeEditModal();
    });

    editUpdateBtn?.addEventListener('click', async () => {
      const newCategory = editCategorySelect?.value || '';
      const ticketId = document.getElementById('edit-ticket-id')?.textContent || '';
      
      if (!newCategory) {
        editCategorySelect?.focus();
        return;
      }
      
      // TODO: Send update to backend
      // await fetch(`/api/tickets/${ticketId}/category`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ category: newCategory })
      // });
      
      console.log('Updating', ticketId, 'to category', newCategory);
      closeEditModal();
      // Optionally refresh the page or update the table row
      // location.reload();
    });
  } catch (err) {
    console.error('Failed to load edit category modal:', err);
  }

  // ========================================
  // LOAD AND SETUP DELETE TICKET MODAL
  // ========================================
  try {
    const deleteModalRes = await fetch('/modals/admin/deleteTicketModal.html');
    if (!deleteModalRes.ok) throw new Error('Failed to load delete modal');

    const deleteModalHtml = await deleteModalRes.text();
    document.body.insertAdjacentHTML('beforeend', deleteModalHtml);

    const deleteOverlay = document.getElementById('delete-modal');
    const deleteCloseBtn = document.getElementById('delete-modal-close');
    const deleteCancelBtn = document.getElementById('delete-modal-cancel');
    const deleteConfirmBtn = document.getElementById('delete-modal-delete');

    const closeDeleteModal = () => deleteOverlay?.classList.add('hidden');
    const openDeleteModal = () => deleteOverlay?.classList.remove('hidden');

    // Attach click handlers to all "Delete" icon buttons
    document.querySelectorAll('.icon-action-btn[title="Delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const ticketId = tr.querySelector('td:first-child')?.textContent.trim() || '';

        const idEl = document.getElementById('delete-ticket-id');
        if (idEl) idEl.textContent = ticketId;

        openDeleteModal();
      });
    });

    deleteCloseBtn?.addEventListener('click', closeDeleteModal);
    deleteCancelBtn?.addEventListener('click', closeDeleteModal);
    deleteOverlay?.addEventListener('click', (ev) => {
      if (ev.target === deleteOverlay) closeDeleteModal();
    });

    deleteConfirmBtn?.addEventListener('click', async () => {
      const ticketId = document.getElementById('delete-ticket-id')?.textContent || '';
      
      // TODO: Send delete request to backend
      // await fetch(`/api/tickets/${ticketId}`, {
      //   method: 'DELETE'
      // });
      
      console.log('Deleting ticket', ticketId);
      closeDeleteModal();
      
      // Optionally remove the row from the table
      // const row = document.querySelector(`tr td:first-child:contains("${ticketId}")`).closest('tr');
      // row?.remove();
      
      // Or reload the page
      // location.reload();
    });
  } catch (err) {
    console.error('Failed to load delete ticket modal:', err);
  }
});