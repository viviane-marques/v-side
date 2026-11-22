var database = require("../database/config");

//subquerys para as kpis
function indicadores(usuarioId) {
    var instrucaoSql = `
        SELECT
            (SELECT COUNT(*)               FROM avaliacao WHERE fk_usuario = ?) AS avaliacoes,
            (SELECT AVG(nota)              FROM avaliacao WHERE fk_usuario = ?) AS media,
            (SELECT COUNT(*)               FROM favorito  WHERE fk_usuario = ?) AS favoritos,
            (SELECT COUNT(*)               FROM playlist  WHERE fk_usuario = ?) AS playlists;
    `;
    return database.executar(instrucaoSql, [usuarioId, usuarioId, usuarioId, usuarioId]);
}

// media e quantidade de avaliacoes por mes no ano atual
function serieMensal(usuarioId) {
    var instrucaoSql = `
        SELECT MONTH(criado_em) AS mes,
               AVG(nota)        AS media,
               COUNT(*)         AS quantidade
        FROM avaliacao
        WHERE fk_usuario = ?
          AND YEAR(criado_em) = YEAR(CURDATE())
        GROUP BY MONTH(criado_em)
        ORDER BY mes;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

// subquerys para atividades recentes (ultimas 7 pra caber)
function atividades(usuarioId) {
    var instrucaoSql = `
        (SELECT 'avaliacao' AS tipo, a.musica, a.artista, a.nota,
                a.criado_em AS quando,
                TIMESTAMPDIFF(SECOND, a.criado_em, NOW()) AS segundos
         FROM avaliacao a
         WHERE a.fk_usuario = ?)
        UNION ALL
        (SELECT 'favorito', a.musica, a.artista, NULL,
                f.criado_em,
                TIMESTAMPDIFF(SECOND, f.criado_em, NOW())
         FROM favorito f
         JOIN avaliacao a ON a.id = f.fk_avaliacao
         WHERE f.fk_usuario = ?)
        ORDER BY quando DESC
        LIMIT 7;
    `;
    return database.executar(instrucaoSql, [usuarioId, usuarioId]);
}

// total de partidas e acertos no jogo
function jogo(usuarioId) {
    var instrucaoSql = `
        SELECT COUNT(*)     AS partidas,
               SUM(acertou) AS acertos
        FROM partida
        WHERE fk_usuario = ?;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

module.exports = {
    indicadores,
    jogo,
    serieMensal,
    atividades
};