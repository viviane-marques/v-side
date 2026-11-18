var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

// POST /usuarios/cadastrar  -> cria a conta e já faz o login
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
});

// POST /usuarios/autenticar -> login
router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

// GET /usuarios/sessao -> devolve o usuário logado (ou 401)
router.get("/sessao", function (req, res) {
    usuarioController.sessao(req, res);
});

// POST /usuarios/sair -> logout
router.post("/sair", function (req, res) {
    usuarioController.sair(req, res);
});

// PUT /usuarios/perfil -> edita nome e foto (só logado)
router.put("/perfil", exigirLogin, function (req, res) {
    usuarioController.atualizarPerfil(req, res);
});

module.exports = router;