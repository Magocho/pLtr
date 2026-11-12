const bffr = document.getElementById("entrada");
const stdout = document.getElementById("saida");
const selectConversor = document.getElementById("conversorselect");

// mc = [4, 6, 10, 15] https://www.mcdonalds.com.br/cardapio
// bk = [4, 6, 10]     https://www.burgerking.com.br/cardapio/bk-chicken
// bb = [4, 6, 12]     https://bobs.com.br/cardapio/acompanhamentos/franlitos
// obs. franlito foi tem frango empanado
// mas tiras de frango não
// gf = [2, 4, 6]      https://www.giraffas.com.br/cardapio 
// sassami empanado
// Madeiro usei o cardapio madeiro e jeromio obs. não tem por unidade então usei os valores de coxinha

const precedencia = { '+': 1, '-': 1, '?': 2 , '*': 3, '/': 3, '^': 4 };
const mmcB = { 'M': 1, 'K': 2, 'B': 2, 'G': 2, 'J': 2, 'P': 1 };          // mmc já calculados
const nuggetB = { 'M': [4, 6, 10, 15], 'K': [4, 6, 10], 'B': [4, 6, 12],  // coeficientes dos vetor nugget                                    
                  'G': [2, 4, 6], 'J': [8, 16, 24, 32], 'P': [2, 3, 4, 5, 6, 10, 12, 14, 15]};

function combLinNugget(b, B, t) {
  const quant = new Array(b + 1).fill(Infinity);
  const vetor = new Array(b + 1).fill(0);

  quant[0] = 0;

  for(let num = 1; num <= b; num++) {
    for(const nugget of nuggetB[B]) {
      if(nugget <= num && quant[num - nugget] + 1 < quant[num]) {
        quant[num] = quant[num - nugget] + 1;
        vetor[num] = nugget;
      }
    }
  }

  if(quant[b] === Infinity) {
    throw new Error("ERROR: Não é válido para " + B);
  }

  if(t) {
    const res = [];
    let i = b;
    while(i > 0) {
      res.push(vetor[i]);
      i -= vetor[i];
    }
    return res;
  }

  return true;
}

function doOp(op, a, b) {
  switch(op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return a / b;
    case "^": return a ** b;
    default: 
      throw new Error("ERROR: Operador desconhecido " + op);
  }
}

function existeEm(b, B) {
  if(!Number.isInteger(b))
    throw new Error("ERROR: Sintaxe");
  
  if(b % mmcB[B] != 0)
    throw new Error("ERROR: Não é válido para " + B);

  combLinNugget(b, B, false)
  return true;
}

function calculate2(txtEq) {
  let ref = "";
  let fila = [];

  /* filtrar o buffer */
  for(const c of txtEq) { // semelhante a um for(T t : ts)
    if(c === " ") {
      if(ref) {
        fila.push(ref);
        ref = "";
      }
    } else if("+-*/^()?()".includes(c) || "MKBGJP".includes(c)) {
      if(ref) {
        fila.push(ref);
        ref = "";
      }
      fila.push(c);
    } else ref += c;
  }

  if(ref) fila.push(ref);

  const rpn = [];
  const op = [];

  /* transformar buffer em RPN */
  for(const i of fila) {
    if(!Number.isNaN(Number(i))) {  // se num.
      rpn.push(Number(i));
    } else if("MKBGJP".includes(i)) {
      // Trata os conjuntos como operandos
      rpn.push(i);
    } else if(i in precedencia) {
      while(op.length > 0 && op[op.length - 1] !== '(' && precedencia[op[op.length - 1]] >= precedencia[i]) {
        rpn.push(op.pop());
      }
      op.push(i);
    } else if(i === '(') {
      op.push(i);
    } else if(i === ')') {
      while(op.length > 0 && op[op.length - 1] !== '(') {
        rpn.push(op.pop());
      }
      op.pop();
    } else rpn.push(i);
  }

  while (op.length > 0) {
    rpn.push(op.pop());
  }

  fila = [];

  /* calcular RPN*/
  for(let i = 0; i < rpn.length; i++) {

    if(!Number.isNaN(Number(rpn[i]))) {  // se num.
      fila.push(rpn[i]);
    } else if("MKBGJP".includes(rpn[i])) {
      fila.push(rpn[i]);
    } else if("+-*/^".includes(rpn[i])) {  // se op.
      const b = fila.pop();
      const a = fila.pop();
      fila.push(doOp(rpn[i], a, b));
    } else if (rpn[i] === '?') {
      // Operador '?' binário: espera o conjunto à esquerda e o valor numérico à direita (ou vice-versa, dependendo da ordem RPN)
      // Exemplo RPN para "B ? expr": [B, expr, ?] ou [expr, B, ?]
      const bVal = fila.pop();
      const setVal = fila.pop();
      // Identifica qual dos dois é o conjunto e qual é o número
      let conjunto, numero;
      if("MKBGJP".includes(setVal)) {
        conjunto = setVal;
        numero = bVal;
      } else {
        conjunto = bVal;
        numero = setVal;
      }

      existeEm(numero, conjunto);
      fila.push(numero); // Retorna o valor avaliado para continuar a expressão se necessário
    }
  }

  return fila.pop();
}

function fazerCalculo() {    
  try {
    const res = calculate2(bffr.value);

    if(res !== null && res !== undefined) {
      document.getElementById("saidadiv").style.visibility = "visible";
      stdout.value = res;

      const valor = selectConversor.options[selectConversor.selectedIndex].value;

      try {
        if(valor === ' ' || !valor) {
          throw new Error("Nenhuma opção selecionada.");
        } else if(existeEm(res, valor)) {
          const comb = combLinNugget(res, valor, true);
          const cnt = new Map();

          for(let i = 0; i < nuggetB[valor].length; i++) {
            cnt.set(nuggetB[valor][i], 0);
          }

          for(let i = 0; i < comb.length; i++) {
            let qtd = cnt.get(comb[i])
            cnt.set(comb[i], qtd + 1)
          }

          const fim = nuggetB[valor].map(nugget => cnt.get(nugget));

          stdout.value += "\n\n" + selectConversor.options[selectConversor.selectedIndex].text;
          stdout.value += "\n> (" + nuggetB[valor].join(", ") + ")";
          stdout.value += "\n> (" + fim.join(", ") + ")";
        }
      } catch(e) {
        stdout.value += "\n\n" + e.message;
      }
    }
  } catch(e) {
    document.getElementById("saidadiv").style.visibility = "visible";
    stdout.value = e.message;
  }
}

bffr.addEventListener("keydown", function (event) {
  if(event.key === "Enter") {
    fazerCalculo();
  }
});

selectConversor.addEventListener("change", function () {
  if (bffr.value.trim() !== "" && selectConversor.value !== " ") {
    fazerCalculo();
  }
});
