var database = require("../database/config");

// lista de favs do usuario
function listarDoUsuario(usuarioId) {
    var instrucaoSql = `
        SELECT a.id AS avaliacaoId, a.artista, a.musica, a.album,
               f.criado_em AS criadoEm
        FROM favorito f
        JOIN avaliacao a ON a.id = f.fk_avaliacao
        WHERE f.fk_usuario = ?
        ORDER BY f.criado_em DESC, f.id DESC;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

function adicionar(usuarioId, avaliacaoId) {
    var instrucaoSql = "INSERT IGNORE INTO favorito (fk_usuario, fk_avaliacao) VALUES (?, ?);";
    return database.executar(instrucaoSql, [usuarioId, avaliacaoId]);
}

function remover(usuarioId, avaliacaoId) {
    var instrucaoSql = "DELETE FROM favorito WHERE fk_usuario = ? AND fk_avaliacao = ?;";
    return database.executar(instrucaoSql, [usuarioId, avaliacaoId]);
}

function removerVarios(usuarioId, avaliacaoIds) {
    var instrucaoSql = "DELETE FROM favorito WHERE fk_usuario = ? AND fk_avaliacao IN (?);";
    return database.executar(instrucaoSql, [usuarioId, avaliacaoIds]);
}

module.exports = {
    listarDoUsuario,
    adicionar,
    remover,
    removerVarios
};