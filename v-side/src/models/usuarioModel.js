var database = require("../database/config")

// Os "?" são preenchidos pelo array do segundo argumento, na mesma ordem.
// O mysql2 escapa cada valor, então o que a pessoa digita NUNCA vira parte do SQL.

// Procura um usuário pelo email (usado no login e para impedir email repetido).
// Traz a senha (que é o HASH) porque o controller precisa compará-la.

function buscarPorEmail(email) {
    var instrucaoSql = "SELECT id, nome, email, senha FROM usuario WHERE email = ?;";
    return database.executar(instrucaoSql, [email]);
}

// Procura pelo id (usado para confirmar quem está logado). Não traz a senha.
function buscarPorId(id) {
    var instrucaoSql = "SELECT id, nome, email FROM usuario WHERE id = ?;";
    return database.executar(instrucaoSql, [id]);
}

// Grava um novo usuário. Aqui a senha já chega como hash (nunca texto puro).
function cadastrar(nome, email, senhaHash) {
    var instrucaoSql = "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?);";
    return database.executar(instrucaoSql, [nome, email, senhaHash]);
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    cadastrar
};