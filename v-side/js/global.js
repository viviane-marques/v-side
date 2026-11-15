
/* =========================================
   CONFIGURAÇÕES GERAIS DO V-SIDE
========================================= */

(function () {

    const API_URL = "http://localhost:3333";

    const STORAGE_KEY = "vsideUsuario";
    const TOKEN_KEY = "vsideToken";


    /* =========================================
       CONTROLE DE SESSÃO
    ========================================= */

    function obterUsuario() {

        const usuario = localStorage.getItem(STORAGE_KEY);

        if (!usuario) return null;

        try {
            return JSON.parse(usuario);
        } catch (erro) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }

    function obterToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function usuarioEstaLogado() {
        return Boolean(obterUsuario() && obterToken());
    }

    function atualizarHeader() {

        document.body.classList.toggle(
            "usuario-logado",
            usuarioEstaLogado()
        );

        document.body.classList.toggle(
            "usuario-visitante",
            !usuarioEstaLogado()
        );
    }

    function salvarSessao(dados) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(dados.usuario)
        );

        localStorage.setItem(
            TOKEN_KEY,
            dados.token
        );

        atualizarHeader();
    }

    function encerrarSessao() {

        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);

        atualizarHeader();

        window.location.href = "index.html";
    }


    /* =========================================
       MENSAGENS DOS FORMULÁRIOS
    ========================================= */

    function mostrarMensagem(formulario, mensagem, sucesso) {

        let retorno = formulario.querySelector(".mensagem-formulario");

        if (!retorno) {

            retorno = document.createElement("p");

            retorno.className = "mensagem-formulario";

            retorno.setAttribute("role", "status");

            formulario.appendChild(retorno);
        }

        retorno.textContent = mensagem;

        retorno.style.color = sucesso ? "#2e9d63" : "#d9534f";
        retorno.style.marginTop = "12px";
        retorno.style.textAlign = "center";
    }


    /* =========================================
       REQUISIÇÕES PARA A API
    ========================================= */

    async function requisicaoAPI(endpoint, dados) {

        const resposta = await fetch(API_URL + endpoint, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                resultado.mensagem || "Não foi possível realizar a operação."
            );
        }

        return resultado;
    }


    /* =========================================
       LOGIN
    ========================================= */

    async function realizarLogin(evento) {

        evento.preventDefault();

        const formulario = evento.currentTarget;

        const email = document.getElementById("emailLogin").value.trim();

        const senha = document.getElementById("senhaLogin").value;

        if (!email || !senha) {

            mostrarMensagem(
                formulario,
                "Preencha seu e-mail e sua senha.",
                false
            );

            return;
        }

        const botao = formulario.querySelector('button[type="submit"]');

        botao.disabled = true;
        botao.textContent = "ENTRANDO...";

        try {

            const resultado = await requisicaoAPI(
                "/usuarios/autenticar",
                {
                    emailServer: email,
                    senhaServer: senha
                }
            );

            salvarSessao(resultado);

            window.location.href = "index.html";

        } catch (erro) {

            mostrarMensagem(
                formulario,
                erro.message,
                false
            );

        } finally {

            botao.disabled = false;
            botao.textContent = "ENTRAR";
        }
    }


    /* =========================================
       CADASTRO
    ========================================= */

    async function realizarCadastro(evento) {

        evento.preventDefault();

        const formulario = evento.currentTarget;

        const nome = document.getElementById("nomeCadastro").value.trim();

        const email = document.getElementById("emailCadastro").value.trim();

        const senha = document.getElementById("senhaCadastro").value;

        const confirmar = document.getElementById("confirmarSenha").value;

        if (!nome || !email || !senha || !confirmar) {

            mostrarMensagem(
                formulario,
                "Preencha todos os campos.",
                false
            );

            return;
        }

        if (senha !== confirmar) {

            mostrarMensagem(
                formulario,
                "As senhas não coincidem.",
                false
            );

            return;
        }

        if (senha.length < 8) {

            mostrarMensagem(
                formulario,
                "A senha precisa ter pelo menos 8 caracteres.",
                false
            );

            return;
        }

        const botao = formulario.querySelector('button[type="submit"]');

        botao.disabled = true;
        botao.textContent = "CADASTRANDO...";

        try {

            const resultado = await requisicaoAPI(
                "/usuarios/cadastrar",
                {
                    nomeServer: nome,
                    emailServer: email,
                    senhaServer: senha
                }
            );

            salvarSessao(resultado);

            window.location.href = "index.html";

        } catch (erro) {

            mostrarMensagem(
                formulario,
                erro.message,
                false
            );

        } finally {

            botao.disabled = false;
            botao.textContent = "CADASTRE-SE";
        }
    }


    /* =========================================
       MENU SUSPENSO DE MÚSICAS
    ========================================= */

    function configurarMenus() {

        document.querySelectorAll(
            ".menu-musicas > .botao-menu"
        ).forEach(function (botao) {

            botao.addEventListener("click", function (evento) {

                evento.preventDefault();

                const item = botao.closest(".item-menu");

                const aberto = item.classList.toggle("menu-aberto");

                botao.setAttribute(
                    "aria-expanded",
                    String(aberto)
                );

            });

        });

        document.addEventListener("click", function (evento) {

            document.querySelectorAll(".menu-musicas").forEach(function (item) {

                if (!item.contains(evento.target)) {

                    item.classList.remove("menu-aberto");

                    const botao = item.querySelector(".botao-menu");

                    if (botao) {
                        botao.setAttribute("aria-expanded", "false");
                    }
                }

            });

        });
    }


    /* =========================================
       FORMULÁRIO DE CADASTRO DE MÚSICA
    ========================================= */

    function configurarFormularioMusica() {

        const formulario = document.getElementById("formCadastroCatalogo");

        if (!formulario) return;

        formulario.addEventListener("submit", function (evento) {

            evento.preventDefault();

            document.getElementById("retornoMusica").textContent =
                "Formulário preenchido! A integração com o backend ainda precisa ser implementada.";

        });
    }


    /* =========================================
       FORMULÁRIO DE PLAYLIST
    ========================================= */

    function configurarFormularioPlaylist() {

        const formulario = document.getElementById("formPlaylist");

        if (!formulario) return;

        formulario.addEventListener("submit", function (evento) {

            evento.preventDefault();

            document.getElementById("retornoPlaylist").textContent =
                "Formulário preenchido! A integração com o backend ainda precisa ser implementada.";

        });
    }


    /* =========================================
       INICIALIZAÇÃO
    ========================================= */

    document.addEventListener("DOMContentLoaded", function () {

        atualizarHeader();

        /* Botão sair */

        const botaoSair = document.getElementById("botaoSair");

        if (botaoSair) {

            botaoSair.addEventListener("click", function (evento) {

                evento.preventDefault();

                encerrarSessao();

            });
        }


        /* Login */

        const formularioLogin = document.getElementById("formLogin");

        if (formularioLogin) {

            formularioLogin.addEventListener(
                "submit",
                realizarLogin
            );
        }


        /* Cadastro */

        const formularioCadastro = document.getElementById("formCadastro");

        if (formularioCadastro) {

            formularioCadastro.addEventListener(
                "submit",
                realizarCadastro
            );
        }


        /* Menus */

        configurarMenus();


        /* Outros formulários */

        configurarFormularioMusica();

        configurarFormularioPlaylist();


        /* Impedir que usuário já logado entre novamente no login/cadastro */

        if (
            usuarioEstaLogado() &&
            (
                document.getElementById("formLogin") ||
                document.getElementById("formCadastro")
            )
        ) {

            window.location.href = "index.html";
        }

    });

})();
