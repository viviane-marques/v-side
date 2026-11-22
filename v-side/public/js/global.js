// cria uama "API" que os outros js usam (window.vside)
(function () {
  "use strict";

  if (window.VSide) return;

  const CHAVES = {
    usuario: "vside_usuario",
  };

  // paginas que só abrem se o usuario estiver logado
  const PAGINAS_PROTEGIDAS = [
    "avaliacoes.html",
    "favoritos.html",
    "nova-avaliacao.html",
    "dashboard.html",
    "cadastro-musica.html",
    "playlists.html",
    "criar-playlist.html",
  ];

// funcoes de armazenamento = ler, gravar
  function ler(chave, padrao) {
    try {
      const valor = JSON.parse(localStorage.getItem(chave));
      return valor === null || valor === undefined ? padrao : valor;
    } catch (erro) {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      return false;
    }
  }

// funcoes de comunicacao (lancam erros e dados, etc) = requisitar, mensgaemDeErro e chamarApi
  async function requisitar(url, opcoes) {
    try {
      const resposta = await fetch(
        url,
        Object.assign(
          {
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
          },
          opcoes,
        ),
      );

      let dados = null;
      try {
        dados = await resposta.json();
      } catch (erro) {
      }

      return { ok: resposta.ok, status: resposta.status, dados: dados };
    } catch (erro) {
      return {
        ok: false,
        status: 0,
        dados: {
          erro: "Não foi possível falar com o servidor. Ele está rodando?",
        },
      };
    }
  }

  function mensagemDeErro(resposta, padrao) {
    return (resposta.dados && resposta.dados.erro) || padrao;
  }

  async function chamarApi(url, opcoes) {
    const resposta = await requisitar(url, opcoes);

    if (resposta.status === 401) {
      esquecerUsuario();
      irParaLogin();
    }

    return {
      ok: resposta.ok,
      status: resposta.status,
      dados: resposta.dados,
      erro: resposta.ok
        ? null
        : mensagemDeErro(resposta, "Algo deu errado. Tente novamente."),
    };
  }

// funcoes de sessão = usuarioAtual, guardarUsuario, esquecerUsuario, cadastrar, entrar, sair, paginaAtual,
// paginaDeRetorno, irParaLogin, exigirLogin, confirmarSessao
  function usuarioAtual() {
    const usuario = ler(CHAVES.usuario, null);
    return usuario && usuario.id ? usuario : null;
  }

  function guardarUsuario(dados) {
    gravar(CHAVES.usuario, {
      id: dados.id,
      nome: dados.nome,
      email: dados.email,
    });
  }

  function esquecerUsuario() {
    try {
      localStorage.removeItem(CHAVES.usuario);
    } catch (erro) {
      /* sem ação */
    }
  }

  async function cadastrar(dados) {
    const resposta = await requisitar("/usuarios/cadastrar", {
      method: "POST",
      body: JSON.stringify({
        nomeServer: dados.nome,
        emailServer: dados.email,
        senhaServer: dados.senha,
      }),
    });

    if (!resposta.ok) {
      return {
        ok: false,
        erro: mensagemDeErro(resposta, "Não foi possível cadastrar."),
      };
    }

    guardarUsuario(resposta.dados);
    return { ok: true };
  }

  async function entrar(email, senha) {
    const resposta = await requisitar("/usuarios/autenticar", {
      method: "POST",
      body: JSON.stringify({ emailServer: email, senhaServer: senha }),
    });

    if (!resposta.ok) {
      return {
        ok: false,
        erro: mensagemDeErro(resposta, "Não foi possível entrar."),
      };
    }

    guardarUsuario(resposta.dados);
    return { ok: true };
  }

  async function sair() {
    await requisitar("/usuarios/sair", { method: "POST" });
    esquecerUsuario();
    atualizarHeader();
  }

  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function paginaDeRetorno() {
    const voltar = new URLSearchParams(location.search).get("voltar");
    return voltar && /^[a-z0-9-]+\.html$/i.test(voltar) ? voltar : "index.html";
  }

  function irParaLogin() {
    location.replace("login.html?voltar=" + encodeURIComponent(paginaAtual()));
  }

  function exigirLogin() {
    if (usuarioAtual()) return true;
    irParaLogin();
    return false;
  }

  async function confirmarSessao() {
    const resposta = await requisitar("/usuarios/sessao");

    if (resposta.ok) {
      guardarUsuario(resposta.dados);
    } else if (resposta.status === 401) {
      esquecerUsuario();

      if (PAGINAS_PROTEGIDAS.indexOf(paginaAtual()) !== -1) {
        irParaLogin();
        return;
      }
    }
    atualizarHeader();
  }

// funcoes que trocam a header dependendo se o usuario estiver logado ou n
// = atualizarHeader
  function atualizarHeader() {
    const usuario = usuarioAtual();

    document.body.classList.toggle("usuario-logado", !!usuario);

    const nome = document.getElementById("nomeUsuario");
    if (nome && usuario) nome.textContent = usuario.nome;
  }

  // atalhos da API = listarAvaliacoes, salvarAvaliacao, listarMusicas
  // obterMusica, cadastrarMusica, favoritar, desfavoriar, listarArtistasFavoritos
  // removerArtistaFavorito, listarPlaylists, obterPlaylist, criarPlaylist, editarPlaylist
  // excluirPlaylist
  function listarAvaliacoes() {
    return chamarApi("/avaliacoes");
  }

  function listarMusicas(busca) {
    return chamarApi("/musicas?busca=" + encodeURIComponent(busca || ""));
  }

  function obterMusica(id) {
    return chamarApi("/musicas/" + encodeURIComponent(id));
  }

  function cadastrarMusica(dados) {
    return chamarApi("/musicas", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  }

  function salvarAvaliacao(dados) {
    return chamarApi("/avaliacoes", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  }

  function favoritar(avaliacaoId) {
    return chamarApi("/favoritos", {
      method: "POST",
      body: JSON.stringify({ avaliacaoId: avaliacaoId }),
    });
  }

  function desfavoritar(avaliacaoId) {
    return chamarApi("/favoritos/" + encodeURIComponent(avaliacaoId), {
      method: "DELETE",
    });
  }

  function listarArtistasFavoritos() {
    return chamarApi("/favoritos");
  }

  function removerArtistaFavorito(artistaId) {
    return chamarApi("/favoritos/artista/" + encodeURIComponent(artistaId), {
      method: "DELETE",
    });
  }

  function listarPlaylists() {
    return chamarApi("/playlists");
  }

  function obterPlaylist(id) {
    return chamarApi("/playlists/" + encodeURIComponent(id));
  }

  function criarPlaylist(dados) {
    return chamarApi("/playlists", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  }

  function editarPlaylist(id, dados) {
    return chamarApi("/playlists/" + encodeURIComponent(id), {
      method: "PUT",
      body: JSON.stringify(dados),
    });
  }

  function excluirPlaylist(id) {
    return chamarApi("/playlists/" + encodeURIComponent(id), {
      method: "DELETE",
    });
  }

  // funcoes de interface = capaPlaceHolder (troca a capa pela primeira letra do artista ou album)
  // spotifyBusca (manda o usuario para o spotify com a busca da musica), mostrarMensagem, iniciarFormularios (login e cadastro), iniciarInterface (botao sair e menu musicas)
  // iniciar
  function capaPlaceholder(texto) {
    const letra = (
      String(texto || "?")
        .trim()
        .charAt(0) || "?"
    )
      .toUpperCase()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#a65d68"/>' +
      '<text x="100" y="100" font-family="Georgia, serif" font-size="96" ' +
      'font-style="italic" font-weight="700" fill="#e8d9c5" ' +
      'text-anchor="middle" dominant-baseline="central">' +
      letra +
      "</text>" +
      "</svg>";

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function spotifyBusca(termo) {
    return "https://open.spotify.com/search/" + encodeURIComponent(termo);
  }

  function mostrarMensagem(form, texto) {
    let msg = form.querySelector(".mensagem-formulario");

    if (!msg) {
      msg = document.createElement("p");
      msg.className = "mensagem-formulario";
      msg.setAttribute("role", "alert");

      const botao = form.querySelector('button[type="submit"]');
      form.insertBefore(msg, botao);
    }

    msg.textContent = texto;
  }

  function iniciarFormularios() {
    const formLogin = document.getElementById("formLogin");
    const formCadastro = document.getElementById("formCadastro");

    if (formLogin) {
      formLogin.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const botao = formLogin.querySelector('button[type="submit"]');
        botao.disabled = true;

        const resultado = await entrar(
          document.getElementById("emailLogin").value,
          document.getElementById("senhaLogin").value,
        );

        botao.disabled = false;

        if (!resultado.ok) {
          mostrarMensagem(formLogin, resultado.erro);
          return;
        }

        location.href = paginaDeRetorno();
      });
    }

    if (formCadastro) {
      formCadastro.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const senha = document.getElementById("senhaCadastro").value;
        const confirmar = document.getElementById("confirmarSenha").value;

        if (senha !== confirmar) {
          mostrarMensagem(formCadastro, "As senhas não coincidem.");
          return;
        }
        
        // validacao de força da senha
        if (window.VSideSenha && !window.VSideSenha.ehForte(senha)) {
          mostrarMensagem(formCadastro, "Sua senha ainda não atende a todos os critérios.");
          return;
        }

        const botao = formCadastro.querySelector('button[type="submit"]');
        botao.disabled = true;

        const resultado = await cadastrar({
          nome: document.getElementById("nomeCadastro").value,
          email: document.getElementById("emailCadastro").value,
          senha: senha,
        });

        botao.disabled = false;

        if (!resultado.ok) {
          mostrarMensagem(formCadastro, resultado.erro);
          return;
        }

        location.href = "index.html";
      });
    }
  }

  function iniciarInterface() {
    const botaoSair = document.getElementById("botaoSair");

    if (botaoSair) {
      botaoSair.addEventListener("click", async function () {
        await sair();
        location.href = "index.html";
      });
    }

    const menuMusicas = document.querySelector(".menu-musicas");
    const botaoMusicas =
      menuMusicas && menuMusicas.querySelector(".botao-menu");

    if (botaoMusicas) {
      botaoMusicas.addEventListener("click", function (evento) {
        evento.stopPropagation();
        const aberto = menuMusicas.classList.toggle("menu-aberto");
        botaoMusicas.setAttribute("aria-expanded", String(aberto));
      });

      document.addEventListener("click", function () {
        menuMusicas.classList.remove("menu-aberto");
        botaoMusicas.setAttribute("aria-expanded", "false");
      });
    }
  }

  window.VSide = {
    usuarioAtual: usuarioAtual,
    cadastrar: cadastrar,
    entrar: entrar,
    sair: sair,
    exigirLogin: exigirLogin,
    atualizarHeader: atualizarHeader,
    chamarApi: chamarApi,
    listarAvaliacoes: listarAvaliacoes,
    salvarAvaliacao: salvarAvaliacao,
    listarMusicas: listarMusicas,
    obterMusica: obterMusica,
    cadastrarMusica: cadastrarMusica,
    favoritar: favoritar,
    desfavoritar: desfavoritar,
    listarArtistasFavoritos: listarArtistasFavoritos,
    removerArtistaFavorito: removerArtistaFavorito,
    capaPlaceholder: capaPlaceholder,
    spotifyBusca: spotifyBusca,
    listarPlaylists: listarPlaylists,
    obterPlaylist: obterPlaylist,
    criarPlaylist: criarPlaylist,
    editarPlaylist: editarPlaylist,
    excluirPlaylist: excluirPlaylist,
  };

  function iniciar() {
    atualizarHeader();
    iniciarFormularios();
    iniciarInterface();
    confirmarSessao();

    window.addEventListener("storage", function (evento) {
      if (evento.key === CHAVES.usuario) {
        atualizarHeader();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
