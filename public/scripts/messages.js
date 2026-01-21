(() => {
  const ClientApp = window.ClientApp || {};
  const state = ClientApp.state || {};
  const utils = ClientApp.utils || {};
  const formatTime =
    utils.formatTime ||
    ((dateStr) =>
      dateStr
        ? new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "");

  const chatModal = document.getElementById("chat-modal");
  const chatMessages = document.getElementById("chat-messages");
  const chatTitle = document.getElementById("chat-ticket-title");
  const chatId = document.getElementById("chat-ticket-id");
  const closeChatBtn = document.getElementById("close-chat");
  const sendBtn = document.getElementById("send-message");
  const messageInput = document.getElementById("message-input");

  const renderMessages = (allMessages) => {
    if (!chatMessages) return;

    // Get current user ID from state or localStorage
    const currentUserId = state.currentUserId || localStorage.getItem("userId");

    chatMessages.innerHTML = allMessages
      .map((msg) => {
        if (msg.isDescription) {
          return `
						<div class="message client">
							<div class="message-avatar">C</div>
							<div class="message-content">
								<div class="message-sender">You</div>
								<div class="message-text">${msg.text}</div>
							</div>
						</div>
					`;
        }

        // Determine if message is from staff or client
        const isFromStaff =
          msg.senderId && String(msg.senderId) === String(state.currentStaffId);
        const isClient =
          !isFromStaff && String(msg.senderId) === String(currentUserId);
        const avatar = isClient ? "C" : "A";
        const senderName = isClient ? "You" : msg.senderName || "Agent";

        return `
					<div class="message ${isClient ? "client" : "agent"}">
						<div class="message-avatar">${avatar}</div>
						<div class="message-content">
							<div class="message-sender">${senderName}</div>
							<div class="message-text">${msg.message || msg.text || ""}</div>
							<div class="message-time">${formatTime(msg.timestamp || msg.createdAt)}</div>
						</div>
					</div>
				`;
      })
      .join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const loadMessages = async (ticketId) => {
    try {
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticket = ticketRes.ok ? await ticketRes.json() : null;

      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (!res.ok) return;

      const messages = await res.json();
      const allMessages = [];

      // Get current user ID from state or localStorage
      const currentUserId =
        state.currentUserId || localStorage.getItem("userId");

      if (ticket && ticket.description) {
        allMessages.push({
          isDescription: true,
          text: ticket.description,
          senderName: "You",
          senderId: currentUserId,
          staffId: state.currentStaffId,
        });
      }

      allMessages.push(...messages);
      renderMessages(allMessages);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const markTicketAsOpened = (ticketId) => {
    try {
      console.log(`Marking ticket #${ticketId} as viewed...`);

      // Notify backend that client has viewed the agent's message
      // This will set hasAgentView = true on the backend
      fetch(`/api/tickets/${ticketId}/mark-viewed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error(
              `Failed to mark ticket as viewed. Status: ${res.status}, Error:`,
              errorText
            );
            return;
          }
          console.log(`✓ Ticket #${ticketId} marked as viewed on server`);

          // Refresh ticket list to update badge immediately
          if (
            window.ClientApp &&
            typeof window.ClientApp.loadMyTickets === "function"
          ) {
            setTimeout(() => {
              window.ClientApp.loadMyTickets();
            }, 500);
          }
        })
        .catch((err) => {
          console.error("Error marking ticket as viewed on server:", err);
          alert(
            "Note: Unable to mark ticket as viewed on server. The badge may reappear."
          );
        });
    } catch (err) {
      console.error("Error marking ticket as opened:", err);
    }
  };

  const openChat = async (ticketId) => {
    if (!chatModal) return;
    state.currentTicketId = ticketId;

    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to fetch ticket");

      const ticket = await res.json();
      state.currentStaffId = ticket.assignedStaffId || null;
      state.currentTicketId = ticket.id || ticketId;

      if (chatTitle) chatTitle.textContent = ticket.title || "Untitled";
      if (chatId) chatId.textContent = `Ticket #${ticket.id}`;

      chatModal.classList.add("active");

      // Mark ticket as opened with current timestamp and clear notifications for this ticket
      markTicketAsOpened(ticketId);
      fetch(`/api/notifications/ticket/${encodeURIComponent(ticketId)}/read`, {
        method: "PATCH",
      }).catch(() => {});

      await loadMessages(ticketId);

      if (state.messagePolling) clearInterval(state.messagePolling);
      state.messagePolling = setInterval(() => loadMessages(ticketId), 5000);
    } catch (err) {
      console.error("Error opening chat:", err);
      alert("Failed to load ticket details");
    }
  };

  const closeChat = () => {
    if (!chatModal) return;
    chatModal.classList.remove("active");
    if (state.messagePolling) {
      clearInterval(state.messagePolling);
      state.messagePolling = null;
    }
    state.currentTicketId = null;
    state.currentStaffId = null;

    // Refresh ticket list to update badges after viewing
    if (
      window.ClientApp &&
      typeof window.ClientApp.loadMyTickets === "function"
    ) {
      window.ClientApp.loadMyTickets();
    }
  };

  const sendMessage = async () => {
    if (!messageInput || !state.currentTicketId) return;
    const text = messageInput.value.trim();
    if (!text) return;

    // Get senderId directly from localStorage as fallback
    const senderId = state.currentUserId || localStorage.getItem("userId");

    if (!senderId) {
      alert("Please log in to send messages");
      return;
    }

    try {
      // Receiver is the assigned staff (since client is sending)
      const receiverId = state.currentStaffId || "";
      const senderName = localStorage.getItem("userName") || "Client";

      const payload = {
        senderId: senderId,
        senderName: senderName,
        receiverId: receiverId,
        staffId: state.currentStaffId,
        message: text,
        timestamp: new Date().toISOString(),
      };

      console.log("Sending message with payload:", payload);

      const res = await fetch(
        `/api/tickets/${state.currentTicketId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        messageInput.value = "";
        await loadMessages(state.currentTicketId);
      } else {
        const errorData = await res.json();
        console.error("Send error:", errorData);
        alert(
          "Failed to send message: " + (errorData.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Error sending message");
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (closeChatBtn) closeChatBtn.addEventListener("click", closeChat);
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);

    if (messageInput) {
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    window.Messages = {
      openChat,
      loadMessages,
    };
  });
})();
