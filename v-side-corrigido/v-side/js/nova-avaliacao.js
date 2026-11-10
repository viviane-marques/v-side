
/* =========================================
   V-SIDE - CADASTRAR NOVA AVALIAÇÃO

   1. Validar formulário
   2. Recuperar dados
   3. Salvar avaliação
   4. Redirecionar para avaliações.html
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById(
        "formNovaAvaliacao"
    );

    if (!formulario) return;

    const CHAVE_AVALIACOES = "vside_avaliacoes";


    // =========================================
    // 1. RECUPERAR AVALIAÇÕES ANTERIORES
    // =========================================

    function recuperarAvaliacoes() {

        try {

            return JSON.parse(
                localStorage.getItem(CHAVE_AVALIACOES) || "[]"
            );

        } catch (erro) {

            console.error("Erro ao recuperar avaliações:", erro);

            return [];

        }

    }


    // =========================================
    // 2. IDENTIFICAR O USUÁRIO
    // =========================================

    function obterNomeUsuario() {

        try {

            const usuario = JSON.parse(
                localStorage.getItem("vsideUsuario") || "null"
            );

            if (typeof usuario === "string") {
                return usuario;
            }

            return usuario?.nome ||
                usuario?.nomeUsuario ||
                usuario?.usuario ||
                "Usuário";

        } catch (erro) {

            return localStorage.getItem("vsideUsuario") ||
                "Usuário";

        }

    }


    // =========================================
    // 3. ENVIAR A AVALIAÇÃO
    // =========================================

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const musica = document.getElementById(
            "nomeMusica"
        ).value.trim();

        const artista = document.getElementById(
            "nomeArtista"
        ).value.trim();

        const album = document.getElementById(
            "nomeAlbum"
        ).value.trim();

        const resenha = document.getElementById(
            "textoResenha"
        ).value.trim();

        const notaSelecionada = document.querySelector(
            'input[name="nota"]:checked'
        );


        // VERIFICAÇÃO DOS CAMPOS

        if (!musica || !artista || !resenha || !notaSelecionada) {

            alert("Preencha todos os campos obrigatórios.");

            return;

        }


        // =====================================
        // 4. MONTAR OBJETO DA AVALIAÇÃO
        // =====================================

        const avaliacao = {

            id: Date.now().toString(),

            musica: musica,

            artista: artista,

            album: album,

            resenha: resenha,

            nota: Number(notaSelecionada.value),

            usuario: obterNomeUsuario(),

            spotifyMusica:
                "https://open.spotify.com/search/" +
                encodeURIComponent(musica + " " + artista),

            capa: "assets/logos/monograma-fundo-escuro.svg",

            data: new Date().toISOString()

        };


        // =====================================
        // 5. SALVAR NO LOCALSTORAGE
        // =====================================

        const avaliacoes = recuperarAvaliacoes();

        avaliacoes.push(avaliacao);

        try {

            localStorage.setItem(
                CHAVE_AVALIACOES,
                JSON.stringify(avaliacoes)
            );

        } catch (erro) {

            console.error("Erro ao salvar avaliação:", erro);

            alert("Não foi possível salvar sua avaliação.");

            return;

        }


        // =====================================
        // 6. CONFIRMAR E REDIRECIONAR
        // =====================================

        alert("Sua avaliação foi cadastrada com sucesso!");

        window.location.href = "avaliacoes.html";

    });

});
