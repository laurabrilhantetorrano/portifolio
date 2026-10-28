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
  initNightSkyStarDraw();
  initNavigation();
  initMobileMenu();
  initLiveClock();
  initThemeToggle();
  initContactForm();
  initCustomCursor();
});

/* ==========================================================================
   0. TELA INICIAL: CÉU NOTURNO & DESENHO INTERATIVO DA ESTRELA
   Regra principal: Nenhuma outra área é visível até que o usuário desenhe
   uma estrela de cinco pontas com 100% de reconhecimento no céu estrelado.
   ========================================================================== */
function initNightSkyStarDraw() {
  const portal = document.getElementById('nightSkyPortal');
  const canvas = document.getElementById('nightSkyCanvas');
  const instructionBox = document.getElementById('skyInstructionBox');
  const progressHud = document.getElementById('skyProgressHud');
  const progressVal = document.getElementById('skyProgressVal');
  const revealedContainer = document.getElementById('skyRevealedContainer');
  const enterBtn = document.getElementById('revealedEnterBtn');
  const resetBtn = document.getElementById('skyResetBtn');
  const returnBtn = document.getElementById('portalReturnBtn');

  if (!portal || !canvas) return;

  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;

  // Estado da interação
  let isDrawing = false;
  let currentStroke = [];
  let isCompleted = false;
  let currentProgress = 0;
  let strokeFading = false;
  let fadeAlpha = 1.0;
  let lockedStarStroke = null;
  let celestialRipple = null;

  // Partículas de poeira estelar e estrelas de fundo
  const particles = [];
  const backgroundStars = [];

  // Vértices guias (constelação sutil no centro)
  let guidePoints = [];
  let guideRadius = 120;
  let guideCenter = { x: 0, y: 0 };

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    guideCenter = { x: width / 2, y: height / 2 };
    guideRadius = Math.max(90, Math.min(width, height) * 0.22);
    computeGuidePoints();
    initBackgroundStars();
  }

  function computeGuidePoints() {
    guidePoints = [];
    // 5 pontas simétricas a partir do topo (-PI/2)
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      guidePoints.push({
        id: i,
        x: guideCenter.x + guideRadius * Math.cos(angle),
        y: guideCenter.y + guideRadius * Math.sin(angle),
        angle: angle
      });
    }
  }

  function initBackgroundStars() {
    backgroundStars.length = 0;
    const starCount = Math.floor(Math.min(140, Math.max(70, (width * height) / 11000)));
    const palette = ['#FFFFFF', '#FFF4D6', '#EAF0FF', '#FFE4EE'];

    for (let i = 0; i < starCount; i++) {
      backgroundStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.6 + 0.25,
        twinkleSpeed: Math.random() * 1.8 + 0.8,
        twinklePhase: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
        hasSpikes: Math.random() > 0.88
      });
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Emissão de faíscas estelares
  function spawnSparks(x, y, count = 2, burst = false) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? Math.random() * 4.5 + 1.2 : Math.random() * 1.4 + 0.3;
      particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (burst ? 0 : 0.4),
        life: 1.0,
        decay: burst ? Math.random() * 0.015 + 0.008 : Math.random() * 0.035 + 0.02,
        size: burst ? Math.random() * 2.8 + 1.2 : Math.random() * 1.8 + 0.8,
        color: Math.random() > 0.3 ? '#FFF5D6' : '#FFD166'
      });
    }
  }

  /* ==========================================================================
     RECONHECIMENTO EFETIVO DA ESTRELA DE 5 PONTAS
     Avalia:
     1. Passagem pelos 5 vértices da estrela (ordem clássica cruzada ou contorno)
     2. Análise de curvas e pontas radiais com cruzamentos de reta
     3. Fechamento do traçado próximo ao início
     ========================================================================== */
  function evaluateStroke(points) {
    if (!points || points.length < 8) return 0;

    // A. Avaliação por Vértices Alvo da Constelação
    const hitRadius = Math.max(48, Math.min(guideRadius * 0.45, 68));
    const hitSequence = [];
    let lastHit = -1;

    points.forEach((pt) => {
      guidePoints.forEach((g) => {
        const dx = pt.x - g.x;
        const dy = pt.y - g.y;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          if (lastHit !== g.id) {
            hitSequence.push(g.id);
            lastHit = g.id;
          }
        }
      });
    });

    let validTransitions = 0;
    const uniqueVisited = new Set();

    for (let i = 0; i < hitSequence.length - 1; i++) {
      const from = hitSequence[i];
      const to = hitSequence[i + 1];
      const step = (to - from + 5) % 5;
      uniqueVisited.add(from);
      uniqueVisited.add(to);

      if (step === 2 || step === 3 || step === 1 || step === 4) {
        validTransitions++;
      }
    }

    if (uniqueVisited.size >= 3) {
      if (uniqueVisited.size === 5 && hitSequence.length >= 5) {
        const isClosed = hitSequence[hitSequence.length - 1] === hitSequence[0] ||
                         Math.hypot(points[points.length - 1].x - points[0].x, points[points.length - 1].y - points[0].y) < hitRadius * 1.5;
        if (isClosed && validTransitions >= 4) {
          return 100;
        }
        return 85;
      }
      return Math.min(80, uniqueVisited.size * 18);
    }

    // B. Avaliação Geométrica Livre (desenho livre em qualquer área)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    });

    const w = maxX - minX;
    const h = maxY - minY;
    if (w < 60 || h < 60) return Math.min(20, Math.floor(points.length / 2));

    const cx = sumX / points.length;
    const cy = sumY / points.length;
    const avgR = (w + h) / 4;

    // Detecta picos radiais (as 5 pontas externas)
    const radii = points.map(p => Math.hypot(p.x - cx, p.y - cy));
    const peaks = [];
    for (let i = 2; i < radii.length - 2; i++) {
      if (radii[i] > avgR * 0.95 &&
          radii[i] > radii[i - 1] && radii[i] > radii[i - 2] &&
          radii[i] > radii[i + 1] && radii[i] > radii[i + 2]) {
        const pt = points[i];
        const tooClose = peaks.some(pk => Math.hypot(pk.x - pt.x, pk.y - pt.y) < avgR * 0.45);
        if (!tooClose) {
          peaks.push(pt);
        }
      }
    }

    // Calcula cruzamentos de retas (auto-interseções)
    let intersections = 0;
    const sampleStep = Math.max(1, Math.floor(points.length / 45));
    const sampled = [];
    for (let i = 0; i < points.length; i += sampleStep) {
      sampled.push(points[i]);
    }

    function doIntersect(p1, p2, p3, p4) {
      function ccw(A, B, C) {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
      }
      return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }

    for (let i = 0; i < sampled.length - 3; i++) {
      for (let j = i + 2; j < sampled.length - 1; j++) {
        if (Math.abs(i - j) > 1 && doIntersect(sampled[i], sampled[i + 1], sampled[j], sampled[j + 1])) {
          intersections++;
        }
      }
    }

    const distClose = Math.hypot(points[points.length - 1].x - points[0].x, points[points.length - 1].y - points[0].y);
    const isClosed = distClose < Math.max(w, h) * 0.38;

    if (peaks.length >= 5 && isClosed && (intersections >= 3 || validTransitions >= 4)) {
      return 100;
    }
    if (peaks.length >= 5) return 80;
    if (peaks.length === 4) return 65;
    if (peaks.length === 3) return 45;
    if (peaks.length === 2) return 30;

    return Math.min(25, points.length);
  }

  function celebrate100Percent() {
    if (isCompleted) return;
    isCompleted = true;
    currentProgress = 100;
    progressVal.textContent = '100%';
    progressHud.classList.add('is-celebrating');

    // Congela a estrela desenhada no céu
    lockedStarStroke = [...currentStroke];
    currentStroke = [];

    // Centro da estrela para onda de luz e partículas
    let starCenter = guideCenter;
    if (lockedStarStroke.length > 0) {
      let sx = 0, sy = 0;
      lockedStarStroke.forEach(p => { sx += p.x; sy += p.y; });
      starCenter = { x: sx / lockedStarStroke.length, y: sy / lockedStarStroke.length };
    }

    celestialRipple = {
      x: starCenter.x,
      y: starCenter.y,
      radius: 12,
      maxRadius: Math.max(width, height) * 0.8,
      alpha: 0.85
    };

    // Chuva de poeira estelar suave
    spawnSparks(starCenter.x, starCenter.y, 75, true);

    // Revela suavemente o nome central com animação
    setTimeout(() => {
      revealedContainer.classList.add('is-active');
      revealedContainer.removeAttribute('aria-hidden');
    }, 400);
  }

  function handlePointerDown(e) {
    if (isCompleted) return;
    isDrawing = true;
    strokeFading = false;
    fadeAlpha = 1.0;
    instructionBox.classList.add('is-hidden');

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke = [{ x, y, time: performance.now() }];
    currentProgress = 0;
    progressVal.textContent = '0%';
    spawnSparks(x, y, 3);
  }

  function handlePointerMove(e) {
    if (!isDrawing || isCompleted) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastPt = currentStroke[currentStroke.length - 1];
    const dist = Math.hypot(x - lastPt.x, y - lastPt.y);

    if (dist > 4) {
      currentStroke.push({ x, y, time: performance.now() });
      spawnSparks(x, y, 2);

      const prog = evaluateStroke(currentStroke);
      if (prog > currentProgress) {
        currentProgress = prog;
        progressVal.textContent = `${currentProgress}%`;
      }

      if (currentProgress >= 100) {
        celebrate100Percent();
      }
    }
  }

  function handlePointerUp() {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentProgress >= 100) {
      celebrate100Percent();
    } else {
      // Traçado incompleto ou não reconhecido: desvanece suavemente
      strokeFading = true;
      setTimeout(() => {
        if (!isDrawing && !isCompleted) {
          instructionBox.classList.remove('is-hidden');
        }
      }, 1100);
    }
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);

  function resetToSky() {
    isDrawing = false;
    isCompleted = false;
    currentStroke = [];
    lockedStarStroke = null;
    celestialRipple = null;
    currentProgress = 0;
    progressVal.textContent = '0%';
    fadeAlpha = 1.0;
    strokeFading = false;

    progressHud.classList.remove('is-celebrating');
    revealedContainer.classList.remove('is-active');
    revealedContainer.setAttribute('aria-hidden', 'true');
    instructionBox.classList.remove('is-hidden');
  }

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetToSky();
  });

  // Botão "Explorar Portfólio" após a revelação
  enterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.add('portal-opened');
  });

  // Botão no Header para retornar ao céu estrelado
  if (returnBtn) {
    returnBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.remove('portal-opened');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Loop de renderização visual
  let lastTime = performance.now();

  function render(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    // 1. Estrelas do Céu Noturno
    backgroundStars.forEach((s) => {
      const alpha = Math.max(0.1, Math.min(1, s.baseAlpha + Math.sin(now * 0.001 * s.twinkleSpeed + s.twinklePhase) * 0.28));
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (s.hasSpikes && alpha > 0.6) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 2.8, s.y);
        ctx.lineTo(s.x + s.r * 2.8, s.y);
        ctx.moveTo(s.x, s.y - s.r * 2.8);
        ctx.lineTo(s.x, s.y + s.r * 2.8);
        ctx.stroke();
      }
    });

    // 2. Guia de Constelação Sutil no Centro
    if (!isCompleted) {
      const constAlpha = Math.max(0.15, Math.min(0.45, 0.28 + Math.sin(now * 0.0015) * 0.1));
      guidePoints.forEach((g) => {
        ctx.fillStyle = '#FFE0E8';
        ctx.globalAlpha = constAlpha;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 224, 232, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // 3. Onda de Luz Celestial (Ripple aos 100%)
    if (celestialRipple) {
      celestialRipple.radius += 180 * delta;
      celestialRipple.alpha -= 0.35 * delta;

      if (celestialRipple.alpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 235, 180, ${celestialRipple.alpha * 0.75})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#FFE0E8';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(celestialRipple.x, celestialRipple.y, celestialRipple.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        celestialRipple = null;
      }
    }

    // 4. Desenho do Traço Ativo ou Desvanecendo
    if (strokeFading) {
      fadeAlpha -= 1.2 * delta;
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        strokeFading = false;
        currentStroke = [];
        currentProgress = 0;
        progressVal.textContent = '0%';
      }
    }

    function drawStrokePath(points, alpha, isLocked = false) {
      if (!points || points.length < 2) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Brilho exterior suave dourado-prateado
      ctx.strokeStyle = isLocked ? 'rgba(255, 235, 180, 0.65)' : 'rgba(255, 224, 232, 0.45)';
      ctx.shadowColor = isLocked ? '#FFE0E8' : '#FF63F8';
      ctx.shadowBlur = isLocked ? 28 : 16;
      ctx.lineWidth = isLocked ? 4.5 : 3.5;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Núcleo luminoso branco puro
      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 6;
      ctx.lineWidth = isLocked ? 2 : 1.8;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.restore();
    }

    if (currentStroke.length > 1) {
      drawStrokePath(currentStroke, fadeAlpha, false);
    }

    if (lockedStarStroke && lockedStarStroke.length > 1) {
      drawStrokePath(lockedStarStroke, 0.95, true);
    }

    // 5. Partículas de Luz
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

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
