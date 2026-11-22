var database = require("../database/config");

function listarDoUsuario(usuarioId) {
    var instrucaoSql = `
        SELECT p.id, p.titulo, p.descricao, p.capa,
               (SELECT COUNT(*) FROM playlist_musica pm WHERE pm.fk_playlist = p.id) AS total
        FROM playlist p
        WHERE p.fk_usuario = ?
        ORDER BY p.atualizado_em DESC, p.id DESC;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

function listarMusicasDoUsuario(usuarioId) {
    var instrucaoSql = `
        SELECT pm.fk_playlist AS playlistId, a.id AS avaliacaoId,
               a.musica, a.artista, a.album, a.nota
        FROM playlist_musica pm
        JOIN playlist p ON p.id = pm.fk_playlist
        JOIN avaliacao a ON a.id = pm.fk_avaliacao
        WHERE p.fk_usuario = ?
        ORDER BY pm.fk_playlist, pm.posicao;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

function buscarDoUsuario(usuarioId, playlistId) {
    var instrucaoSql = "SELECT id, titulo, descricao, capa FROM playlist WHERE id = ? AND fk_usuario = ?;";
    return database.executar(instrucaoSql, [playlistId, usuarioId]);
}

function listarMusicasDaPlaylist(playlistId) {
    var instrucaoSql = `
        SELECT a.id AS avaliacaoId, a.musica, a.artista, a.album, a.nota
        FROM playlist_musica pm
        JOIN avaliacao a ON a.id = pm.fk_avaliacao
        WHERE pm.fk_playlist = ?
        ORDER BY pm.posicao;
    `;
    return database.executar(instrucaoSql, [playlistId]);
}

function contarAvaliacoesDoUsuario(usuarioId, ids) {
    var instrucaoSql = "SELECT COUNT(*) AS total FROM avaliacao WHERE fk_usuario = ? AND id IN (?);";
    return database.executar(instrucaoSql, [usuarioId, ids]);
}

// insere varias linhas por vez
async function inserirMusicas(consulta, playlistId, ids) {
    if (ids.length === 0) return;

    var linhas = ids.map(function (avaliacaoId, indice) {
        return [playlistId, avaliacaoId, indice];
    });

    await consulta(
        "INSERT INTO playlist_musica (fk_playlist, fk_avaliacao, posicao) VALUES ?;",
        [linhas]
    );
}

function criar(usuarioId, titulo, descricao, capa, ids) {
    return database.transacao(async function (consulta) {
        var resultado = await consulta(
            "INSERT INTO playlist (fk_usuario, titulo, descricao, capa) VALUES (?, ?, ?, ?);",
            [usuarioId, titulo, descricao, capa === undefined ? null : capa]
        );
        await inserirMusicas(consulta, resultado.insertId, ids);
        return resultado.insertId;
    });
}

function atualizar(usuarioId, playlistId, titulo, descricao, capa, ids) {
    return database.transacao(async function (consulta) {

        if (capa === undefined) {
            await consulta(
                "UPDATE playlist SET titulo = ?, descricao = ?, atualizado_em = NOW() WHERE id = ? AND fk_usuario = ?;",
                [titulo, descricao, playlistId, usuarioId]
            );
        } else {
            await consulta(
                "UPDATE playlist SET titulo = ?, descricao = ?, capa = ?, atualizado_em = NOW() WHERE id = ? AND fk_usuario = ?;",
                [titulo, descricao, capa, playlistId, usuarioId]
            );
        }

        await consulta("DELETE FROM playlist_musica WHERE fk_playlist = ?;", [playlistId]);
        await inserirMusicas(consulta, playlistId, ids);
    });
}

function excluir(usuarioId, playlistId) {
    var instrucaoSql = "DELETE FROM playlist WHERE id = ? AND fk_usuario = ?;";
    return database.executar(instrucaoSql, [playlistId, usuarioId]);
}

module.exports = {
    listarDoUsuario,
    listarMusicasDoUsuario,
    buscarDoUsuario,
    listarMusicasDaPlaylist,
    contarAvaliacoesDoUsuario,
    criar,
    atualizar,
    excluir
};