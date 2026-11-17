var express = require("express");
var router = express.Router();

var avaliacaoController = require("../controllers/avaliacaoController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

// exigirLogin roda ANTES do controller: sem sessão, a resposta é 401 e o controller nem executa

// GET /avaliacoes -> minhas avaliações
router.get("/", exigirLogin, function (req, res) {
    avaliacaoController.listar(req, res);
});

// POST /avaliacoes -> salvar uma nova avaliação
router.post("/", exigirLogin, function (req, res) {
    avaliacaoController.cadastrar(req, res);
});

module.exports = router;