(() => {
  const entry = document.getElementById('entry');
  const desktop = document.getElementById('desktop');
  const enterButton = document.getElementById('enter-site');
  const main = document.getElementById('content');
  const panels = [...document.querySelectorAll('[data-panel]')];
  const navLinks = [...document.querySelectorAll('[data-route]')];
  const carousels = new Map();
  const aliases = { intro: 'about', work: 'projects', method: 'resources', experience: 'about' };
  const validRoutes = new Set(panels.map(panel => panel.dataset.panel));
  const initialHash = window.location.hash.slice(1);
  const hasDirectSection = validRoutes.has(aliases[initialHash] || initialHash);

  const routeFromHash = () => {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    const route = aliases[raw] || raw;
    return validRoutes.has(route) ? route : 'about';
  };

  function showRoute() {
    const route = routeFromHash();
    panels.forEach(panel => { panel.hidden = panel.dataset.panel !== route; });
    navLinks.forEach(link => {
      if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    main.scrollTop = 0;
    if (window.innerWidth <= 760) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function showDesktop({ focus = false } = {}) {
    entry.hidden = true;
    desktop.hidden = false;
    try { sessionStorage.setItem('mn-os-entered', '1'); } catch (_) { /* storage may be unavailable */ }
    showRoute();
    if (focus) document.querySelector(`[data-panel="${routeFromHash()}"] h1`)?.focus({ preventScroll: true });
  }

  enterButton.addEventListener('click', () => showDesktop());
  document.addEventListener('keydown', event => {
    if (!entry.hidden && event.key === 'Enter' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      showDesktop();
      return;
    }
    if (desktop.hidden || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    const activeCarousel = carousels.get(routeFromHash());
    if (!activeCarousel) return;
    event.preventDefault();
    activeCarousel.step(event.key === 'ArrowRight' ? 1 : -1);
  });
  window.addEventListener('hashchange', () => {
    if (!entry.hidden) showDesktop();
    else showRoute();
  });
  try {
    if (hasDirectSection || sessionStorage.getItem('mn-os-entered') === '1') showDesktop();
  } catch (_) {
    if (hasDirectSection) showDesktop();
  }
  document.getElementById('year').textContent = new Date().getFullYear();

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function makeCard(item, index, total, type) {
    const card = node('a', 'showcase-card' + (type === 'article' ? ' article-card' : ''));
    card.href = item.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.draggable = false;
    card.dataset.cardIndex = String(index);
    card.setAttribute('aria-label', `${item.title}，打开${type === 'article' ? '公众号原文' : '公开仓库'}`);

    if (type === 'article') {
      const cover = node('div', item.image ? 'article-cover illustrated-cover' : `article-cover tone-${(index + 1) % 6}`);
      if (item.image) {
        const image = node('img', 'article-cover-image');
        if (index < 2) image.src = item.image;
        else image.dataset.src = item.image;
        image.alt = item.imageAlt || `${item.title}文章封面`;
        image.loading = index < 2 ? 'eager' : 'lazy';
        cover.append(image);
        if (item.coverTitle) {
          const copy = node('div', 'article-cover-copy');
          copy.setAttribute('aria-hidden', 'true');
          copy.append(node('strong', '', item.coverTitle));
          if (item.coverSubtitle) copy.append(node('span', '', item.coverSubtitle));
          cover.append(copy);
        }
      } else {
        cover.append(node('span', 'cover-top', 'MN / PUBLIC WRITING'), node('span', 'cover-symbol', 'AI'), node('span', 'cover-bottom', `ARTICLE ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`));
      }
      card.append(cover);
    } else {
      const cover = node('div', 'card-cover');
      const image = node('img');
      image.src = item.image;
      image.alt = `${item.title}项目展示图`;
      image.draggable = false;
      image.loading = index < 2 ? 'eager' : 'lazy';
      cover.append(image);
      card.append(cover);
    }

    const body = node('div', 'card-body');
    const topLine = node('div', 'card-topline');
    topLine.append(node('span', 'card-index', `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`), node('span', 'card-category', type === 'article' ? '公众号文章' : item.category));
    body.append(topLine, node('h3', '', item.title));
    if (type !== 'article') body.append(node('p', '', item.description));
    if (item.credit) body.append(node('div', 'card-credit', item.credit));
    body.append(node('span', 'card-action', type === 'article' ? '打开原文 ↗' : '查看公开仓库 ↗'));
    card.append(body);
    return card;
  }

  function initCarousel(route, items, mountId, type) {
    const root = document.querySelector(`[data-carousel="${route}"]`);
    const mount = document.getElementById(mountId);
    if (!root || !mount || !items.length) return;
    const cards = items.map((item, index) => makeCard(item, index, items.length, type));
    mount.replaceChildren(...cards);
    const counter = root.querySelector('.carousel-count');
    const progress = root.querySelector('.carousel-progress span');
    let current = 0;

    function update() {
      cards.forEach((card, index) => {
        let offset = index - current;
        if (offset > items.length / 2) offset -= items.length;
        if (offset < -items.length / 2) offset += items.length;
        if (type === 'article' && Math.abs(offset) <= 1) {
          const image = card.querySelector('img[data-src]');
          if (image) {
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
          }
        }
        card.dataset.offset = Math.abs(offset) <= 2 ? String(offset) : 'far';
        card.tabIndex = offset === 0 ? 0 : -1;
        card.setAttribute('aria-hidden', offset === 0 ? 'false' : 'true');
      });
      counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      progress.style.width = `${((current + 1) / items.length) * 100}%`;
    }
    function goTo(index) {
      const cardHadFocus = cards.includes(document.activeElement);
      current = (index + items.length) % items.length;
      update();
      if (cardHadFocus) cards[current].focus({ preventScroll: true });
    }
    function step(delta) { goTo(current + delta); }
    root.querySelector('.carousel-prev').addEventListener('click', () => step(-1));
    root.querySelector('.carousel-next').addEventListener('click', () => step(1));
    cards.forEach((card, index) => card.addEventListener('click', event => {
      if (index !== current) { event.preventDefault(); goTo(index); }
    }));

    const windowElement = root.querySelector('.carousel-window');
    let dragStart = null;
    let suppressClick = false;
    windowElement.addEventListener('pointerdown', event => {
      dragStart = { x: event.clientX, y: event.clientY };
      windowElement.setPointerCapture?.(event.pointerId);
    });
    windowElement.addEventListener('pointermove', event => {
      if (dragStart && Math.abs(event.clientX - dragStart.x) > 10) windowElement.classList.add('is-dragging');
    });
    window.addEventListener('pointerup', event => {
      if (!dragStart) return;
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        suppressClick = true;
        step(deltaX < 0 ? 1 : -1);
        setTimeout(() => { suppressClick = false; }, 100);
      }
      dragStart = null;
      windowElement.classList.remove('is-dragging');
    });
    windowElement.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    carousels.set(route, { step, goTo });
    update();
  }

  fetch('content.json?v=20261024-14covers')
    .then(response => { if (!response.ok) throw new Error(`Content HTTP ${response.status}`); return response.json(); })
    .then(content => {
      initCarousel('projects', content.projects, 'project-cards', 'project');
      initCarousel('resources', content.resources, 'resource-cards', 'resource');
      initCarousel('writing', content.articles, 'article-cards', 'article');
    })
    .catch(() => {
      ['project-cards', 'resource-cards', 'article-cards'].forEach(id => {
        const mount = document.getElementById(id);
        mount.append(node('p', 'load-error', '内容暂时无法加载，请通过页面下方的公开仓库或文章归档访问。'));
      });
    });
})();
