var express = require("express");
var router = express.Router();
// nao precisa de login p jogar
var jogoController = require("../controllers/jogoController");

router.post("/nova", function (req, res) { jogoController.nova(req, res); });
router.post("/chutar", function (req, res) { jogoController.chutar(req, res); });
router.post("/pular", function (req, res) { jogoController.pular(req, res); });
router.post("/dica", function (req, res) { jogoController.dica(req, res); });
router.post("/desistir", function (req, res) { jogoController.desistir(req, res); });

module.exports = router;