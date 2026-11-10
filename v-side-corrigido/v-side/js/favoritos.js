
/* =========================================
   V-SIDE - PÁGINA DE FAVORITOS

   1. Recuperar artistas favoritados
   2. Exibir artistas vindos das avaliações
   3. Remover artistas dos favoritos
   4. Expandir resenhas
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE_ARTISTAS = "vside_artistas_favoritos";

    const CHAVE_REMOVIDOS = "vside_favoritos_removidos";

    const lista = document.querySelector(".lista-favoritos");

    if (!lista) return;


    // =========================================
    // 1. RECUPERAR DADOS
    // =========================================

    function recuperar(chave) {

        try {

            return JSON.parse(
                localStorage.getItem(chave) || "[]"
            );

        } catch (erro) {

            return [];

        }

    }


    // =========================================
    // 2. SALVAR DADOS
    // =========================================

    function salvar(chave, dados) {

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
        );

    }


    // =========================================
    // 3. MOSTRAR ARTISTAS FAVORITADOS
    // =========================================

    function renderizarArtistasFavoritos() {

        // Evita duplicar os cards ao atualizar a lista.
        lista.querySelectorAll(
            '[data-origem="avaliacoes"]'
        ).forEach(card => card.remove());


        const artistas = recuperar(CHAVE_ARTISTAS);

        artistas.forEach(artista => {

            const card = document.createElement("article");

            card.className = "card-favorito";

            card.dataset.favoritoId = artista.id;

            card.dataset.origem = "avaliacoes";


            // CAPA

            const capa = document.createElement("img");

            capa.className = "capa-album";

            capa.src = artista.capa ||
                "assets/logos/monograma-fundo-escuro.svg";

            capa.alt = "Artista " + artista.nome;


            // INFORMAÇÕES

            const informacoes = document.createElement("div");

            informacoes.className = "informacoes-album";

            const nome = document.createElement("h2");

            nome.textContent = artista.nome;

            const descricao = document.createElement("p");

            descricao.className = "artistas-album";

            descricao.textContent =
                "Artista adicionado pelas suas avaliações";

            informacoes.append(nome, descricao);


            // AÇÕES

            const acoes = document.createElement("div");

            acoes.className = "acoes-favorito";


            // BOTÃO PARA REMOVER

            const botaoRemover = document.createElement("button");

            botaoRemover.type = "button";

            botaoRemover.className =
                "botao-remover-favorito";

            botaoRemover.title = "Remover dos favoritos";

            botaoRemover.setAttribute(
                "aria-label",
                "Remover " + artista.nome + " dos favoritos"
            );

            botaoRemover.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>
                </svg>
            `;


            // LINK DO SPOTIFY DO ARTISTA

            const spotify = document.createElement("a");

            spotify.className = "botao-spotify";

            spotify.href = artista.spotifyUrl ||
                "https://open.spotify.com/search/" +
                encodeURIComponent(artista.nome);

            spotify.target = "_blank";

            spotify.rel = "noopener noreferrer";

            const icone = document.createElement("img");

            icone.src = "assets/icons/ic-spotify.png";

            icone.alt = "";

            spotify.append(
                icone,
                document.createTextNode("Ouça no Spotify")
            );


            acoes.append(botaoRemover, spotify);

            card.append(capa, informacoes, acoes);

            lista.appendChild(card);

        });

    }


    // =========================================
    // 4. ESCONDER FAVORITOS REMOVIDOS
    // =========================================

    function esconderRemovidos() {

        const removidos = recuperar(CHAVE_REMOVIDOS);

        lista.querySelectorAll(".card-favorito").forEach(card => {

            const id = card.dataset.favoritoId;

            if (id && removidos.includes(id)) {

                card.remove();

            }

        });

    }


    // =========================================
    // 5. EXPANDIR RESENHAS
    // =========================================

    lista.addEventListener("click", (evento) => {

        const botaoResenha = evento.target.closest(
            ".link-resenha"
        );

        if (!botaoResenha) return;

        const card = botaoResenha.closest(".card-favorito");

        const painelId = botaoResenha.getAttribute(
            "aria-controls"
        );

        const painel = document.getElementById(painelId);

        if (!card || !painel) return;

        const vaiAbrir = !card.classList.contains(
            "resenha-aberta"
        );

        card.classList.toggle("resenha-aberta", vaiAbrir);

        botaoResenha.setAttribute(
            "aria-expanded",
            String(vaiAbrir)
        );

        painel.setAttribute(
            "aria-hidden",
            String(!vaiAbrir)
        );

        botaoResenha.textContent = vaiAbrir
            ? "Ocultar resenha"
            : "Clique para ver a resenha";

    });


    // =========================================
    // 6. REMOVER ARTISTA DOS FAVORITOS
    // =========================================

    lista.addEventListener("click", (evento) => {

        const botaoRemover = evento.target.closest(
            ".botao-remover-favorito"
        );

        if (!botaoRemover) return;

        const card = botaoRemover.closest(".card-favorito");

        if (!card) return;

        const id = card.dataset.favoritoId;

        if (!id) return;


        // ARTISTA ADICIONADO PELA PÁGINA DE AVALIAÇÕES

        if (card.dataset.origem === "avaliacoes") {

            const artistas = recuperar(CHAVE_ARTISTAS);

            const atualizados = artistas.filter(
                artista => artista.id !== id
            );

            salvar(CHAVE_ARTISTAS, atualizados);

        } else {

            // FAVORITOS QUE JÁ EXISTIAM NA PÁGINA

            const removidos = recuperar(CHAVE_REMOVIDOS);

            if (!removidos.includes(id)) {

                removidos.push(id);

                salvar(CHAVE_REMOVIDOS, removidos);

            }

        }


        card.remove();

    });


    // =========================================
    // 7. INICIALIZAR
    // =========================================

    renderizarArtistasFavoritos();

    esconderRemovidos();

});
