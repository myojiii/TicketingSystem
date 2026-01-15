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
    
    // Separate tickets based on whether they have a category assigned
    const unassignedTickets = allTickets.filter(ticket => !ticket.category || ticket.category.trim() === '');
    const assignedTickets = allTickets.filter(ticket => ticket.category && ticket.category.trim() !== '');
    
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