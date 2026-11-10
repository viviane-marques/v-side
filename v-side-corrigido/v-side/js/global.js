/* Estado de sessão demonstrativo do V-Side.
   A aplicação poderá substituir este mecanismo pela autenticação real da API. */
(function () {
    const STORAGE_KEY = "vsideUsuario";

    function usuarioEstaLogado() {
        return Boolean(localStorage.getItem(STORAGE_KEY));
    }

    function atualizarHeader() {
        document.body.classList.toggle("usuario-logado", usuarioEstaLogado());
    }

    atualizarHeader();

    document.addEventListener("DOMContentLoaded", function () {
        atualizarHeader();

        const botaoSair = document.getElementById("botaoSair");
        if (botaoSair) {
            botaoSair.addEventListener("click", function () {
                localStorage.removeItem(STORAGE_KEY);
                window.location.href = "index.html";
            });
        }

        // Permite abrir o menu de músicas por clique em telas touch.
        document.querySelectorAll(".menu-musicas > .botao-menu").forEach(function (botao) {
            botao.addEventListener("click", function () {
                const item = botao.closest(".item-menu");
                const aberto = item.classList.toggle("menu-aberto");
                botao.setAttribute("aria-expanded", String(aberto));
            });
        });

        // Formulário de login demonstrativo.
        const formularioLogin = document.getElementById("formLogin");
        if (formularioLogin) {
            formularioLogin.addEventListener("submit", function (evento) {
                evento.preventDefault();
                const email = document.getElementById("emailLogin").value.trim();
                const senha = document.getElementById("senhaLogin").value;
                if (!email || !senha) return;
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email }));
                window.location.href = "index.html";
            });
        }

        const formularioMusica = document.getElementById("formMusica");
        if (formularioMusica) {
            formularioMusica.addEventListener("submit", function (evento) {
                evento.preventDefault();
                document.getElementById("retornoMusica").textContent =
                    "Dados preenchidos! A integração para salvar a música ainda precisa ser conectada ao backend.";
                formularioMusica.reset();
            });
        }

        const formularioPlaylist = document.getElementById("formPlaylist");
        if (formularioPlaylist) {
            formularioPlaylist.addEventListener("submit", function (evento) {
                evento.preventDefault();
                document.getElementById("retornoPlaylist").textContent =
                    "Playlist preenchida! A integração para salvar ainda precisa ser conectada ao backend.";
                formularioPlaylist.reset();
            });
        }

        // Formulário de cadastro demonstrativo.
        const formularioCadastro = document.getElementById("formCadastro");
        if (formularioCadastro) {
            formularioCadastro.addEventListener("submit", function (evento) {
                evento.preventDefault();
                const senha = document.getElementById("senhaCadastro").value;
                const confirmar = document.getElementById("confirmarSenha").value;
                if (senha !== confirmar) {
                    alert("As senhas não coincidem.");
                    return;
                }
                const email = document.getElementById("emailCadastro").value.trim();
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email }));
                window.location.href = "index.html";
            });
        }
    });
})();