/* =========================================
   V-SIDE | global.js
   - Login / cadastro / logout (via API + sessão no servidor)
   - Troca da header (visitante x logado)
   - Dados compartilhados (avaliações e favoritos)

   Usuário, avaliações e favoritos vivem no MySQL.
   O navegador só guarda um "lembrete" de quem está logado.
========================================= */

(function () {
  "use strict";

  // A dashboard.html carrega este arquivo duas vezes.
  if (window.VSide) return;

  /* -----------------------------------------
       1. ARMAZENAMENTO NO NAVEGADOR
    ----------------------------------------- */

  const CHAVES = {
    // Só um "lembrete" de quem está logado, para a tela reagir rápido.
    // Quem MANDA é o servidor (cookie de sessão): ao abrir cada página
    // confirmarSessao() confere com ele e corrige este lembrete.
    usuario: "vside_usuario",
  };

  // Páginas que só funcionam com login
  const PAGINAS_PROTEGIDAS = [
    "avaliacoes.html",
    "favoritos.html",
    "nova-avaliacao.html",
    "dashboard.html",
    "cadastro-musica.html",
    "playlists.html",
    "criar-playlist.html",
  ];

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

  /* -----------------------------------------
       2. COMUNICAÇÃO COM A API
    ----------------------------------------- */

  // Faz o fetch e devolve sempre { ok, status, dados }, sem lançar erro.
  async function requisitar(url, opcoes) {
    try {
      const resposta = await fetch(
        url,
        Object.assign(
          {
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin", // envia o cookie da sessão junto
          },
          opcoes,
        ),
      );

      let dados = null;
      try {
        dados = await resposta.json();
      } catch (erro) {
        /* resposta sem corpo */
      }

      return { ok: resposta.ok, status: resposta.status, dados: dados };
    } catch (erro) {
      // servidor desligado, sem internet, etc.
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

  // Chamada às rotas PRIVADAS (avaliações e favoritos).
  // Devolve { ok, status, dados, erro }.
  // Se o servidor responder 401 (sessão perdida), manda a pessoa para o login.
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

  /* -----------------------------------------
       3. USUÁRIO / SESSÃO
    ----------------------------------------- */

  // Quem está logado, segundo o lembrete local (síncrono, usado pelas telas)
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

  // POST /usuarios/cadastrar -> cria a conta e já deixa logado
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

  // POST /usuarios/autenticar -> login
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

  // POST /usuarios/sair -> encerra a sessão no servidor e limpa o lembrete
  async function sair() {
    await requisitar("/usuarios/sair", { method: "POST" });
    esquecerUsuario();
    atualizarHeader();
  }

  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  // Só aceita nomes simples de página (evita redirecionar para sites externos)
  function paginaDeRetorno() {
    const voltar = new URLSearchParams(location.search).get("voltar");
    return voltar && /^[a-z0-9-]+\.html$/i.test(voltar) ? voltar : "index.html";
  }

  function irParaLogin() {
    location.replace("login.html?voltar=" + encodeURIComponent(paginaAtual()));
  }

  // Páginas que exigem login chamam isto. Retorna false se redirecionou.
  function exigirLogin() {
    if (usuarioAtual()) return true;
    irParaLogin();
    return false;
  }

  // GET /usuarios/sessao -> pergunta ao servidor se ainda estamos logados
  async function confirmarSessao() {
    const resposta = await requisitar("/usuarios/sessao");

    if (resposta.ok) {
      guardarUsuario(resposta.dados); // atualiza nome/email se mudaram
    } else if (resposta.status === 401) {
      // o servidor diz que NÃO estamos logados (reiniciou, expirou, saiu em outra aba)
      esquecerUsuario();

      if (PAGINAS_PROTEGIDAS.indexOf(paginaAtual()) !== -1) {
        irParaLogin();
        return;
      }
    }
    // qualquer outro erro (ex.: servidor fora do ar): não mexe em nada

    atualizarHeader();
  }

  /* -----------------------------------------
       4. HEADER (visitante x logado)
       O CSS já faz o resto a partir da classe
       "usuario-logado" no <body>.
    ----------------------------------------- */

  function atualizarHeader() {
    const usuario = usuarioAtual();

    document.body.classList.toggle("usuario-logado", !!usuario);

    // Nome na dashboard
    const nome = document.getElementById("nomeUsuario");
    if (nome && usuario) nome.textContent = usuario.nome;
  }

  /* -----------------------------------------
       5. AVALIAÇÕES (API -> tabela avaliacao)
       Todas devolvem { ok, dados, erro }
    ----------------------------------------- */

  // GET /avaliacoes -> só as avaliações de quem está logado
  function listarAvaliacoes() {
    return chamarApi("/avaliacoes");
  }

  // POST /avaliacoes -> salva uma avaliação nova
  function salvarAvaliacao(dados) {
    return chamarApi("/avaliacoes", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  }

  /* -----------------------------------------
       6. FAVORITOS (API -> tabela favorito)
       Cada favorito é uma MÚSICA (uma avaliação).
       A página de favoritos recebe os artistas já agrupados.
    ----------------------------------------- */

  // POST /favoritos -> favorita uma música
  function favoritar(avaliacaoId) {
    return chamarApi("/favoritos", {
      method: "POST",
      body: JSON.stringify({ avaliacaoId: avaliacaoId }),
    });
  }

  // DELETE /favoritos/:avaliacaoId -> desfavorita uma música
  function desfavoritar(avaliacaoId) {
    return chamarApi("/favoritos/" + encodeURIComponent(avaliacaoId), {
      method: "DELETE",
    });
  }

  // GET /favoritos -> [{ id, artista, musicas: [...] }]
  function listarArtistasFavoritos() {
    return chamarApi("/favoritos");
  }

  // DELETE /favoritos/artista/:id -> tira o artista e todas as músicas dele dos favoritos
  function removerArtistaFavorito(artistaId) {
    return chamarApi("/favoritos/artista/" + encodeURIComponent(artistaId), {
      method: "DELETE",
    });
  }

  /* -----------------------------------------
       PLAYLISTS (API -> tabelas playlist e playlist_musica)
    ----------------------------------------- */

  // GET /playlists -> minhas playlists, cada uma com a lista "musicas"
  function listarPlaylists() {
    return chamarApi("/playlists");
  }

  // GET /playlists/:id -> uma playlist minha (usada para editar)
  function obterPlaylist(id) {
    return chamarApi("/playlists/" + encodeURIComponent(id));
  }

  // POST /playlists  { titulo, descricao, capa, avaliacoes: [ids] }
  function criarPlaylist(dados) {
    return chamarApi("/playlists", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  }

  // PUT /playlists/:id -> mesmo formato do criar
  function editarPlaylist(id, dados) {
    return chamarApi("/playlists/" + encodeURIComponent(id), {
      method: "PUT",
      body: JSON.stringify(dados),
    });
  }

  // DELETE /playlists/:id
  function excluirPlaylist(id) {
    return chamarApi("/playlists/" + encodeURIComponent(id), {
      method: "DELETE",
    });
  }

  /* -----------------------------------------
       7. UTILITÁRIOS DE INTERFACE
    ----------------------------------------- */

  // Capa genérica (a nova avaliação não tem campo de imagem)
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

  /* -----------------------------------------
       8. FORMULÁRIOS DE LOGIN E CADASTRO
    ----------------------------------------- */

  function iniciarFormularios() {
    const formLogin = document.getElementById("formLogin");
    const formCadastro = document.getElementById("formCadastro");

    if (formLogin) {
      formLogin.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const botao = formLogin.querySelector('button[type="submit"]');
        botao.disabled = true; // evita clique duplo enquanto espera o servidor

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

        // Conferência rápida no navegador (o servidor valida tudo de novo)
        if (senha !== confirmar) {
          mostrarMensagem(formCadastro, "As senhas não coincidem.");
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

  /* -----------------------------------------
       9. BOTÃO SAIR E MENU "MÚSICAS" (toque/clique)
    ----------------------------------------- */

  function iniciarInterface() {
    const botaoSair = document.getElementById("botaoSair");

    if (botaoSair) {
      botaoSair.addEventListener("click", async function () {
        await sair();
        location.href = "index.html";
      });
    }

    // O hover do CSS não existe no celular: o clique abre/fecha o menu
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

  /* -----------------------------------------
       10. API PÚBLICA + INICIALIZAÇÃO
    ----------------------------------------- */

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
    atualizarHeader(); // mostra já a header certa, usando o lembrete local
    iniciarFormularios();
    iniciarInterface();
    confirmarSessao(); // e em seguida confere com o servidor

    // Login/logout feito em outra aba
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
