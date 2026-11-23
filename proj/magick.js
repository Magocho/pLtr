/* Matriz inputs */
const clueBffr = document.querySelectorAll(".idica");
const resBffr  = document.querySelectorAll(".iletra");

/* Todos os botões */
const initBtn    = document.getElementById("preparar");
const verfBtn    = document.getElementById("verif");
const reservaBtn = document.getElementById("reserva");
const fecharBtn  = document.getElementById("fechar");
const okBtn      = document.getElementById("okPopUp");
const randomBtn  = document.getElementById("sorte");

/* Elementos de show e hidden */
const cmt          = document.getElementById("comment");
const popUp        = document.getElementById("popUp");
const timerDisplay = document.getElementById("timer");
const popUpNum     = document.getElementById("mNumero");

/* Ah... var globais */
let id            = 1;
let ok            = new Array(20).fill(false);
let res           = new Array(20);
let clue          = new Array(5)
let puzzles       = [];
let segundos      = 0;
let timerInterval = null;

async function loadPuzzles() {
  const response = await fetch("s.txt");
  const txt = await response.text();

  puzzles = txt.trim().split(/\r?\n/);
}

function fgetD(n) {
  let palavras = puzzles[n - 1].split(/\s+/);
  let i, j, k = 0;
  i = j = 0;
  for(let s of palavras) {
    for(let c of s) {
      if([4, 8, 12, 16, 20].includes(k)) {
        clue[i++] = c;
      } else {
        res[j++] = c;
      }
      k++;
    }
  }
}

function existeLinOuCol(c, p) {
  let linMax = p / 4;
  let colMax = p % 4;
  for(let jj = 0; jj < 4; jj++) {    
    if(!ok[jj + 4*linMax] && res[jj + 4*linMax] === c)
      return true;

    if(!ok[jj*4 + colMax] && res[jj*4 + colMax] === c)
      return true;
  }
  return false;
}

async function init() {
  await loadPuzzles();
  ok.fill(false);

  fgetD(id);

  resBffr.forEach(e => {
    e.readOnly = false;
    e.disabled = false;
    e.style.borderColor = "black";
  });

  let i = 0;
  clueBffr.forEach(e => {
    e.value = clue[i++];
    e.style.borderColor = "blue";
  });
}

function startTimer() {
  clearInterval(timerInterval);
  segundos = 0;
  timerDisplay.style.visibility = "visible";
  timerDisplay.textContent = "00:00";

  timerInterval = setInterval(() => {
    segundos++;
    let min = Math.floor(segundos / 60);
    let sec = segundos % 60;
    timerDisplay.textContent = String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function doVerif() {
  let i = 0;
  for(let b of ok) {
    if(!b) {
      if(res[i] === resBffr[i].value.toLowerCase()) {
        console.log(i, res[i], resBffr[i].value);
        ok[i] = true;
        resBffr[i].readOnly = true;
        resBffr[i].disabled = true;
        resBffr[i].style.borderColor = "lightgreen";
        resBffr[i].style.fontColor = "black";
      } else {
        resBffr[i].style.borderColor = "#FF746C";
      }
    }
    i++;
  }

  i = 0;
  for(let b of ok) {
    if(!b) {
      if(existeLinOuCol(resBffr[i].value, i)) {
        resBffr[i].style.borderColor = "yellow";
      } 
    }
    i++;
  }
}

function ganhou() {
  for(let b of ok) {
    if(!b) return false;
  }
  return true;
}

function allFill() {
  for(let c of resBffr) {
    if(c.value.length !== 1 || !"abcdefghijklmnopqrstuvwxyz".includes(c.value.toLowerCase()))
      return false;
  }
  return true;
}

function fimOk() {
  if(!allFill())
    return;

  doVerif();
  if(ganhou()) {
    stopTimer();
    initBtn.textContent = "Start";
    cmt.style.visibility = "visible";
    cmt.textContent = "\nOh...\nUma matriz completa.\nQue raridade!";
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

verfBtn.addEventListener("click", function() { fimOk(); });
initBtn.addEventListener("click", 
  function() {  
    resBffr.forEach(e => { e.value = ""; });
    init();
    startTimer();
    initBtn.textContent = "Reset";
  });

reservaBtn.addEventListener("click", () => { popUp.showModal(); });
fecharBtn.addEventListener("click", () => { popUp.close(); });

okBtn.addEventListener("click", 
  function() {
    const n = Number(popUpNum.value);

    if(!Number.isInteger(n) || n < 1 || n > 366) {
      popUpNum.focus();
      return;
    }

    id = n;
    popUp.close();

  
    init();
    startTimer();
    initBtn.textContent = "Reset";
  });

randomBtn.addEventListener("mouseenter", () => { randomBtn.textContent = "Lucky?"; });
randomBtn.addEventListener("mouseleave", () => { randomBtn.textContent = "Puzzle:"; });
randomBtn.addEventListener("click", function() { popUpNum.value = getRandomInt(1, 366); });

function mover(init, passos) {
  let p = init + passos;

  while(p >= 0 && p < resBffr.length) {
    if(!ok[p]) {
      resBffr[p].focus();
      return;
    }
    p += passos;
  }
}

resBffr.forEach((e, i) => {
  // depois input vá próximo...
  e.addEventListener("input", function() {
    if(this.value.length > 0) {
      mover(i, 1);
    }
  });

  // mover pela seta
  e.addEventListener("keydown", function(event) {
    let loop = true;
    switch(event.key) {
      case "ArrowRight":
        event.preventDefault();
        mover(i, 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        mover(i, -1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if(i === 13 || i === 16 || i === 10)
          mover(i, -7);
        else
          mover(i, -4);
        break;
      case "ArrowDown":
        event.preventDefault();
        if(i === 3 || i === 6 || i === 9)
          mover(i, 7);
        else
          mover(i, 4)
        break;
      case "Backspace":
        if(this.value === "") {
          mover(i, -1);
        }
        break;
      case "Enter":
        event.preventDefault();
        fimOk();
        break;
    }
  });
});

window.addEventListener("load", async () => {
  try {
    let response = await fetch("./s.txt");

    console.log("Status:", response.status);

    let txt = await response.text();

    console.log("First line:", txt.split(/\r?\n/)[0]);

    ok.fill(false);

    resBffr.forEach(e => {
        e.value = "";
        e.readOnly = true;
        e.disabled = true;
        e.style.borderColor = "";
    });

    clueBffr.forEach(e => {
        e.value = "";
    });

    clearInterval(timerInterval);
    segundos = 0;
    timerDisplay.textContent = "00:00";
  } catch(err) {
    console.error(err);
  }
});
