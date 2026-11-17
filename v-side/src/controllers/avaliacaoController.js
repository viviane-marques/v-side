var avaliacaoModel = require("../models/avaliacaoModel");

// GET /avaliacoes -> as avaliações do usuário logado
function listar(req, res) {
    // O id vem da SESSÃO (servidor), nunca do navegador
    var usuarioId = req.session.usuarioId;

    avaliacaoModel.listarDoUsuario(usuarioId)
        .then(function (linhas) {
            // o MySQL devolve 0/1; aqui vira false/true
            var avaliacoes = linhas.map(function (linha) {
                linha.favoritada = Boolean(Number(linha.favoritada));
                return linha;
            });
            res.json(avaliacoes);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao buscar suas avaliações." });
        });
}

// POST /avaliacoes -> salva uma nova avaliação no nome do usuário logado
function cadastrar(req, res) {
    var usuarioId = req.session.usuarioId;

    var musica = req.body.musica;
    var artista = req.body.artista;
    var album = req.body.album;
    var nota = req.body.nota;
    var resenha = req.body.resenha;

    // Validações (os mesmos limites das colunas do banco)
    if (typeof musica !== "string" || musica.trim() === "" || musica.trim().length > 150) {
        return res.status(400).json({ erro: "Informe o nome da música (até 150 caracteres)." });
    }
    if (typeof artista !== "string" || artista.trim() === "" || artista.trim().length > 100) {
        return res.status(400).json({ erro: "Informe o artista (até 100 caracteres)." });
    }
    if (album !== undefined && album !== null && (typeof album !== "string" || album.trim().length > 150)) {
        return res.status(400).json({ erro: "O álbum pode ter até 150 caracteres." });
    }
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return res.status(400).json({ erro: "A nota precisa ser um número de 1 a 5." });
    }
    if (typeof resenha !== "string" || resenha.trim() === "" || resenha.trim().length > 1500) {
        return res.status(400).json({ erro: "Escreva a resenha (até 1500 caracteres)." });
    }

    avaliacaoModel.cadastrar(
        usuarioId,
        musica.trim(),
        artista.trim(),
        album ? album.trim() : "",
        nota,
        resenha.trim()
    )
        .then(function (resultado) {
            res.status(201).json({ id: resultado.insertId });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao salvar a avaliação." });
        });
}

module.exports = {
    listar,
    cadastrar
};