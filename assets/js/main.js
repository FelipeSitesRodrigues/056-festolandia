/* Festolândia Shows e Eventos: comportamento do site */
(function () {
  'use strict';

  var ZAP = '5511965358929';
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu mobile ---------- */
  var hamburguer = document.getElementById('hamburguer');
  var menu = document.getElementById('menu');

  if (hamburguer && menu) {
    hamburguer.addEventListener('click', function () {
      var aberto = menu.classList.toggle('is-aberto');
      hamburguer.setAttribute('aria-expanded', String(aberto));
      hamburguer.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('is-aberto');
        hamburguer.setAttribute('aria-expanded', 'false');
        hamburguer.setAttribute('aria-label', 'Abrir menu');
      }
    });
  }

  /* ---------- cabeçalho encolhe ---------- */
  var cabecalho = document.getElementById('cabecalho');
  var ultimoY = -1;

  function aoRolar() {
    var y = window.scrollY;
    if (y === ultimoY) return;
    ultimoY = y;
    cabecalho.classList.toggle('encolhido', y > 20);
    marcaSecaoAtual();
  }

  /* ---------- link ativo no menu ---------- */
  var linksMenu = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));
  var alvos = linksMenu.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });

  function marcaSecaoAtual() {
    var linha = window.scrollY + window.innerHeight * 0.32;
    var atual = -1;
    for (var i = 0; i < alvos.length; i++) {
      if (alvos[i] && alvos[i].offsetTop <= linha) atual = i;
    }
    linksMenu.forEach(function (a, i) {
      a.classList.toggle('is-atual', i === atual);
    });
  }

  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* ---------- revelação no scroll ---------- */
  var revelaveis = document.querySelectorAll('.revela');

  if (semMovimento || !('IntersectionObserver' in window)) {
    revelaveis.forEach(function (el) { el.classList.add('is-visivel'); });
  } else {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visivel');
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revelaveis.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- contadores da faixa de provas ---------- */
  var numeros = document.querySelectorAll('[data-conta]');

  function formata(n) {
    return n.toLocaleString('pt-BR');
  }

  function anima(el) {
    var alvo = parseInt(el.getAttribute('data-conta'), 10);
    var sufixo = el.getAttribute('data-sufixo') || '';
    if (semMovimento) { el.textContent = formata(alvo) + sufixo; return; }

    var duracao = 1400;
    var inicio = null;

    function passo(agora) {
      if (inicio === null) inicio = agora;
      var t = Math.min((agora - inicio) / duracao, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formata(Math.round(alvo * eased)) + sufixo;
      if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  if (numeros.length && 'IntersectionObserver' in window) {
    var obsNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          anima(entrada.target);
          obsNum.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.6 });
    numeros.forEach(function (el) { obsNum.observe(el); });
  }

  /* ---------- filtro de personagens ---------- */
  var filtros = document.querySelectorAll('.filtro');
  var personagens = document.querySelectorAll('.personagem');

  filtros.forEach(function (botao) {
    botao.addEventListener('click', function () {
      var cat = botao.getAttribute('data-filtro');

      filtros.forEach(function (b) {
        var ativo = b === botao;
        b.classList.toggle('is-ativo', ativo);
        b.setAttribute('aria-selected', String(ativo));
      });

      personagens.forEach(function (card) {
        var mostra = cat === 'todos' || card.getAttribute('data-cat') === cat;
        card.classList.toggle('is-fora', !mostra);
      });
    });
  });

  /* ---------- carrossel de depoimentos ---------- */
  var pista = document.getElementById('dep-pista');
  var anterior = document.getElementById('dep-ant');
  var proximo = document.getElementById('dep-prox');

  if (pista && anterior && proximo) {
    function passoCarrossel() {
      var cartao = pista.querySelector('.depoimento');
      if (!cartao) return pista.clientWidth;
      var estilo = window.getComputedStyle(pista);
      return cartao.getBoundingClientRect().width + parseFloat(estilo.columnGap || estilo.gap || 20);
    }

    function atualizaSetas() {
      var fim = pista.scrollWidth - pista.clientWidth - 2;
      anterior.disabled = pista.scrollLeft <= 2;
      proximo.disabled = pista.scrollLeft >= fim;
    }

    anterior.addEventListener('click', function () {
      pista.scrollBy({ left: -passoCarrossel(), behavior: semMovimento ? 'auto' : 'smooth' });
    });
    proximo.addEventListener('click', function () {
      pista.scrollBy({ left: passoCarrossel(), behavior: semMovimento ? 'auto' : 'smooth' });
    });

    pista.addEventListener('scroll', atualizaSetas, { passive: true });
    window.addEventListener('resize', atualizaSetas);
    atualizaSetas();
  }

  /* ---------- formulário: envia pelo WhatsApp ---------- */
  var form = document.getElementById('form-orcamento');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var campos = form.querySelectorAll('[required]');
      var valido = true;
      var primeiroErro = null;

      campos.forEach(function (campo) {
        var ok = campo.type === 'checkbox' ? campo.checked : campo.value.trim() !== '';
        campo.setAttribute('aria-invalid', String(!ok));
        if (!ok) {
          valido = false;
          if (!primeiroErro) primeiroErro = campo;
        }
      });

      if (!valido) {
        primeiroErro.focus();
        return;
      }

      var nome = form.nome.value.trim();
      var zap = form.zap.value.trim();
      var data = form.data.value.trim();
      var tipo = form.tipo.value;
      var msg = form.mensagem.value.trim();

      var linhas = ['Olá! Vim pelo site e gostaria de um orçamento.', ''];
      linhas.push('*Nome:* ' + nome);
      linhas.push('*WhatsApp:* ' + zap);
      if (tipo) linhas.push('*Tipo de evento:* ' + tipo);
      if (data) linhas.push('*Data do evento:* ' + formataData(data));
      if (msg) linhas.push('*Sobre o evento:* ' + msg);

      window.open('https://wa.me/' + ZAP + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') {
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }

  function formataData(valor) {
    var partes = valor.split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : valor;
  }
})();
