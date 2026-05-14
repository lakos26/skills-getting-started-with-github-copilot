document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderParticipantList(activityName, participants) {
    if (participants.length === 0) {
      return '<li class="participants-list__empty">No one has signed up yet</li>';
    }

    return participants
      .map(
        (participant) => `
          <li class="participants-list__item">
            <span class="participants-list__email">${participant}</span>
            <button
              type="button"
              class="participant-delete"
              data-activity="${activityName}"
              data-email="${participant}"
              aria-label="Remove ${participant} from ${activityName}"
              title="Remove participant"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3.75h6a1.25 1.25 0 0 1 1.25 1.25V6H20a.75.75 0 0 1 0 1.5h-1.16l-.72 11.08A2.25 2.25 0 0 1 15.87 20.5H8.13a2.25 2.25 0 0 1-2.25-1.92L5.16 7.5H4a.75.75 0 0 1 0-1.5h3.75V5A1.25 1.25 0 0 1 9 3.75Zm6.25 2.25v-.75h-5.5V6h5.5Zm-7 1.5.66 10.82a.75.75 0 0 0 .75.68h7.38a.75.75 0 0 0 .75-.68L18.4 7.5H8.25Zm2.25 2.5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75Z"/>
              </svg>
            </button>
          </li>
        `
      )
      .join("");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const selectedActivity = activitySelect.value;
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <div class="activity-card__header">
            <h4>${name}</h4>
            <span class="availability-badge ${spotsLeft === 0 ? "availability-badge--full" : ""}">${spotsLeft} spots left</span>
          </div>
          <p class="activity-card__description">${details.description}</p>
          <div class="activity-card__meta">
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          </div>
          <div class="participants-section">
            <p class="participants-section__title">Participants</p>
            <ul class="participants-list">
              ${renderParticipantList(name, details.participants)}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (selectedActivity && activities[selectedActivity]) {
        activitySelect.value = selectedActivity;
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");

    if (!deleteButton) {
      return;
    }

    const { activity, email } = deleteButton.dataset;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

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
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
