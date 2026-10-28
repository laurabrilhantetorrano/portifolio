/**
 * PORTFÓLIO — LAURA BRILHANTE TORRANO
 * JavaScript puro, sem frameworks.
 *
 * 0. Fundo: Céu estrelado contínuo com respeito ao tema claro/escuro
 * 1. Portal: Entrada no portfólio e retorno ao céu
 * 2. Navegação entre páginas independentes e histórico de rotas
 * 3. Menu mobile responsivo e acessível
 * 4. Alternador de tema escuro / claro
 * 5. Formulário de contato com validação e feedback acessível
 * 6. Cursor personalizado não invasivo
 */

document.addEventListener('DOMContentLoaded', () => {
  initBgStars();
  initNightSky();
  initNavigation();
  initMobileMenu();
  initThemeToggle();
  initContactForm();
  initCustomCursor();
});

/* ==========================================================================
   0. CÉU ESTRELADO FIXO — FUNDO CONTÍNUO
   O canvas utiliza clearRect permitindo que a cor de fundo do tema
   (escuro ou claro) seja exibida via CSS com total fidelidade.
   ========================================================================== */
function initBgStars() {
  const canvas = document.getElementById('bgStarsCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const stars = [];

  const darkPalette = [
    'rgba(255, 255, 255,',
    'rgba(235, 243, 255,',
    'rgba(215, 230, 255,',
    'rgba(255, 245, 225,',
    'rgba(197, 160, 89,',
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    buildStars();
  }

  function buildStars() {
    stars.length = 0;
    const count = Math.floor(Math.max(50, Math.min(140, (W * H) / 9000)));

    for (let i = 0; i < count; i++) {
      const yRand = Math.pow(Math.random(), 0.7);
      stars.push({
        x:         Math.random() * W,
        y:         yRand * H,
        r:         Math.random() * 1.1 + 0.35,
        color:     darkPalette[Math.floor(Math.random() * darkPalette.length)],
        baseAlpha: Math.random() * 0.4 + 0.15,
        amp:       Math.random() * 0.16 + 0.04,
        speed:     Math.random() * 0.8 + 0.3,
        phase:     Math.random() * Math.PI * 2,
        hasCross:  Math.random() > 0.9,
      });
    }
  }

  function drawFrame(now) {
    const t = now * 0.001;
    const isLight = document.documentElement.getAttribute('data-theme') === 'brand';

    ctx.clearRect(0, 0, W, H);

    // No tema claro, exibe partículas sutis com opacidade reduzida
    // No tema escuro, renderiza as estrelas cintilantes
    for (const s of stars) {
      let alpha = Math.min(1, s.baseAlpha + Math.sin(t * s.speed + s.phase) * s.amp);

      if (isLight) {
        alpha = alpha * 0.25;
        ctx.fillStyle = `rgba(15, 23, 42, ${alpha.toFixed(2)})`;
      } else {
        ctx.fillStyle = s.color + alpha.toFixed(2) + ')';
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, isLight ? s.r * 0.8 : s.r, 0, Math.PI * 2);
      ctx.fill();

      // Raios delicados para estrelas principais em tema escuro
      if (!isLight && s.hasCross && s.r > 0.85 && alpha > 0.4) {
        ctx.strokeStyle = s.color + (alpha * 0.3).toFixed(2) + ')';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 2.5, s.y);
        ctx.lineTo(s.x + s.r * 2.5, s.y);
        ctx.moveTo(s.x, s.y - s.r * 2.5);
        ctx.lineTo(s.x, s.y + s.r * 2.5);
        ctx.stroke();
      }
    }

    requestAnimationFrame(drawFrame);
  }

  resize();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  requestAnimationFrame(drawFrame);
}

/* ==========================================================================
   1. PORTAL — ENTRADA NO PORTFÓLIO E RETORNO
   ========================================================================== */
function initNightSky() {
  const portal    = document.getElementById('nightSkyPortal');
  const enterBtn  = document.getElementById('revealedEnterBtn');
  const returnBtn = document.getElementById('portalReturnBtn');
  const footerBtn = document.getElementById('footerSkyBtn');

  if (!portal) return;

  function openPortfolio() {
    document.body.classList.add('portal-opened');
  }

  function closePortfolio() {
    document.body.classList.remove('portal-opened');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Se a URL já tiver uma âncora/página específica, abre direto
  const initialHash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (initialHash && ['hero', 'inicio', 'sobre', 'projetos', 'habilidades', 'contato'].includes(initialHash)) {
    openPortfolio();
  }
}

/* ==========================================================================
   2. NAVEGAÇÃO ENTRE PÁGINAS INDEPENDENTES
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

    // Garante que o portfólio esteja aberto ao navegar
    document.body.classList.add('portal-opened');

    // Alterna página ativa
    pageViews.forEach(page => {
      const active = page.id === targetId;
      page.classList.toggle('is-active', active);
      page.setAttribute('aria-hidden', String(!active));
    });

    // Atualiza estados dos links
    const allNavLinks = [...desktopLinks, ...mobileLinks, ...footerLinks];
    allNavLinks.forEach(link => {
      const lp = link.getAttribute('data-page');
      const lh = (link.getAttribute('href') || '').replace(/^#/, '');
      const isActive = lp === targetId || lh === targetId;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Histórico de navegação
    if (pushHistory) {
      const hash = targetId === 'hero' ? '#inicio' : `#${targetId}`;
      if (window.location.hash !== hash) {
        history.pushState({ pageId: targetId }, '', hash);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Delegação de cliques para links internos e botões
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-page], a[href^="#"]');
    if (!trigger) return;

    // Se for o botão de retorno ao céu, deixa o handler específico cuidar
    if (trigger.id === 'portalReturnBtn' || trigger.id === 'footerSkyBtn') return;

    const dp   = trigger.getAttribute('data-page');
    const href = trigger.getAttribute('href');
    const dest = dp || (href && href.startsWith('#') ? href.replace(/^#/, '') : null);

    if (dest && Object.prototype.hasOwnProperty.call(aliasMap, dest.toLowerCase())) {
      e.preventDefault();
      navigateTo(dest, true);

      // Fecha gaveta mobile se estiver aberta
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

  // Botões Avançar / Voltar do navegador
  window.addEventListener('popstate', (e) => {
    const hash   = window.location.hash.replace(/^#/, '');
    const pageId = (e.state && e.state.pageId) || hash || 'hero';
    navigateTo(pageId, false);
  });

  // Carregamento inicial com âncora
  const initHash = window.location.hash.replace(/^#/, '').toLowerCase();
  if (initHash && aliasMap[initHash]) {
    navigateTo(initHash, false);
  }

  window.navigateToPage = navigateTo;
}

/* ==========================================================================
   3. MENU MOBILE COM ACESSIBILIDADE
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

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', (e) => {
    if (
      drawer.classList.contains('is-open') &&
      !drawer.contains(e.target) &&
      !btn.contains(e.target)
    ) {
      toggle(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggle(false);
      btn.focus();
    }
  });
}

/* ==========================================================================
   4. ALTERNADOR DE TEMA ESCURO / CLARO
   ========================================================================== */
function initThemeToggle() {
  const btn   = document.getElementById('themeToggleBtn');
  const label = document.getElementById('themeLabel');
  const root  = document.documentElement;

  const savedTheme = localStorage.getItem('lbt-theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);
  if (label) {
    label.textContent = savedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
  }

  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const nextTheme = current === 'dark' ? 'brand' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem('lbt-theme', nextTheme);
    if (label) {
      label.textContent = nextTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    }
  });
}

/* ==========================================================================
   5. FORMULÁRIO DE CONTATO COM VALIDAÇÃO E FEEDBACK
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

  const submitBtn   = document.getElementById('submitContactBtn');
  const submitText  = document.getElementById('submitBtnText');
  const feedbackBox = document.getElementById('formFeedbackBox');
  const copyBtn     = document.getElementById('copyMessageBtn');
  const mailtoLink  = document.getElementById('directMailtoTrigger');

  let lastMessage = '';
  let lastMailto  = '';

  // Limpa estados de erro em tempo real ao digitar
  [nameEl, emailEl, subjectEl, msgEl].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      const errMap = {
        contactName:    nameErr,
        contactEmail:   emailErr,
        contactSubject: subjectErr,
        contactMessage: msgErr,
      };
      const targetErr = errMap[input.id];
      if (targetErr) targetErr.textContent = '';
    });
  });

  function clearErrors() {
    [nameErr, emailErr, subjectErr, msgErr].forEach(el => {
      if (el) el.textContent = '';
    });
    [nameEl, emailEl, subjectEl, msgEl].forEach(el => {
      if (el) el.classList.remove('is-invalid');
    });
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const name    = (nameEl?.value   || '').trim();
    const email   = (emailEl?.value  || '').trim();
    const subject = (subjectEl?.value || '').trim();
    const msg     = (msgEl?.value    || '').trim();

    let isValid = true;
    let firstInvalidField = null;

    if (name.length < 2) {
      if (nameErr) nameErr.textContent = 'Por favor, informe seu nome completo ou como prefere ser chamado.';
      if (nameEl) {
        nameEl.classList.add('is-invalid');
        if (!firstInvalidField) firstInvalidField = nameEl;
      }
      isValid = false;
    }

    if (!isValidEmail(email)) {
      if (emailErr) emailErr.textContent = 'Informe um endereço de e-mail válido (exemplo: seuemail@dominio.com).';
      if (emailEl) {
        emailEl.classList.add('is-invalid');
        if (!firstInvalidField) firstInvalidField = emailEl;
      }
      isValid = false;
    }

    if (subject.length < 3) {
      if (subjectErr) subjectErr.textContent = 'Informe o assunto principal do seu contato.';
      if (subjectEl) {
        subjectEl.classList.add('is-invalid');
        if (!firstInvalidField) firstInvalidField = subjectEl;
      }
      isValid = false;
    }

    if (msg.length < 10) {
      if (msgErr) msgErr.textContent = 'Sua mensagem deve conter no mínimo 10 caracteres explicativos.';
      if (msgEl) {
        msgEl.classList.add('is-invalid');
        if (!firstInvalidField) firstInvalidField = msgEl;
      }
      isValid = false;
    }

    if (!isValid) {
      if (firstInvalidField) firstInvalidField.focus();
      return;
    }

    // Prevenção de cliques duplicados durante submissão
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Abrindo E-mail...';

    lastMessage = `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${msg}`;

    const recipient = '37241@raphaeldisanto.com.br';
    const encodedSubject = encodeURIComponent(`[Contato Portfólio] ${subject}`);
    const encodedBody = encodeURIComponent(
      `Olá, Laura!\n\n${msg}\n\n---\nRemetente: ${name} (${email})\nOrigem: Portfólio de Laura Brilhante Torrano`
    );
    lastMailto = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

    // Dispara acionamento do mailto
    window.location.href = lastMailto;

    // Exibe painel de confirmação acessível
    if (feedbackBox) {
      feedbackBox.style.display = 'flex';
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (mailtoLink) {
      mailtoLink.setAttribute('href', lastMailto);
    }

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Preparar no E-mail';
    }, 1800);
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!lastMessage) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lastMessage).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '✓ Texto copiado com sucesso!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2500);
        }).catch(() => {
          fallbackCopyText(lastMessage, copyBtn);
        });
      } else {
        fallbackCopyText(lastMessage, copyBtn);
      }
    });
  }

  function fallbackCopyText(text, button) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      const originalText = button.textContent;
      button.textContent = '✓ Texto copiado com sucesso!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2500);
    } catch {
      alert('Selecione e copie o texto manualmente.');
    }
    document.body.removeChild(tempInput);
  }
}

/* ==========================================================================
   6. CURSOR PERSONALIZADO (NÃO INVASIVO)
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const dot    = document.getElementById('cursorDot');
  const ring   = document.getElementById('cursorRing');

  if (!cursor || !dot || !ring) return;

  // Desativa completamente em dispositivos touch
  if (window.matchMedia('(hover: none) or (pointer: coarse)').matches) {
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
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animateRing);
  }
  requestAnimationFrame(animateRing);

  // Estados ao passar o mouse sobre itens interativos
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, textarea, .btn-text-link, .project-entry-link, .mini-action')) {
      cursor.classList.add('is-hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, textarea, .btn-text-link, .project-entry-link, .mini-action')) {
      cursor.classList.remove('is-hovering');
    }
  });

  window.addEventListener('mousedown', () => cursor.classList.add('is-clicking'));
  window.addEventListener('mouseup',   () => cursor.classList.remove('is-clicking'));
}
