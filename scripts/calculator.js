"use strict";

/* =========================================================
   NE-84 — MOTOR E INTERFACE DA CALCULADORA
   ---------------------------------------------------------
   Este arquivo tem duas responsabilidades claramente
   separadas:

   1) CalculatorEngine
      Guarda o estado e executa toda a lógica matemática.
      Ele não depende do HTML e, por isso, pode ser testado
      diretamente pelo Node.js.

   2) initCalculator()
      Conecta o motor aos elementos visuais da página,
      tratando cliques, teclado físico e animações.

   Essa separação facilita manutenção, testes e estudo.
========================================================= */

/* ==========================
   CONFIGURAÇÕES DO VISOR
========================== */

const MAX_DIGITS = 11;
const MAX_DISPLAY_CHARS = 11;
const ERROR_TEXT = "ERROR";

const OPERATOR_SYMBOLS = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

/* ==========================
   MAPEAMENTO DO TECLADO
   ---------------------------------------------------------
   Estes objetos traduzem teclas físicas para os mesmos valores
   utilizados pelos botões da calculadora.

   Como esse mapeamento é fixo, ele fica fora do evento keydown
   e é criado apenas uma vez durante o carregamento do script.
========================== */

const KEY_MAP = {
  Enter: "=",
  "=": "=",
  Escape: "AC",
  Backspace: "BACKSPACE",
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "%": "%",
  ".": ".",
  ",": ".",
};

const NUMPAD_MAP = {
  NumpadAdd: "+",
  NumpadSubtract: "-",
  NumpadMultiply: "*",
  NumpadDivide: "/",
  NumpadEnter: "=",
  NumpadDecimal: ".",
};

/* ==========================
   FUNÇÕES PURAS
   ---------------------------------------------------------
   Funções puras não acessam DOM nem alteram estado externo.
   Recebem valores e devolvem um resultado previsível.
   Isso as torna especialmente fáceis de testar.
========================== */

function calculate(firstNumber, secondNumber, selectedOperator) {
  switch (selectedOperator) {
    case "+":
      return firstNumber + secondNumber;

    case "-":
      return firstNumber - secondNumber;

    case "*":
      return firstNumber * secondNumber;

    case "/":
      return secondNumber === 0 ? null : firstNumber / secondNumber;

    default:
      return secondNumber;
  }
}

function formatResult(number) {
  if (!Number.isFinite(number)) {
    return ERROR_TEXT;
  }

  /*
     toPrecision limita a quantidade total de algarismos
     significativos e ajuda a evitar resultados como
     0.30000000000000004 no visor.
  */
  const rounded = Number.parseFloat(number.toPrecision(MAX_DIGITS));
  const normalResult = String(rounded);

  if (normalResult.length <= MAX_DISPLAY_CHARS) {
    return normalResult;
  }

  /*
     Se o valor não couber no visor normal, tentamos notação
     científica com precisões progressivamente menores.
  */
  for (let precision = 5; precision >= 0; precision--) {
    const scientificResult = number.toExponential(precision);

    if (scientificResult.length <= MAX_DISPLAY_CHARS) {
      return scientificResult;
    }
  }

  return number.toExponential(0);
}

/* ==========================
   MOTOR DA CALCULADORA
   ---------------------------------------------------------
   A classe concentra todo o estado necessário para simular
   uma calculadora simples. Nenhuma linha desta classe depende
   de document, window ou qualquer elemento visual.
========================== */

class CalculatorEngine {
  constructor() {
    this.clear();
  }

  /* Estado somente-leitura exposto para a interface e testes. */
  get displayValue() {
    return this.currentValue;
  }

  get displayOperator() {
    return this.operator ? OPERATOR_SYMBOLS[this.operator] : "";
  }

  /* ========================
     LIMPEZA DE ESTADO
  ======================== */

  clear() {
    this.currentValue = "0";
    this.previousValue = null;
    this.operator = null;
    this.waitingForNumber = false;
    this.lastOperator = null;
    this.lastOperand = null;

    return { effect: "none" };
  }

  resetAfterError() {
    this.clear();
  }

  setError() {
    this.currentValue = ERROR_TEXT;
    this.previousValue = null;
    this.operator = null;
    this.waitingForNumber = false;
    this.lastOperator = null;
    this.lastOperand = null;

    return { effect: "error" };
  }

  /* ========================
     ENTRADA DE NÚMEROS
  ======================== */

  addNumber(number) {
    if (this.currentValue === ERROR_TEXT) {
      this.resetAfterError();
      this.currentValue = number;
      return { effect: "none" };
    }

    if (this.waitingForNumber) {
      this.currentValue = number;
      this.waitingForNumber = false;
      return { effect: "none" };
    }

    const digits = this.currentValue.replace("-", "").replace(".", "");

    if (digits.length >= MAX_DIGITS) {
      return { effect: "none" };
    }

    this.currentValue =
      this.currentValue === "0" ? number : this.currentValue + number;

    return { effect: "none" };
  }

  addDecimal() {
    if (this.currentValue === ERROR_TEXT) {
      this.resetAfterError();
      this.currentValue = "0.";
      return { effect: "none" };
    }

    if (this.waitingForNumber) {
      this.currentValue = "0.";
      this.waitingForNumber = false;
      return { effect: "none" };
    }

    if (!this.currentValue.includes(".")) {
      this.currentValue += ".";
    }

    return { effect: "none" };
  }

  /* ========================
     OPERADORES
  ======================== */

  selectOperator(newOperator) {
    if (this.currentValue === ERROR_TEXT) {
      return { effect: "none" };
    }

    const currentNumber = Number(this.currentValue);

    /*
       Se já existe uma operação completa aguardando, o motor
       calcula o resultado parcial antes de registrar o novo
       operador. Ex.: 2 + 3 × resulta primeiro em 5.
    */
    if (
      this.previousValue !== null &&
      this.operator !== null &&
      !this.waitingForNumber
    ) {
      const result = calculate(
        this.previousValue,
        currentNumber,
        this.operator,
      );

      if (result === null) {
        return this.setError();
      }

      this.currentValue = formatResult(result);
      this.previousValue = Number(this.currentValue);
    } else {
      this.previousValue = currentNumber;
    }

    this.operator = newOperator;
    this.waitingForNumber = true;

    /* Uma nova operação cancela a repetição do último '='. */
    this.lastOperator = null;
    this.lastOperand = null;

    return { effect: "none" };
  }

  /* ========================
     RESULTADO (=)
  ======================== */

  showResult() {
    if (
      this.previousValue !== null &&
      this.operator !== null &&
      this.currentValue !== ERROR_TEXT
    ) {
      const currentNumber = Number(this.currentValue);
      const selectedOperator = this.operator;

      const result = calculate(
        this.previousValue,
        currentNumber,
        selectedOperator,
      );

      if (result === null) {
        return this.setError();
      }

      /*
         Guardamos os últimos operandos para permitir:
         5 + 2 = 7, depois = 9, depois = 11...
      */
      this.lastOperator = selectedOperator;
      this.lastOperand = currentNumber;

      this.currentValue = formatResult(result);
      this.previousValue = null;
      this.operator = null;
      this.waitingForNumber = true;

      return { effect: "result" };
    }

    if (
      this.lastOperator !== null &&
      this.lastOperand !== null &&
      this.currentValue !== ERROR_TEXT
    ) {
      const result = calculate(
        Number(this.currentValue),
        this.lastOperand,
        this.lastOperator,
      );

      if (result === null) {
        return this.setError();
      }

      this.currentValue = formatResult(result);
      this.waitingForNumber = true;

      return { effect: "result" };
    }

    return { effect: "none" };
  }

  /* ========================
     PORCENTAGEM
  ======================== */

  percentage() {
    if (this.currentValue === ERROR_TEXT) {
      return { effect: "none" };
    }

    const value = Number(this.currentValue);

    if (
      this.previousValue !== null &&
      this.operator !== null &&
      !this.waitingForNumber
    ) {
      /*
         Em soma/subtração, 10% de 200 representa 20.
         Em multiplicação/divisão, 10% representa 0.1.
      */
      if (this.operator === "+" || this.operator === "-") {
        this.currentValue = formatResult(
          this.previousValue * (value / 100),
        );
      } else {
        this.currentValue = formatResult(value / 100);
      }

      return { effect: "none" };
    }

    this.currentValue = formatResult(value / 100);

    return { effect: "none" };
  }

  /* ========================
     SINAL (+/-)
  ======================== */

  toggleSign() {
    if (this.currentValue === "0" || this.currentValue === ERROR_TEXT) {
      return { effect: "none" };
    }

    this.currentValue = this.currentValue.startsWith("-")
      ? this.currentValue.slice(1)
      : `-${this.currentValue}`;

    return { effect: "none" };
  }

  /* ========================
     BACKSPACE
  ======================== */

  backspace() {
    if (this.currentValue === ERROR_TEXT) {
      return this.clear();
    }

    if (this.waitingForNumber) {
      return { effect: "none" };
    }

    if (
      this.currentValue.length === 1 ||
      (this.currentValue.startsWith("-") && this.currentValue.length === 2)
    ) {
      this.currentValue = "0";
      return { effect: "none" };
    }

    this.currentValue = this.currentValue.slice(0, -1);

    if (this.currentValue === "-") {
      this.currentValue = "0";
    }

    return { effect: "none" };
  }

  /* ========================
     ROTEADOR DE ENTRADA
     --------------------------------------------------------
     Mouse e teclado chamam o mesmo método. Isso evita manter
     duas lógicas diferentes para a mesma calculadora.
  ======================== */

  input(value) {
    if (/^[0-9]$/.test(value)) {
      return this.addNumber(value);
    }

    switch (value) {
      case ".":
        return this.addDecimal();

      case "AC":
        return this.clear();

      case "BACKSPACE":
        return this.backspace();

      case "+/-":
        return this.toggleSign();

      case "%":
        return this.percentage();

      case "+":
      case "-":
      case "*":
      case "/":
        return this.selectOperator(value);

      case "=":
        return this.showResult();

      default:
        return { effect: "none" };
    }
  }
}

/* ==========================
   INTERFACE COM O DOM
   ---------------------------------------------------------
   Esta função só é chamada no navegador pelo main.js.
   Assim, o Node.js consegue importar este arquivo nos testes
   sem precisar simular document ou window.
========================== */

function initCalculator() {
  const displayResult = document.querySelector("#display-result");
  const displayOperator = document.querySelector("#display-operator");
  const keys = document.querySelectorAll(".key");

  if (!displayResult || !displayOperator || keys.length === 0) {
    return;
  }

  const calculator = new CalculatorEngine();

  /*
     WeakMap associa cada botão ao seu próprio timer de animação.

     Como as chaves são os próprios elementos do DOM, o WeakMap
     não mantém referências desnecessárias caso algum elemento
     deixe de existir.
  */
  const keyAnimationTimers = new WeakMap();

  /* Atualiza somente os textos que pertencem ao visor. */
  function renderDisplay() {
    displayResult.textContent = calculator.displayValue;
    displayOperator.textContent = calculator.displayOperator;
  }

  /* ========================
     ANIMAÇÕES DO VISOR
  ======================== */

  function pulseResult() {
    displayResult.classList.remove("result-pulse");

    /*
       Ler offsetWidth força o navegador a recalcular o layout.

       Isso permite reiniciar a animação CSS mesmo quando a classe
       é removida e adicionada novamente em sequência rápida.
       O void deixa explícito que precisamos apenas provocar essa
       leitura, sem utilizar o valor retornado.
    */
    void displayResult.offsetWidth;

    displayResult.classList.add("result-pulse");

    window.setTimeout(() => {
      displayResult.classList.remove("result-pulse");
    }, 160);
  }

  function flashError() {
    displayResult.classList.remove("error-flash");

    /* Força o reflow para permitir reiniciar a animação de erro. */
    void displayResult.offsetWidth;

    displayResult.classList.add("error-flash");

    window.setTimeout(() => {
      displayResult.classList.remove("error-flash");
    }, 500);
  }

  /* ========================
     PROCESSAMENTO DA ENTRADA
  ======================== */

  /*
     Envia a entrada para o motor e depois sincroniza o DOM com
     o novo estado da calculadora.
  */
  function handleInput(value) {
    const { effect } = calculator.input(value);

    if (value === "AC") {
      displayResult.classList.remove("result-pulse", "error-flash");
    }

    renderDisplay();

    if (effect === "result") {
      pulseResult();
    } else if (effect === "error") {
      flashError();
    }
  }

  /* ========================
     ANIMAÇÃO DO TECLADO FÍSICO
  ======================== */

  /*
     Faz a área invisível do botão parecer pressionada quando
     a mesma operação é acionada pelo teclado físico.

     Se a tecla for pressionada novamente antes do fim da
     animação anterior, o timer antigo é cancelado para evitar
     conflitos entre as remoções da classe key-pressed.
  */
  function animatePhysicalKey(value) {
    const key = document.querySelector(`.key[data-key="${value}"]`);

    if (!key) {
      return;
    }

    key.classList.add("key-pressed");

    const previousTimer = keyAnimationTimers.get(key);

    if (previousTimer) {
      window.clearTimeout(previousTimer);
    }

    const timer = window.setTimeout(() => {
      key.classList.remove("key-pressed");
      keyAnimationTimers.delete(key);
    }, 110);

    keyAnimationTimers.set(key, timer);
  }

  /* ========================
     CLIQUES / TOQUES
  ======================== */

  keys.forEach((key) => {
    key.addEventListener("click", () => {
      handleInput(key.dataset.key);
    });
  });

  /* ========================
     TECLADO FÍSICO
     --------------------------------------------------------
     Escape = AC
     Backspace = apagar dígito
     Enter / = = resultado
     Vírgula ou ponto = decimal
     Numpad também é suportado.
  ======================== */

  document.addEventListener("keydown", (event) => {
    let value = null;

    /*
       event.code identifica as teclas físicas do Numpad.
       event.key identifica o valor digitado no teclado comum.
    */
    if (/^Numpad[0-9]$/.test(event.code)) {
      value = event.code.replace("Numpad", "");
    } else if (NUMPAD_MAP[event.code]) {
      value = NUMPAD_MAP[event.code];
    } else if (/^[0-9]$/.test(event.key)) {
      value = event.key;
    } else {
      value = KEY_MAP[event.key];
    }

    /* Ignora qualquer tecla que não pertença à calculadora. */
    if (!value) {
      return;
    }

    /*
       Impede o comportamento padrão do navegador para as teclas
       que foram reconhecidas como comandos da calculadora.
    */
    event.preventDefault();

    handleInput(value);

    /* Backspace não possui um botão visual próprio na NE-84. */
    if (value !== "BACKSPACE") {
      animatePhysicalKey(value);
    }
  });

  /* Garante que o DOM comece sincronizado com o estado do motor. */
  renderDisplay();
}

/* ==========================
   API PÚBLICA DO ARQUIVO
   ---------------------------------------------------------
   Em vez de variáveis globais soltas, expomos um único objeto
   NE84Calculator.

   O navegador utiliza initCalculator().
   Os testes utilizam CalculatorEngine, calculate e formatResult.
========================== */

globalThis.NE84Calculator = {
  CalculatorEngine,
  calculate,
  formatResult,
  initCalculator,
};