document.addEventListener("DOMContentLoaded", async () => {
  const html = document.documentElement;
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  const layoutButtons = document.querySelectorAll(".layout-btn");
  const savedTheme = localStorage.getItem("portfolio-theme") || "canvas";

  html.setAttribute("data-theme", savedTheme);

  let vineTrailDestroy = null;

  function syncVineTrail() {
    if (typeof window.VineTrail === "undefined") return;
    if (vineTrailDestroy) {
      vineTrailDestroy();
      vineTrailDestroy = null;
    }
    if (html.getAttribute("data-theme") === "canvas") {
      const vineCanvas = document.getElementById("vine-trail");
      if (vineCanvas) {
        vineTrailDestroy = window.VineTrail.init(vineCanvas);
      }
    }
  }

  const bgGrid = document.getElementById("bg-grid");
  const cyberGridPull = document.getElementById("cyber-grid-pull");
  let cyberRaf = null;
  let cyberSmoothX = window.innerWidth * 0.5;
  let cyberSmoothY = window.innerHeight * 0.5;

  function applyCyberPointer(clientX, clientY) {
    cyberSmoothX += (clientX - cyberSmoothX) * 0.14;
    cyberSmoothY += (clientY - cyberSmoothY) * 0.14;
    html.style.setProperty("--cyber-mx", `${cyberSmoothX}px`);
    html.style.setProperty("--cyber-my", `${cyberSmoothY}px`);
    if (bgGrid) {
      bgGrid.style.backgroundPosition = `${cyberSmoothX * 0.018}px ${cyberSmoothY * 0.018}px`;
    }
    if (cyberGridPull) {
      cyberGridPull.style.backgroundPosition = `${-cyberSmoothX * 0.014}px ${-cyberSmoothY * 0.014}px`;
    }
  }

  function onCyberPointerMove(event) {
    if (cyberRaf !== null) return;
    cyberRaf = requestAnimationFrame(() => {
      cyberRaf = null;
      if (html.getAttribute("data-theme") !== "cyber") return;
      applyCyberPointer(event.clientX, event.clientY);
    });
  }

  function detachCyberGridTracking() {
    document.removeEventListener("mousemove", onCyberPointerMove);
    if (cyberRaf !== null) {
      cancelAnimationFrame(cyberRaf);
      cyberRaf = null;
    }
    html.style.removeProperty("--cyber-mx");
    html.style.removeProperty("--cyber-my");
    if (bgGrid) bgGrid.style.removeProperty("background-position");
    if (cyberGridPull) cyberGridPull.style.removeProperty("background-position");
  }

  function attachCyberGridTracking() {
    detachCyberGridTracking();
    cyberSmoothX = window.innerWidth * 0.5;
    cyberSmoothY = window.innerHeight * 0.5;
    applyCyberPointer(cyberSmoothX, cyberSmoothY);
    document.addEventListener("mousemove", onCyberPointerMove, { passive: true });
  }

  function syncCyberGrid() {
    if (html.getAttribute("data-theme") === "cyber") {
      attachCyberGridTracking();
    } else {
      detachCyberGridTracking();
    }
  }

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
      syncVineTrail();
      syncCyberGrid();
    });
  });

  syncVineTrail();
  syncCyberGrid();

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

  const devWidget = document.getElementById("dev-widget");
  const devToggle = document.getElementById("dev-widget-toggle");
  const devPanel = document.getElementById("dev-widget-panel");
  const devPanelClose = document.getElementById("dev-widget-panel-close");
  const devOpenModalBtn = document.getElementById("dev-widget-open-modal");

  function closeDevWidget() {
    if (!devWidget || !devPanel || !devToggle) return;
    devWidget.classList.remove("dev-widget--open");
    devToggle.setAttribute("aria-expanded", "false");
    devPanel.setAttribute("hidden", "");
  }

  function openDevWidget() {
    if (!devWidget || !devPanel || !devToggle) return;
    devWidget.classList.add("dev-widget--open");
    devToggle.setAttribute("aria-expanded", "true");
    devPanel.removeAttribute("hidden");
  }

  function toggleDevWidget() {
    if (devWidget?.classList.contains("dev-widget--open")) {
      closeDevWidget();
    } else {
      openDevWidget();
    }
  }

  devToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDevWidget();
  });

  devPanelClose?.addEventListener("click", () => {
    closeDevWidget();
  });

  devOpenModalBtn?.addEventListener("click", () => {
    closeDevWidget();
    openModal();
  });

  document.addEventListener("mousedown", (event) => {
    if (!devWidget?.classList.contains("dev-widget--open")) return;
    if (event.target.closest(".dev-widget")) return;
    closeDevWidget();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (modal && modal.classList.contains("active")) {
      closeModal();
      return;
    }
    if (devWidget?.classList.contains("dev-widget--open")) {
      closeDevWidget();
    }
  });

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
