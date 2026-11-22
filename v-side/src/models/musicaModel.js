var database = require("../database/config");

var COLUNAS = `
    id, titulo, artista, album, capa
`;

// pega as 10 musicas mais recentes ou pelo titulo artista ou album
function listar(termo) {
    var instrucaoSql = "SELECT " + COLUNAS + " FROM musica";
    var parametros = [];

    if (termo) {
        instrucaoSql += " WHERE titulo LIKE ? OR artista LIKE ? OR album LIKE ?";
        var padrao = "%" + termo + "%";
        parametros = [padrao, padrao, padrao];
    }

    instrucaoSql += " ORDER BY criado_em DESC, id DESC LIMIT 10;";
    return database.executar(instrucaoSql, parametros);
}

function buscarPorId(id) {
    var instrucaoSql = "SELECT " + COLUNAS + " FROM musica WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

function buscarPorTituloArtista(titulo, artista) {
    var instrucaoSql = "SELECT id FROM musica WHERE titulo = ? AND artista = ?;";
    return database.executar(instrucaoSql, [titulo, artista]);
}

// grava no banco qual usuario registrou qual musica no catalogo
function cadastrar(usuarioId, titulo, artista, album, capa) {
    var instrucaoSql = `
        INSERT INTO musica (fk_usuario, titulo, artista, album, capa)
        VALUES (?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [usuarioId, titulo, artista, album, capa]);
}

module.exports = {
    listar,
    buscarPorId,
    buscarPorTituloArtista,
    cadastrar
};