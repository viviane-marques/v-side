var database = require("../database/config");

// Os 4 números dos cards, numa consulta só (4 sub-consultas).
// Todas filtram por fk_usuario: cada pessoa só soma o que é dela.
function indicadores(usuarioId) {
    var instrucaoSql = `
        SELECT
            (SELECT COUNT(*)               FROM avaliacao WHERE fk_usuario = ?) AS avaliacoes,
            (SELECT AVG(nota)              FROM avaliacao WHERE fk_usuario = ?) AS media,
            (SELECT COUNT(*)               FROM favorito  WHERE fk_usuario = ?) AS favoritos,
            (SELECT COUNT(DISTINCT artista) FROM avaliacao WHERE fk_usuario = ?) AS artistas;
    `;
    return database.executar(instrucaoSql, [usuarioId, usuarioId, usuarioId, usuarioId]);
}

// Média das notas e quantidade de avaliações por mês, no ano atual.
// Só vêm os meses em que houve avaliação (o controller completa os outros).
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

// Últimas 7 atividades: junta avaliações e favoritos numa lista só (UNION ALL)
// e ordena da mais recente para a mais antiga.
// "segundos" = quanto tempo faz, calculado PELO MySQL (assim não depende do
// fuso horário do navegador nem do Node).
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

module.exports = {
    indicadores,
    serieMensal,
    atividades
};