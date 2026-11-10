
document.addEventListener("DOMContentLoaded", () => {

    // FORMULÁRIO PRINCIPAL
    const formulario = document.getElementById(
        "formCadastroCatalogo"
    );

    // BOTÕES DE CATEGORIA
    const opcoes = document.querySelectorAll(
        ".opcao-categoria"
    );

    // BOTÃO DE ENVIO
    const botaoEnviar = document.getElementById(
        "botaoEnviarCadastro"
    );

    // GRUPOS DE CAMPOS
    const grupos = {
        musica: document.getElementById("campos-musica"),
        album: document.getElementById("campos-album"),
        artista: document.getElementById("campos-artista")
    };

    // CATEGORIA INICIAL
    let categoriaAtual = "musica";


    // =========================================
    // 1. TROCAR A CATEGORIA
    // =========================================

    function selecionarCategoria(categoria) {

        categoriaAtual = categoria;

        // Atualiza os botões.
        opcoes.forEach((opcao) => {

            const selecionada =
                opcao.dataset.tipo === categoria;

            opcao.classList.toggle("ativa", selecionada);

            opcao.setAttribute(
                "aria-pressed",
                String(selecionada)
            );

        });


        // Mostra apenas os campos da categoria escolhida.
        Object.entries(grupos).forEach(([tipo, grupo]) => {

            const ativo = tipo === categoria;

            grupo.hidden = !ativo;

            // Campos ocultos deixam de ser obrigatórios.
            grupo.querySelectorAll("input").forEach((campo) => {

                campo.required = ativo;

            });

        });


        // =====================================
        // 2. ALTERAR TEXTO DO BOTÃO
        // =====================================

        const textos = {
            musica: "Enviar Música",
            album: "Enviar Álbum",
            artista: "Enviar Artista"
        };

        botaoEnviar.textContent = textos[categoria];

    }


    // =========================================
    // 3. EVENTOS DOS BOTÕES DE CATEGORIA
    // =========================================

    opcoes.forEach((opcao) => {

        opcao.addEventListener("click", () => {

            selecionarCategoria(opcao.dataset.tipo);

        });

    });


    // =========================================
    // 4. ENVIAR CADASTRO
    // =========================================

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        // Verifica apenas os campos da categoria atual.
        const grupoAtivo = grupos[categoriaAtual];

        const campos = grupoAtivo.querySelectorAll("input");

        let valido = true;

        campos.forEach((campo) => {

            if (!campo.value.trim()) {

                campo.reportValidity();
                valido = false;

            }

        });

        if (!valido) return;


        // Recupera os dados preenchidos.
        const dados = {};

        campos.forEach((campo) => {

            dados[campo.name] = campo.value.trim();

        });


        // Exibe confirmação demonstrativa.
        const nomes = {
            musica: "Música",
            album: "Álbum",
            artista: "Artista"
        };

        alert(
            nomes[categoriaAtual] +
            " preenchido(a) com sucesso!\n\n" +
            "Os dados estão prontos para serem enviados ao catálogo."
        );

        console.log("Categoria:", categoriaAtual);
        console.log("Dados:", dados);

        // O formulário ainda não salva no banco de dados.
        // A integração com o backend será feita posteriormente.

    });


    // =========================================
    // 5. CONFIGURAÇÃO INICIAL
    // =========================================

    selecionarCategoria("musica");

});
