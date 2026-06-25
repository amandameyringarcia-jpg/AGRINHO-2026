/* ==========================================================================
   AGRO FORTE, FUTURO SUSTENTÁVEL — script.js
   ========================================================================== */

/* ==========================================================================
   1. CONFIGURAÇÕES GLOBAIS
   ========================================================================== */

const CONFIG = {
  nomeSite: "Agro Forte",
  duracaoNotificacao: 4000,
};

/* ==========================================================================
   2. UTILITÁRIOS GERAIS
   ========================================================================== */

/**
 * Seleciona um elemento do DOM com segurança.
 * @param {string} seletor
 * @param {Document|HTMLElement} contexto
 * @returns {HTMLElement|null}
 */
function $(seletor, contexto = document) {
  return contexto.querySelector(seletor);
}

/**
 * Seleciona múltiplos elementos do DOM.
 * @param {string} seletor
 * @param {Document|HTMLElement} contexto
 * @returns {HTMLElement[]}
 */
function $$(seletor, contexto = document) {
  return Array.from(contexto.querySelectorAll(seletor));
}

/**
 * Aplica debounce a uma função, evitando execuções repetidas em curto intervalo.
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Cria e exibe uma notificação temporária (toast) na tela.
 * @param {string} mensagem
 * @param {"sucesso"|"erro"|"info"} tipo
 */
function exibirNotificacao(mensagem, tipo = "info") {
  const container = $("#notificacoes");
  if (!container) return;

  const notificacao = document.createElement("div");
  notificacao.className = `notificacao notificacao--${tipo}`;
  notificacao.textContent = mensagem;

  container.appendChild(notificacao);

  setTimeout(() => {
    notificacao.classList.add("notificacao--saindo");
    setTimeout(() => notificacao.remove(), 400);
  }, CONFIG.duracaoNotificacao);
}

/* ==========================================================================
   3. NAVEGAÇÃO
   ========================================================================== */

/**
 * Inicializa o menu responsivo (abre/fecha em telas pequenas).
 */
function inicializarMenu() {
  const botao = $("#botao-menu");
  const menu = $("#menu-navegacao");

  if (!botao || !menu) return;

  botao.addEventListener("click", () => {
    const aberto = menu.classList.toggle("menu--aberto");
    botao.setAttribute("aria-expanded", aberto);
  });

  $$("a", menu).forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("menu--aberto");
      botao.setAttribute("aria-expanded", "false");
    });
  });
}

/**
 * Destaca o link do menu correspondente à seção visível na tela.
 */
function inicializarScrollSpy() {
  const secoes = $$("main section[id]");
  const links = $$("#menu-navegacao a[data-secao]");

  if (secoes.length === 0 || links.length === 0) return;

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          const id = entrada.target.getAttribute("id");
          links.forEach((link) => {
            link.classList.toggle("link--ativo", link.dataset.secao === id);
          });
        }
      });
    },
    { threshold: 0.35, rootMargin: "-80px 0px 0px 0px" }
  );

  secoes.forEach((secao) => observer.observe(secao));
}

/**
 * Aplica uma classe de entrada suave aos blocos de conteúdo conforme
 * entram na viewport, usando IntersectionObserver (sem custo de scroll listener).
 */
function inicializarRevelacaoAoRolar() {
  const elementos = $$(".secao__corpo, .cartao-pilar, .risco, .caminho-futuro__etapa");
  if (elementos.length === 0) return;

  elementos.forEach((el) => el.classList.add("revelar"));

  const observer = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("revelar--visivel");
          obs.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   4. FORMULÁRIO DE CONTATO
   ========================================================================== */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida os dados do formulário de contato.
 * @param {{nome: string, email: string, mensagem: string}} dados
 * @returns {{valido: boolean, erros: Object}}
 */
function validarFormularioContato(dados) {
  const erros = {};

  if (!dados.nome || dados.nome.trim().length < 2) {
    erros.nome = "Informe seu nome completo.";
  }

  if (!dados.email || !REGEX_EMAIL.test(dados.email)) {
    erros.email = "Informe um e-mail válido.";
  }

  if (!dados.mensagem || dados.mensagem.trim().length < 10) {
    erros.mensagem = "A mensagem deve ter ao menos 10 caracteres.";
  }

  return { valido: Object.keys(erros).length === 0, erros };
}

/**
 * Exibe as mensagens de erro de validação ao lado de cada campo.
 * @param {Object} erros
 */
function exibirErrosFormulario(formulario, erros) {
  $$(".campo", formulario).forEach((campo) => campo.classList.remove("campo--invalido"));
  $$(".campo__erro", formulario).forEach((span) => (span.textContent = ""));

  Object.entries(erros).forEach(([nomeCampo, mensagem]) => {
    const span = $(`[data-erro-para="${nomeCampo}"]`, formulario);
    const campo = span ? span.closest(".campo") : null;

    if (span) span.textContent = mensagem;
    if (campo) campo.classList.add("campo--invalido");
  });
}

/**
 * Manipula o envio do formulário de contato.
 * @param {Event} evento
 */
function manipularEnvioContato(evento) {
  evento.preventDefault();

  const formulario = evento.target;
  const dados = {
    nome: formulario.nome.value,
    email: formulario.email.value,
    assunto: formulario.assunto.value,
    mensagem: formulario.mensagem.value,
  };

  const { valido, erros } = validarFormularioContato(dados);
  exibirErrosFormulario(formulario, erros);

  if (!valido) {
    exibirNotificacao("Verifique os campos destacados antes de enviar.", "erro");
    return;
  }

  // Ponto de integração futura: enviar `dados` para um backend ou serviço de e-mail.
  console.log("Mensagem de contato:", dados);

  exibirNotificacao("Mensagem enviada com sucesso! Em breve retornaremos.", "sucesso");
  formulario.reset();
}

/**
 * Inicializa o formulário de contato e sua validação em tempo real.
 */
function inicializarFormularioContato() {
  const formulario = $("#form-contato");
  if (!formulario) return;

  formulario.addEventListener("submit", manipularEnvioContato);

  // Validação suave ao sair do campo (blur)
  $$("input, textarea", formulario).forEach((campo) => {
    campo.addEventListener("blur", () => {
      const dados = {
        nome: formulario.nome.value,
        email: formulario.email.value,
        mensagem: formulario.mensagem.value,
      };
      const { erros } = validarFormularioContato(dados);
      exibirErrosFormulario(formulario, erros);
    });
  });
}

/* ==========================================================================
   5. INICIALIZAÇÃO GERAL
   ========================================================================== */

function inicializarApp() {
  console.log(`${CONFIG.nomeSite} — site iniciado.`);

  inicializarMenu();
  inicializarScrollSpy();
  inicializarRevelacaoAoRolar();
  inicializarFormularioContato();
}

document.addEventListener("DOMContentLoaded", inicializarApp);


document.addEventListener("DOMContentLoaded", inicializarApp);

