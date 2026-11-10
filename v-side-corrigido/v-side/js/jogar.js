
/* =========================================
   V-SIDE - JOGO DE ADIVINHAÇÃO MUSICAL

   1. Banco de músicas
   2. Escolha aleatória
   3. Reprodução de áudio
   4. Cronômetro
   5. Sistema de dicas
   6. Verificação de respostas
   7. Resultado e próxima rodada
========================================= */

document.addEventListener("DOMContentLoaded", () => {


    // =========================================
    // 1. BANCO DE MÚSICAS
    // =========================================

    /*
       ADICIONE SUAS MÚSICAS AQUI.

       Cada música precisa ter:
       - titulo
       - artista
       - album
       - capa
       - audio

       Os arquivos de áudio devem ter até 30 segundos.
    */

    const catalogoMusicas = [

        {
            titulo: "Nome da Música 1",
            artista: "Nome do Artista 1",
            album: "Nome do Álbum 1",
            capa: "assets/capas/album-1.jpg",
            audio: "assets/musicas/musica-1.mp3"
        },

        {
            titulo: "Nome da Música 2",
            artista: "Nome do Artista 2",
            album: "Nome do Álbum 2",
            capa: "assets/capas/album-2.jpg",
            audio: "assets/musicas/musica-2.mp3"
        },

        {
            titulo: "Nome da Música 3",
            artista: "Nome do Artista 3",
            album: "Nome do Álbum 3",
            capa: "assets/capas/album-3.jpg",
            audio: "assets/musicas/musica-3.mp3"
        }

    ];


    // =========================================
    // 2. ELEMENTOS DO HTML
    // =========================================

    const audio = document.getElementById("audioMusica");

    const botaoPlay = document.getElementById("botaoPlay");

    const barraAudio = document.getElementById("barraAudio");

    const tempoDecorrido = document.getElementById("tempoDecorrido");

    const tempoRestante = document.getElementById("tempoRestante");

    const botaoDica = document.getElementById("botaoDica");

    const textoBotaoDica = document.getElementById("textoBotaoDica");

    const iconeDica = document.getElementById("iconeDica");

    const artistaRevelado = document.getElementById("artistaRevelado");

    const albumRevelado = document.getElementById("albumRevelado");

    const nomeAlbumRevelado = document.getElementById("nomeAlbumRevelado");

    const capaAlbum = document.getElementById("capaAlbum");

    const interrogacaoCapa = document.getElementById("interrogacaoCapa");

    const formulario = document.getElementById("formResposta");

    const respostaMusica = document.getElementById("respostaMusica");

    const mensagemJogo = document.getElementById("mensagemJogo");

    const resultadoJogo = document.getElementById("resultadoJogo");

    const tituloResultado = document.getElementById("tituloResultado");

    const descricaoResultado = document.getElementById("descricaoResultado");

    const botaoProximaRodada = document.getElementById("botaoProximaRodada");


    // =========================================
    // 3. VARIÁVEIS DO JOGO
    // =========================================

    const DURACAO_JOGO = 30;

    let musicaAtual = null;

    let musicaAnterior = null;

    let dicasUtilizadas = 0;

    let rodadaFinalizada = false;

    let rodadaIniciada = false;

    let intervaloCronometro = null;

    let tempo = 0;


    // =========================================
    // 4. FORMATAR TEMPO
    // =========================================

    function formatarTempo(segundos) {

        const minutos = Math.floor(segundos / 60);

        const segundosRestantes = Math.floor(segundos % 60);

        return (
            minutos +
            ":" +
            String(segundosRestantes).padStart(2, "0")
        );

    }


    // =========================================
    // 5. NORMALIZAR TEXTO
    // =========================================

    function normalizarTexto(texto) {

        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ");

    }


    // =========================================
    // 6. ATUALIZAR CRONÔMETRO
    // =========================================

    function atualizarTempo() {

        tempo = Math.min(
            DURACAO_JOGO,
            Math.floor(audio.currentTime)
        );

        tempoDecorrido.textContent =
            "Tempo: " + formatarTempo(tempo);

        tempoRestante.textContent =
            "Restam: " +
            formatarTempo(DURACAO_JOGO - tempo);

        barraAudio.value = audio.currentTime;

        const progresso =
            (audio.currentTime / DURACAO_JOGO) * 100;

        barraAudio.style.setProperty(
            "--progresso",
            progresso + "%"
        );

        if (audio.currentTime >= DURACAO_JOGO) {

            finalizarRodada(false, "tempo");

        }

    }


    // =========================================
    // 7. CONTROLAR CRONÔMETRO
    // =========================================

    function iniciarCronometro() {

        if (intervaloCronometro) return;

        intervaloCronometro = setInterval(() => {

            atualizarTempo();

        }, 200);

    }


    function pararCronometro() {

        clearInterval(intervaloCronometro);

        intervaloCronometro = null;

    }


    // =========================================
    // 8. REPRODUZIR MÚSICA
    // =========================================

    async function reproduzirMusica() {

        if (rodadaFinalizada) return;

        if (!musicaAtual) return;

        if (audio.paused) {

            try {

                await audio.play();

                rodadaIniciada = true;

                botaoPlay.textContent = "Ⅱ";

                botaoPlay.setAttribute(
                    "aria-label",
                    "Pausar música"
                );

                iniciarCronometro();

                mensagemJogo.hidden = true;

            } catch (erro) {

                console.error("Erro ao reproduzir áudio:", erro);

                mostrarMensagem(
                    "Não foi possível reproduzir o áudio. Confira o caminho do arquivo MP3."
                );

            }

        } else {

            audio.pause();

            pararCronometro();

            botaoPlay.textContent = "▶";

            botaoPlay.setAttribute(
                "aria-label",
                "Reproduzir música"
            );

        }

    }


    // =========================================
    // 9. MOSTRAR MENSAGENS
    // =========================================

    function mostrarMensagem(texto) {

        mensagemJogo.textContent = texto;

        mensagemJogo.hidden = false;

    }


    // =========================================
    // 10. ESCOLHER UMA MÚSICA ALEATÓRIA
    // =========================================

    function escolherMusica() {

        if (catalogoMusicas.length === 0) {

            mostrarMensagem(
                "Adicione músicas ao catálogo para começar a jogar."
            );

            return null;

        }

        let indice;

        do {

            indice = Math.floor(
                Math.random() * catalogoMusicas.length
            );

        } while (
            catalogoMusicas.length > 1 &&
            indice === musicaAnterior
        );

        musicaAnterior = indice;

        return catalogoMusicas[indice];

    }


    // =========================================
    // 11. INICIAR NOVA RODADA
    // =========================================

    function iniciarRodada() {

        pararCronometro();

        audio.pause();

        audio.removeAttribute("src");

        audio.load();

        musicaAtual = escolherMusica();

        if (!musicaAtual) return;

        dicasUtilizadas = 0;

        rodadaFinalizada = false;

        rodadaIniciada = false;

        tempo = 0;


        // REINICIAR INTERFACE

        artistaRevelado.textContent = "????";

        albumRevelado.hidden = true;

        nomeAlbumRevelado.textContent = "";

        capaAlbum.hidden = true;

        capaAlbum.src = "";

        interrogacaoCapa.hidden = false;

        respostaMusica.value = "";

        respostaMusica.disabled = false;

        botaoPlay.disabled = false;

        botaoPlay.textContent = "▶";

        botaoDica.disabled = false;

        botaoDica.classList.remove("desistir");

        textoBotaoDica.textContent = "Pedir dica";

        iconeDica.textContent = "💡";

        botaoPlay.setAttribute(
            "aria-label",
            "Reproduzir música"
        );

        barraAudio.value = 0;

        barraAudio.style.setProperty(
            "--progresso",
            "0%"
        );

        tempoDecorrido.textContent = "Tempo: 0:00";

        tempoRestante.textContent = "Restam: 0:30";

        mensagemJogo.hidden = true;

        resultadoJogo.hidden = true;


        // CARREGAR ÁUDIO

        audio.src = musicaAtual.audio;

        audio.load();

    }


    // =========================================
    // 12. SISTEMA DE DICAS
    // =========================================

    function pedirDica() {

        if (rodadaFinalizada) return;


        // QUARTA INTERAÇÃO: TRANSFORMAR EM DESISTIR

        if (dicasUtilizadas === 3) {

            botaoDica.classList.add("desistir");

            iconeDica.textContent = "✕";

            textoBotaoDica.textContent = "Desistir";

            dicasUtilizadas = 4;

            return;

        }


        // CLIQUE APÓS A TRANSFORMAÇÃO: DESISTIR

        if (dicasUtilizadas === 4) {

            finalizarRodada(false, "desistiu");

            return;

        }


        dicasUtilizadas++;


        // PRIMEIRA DICA: NOME DO ÁLBUM

        if (dicasUtilizadas === 1) {

            albumRevelado.hidden = false;

            nomeAlbumRevelado.textContent =
                musicaAtual.album;

            mostrarMensagem(
                "Dica 1: o nome do álbum foi revelado!"
            );

        }


        // SEGUNDA DICA: CAPA DO ÁLBUM

        else if (dicasUtilizadas === 2) {

            capaAlbum.src = musicaAtual.capa;

            capaAlbum.hidden = false;

            interrogacaoCapa.hidden = true;

            mostrarMensagem(
                "Dica 2: a capa do álbum foi revelada!"
            );

            capaAlbum.onerror = () => {

                mostrarMensagem(
                    "Não foi possível carregar a capa. Confira o caminho da imagem."
                );

            };

        }


        // TERCEIRA DICA: NOME DO ARTISTA

        else if (dicasUtilizadas === 3) {

            artistaRevelado.textContent =
                musicaAtual.artista;

            mostrarMensagem(
                "Dica 3: o nome do artista foi revelado!"
            );

        }

    }


    // =========================================
    // 13. FINALIZAR RODADA
    // =========================================

    function finalizarRodada(acertou, motivo) {

        if (rodadaFinalizada) return;

        rodadaFinalizada = true;

        pararCronometro();

        audio.pause();

        botaoPlay.textContent = "▶";

        botaoPlay.disabled = true;

        botaoDica.disabled = true;

        respostaMusica.disabled = true;


        // REVELAR A RESPOSTA

        artistaRevelado.textContent =
            musicaAtual.artista;

        albumRevelado.hidden = false;

        nomeAlbumRevelado.textContent =
            musicaAtual.album;

        capaAlbum.src = musicaAtual.capa;

        capaAlbum.hidden = false;

        interrogacaoCapa.hidden = true;


        // RESULTADO

        if (acertou) {

            tituloResultado.textContent = "Você acertou! 🎉";

            descricaoResultado.textContent =
                "A música era " +
                musicaAtual.titulo +
                ". Você descobriu em " +
                formatarTempo(tempo) +
                "!";

        }

        else if (motivo === "desistiu") {

            tituloResultado.textContent = "Que pena!";

            descricaoResultado.textContent =
                "Você desistiu. A resposta era: " +
                musicaAtual.titulo +
                " - " +
                musicaAtual.artista +
                ".";

        }

        else {

            tituloResultado.textContent = "Tempo esgotado!";

            descricaoResultado.textContent =
                "A música era " +
                musicaAtual.titulo +
                " - " +
                musicaAtual.artista +
                ".";

        }


        resultadoJogo.hidden = false;

        mensagemJogo.hidden = true;

    }


    // =========================================
    // 14. VERIFICAR RESPOSTA
    // =========================================

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        if (rodadaFinalizada) return;

        const resposta = normalizarTexto(
            respostaMusica.value
        );

        if (!resposta) {

            mostrarMensagem(
                "Digite o nome de uma música!"
            );

            return;

        }

        if (!rodadaIniciada) {

            mostrarMensagem(
                "Primeiro, reproduza a música para começar a rodada."
            );

            return;

        }


        const respostaCorreta = normalizarTexto(
            musicaAtual.titulo
        );


        if (resposta === respostaCorreta) {

            finalizarRodada(true);

        } else {

            mostrarMensagem(
                "Não foi dessa vez! Tente novamente."
            );

            respostaMusica.value = "";

            respostaMusica.focus();

        }

    });


    // =========================================
    // 15. EVENTOS DO PLAYER
    // =========================================

    botaoPlay.addEventListener("click", () => {

        reproduzirMusica();

    });


    audio.addEventListener("timeupdate", () => {

        if (!rodadaFinalizada) {

            atualizarTempo();

        }

    });


    audio.addEventListener("ended", () => {

        if (!rodadaFinalizada) {

            finalizarRodada(false, "tempo");

        }

    });


    // =========================================
    // 16. AVANÇAR OU RETROCEDER NO ÁUDIO
    // =========================================

    barraAudio.addEventListener("input", () => {

        if (!musicaAtual || rodadaFinalizada) return;

        audio.currentTime = Number(barraAudio.value);

        atualizarTempo();

    });


    // =========================================
    // 17. EVENTO DO BOTÃO DE DICAS
    // =========================================

    botaoDica.addEventListener("click", () => {

        pedirDica();

    });


    // =========================================
    // 18. PRÓXIMA RODADA
    // =========================================

    botaoProximaRodada.addEventListener("click", () => {

        iniciarRodada();

    });


    // =========================================
    // 19. INICIALIZAÇÃO
    // =========================================

    iniciarRodada();

});
