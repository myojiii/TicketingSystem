document.addEventListener('DOMContentLoaded', async () => {
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
  const closeViewModal = () => viewOverlay?.classList.add('hidden');

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
    return text.substring(0, 50) + '...';
  };

  const getStatusClass = (status) =>
    status ? status.toLowerCase().replace(/\s+/g, '-') : '';

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