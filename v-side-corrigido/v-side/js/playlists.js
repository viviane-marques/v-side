/* Busca e filtragem das playlists recomendadas. */
document.addEventListener("DOMContentLoaded", function () {
    const campoBusca = document.getElementById("buscaPlaylist");
    const playlists = document.querySelectorAll(".playlist-card");
    const mensagemVazia = document.getElementById("nenhumaPlaylist");
    if (!campoBusca || !mensagemVazia) return;

    campoBusca.addEventListener("input", function () {
        const pesquisa = campoBusca.value.toLocaleLowerCase("pt-BR").trim();
        let resultados = 0;
        playlists.forEach(function (playlist) {
            const corresponde = playlist.textContent.toLocaleLowerCase("pt-BR").includes(pesquisa);
            playlist.style.display = corresponde ? "flex" : "none";
            if (corresponde) resultados++;
        });
        mensagemVazia.style.display = resultados === 0 ? "block" : "none";
    });
});