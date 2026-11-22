var mysql = require("mysql2");

// permite ate 10 conexoes reaproveitadas lendo as infos do .env
var pool = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,                  
    charset: "utf8mb4"                       
});

// nao roda se AMBIENTE_PROCESSO não tiver definido, os ? sao pra previnir sql injection
function executar(instrucao, parametros) {

    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        console.log("\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU .env.dev OU app.js\n");
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    return new Promise(function (resolve, reject) {
        pool.query(instrucao, parametros || [], function (erro, resultados) {
            if (erro) {
                console.log("ERRO NO MySQL:", erro.code, erro.sqlMessage || erro.message);
                return reject(erro);
            }
            resolve(resultados);
        });
    });
}

// usado nas playlists, se algo der errado ele puxa um backup da versao anterior
function transacao(passos) {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (erro, conexao) {
            if (erro) return reject(erro);
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