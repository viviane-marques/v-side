// deixa todos os nomes sde artista sem acento, minusculo entao rosalía vira rosalia
function chaveArtista(nome) {
    return String(nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

module.exports = { chaveArtista };