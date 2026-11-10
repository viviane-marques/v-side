
document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById(
        "formNovaAvaliacao"
    );

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const dados = {

            musica: document.getElementById("nomeMusica").value.trim(),

            artista: document.getElementById("nomeArtista").value.trim(),

            album: document.getElementById("nomeAlbum").value.trim(),

            resenha: document.getElementById("textoResenha").value.trim(),

            nota: document.querySelector(
                'input[name="nota"]:checked'
            )?.value

        };


        if (!dados.musica || !dados.artista || !dados.resenha || !dados.nota) {

            alert("Preencha os campos obrigatórios e escolha uma nota.");

            return;

        }


        alert("Sua avaliação foi preenchida com sucesso!");

        console.log("Nova avaliação:", dados);

        // Posteriormente, os dados serão enviados
        // para o banco de dados do V-Side.

    });

});
