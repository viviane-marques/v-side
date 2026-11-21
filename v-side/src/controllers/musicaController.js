var musicaModel = require("../models/musicaModel");

// Só aceitamos links do Spotify (e só https): o link vira um <a href> na tela,
// então nunca podemos guardar algo como "javascript:..."
var LINK_SPOTIFY = /^https:\/\/open\.spotify\.com\/\S*$/;

// Duração no formato mm:ss (ex.: 03:45)
var DURACAO = /^(\d{1,3}):([0-5]\d)$/;

// 225 segundos -> "03:45"
function formatarDuracao(segundos) {
    if (segundos === null || segundos === undefined) return null;
    var min = Math.floor(segundos / 60);
    var seg = segundos % 60;
    return String(min).padStart(2, "0") + ":" + String(seg).padStart(2, "0");
}

// Linha do banco -> objeto que vai para o site
function formatar(linha) {
    return {
        id: linha.id,
        titulo: linha.titulo,
        artista: linha.artista,
        album: linha.album,
        duracao: formatarDuracao(linha.duracaoSeg),
        linkSpotify: linha.linkSpotify
    };
}

// GET /musicas?busca=texto -> músicas do catálogo (de todos os usuários)
async function listar(req, res) {
    var termo = typeof req.query.busca === "string" ? req.query.busca.trim() : "";

    if (termo.length > 100) {
        return res.status(400).json({ erro: "A busca pode ter até 100 caracteres." });
    }

    // % e _ têm significado especial no LIKE; o "\" faz o MySQL tratá-los como letras comuns
    termo = termo.replace(/[\\%_]/g, "\\$&");

    try {
        var linhas = await musicaModel.listar(termo);
        res.json(linhas.map(formatar));
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar músicas." });
    }
}

// GET /musicas/:id -> uma música do catálogo
async function obter(req, res) {
    var id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ erro: "Música inválida." });
    }

    try {
        var linhas = await musicaModel.buscarPorId(id);

        if (linhas.length === 0) {
            return res.status(404).json({ erro: "Música não encontrada." });
        }
        res.json(formatar(linhas[0]));
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar a música." });
    }
}

// POST /musicas { titulo, artista, album?, duracao?, linkSpotify? }
// Qualquer usuário logado pode cadastrar; depois, TODOS podem avaliar.
async function cadastrar(req, res) {
    var usuarioId = req.session.usuarioId; // vem da SESSÃO, nunca do navegador

    var titulo = req.body.titulo;
    var artista = req.body.artista;
    var album = req.body.album;
    var duracao = req.body.duracao;
    var linkSpotify = req.body.linkSpotify;

    // Validações (os mesmos limites das colunas do banco)
    if (typeof titulo !== "string" || titulo.trim() === "" || titulo.trim().length > 150) {
        return res.status(400).json({ erro: "Informe o nome da música (até 150 caracteres)." });
    }
    if (typeof artista !== "string" || artista.trim() === "" || artista.trim().length > 100) {
        return res.status(400).json({ erro: "Informe o artista (até 100 caracteres)." });
    }
    if (album !== undefined && album !== null && (typeof album !== "string" || album.trim().length > 150)) {
        return res.status(400).json({ erro: "O álbum pode ter até 150 caracteres." });
    }

    // duração (opcional): "03:45" vira 225 segundos
    var duracaoSeg = null;
    if (duracao !== undefined && duracao !== null && String(duracao).trim() !== "") {
        var partes = DURACAO.exec(String(duracao).trim());
        if (!partes) {
            return res.status(400).json({ erro: "Informe a duração no formato mm:ss (ex.: 03:45)." });
        }
        duracaoSeg = Number(partes[1]) * 60 + Number(partes[2]);
    }

    // link (opcional): só do Spotify
    var link = null;
    if (linkSpotify !== undefined && linkSpotify !== null && String(linkSpotify).trim() !== "") {
        link = String(linkSpotify).trim();
        if (link.length > 300 || !LINK_SPOTIFY.test(link)) {
            return res.status(400).json({ erro: "O link precisa ser do Spotify (https://open.spotify.com/...)." });
        }
    }

    titulo = titulo.trim();
    artista = artista.trim();

    try {
        var resultado = await musicaModel.cadastrar(
            usuarioId, titulo, artista, album ? album.trim() : null, duracaoSeg, link
        );
        res.status(201).json({ id: resultado.insertId });
    } catch (erro) {
        // A chave UNIQUE (titulo + artista) do banco barrou uma música repetida.
        // Em vez de só recusar, devolvemos o id da que já existe: o site leva a pessoa para avaliá-la.
        if (erro && erro.code === "ER_DUP_ENTRY") {
            try {
                var existente = await musicaModel.buscarPorTituloArtista(titulo, artista);
                return res.status(409).json({
                    erro: "Essa música já está no catálogo.",
                    id: existente.length > 0 ? existente[0].id : null
                });
            } catch (erro2) {
                console.log(erro2);
            }
        }

        console.log(erro);
        res.status(500).json({ erro: "Erro ao cadastrar a música." });
    }
}

module.exports = {
    listar,
    obter,
    cadastrar
};