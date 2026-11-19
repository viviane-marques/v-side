var database = require("../database/config");

// Playlists de UM usuário (sem as músicas). "total" = quantas músicas cada uma tem.
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

// Músicas de TODAS as playlists do usuário, de uma vez (o controller agrupa por playlist).
// JOIN com avaliacao: a "música" da playlist é, na verdade, uma avaliação do usuário.
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

// UMA playlist, mas só se for do usuário (o "AND fk_usuario = ?" barra playlist alheia)
function buscarDoUsuario(usuarioId, playlistId) {
    var instrucaoSql = "SELECT id, titulo, descricao, capa FROM playlist WHERE id = ? AND fk_usuario = ?;";
    return database.executar(instrucaoSql, [playlistId, usuarioId]);
}

// Músicas de uma playlist, na ordem em que foram adicionadas
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

// Dos ids informados, quantos são MESMO avaliações deste usuário?
// (se o número for menor que o enviado, alguém tentou usar avaliação de outra pessoa)
// "IN (?)" com um array: o mysql2 transforma em IN (1, 2, 3)
function contarAvaliacoesDoUsuario(usuarioId, ids) {
    var instrucaoSql = "SELECT COUNT(*) AS total FROM avaliacao WHERE fk_usuario = ? AND id IN (?);";
    return database.executar(instrucaoSql, [usuarioId, ids]);
}

// Auxiliar: insere várias músicas de uma vez. "VALUES ?" recebe uma lista de linhas.
async function inserirMusicas(consulta, playlistId, ids) {
    if (ids.length === 0) return; // playlist vazia é permitida

    // cada linha: [playlist, avaliacao, posicao]. A posição é o índice no array (0, 1, 2...)
    var linhas = ids.map(function (avaliacaoId, indice) {
        return [playlistId, avaliacaoId, indice];
    });

    await consulta(
        "INSERT INTO playlist_musica (fk_playlist, fk_avaliacao, posicao) VALUES ?;",
        [linhas]
    );
}

// Cria a playlist E suas músicas numa transação. Devolve o id da nova playlist.
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

// Edita a playlist e SUBSTITUI a lista de músicas pela nova (apaga as antigas e insere as atuais).
//   capa === undefined -> mantém a capa que já está salva
//   capa === null      -> remove a capa
//   capa === "data:..."-> nova capa
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

// Apaga a playlist (as linhas de playlist_musica vão junto, por causa do ON DELETE CASCADE).
// As AVALIAÇÕES não são apagadas.
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