(() => {
  const state = {
    currentUserId: null,
    currentTicketId: null,
    currentStaffId: null,
    messagePolling: null,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "No description";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getUserId = async () => {
    const stored = localStorage.getItem("userId");
    if (stored) return stored;

    const email = localStorage.getItem("userEmail");
    if (!email) return null;

    try {
      const res = await fetch(
        `/api/users/by-email?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
        return data.userId;
      }
    } catch (err) {
      return null;
    }
    return null;
  };

  const initUser = async () => {
    state.currentUserId = await getUserId();
    const name = localStorage.getItem("userName");
    const userInfoEl = document.getElementById("user-info");
    if (!userInfoEl) return;

    if (state.currentUserId && name) {
      userInfoEl.textContent = `Logged in as: ${name}`;
    } else {
      userInfoEl.textContent = "Not logged in";
    }
  };

  const getTicketOpenedTimes = () => {
    try {
      const opened = localStorage.getItem("ticketOpenedTimes");
      return opened ? JSON.parse(opened) : {};
    } catch {
      return {};
    }
  };

  const loadMyTickets = async () => {
    const container = document.getElementById("tickets-list");
    if (!container) return;

    if (!state.currentUserId) {
      container.innerHTML = `
				<div class="empty-state">
					<h3>Please log in to view your tickets</h3>
				</div>
			`;
      return;
    }

    try {
      const res = await fetch(`/api/tickets/user/${state.currentUserId}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const tickets = await res.json();

      if (!Array.isArray(tickets) || tickets.length === 0) {
        container.innerHTML = `
					<div class="empty-state">
						<h3>No tickets yet</h3>
						<p>Submit your first support ticket to get started</p>
					</div>
				`;
        return;
      }

      container.innerHTML = tickets
        .map((ticket) => {
          const ticketId = String(ticket.id);

          // Show badge if staff sent a message AND client hasn't viewed it yet
          const hasAgentReply = ticket.hasAgentReply || false;
          const hasClientViewed = !!ticket.hasClientViewed;
          const showBadge = hasAgentReply && !hasClientViewed;

          const statusClass = ticket.status
            ? ticket.status.toLowerCase().replace(/\s+/g, "-")
            : "pending";

          return `
						<div class="ticket-card ${showBadge ? "has-reply" : ""}" data-ticket-id="${
            ticket.id
          }">
							${showBadge ? '<span class="new-reply-badge">New Reply</span>' : ""}
							<div class="ticket-header">
								<span class="ticket-id">#${ticket.id}</span>
								<span class="ticket-status status-${statusClass}">${
            ticket.status || "Pending"
          }</span>
							</div>
							<div class="ticket-title">${ticket.title || "Untitled"}</div>
							<div class="ticket-description">${truncateText(ticket.description, 80)}</div>
							<div class="ticket-meta">
								<span>${ticket.category || "Unassigned"}</span>
								<span>${formatDate(ticket.date)}</span>
							</div>
						</div>
					`;
        })
        .join("");

      const openChat = window.Messages?.openChat;
      if (typeof openChat === "function") {
        document.querySelectorAll(".ticket-card").forEach((card) => {
          card.addEventListener("click", () => {
            openChat(card.dataset.ticketId);
          });
        });
      }
    } catch (err) {
      console.error("Error loading tickets:", err);
      container.innerHTML = `
				<div class="empty-state">
					<h3>Error loading tickets</h3>
					<p>Please try again later</p>
				</div>
			`;
    }
  };

  const setupTabs = () => {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));

        btn.classList.add("active");
        const tabEl = document.getElementById(`${tab}-tab`);
        if (tabEl) tabEl.classList.add("active");

        if (tab === "my-tickets") {
          loadMyTickets();
        }
      });
    });
  };

  const setupForm = () => {
    const form = document.getElementById("ticket-form");
    const statusBox = document.getElementById("status");
    if (!form || !statusBox) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusBox.className = "status-msg";
      statusBox.textContent = "Submitting...";

      if (!state.currentUserId) {
        statusBox.className = "status-msg error";
        statusBox.textContent = "Please log in to submit a ticket";
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        title: data.title,
        description: data.description,
        userId: state.currentUserId,
        email: localStorage.getItem("userEmail") || undefined,
      };

      try {
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          statusBox.className = "status-msg success";
          statusBox.textContent = "Ticket submitted successfully!";
          form.reset();
          setTimeout(() => {
            statusBox.textContent = "";
          }, 3000);
        } else {
          const body = await res.json();
          statusBox.className = "status-msg error";
          statusBox.textContent = body.message || "Failed to submit ticket";
        }
      } catch (err) {
        statusBox.className = "status-msg error";
        statusBox.textContent = "Error submitting ticket";
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.ClientApp = {
      state,
      utils: { formatDate, formatTime, truncateText },
      loadMyTickets,
    };

    setupTabs();
    setupForm();
    initUser();

    // Periodically refresh tickets to detect new replies from staff
    // This ensures badges appear when staff sends messages
    setInterval(() => {
      const myTicketsTab = document.getElementById("my-tickets-tab");
      if (myTicketsTab && myTicketsTab.classList.contains("active")) {
        console.log("Auto-refreshing tickets to check for new messages...");
        loadMyTickets();
      }
    }, 5000); // Refresh every 5 seconds when on the My Tickets tab
  });
})();
