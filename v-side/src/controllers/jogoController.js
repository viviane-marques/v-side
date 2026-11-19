var jogoService = require("../services/jogoService");
var partidaModel = require("../models/partidaModel");

// Quantas tentativas a pessoa tem (uma por etapa: 0,5s / 1s / 5s / 10s / 15s)
var MAX_TENTATIVAS = 5;

// A rodada fica guardada na SESSÃO (no servidor):
//   req.session.jogo = { musica: {...resposta...}, tentativas: 0, encerrada: false }
// O navegador só recebe o áudio. Título, artista e capa só saem no fim da rodada.

// Devolve a rodada em andamento, ou responde 400 e devolve null
function rodadaAtiva(req, res) {
    var jogo = req.session.jogo;
    if (!jogo || jogo.encerrada) {
        res.status(400).json({ erro: "Nenhuma rodada em andamento. Comece uma nova." });
        return null;
    }
    return jogo;
}

// Encerra a rodada e devolve a resposta completa.
// Se quem jogou está LOGADO, guarda o resultado (alimenta o indicador da dashboard).
function revelar(req, jogo, acertou) {
    jogo.encerrada = true;

    if (req.session.usuarioId) {
        partidaModel.registrar(req.session.usuarioId, acertou, jogo.tentativas)
            .catch(function (erro) {
                console.log("ERRO AO REGISTRAR PARTIDA:", erro.code || erro);
            });
    }

    return {
        titulo: jogo.musica.titulo,
        artista: jogo.musica.artista,
        album: jogo.musica.album,
        capa: jogo.musica.capa
    };
}

// Chamado depois de um erro ou de um "pular": acabou as tentativas?
function responderErro(req, jogo, res) {
    if (jogo.tentativas >= MAX_TENTATIVAS) {
        return res.json({ acertou: false, encerrada: true, tentativas: jogo.tentativas, revelacao: revelar(req, jogo, false) });
    }
    res.json({ acertou: false, encerrada: false, tentativas: jogo.tentativas });
}

// POST /jogo/nova -> sorteia uma música e devolve SÓ o endereço do áudio
async function nova(req, res) {
    try {
        var musica = await jogoService.sortearMusica();
        req.session.jogo = { musica: musica, tentativas: 0, encerrada: false };
        res.json({ preview: musica.preview });
    } catch (erro) {
        console.log("ERRO JOGO:", erro.message);
        res.status(502).json({ erro: "Não foi possível buscar uma música agora. Tente de novo." });
    }
}

// POST /jogo/chutar  { resposta }
function chutar(req, res) {
    var jogo = rodadaAtiva(req, res);
    if (!jogo) return;

    var resposta = req.body.resposta;
    if (typeof resposta !== "string" || resposta.trim() === "" || resposta.length > 150) {
        return res.status(400).json({ erro: "Digite o nome da música." });
    }

    jogo.tentativas++;

    if (jogoService.acertou(resposta, jogo.musica.titulo)) {
        return res.json({ acertou: true, encerrada: true, tentativas: jogo.tentativas, revelacao: revelar(req, jogo, true) });
    }
    responderErro(req, jogo, res);
}

// POST /jogo/pular -> gasta uma tentativa sem chutar (libera o trecho maior)
function pular(req, res) {
    var jogo = rodadaAtiva(req, res);
    if (!jogo) return;

    jogo.tentativas++;
    responderErro(req, jogo, res);
}

// POST /jogo/dica -> revela só o artista
function dica(req, res) {
    var jogo = rodadaAtiva(req, res);
    if (!jogo) return;

    res.json({ artista: jogo.musica.artista });
}

// POST /jogo/desistir -> revela tudo e encerra
function desistir(req, res) {
    var jogo = rodadaAtiva(req, res);
    if (!jogo) return;

    res.json({ acertou: false, encerrada: true, tentativas: jogo.tentativas, revelacao: revelar(req, jogo, false) });
}

module.exports = { nova, chutar, pular, dica, desistir };