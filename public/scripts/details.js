document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-convo");
  const convo = document.getElementById("conversation-card");

  if (!toggle || !convo) return;

  toggle.addEventListener("click", () => {
    const isHidden = convo.classList.contains("hidden");
    convo.classList.toggle("hidden", !isHidden);
    toggle.textContent = isHidden ? "Hide Conversation" : "View Conversation";
  });
});
