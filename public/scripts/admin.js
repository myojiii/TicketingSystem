document.addEventListener('DOMContentLoaded', async () => {
  // Load assign-category modal markup and wire up modal behavior
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
    console.error('Failed to load modal:', err);
  }
});
