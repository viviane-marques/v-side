// Gera a "chave" de um artista para agrupar nomes que são o mesmo artista:
// "Twenty One Pilots", "twenty one pilots " e "TWENTY ONE PILOTS" viram a mesma chave.
// (também ignora acentos: "Beyoncé" = "beyonce")
function chaveArtista(nome) {
    return String(nome || "")
        .normalize("NFD")                 // separa a letra do acento (é + ´)
        .replace(/[\u0300-\u036f]/g, "")  // remove os acentos
        .toLowerCase()
        .replace(/\s+/g, " ")             // vários espaços viram um só
        .trim();
}

module.exports = { chaveArtista };