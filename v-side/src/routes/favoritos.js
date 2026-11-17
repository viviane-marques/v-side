var express = require("express");
var router = express.Router();

var favoritoController = require("../controllers/favoritoController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

// GET /favoritos -> meus artistas favoritos (com as músicas)
router.get("/", exigirLogin, function (req, res) {
    favoritoController.listar(req, res);
});

// POST /favoritos  { avaliacaoId } -> favoritar uma música
router.post("/", exigirLogin, function (req, res) {
    favoritoController.adicionar(req, res);
});

// DELETE /favoritos/artista/:artistaId -> remover o artista inteiro
router.delete("/artista/:artistaId", exigirLogin, function (req, res) {
    favoritoController.removerArtista(req, res);
});

// DELETE /favoritos/:avaliacaoId -> desfavoritar uma música
router.delete("/:avaliacaoId", exigirLogin, function (req, res) {
    favoritoController.remover(req, res);
});

module.exports = router;