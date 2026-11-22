var express = require("express");
var router = express.Router();

// CRUD, tudo com login
var playlistController = require("../controllers/playlistController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

router.get("/", exigirLogin, function (req, res) {
    playlistController.listar(req, res);
});

// GET /playlists/:id -> uma playlist minha (para editar)
router.get("/:id", exigirLogin, function (req, res) {
    playlistController.obter(req, res);
});

// POST /playlists -> criar
router.post("/", exigirLogin, function (req, res) {
    playlistController.criar(req, res);
});

// PUT /playlists/:id -> editar (título, descrição, capa e músicas)
router.put("/:id", exigirLogin, function (req, res) {
    playlistController.atualizar(req, res);
});

// DELETE /playlists/:id -> excluir
router.delete("/:id", exigirLogin, function (req, res) {
    playlistController.excluir(req, res);
});

module.exports = router;