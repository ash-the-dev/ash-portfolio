document.addEventListener("DOMContentLoaded", async () => {
  console.log("Ash portfolio loaded.");

  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  const username = "ash-the-dev";
  const statsContainer = document.getElementById("github-stats");
  const repoList = document.getElementById("repo-list");

  if (!statsContainer || !repoList) return;

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
        <h3>Public Repos Shown</h3>
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
});