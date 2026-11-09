
/* =========================================
   BUSCA DE PLAYLISTS
========================================= */

// Captura o campo de pesquisa
const campoBusca = document.getElementById("buscaPlaylist");

// Captura todos os cards
const playlists = document.querySelectorAll(".playlist-card");

// Captura a mensagem de nenhum resultado
const mensagemVazia = document.getElementById("nenhumaPlaylist");

// Executa sempre que o usuário digitar
campoBusca.addEventListener("input", function () {

    // Converte o texto para letras minúsculas
    const pesquisa = campoBusca.value.toLowerCase().trim();

    let resultados = 0;

    // Percorre todas as playlists
    playlists.forEach(function (playlist) {

        // Obtém o texto de cada card
        const conteudo = playlist.textContent.toLowerCase();

        // Verifica se existe correspondência
        if (conteudo.includes(pesquisa)) {

            playlist.style.display = "flex";
            resultados++;

        } else {

            playlist.style.display = "none";

        }

    });

    // Mostra ou esconde a mensagem de resultado vazio
    if (resultados === 0) {

        mensagemVazia.style.display = "block";

    } else {

        mensagemVazia.style.display = "none";

    }

});
