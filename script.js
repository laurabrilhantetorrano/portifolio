/**
 * PORTFÓLIO — LAURA BRILHANTE TORRANO
 * JavaScript puro, sem frameworks.
 *
 * 1. Portal: Céu noturno animado (canvas de estrelas) + botão de entrada
 * 2. Navegação entre páginas independentes
 * 3. Menu mobile responsivo
 * 4. Alternador de tema escuro / claro
 * 5. Formulário de contato com validação + fallback mailto
 * 6. Cursor personalizado suave
 */

document.addEventListener('DOMContentLoaded', () => {
  initNightSky();
  initNavigation();
  initMobileMenu();
  initThemeToggle();
  initContactForm();
  initCustomCursor();
});

/* ==========================================================================
   1. PORTAL — CÉU NOTURNO ANIMADO
   O nome já aparece diretamente. O canvas só anima as estrelas de fundo.
   ========================================================================== */
function initNightSky() {
  const portal      = document.getElementById('nightSkyPortal');
  const canvas      = document.getElementById('nightSkyCanvas');
  const enterBtn    = document.getElementById('revealedEnterBtn');
  const returnBtn   = document.getElementById('portalReturnBtn');
  const footerBtn   = document.getElementById('footerSkyBtn');

  if (!portal || !canvas) return;

  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const stars = [];
  let animFrame;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    generateStars();
  }

  function generateStars() {
    stars.length = 0;
    const count = Math.floor(Math.max(80, Math.min(180, (W * H) / 9000)));
    const palette = ['#FFFFFF', '#FFF4D6', '#EAF0FF', '#FFE4EE', '#D4E8FF'];

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.5,
        baseAlpha: Math.random() * 0.55 + 0.2,
        speed: Math.random() * 1.6 + 0.7,
        phase: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
        hasRays: Math.random() > 0.85,
      });
    }
  }

  function render(now) {
    ctx.clearRect(0, 0, W, H);
    const t = now * 0.001;

    for (const s of stars) {
      const alpha = Math.max(0.08, Math.min(1,
        s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.22
      ));
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (s.hasRays && alpha > 0.55) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 2.5, s.y);
        ctx.lineTo(s.x + s.r * 2.5, s.y);
        ctx.moveTo(s.x, s.y - s.r * 2.5);
        ctx.lineTo(s.x, s.y + s.r * 2.5);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    animFrame = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animFrame = requestAnimationFrame(render);

  // Entrar no portfólio
  function openPortfolio() {
    document.body.classList.add('portal-opened');
    cancelAnimationFrame(animFrame); // Para o loop quando não visível
  }

  // Voltar ao portal
  function closePortfolio() {
    document.body.classList.remove('portal-opened');
    animFrame = requestAnimationFrame(render);
    window.scrollTo({ top: 0 });
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPortfolio();
    });
  }

  if (returnBtn) {
    returnBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closePortfolio();
    });
  }

  if (footerBtn) {
    footerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closePortfolio();
    });
  }
}

/* ==========================================================================
   2. NAVEGAÇÃO ENTRE PÁGINAS
   ========================================================================== */
function initNavigation() {
  const pageViews    = Array.from(document.querySelectorAll('.page-view'));
  const desktopLinks = Array.from(document.querySelectorAll('.nav-link'));
  const mobileLinks  = Array.from(document.querySelectorAll('.mobile-nav-link'));
  const footerLinks  = Array.from(document.querySelectorAll('.footer-links a[data-page]'));

  const aliasMap = {
    '':            'hero',
    'inicio':      'hero',
    'hero':        'hero',
    'sobre':       'sobre',
    'projetos':    'projetos',
    'habilidades': 'habilidades',
    'contato':     'contato',
  };

  function navigateTo(rawId, pushHistory = true) {
    if (!rawId) return;
    const cleanId  = rawId.replace(/^#\/?/, '').toLowerCase().trim();
    const targetId = aliasMap[cleanId] || cleanId;
    const target   = document.getElementById(targetId);

    if (!target || !target.classList.contains('page-view')) return;

    // Ativa/desativa páginas
    pageViews.forEach(page => {
      const active = page.id === targetId;
      page.classList.toggle('is-active', active);
      page.setAttribute('aria-hidden', String(!active));
    });

    // Atualiza links de navegação
    const allNavLinks = [...desktopLinks, ...mobileLinks, ...footerLinks];
    allNavLinks.forEach(link => {
      const lp   = link.getAttribute('data-page');
      const lh   = (link.getAttribute('href') || '').replace(/^#/, '');
      const isActive = lp === targetId || lh === targetId;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else          link.removeAttribute('aria-current');
    });

    // Histórico
    if (pushHistory) {
      const hash = targetId === 'hero' ? '#inicio' : `#${targetId}`;
      if (window.location.hash !== hash) {
        history.pushState({ pageId: targetId }, '', hash);
      }
    }

    window.scrollTo({ top: 0 });
  }

  // Delegação de cliques
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-page], a[href^="#"]');
    if (!trigger) return;

    const dp  = trigger.getAttribute('data-page');
    const href = trigger.getAttribute('href');
    const dest = dp || (href && href.startsWith('#') ? href.replace(/^#/, '') : null);

    if (dest && Object.prototype.hasOwnProperty.call(aliasMap, dest.toLowerCase())) {
      e.preventDefault();
      navigateTo(dest, true);

      // Fecha menu mobile se aberto
      const drawer = document.getElementById('mobileNavDrawer');
      const btn    = document.getElementById('mobileMenuBtn');
      if (drawer && drawer.classList.contains('is-open')) {
        drawer.classList.remove('is-open');
        if (btn) {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-expanded', 'false');
        }
        drawer.setAttribute('aria-hidden', 'true');
      }
    }
  });

  // Botão Voltar / Avançar do browser
  window.addEventListener('popstate', (e) => {
    const hash   = window.location.hash.replace(/^#/, '');
    const pageId = (e.state && e.state.pageId) || hash || 'hero';
    navigateTo(pageId, false);
  });

  // Hash na URL ao carregar
  const initHash = window.location.hash.replace(/^#/, '').toLowerCase();
  navigateTo(initHash || 'hero', false);

  // Expõe globalmente para debug
  window.navigateToPage = navigateTo;
}

/* ==========================================================================
   3. MENU MOBILE
   ========================================================================== */
function initMobileMenu() {
  const btn    = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  if (!btn || !drawer) return;

  function toggle(forceOpen) {
    const open = typeof forceOpen === 'boolean'
      ? forceOpen
      : !drawer.classList.contains('is-open');

    drawer.classList.toggle('is-open', open);
    btn.classList.toggle('is-active', open);
    btn.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
  }

  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

  document.addEventListener('click', (e) => {
    if (
      drawer.classList.contains('is-open') &&
      !drawer.contains(e.target) &&
      !btn.contains(e.target)
    ) toggle(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggle(false);
      btn.focus();
    }
  });
}

/* ==========================================================================
   4. ALTERNADOR DE TEMA
   ========================================================================== */
function initThemeToggle() {
  const btn   = document.getElementById('themeToggleBtn');
  const label = document.getElementById('themeLabel');
  const root  = document.documentElement;

  const saved = localStorage.getItem('lbt-theme') || 'dark';
  root.setAttribute('data-theme', saved);
  if (label) label.textContent = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';

  if (!btn) return;

  btn.addEventListener('click', () => {
    const cur  = root.getAttribute('data-theme');
    const next = cur === 'dark' ? 'brand' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('lbt-theme', next);
    if (label) label.textContent = next === 'dark' ? 'Modo Claro' : 'Modo Escuro';
  });
}

/* ==========================================================================
   5. FORMULÁRIO DE CONTATO
   ========================================================================== */
function initContactForm() {
  const form    = document.getElementById('contactForm');
  if (!form) return;

  const nameEl    = document.getElementById('contactName');
  const emailEl   = document.getElementById('contactEmail');
  const subjectEl = document.getElementById('contactSubject');
  const msgEl     = document.getElementById('contactMessage');

  const nameErr    = document.getElementById('nameError');
  const emailErr   = document.getElementById('emailError');
  const subjectErr = document.getElementById('subjectError');
  const msgErr     = document.getElementById('messageError');

  const feedbackBox  = document.getElementById('formFeedbackBox');
  const copyBtn      = document.getElementById('copyMessageBtn');
  const mailtoTrigger = document.getElementById('directMailtoTrigger');

  let lastMessage = '';
  let lastMailto  = '';

  // Limpa erros ao digitar
  [nameEl, emailEl, subjectEl, msgEl].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      const errId = {
        contactName:    'nameError',
        contactEmail:   'emailError',
        contactSubject: 'subjectError',
        contactMessage: 'messageError',
      }[input.id];
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = '';
    });
  });

  function clearErrors() {
    [nameErr, emailErr, subjectErr, msgErr].forEach(el => { if (el) el.textContent = ''; });
    [nameEl, emailEl, subjectEl, msgEl].forEach(el => { if (el) el.classList.remove('is-invalid'); });
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const name    = (nameEl?.value   || '').trim();
    const email   = (emailEl?.value  || '').trim();
    const subject = (subjectEl?.value || '').trim();
    const msg     = (msgEl?.value    || '').trim();
    let ok = true;

    if (name.length < 2) {
      if (nameErr) nameErr.textContent = 'Por favor, informe seu nome.';
      if (nameEl)  nameEl.classList.add('is-invalid');
      ok = false;
    }
    if (!validEmail(email)) {
      if (emailErr) emailErr.textContent = 'Digite um e-mail válido.';
      if (emailEl)  emailEl.classList.add('is-invalid');
      ok = false;
    }
    if (subject.length < 3) {
      if (subjectErr) subjectErr.textContent = 'Informe o assunto.';
      if (subjectEl)  subjectEl.classList.add('is-invalid');
      ok = false;
    }
    if (msg.length < 10) {
      if (msgErr) msgErr.textContent = 'A mensagem deve ter pelo menos 10 caracteres.';
      if (msgEl)  msgEl.classList.add('is-invalid');
      ok = false;
    }

    if (!ok) return;

    lastMessage = `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${msg}`;

    const recipient = '37241@raphaeldisanto.com.br';
    const subjectEncoded = encodeURIComponent(`[Portfólio] ${subject}`);
    const bodyEncoded    = encodeURIComponent(
      `Olá, Laura!\n\n${msg}\n\n---\nEnviado por: ${name} (${email})\nOrigem: Portfólio Laura Brilhante Torrano`
    );
    lastMailto = `mailto:${recipient}?subject=${subjectEncoded}&body=${bodyEncoded}`;

    window.location.href = lastMailto;

    if (feedbackBox) {
      feedbackBox.style.display = 'flex';
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (mailtoTrigger) mailtoTrigger.setAttribute('href', lastMailto);
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!lastMessage) return;
      navigator.clipboard.writeText(lastMessage).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = '✓ Copiado!';
        setTimeout(() => { copyBtn.textContent = orig; }, 2500);
      }).catch(() => {
        alert('Não foi possível copiar. Selecione e copie manualmente.');
      });
    });
  }
}

/* ==========================================================================
   6. CURSOR PERSONALIZADO
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const dot    = document.getElementById('cursorDot');
  const ring   = document.getElementById('cursorRing');

  if (!cursor || !dot || !ring) return;

  // Desativa em dispositivos touch
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    cursor.style.display = 'none';
    return;
  }

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  function animateRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animateRing);
  }
  requestAnimationFrame(animateRing);

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, textarea, .project-entry, .btn-text-link')) {
      cursor.classList.add('is-hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, textarea, .project-entry, .btn-text-link')) {
      cursor.classList.remove('is-hovering');
    }
  });

  window.addEventListener('mousedown', () => cursor.classList.add('is-clicking'));
  window.addEventListener('mouseup',   () => cursor.classList.remove('is-clicking'));
}
