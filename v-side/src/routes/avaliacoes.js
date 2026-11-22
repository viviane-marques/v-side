var express = require("express");
var router = express.Router();

// só funciona com o usuario logado
var avaliacaoController = require("../controllers/avaliacaoController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

router.get("/", exigirLogin, function (req, res) {
    avaliacaoController.listar(req, res);
});

router.post("/", exigirLogin, function (req, res) {
    avaliacaoController.cadastrar(req, res);
});

module.exports = router;