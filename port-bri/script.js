/**
 * PORTFÓLIO: LAURA BRILHANTE TORRANO
 * JavaScript Puro sem frameworks
 * Funcionalidades: Navegação suave, menu mobile, status clock, validação de contato e suporte a rotas.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initMobileMenu();
  initScrollSpy();
  initSmoothScroll();
  initContactForm();
  initRouteHandler();
});

/* ==========================================================================
   1. Relógio em Tempo Real / Status (Horário de Brasília)
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
   2. Menu Mobile Responsivo (Gaveta / Toggle)
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

  // Fecha o menu ao clicar em qualquer link da gaveta
  const mobileLinks = drawer.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Fecha ao clicar fora da gaveta
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('is-open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Fecha ao pressionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });
}

/* ==========================================================================
   3. ScrollSpy: Destaque da Seção Ativa no Menu
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.nav-menu .nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links .mobile-nav-link');

  if (!sections.length || !desktopLinks.length) return;

  function highlightLink(sectionId) {
    desktopLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${sectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    mobileLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${sectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        highlightLink(entry.target.id);
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   4. Rolagem Suave com Compensação do Header Fixo
   ========================================================================== */
function initSmoothScroll() {
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  const header = document.getElementById('siteHeader');

  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = header ? header.offsetHeight + 16 : 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Atualiza a URL com o hash sem pular bruscamente
        if (history.pushState) {
          history.pushState(null, null, targetId);
        } else {
          location.hash = targetId;
        }
      }
    });
  });
}

/* ==========================================================================
   5. Suporte a Rotas Diretas e Atualização de Página (Evita 404 / Deslocamento)
   ========================================================================== */
function initRouteHandler() {
  const currentPath = window.location.pathname.replace(/\/$/, '').toLowerCase();
  const currentHash = window.location.hash.toLowerCase();

  // Mapeia rotas virtuais para os identificadores das seções
  const routeMap = {
    '/sobre': '#sobre',
    '/projetos': '#projetos',
    '/habilidades': '#habilidades',
    '/contato': '#contato',
    '/inicio': '#hero'
  };

  const targetSelector = routeMap[currentPath] || currentHash;

  if (targetSelector && targetSelector !== '#hero') {
    setTimeout(() => {
      const targetEl = document.querySelector(targetSelector);
      const header = document.getElementById('siteHeader');
      if (targetEl) {
        const headerOffset = header ? header.offsetHeight + 16 : 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 150);
  }
}

/* ==========================================================================
   6. Formulário de Contato com Validação Real e Fallback Honesto (Sem Envio Falso)
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

  // Limpa o erro individualmente ao digitar
  [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const errSpan = document.getElementById(input.id.replace('contact', '').toLowerCase() + 'Error') ||
                        document.getElementById(input.name + 'Error');
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
      emailError.textContent = 'Por favor, digite um e-mail válido (ex: nome@dominio.com).';
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

    // Constrói o corpo formatado com os dados reais informados pelo visitante
    lastGeneratedMessage = `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${message}`;

    const recipient = '37241@raphaeldisanto.com.br';
    const emailSubject = `[Portfólio] ${subject}`;
    const emailBody = `Olá, Laura!\n\n${message}\n\n---\nEnviado por: ${name} (${email})\nOrigem: Portfólio Laura Brilhante Torrano`;

    lastMailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Tenta abrir o cliente padrão de e-mail do sistema
    window.location.href = lastMailtoUrl;

    // Apresenta a caixa de feedback funcional
    if (feedbackBox) {
      feedbackBox.style.display = 'flex';
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (directMailto) {
      directMailto.setAttribute('href', lastMailtoUrl);
    }
  });

  // Botão para copiar o texto da mensagem caso o leitor de e-mail não abra
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!lastGeneratedMessage) return;

      navigator.clipboard.writeText(lastGeneratedMessage).then(() => {
        const originalText = copyBtn.querySelector('span').textContent;
        copyBtn.querySelector('span').textContent = '✓ Texto copiado!';
        setTimeout(() => {
          copyBtn.querySelector('span').textContent = originalText;
        }, 2500);
      }).catch(() => {
        alert('Não foi possível copiar automaticamente. Selecione os campos e copie manualmente.');
      });
    });
  }
}
