// Serviço do jogo: sorteia uma música na iTunes Search API (Apple) e confere respostas.
// A API não precisa de chave. Limite: ~20 chamadas por minuto, por isso usamos cache.

// lista de artistas possíveis no jogo. posso editar aqui
var ARTISTAS = [
    "Arctic Monkeys", "Olivia Rodrigo", "Chappell Roan", "Jão", "The Neighbourhood",
    "Lagum", "ROLE MODEL", "Charlie Brown Jr.", "Chase Atlantic", "The 1975", "Twenty One Pilots",
    "Hayley Williams", "Paramore", "Harry Styles", "THE DRIVER ERA", "ANAVITÓRIA",
    "Sabrina Carpenter", "COIN", "Bad Suns", "Taylor Swift", "TV Girl", "NX Zero",
    "One Direction", "Mother Mother", "Clarissa", "Tame Impala"
]

// guarda uma lista de objetos (artistas) que guardam uma lista de músicas: { "coin": [musicas] }.
var cachePorArtista = {};

// tiram acentos, feat, remastered e etc para comparar os nomes
// deixa Jão = jao
function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// tira feat e "ao vivo" dos titulos: Expectations feat. Chappell Roan = expectations
// OMG Plz Don't Come Around = omg plz dont come around
function limparTitulo(titulo) {
    return normalizar(titulo)
        .replace(/\(.*?\)|\[.*?\]/g, " ")
        .replace(/\s-\s.*$/, " ")
        .replace(/['’`]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// desconsidera algumas letras erradas: rhapsody = rapsody
function distancia(a, b) {
    var anterior = [];
    for (var j = 0; j <= b.length; j++) anterior[j] = j;

    for (var i = 1; i <= a.length; i++) {
        var atual = [i];
        for (var k = 1; k <= b.length; k++) {
            var custo = a[i - 1] === b[k - 1] ? 0 : 1;
            atual[k] = Math.min(
                anterior[k] + 1,        // apagar
                atual[k - 1] + 1,       // inserir
                anterior[k - 1] + custo // trocar
            );
        }
        anterior = atual;
    }
    return anterior[b.length];
}

// aceita alguns erros de digitacao
function acertou(resposta, titulo) {
    var r = limparTitulo(resposta);
    var t = limparTitulo(titulo);
    if (r === "") return false;

    var tolerancia = t.length <= 5 ? 0 : (t.length <= 12 ? 1 : 2);
    return distancia(r, t) <= tolerancia;
}

// busca no itunes, filtra karaoke/cover/sem audio, remove repetidas e guarda no cache
async function buscarFaixas(artista) {
    var chave = normalizar(artista);
    if (cachePorArtista[chave]) return cachePorArtista[chave];

    var url = "https://itunes.apple.com/search"
        + "?term=" + encodeURIComponent(artista)
        + "&media=music&entity=song&attribute=artistTerm&country=BR&limit=50";

    var resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error("iTunes respondeu com status " + resposta.status);
    }

    var dados = await resposta.json();

    var vistos = {}; // evita a mesma música repetida (ex.: versão "Remastered")
    var faixas = [];

    dados.results.forEach(function (f) {
        if (!f.previewUrl) return;                                    // sem áudio, não serve
        if (normalizar(f.artistName).indexOf(chave) === -1) return;   // só músicas do próprio artista
        if (/karaok|tribute|instrumental|cover/.test(normalizar(f.trackName + " " + f.collectionName))) return;

        var nome = limparTitulo(f.trackName);
        if (vistos[nome]) return;
        vistos[nome] = true;

        faixas.push({
            titulo: f.trackName,
            artista: f.artistName,
            album: f.collectionName,
            // a capa vem em 100x100; trocar o tamanho no endereço devolve uma maior
            capa: f.artworkUrl100 ? f.artworkUrl100.replace("100x100", "600x600") : null,
            preview: f.previewUrl
        });
    });

    if (faixas.length > 0) cachePorArtista[chave] = faixas;
    return faixas;
}

// sorteia um artista e uma musica dele (ate 5 tentativas)
async function sortearMusica() {
    for (var tentativa = 0; tentativa < 5; tentativa++) {
        var artista = ARTISTAS[Math.floor(Math.random() * ARTISTAS.length)];
        var faixas = await buscarFaixas(artista);

        if (faixas.length > 0) {
            return faixas[Math.floor(Math.random() * faixas.length)];
        }
    }
    throw new Error("Nenhuma música encontrada");
}

module.exports = { sortearMusica, acertou };