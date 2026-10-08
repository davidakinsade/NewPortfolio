// ── Config ──────────────────────────────────────────────
  const GITHUB_USERNAME = "davidakinsade"; // change this if your GitHub handle differs
  const MAX_REPOS = 6;
  const EXCLUDED_REPOS = ["myportfolio", "lungdataset", "newportfolio"]; // lowercase repo names to hide from the Projects section

  // Custom modal content, keyed by lowercase repo name.
  // - description: overrides GitHub's own repo description in the modal.
  // - image: path to an image in your images/ folder. Overrides the auto GitHub preview image.
  const PROJECT_OVERRIDES = {
    "finalyearprojectapplication": {
      description: "An Android application that screens chest X-rays for signs of illness, built as my final year project. The core is a convolutional neural network trained on labelled X-ray images, split into training, validation, and test sets to keep the model honest and avoid overfitting. Using image classification, it distinguishes healthy scans from those showing signs of COVID-19 or tuberculosis. The trained model was integrated into a mobile app built in Android Studio, with Python used for the machine learning side, giving users a simple way to submit an X-ray and get a prediction back.",
      image: "images/final-year-project.png"
    }
  };

  const LANG_COLORS = {
    "JavaScript": "#f1e05a", "TypeScript": "#3178c6", "C#": "#178600",
    "HTML": "#e34c26", "CSS": "#563d7c", "Python": "#3572A5",
    "Java": "#b07219", "PHP": "#4F5D95", "Shell": "#89e051"
  };

  async function loadRepos(){
    const stateEl = document.getElementById('proj-state');
    const gridEl = document.getElementById('proj-grid');
    try{
      const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
      if(!res.ok) throw new Error(`GitHub API responded ${res.status}`);
      const repos = await res.json();

      const filtered = repos
        .filter(r => !r.fork && !r.archived && !EXCLUDED_REPOS.includes(r.name.toLowerCase()))
        .sort((a,b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, MAX_REPOS);

      if(filtered.length === 0){
        stateEl.textContent = "No public repositories to show yet — check back soon.";
        return;
      }

      currentRepos = filtered;
      stateEl.remove();
      gridEl.innerHTML = filtered.map((r, i) => `
        <button type="button" class="proj-card" data-index="${i}" aria-haspopup="dialog">
          <div class="proj-name">${r.name}</div>
          <div class="proj-desc">${r.description ? escapeHtml(r.description) : 'No description provided.'}</div>
          <div class="proj-meta">
            ${r.language ? `<span><span class="lang-dot" style="background:${LANG_COLORS[r.language] || '#999'}"></span>${r.language}</span>` : ''}
            <span>★ ${r.stargazers_count}</span>
          </div>
        </button>
      `).join('');
    }catch(err){
      stateEl.textContent = "Couldn't load projects from GitHub right now — visit the GitHub profile directly.";
      stateEl.classList.add('err');
      console.error(err);
    }
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadRepos();

  // ── Project detail modal ────────────────────────────────
  let currentRepos = [];
  let lastFocusedEl = null;

  function initProjectModal(){
    const grid = document.getElementById('proj-grid');
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const card = document.getElementById('modal-card');
    if(!grid || !overlay) return;

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.proj-card');
      if(!btn) return;
      const repo = currentRepos[Number(btn.dataset.index)];
      if(repo) openModal(repo, btn);
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });

    function openModal(repo, triggerEl){
      lastFocusedEl = triggerEl;
      const override = PROJECT_OVERRIDES[repo.name.toLowerCase()];
      document.getElementById('modal-image').src = (override && override.image) || `https://opengraph.githubassets.com/1/${repo.full_name}`;
      document.getElementById('modal-image').alt = `Preview of ${repo.name} repository`;
      document.getElementById('modal-title').textContent = repo.name;
      document.getElementById('modal-desc').textContent = (override && override.description) || repo.description || 'No description provided for this project yet.';
      document.getElementById('modal-meta').innerHTML = `
        ${repo.language ? `<span><span class="lang-dot" style="background:${LANG_COLORS[repo.language] || '#999'}"></span>${repo.language}</span>` : ''}
        <span>★ ${repo.stargazers_count}</span>
      `;
      document.getElementById('modal-link').href = repo.html_url;

      overlay.classList.add('is-open');
      overlay.removeAttribute('hidden');
      closeBtn.focus();
    }

    function closeModal(){
      overlay.classList.remove('is-open');
      setTimeout(() => overlay.setAttribute('hidden', ''), 200);
      if(lastFocusedEl) lastFocusedEl.focus();
    }
  }

  initProjectModal();

  // ── Scroll reveal ───────────────────────────────────────
  function initScrollReveal(){
    const targets = document.querySelectorAll('section#about, section#experience .commit, section#education, section#skills, section#projects, section#beyond, footer.site');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    targets.forEach(el => el.classList.add('reveal'));

    if(prefersReducedMotion || !('IntersectionObserver' in window)){
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(el => observer.observe(el));
  }

  initScrollReveal();

  // ── Hero entrance (type-in + staggered fade) ────────────
  function initHeroEntrance(){
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const eyebrow = document.querySelector('.hero .eyebrow');
    const name = document.querySelector('.hero .name');
    const roleWrap = document.querySelector('.hero .role');
    const roleTextEl = document.getElementById('role-text');
    const bio = document.querySelector('.hero .bio');
    const chipset = document.querySelector('.hero .chipset');
    const ctaRow = document.querySelector('.hero .cta-row');
    const logo = document.getElementById('hero-logo-img');
    const heroEls = [eyebrow, name, roleWrap, bio, chipset, ctaRow].filter(Boolean);
    const fullRoleText = roleTextEl ? roleTextEl.textContent.trim() : '';

    heroEls.forEach(el => el.classList.add('reveal'));
    if(logo) logo.classList.add('reveal-wipe');

    if(prefersReducedMotion || !roleTextEl){
      heroEls.forEach(el => el.classList.add('is-visible'));
      if(logo) logo.classList.add('is-visible');
      return;
    }

    roleTextEl.textContent = '';
    const revealAfter = (el, delay) => setTimeout(() => el && el.classList.add('is-visible'), delay);

    revealAfter(eyebrow, 100);
    revealAfter(name, 280);
    revealAfter(logo, 280);
    revealAfter(roleWrap, 480);

    setTimeout(() => {
      let i = 0;
      (function type(){
        if(i <= fullRoleText.length){
          roleTextEl.textContent = fullRoleText.slice(0, i);
          i++;
          setTimeout(type, 38);
        }else{
          revealAfter(bio, 150);
          revealAfter(chipset, 350);
          revealAfter(ctaRow, 500);
        }
      })();
    }, 480);
  }

  initHeroEntrance();
