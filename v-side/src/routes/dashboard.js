var express = require("express");
var router = express.Router();
// usuario precisa estar logado para ver a dash

var dashboardController = require("../controllers/dashboardController");
var exigirLogin = require("../middlewares/auth").exigirLogin;

router.get("/", exigirLogin, function (req, res) {
    dashboardController.carregar(req, res);
});

module.exports = router;