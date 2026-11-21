var bcrypt = require("bcryptjs");
var usuarioModel = require("../models/usuarioModel");

// Confere se o texto parece um email (algo@algo.algo)
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Marca o usuário como logado NO SERVIDOR.
// regenerate() troca o código da sessão, o que evita "fixação de sessão".
function iniciarSessao(req, usuarioId, callback) {
  req.session.regenerate(function (erro) {
    if (erro) {
      return callback(erro);
    }
    req.session.usuarioId = usuarioId;
    callback(null);
  });
}

// POST /usuarios/cadastrar
function cadastrar(req, res) {
  var nome = req.body.nomeServer;
  var email = req.body.emailServer;
  var senha = req.body.senhaServer;

  // 1) Validações: o servidor nunca confia no que veio do navegador
  if (
    typeof nome !== "string" ||
    nome.trim().length < 2 ||
    nome.trim().length > 50
  ) {
    return res
      .status(400)
      .json({ erro: "Digite um nome de usuário entre 2 e 50 caracteres." });
  }
  if (
    typeof email !== "string" ||
    !emailValido(email.trim()) ||
    email.trim().length > 100
  ) {
    return res.status(400).json({ erro: "Digite um email válido." });
  }
  // Senha forte: de 8 a 72 caracteres (72 é o limite de bytes do bcrypt), com letra
  // maiúscula, minúscula, número e símbolo. Mesmas regras do js/forca-senha.js
  if (
    typeof senha !== "string" ||
    senha.length < 8 ||
    senha.length > 72 ||
    !/\p{Lu}/u.test(senha) ||
    !/\p{Ll}/u.test(senha) ||
    !/\d/.test(senha) ||
    !/[^\p{L}\p{N}]/u.test(senha)
  ) {
    return res.status(400).json({
      erro: "A senha precisa ter de 8 a 72 caracteres, com letra maiúscula, minúscula, número e símbolo.",
    });
  }

  nome = nome.trim();
  email = email.trim().toLowerCase(); // "Ana@X.com" e "ana@x.com" são o mesmo email

  // 2) Email já existe?
  usuarioModel
    .buscarPorEmail(email)
    .then(function (encontrados) {
      if (encontrados.length > 0) {
        res.status(409).json({ erro: "Já existe uma conta com esse email." });
        return;
      }

      // 3) Transforma a senha em hash (10 = custo do cálculo) e grava
      return bcrypt
        .hash(senha, 10)
        .then(function (hash) {
          return usuarioModel.cadastrar(nome, email, hash);
        })
        .then(function (resultado) {
          var usuario = { id: resultado.insertId, nome: nome, email: email };

          // 4) Já deixa a pessoa logada depois de cadastrar
          iniciarSessao(req, usuario.id, function (erro) {
            if (erro) {
              console.log(erro);
              return res
                .status(500)
                .json({
                  erro: "Cadastro feito, mas não foi possível entrar. Tente fazer login.",
                });
            }
            res.status(201).json(usuario);
          });
        });
    })
    .catch(function (erro) {
      console.log(erro);
      // dois cadastros ao mesmo tempo: o UNIQUE do banco barra o segundo
      if (erro && erro.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ erro: "Já existe uma conta com esse email." });
      }
      res.status(500).json({ erro: "Erro ao cadastrar. Tente novamente." });
    });
}

// POST /usuarios/autenticar
function autenticar(req, res) {
  var email = req.body.emailServer;
  var senha = req.body.senhaServer;

  if (
    typeof email !== "string" ||
    typeof senha !== "string" ||
    email.trim() === "" ||
    senha === ""
  ) {
    return res.status(400).json({ erro: "Preencha email e senha." });
  }

  email = email.trim().toLowerCase();

  // Mesma mensagem para "email não existe" e "senha errada":
  // assim ninguém descobre quais emails estão cadastrados.
  var mensagemInvalido = "Email ou senha incorretos.";

  usuarioModel
    .buscarPorEmail(email)
    .then(function (encontrados) {
      if (encontrados.length !== 1) {
        res.status(401).json({ erro: mensagemInvalido });
        return;
      }

      var usuario = encontrados[0];

      // compara a senha digitada com o hash guardado no banco
      return bcrypt.compare(senha, usuario.senha).then(function (confere) {
        if (!confere) {
          res.status(401).json({ erro: mensagemInvalido });
          return;
        }

        iniciarSessao(req, usuario.id, function (erro) {
          if (erro) {
            console.log(erro);
            return res
              .status(500)
              .json({ erro: "Erro ao entrar. Tente novamente." });
          }
          // devolve só o necessário: NUNCA envie a senha (nem o hash)
          res.json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
          });
        });
      });
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json({ erro: "Erro ao entrar. Tente novamente." });
    });
}

// GET /usuarios/sessao  -> "quem sou eu?" (o site chama ao abrir cada página)
function sessao(req, res) {
  if (!req.session.usuarioId) {
    return res.status(401).json({ erro: "Não logado." });
  }

  usuarioModel
    .buscarPorId(req.session.usuarioId)
    .then(function (encontrados) {
      if (encontrados.length !== 1) {
        // usuário foi apagado do banco: encerra a sessão
        return req.session.destroy(function () {
          res.status(401).json({ erro: "Não logado." });
        });
      }
      res.json(encontrados[0]);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json({ erro: "Erro ao verificar a sessão." });
    });
}

// POST /usuarios/sair  -> encerra a sessão no servidor
function sair(req, res) {
  req.session.destroy(function () {
    res.clearCookie("connect.sid"); // apaga o cookie no navegador
    res.json({ ok: true });
  });
}

// PUT /usuarios/perfil  { nome, foto? }  -> edita nome e/ou foto do usuário logado
//   foto ausente (undefined) = não mexe na foto
//   foto = null              = remove a foto
//   foto = "data:image/..."  = nova foto (o navegador já reduz a imagem antes de enviar)
function atualizarPerfil(req, res) {
  var usuarioId = req.session.usuarioId;
  var nome = req.body.nome;
  var foto = req.body.foto;

  if (
    typeof nome !== "string" ||
    nome.trim().length < 2 ||
    nome.trim().length > 50
  ) {
    return res
      .status(400)
      .json({ erro: "Digite um nome entre 2 e 50 caracteres." });
  }
  nome = nome.trim();

  if (foto !== undefined && foto !== null) {
    // só aceita imagem em base64 e de tamanho limitado (~220 KB)
    var formatoFoto = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/]+=*$/;

    if (
      typeof foto !== "string" ||
      foto.length > 300000 ||
      !formatoFoto.test(foto)
    ) {
      return res
        .status(400)
        .json({ erro: "Foto inválida. Use uma imagem JPG, PNG ou WEBP." });
    }
  }

  var atualizacao =
    foto === undefined
      ? usuarioModel.atualizarNome(usuarioId, nome)
      : usuarioModel.atualizarPerfil(usuarioId, nome, foto);

  atualizacao
    .then(function () {
      res.json({ nome: nome });
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json({ erro: "Erro ao salvar o perfil." });
    });
}

module.exports = {
  cadastrar,
  autenticar,
  sessao,
  sair,
  atualizarPerfil,
};
