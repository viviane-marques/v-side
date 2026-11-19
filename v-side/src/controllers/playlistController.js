var playlistModel = require("../models/playlistModel");

// Mesmo formato de imagem aceito na foto do perfil (JPG, PNG ou WEBP em base64)
var FORMATO_CAPA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/]+=*$/;

// Valida o corpo enviado ao criar/editar. Devolve { erro } ou { dados } já limpo.
// O servidor nunca confia no que veio do navegador.
function validarCorpo(corpo) {
    var titulo = corpo.titulo;
    var descricao = corpo.descricao;
    var capa = corpo.capa;
    var avaliacoes = corpo.avaliacoes;

    if (typeof titulo !== "string" || titulo.trim() === "" || titulo.trim().length > 80) {
        return { erro: "Dê um título à playlist (até 80 caracteres)." };
    }

    if (descricao !== undefined && descricao !== null &&
        (typeof descricao !== "string" || descricao.trim().length > 300)) {
        return { erro: "A descrição pode ter até 300 caracteres." };
    }

    // capa: undefined = não mexeu | null = remover | texto = nova imagem
    if (capa !== undefined && capa !== null) {
        if (typeof capa !== "string" || capa.length > 300000 || !FORMATO_CAPA.test(capa)) {
            return { erro: "Capa inválida. Use uma imagem JPG, PNG ou WEBP." };
        }
    }

    // avaliacoes: lista de ids. Tem que ser um array de números inteiros.
    if (!Array.isArray(avaliacoes) || avaliacoes.length > 500) {
        return { erro: "Lista de músicas inválida." };
    }

    var ids = [];
    for (var i = 0; i < avaliacoes.length; i++) {
        var id = avaliacoes[i];
        if (!Number.isInteger(id) || id < 1) {
            return { erro: "Lista de músicas inválida." };
        }
        // ignora repetidos (a mesma música não entra duas vezes)
        if (ids.indexOf(id) === -1) {
            ids.push(id);
        }
    }

    return {
        dados: {
            titulo: titulo.trim(),
            descricao: descricao ? descricao.trim() : null,
            capa: capa,
            ids: ids
        }
    };
}

// Todas as avaliações enviadas são do usuário logado?
async function avaliacoesSaoDoUsuario(usuarioId, ids) {
    if (ids.length === 0) return true;
    var resultado = await playlistModel.contarAvaliacoesDoUsuario(usuarioId, ids);
    return Number(resultado[0].total) === ids.length;
}

// Converte o :id da URL em número (ou null se for inválido)
function lerId(req) {
    var id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /playlists -> as playlists do usuário logado, já com as músicas de cada uma
async function listar(req, res) {
    var usuarioId = req.session.usuarioId; // vem da SESSÃO, nunca do navegador

    try {
        var playlists = await playlistModel.listarDoUsuario(usuarioId);
        var musicas = await playlistModel.listarMusicasDoUsuario(usuarioId);

        // agrupa as músicas pelo id da playlist: { 5: [musica, musica], 7: [...] }
        var porPlaylist = {};
        musicas.forEach(function (m) {
            if (!porPlaylist[m.playlistId]) porPlaylist[m.playlistId] = [];
            porPlaylist[m.playlistId].push(m);
        });

        playlists.forEach(function (p) {
            p.total = Number(p.total);
            p.musicas = porPlaylist[p.id] || [];
        });

        res.json(playlists);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar suas playlists." });
    }
}

// GET /playlists/:id -> uma playlist com suas músicas (usada na tela de edição)
async function obter(req, res) {
    var id = lerId(req);
    if (!id) return res.status(400).json({ erro: "Playlist inválida." });

    try {
        var encontradas = await playlistModel.buscarDoUsuario(req.session.usuarioId, id);

        // 404 também quando a playlist é de OUTRA pessoa (não revela que ela existe)
        if (encontradas.length === 0) {
            return res.status(404).json({ erro: "Playlist não encontrada." });
        }

        var playlist = encontradas[0];
        playlist.musicas = await playlistModel.listarMusicasDaPlaylist(id);
        res.json(playlist);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar a playlist." });
    }
}

// POST /playlists  { titulo, descricao?, capa?, avaliacoes: [ids] }
async function criar(req, res) {
    var usuarioId = req.session.usuarioId;

    var validacao = validarCorpo(req.body);
    if (validacao.erro) return res.status(400).json({ erro: validacao.erro });
    var d = validacao.dados;

    try {
        if (!(await avaliacoesSaoDoUsuario(usuarioId, d.ids))) {
            return res.status(400).json({ erro: "Só é possível adicionar as suas próprias avaliações." });
        }

        var novoId = await playlistModel.criar(usuarioId, d.titulo, d.descricao, d.capa, d.ids);
        res.status(201).json({ id: novoId });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao criar a playlist." });
    }
}

// PUT /playlists/:id  { titulo, descricao?, capa?, avaliacoes: [ids] }
async function atualizar(req, res) {
    var usuarioId = req.session.usuarioId;

    var id = lerId(req);
    if (!id) return res.status(400).json({ erro: "Playlist inválida." });

    var validacao = validarCorpo(req.body);
    if (validacao.erro) return res.status(400).json({ erro: validacao.erro });
    var d = validacao.dados;

    try {
        // a playlist existe e é MINHA?
        var encontradas = await playlistModel.buscarDoUsuario(usuarioId, id);
        if (encontradas.length === 0) {
            return res.status(404).json({ erro: "Playlist não encontrada." });
        }

        if (!(await avaliacoesSaoDoUsuario(usuarioId, d.ids))) {
            return res.status(400).json({ erro: "Só é possível adicionar as suas próprias avaliações." });
        }

        await playlistModel.atualizar(usuarioId, id, d.titulo, d.descricao, d.capa, d.ids);
        res.json({ ok: true });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao salvar a playlist." });
    }
}

// DELETE /playlists/:id
async function excluir(req, res) {
    var id = lerId(req);
    if (!id) return res.status(400).json({ erro: "Playlist inválida." });

    try {
        var resultado = await playlistModel.excluir(req.session.usuarioId, id);

        // affectedRows = 0 -> não existia ou era de outra pessoa
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: "Playlist não encontrada." });
        }

        res.json({ ok: true });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao excluir a playlist." });
    }
}

module.exports = {
    listar,
    obter,
    criar,
    atualizar,
    excluir
};