/* =========================================
   EXPANSÃO DAS RESENHAS
========================================= */

// Seleciona todos os botões de resenha
const botoesResenha = document.querySelectorAll(".botao-resenha");

// Percorre cada botão
botoesResenha.forEach((botao) => {

    // Adiciona o evento de clique
    botao.addEventListener("click", () => {

        // Encontra o card ao qual o botão pertence
        const card = botao.closest(".card-avaliacao");

        // Verifica se o card já está aberto
        const estaAberto = card.classList.contains("aberto");

        // Alterna a classe que controla a expansão
        card.classList.toggle("aberto");

        // Atualiza a informação de acessibilidade
        botao.setAttribute("aria-expanded", !estaAberto);

        // Atualiza o texto do botão
        if (estaAberto) {
            botao.textContent = "Clique para ver a resenha";
        } else {
            botao.textContent = "Ocultar resenha";
        }

    });

});