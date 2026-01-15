document.addEventListener('DOMContentLoaded', async () => {
  // ========================================
  // GLOBAL VARIABLES
  // ========================================
  let assignModalState = { ticketId: null };
  let editModalState = { ticketId: null };
  let deleteModalState = { ticketId: null };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };
  
  const getStatusClass = (status) => {
    if (!status) return '';
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    return normalized;
  };

  // ========================================
  // ATTACH EVENT LISTENERS FUNCTIONS
  // ========================================
  const attachAssignButtonListeners = () => {
    document.querySelectorAll('.assign-category-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        
        const ticketId = tr.getAttribute('data-ticket-id');
        const tds = tr.querySelectorAll('td');
        const title = tds[0]?.textContent.trim() || '';
        const desc = tds[1]?.textContent.trim() || '';
        const date = tds[2]?.textContent.trim() || '';

        assignModalState.ticketId = ticketId;

        // Populate modal with ticket data
        const overlay = document.getElementById('assign-modal');
        const idEl = overlay?.querySelector('.modal-ticket-id');
        const titleEl = overlay?.querySelector('.modal-ticket-title');
        const descEl = overlay?.querySelector('.modal-desc');
        const dateEl = overlay?.querySelector('.modal-date');

        if (idEl) idEl.textContent = ticketId;
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        if (dateEl) dateEl.textContent = date;

        // Reset category select
        const categorySelect = document.getElementById('assign-category-select');
        if (categorySelect) categorySelect.value = '';

        openAssignModal();
      });
    });
  };

  const attachViewButtonListeners = () => {
    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const ticketId = tr.getAttribute('data-ticket-id');
        
        // TODO: Fetch actual ticket data from API and populate view modal
        console.log('Viewing ticket:', ticketId);
      });
    });
  };

  const attachEditButtonListeners = () => {
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const ticketId = tr.getAttribute('data-ticket-id');
        const tds = tr.querySelectorAll('td');
        const currentCategory = tds[3]?.textContent.trim() || '';

        editModalState.ticketId = ticketId;

        const idEl = document.getElementById('edit-ticket-id');
        const currentCategoryEl = document.getElementById('edit-current-category');

        if (idEl) idEl.textContent = ticketId;
        if (currentCategoryEl) currentCategoryEl.textContent = currentCategory;

        const editCategorySelect = document.getElementById('edit-category-select');
        if (editCategorySelect) editCategorySelect.value = '';

        openEditModal();
      });
    });
  };

  const attachDeleteButtonListeners = () => {
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const ticketId = tr.getAttribute('data-ticket-id');

        deleteModalState.ticketId = ticketId;

        const idEl = document.getElementById('delete-ticket-id');
        if (idEl) idEl.textContent = ticketId;

        openDeleteModal();
      });
    });
  };

  // ========================================
  // FETCH AND DISPLAY TICKETS
  // ========================================
  const loadTickets = async () => {
    try {
      // Get table bodies once at the start
      const unassignedTbody = document.querySelector('.tickets-section:first-of-type tbody');
      const allTicketsTbody = document.querySelector('.tickets-section:last-of-type tbody');
      
      // Show loading state immediately
      if (unassignedTbody) {
        unassignedTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
              <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #5b4cfd; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </td>
          </tr>
        `;
      }
      
      if (allTicketsTbody) {
        allTicketsTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
              <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #5b4cfd; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </td>
          </tr>
        `;
      }
      
      // Fetch ALL tickets from the database
      const allRes = await fetch('/api/tickets');
      const allTickets = await allRes.json();
      
      console.log('All tickets fetched:', allTickets);
      
      // Separate tickets based on whether they have a category assigned
      const unassignedTickets = allTickets.filter(ticket => !ticket.category || ticket.category.trim() === '');
      const assignedTickets = allTickets.filter(ticket => ticket.category && ticket.category.trim() !== '');
      
      console.log('Unassigned:', unassignedTickets.length, 'Assigned:', assignedTickets.length);
      
      // Populate unassigned table
      if (unassignedTbody) {
        if (unassignedTickets.length === 0) {
          unassignedTbody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
                No unassigned tickets at the moment
              </td>
            </tr>
          `;
        } else {
          unassignedTbody.innerHTML = unassignedTickets.map(ticket => `
            <tr data-ticket-id="${ticket.id}">
              <td>${ticket.title || 'Untitled'}</td>
              <td>${ticket.description || 'No description'}</td>
              <td>${formatDate(ticket.date)}</td>
              <td><button class="action-btn primary-btn assign-category-btn">Assign Category</button></td>
            </tr>
          `).join('');
          
          // Re-attach event listeners for assign buttons
          attachAssignButtonListeners();
        }
      }
      
      // Populate all tickets table (ONLY assigned tickets)
      if (allTicketsTbody) {
        if (assignedTickets.length === 0) {
          allTicketsTbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                No assigned tickets yet
              </td>
            </tr>
          `;
        } else {
          allTicketsTbody.innerHTML = assignedTickets.map(ticket => `
            <tr data-ticket-id="${ticket.id}">
              <td>${ticket.title || 'Untitled'}</td>
              <td>${ticket.description || 'No description'}</td>
              <td>${formatDate(ticket.date)}</td>
              <td>${ticket.category || 'Unassigned'}</td>
              <td><span class="status-badge ${getStatusClass(ticket.status)}">${ticket.status || 'Pending'}</span></td>
              <td>
                <div class="action-icons">
                  <button class="icon-action-btn view-btn" title="View">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 6c-4.24 0-7.79 2.53-9.5 6 1.71 3.47 5.26 6 9.5 6s7.79-2.53 9.5-6c-1.71-3.47-5.26-6-9.5-6Zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4a4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
                    </svg>
                  </button>
                  <button class="icon-action-btn edit-btn" title="Edit">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" fill="currentColor"></path>
                      <path d="m20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" fill="currentColor"></path>
                    </svg>
                  </button>
                  <button class="icon-action-btn delete delete-btn" title="Delete">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4Z" fill="currentColor"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('');
          
          // Re-attach event listeners
          attachViewButtonListeners();
          attachEditButtonListeners();
          attachDeleteButtonListeners();
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
      
      // Show error in both tables
      const unassignedTbody = document.querySelector('.tickets-section:first-of-type tbody');
      const allTicketsTbody = document.querySelector('.tickets-section:last-of-type tbody');
      
      if (unassignedTbody) {
        unassignedTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px; color: #d32f2f;">
              Error loading tickets. Please refresh the page.
            </td>
          </tr>
        `;
      }
      
      if (allTicketsTbody) {
        allTicketsTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #d32f2f;">
              Error loading tickets. Please refresh the page.
            </td>
          </tr>
        `;
      }
    }
  };
  
  // Load tickets initially
  await loadTickets();
  
  // Auto-refresh every 10 seconds to show new tickets
  setInterval(loadTickets, 10000);

  // ========================================
  // ASSIGN CATEGORY MODAL
  // ========================================
  const overlay = document.getElementById('assign-modal');
  const closeBtn = document.getElementById('assign-modal-close');
  const cancelBtn = document.getElementById('assign-modal-cancel');
  const assignBtn = document.getElementById('assign-modal-assign');
  const categorySelect = document.getElementById('assign-category-select');

  const closeAssignModal = () => overlay?.classList.add('hidden');
  const openAssignModal = () => overlay?.classList.remove('hidden');

  // Populate categories from database
  const populateCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        // Keep the first option (placeholder)
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
        }
      }
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  await populateCategories();

  // Close handlers
  closeBtn?.addEventListener('click', closeAssignModal);
  cancelBtn?.addEventListener('click', closeAssignModal);
  overlay?.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeAssignModal();
  });

  // Assign button - saves to database
  assignBtn?.addEventListener('click', async () => {
    const selected = categorySelect?.value || '';
    if (!selected || !assignModalState.ticketId) {
      categorySelect?.focus();
      return;
    }
    
    try {
      const res = await fetch(`/api/tickets/${assignModalState.ticketId}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selected })
      });

      if (res.ok) {
        console.log('Category assigned successfully');
        closeAssignModal();
        // Refresh tickets to show updated data
        await loadTickets();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to assign category');
      }
    } catch (err) {
      console.error('Error assigning category:', err);
      alert('Failed to assign category');
    }
  });

  // ========================================
  // EDIT MODAL (if you have one)
  // ========================================
  const editOverlay = document.getElementById('edit-modal');
  const editCloseBtn = document.getElementById('edit-modal-close');
  const editCancelBtn = document.getElementById('edit-modal-cancel');
  const editUpdateBtn = document.getElementById('edit-modal-update');
  const editCategorySelect = document.getElementById('edit-category-select');

  const closeEditModal = () => editOverlay?.classList.add('hidden');
  const openEditModal = () => editOverlay?.classList.remove('hidden');

  if (editOverlay && editCategorySelect) {
    // Populate categories in edit modal from database
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

    editCloseBtn?.addEventListener('click', closeEditModal);
    editCancelBtn?.addEventListener('click', closeEditModal);
    editOverlay?.addEventListener('click', (ev) => {
      if (ev.target === editOverlay) closeEditModal();
    });

    editUpdateBtn?.addEventListener('click', async () => {
      const newCategory = editCategorySelect?.value || '';
      
      if (!newCategory || !editModalState.ticketId) {
        editCategorySelect?.focus();
        return;
      }
      
      try {
        const res = await fetch(`/api/tickets/${editModalState.ticketId}/category`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: newCategory })
        });

        if (res.ok) {
          console.log('Category updated successfully');
          closeEditModal();
          await loadTickets();
        } else {
          const error = await res.json();
          alert(error.message || 'Failed to update category');
        }
      } catch (err) {
        console.error('Error updating category:', err);
        alert('Failed to update category');
      }
    });
  }

  // ========================================
  // DELETE MODAL (if you have one)
  // ========================================
  const deleteOverlay = document.getElementById('delete-modal');
  const deleteCloseBtn = document.getElementById('delete-modal-close');
  const deleteCancelBtn = document.getElementById('delete-modal-cancel');
  const deleteConfirmBtn = document.getElementById('delete-modal-delete');

  const closeDeleteModal = () => deleteOverlay?.classList.add('hidden');
  const openDeleteModal = () => deleteOverlay?.classList.remove('hidden');

  if (deleteOverlay) {
    deleteCloseBtn?.addEventListener('click', closeDeleteModal);
    deleteCancelBtn?.addEventListener('click', closeDeleteModal);
    deleteOverlay?.addEventListener('click', (ev) => {
      if (ev.target === deleteOverlay) closeDeleteModal();
    });

    deleteConfirmBtn?.addEventListener('click', async () => {
      if (!deleteModalState.ticketId) return;
      
      try {
        const res = await fetch(`/api/tickets/${deleteModalState.ticketId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          console.log('Ticket deleted successfully');
          closeDeleteModal();
          await loadTickets();
        } else {
          const error = await res.json();
          alert(error.message || 'Failed to delete ticket');
        }
      } catch (err) {
        console.error('Error deleting ticket:', err);
        alert('Failed to delete ticket');
      }
    });
  }
});