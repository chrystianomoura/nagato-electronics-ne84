"use strict";

/* =========================================================
   NE-84 — PONTO DE ENTRADA
   ---------------------------------------------------------
   calculator.js, clock.js e background.js definem sistemas
   independentes e expõem suas APIs em globalThis.

   Como os scripts são carregados com o atributo defer,
   este arquivo é executado somente depois que o HTML foi
   interpretado pelo navegador.

   Sua única responsabilidade é inicializar os sistemas.
========================================================= */

globalThis.NE84Calculator?.initCalculator();
globalThis.NE84Clock?.initClock();
globalThis.NE84Background?.initMathBackground();