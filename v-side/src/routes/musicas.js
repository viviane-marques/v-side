var express = require("express");
var router = express.Router();

// todas as funcoes exigem login

var musicaController = require("../controllers/musicaController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

router.get("/", exigirLogin, function (req, res) {
    musicaController.listar(req, res);
});

router.get("/:id", exigirLogin, function (req, res) {
    musicaController.obter(req, res);
});

router.post("/", exigirLogin, function (req, res) {
    musicaController.cadastrar(req, res);
});

module.exports = router;