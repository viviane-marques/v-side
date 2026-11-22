// se não tiver usuario usuario logado ele da erro
function exigirLogin(req, res, next) {
    if (!req.session || !req.session.usuarioId) {
        return res.status(401).json({ erro: "Faça login para continuar." });
    }
    next();
}

module.exports = { exigirLogin };