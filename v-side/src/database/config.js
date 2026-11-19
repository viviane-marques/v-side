var mysql = require("mysql2");

// POOL de conexões: mantém algumas conexões abertas e reaproveita
// (o template abria e fechava uma conexão a cada consulta).
var pool = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306, // o .env entrega texto, aqui vira número
    waitForConnections: true,                  // se todas estiverem ocupadas, espera uma liberar
    connectionLimit: 10,                       // no máximo 10 conexões simultâneas
    charset: "utf8mb4"                         // acentos e emojis funcionam direito
});

// executar(instrucao, parametros)
//  - instrucao: o SQL, com "?" no lugar dos valores
//  - parametros: array com os valores, na ordem dos "?"
// Exemplo: executar("SELECT * FROM usuario WHERE email = ?", [email])
// O mysql2 escapa os valores sozinho, então não existe SQL injection por aqui.
function executar(instrucao, parametros) {

    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        console.log("\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU .env.dev OU app.js\n");
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    return new Promise(function (resolve, reject) {
        pool.query(instrucao, parametros || [], function (erro, resultados) {
            if (erro) {
                // mostra só o essencial do erro no terminal
                console.log("ERRO NO MySQL:", erro.code, erro.sqlMessage || erro.message);
                return reject(erro);
            }
            resolve(resultados);
        });
    });
}

// transacao(passos): executa vários comandos como UMA operação só.
// Se qualquer um falhar, o MySQL desfaz tudo (rollback).
// Uso:
//   database.transacao(async function (consulta) {
//       await consulta("INSERT ...", [valores]);
//       await consulta("DELETE ...", [valores]);
//   });
function transacao(passos) {
    return new Promise(function (resolve, reject) {
        // pega UMA conexão do pool (a transação precisa usar a mesma conexão do início ao fim)
        pool.getConnection(function (erro, conexao) {
            if (erro) return reject(erro);

            // desfaz tudo, devolve a conexão ao pool e repassa o erro
            function falhar(motivo) {
                conexao.rollback(function () {
                    conexao.release();
                    reject(motivo);
                });
            }

            conexao.beginTransaction(function (erro) {
                if (erro) {
                    conexao.release();
                    return reject(erro);
                }

                // "consulta" é o equivalente de executar(), mas preso a esta conexão
                function consulta(instrucao, parametros) {
                    return new Promise(function (res, rej) {
                        conexao.query(instrucao, parametros || [], function (e, r) {
                            if (e) return rej(e);
                            res(r);
                        });
                    });
                }

                passos(consulta)
                    .then(function (resultado) {
                        // deu tudo certo: confirma as alterações
                        conexao.commit(function (erro) {
                            if (erro) return falhar(erro);
                            conexao.release();
                            resolve(resultado);
                        });
                    })
                    .catch(falhar);
            });
        });
    });
}

module.exports = {
    executar,
    transacao
};