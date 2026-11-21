var database = require("../database/config");

// Colunas devolvidas ao site. NÃO inclui fk_usuario: ninguém precisa saber
// quem cadastrou a música (e isso protege a privacidade de quem cadastrou).
var COLUNAS = `
    id, titulo, artista, album, capa
`;

// Lista até 10 músicas do catálogo (de TODOS os usuários).
//   sem termo -> as 10 mais recentes (assim a pessoa já vê algo ao abrir a tela)
//   com termo -> as que contêm o termo no título, no artista ou no álbum
// Os "?" são preenchidos pelo array: o mysql2 escapa tudo, sem SQL injection.
function listar(termo) {
    var instrucaoSql = "SELECT " + COLUNAS + " FROM musica";
    var parametros = [];

    if (termo) {
        instrucaoSql += " WHERE titulo LIKE ? OR artista LIKE ? OR album LIKE ?";
        var padrao = "%" + termo + "%"; // % = "qualquer texto antes/depois"
        parametros = [padrao, padrao, padrao];
    }

    instrucaoSql += " ORDER BY criado_em DESC, id DESC LIMIT 10;";
    return database.executar(instrucaoSql, parametros);
}

function buscarPorId(id) {
    var instrucaoSql = "SELECT " + COLUNAS + " FROM musica WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

// Usado quando o cadastro é recusado por duplicidade: descobre o id da música que já existe.
// A comparação ignora maiúsculas e acentos por causa da collation da coluna (veja o SQL).
function buscarPorTituloArtista(titulo, artista) {
    var instrucaoSql = "SELECT id FROM musica WHERE titulo = ? AND artista = ?;";
    return database.executar(instrucaoSql, [titulo, artista]);
}

// Grava a música no catálogo, registrando quem cadastrou
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