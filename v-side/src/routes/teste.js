var express = require("express");
var router = express.Router();

var database = require("../database/config");

// GET /teste/banco
// Pergunta ao MySQL a data/hora atual e qual banco está em uso.
router.get("/banco", function (req, res) {
    database.executar("SELECT NOW() AS agora, DATABASE() AS banco")
        .then(function (resultado) {
            // deu certo: devolve em JSON o que o banco respondeu
            res.json({ conectou: true, agora: resultado[0].agora, banco: resultado[0].banco });
        })
        .catch(function (erro) {
            // deu errado: devolve o código do erro para a gente saber o motivo
            res.status(500).json({ conectou: false, codigo: erro.code, mensagem: erro.sqlMessage || erro.message });
        });
});

module.exports = router;