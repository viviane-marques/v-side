// Porteiro das rotas privadas: se não houver usuário na sessão, barra com 401.
// Será usado nas rotas de avaliações e favoritos (etapa 6):
//   router.get("/", exigirLogin, controller.listar);
function exigirLogin(req, res, next) {
    if (!req.session || !req.session.usuarioId) {
        return res.status(401).json({ erro: "Faça login para continuar." });
    }
    next();
}

module.exports = { exigirLogin };