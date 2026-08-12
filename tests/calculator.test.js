import test from "node:test";
import assert from "node:assert/strict";

/* =========================================================
   NE-84 — TESTES AUTOMATIZADOS
   ---------------------------------------------------------
   Estes testes verificam somente o motor da calculadora.
   Eles não precisam abrir navegador nem renderizar o HTML.

   Para executar:
   npm test
========================================================= */

/*
   O calculator.js registra sua API em globalThis para funcionar
   tanto como script clássico no navegador quanto nos testes Node.
*/
import "../scripts/calculator.js";

const { CalculatorEngine, calculate, formatResult } = globalThis.NE84Calculator;

/* ==========================
   FUNÇÃO AUXILIAR
   ---------------------------------------------------------
   Simula uma sequência de teclas e devolve o valor atual do
   visor. Ex.: press(calc, "2", "+", "3", "=") -> "5".
========================== */

function press(calculator, ...keys) {
  for (const key of keys) {
    calculator.input(key);
  }

  return calculator.displayValue;
}

/* ==========================
   ESTADO INICIAL E ENTRADA
========================== */

test("inicia exibindo zero", () => {
  const calculator = new CalculatorEngine();
  assert.equal(calculator.displayValue, "0");
});

test("concatena números digitados", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "1", "2", "3"), "123");
});

test("limita a entrada a 11 dígitos", () => {
  const calculator = new CalculatorEngine();
  press(calculator, ..."123456789012345".split(""));
  assert.equal(calculator.displayValue, "12345678901");
});

test("substitui o zero inicial pelo primeiro dígito", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "0", "0", "7"), "7");
});

/* ==========================
   DECIMAIS
========================== */

test("não permite dois pontos decimais", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "1", ".", "2", ".", "3"), "1.23");
});

test("ponto decimal inicia em 0.", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "."), "0.");
});

test("decimal após operador inicia novo número em 0.", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "5", "+", ".", "5", "="), "5.5");
});

/* ==========================
   OPERAÇÕES ARITMÉTICAS
========================== */

test("soma corretamente", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "2", "+", "3", "="), "5");
});

test("subtrai corretamente", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "9", "-", "4", "="), "5");
});

test("multiplica corretamente", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "7", "*", "8", "="), "56");
});

test("divide corretamente", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "8", "/", "2", "="), "4");
});

test("operações encadeadas seguem comportamento de calculadora simples", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "2", "+", "3", "*", "4", "="), "20");
});

test("trocar operador antes do segundo número usa o operador mais recente", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "8", "+", "*", "2", "="), "16");
});

test("trocar operador para subtração mantém o estado consistente", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "8", "+", "-", "2", "="), "6");
});

/* ==========================
   REPETIÇÃO DO IGUAL
========================== */

test("repete a última operação ao pressionar = novamente", () => {
  const calculator = new CalculatorEngine();

  assert.equal(press(calculator, "5", "+", "2", "="), "7");
  assert.equal(press(calculator, "="), "9");
  assert.equal(press(calculator, "="), "11");
});

test("pressionar = sem operação não altera o visor", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "5", "="), "5");
});

/* ==========================
   PORCENTAGEM
========================== */

test("200 + 10% resulta em 220", () => {
  const calculator = new CalculatorEngine();
  assert.equal(
    press(calculator, "2", "0", "0", "+", "1", "0", "%", "="),
    "220",
  );
});

test("200 - 10% resulta em 180", () => {
  const calculator = new CalculatorEngine();
  assert.equal(
    press(calculator, "2", "0", "0", "-", "1", "0", "%", "="),
    "180",
  );
});

test("200 * 10% resulta em 20", () => {
  const calculator = new CalculatorEngine();
  assert.equal(
    press(calculator, "2", "0", "0", "*", "1", "0", "%", "="),
    "20",
  );
});

test("200 / 10% resulta em 2000", () => {
  const calculator = new CalculatorEngine();
  assert.equal(
    press(calculator, "2", "0", "0", "/", "1", "0", "%", "="),
    "2000",
  );
});

test("porcentagem isolada divide por 100", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "5", "0", "%"), "0.5");
});

/* ==========================
   SINAL E BACKSPACE
========================== */

test("troca o sinal do número", () => {
  const calculator = new CalculatorEngine();

  assert.equal(press(calculator, "5", "+/-"), "-5");
  assert.equal(press(calculator, "+/-"), "5");
});

test("não transforma zero em -0", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "+/-"), "0");
});

test("backspace remove o último dígito", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "1", "2", "3", "BACKSPACE"), "12");
});

test("backspace volta a zero ao apagar o último dígito", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "8", "BACKSPACE"), "0");
});

test("backspace remove corretamente o último dígito de número negativo", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "1", "2", "+/-", "BACKSPACE"), "-1");
});

/* ==========================
   AC E ERROS
========================== */

test("AC limpa todo o estado", () => {
  const calculator = new CalculatorEngine();

  press(calculator, "9", "+", "3");
  calculator.input("AC");

  assert.equal(calculator.displayValue, "0");
  assert.equal(calculator.displayOperator, "");
});

test("divisão por zero mostra ERROR", () => {
  const calculator = new CalculatorEngine();

  const firstInput = calculator.input("8");
  assert.equal(firstInput.effect, "none");

  press(calculator, "/", "0");

  const equalResult = calculator.input("=");

  assert.equal(calculator.displayValue, "ERROR");
  assert.equal(equalResult.effect, "error");
});

test("digitar após ERROR inicia novo cálculo", () => {
  const calculator = new CalculatorEngine();

  press(calculator, "8", "/", "0", "=");

  assert.equal(press(calculator, "7"), "7");
});

test("AC após ERROR retorna o visor a zero", () => {
  const calculator = new CalculatorEngine();

  press(calculator, "8", "/", "0", "=");

  assert.equal(press(calculator, "AC"), "0");
});

/* ==========================
   FORMATAÇÃO DO VISOR
========================== */

test("resultado grande cabe no display usando notação científica", () => {
  assert.ok(formatResult(123456789012345).length <= 11);
});

test("resultado não finito vira ERROR", () => {
  assert.equal(formatResult(Infinity), "ERROR");
});

test("resultado NaN vira ERROR", () => {
  assert.equal(formatResult(NaN), "ERROR");
});

test("resultado decimal longo usa notação científica para caber no visor", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, "1", "/", "3", "="), "3.33333e-1");
});

test("0.1 + 0.2 é formatado como 0.3", () => {
  const calculator = new CalculatorEngine();
  assert.equal(press(calculator, ".", "1", "+", ".", "2", "="), "0.3");
});

/* ==========================
   FUNÇÕES MATEMÁTICAS ISOLADAS
========================== */

test("calculate soma valores diretamente", () => {
  assert.equal(calculate(10, 5, "+"), 15);
});

test("calculate retorna null para divisão por zero", () => {
  assert.equal(calculate(10, 0, "/"), null);
});