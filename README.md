# NAGATO ELECTRONICS — NE-84

A **NE-84** é uma calculadora retrô interativa inspirada na estética tecnológica japonesa dos anos 1980.

O projeto combina uma interface construída sobre uma arte visual própria, visor digital funcional, suporte a mouse, toque e teclado, relógio em tempo real e um background matemático distribuído dinamicamente.

Além de funcionar como projeto de portfólio, seu código foi organizado por responsabilidades e comentado para também servir como material de estudo de **HTML, CSS e JavaScript**.

## Projeto online

Acesse a versão publicada da NE-84:

**[Ver projeto online](https://chrystianomoura.github.io/nagato-electronics-ne84/)**

## Funcionalidades

- Operações de soma, subtração, multiplicação e divisão.
- Porcentagem com comportamento contextual.
- Alteração de sinal (`+/-`).
- Suporte a números decimais.
- Tratamento de divisão por zero com `ERROR`.
- Repetição da última operação ao pressionar `=` novamente.
- Limite de 11 dígitos no visor.
- Notação científica para resultados que ultrapassam o espaço disponível.
- Relógio e data em tempo real.
- Controle por clique, toque e teclado físico.
- Suporte ao teclado numérico (`Numpad`).
- Background com 100 fórmulas matemáticas.
- Distribuição responsiva das fórmulas com prevenção de colisões.
- Parallax suave no background.
- Respeito à preferência `prefers-reduced-motion`.
- Testes automatizados da lógica da calculadora.

## Tecnologias utilizadas

- **HTML5**
- **CSS3**
- **JavaScript**
- **Node.js** — utilizado para executar os testes automatizados.
- **node:test** — test runner nativo do Node.js.

O projeto não utiliza frameworks ou bibliotecas JavaScript externas.

## Estrutura do projeto

```text
calculator/
├── index.html
├── README.md
├── package.json
├── .gitignore
│
├── estilos/
│   └── style.css
│
├── imagens/
│   └── ne84-calculator.png
│
├── scripts/
│   ├── calculator.js
│   ├── clock.js
│   ├── background.js
│   └── main.js
│
└── tests/
    └── calculator.test.js
```

### `index.html`

Define a estrutura principal da aplicação, incluindo a cena, as expressões matemáticas do background, o visor digital e as áreas interativas posicionadas sobre as teclas presentes na imagem da calculadora.

Também utiliza elementos HTML apropriados e atributos de acessibilidade para fornecer significado adicional aos controles da interface.

### `style.css`

Controla toda a apresentação visual da NE-84, incluindo:

- cenário e background;
- posicionamento da calculadora;
- visor digital;
- áreas interativas das teclas;
- estados visuais de interação;
- animações;
- responsividade;
- redução de movimento.

Grande parte do posicionamento utiliza valores proporcionais para manter os elementos alinhados à imagem da calculadora em diferentes tamanhos de tela.

### `calculator.js`

Responsável pela lógica matemática e pelas interações da calculadora.

É dividido em duas partes principais:

1. **`CalculatorEngine`** — motor independente do DOM responsável por armazenar o estado e executar as operações da calculadora.
2. **`initCalculator()`** — camada de interface responsável por conectar o motor ao HTML, aos cliques, ao teclado físico e aos efeitos de interação.

Essa separação permite testar a lógica da calculadora diretamente no Node.js, sem depender do navegador ou da interface gráfica.

### `clock.js`

Responsável pelo relógio e pela data exibidos no visor.

Obtém o horário local do dispositivo e atualiza as informações uma vez por segundo.

### `background.js`

Responsável pela distribuição dinâmica das fórmulas matemáticas no cenário.

O arquivo controla a quantidade, o tamanho, a rotação e o posicionamento das expressões de acordo com o espaço disponível. Para evitar sobreposições de forma mais eficiente, utiliza um **Spatial Hash**, reduzindo a quantidade de comparações necessárias durante a detecção de colisões.

Também é responsável por:

- geração pseudoaleatória baseada em seed;
- quantidade responsiva de fórmulas;
- variação de tamanho e rotação;
- prevenção de sobreposição;
- parallax;
- recálculo do layout após o redimensionamento da janela.

### `main.js`

É o ponto de entrada da aplicação.

Depois que os scripts responsáveis por cada parte do projeto disponibilizam suas APIs, o `main.js` inicializa:

- calculadora;
- relógio;
- background matemático.

Essa abordagem mantém as responsabilidades separadas e centraliza a inicialização da aplicação.

### `tests/calculator.test.js`

Contém a bateria de testes automatizados do `CalculatorEngine`.

Os testes verificam operações comuns e casos extremos, incluindo:

- operações aritméticas;
- números decimais;
- porcentagem;
- números negativos;
- divisão por zero;
- recuperação após `ERROR`;
- repetição de `=`;
- troca de operadores;
- limite de dígitos;
- comportamento do `Backspace`;
- precisão decimal;
- valores não numéricos (`NaN`);
- formatação de resultados.

## Controles pelo teclado

| Tecla | Ação |
| --- | --- |
| `0`–`9` | Números |
| `+` | Soma |
| `-` | Subtração |
| `*` | Multiplicação |
| `/` | Divisão |
| `%` | Porcentagem |
| `.` ou `,` | Decimal |
| `Enter` ou `=` | Resultado |
| `Escape` | AC |
| `Backspace` | Apaga o último dígito |

O teclado numérico (`Numpad`) também é suportado.

## Executando o projeto

Por ser uma aplicação front-end sem processo de build, o projeto pode ser executado diretamente no navegador.

Durante o desenvolvimento, também pode ser utilizado um servidor local, como o **Live Server** do VS Code.

## Executando os testes

O projeto utiliza o test runner nativo do Node.js, portanto não é necessário instalar Jest, Vitest ou outra biblioteca de testes.

Com **Node.js 18 ou superior**, execute na raiz do projeto:

```bash
npm test
```

A suíte atual possui **37 testes automatizados**.

## Conceitos que podem ser estudados neste projeto

### HTML

- HTML semântico.
- Atributos ARIA.
- Elementos interativos.
- Atributos `data-*`.
- Organização estrutural de uma aplicação.

### CSS

- Posicionamento absoluto.
- Coordenadas proporcionais.
- `aspect-ratio`.
- Container Query Units (`cqw`).
- Media queries.
- Pseudo-classes de interação.
- Animações com `@keyframes`.
- Gradientes.
- Responsividade.
- `prefers-reduced-motion`.

### JavaScript

- Manipulação do DOM.
- Eventos de mouse, toque e teclado.
- Estado da aplicação.
- Classes e métodos.
- Encapsulamento de lógica.
- Funções puras.
- Tratamento de erros.
- Timers com `setTimeout` e `setInterval`.
- Debounce.
- `requestAnimationFrame`.
- Geração pseudoaleatória com seed.
- Detecção de colisões.
- Spatial Hash.
- Separação de responsabilidades.
- Testes automatizados com `node:test`.

## Arquitetura

A aplicação divide suas principais responsabilidades entre quatro arquivos:

```text
calculator.js  → lógica e interface da calculadora
clock.js       → relógio e data
background.js  → fórmulas matemáticas e parallax
main.js        → inicialização da aplicação
```

A lógica principal da calculadora permanece isolada da interface através do `CalculatorEngine`.

Essa separação facilita:

- testes automatizados;
- manutenção;
- leitura do código;
- identificação de responsabilidades;
- evolução futura do projeto.

## Filosofia do projeto

A NE-84 foi desenvolvida com duas metas principais: possuir uma identidade visual própria e manter uma base de código compreensível.

Por isso, os arquivos são divididos em seções e possuem comentários que explicam responsabilidades, conceitos e decisões relevantes sem substituir a leitura do próprio código.

A intenção é que o projeto possa ser explorado tanto como aplicação funcional quanto como referência de estudo para quem estiver aprendendo desenvolvimento front-end.