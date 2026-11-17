var database = require("../database/config");

// Todas as músicas favoritadas por um usuário, com os dados da avaliação.
// O agrupamento por artista é feito no controller.
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

// INSERT IGNORE: se já estiver favoritada (UNIQUE), não dá erro, só não repete
function adicionar(usuarioId, avaliacaoId) {
    var instrucaoSql = "INSERT IGNORE INTO favorito (fk_usuario, fk_avaliacao) VALUES (?, ?);";
    return database.executar(instrucaoSql, [usuarioId, avaliacaoId]);
}

// Desfavorita uma música
function remover(usuarioId, avaliacaoId) {
    var instrucaoSql = "DELETE FROM favorito WHERE fk_usuario = ? AND fk_avaliacao = ?;";
    return database.executar(instrucaoSql, [usuarioId, avaliacaoId]);
}

// Desfavorita várias músicas de uma vez (usado ao remover um artista).
// O "IN (?)" recebe um array e o mysql2 transforma em (1, 2, 3).
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