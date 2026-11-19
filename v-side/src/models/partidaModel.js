var database = require("../database/config");

// Guarda o resultado de uma rodada do jogo (só para usuário logado).
function registrar(usuarioId, acertou, tentativas) {
    var instrucaoSql = `
        INSERT INTO partida (fk_usuario, acertou, tentativas)
        VALUES (?, ?, ?);
    `;
    return database.executar(instrucaoSql, [usuarioId, acertou ? 1 : 0, tentativas]);
}

module.exports = {
    registrar
};