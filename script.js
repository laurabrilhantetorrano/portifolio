/**
 * PORTFÓLIO: LAURA BRILHANTE TORRANO
 * JavaScript Puro sem frameworks
 * Funcionalidades:
 * 1. Controlador de Navegação entre Páginas Independentes (View Switcher com History API)
 * 2. Menu Mobile Responsivo com Acessibilidade
 * 3. Relógio em Tempo Real (Horário de Brasília)
 * 4. Alternador de Tema Escuro / Vibrante
 * 5. Validação do Formulário de Contato com Fallback Real (mailto + clipboard)
 * 6. Cursor Personalizado com Interpolação Suave (apenas em desktop)
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initMobileMenu();
  initLiveClock();
  initThemeToggle();
  initContactForm();
  initCustomCursor();
});

/* ==========================================================================
   1. CONTROLADOR DE NAVEGAÇÃO ENTRE PÁGINAS INDEPENDENTES
   Regra: Cada botão leva exclusivamente ao destino definido para ele.
   Apenas uma página é exibida por vez. Suporte total ao botão Voltar do navegador.
   ========================================================================== */
function initNavigation() {
  const pageViews = document.querySelectorAll('.page-view');
  const desktopLinks = document.querySelectorAll('.nav-menu .nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links .mobile-nav-link');
  const footerLinks = document.querySelectorAll('.footer-links a, .back-to-top-btn');

  // Mapeamento de rotas e aliases comuns
  const aliasMap = {
    '': 'hero',
    'inicio': 'hero',
    'home': 'hero',
    'hero': 'hero',
    'sobre': 'sobre',
    'projetos': 'projetos',
    'habilidades': 'habilidades',
    'contato': 'contato'
  };

  /**
   * Ativa a página alvo e oculta as demais
   * @param {string} rawTargetId - ID da página (ex: 'hero', 'sobre', 'projetos')
   * @param {boolean} pushHistory - Se deve gravar no histórico do navegador
   */
  function navigateTo(rawTargetId, pushHistory = true) {
    if (!rawTargetId) return;

    // Remove hash ou barras caso existam
    const cleanId = rawTargetId.replace(/^#\/?/, '').toLowerCase();
    const targetId = aliasMap[cleanId] || cleanId;

    const targetSection = document.getElementById(targetId);
    if (!targetSection || !targetSection.classList.contains('page-view')) {
      return;
    }

    // Oculta todas as páginas e exibe estritamente a página alvo
    pageViews.forEach(page => {
      if (page.id === targetId) {
        page.classList.add('is-active');
        page.removeAttribute('aria-hidden');
      } else {
        page.classList.remove('is-active');
        page.setAttribute('aria-hidden', 'true');
      }
    });

    // Atualiza links desktop
    desktopLinks.forEach(link => {
      const pageAttr = link.getAttribute('data-page');
      const href = link.getAttribute('href')?.replace(/^#/, '');
      if (pageAttr === targetId || href === targetId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // Atualiza links mobile
    mobileLinks.forEach(link => {
      const pageAttr = link.getAttribute('data-page');
      const href = link.getAttribute('href')?.replace(/^#/, '');
      if (pageAttr === targetId || href === targetId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Atualiza o histórico do navegador (suporte ao botão Voltar / Avançar)
    if (pushHistory) {
      const newHash = targetId === 'hero' ? '#inicio' : `#${targetId}`;
      if (window.location.hash !== newHash) {
        history.pushState({ pageId: targetId }, '', newHash);
      }
    }

    // Rola para o topo da página selecionada de forma consistente
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Captura cliques em qualquer elemento com data-page ou links com href="#..."
  document.addEventListener('click', (e) => {
    const navTrigger = e.target.closest('[data-page], a[href^="#"]');
    if (!navTrigger) return;

    // Se for link externo ou sem destino, não intercepta
    const dataPage = navTrigger.getAttribute('data-page');
    const href = navTrigger.getAttribute('href');

    const destination = dataPage || (href && href.startsWith('#') ? href.replace(/^#/, '') : null);

    if (destination && aliasMap.hasOwnProperty(destination)) {
      e.preventDefault();
      navigateTo(destination, true);

      // Se o menu mobile estiver aberto, fecha-o
      const mobileDrawer = document.getElementById('mobileNavDrawer');
      const mobileBtn = document.getElementById('mobileMenuBtn');
      if (mobileDrawer && mobileDrawer.classList.contains('is-open')) {
        mobileDrawer.classList.remove('is-open');
        if (mobileBtn) {
          mobileBtn.classList.remove('is-active');
          mobileBtn.setAttribute('aria-expanded', 'false');
        }
      }
    }
  });

  // Trata eventos de navegação do navegador (botão Voltar / Avançar)
  window.addEventListener('popstate', (e) => {
    const hash = window.location.hash.replace(/^#/, '');
    const pageId = e.state?.pageId || hash || 'hero';
    navigateTo(pageId, false);
  });

  // Trata link direto ao carregar a página (ex: /#projetos ou /#contato)
  const initialHash = window.location.hash.replace(/^#/, '');
  if (initialHash && aliasMap.hasOwnProperty(initialHash.toLowerCase())) {
    navigateTo(initialHash, false);
  } else {
    navigateTo('hero', false);
  }

  // Expõe a função para depuração no console se necessário
  window.navigateToPage = navigateTo;
}

/* ==========================================================================
   2. MENU MOBILE RESPONSIVO COM GAVETA
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  if (!toggleBtn || !drawer) return;

  function toggleMenu(forceOpen) {
    const isOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : !drawer.classList.contains('is-open');

    drawer.classList.toggle('is-open', isOpen);
    toggleBtn.classList.toggle('is-active', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    drawer.setAttribute('aria-hidden', String(!isOpen));
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Fecha ao clicar fora do menu
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('is-open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Fecha com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });
}

/* ==========================================================================
   3. RELÓGIO EM TEMPO REAL (HORÁRIO DE BRASÍLIA)
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds} BRT`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   4. ALTERNADOR DE TEMA ESCURO / VIBRANTE
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const htmlRoot = document.documentElement;

  // Carrega tema salvo ou padrão escuro
  const savedTheme = localStorage.getItem('lbt-theme') || 'dark';
  htmlRoot.setAttribute('data-theme', savedTheme);
  if (themeLabel) {
    themeLabel.textContent = savedTheme === 'dark' ? 'Modo Vibrante' : 'Modo Escuro';
  }

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const currentTheme = htmlRoot.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'brand' : 'dark';

    htmlRoot.setAttribute('data-theme', newTheme);
    localStorage.setItem('lbt-theme', newTheme);

    if (themeLabel) {
      themeLabel.textContent = newTheme === 'dark' ? 'Modo Vibrante' : 'Modo Escuro';
    }
  });
}

/* ==========================================================================
   5. FORMULÁRIO DE CONTATO COM VALIDAÇÃO REAL E FALLBACK HONESTO
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const subjectInput = document.getElementById('contactSubject');
  const messageInput = document.getElementById('contactMessage');

  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const subjectError = document.getElementById('subjectError');
  const messageError = document.getElementById('messageError');

  const feedbackBox = document.getElementById('formFeedbackBox');
  const copyBtn = document.getElementById('copyMessageBtn');
  const directMailto = document.getElementById('directMailtoTrigger');

  let lastGeneratedMessage = '';
  let lastMailtoUrl = '';

  function clearErrors() {
    [nameError, emailError, subjectError, messageError].forEach(el => {
      if (el) el.textContent = '';
    });
    [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
      if (input) input.classList.remove('is-invalid');
    });
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Remove o erro assim que o usuário começa a digitar
  [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const errSpan = document.getElementById(input.name + 'Error') ||
                        document.getElementById(input.id.replace('contact', '').toLowerCase() + 'Error');
        if (errSpan) errSpan.textContent = '';
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    let isValid = true;

    if (name.length < 2) {
      nameError.textContent = 'Por favor, informe seu nome completo.';
      nameInput.classList.add('is-invalid');
      isValid = false;
    }

    if (!validateEmail(email)) {
      emailError.textContent = 'Por favor, digite um e-mail válido (ex.: nome@dominio.com).';
      emailInput.classList.add('is-invalid');
      isValid = false;
    }

    if (subject.length < 3) {
      subjectError.textContent = 'Informe o assunto da mensagem.';
      subjectInput.classList.add('is-invalid');
      isValid = false;
    }

    if (message.length < 10) {
      messageError.textContent = 'A mensagem deve conter pelo menos 10 caracteres.';
      messageInput.classList.add('is-invalid');
      isValid = false;
    }

    if (!isValid) return;

    lastGeneratedMessage = `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${message}`;

    const recipient = '37241@raphaeldisanto.com.br';
    const emailSubject = `[Portfólio] ${subject}`;
    const emailBody = `Olá, Laura!\n\n${message}\n\n---\nEnviado por: ${name} (${email})\nOrigem: Portfólio Laura Brilhante Torrano`;

    lastMailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Tenta abrir o cliente padrão de e-mail do sistema
    window.location.href = lastMailtoUrl;

    // Exibe a caixa de feedback funcional
    if (feedbackBox) {
      feedbackBox.style.display = 'flex';
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (directMailto) {
      directMailto.setAttribute('href', lastMailtoUrl);
    }
  });

  // Copiar mensagem para área de transferência
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!lastGeneratedMessage) return;

      navigator.clipboard.writeText(lastGeneratedMessage).then(() => {
        const span = copyBtn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = '✓ Texto copiado!';
        setTimeout(() => {
          span.textContent = originalText;
        }, 2500);
      }).catch(() => {
        alert('Não foi possível copiar automaticamente. Selecione e copie os dados manualmente.');
      });
    });
  }
}

/* ==========================================================================
   6. CURSOR PERSONALIZADO COM FÍSICA SUAVE (LERP)
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (!cursor || !dot || !ring) return;

  // Se o dispositivo for touch, não executa
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    cursor.style.display = 'none';
    return;
  }

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function renderCursor() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Estados de hover em elementos interativos
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, textarea, .hero-word, .gothic-accent-tag, .project-card, .pillar-card')) {
      cursor.classList.add('is-hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, textarea, .hero-word, .gothic-accent-tag, .project-card, .pillar-card')) {
      cursor.classList.remove('is-hovering');
    }
  });

  window.addEventListener('mousedown', () => cursor.classList.add('is-clicking'));
  window.addEventListener('mouseup', () => cursor.classList.remove('is-clicking'));
}
