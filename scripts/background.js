"use strict";

/* =========================================================
   NE-84 — BACKGROUND MATEMÁTICO
   ---------------------------------------------------------
   Este arquivo controla somente o cenário de fórmulas:

   • gera posições pseudoaleatórias;
   • evita sobreposição entre expressões;
   • adapta a quantidade de fórmulas ao tamanho da tela;
   • aplica parallax suave com o ponteiro;
   • recalcula o layout após redimensionamento.

   A calculadora não depende deste arquivo para funcionar.
========================================================= */

/* ==========================
   GERADOR PSEUDOALEATÓRIO
   ---------------------------------------------------------
   Recebe uma seed e sempre produz a mesma sequência para
   aquela seed. Isso impede que as fórmulas mudem de posição
   a cada pequena etapa do mesmo cálculo de layout.
========================== */

function createRandom(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;

    let value = seed;

    value = Math.imul(value ^ (value >>> 15), 1 | value);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/* ==========================
   SPATIAL HASH
   ---------------------------------------------------------
   Em vez de comparar uma fórmula nova com todas as fórmulas
   já posicionadas, dividimos a tela em células invisíveis.

   A verificação de colisão consulta apenas as células próximas,
   reduzindo a quantidade de comparações necessárias.
========================== */

class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  /* Descobre quais células uma área retangular ocupa. */
  getCellRange(area, gap = 0) {
    return {
      minX: Math.floor((area.left - gap) / this.cellSize),
      maxX: Math.floor((area.right + gap) / this.cellSize),
      minY: Math.floor((area.top - gap) / this.cellSize),
      maxY: Math.floor((area.bottom + gap) / this.cellSize),
    };
  }

  /* Retorna somente áreas registradas nas células vizinhas. */
  getNearby(area, gap) {
    const range = this.getCellRange(area, gap);
    const nearby = new Set();

    for (let x = range.minX; x <= range.maxX; x++) {
      for (let y = range.minY; y <= range.maxY; y++) {
        const entries = this.cells.get(`${x}:${y}`);

        if (entries) {
          entries.forEach((entry) => nearby.add(entry));
        }
      }
    }

    return nearby;
  }

  /* Registra a área de uma fórmula nas células que ela ocupa. */
  add(area) {
    const range = this.getCellRange(area);

    for (let x = range.minX; x <= range.maxX; x++) {
      for (let y = range.minY; y <= range.maxY; y++) {
        const key = `${x}:${y}`;

        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }

        this.cells.get(key).push(area);
      }
    }
  }
}

/* ==========================
   DETECÇÃO DE COLISÃO
========================== */

function rectanglesOverlap(first, second, gap) {
  return !(
    first.right + gap < second.left ||
    first.left > second.right + gap ||
    first.bottom + gap < second.top ||
    first.top > second.bottom + gap
  );
}

function collides(area, spatialHash, gap) {
  for (const existingArea of spatialHash.getNearby(area, gap)) {
    if (rectanglesOverlap(area, existingArea, gap)) {
      return true;
    }
  }

  return false;
}

/* ==========================
   INICIALIZAÇÃO DO BACKGROUND
========================== */

function initMathBackground() {
  const mathLayer = document.querySelector(".math-layer");
  const formulas = Array.from(document.querySelectorAll(".formula"));

  if (!mathLayer || formulas.length === 0) {
    return;
  }

  /*
     A seed inicial muda a cada carregamento da página, criando
     uma composição nova.

     Durante aquele carregamento, porém, a distribuição permanece
     determinística para o mesmo tamanho de viewport.
  */
  const pageSeed = crypto.getRandomValues(new Uint32Array(1))[0];

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  /* ========================
     DISTRIBUIÇÃO DAS FÓRMULAS
  ======================== */

  function layoutMathBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 700;

    /* Limpa posições calculadas anteriormente antes do resize. */
    formulas.forEach((formula) => {
      formula.hidden = true;
      formula.style.visibility = "hidden";
      formula.style.left = "0px";
      formula.style.top = "0px";
    });

    /* Margens de segurança evitam textos colados nas bordas. */
    const safeX = isMobile
      ? Math.max(24, width * 0.045)
      : Math.max(60, width * 0.05);

    const safeTop = Math.max(24, height * 0.03);
    const safeBottom = Math.max(24, height * 0.035);

    /* ======================
       QUANTIDADE POR LARGURA
    ====================== */

    let countByWidth = 100;

    if (width < 480) countByWidth = 22;
    else if (width < 600) countByWidth = 32;
    else if (width < 750) countByWidth = 44;
    else if (width < 900) countByWidth = 58;
    else if (width < 1100) countByWidth = 72;
    else if (width < 1300) countByWidth = 86;

    /* ======================
       QUANTIDADE POR ALTURA
    ====================== */

    let countByHeight = 100;

    if (height < 500) countByHeight = 20;
    else if (height < 600) countByHeight = 32;
    else if (height < 700) countByHeight = 48;
    else if (height < 800) countByHeight = 65;
    else if (height < 900) countByHeight = 82;

    const visibleCount = Math.min(
      countByWidth,
      countByHeight,
      formulas.length,
    );

    /*
       Pequenas faixas de tamanho compartilham uma seed estável.
       Assim, um resize mínimo não reorganiza tudo continuamente.
    */
    const seed =
      pageSeed +
      Math.floor(width / 20) * 17 +
      Math.floor(height / 20) * 31;

    const random = createRandom(seed);

    /* Distância mínima visual entre duas expressões. */
    let gap = 10;

    if (width < 1100) gap = 9;
    if (width < 900) gap = 8;
    if (width < 700) gap = 11;
    if (width < 500) gap = 9;

    /*
       Reduz levemente as fórmulas em telas menores sem alterar
       demais a identidade visual do background.
    */
    const screenScale = isMobile
      ? 0.88
      : Math.min(1, Math.max(0.82, width / 1440));

    /*
       Cada instância representa o mapa espacial daquele cálculo
       de layout. Ao recalcular as fórmulas, um novo mapa é criado.
    */
    const spatialHash = new SpatialHash(isMobile ? 72 : 96);

    /*
       No mobile a distribuição vertical recebe uma curva leve
       para reduzir a sensação de fórmulas organizadas em linhas.
    */
    function createY(minY, maxY) {
      if (!isMobile) {
        return minY + random() * (maxY - minY);
      }

      const verticalRandom = Math.pow(random(), 0.82);

      return minY + verticalRandom * (maxY - minY);
    }

    /*
       Tenta encontrar uma posição livre.

       Se houver colisão, uma nova posição é gerada até atingir
       o limite máximo de tentativas recebido pela função.
    */
    function tryPlace(
      formula,
      formulaWidth,
      formulaHeight,
      attempts,
    ) {
      const minX = safeX;
      const maxX = width - safeX - formulaWidth;
      const minY = safeTop;
      const maxY = height - safeBottom - formulaHeight;

      if (maxX <= minX || maxY <= minY) {
        return false;
      }

      for (let attempt = 0; attempt < attempts; attempt++) {
        const x = minX + random() * (maxX - minX);
        const y = createY(minY, maxY);

        const area = {
          left: x,
          top: y,
          right: x + formulaWidth,
          bottom: y + formulaHeight,
        };

        if (collides(area, spatialHash, gap)) {
          continue;
        }

        formula.style.left = `${x}px`;
        formula.style.top = `${y}px`;
        formula.style.visibility = "visible";

        spatialHash.add(area);

        return true;
      }

      return false;
    }

    /* ======================
       ESTILO + POSICIONAMENTO
    ====================== */

    formulas.forEach((formula, index) => {
      if (index >= visibleCount) {
        return;
      }

      /*
         hidden precisa ser removido antes da medição para que
         offsetWidth e offsetHeight consigam calcular dimensões.
      */
      formula.hidden = false;

      /* Variação controlada cria hierarquia entre as fórmulas. */
      let fontSize = isMobile
        ? 10.5 + random() * 6.5
        : (10.5 + random() * 7) * screenScale;

      /*
         Algumas posições recebem destaque previsível para evitar
         que todas as expressões tenham exatamente o mesmo peso.
      */
      if (index % 17 === 0) {
        fontSize *= isMobile ? 1.35 : 1.48;
      } else if (index % 11 === 0) {
        fontSize *= isMobile ? 1.2 : 1.25;
      } else if (index % 7 === 0) {
        fontSize *= 1.12;
      }

      fontSize = Math.min(
        isMobile ? 20 : 24,
        Math.max(isMobile ? 10 : 9.5, fontSize),
      );

      const rotation = isMobile
        ? -5 + random() * 10
        : -2.2 + random() * 4.4;

      const opacity = isMobile
        ? 0.68 + random() * 0.24
        : 0.64 + random() * 0.25;

      formula.style.fontSize = `${fontSize}px`;
      formula.style.opacity = opacity.toFixed(2);
      formula.style.transform = `rotate(${rotation.toFixed(2)}deg)`;

      /*
         A fórmula permanece invisível durante a medição e só
         aparece depois que uma posição livre é encontrada.
      */
      formula.style.visibility = "hidden";

      /*
         offsetWidth e offsetHeight medem as dimensões reais da
         expressão depois da aplicação de tamanho e conteúdo.
      */
      let formulaWidth = formula.offsetWidth;
      let formulaHeight = formula.offsetHeight;

      const availableWidth = width - safeX * 2;

      /* Reduz fórmulas excepcionalmente largas para caber na tela. */
      if (formulaWidth > availableWidth) {
        const reduction = availableWidth / formulaWidth;

        fontSize *= reduction * 0.94;

        formula.style.fontSize = `${fontSize}px`;

        formulaWidth = formula.offsetWidth;
        formulaHeight = formula.offsetHeight;
      }

      /* Primeira tentativa usa o tamanho original calculado. */
      let placed = tryPlace(
        formula,
        formulaWidth,
        formulaHeight,
        420,
      );

      /*
         Se estiver muito cheio, reduz a expressão em 10%
         e realiza uma segunda tentativa.
      */
      if (!placed) {
        fontSize *= 0.9;

        formula.style.fontSize = `${fontSize}px`;

        formulaWidth = formula.offsetWidth;
        formulaHeight = formula.offsetHeight;

        placed = tryPlace(
          formula,
          formulaWidth,
          formulaHeight,
          240,
        );
      }

      /* Melhor ocultar uma fórmula do que permitir sobreposição. */
      if (!placed) {
        formula.hidden = true;
        formula.style.visibility = "hidden";
      }
    });
  }

  /* ========================
     PARALLAX DO PONTEIRO
     --------------------------------------------------------
     pointermove pode disparar muitas vezes entre dois frames.

     Em vez de atualizar o CSS em cada evento, armazenamos a
     posição mais recente do ponteiro e usamos requestAnimationFrame
     para fazer no máximo uma atualização visual por frame.
  ======================== */

  let parallaxFrame = null;
  let pointerX = 0;
  let pointerY = 0;

  function updateBackgroundParallax(event) {
    if (reduceMotion.matches) {
      return;
    }

    /*
       Guarda sempre a posição mais recente. Se vários pointermove
       ocorrerem antes do próximo frame, somente esses valores mais
       novos serão utilizados.
    */
    pointerX = event.clientX;
    pointerY = event.clientY;

    /*
       Se já existe uma atualização agendada para o próximo frame,
       não precisamos criar outra.
    */
    if (parallaxFrame !== null) {
      return;
    }

    parallaxFrame = window.requestAnimationFrame(() => {
      const mouseX = pointerX / window.innerWidth - 0.5;
      const mouseY = pointerY / window.innerHeight - 0.5;

      const movement = window.innerWidth < 700 ? 10 : 18;

      mathLayer.style.transform =
        `translate(${mouseX * movement}px, ${mouseY * movement}px)`;

      /*
         Libera o controle para que o próximo movimento possa
         agendar uma nova atualização.
      */
      parallaxFrame = null;
    });
  }

  document.addEventListener(
    "pointermove",
    updateBackgroundParallax,
  );

  document.addEventListener("pointerleave", () => {
    if (reduceMotion.matches) {
      return;
    }

    /*
       Cancela um frame ainda pendente para que uma posição antiga
       do ponteiro não seja aplicada depois que ele sair da página.
    */
    if (parallaxFrame !== null) {
      window.cancelAnimationFrame(parallaxFrame);
      parallaxFrame = null;
    }

    mathLayer.style.transform = "translate(0, 0)";
  });

  /* ========================
     RESIZE COM DEBOUNCE
     --------------------------------------------------------
     O evento resize pode disparar dezenas de vezes enquanto a
     janela ainda está sendo redimensionada.

     O timer reinicia a cada evento e o layout só é recalculado
     depois que os eventos diminuem por aproximadamente 180 ms.
  ======================== */

  let resizeTimer = null;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(
      layoutMathBackground,
      180,
    );
  });

  /* Executa o primeiro layout assim que o sistema é inicializado. */
  layoutMathBackground();
}

/* ==========================
   API PÚBLICA
   ---------------------------------------------------------
   Expõe somente a função necessária para que main.js possa
   inicializar o background matemático.
========================== */

globalThis.NE84Background = {
  initMathBackground,
};