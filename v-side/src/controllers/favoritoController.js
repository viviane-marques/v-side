var favoritoModel = require("../models/favoritoModel");
var avaliacaoModel = require("../models/avaliacaoModel");
var chaveArtista = require("../utils/artista").chaveArtista;

// junta as musicas do chaveArtista e mostra tudo junto nos favs
function agruparPorArtista(linhas) {
    var grupos = {};

    linhas.forEach(function (linha) {
        var chave = chaveArtista(linha.artista);

        if (!grupos[chave]) {
            grupos[chave] = {
                id: chave,                 // identifica o artista nas chamadas da API
                artista: linha.artista,    // nome como foi digitado na avaliação do favorito mais recente
                musicas: [],
                criadoEm: linha.criadoEm   // data do favorito mais recente
            };
        }

        grupos[chave].musicas.push({
            avaliacaoId: linha.avaliacaoId,
            musica: linha.musica,
            album: linha.album
        });
    });

    return Object.keys(grupos).map(function (chave) {
        return grupos[chave];
    });
}

// mostra os artistas agrupados
function listar(req, res) {
    var usuarioId = req.session.usuarioId;

    favoritoModel.listarDoUsuario(usuarioId)
        .then(function (linhas) {
            res.json(agruparPorArtista(linhas));
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao buscar seus favoritos." });
        });
}

// nao deixa o usuario favoritar avaliaacoes que nao sao dele
function adicionar(req, res) {
    var usuarioId = req.session.usuarioId;
    var avaliacaoId = req.body.avaliacaoId;

    if (!Number.isInteger(avaliacaoId) || avaliacaoId < 1) {
        return res.status(400).json({ erro: "Avaliação inválida." });
    }

    avaliacaoModel.buscarDoUsuario(usuarioId, avaliacaoId)
        .then(function (encontradas) {
            if (encontradas.length === 0) {
                res.status(404).json({ erro: "Avaliação não encontrada." });
                return;
            }

            return favoritoModel.adicionar(usuarioId, avaliacaoId).then(function () {
                res.status(201).json({ favoritada: true });
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao favoritar." });
        });
}

// desfav
function remover(req, res) {
    var usuarioId = req.session.usuarioId;
    var avaliacaoId = Number(req.params.avaliacaoId);

    if (!Number.isInteger(avaliacaoId) || avaliacaoId < 1) {
        return res.status(400).json({ erro: "Avaliação inválida." });
    }

    favoritoModel.remover(usuarioId, avaliacaoId)
        .then(function () {
            res.json({ favoritada: false });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao remover o favorito." });
        });
}

// desfav todas as musicas do artista de uma vez
function removerArtista(req, res) {
    var usuarioId = req.session.usuarioId;
    var artistaId = String(req.params.artistaId || "");

    favoritoModel.listarDoUsuario(usuarioId)
        .then(function (linhas) {
            // pega o id de cada música cujo artista tem a mesma chave
            var ids = linhas
                .filter(function (linha) { return chaveArtista(linha.artista) === artistaId; })
                .map(function (linha) { return linha.avaliacaoId; });

            if (ids.length === 0) {
                return res.json({ removidas: 0 });
            }

            return favoritoModel.removerVarios(usuarioId, ids).then(function () {
                res.json({ removidas: ids.length });
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao remover o artista dos favoritos." });
        });
}

module.exports = {
    listar,
    adicionar,
    remover,
    removerArtista
};