// animacão e validacao forca da senha
(function () {
  "use strict";

  const campo = document.getElementById("senhaCadastro");
  const barra = document.getElementById("forcaBarra");
  const trilho = document.getElementById("forcaTrilho");
  const texto = document.getElementById("forcaTexto");
  const listaCriterios = document.getElementById("forcaCriterios");

  if (!campo || !barra || !trilho || !texto || !listaCriterios) return;

  // maximo de caracteres da senha
  campo.maxLength = 72;

  const criterios = [
    {
      texto: "Pelo menos 8 caracteres",
      testar: function (senha) {
        return senha.length >= 8;
      },
    },
    {
      texto: "Uma letra maiúscula (A-Z)",
      testar: function (senha) {
        return /\p{Lu}/u.test(senha);
      },
    },
    {
      texto: "Uma letra minúscula (a-z)",
      testar: function (senha) {
        return /\p{Ll}/u.test(senha);
      },
    },
    {
      texto: "Um número (0-9)",
      testar: function (senha) {
        return /\d/.test(senha);
      },
    },
    {
      texto: "Um símbolo (! @ # $ % & *...)",
      testar: function (senha) {
        return /[^\p{L}\p{N}]/u.test(senha);
      },
    },
  ];
  const itens = [];

  //monta a lista dos criterios na tela
  for (let i = 0; i < criterios.length; i++) {
    const item = document.createElement("li");
    item.className = "forca-criterio";
    item.textContent = criterios[i].texto;

    listaCriterios.appendChild(item);
    itens.push(item);
  }

  // atualiza a barra
  function contarCumpridos(senha) {
    let cumpridos = 0;

    for (let i = 0; i < criterios.length; i++) {
      if (criterios[i].testar(senha)) cumpridos++;
    }

    return cumpridos;
  }

  function atualizar() {
    const senha = campo.value;
    const total = criterios.length;
    let cumpridos = 0;

    // marca cada item da lista como validado ou nao ( v ou x)
    for (let i = 0; i < total; i++) {
      const ok = criterios[i].testar(senha);

      itens[i].classList.toggle("cumprido", ok);

      if (ok) cumpridos++;
    }

    // nível da senha
    let nivel = "vazia";
    let rotulo = "—";

    if (senha.length > 0) {
      if (cumpridos === total) {
        nivel = "forte";
        rotulo = "Forte";
      } else if (cumpridos >= 3) {
        nivel = "media";
        rotulo = "Média";
      } else {
        nivel = "fraca";
        rotulo = "Fraca";
      }
    }

    barra.style.width =
      (senha.length > 0 ? (cumpridos / total) * 100 : 0) + "%";
    barra.className = "forca-barra-preenchida " + nivel;

    texto.textContent = rotulo;
    texto.className = "forca-texto " + nivel;

    trilho.setAttribute("aria-valuenow", String(cumpridos));
  }

  campo.addEventListener("input", atualizar);
  atualizar();

  window.VSideSenha = {
    ehForte: function (senha) {
      return contarCumpridos(String(senha)) === criterios.length;
    },
  };
})();
