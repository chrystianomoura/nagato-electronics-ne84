"use strict";

/* =========================================================
   NE-84 — RELÓGIO E DATA
   ---------------------------------------------------------
   Responsabilidade única: manter o relógio e a data do visor
   sincronizados com o horário local do dispositivo.
========================================================= */

/* ==========================
   MESES ABREVIADOS
   ---------------------------------------------------------
   O método getMonth() do JavaScript retorna valores de 0 a 11.
   Por isso, JAN ocupa o índice 0 e DEC ocupa o índice 11.
========================== */

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/* ==========================
   INICIALIZAÇÃO DO RELÓGIO
========================== */

function initClock() {
  const clock = document.querySelector("#clock");
  const date = document.querySelector("#date");

  /* Evita erro caso o script seja reutilizado sem esses elementos. */
  if (!clock || !date) {
    return;
  }

  /* ==========================
     ATUALIZAÇÃO DO VISOR
     ---------------------------------------------------------
     Cria uma nova data a cada execução para obter o horário
     atual do dispositivo.
  ========================== */

  function updateDateTime() {
    const now = new Date();

    /* padStart garante sempre dois dígitos: 08:04:09. */
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");
    const month = MONTHS[now.getMonth()];
    const year = now.getFullYear();

    clock.textContent = `${hours}:${minutes}:${seconds}`;
    date.textContent = `${day} ${month} ${year}`;
  }

  /*
     Executa uma vez imediatamente para evitar que o visor
     permaneça com o valor inicial até o primeiro intervalo.
     Depois disso, atualiza o relógio a cada 1000 ms (1 segundo).
  */
  updateDateTime();
  window.setInterval(updateDateTime, 1000);
}

/* ==========================
   API PÚBLICA
   ---------------------------------------------------------
   Expõe apenas a função necessária para que main.js possa
   inicializar o relógio.
========================== */

globalThis.NE84Clock = { initClock };