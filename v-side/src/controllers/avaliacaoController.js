var avaliacaoModel = require("../models/avaliacaoModel");
var musicaModel = require("../models/musicaModel");

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
// POST /avaliacoes { musicaId, nota, resenha } -> salva uma nova avaliação no nome do usuário logado
// A música agora vem do CATÁLOGO: o navegador manda só o id, e o servidor busca
// título, artista e álbum no banco (assim ninguém grava dados inventados).
async function cadastrar(req, res) {
    var usuarioId = req.session.usuarioId;

    var musicaId = req.body.musicaId;
    var nota = req.body.nota;
    var resenha = req.body.resenha;

    // Validações
    if (!Number.isInteger(musicaId) || musicaId < 1) {
        return res.status(400).json({ erro: "Escolha uma música do catálogo." });
    }
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return res.status(400).json({ erro: "A nota precisa ser um número de 1 a 5." });
    }
    if (typeof resenha !== "string" || resenha.trim() === "" || resenha.trim().length > 1500) {
        return res.status(400).json({ erro: "Escreva a resenha (até 1500 caracteres)." });
    }

    try {
        // a música existe no catálogo?
        var encontradas = await musicaModel.buscarPorId(musicaId);

        if (encontradas.length === 0) {
            return res.status(404).json({ erro: "Música não encontrada no catálogo." });
        }

        var musica = encontradas[0];

        // fk_usuario = quem está logado (sessão). Mesmo que a música tenha sido cadastrada
        // por outra pessoa, a avaliação pertence SÓ a quem a escreveu.
        var resultado = await avaliacaoModel.cadastrar(
            usuarioId,
            musica.id,
            musica.titulo,
            musica.artista,
            musica.album || "",
            nota,
            resenha.trim()
        );

        res.status(201).json({ id: resultado.insertId });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao salvar a avaliação." });
    }
}

module.exports = {
    listar,
    cadastrar
};