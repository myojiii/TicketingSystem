document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".toggle-visibility");
  const passwordInput = document.querySelector("#password");
  const form = document.querySelector("#login-form");
  const messageBox = document.querySelector("#message");

  const showMessage = (text, type = "error") => {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
  };

  if (toggleBtn && passwordInput) {
    const eyeOpen = toggleBtn.querySelector(".eye-open");
    const eyeClosed = toggleBtn.querySelector(".eye-closed");

    toggleBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");

      if (eyeOpen && eyeClosed) {
        eyeOpen.classList.toggle("is-hidden", !isPassword);
        eyeClosed.classList.toggle("is-hidden", isPassword);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const payload = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      showMessage("Signing in...", "success");

      try {
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          showMessage(data.message || "Invalid email or password.", "error");
          return;
        }

        // ✅ ADD THESE LINES - Store userId and email in localStorage
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
        }
        if (payload.email) {
          localStorage.setItem("userEmail", payload.email);
        }
        if (data.name) {
          localStorage.setItem("userName", data.name);
        }

        showMessage("Login successful. Redirecting...", "success");
        setTimeout(() => {
          window.location.href = data.redirect || "/";
        }, 400);
      } catch (err) {
        showMessage("Unable to connect. Please try again.", "error");
      }
    });
  }
});