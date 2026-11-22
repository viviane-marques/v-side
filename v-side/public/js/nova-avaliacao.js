(function () {
  "use strict";

  const V = window.VSide;
  const form = document.getElementById("formNovaAvaliacao");

  if (!V || !form) return;
  if (!V.exigirLogin()) return;

  const campoResenha = document.getElementById("textoResenha");

  const campoBusca = document.getElementById("buscaCatalogo");
  const listaResultados = document.getElementById("resultadosCatalogo");

  const campoMusicaId = document.getElementById("musicaId");
  const campoNome = document.getElementById("nomeMusica");
  const campoArtista = document.getElementById("nomeArtista");
  const campoAlbum = document.getElementById("nomeAlbum");

  campoResenha.addEventListener("input", function () {
    campoResenha.setCustomValidity("");
  });

  let temporizador = null;
  let numeroDaBusca = 0;

  campoBusca.addEventListener("input", function () {
    clearTimeout(temporizador);

    temporizador = setTimeout(function () {
      buscar(campoBusca.value.trim());
    }, 300);
  });

  campoBusca.addEventListener("focus", function () {
    buscar(campoBusca.value.trim());
  });

  // consulta no catalogo
  async function buscar(termo) {
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

  // funcoes de montar a lista de resultados = mostrarMensagemNaLista
  // desenharResultados, escolherMusica
  function mostrarMensagemNaLista(texto) {
    listaResultados.innerHTML = "";

    const item = document.createElement("li");
    item.className = "resultado-mensagem";
    item.textContent = texto;
    listaResultados.appendChild(item);

    listaResultados.hidden = false;
  }

  function desenharResultados(musicas) {
    listaResultados.innerHTML = "";

    musicas.forEach(function (musica) {
      const item = document.createElement("li");

      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "resultado-catalogo";

      const titulo = document.createElement("strong");
      titulo.textContent = musica.titulo;

      const detalhe = document.createElement("small");
      detalhe.textContent = musica.album
        ? musica.artista + " • " + musica.album
        : musica.artista;

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

  function escolherMusica(musica) {
    campoMusicaId.value = musica.id;
    campoNome.value = musica.titulo;
    campoArtista.value = musica.artista;
    campoAlbum.value = musica.album || "";

    listaResultados.hidden = true;
    campoBusca.value = "";
  }

  document.addEventListener("click", function (evento) {
    if (!evento.target.closest(".campo-busca-catalogo")) {
      listaResultados.hidden = true;
    }
  });

  // seleciona a musica pelo id
  async function escolherMusicaDaUrl() {
    const id = new URLSearchParams(location.search).get("musica");

    if (!id || !/^\d+$/.test(id)) return;

    const resultado = await V.obterMusica(id);

    if (resultado.ok) {
      escolherMusica(resultado.dados);
    }
  }

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!campoMusicaId.value) {
      alert("Escolha uma música do catálogo (ou cadastre uma nova).");
      campoBusca.focus();
      return;
    }

    const resenha = campoResenha.value.trim();

    if (!resenha) {
      campoResenha.setCustomValidity("Escreva sua resenha.");
      campoResenha.reportValidity();
      return;
    }

    const nota = form.querySelector('input[name="nota"]:checked');
    const botao = form.querySelector('button[type="submit"]');

    botao.disabled = true;

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