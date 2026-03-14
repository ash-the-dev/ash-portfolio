document.addEventListener("DOMContentLoaded", async () => {
  const html = document.documentElement;
  const navLinks = document.querySelectorAll(".nav-links a");

  // ----------------------------
  // Nav active state
  // ----------------------------
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // ----------------------------
  // 4-mode layout switcher (button version)
  // ----------------------------
  const layoutButtons = document.querySelectorAll(".layout-btn");
  const savedTheme = localStorage.getItem("portfolio-theme") || "studio";

  html.setAttribute("data-theme", savedTheme);

  layoutButtons.forEach((button) => {
    if (button.dataset.theme === savedTheme) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

    button.addEventListener("click", () => {
      const newTheme = button.dataset.theme;

      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("portfolio-theme", newTheme);

      layoutButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });

  // ----------------------------
  // Project modal
  // ----------------------------
  const modal = document.getElementById("project-modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const serviceCards = document.querySelectorAll(".service-card");
  const messageField = document.getElementById("message");
  const selectedServiceInput = document.getElementById("selected-service-input");

  function openModal() {
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    if (!modal) return;
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
    if (event.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });

  // ----------------------------
  // Service selection autofill
  // ----------------------------
  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      serviceCards.forEach((item) => item.classList.remove("active"));
      card.classList.add("active");

      const selectedService = card.dataset.service || "";

      if (selectedServiceInput) {
        selectedServiceInput.value = selectedService;
      }

      const templates = {
        "Website Design":
          "Hi Ash, I'm interested in a website design project. I'm looking for help with...",
        "Website Redesign":
          "Hi Ash, I'm interested in redesigning an existing website. The goals for the redesign are...",
        "SEO Improvements":
          "Hi Ash, I'm interested in improving a website's search visibility and structure. I'm looking for help with...",
        "Website Setup and Deployment":
          "Hi Ash, I'm looking for help getting a website set up, connected, and deployed. The project details are...",
        "Technical Consultation":
          "Hi Ash, I'm interested in technical consultation for a website project. I could use help with..."
      };

      if (messageField) {
        messageField.value =
          templates[selectedService] ||
          "Hi Ash, I'm interested in working together on a project.";
        messageField.focus();
      }
    });
  });

  // ----------------------------
  // GitHub repo section
  // ----------------------------
  const username = "ash-the-dev";
  const statsContainer = document.getElementById("github-stats");
  const repoList = document.getElementById("repo-list");

  if (statsContainer && repoList) {
    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`
      );

      if (!response.ok) {
        throw new Error("GitHub API request failed.");
      }

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