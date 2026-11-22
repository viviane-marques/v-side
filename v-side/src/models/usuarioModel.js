var database = require("../database/config");

function buscarPorEmail(email) {
    var instrucaoSql = "SELECT id, nome, email, senha FROM usuario WHERE email = ?;";
    return database.executar(instrucaoSql, [email]);
}

function buscarPorId(id) {
    var instrucaoSql = "SELECT id, nome, email FROM usuario WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

// Coloque os mesmos parâmetros aqui. Vá para a var instrucaoSql
function cadastrar(nome, email, senhaHash) {
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?);";
    return database.executar(instrucaoSql, [nome, email, senhaHash]);
}

function buscarPerfil(id) {
    var instrucaoSql = "SELECT nome, email, foto FROM usuario WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

function atualizarNome(id, nome) {
    var instrucaoSql = "UPDATE usuario SET nome = ? WHERE id = ?;";
    return database.executar(instrucaoSql, [nome, id]);
}

function atualizarPerfil(id, nome, foto) {
    var instrucaoSql = "UPDATE usuario SET nome = ?, foto = ? WHERE id = ?;";
    return database.executar(instrucaoSql, [nome, foto, id]);
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    cadastrar,
    buscarPerfil,
    atualizarNome,
    atualizarPerfil
};