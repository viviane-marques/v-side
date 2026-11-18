var express = require("express");
var router = express.Router();

var dashboardController = require("../controllers/dashboardController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

// GET /dashboard -> perfil, indicadores, gráfico e atividades do usuário logado
router.get("/", exigirLogin, function (req, res) {
    dashboardController.carregar(req, res);
});

module.exports = router;