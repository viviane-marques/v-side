var database = require("../database/config");

// Lista as avaliações DE UM usuário (o WHERE fk_usuario = ? é o que garante
// que ninguém veja avaliação alheia). O LEFT JOIN diz se cada música já foi
// favoritada por ele: favoritada = 1 se existe linha em favorito, senão 0.
function listarDoUsuario(usuarioId) {
    var instrucaoSql = `
        SELECT a.id, a.musica, a.artista, a.album, a.nota, a.resenha,
               a.criado_em AS criadoEm,
               (f.id IS NOT NULL) AS favoritada
        FROM avaliacao a
        LEFT JOIN favorito f
               ON f.fk_avaliacao = a.id AND f.fk_usuario = a.fk_usuario
        WHERE a.fk_usuario = ?
        ORDER BY a.criado_em DESC, a.id DESC;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

function cadastrar(usuarioId, musicaId, musica, artista, album, nota, resenha) {
    var instrucaoSql = `
        INSERT INTO avaliacao (fk_usuario, fk_musica, musica, artista, album, nota, resenha)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [usuarioId, musicaId, musica, artista, album, nota, resenha]);
}

function buscarDoUsuario(usuarioId, avaliacaoId) {
    var instrucaoSql = "SELECT id FROM avaliacao WHERE id = ? AND fk_usuario = ?;";
    return database.executar(instrucaoSql, [avaliacaoId, usuarioId]);
}

module.exports = {
    listarDoUsuario,
    cadastrar,
    buscarDoUsuario
};