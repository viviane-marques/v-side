document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // 1. CONFIGURAÇÕES
    // =========================================

    const API_URL = "http://localhost:3333";

    const formulario = document.getElementById("formCadastroCatalogo");

    const opcoes = document.querySelectorAll(".opcao-categoria");

    const botaoEnviar = document.getElementById("botaoEnviarCadastro");

    const grupos = {
        musica: document.getElementById("campos-musica"),
        album: document.getElementById("campos-album"),
        artista: document.getElementById("campos-artista")
    };

    let categoriaAtual = "musica";


    // =========================================
    // 2. MENSAGENS DO FORMULÁRIO
    // =========================================

    const mensagem = document.createElement("div");

    mensagem.id = "mensagemCadastroCatalogo";
    mensagem.style.marginTop = "15px";
    mensagem.style.textAlign = "center";
    mensagem.style.fontWeight = "bold";
    mensagem.style.display = "none";

    formulario.querySelector(".area-botao-enviar").appendChild(mensagem);


    function mostrarMensagem(texto, sucesso) {

        mensagem.textContent = texto;
        mensagem.style.display = "block";

        mensagem.style.color = sucesso ? "#218838" : "#dc3545";

    }


    // =========================================
    // 3. CAMPOS OBRIGATÓRIOS
    // =========================================

    const camposObrigatorios = {
        musica: ["nomeMusica", "artistaMusica"],
        album: ["nomeAlbum", "artistaAlbum"],
        artista: ["nomeArtista"]
    };


    // =========================================
    // 4. TROCAR A CATEGORIA
    // =========================================

    function selecionarCategoria(categoria) {

        categoriaAtual = categoria;

        opcoes.forEach(function (opcao) {

            const selecionada = opcao.dataset.tipo === categoria;

            opcao.classList.toggle("ativa", selecionada);

            opcao.setAttribute("aria-pressed", String(selecionada));

        });


        Object.entries(grupos).forEach(function ([tipo, grupo]) {

            const ativo = tipo === categoria;

            grupo.hidden = !ativo;

            grupo.querySelectorAll("input").forEach(function (campo) {

                campo.required = ativo &&
                    camposObrigatorios[tipo].includes(campo.name);

            });

        });


        const textos = {
            musica: "Enviar Música",
            album: "Enviar Álbum",
            artista: "Enviar Artista"
        };

        botaoEnviar.textContent = textos[categoria];

        mensagem.style.display = "none";

    }


    // =========================================
    // 5. EVENTOS DOS BOTÕES DE CATEGORIA
    // =========================================

    opcoes.forEach(function (opcao) {

        opcao.addEventListener("click", function () {

            selecionarCategoria(opcao.dataset.tipo);

        });

    });


    // =========================================
    // 6. RECUPERAR OS DADOS DO FORMULÁRIO
    // =========================================

    function obterDados() {

        const grupoAtivo = grupos[categoriaAtual];

        const campos = grupoAtivo.querySelectorAll("input");

        const dados = {};

        campos.forEach(function (campo) {

            dados[campo.name] = campo.value.trim();

        });

        return dados;

    }


    // =========================================
    // 7. ENVIAR OS DADOS PARA A API
    // =========================================

    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        mensagem.style.display = "none";

        // Recupera o token salvo no login.
        const token = localStorage.getItem("vsideToken");

        if (!token) {

            mostrarMensagem(
                "Você precisa entrar na sua conta para cadastrar no catálogo.",
                false
            );

            return;

        }


        // Verifica os campos obrigatórios.
        const grupoAtivo = grupos[categoriaAtual];

        const campos = grupoAtivo.querySelectorAll("input");

        for (const campo of campos) {

            if (
                camposObrigatorios[categoriaAtual].includes(campo.name) &&
                !campo.value.trim()
            ) {

                campo.reportValidity();

                return;

            }

        }


        // Recupera os dados preenchidos.
        const dados = obterDados();

        // Identifica qual categoria está sendo cadastrada.
        const corpoRequisicao = {
            tipo: categoriaAtual,
            ...dados
        };


        // Desabilita o botão durante o envio.
        const textoOriginal = botaoEnviar.textContent;

        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando...";


        try {

            const resposta = await fetch(
                `${API_URL}/catalogo/cadastrar`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(corpoRequisicao)
                }
            );


            const resultado = await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    resultado.mensagem ||
                    "Não foi possível realizar o cadastro."
                );

            }


            // Cadastro concluído.
            mostrarMensagem(
                resultado.mensagem || "Cadastro realizado com sucesso!",
                true
            );

            formulario.reset();

            // Mantém a categoria atual selecionada.
            selecionarCategoria(categoriaAtual);


        } catch (erro) {

            console.error("Erro no cadastro do catálogo:", erro);

            mostrarMensagem(
                erro.message || "Erro ao conectar com o servidor.",
                false
            );

        } finally {

            botaoEnviar.disabled = false;

            const textos = {
                musica: "Enviar Música",
                album: "Enviar Álbum",
                artista: "Enviar Artista"
            };

            botaoEnviar.textContent = textos[categoriaAtual] || textoOriginal;

        }

    });


    // =========================================
    // 8. CONFIGURAÇÃO INICIAL
    // =========================================

    selecionarCategoria("musica");

});