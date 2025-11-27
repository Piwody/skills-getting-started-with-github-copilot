document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Escape text nodes to avoid XSS
  function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Prevent duplicate options when reloading
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (pretty, bulleted list with avatar initials)
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHTML = "";
        if (participants.length === 0) {
          participantsHTML = `<div class="participants"><h5>Participants</h5><p class="participants-empty">No participants yet — sé el primero.</p></div>`;
        } else {
          const items = participants
            .map((p) => {
              const label = typeof p === "string" ? p : (p && (p.name || p.email)) || JSON.stringify(p);
              const initials = String(label)
                .split(" ")
                .map((s) => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
              // Add a delete button for each participant. Use data attributes for activity and email.
              return `<li class="participant-item" data-email="${escapeHtml(label)}"><span class="participant-avatar">${escapeHtml(initials)}</span><span class="participant-label">${escapeHtml(label)}</span><button class="participant-delete" aria-label="Unregister ${escapeHtml(label)}" data-email="${escapeHtml(label)}">✖</button></li>`;
            })
            .join("");
          participantsHTML = `<div class="participants"><h5>Participants (${participants.length})</h5><ul class="participant-list">${items}</ul></div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Attach event listeners to the delete buttons we just injected
        activityCard.querySelectorAll(".participant-delete").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const email = btn.getAttribute("data-email");
            // Confirm before unregistering
            const confirmed = window.confirm(`Remove ${email} from ${name}?`);
            if (!confirmed) return;

            try {
              const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`, { method: "DELETE" });
              const json = await resp.json();

              if (resp.ok) {
                messageDiv.textContent = json.message || "Unregistered successfully";
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                // Refresh activities so UI reflects removal
                fetchActivities();
              } else {
                messageDiv.textContent = json.detail || "Failed to unregister";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }

              setTimeout(() => messageDiv.classList.add("hidden"), 4000);
            } catch (err) {
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Unregister error:", err);
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly-registered participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
