var database = require("../database/config");

// Os "?" são preenchidos pelo array do segundo argumento, na mesma ordem.
// O mysql2 escapa cada valor, então o que a pessoa digita NUNCA vira parte do SQL.

// Procura um usuário pelo email (usado no login e para impedir email repetido).
// Traz a senha (que é o HASH) porque o controller precisa compará-la.

function buscarPorEmail(email) {
    var instrucaoSql = "SELECT id, nome, email, senha FROM usuario WHERE email = ?;";
    return database.executar(instrucaoSql, [email]);
}

function buscarPorId(id) {
    var instrucaoSql = "SELECT id, nome, email FROM usuario WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

function cadastrar(nome, email, senhaHash) {
    var instrucaoSql = "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?);";
    return database.executar(instrucaoSql, [nome, email, senhaHash]);
}

// Perfil completo para a dashboard (inclui a foto, que é pesada demais
// para ir em toda requisição de /usuarios/sessao)
function buscarPerfil(id) {
    var instrucaoSql = "SELECT nome, email, foto FROM usuario WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

// Troca só o nome (a foto continua a mesma)
function atualizarNome(id, nome) {
    var instrucaoSql = "UPDATE usuario SET nome = ? WHERE id = ?;";
    return database.executar(instrucaoSql, [nome, id]);
}

// Troca nome E foto. foto = texto da imagem (nova foto) ou null (remover a foto)
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