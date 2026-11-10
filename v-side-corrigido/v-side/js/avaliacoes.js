
/* =========================================
   V-SIDE - PÁGINA DE AVALIAÇÕES

   1. Recuperar avaliações
   2. Criar cards automaticamente
   3. Expandir resenhas
   4. Favoritar artistas
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE_AVALIACOES = "vside_avaliacoes";

    const CHAVE_ARTISTAS_FAVORITOS =
        "vside_artistas_favoritos";

    const lista = document.getElementById("listaAvaliacoes");

    const mensagemVazia = document.getElementById(
        "mensagemAvaliacoesVazia"
    );

    if (!lista) return;


    // =========================================
    // 1. RECUPERAR DADOS DO LOCALSTORAGE
    // =========================================

    function recuperarDados(chave) {

        try {

            return JSON.parse(
                localStorage.getItem(chave) || "[]"
            );

        } catch (erro) {

            console.error("Erro ao recuperar dados:", erro);

            return [];

        }

    }


    // =========================================
    // 2. SALVAR DADOS
    // =========================================

    function salvarDados(chave, dados) {

        try {

            localStorage.setItem(
                chave,
                JSON.stringify(dados)
            );

            return true;

        } catch (erro) {

            console.error("Erro ao salvar dados:", erro);

            alert("Não foi possível salvar as alterações.");

            return false;

        }

    }


    // =========================================
    // 3. GERAR IDENTIFICADOR DO ARTISTA
    // =========================================

    function gerarIdArtista(nome) {

        return nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

    }


    // =========================================
    // 4. VERIFICAR SE ARTISTA É FAVORITO
    // =========================================

    function artistaFavoritado(nome) {

        const favoritos = recuperarDados(
            CHAVE_ARTISTAS_FAVORITOS
        );

        const id = gerarIdArtista(nome);

        return favoritos.some(
            artista => artista.id === id
        );

    }


    // =========================================
    // 5. CRIAR UM CARD DE AVALIAÇÃO
    // =========================================

    function criarCard(avaliacao) {

        const card = document.createElement("article");

        card.className = "card-avaliacao";

        const id = avaliacao.id || (
            Date.now().toString() + gerarIdArtista(avaliacao.artista)
        );

        const idResenha = "resenha-" + id;

        // PARTE PRINCIPAL DO CARD

        const principal = document.createElement("div");

        principal.className = "avaliacao-principal";


        // CAPA

        const capa = document.createElement("img");

        capa.className = "capa-avaliacao";

        capa.src = avaliacao.capa ||
            "assets/logos/monograma-fundo-escuro.svg";

        capa.alt = "Capa de " + avaliacao.musica;


        // INFORMAÇÕES

        const informacoes = document.createElement("div");

        informacoes.className = "avaliacao-informacoes";

        const titulo = document.createElement("h2");

        titulo.textContent = avaliacao.musica;

        const artista = document.createElement("p");

        artista.textContent = avaliacao.artista;

        informacoes.append(titulo, artista);


        if (avaliacao.album) {

            const album = document.createElement("p");

            album.className = "album-avaliacao";

            album.textContent = avaliacao.album;

            informacoes.appendChild(album);

        }


        // AÇÕES

        const acoes = document.createElement("div");

        acoes.className = "avaliacao-acoes";


        // LINHA SUPERIOR: CORAÇÃO E SPOTIFY

        const linhaSuperior = document.createElement("div");

        linhaSuperior.className = "linha-acoes-superior";


        // BOTÃO DE FAVORITAR ARTISTA

        const botaoCoracao = document.createElement("button");

        botaoCoracao.type = "button";

        botaoCoracao.className =
            "botao-favoritar-artista";

        const favorito = artistaFavoritado(avaliacao.artista);

        botaoCoracao.classList.toggle(
            "favoritado",
            favorito
        );

        botaoCoracao.setAttribute(
            "aria-pressed",
            String(favorito)
        );

        botaoCoracao.setAttribute(
            "aria-label",
            favorito
                ? "Remover artista dos favoritos"
                : "Adicionar artista aos favoritos"
        );

        botaoCoracao.title = favorito
            ? "Remover dos favoritos"
            : "Favoritar artista";


        botaoCoracao.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>
            </svg>
        `;


        // BOTÃO SPOTIFY

        const spotify = document.createElement("a");

        spotify.className = "botao-spotify";

        spotify.href = avaliacao.spotifyMusica ||
            "https://open.spotify.com/search/" +
            encodeURIComponent(
                avaliacao.musica + " " + avaliacao.artista
            );

        spotify.target = "_blank";

        spotify.rel = "noopener noreferrer";

        const iconeSpotify = document.createElement("img");

        iconeSpotify.src = "assets/icons/ic-spotify.png";

        iconeSpotify.alt = "";

        spotify.appendChild(iconeSpotify);

        spotify.appendChild(
            document.createTextNode("Ouça no Spotify")
        );


        linhaSuperior.append(botaoCoracao, spotify);


        // NOTA

        const nota = document.createElement("div");

        nota.className = "avaliacao-nota";

        const estrelas = document.createElement("span");

        estrelas.className = "estrelas";

        const quantidadeEstrelas = Math.min(
            5,
            Math.max(0, Number(avaliacao.nota) || 0)
        );

        estrelas.textContent =
            "★".repeat(quantidadeEstrelas) +
            "☆".repeat(5 - quantidadeEstrelas);


        // BOTÃO DA RESENHA

        const botaoResenha = document.createElement("button");

        botaoResenha.type = "button";

        botaoResenha.className = "botao-resenha";

        botaoResenha.textContent =
            "Clique para ver a resenha";

        botaoResenha.setAttribute(
            "aria-expanded",
            "false"
        );

        botaoResenha.setAttribute(
            "aria-controls",
            idResenha
        );


        nota.append(estrelas, botaoResenha);

        acoes.append(linhaSuperior, nota);

        principal.append(capa, informacoes, acoes);


        // RESENHA EXPANSÍVEL

        const painel = document.createElement("div");

        painel.className = "resenha-detalhe";

        painel.id = idResenha;

        const painelInterno = document.createElement("div");

        painelInterno.className = "resenha-detalhe-interno";

        const texto = document.createElement("div");

        texto.className = "resenha-texto";

        const tituloResenha = document.createElement("h3");

        tituloResenha.textContent =
            "Resenha de " + (avaliacao.usuario || "Usuário");

        const paragrafo = document.createElement("p");

        paragrafo.textContent = avaliacao.resenha;

        texto.append(tituloResenha, paragrafo);

        painelInterno.appendChild(texto);

        painel.appendChild(painelInterno);


        card.append(principal, painel);

        // Identifica a avaliação para os eventos.
        card.dataset.avaliacaoId = id;

        return card;

    }


    // =========================================
    // 6. MOSTRAR TODAS AS AVALIAÇÕES
    // =========================================

    function renderizarAvaliacoes() {

        const avaliacoes = recuperarDados(
            CHAVE_AVALIACOES
        );

        // Remove cards anteriores, mantendo a mensagem vazia.
        lista.querySelectorAll(".card-avaliacao").forEach(
            card => card.remove()
        );

        if (avaliacoes.length === 0) {

            mensagemVazia.hidden = false;

            return;

        }

        mensagemVazia.hidden = true;

        // Exibe as avaliações mais recentes primeiro.
        avaliacoes.slice().reverse().forEach(avaliacao => {

            const card = criarCard(avaliacao);

            lista.appendChild(card);

        });

    }


    // =========================================
    // 7. EXPANDIR E RECOLHER RESENHAS
    // =========================================

    lista.addEventListener("click", (evento) => {

        const botao = evento.target.closest(".botao-resenha");

        if (!botao) return;

        const card = botao.closest(".card-avaliacao");

        if (!card) return;

        const estaAberto = card.classList.contains("aberto");

        card.classList.toggle("aberto", !estaAberto);

        botao.setAttribute(
            "aria-expanded",
            String(!estaAberto)
        );

        botao.textContent = estaAberto
            ? "Clique para ver a resenha"
            : "Ocultar resenha";

    });


    // =========================================
    // 8. FAVORITAR OU DESFAVORITAR ARTISTA
    // =========================================

    lista.addEventListener("click", (evento) => {

        const botao = evento.target.closest(
            ".botao-favoritar-artista"
        );

        if (!botao) return;

        const card = botao.closest(".card-avaliacao");

        if (!card) return;

        const idAvaliacao = card.dataset.avaliacaoId;

        const avaliacoes = recuperarDados(
            CHAVE_AVALIACOES
        );

        const avaliacao = avaliacoes.find(
            item => String(item.id) === String(idAvaliacao)
        );

        if (!avaliacao) return;

        const idArtista = gerarIdArtista(
            avaliacao.artista
        );

        let favoritos = recuperarDados(
            CHAVE_ARTISTAS_FAVORITOS
        );

        const jaFavoritado = favoritos.some(
            artista => artista.id === idArtista
        );


        if (jaFavoritado) {

            // REMOVE O ARTISTA DOS FAVORITOS.

            favoritos = favoritos.filter(
                artista => artista.id !== idArtista
            );

        } else {

            // ADICIONA O ARTISTA, NÃO A MÚSICA.

            favoritos.push({

                id: idArtista,

                nome: avaliacao.artista,

                spotifyUrl:
                    "https://open.spotify.com/search/" +
                    encodeURIComponent(avaliacao.artista),

                capa: avaliacao.capa ||
                    "assets/logos/monograma-fundo-escuro.svg"

            });

        }


        if (!salvarDados(
            CHAVE_ARTISTAS_FAVORITOS,
            favoritos
        )) return;


        // Atualiza todos os cards do mesmo artista.
        lista.querySelectorAll(".card-avaliacao").forEach(
            outroCard => {

                const idOutro = outroCard.dataset.avaliacaoId;

                const outraAvaliacao = avaliacoes.find(
                    item => String(item.id) === String(idOutro)
                );

                if (!outraAvaliacao) return;

                if (
                    gerarIdArtista(outraAvaliacao.artista) === idArtista
                ) {

                    const outroBotao = outroCard.querySelector(
                        ".botao-favoritar-artista"
                    );

                    const ativo = !jaFavoritado;

                    outroBotao.classList.toggle(
                        "favoritado",
                        ativo
                    );

                    outroBotao.setAttribute(
                        "aria-pressed",
                        String(ativo)
                    );

                    outroBotao.title = ativo
                        ? "Remover dos favoritos"
                        : "Favoritar artista";

                }

            }
        );

    });


    // =========================================
    // 9. INICIALIZAÇÃO
    // =========================================

    renderizarAvaliacoes();

});
