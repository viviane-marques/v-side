
/* =========================================
   FAVORITOS - INTERAÇÕES DA PÁGINA

   1. Abrir e fechar resenhas
   2. Remover artistas dos favoritos
   3. Guardar remoções no navegador
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Chave utilizada para guardar os favoritos removidos.
    const CHAVE_FAVORITOS_REMOVIDOS = "vside_favoritos_removidos";

    const listaFavoritos = document.querySelector(".lista-favoritos");

    const mensagemVazia = document.querySelector(
        ".mensagem-favoritos-vazia"
    );

    if (!listaFavoritos) return;


    // =========================================
    // 1. RECUPERAR FAVORITOS REMOVIDOS
    // =========================================

    function obterRemovidos() {

        try {

            return JSON.parse(
                localStorage.getItem(CHAVE_FAVORITOS_REMOVIDOS) || "[]"
            );

        } catch (erro) {

            console.warn(
                "Não foi possível recuperar os favoritos.",
                erro
            );

            return [];

        }

    }


    // =========================================
    // 2. SALVAR FAVORITOS REMOVIDOS
    // =========================================

    function salvarRemovidos(ids) {

        try {

            localStorage.setItem(
                CHAVE_FAVORITOS_REMOVIDOS,
                JSON.stringify(ids)
            );

        } catch (erro) {

            console.warn(
                "Não foi possível salvar os favoritos.",
                erro
            );

        }

    }


    // =========================================
    // 3. ESCONDER ARTISTAS JÁ REMOVIDOS
    // =========================================

    const removidos = obterRemovidos();

    listaFavoritos.querySelectorAll(".card-favorito").forEach((card) => {

        if (removidos.includes(card.dataset.favoritoId)) {

            card.remove();

        }

    });


    // =========================================
    // 4. ATUALIZAR MENSAGEM DE LISTA VAZIA
    // =========================================

    function atualizarEstadoDaLista() {

        const cards = listaFavoritos.querySelectorAll(
            ".card-favorito"
        );

        if (mensagemVazia) {

            mensagemVazia.hidden = cards.length !== 0;

        }

    }

    atualizarEstadoDaLista();


    // =========================================
    // 5. ABRIR E FECHAR AS RESENHAS
    // =========================================

    listaFavoritos.addEventListener("click", (evento) => {

        const botaoResenha = evento.target.closest(".link-resenha");

        if (botaoResenha) {

            const card = botaoResenha.closest(".card-favorito");

            const painelId = botaoResenha.getAttribute(
                "aria-controls"
            );

            const painel = document.getElementById(painelId);

            if (!card || !painel) return;

            // Verifica se a resenha está fechada.
            const vaiAbrir = !card.classList.contains(
                "resenha-aberta"
            );

            // Adiciona ou remove a classe responsável pela expansão.
            card.classList.toggle("resenha-aberta", vaiAbrir);

            // Atualiza os atributos de acessibilidade.
            botaoResenha.setAttribute(
                "aria-expanded",
                String(vaiAbrir)
            );

            painel.setAttribute(
                "aria-hidden",
                String(!vaiAbrir)
            );

            // Altera o texto do botão.
            botaoResenha.textContent = vaiAbrir
                ? "Ocultar resenha"
                : "Clique para ver a resenha";

            return;

        }


        // =====================================
        // 6. REMOVER ARTISTA DOS FAVORITOS
        // =====================================

        const botaoRemover = evento.target.closest(
            ".botao-remover-favorito"
        );

        if (botaoRemover) {

            const card = botaoRemover.closest(
                ".card-favorito"
            );

            if (!card) return;

            const id = card.dataset.favoritoId;

            if (!id) return;

            // Recupera a lista atual de artistas removidos.
            const idsRemovidos = obterRemovidos();

            // Adiciona o artista à lista, caso ainda não esteja nela.
            if (!idsRemovidos.includes(id)) {

                idsRemovidos.push(id);

                salvarRemovidos(idsRemovidos);

            }

            // Aplica o efeito visual de remoção.
            card.classList.add("card-removendo");

            // Aguarda a animação antes de retirar o card.
            setTimeout(() => {

                card.remove();

                atualizarEstadoDaLista();

            }, 250);

        }

    });

});
