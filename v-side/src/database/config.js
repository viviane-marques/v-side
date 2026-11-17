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

module.exports = {
    executar
};