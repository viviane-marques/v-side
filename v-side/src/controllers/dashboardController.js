var usuarioModel = require("../models/usuarioModel");
var dashboardModel = require("../models/dashboardModel");

// GET /dashboard -> tudo que a tela da dashboard precisa, numa resposta só
function carregar(req, res) {
    // O id vem da SESSÃO (servidor), nunca do navegador
    var usuarioId = req.session.usuarioId;

    // Promise.all dispara as 5 consultas ao mesmo tempo e espera todas terminarem
    Promise.all([
        usuarioModel.buscarPerfil(usuarioId),
        dashboardModel.indicadores(usuarioId),
        dashboardModel.serieMensal(usuarioId),
        dashboardModel.atividades(usuarioId),
        dashboardModel.jogo(usuarioId)
    ])
        .then(function (resultados) {
            var perfil = resultados[0][0];

            // usuário foi apagado do banco: trata como "não logado"
            if (!perfil) {
                return res.status(401).json({ erro: "Não logado." });
            }

            var ind = resultados[1][0];

            // Monta os 12 meses (Jan..Dez). Mês sem avaliação fica com media = null
            // (o gráfico deixa um vazio no lugar).
            var porMes = {};
            resultados[2].forEach(function (linha) {
                porMes[linha.mes] = linha;
            });

            var serie = [];
            for (var mes = 1; mes <= 12; mes++) {
                var linha = porMes[mes];
                serie.push({
                    mes: mes,
                    media: linha ? Number(Number(linha.media).toFixed(2)) : null,
                    quantidade: linha ? linha.quantidade : 0
                });
            }

            // Jogo: SUM pode chegar como texto ou NULL. Taxa = acertos / rodadas (em %)
            var resumoJogo = resultados[4][0];
            var partidas = Number(resumoJogo.partidas) || 0;
            var acertos = Number(resumoJogo.acertos) || 0;

            res.json({
                usuario: { nome: perfil.nome, email: perfil.email, foto: perfil.foto },
                kpis: {
                    avaliacoes: ind.avaliacoes,
                    media: ind.media === null ? null : Number(Number(ind.media).toFixed(1)),
                    favoritos: ind.favoritos,
                    artistas: ind.artistas
                },
                jogo: {
                    partidas: partidas,
                    acertos: acertos,
                    taxa: partidas === 0 ? null : Math.round((acertos / partidas) * 100)
                },
                serie: serie,
                atividades: resultados[3].map(function (linha) {
                    return {
                        tipo: linha.tipo,
                        musica: linha.musica,
                        artista: linha.artista,
                        nota: linha.nota,
                        segundos: Math.max(0, linha.segundos)
                    };
                })
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao carregar a dashboard." });
        });
}

module.exports = { carregar };