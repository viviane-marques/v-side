/* =========================================
   V-SIDE | nova-avaliacao.js
   - A pessoa escolhe uma música do CATÁLOGO (cadastrada por qualquer usuário)
   - Envia a avaliação para a API, que salva no MySQL SÓ no nome do usuário logado
========================================= */

(function () {
  "use strict";

  const V = window.VSide;
  const form = document.getElementById("formNovaAvaliacao");

  if (!V || !form) return;
  if (!V.exigirLogin()) return;

  const campoResenha = document.getElementById("textoResenha");

  // Busca no catálogo
  const campoBusca = document.getElementById("buscaCatalogo");
  const listaResultados = document.getElementById("resultadosCatalogo");

  // Campos preenchidos ao escolher a música
  const campoMusicaId = document.getElementById("musicaId");
  const campoNome = document.getElementById("nomeMusica");
  const campoArtista = document.getElementById("nomeArtista");
  const campoAlbum = document.getElementById("nomeAlbum");

  // Limpa o aviso de validação quando a pessoa volta a digitar
  campoResenha.addEventListener("input", function () {
    campoResenha.setCustomValidity("");
  });

  /* -----------------------------------------
       BUSCA NO CATÁLOGO
    ----------------------------------------- */

  let temporizador = null; // usado no "debounce"
  let numeroDaBusca = 0; // identifica a busca mais recente

  // Debounce: só busca quando a pessoa PARA de digitar por 300ms
  campoBusca.addEventListener("input", function () {
    clearTimeout(temporizador);

    temporizador = setTimeout(function () {
      buscar(campoBusca.value.trim());
    }, 300);
  });

  // Ao clicar no campo, já mostra as músicas mais recentes do catálogo
  campoBusca.addEventListener("focus", function () {
    buscar(campoBusca.value.trim());
  });

  async function buscar(termo) {
    // Se a resposta de uma busca antiga chegar depois de uma mais nova, é descartada
    const minhaBusca = ++numeroDaBusca;

    mostrarMensagemNaLista("Buscando...");

    const resultado = await V.listarMusicas(termo);

    if (minhaBusca !== numeroDaBusca) return;

    if (!resultado.ok) {
      mostrarMensagemNaLista(resultado.erro);
      return;
    }

    if (resultado.dados.length === 0) {
      mostrarMensagemNaLista("Nenhuma música encontrada. Que tal cadastrá-la?");
      return;
    }

    desenharResultados(resultado.dados);
  }

  // Mostra um texto simples dentro da lista (carregando, erro, vazio)
  function mostrarMensagemNaLista(texto) {
    listaResultados.innerHTML = "";

    const item = document.createElement("li");
    item.className = "resultado-mensagem";
    item.textContent = texto; // textContent: nunca interpreta HTML
    listaResultados.appendChild(item);

    listaResultados.hidden = false;
  }

  function desenharResultados(musicas) {
    listaResultados.innerHTML = "";

    musicas.forEach(function (musica) {
      const item = document.createElement("li");

      // <button> permite escolher também com o teclado (Tab + Enter)
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "resultado-catalogo";

      const titulo = document.createElement("strong");
      titulo.textContent = musica.titulo;

      const detalhe = document.createElement("small");
      detalhe.textContent = musica.album
        ? musica.artista + " • " + musica.album
        : musica.artista;

      // miniatura da capa (sem capa, mostra a inicial do álbum/música)
      const miniatura = document.createElement("img");
      miniatura.className = "resultado-capa";
      miniatura.alt = "";
      miniatura.src =
        musica.capa || V.capaPlaceholder(musica.album || musica.titulo);

      const textos = document.createElement("span");
      textos.className = "resultado-textos";
      textos.appendChild(titulo);
      textos.appendChild(detalhe);

      botao.appendChild(miniatura);
      botao.appendChild(textos);

      botao.addEventListener("click", function () {
        escolherMusica(musica);
      });

      item.appendChild(botao);
      listaResultados.appendChild(item);
    });

    listaResultados.hidden = false;
  }

  // Quando a pessoa escolhe uma música: preenche os campos e guarda o id
  function escolherMusica(musica) {
    campoMusicaId.value = musica.id;
    campoNome.value = musica.titulo;
    campoArtista.value = musica.artista;
    campoAlbum.value = musica.album || "";

    // Fecha a lista e limpa a busca
    listaResultados.hidden = true;
    campoBusca.value = "";
  }

  // Clicar fora da área de busca fecha a lista
  document.addEventListener("click", function (evento) {
    if (!evento.target.closest(".campo-busca-catalogo")) {
      listaResultados.hidden = true;
    }
  });

  // Vindo do cadastro (nova-avaliacao.html?musica=5): já deixa essa música escolhida
  async function escolherMusicaDaUrl() {
    const id = new URLSearchParams(location.search).get("musica");

    if (!id || !/^\d+$/.test(id)) return;

    const resultado = await V.obterMusica(id);

    if (resultado.ok) {
      escolherMusica(resultado.dados);
    }
  }

  /* -----------------------------------------
       ENVIO DA AVALIAÇÃO
    ----------------------------------------- */

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    // Tem que ter escolhido uma música do catálogo
    if (!campoMusicaId.value) {
      alert("Escolha uma música do catálogo (ou cadastre uma nova).");
      campoBusca.focus();
      return;
    }

    const resenha = campoResenha.value.trim();

    // "required" aceita só espaços, então conferimos aqui
    if (!resenha) {
      campoResenha.setCustomValidity("Escreva sua resenha.");
      campoResenha.reportValidity();
      return;
    }

    const nota = form.querySelector('input[name="nota"]:checked');
    const botao = form.querySelector('button[type="submit"]');

    botao.disabled = true; // evita enviar duas vezes

    // Só o id da música, a nota e a resenha: o servidor busca o resto no catálogo
    const resultado = await V.salvarAvaliacao({
      musicaId: Number(campoMusicaId.value),
      nota: Number(nota.value),
      resenha: resenha,
    });

    botao.disabled = false;

    if (!resultado.ok) {
      alert(resultado.erro);
      return;
    }

    location.href = "avaliacoes.html";
  });

  escolherMusicaDaUrl();
})();