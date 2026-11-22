var express = require("express");
var router = express.Router();

var favoritoController = require("../controllers/favoritoController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

router.get("/", exigirLogin, function (req, res) {
    favoritoController.listar(req, res);
});

router.post("/", exigirLogin, function (req, res) {
    favoritoController.adicionar(req, res);
});

router.delete("/artista/:artistaId", exigirLogin, function (req, res) {
    favoritoController.removerArtista(req, res);
});

router.delete("/:avaliacaoId", exigirLogin, function (req, res) {
    favoritoController.remover(req, res);
});

module.exports = router;