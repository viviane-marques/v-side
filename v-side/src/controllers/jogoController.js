var jogoService = require("../services/jogoService");
var partidaModel = require("../models/partidaModel");

var MAX_TENTATIVAS = 5;

function rodadaAtiva(req, res) {
  var jogo = req.session.jogo;
  if (!jogo || jogo.encerrada) {
    res
      .status(400)
      .json({ erro: "Nenhuma rodada em andamento. Comece uma nova." });
    return null;
  }
  return jogo;
}

// termina a rodada, se tiver logado o resultado vai pra dash
function revelar(req, jogo, acertou) {
  jogo.encerrada = true;

  if (req.session.usuarioId) {
    partidaModel
      .registrar(req.session.usuarioId, acertou, jogo.tentativas)
      .catch(function (erro) {
        console.log("ERRO AO REGISTRAR PARTIDA:", erro.code || erro);
      });
  }

  return {
    titulo: jogo.musica.titulo,
    artista: jogo.musica.artista,
    album: jogo.musica.album,
    capa: jogo.musica.capa,
  };
}

// se acabarem as tentativas o jogo acaba e mostra o artista e a musica
function responderErro(req, jogo, res) {
  if (jogo.tentativas >= MAX_TENTATIVAS) {
    return res.json({
      acertou: false,
      encerrada: true,
      tentativas: jogo.tentativas,
      revelacao: revelar(req, jogo, false),
    });
  }
  res.json({ acertou: false, encerrada: false, tentativas: jogo.tentativas });
}

// tenta achar uma nova musica para uma nova partida
async function nova(req, res) {
  try {
    var musica = await jogoService.sortearMusica();
    req.session.jogo = { musica: musica, tentativas: 0, encerrada: false };
    res.json({ preview: musica.preview });
  } catch (erro) {
    console.log("ERRO JOGO:", erro.message);
    res
      .status(502)
      .json({
        erro: "Não foi possível buscar uma música agora. Tente de novo.",
      });
  }
}

// consome uma tentativa e aumenta o tempo da musica
function chutar(req, res) {
  var jogo = rodadaAtiva(req, res);
  if (!jogo) return;

  var resposta = req.body.resposta;
  if (
    typeof resposta !== "string" ||
    resposta.trim() === "" ||
    resposta.length > 150
  ) {
    return res.status(400).json({ erro: "Digite o nome da música." });
  }

  jogo.tentativas++;

  if (jogoService.acertou(resposta, jogo.musica.titulo)) {
    return res.json({
      acertou: true,
      encerrada: true,
      tentativas: jogo.tentativas,
      revelacao: revelar(req, jogo, true),
    });
  }
  responderErro(req, jogo, res);
}

// consome uma tentativa e aumenta o tempo da musica
function pular(req, res) {
  var jogo = rodadaAtiva(req, res);
  if (!jogo) return;

  jogo.tentativas++;
  responderErro(req, jogo, res);
}

// mostra qual é o artista da musica
function dica(req, res) {
  var jogo = rodadaAtiva(req, res);
  if (!jogo) return;

  res.json({ artista: jogo.musica.artista });
}

// mostra artista e musica e acaba a partida
function desistir(req, res) {
  var jogo = rodadaAtiva(req, res);
  if (!jogo) return;

  res.json({
    acertou: false,
    encerrada: true,
    tentativas: jogo.tentativas,
    revelacao: revelar(req, jogo, false),
  });
}

module.exports = { nova, chutar, pular, dica, desistir };
