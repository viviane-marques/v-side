var bcrypt = require("bcryptjs"); //criptografia do cookie da sessao
var usuarioModel = require("../models/usuarioModel");

// ve se tem @ no email
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// gera novo codigo de sessao
function iniciarSessao(req, usuarioId, callback) {
  req.session.regenerate(function (erro) {
    if (erro) {
      return callback(erro);
    }
    req.session.usuarioId = usuarioId;
    callback(null);
  });
}

function cadastrar(req, res) {
  // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
  var nome = req.body.nomeServer;
  var email = req.body.emailServer;
  var senha = req.body.senhaServer;

  // Faça as validações dos valores
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
  // validacao de senha
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
  email = email.trim().toLowerCase();

  usuarioModel
    .buscarPorEmail(email)
    .then(function (encontrados) {
      if (encontrados.length > 0) {
        res.status(409).json({ erro: "Já existe uma conta com esse email." });
        return;
      }

      // transforma a senha em hash para a segurança no banco de dados
      return bcrypt
        .hash(senha, 10)
        .then(function (hash) {
          return usuarioModel.cadastrar(nome, email, hash);
        })
        .then(function (resultado) {
          var usuario = { id: resultado.insertId, nome: nome, email: email };

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
      if (erro && erro.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ erro: "Já existe uma conta com esse email." });
      }
      res.status(500).json({ erro: "Erro ao cadastrar. Tente novamente." });
    });
}

//busca o user por email
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

  var mensagemInvalido = "Email ou senha incorretos.";

  usuarioModel
    .buscarPorEmail(email)
    .then(function (encontrados) {
      if (encontrados.length !== 1) {
        res.status(401).json({ erro: mensagemInvalido });
        return;
      }

      var usuario = encontrados[0];

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

function sessao(req, res) {
  if (!req.session.usuarioId) {
    return res.status(401).json({ erro: "Não logado." });
  }

  usuarioModel
    .buscarPorId(req.session.usuarioId)
    .then(function (encontrados) {
      if (encontrados.length !== 1) {
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

function sair(req, res) {
  req.session.destroy(function () {
    res.clearCookie("connect.sid"); // apaga o cookie no navegador
    res.json({ ok: true });
  });
}

// edicao do perfil
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
