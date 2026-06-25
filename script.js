const CONFIG = {
  nomeSite: "Agronomia Sustentável",
  apiUrlClima: "https://api.open-meteo.com/v1/forecast", // exemplo de API pública de clima
  itensPorPagina: 6,
};

// Exemplo de "banco de dados" local de práticas sustentáveis
// (poderia futuramente vir de uma API ou arquivo JSON)
const praticasSustentaveis = [
  {
    id: 1,
    titulo: "Plantio Direto",
    categoria: "solo",
    descricao:
      "Técnica que evita o revolvimento do solo, preservando sua estrutura e umidade.",
  },
  {
    id: 2,
    titulo: "Rotação de Culturas",
    categoria: "solo",
    descricao:
      "Alternância de espécies plantadas na mesma área para manter a fertilidade do solo.",
  },
  {
    id: 3,
    titulo: "Captação de Água da Chuva",
    categoria: "agua",
    descricao:
      "Sistemas de armazenamento de água pluvial para uso na irrigação.",
  },
  {
    id: 4,
    titulo: "Irrigação por Gotejamento",
    categoria: "agua",
    descricao:
      "Método que reduz o desperdício de água ao entregá-la diretamente à raiz da planta.",
  },
  {
    id: 5,
    titulo: "Controle Biológico de Pragas",
    categoria: "biodiversidade",
    descricao:
      "Uso de predadores naturais para reduzir a necessidade de agrotóxicos.",
  },
  {
    id: 6,
    titulo: "Adubação Verde",
    categoria: "solo",
    descricao:
      "Cultivo de plantas específicas para incorporar nutrientes ao solo naturalmente.",
  },
];

/* ==========================================================================
   2. UTILITÁRIOS GERAIS
   ========================================================================== */

/**
 * Seleciona um elemento do DOM com segurança.
 * @param {string} seletor - Seletor CSS.
 * @param {Document|HTMLElement} contexto - Contexto de busca (padrão: document).
 * @returns {HTMLElement|null}
 */
function $(seletor, contexto = document) {
  return contexto.querySelector(seletor);
}

/**
 * Seleciona múltiplos elementos do DOM.
 * @param {string} seletor - Seletor CSS.
 * @param {Document|HTMLElement} contexto - Contexto de busca.
 * @returns {HTMLElement[]}
 */
function $$(seletor, contexto = document) {
  return Array.from(contexto.querySelectorAll(seletor));
}

/**
 * Cria um elemento HTML com atributos e conteúdo definidos.
 * @param {string} tag - Tipo de elemento (ex: 'div', 'p').
 * @param {Object} atributos - Atributos a serem aplicados.
 * @param {string|HTMLElement} conteudo - Conteúdo interno do elemento.
 * @returns {HTMLElement}
 */
function criarElemento(tag, atributos = {}, conteudo = "") {
  const el = document.createElement(tag);

  Object.entries(atributos).forEach(([chave, valor]) => {
    if (chave === "class") {
      el.className = valor;
    } else if (chave === "dataset") {
      Object.entries(valor).forEach(([dataKey, dataValue]) => {
        el.dataset[dataKey] = dataValue;
      });
    } else {
      el.setAttribute(chave, valor);
    }
  });

  if (conteudo instanceof HTMLElement) {
    el.appendChild(conteudo);
  } else {
    el.innerHTML = conteudo;
  }

  return el;
}

/**
 * Aplica debounce a uma função (evita execuções repetidas e rápidas).
 * Útil para eventos como digitação em campo de busca ou resize.
 * @param {Function} func
 * @param {number} delay - Tempo em ms.
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
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa).
 * @param {Date} data
 * @returns {string}
 */
function formatarData(data = new Date()) {
  return data.toLocaleDateString("pt-BR");
}

/**
 * Exibe uma mensagem de alerta/notificação na tela.
 * @param {string} mensagem
 * @param {"sucesso"|"erro"|"info"} tipo
 */
function exibirNotificacao(mensagem, tipo = "info") {
  const container = $("#notificacoes") || criarContainerNotificacoes();

  const notificacao = criarElemento(
    "div",
    { class: `notificacao notificacao--${tipo}` },
    mensagem
  );

  container.appendChild(notificacao);

  setTimeout(() => {
    notificacao.classList.add("notificacao--saindo");
    setTimeout(() => notificacao.remove(), 400);
  }, 3500);
}

function criarContainerNotificacoes() {
  const container = criarElemento("div", { id: "notificacoes" });
  document.body.appendChild(container);
  return container;
}

/* ==========================================================================
   3. NAVEGAÇÃO E MENU
   ========================================================================== */

/**
 * Inicializa o comportamento do menu responsivo (hambúrguer).
 */
function inicializarMenu() {
  const botaoMenu = $("#botao-menu");
  const menu = $("#menu-navegacao");

  if (!botaoMenu || !menu) return;

  botaoMenu.addEventListener("click", () => {
    const aberto = menu.classList.toggle("menu--aberto");
    botaoMenu.setAttribute("aria-expanded", aberto);
  });

  // Fecha o menu ao clicar em um link (útil em mobile)
  $$("a", menu).forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("menu--aberto");
      botaoMenu.setAttribute("aria-expanded", "false");
    });
  });
}

/**
 * Destaca o link de navegação correspondente à seção visível na tela.
 */
function inicializarScrollSpy() {
  const secoes = $$("main section[id]");
  const links = $$("#menu-navegacao a");

  if (secoes.length === 0 || links.length === 0) return;

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          const id = entrada.target.getAttribute("id");
          links.forEach((link) => {
            link.classList.toggle(
              "link--ativo",
              link.getAttribute("href") === `#${id}`
            );
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  secoes.forEach((secao) => observer.observe(secao));
}

/* ==========================================================================
   4. RENDERIZAÇÃO DE CONTEÚDO (PRÁTICAS SUSTENTÁVEIS)
   ========================================================================== */

/**
 * Renderiza os cards de práticas sustentáveis na tela.
 * @param {Array} lista - Lista de práticas a serem exibidas.
 */
function renderizarPraticas(lista = praticasSustentaveis) {
  const container = $("#lista-praticas");
  if (!container) return;

  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = `<p class="mensagem-vazia">Nenhuma prática encontrada.</p>`;
    return;
  }

  lista.forEach((pratica) => {
    const card = criarElemento("article", {
      class: "card-pratica",
      dataset: { categoria: pratica.categoria },
    });

    card.innerHTML = `
      <h3>${pratica.titulo}</h3>
      <span class="card-pratica__categoria">${pratica.categoria}</span>
      <p>${pratica.descricao}</p>
    `;

    container.appendChild(card);
  });
}

/**
 * Filtra as práticas sustentáveis por categoria.
 * @param {string} categoria - Categoria a ser filtrada ('todas' para mostrar tudo).
 */
function filtrarPraticasPorCategoria(categoria) {
  const filtradas =
    categoria === "todas"
      ? praticasSustentaveis
      : praticasSustentaveis.filter((p) => p.categoria === categoria);

  renderizarPraticas(filtradas);
}

/**
 * Inicializa os botões de filtro de categoria.
 */
function inicializarFiltros() {
  const botoes = $$(".botao-filtro");
  if (botoes.length === 0) return;

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoes.forEach((b) => b.classList.remove("botao-filtro--ativo"));
      botao.classList.add("botao-filtro--ativo");
      filtrarPraticasPorCategoria(botao.dataset.categoria);
    });
  });
}

/**
 * Busca textual simples dentro das práticas sustentáveis.
 * @param {string} termo
 */
function buscarPraticas(termo) {
  const termoNormalizado = termo.trim().toLowerCase();

  const resultado = praticasSustentaveis.filter(
    (p) =>
      p.titulo.toLowerCase().includes(termoNormalizado) ||
      p.descricao.toLowerCase().includes(termoNormalizado)
  );

  renderizarPraticas(resultado);
}

function inicializarBusca() {
  const campoBusca = $("#campo-busca");
  if (!campoBusca) return;

  campoBusca.addEventListener(
    "input",
    debounce((evento) => buscarPraticas(evento.target.value), 300)
  );
}

/* ==========================================================================
   5. FORMULÁRIO DE CONTATO
   ========================================================================== */

/**
 * Valida os campos básicos do formulário de contato.
 * @param {Object} dados - { nome, email, mensagem }
 * @returns {{valido: boolean, erros: string[]}}
 */
function validarFormularioContato(dados) {
  const erros = [];
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!dados.nome || dados.nome.trim().length < 2) {
    erros.push("Informe um nome válido.");
  }

  if (!dados.email || !regexEmail.test(dados.email)) {
    erros.push("Informe um e-mail válido.");
  }

  if (!dados.mensagem || dados.mensagem.trim().length < 10) {
    erros.push("A mensagem deve ter ao menos 10 caracteres.");
  }

  return { valido: erros.length === 0, erros };
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
    mensagem: formulario.mensagem.value,
  };

  const { valido, erros } = validarFormularioContato(dados);

  if (!valido) {
    exibirNotificacao(erros.join(" "), "erro");
    return;
  }

  // Aqui futuramente entraria a chamada real (fetch) para um backend/API
  console.log("Dados enviados:", dados);

  exibirNotificacao("Mensagem enviada com sucesso! Em breve retornaremos.", "sucesso");
  formulario.reset();
}

function inicializarFormularioContato() {
  const formulario = $("#form-contato");
  if (!formulario) return;

  formulario.addEventListener("submit", manipularEnvioContato);
}

/* ==========================================================================
   6. INTEGRAÇÃO COM API EXTERNA (EXEMPLO: CLIMA)
   ========================================================================== */

/**
 * Busca dados climáticos atuais para auxiliar o produtor rural.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object|null>}
 */
async function buscarDadosClima(latitude, longitude) {
  try {
    const url = `${CONFIG.apiUrlClima}?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();
    return dados.current_weather || null;
  } catch (erro) {
    console.error("Erro ao buscar dados climáticos:", erro);
    exibirNotificacao("Não foi possível carregar os dados climáticos.", "erro");
    return null;
  }
}

/**
 * Renderiza os dados climáticos no widget correspondente.
 */
async function inicializarWidgetClima() {
  const widget = $("#widget-clima");
  if (!widget) return;

  // Coordenadas de exemplo (Curitiba, PR)
  const clima = await buscarDadosClima(-25.4284, -49.2733);

  if (!clima) {
    widget.innerHTML = `<p>Dados climáticos indisponíveis no momento.</p>`;
    return;
  }

  widget.innerHTML = `
    <p><strong>Temperatura:</strong> ${clima.temperature}°C</p>
    <p><strong>Vento:</strong> ${clima.windspeed} km/h</p>
    <p><strong>Atualizado em:</strong> ${formatarData(new Date())}</p>
  `;
}

/* ==========================================================================
   7. CALCULADORA DE SUSTENTABILIDADE (EXEMPLO DE FERRAMENTA INTERATIVA)
   ========================================================================== */

/**
 * Calcula uma estimativa simples de "pegada hídrica" com base na área
 * plantada e no tipo de irrigação utilizada.
 * @param {number} areaHectares
 * @param {"gotejamento"|"aspersao"|"inundacao"} tipoIrrigacao
 * @returns {number} litros estimados por dia
 */
function calcularConsumoHidrico(areaHectares, tipoIrrigacao) {
  const fatorPorTipo = {
    gotejamento: 15000,
    aspersao: 25000,
    inundacao: 40000,
  };

  const fator = fatorPorTipo[tipoIrrigacao] ?? fatorPorTipo.aspersao;
  return areaHectares * fator;
}

function inicializarCalculadoraHidrica() {
  const formulario = $("#form-calculadora-hidrica");
  if (!formulario) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const area = parseFloat(formulario.area.value);
    const tipoIrrigacao = formulario.irrigacao.value;
    const resultadoEl = $("#resultado-calculadora");

    if (isNaN(area) || area <= 0) {
      exibirNotificacao("Informe uma área válida.", "erro");
      return;
    }

    const consumo = calcularConsumoHidrico(area, tipoIrrigacao);

    resultadoEl.innerHTML = `
      Estimativa de consumo: <strong>${consumo.toLocaleString("pt-BR")} litros/dia</strong>
    `;
  });
}

/* ==========================================================================
   8. INICIALIZAÇÃO GERAL
   ========================================================================== */

/**
 * Função principal, executada quando o DOM estiver pronto.
 */
function inicializarApp() {
  console.log(`${CONFIG.nomeSite} - aplicação iniciada em ${formatarData()}`);

  inicializarMenu();
  inicializarScrollSpy();
  renderizarPraticas();
  inicializarFiltros();
  inicializarBusca();
  inicializarFormularioContato();
  inicializarWidgetClima();
  inicializarCalculadoraHidrica();
}

document.addEventListener("DOMContentLoaded", inicializarApp);

