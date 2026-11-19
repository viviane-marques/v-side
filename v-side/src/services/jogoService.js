// Serviço do jogo: sorteia uma música na iTunes Search API (Apple) e confere respostas.
// A API não precisa de chave. Limite: ~20 chamadas por minuto, por isso usamos cache.

// Artistas sorteados a cada rodada. EDITE À VONTADE: troque por quem você quiser.
var ARTISTAS = [
    "Arctic Monkeys", "Olivia Rodrigo", "Chappell Roan", "Jão", "The Neighbourhood",
    "Lagum", "ROLE MODEL", "Charlie Brown Jr.", "Chase Atlantic", "The 1975", "Twenty One Pilots",
    "Hayley Williams", "Paramore", "Harry Styles", "THE DRIVER ERA", "ANAVITÓRIA",
    "Sabrina Carpenter", "COIN", "Bad Suns", "Taylor Swift", "TV Girl", "NX Zero",
    "One Direction", "Mother Mother", "Clarissa", "Tame Impala"
]

// Guarda na memória as faixas já buscadas de cada artista: { "queen": [faixas] }.
// Assim o mesmo artista não gasta uma nova chamada à API.
var cachePorArtista = {};

// "Beyoncé" -> "beyonce" (sem acento e em minúsculas)
function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// Deixa só o "nome puro" da música, para comparar com o que a pessoa digitou:
// "Bohemian Rhapsody - Remastered 2011" -> "bohemian rhapsody"
// "Don't Stop Me Now (feat. X)"         -> "dont stop me now"
function limparTitulo(titulo) {
    return normalizar(titulo)
        .replace(/\(.*?\)|\[.*?\]/g, " ")   // tira (feat. X) e [Remastered]
        .replace(/\s-\s.*$/, " ")           // tira " - Remastered 2011", " - Ao Vivo"
        .replace(/['’`]/g, "")              // "don't" vira "dont"
        .replace(/[^a-z0-9 ]/g, " ")        // pontuação vira espaço
        .replace(/\s+/g, " ")
        .trim();
}

// Distância de Levenshtein: quantas letras precisam mudar para um texto virar o outro.
// Serve para aceitar pequenos erros de digitação ("rapsody" ~ "rhapsody").
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

// A resposta está certa? Tolerância: nome curto = exato; médio = 1 erro; longo = 2 erros.
function acertou(resposta, titulo) {
    var r = limparTitulo(resposta);
    var t = limparTitulo(titulo);
    if (r === "") return false;

    var tolerancia = t.length <= 5 ? 0 : (t.length <= 12 ? 1 : 2);
    return distancia(r, t) <= tolerancia;
}

// Busca as faixas de um artista no iTunes (ou devolve do cache)
async function buscarFaixas(artista) {
    var chave = normalizar(artista);
    if (cachePorArtista[chave]) return cachePorArtista[chave];

    // media=music&entity=song -> só músicas | attribute=artistTerm -> busca pelo nome do artista
    // country=BR -> loja brasileira | limit=50 -> até 50 resultados
    var url = "https://itunes.apple.com/search"
        + "?term=" + encodeURIComponent(artista)
        + "&media=music&entity=song&attribute=artistTerm&country=BR&limit=50";

    var resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error("iTunes respondeu com status " + resposta.status);
    }

    // o iTunes responde com Content-Type "text/javascript", mas o corpo é JSON normal
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

// Sorteia uma música: escolhe um artista e uma faixa dele (tenta até 5 artistas)
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