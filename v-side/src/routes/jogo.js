var express = require("express");
var router = express.Router();

var jogoController = require("../controllers/jogoController");

// O jogo é PÚBLICO (visitantes também jogam), por isso não usa exigirLogin.
// A rodada fica na sessão de cada navegador, então ninguém vê a rodada de outro.

router.post("/nova", function (req, res) { jogoController.nova(req, res); });
router.post("/chutar", function (req, res) { jogoController.chutar(req, res); });
router.post("/pular", function (req, res) { jogoController.pular(req, res); });
router.post("/dica", function (req, res) { jogoController.dica(req, res); });
router.post("/desistir", function (req, res) { jogoController.desistir(req, res); });

module.exports = router;