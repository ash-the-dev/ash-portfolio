document.addEventListener("DOMContentLoaded", async () => {
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  const modal = document.getElementById("project-modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const serviceCards = document.querySelectorAll(".service-card");
  const messageField = document.getElementById("message");
  const selectedServiceInput = document.getElementById("selected-service-input");

  function openModal() {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  if (openModalBtn) {
    openModalBtn.addEventListener("click", openModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });

  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      serviceCards.forEach((item) => item.classList.remove("active"));
      card.classList.add("active");

      const selectedService = card.dataset.service;
      selectedServiceInput.value = selectedService;

      const templates = {
        "Website Design":
          "Hi Ash, I'm interested in a website design project. I'm looking for help with...",
        "Website Redesign":
          "Hi Ash, I'm interested in redesigning an existing website. The main goals are...",
        "SEO Improvements":
          "Hi Ash, I'm interested in improving a website's search visibility and structure. I'm looking for help with...",
        "Website Setup and Deployment":
          "Hi Ash, I'm looking for help getting a website set up, connected, and deployed. The project details are...",
        "Technical Consultation":
          "Hi Ash, I'm interested in technical consultation for a website project. I could use help with..."
      };

      if (messageField) {
        messageField.value = templates[selectedService] || "Hi Ash, I'm interested in working together on...";
        messageField.focus();
      }
    });
  });

  const username = "ash-the-dev";
  const statsContainer = document.getElementById("github-stats");
  const repoList = document.getElementById("repo-list");

  if (statsContainer && repoList) {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
      const repos = await response.json();

      if (!Array.isArray(repos)) {
        throw new Error("Unexpected GitHub response.");
      }

      const publicRepos = repos.filter((repo) => !repo.fork);

      statsContainer.innerHTML = `
        <div class="stat-box">
          <h3>Username</h3>
          <p>${username}</p>
        </div>
        <div class="stat-box">
          <h3>Repositories Shown</h3>
          <p>${publicRepos.length}</p>
        </div>
      `;

      repoList.innerHTML = publicRepos
        .map(
          (repo) => `
            <article class="repo-item">
              <h3>
                <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
                  ${repo.name}
                </a>
              </h3>
              <p>${repo.description ? repo.description : "No description added yet."}</p>
              <div class="repo-meta">
                <span>${repo.language ? repo.language : "No language listed"}</span>
                <span>★ ${repo.stargazers_count}</span>
              </div>
            </article>
          `
        )
        .join("");
    } catch (error) {
      console.error("GitHub section failed to load:", error);
      statsContainer.innerHTML = `<p>Unable to load GitHub activity right now.</p>`;
      repoList.innerHTML = "";
    }
  }
});