var express = require("express");
var router = express.Router();

var musicaController = require("../controllers/musicaController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

// O catálogo é COMPARTILHADO: qualquer usuário logado vê as músicas cadastradas por todos.
// (As AVALIAÇÕES continuam privadas: nenhuma rota daqui devolve avaliação de ninguém.)

// GET /musicas?busca=texto -> procurar no catálogo
router.get("/", exigirLogin, function (req, res) {
    musicaController.listar(req, res);
});

// GET /musicas/:id -> uma música do catálogo
router.get("/:id", exigirLogin, function (req, res) {
    musicaController.obter(req, res);
});

// POST /musicas -> cadastrar uma música no catálogo
router.post("/", exigirLogin, function (req, res) {
    musicaController.cadastrar(req, res);
});

module.exports = router;