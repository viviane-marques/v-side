/* =========================================
   V-SIDE - CADASTRAR NOVA AVALIAÇÃO

   1. Recuperar dados do formulário
   2. Identificar usuário autenticado
   3. Enviar avaliação para a API
   4. Salvar no MySQL
   5. Redirecionar
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("formNovaAvaliacao");

    if (!formulario) return;

    const API_URL = "http://localhost:3333";


    // =========================================
    // 1. ENVIAR FORMULÁRIO
    // =========================================

    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();


        // -------------------------------------
        // 2. RECUPERAR TOKEN
        // -------------------------------------

        const token = localStorage.getItem("vsideToken");

        if (!token) {

            alert("Você precisa entrar na sua conta para avaliar uma música.");

            window.location.href = "login.html";

            return;

        }


        // -------------------------------------
        // 3. RECUPERAR CAMPOS
        // -------------------------------------

        const musica = document.getElementById("nomeMusica").value.trim();

        const artista = document.getElementById("nomeArtista").value.trim();

        const album = document.getElementById("nomeAlbum").value.trim();

        const resenha = document.getElementById("textoResenha").value.trim();

        const notaSelecionada = document.querySelector(
            'input[name="nota"]:checked'
        );


        // -------------------------------------
        // 4. VALIDAR CAMPOS
        // -------------------------------------

        if (!musica || !artista || !resenha || !notaSelecionada) {

            alert("Preencha todos os campos obrigatórios.");

            return;

        }


        // -------------------------------------
        // 5. MONTAR DADOS DA AVALIAÇÃO
        // -------------------------------------

        const avaliacao = {

            musica: musica,

            artista: artista,

            album: album,

            resenha: resenha,

            nota: Number(notaSelecionada.value)

        };


        // -------------------------------------
        // 6. ENVIAR PARA A API
        // -------------------------------------

        const botaoEnviar = formulario.querySelector(
            'button[type="submit"]'
        );

        if (botaoEnviar) {
            botaoEnviar.disabled = true;
        }

        try {

            const resposta = await fetch(
                `${API_URL}/avaliacoes/cadastrar`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json",

                        "Authorization": `Bearer ${token}`

                    },

                    body: JSON.stringify(avaliacao)

                }
            );


            const dados = await resposta.json();


            // ---------------------------------
            // 7. TRATAR RESPOSTA
            // ---------------------------------

            if (!resposta.ok) {

                alert(dados.mensagem || "Não foi possível cadastrar a avaliação.");

                return;

            }


            // ---------------------------------
            // 8. CONFIRMAR CADASTRO
            // ---------------------------------

            alert("Sua avaliação foi cadastrada com sucesso!");

            window.location.href = "avaliacoes.html";


        } catch (erro) {

            console.error("Erro ao enviar avaliação:", erro);

            alert("Não foi possível conectar à API. Verifique se o servidor está funcionando.");

        } finally {

            if (botaoEnviar) {
                botaoEnviar.disabled = false;
            }

        }

    });

});