/* =========================================
   V-SIDE | criar-playlist.js
   Mesma tela para CRIAR (criar-playlist.html) e EDITAR (criar-playlist.html?id=5).
   - Título, descrição e capa (reduzida no navegador, como a foto do perfil)
   - Adicionar/remover músicas: elas vêm das avaliações do próprio usuário
========================================= */

(function () {
    'use strict';

    const V = window.VSide;
    const form = document.getElementById('formPlaylist');

    if (!V || !form) return;
    if (!V.exigirLogin()) return;

    // Tamanho (px) da capa depois de reduzida, antes de enviar ao servidor
    const TAMANHO_CAPA = 320;

    // ?id=5 na URL = editando a playlist 5. Sem ?id = criando uma nova.
    const parametroId = new URLSearchParams(location.search).get('id');
    const editando = parametroId !== null;

    if (editando && !/^\d+$/.test(parametroId)) {
        location.replace('playlists.html'); // id inválido na URL
        return;
    }

    /* ---------- Elementos da tela ---------- */
    const el = {
        titulo: document.getElementById('tituloPagina'),
        previa: document.getElementById('previaCapaPlaylist'),
        botaoEscolherCapa: document.getElementById('botaoEscolherCapa'),
        botaoRemoverCapa: document.getElementById('botaoRemoverCapa'),
        inputCapa: document.getElementById('inputCapa'),
        nome: document.getElementById('nomePlaylist'),
        descricao: document.getElementById('descricaoPlaylist'),
        contador: document.getElementById('contadorPlaylist'),
        listaNa: document.getElementById('listaNaPlaylist'),
        vazioNa: document.getElementById('vazioPlaylist'),
        filtro: document.getElementById('filtroAvaliacoes'),
        listaDisp: document.getElementById('listaDisponiveis'),
        vazioDisp: document.getElementById('vazioDisponiveis'),
        retorno: document.getElementById('retornoPlaylist'),
        botaoSalvar: document.getElementById('botaoSalvarPlaylist')
    };

    /* ---------- Estado da tela ---------- */
    let avaliacoes = [];     // TODAS as avaliações do usuário (vindas da API)
    let selecionadas = [];   // ids das avaliações que estão na playlist (na ordem)
    let capaSalva = null;    // capa que já está salva no banco (ao editar)
    // Capa escolhida agora, ainda não salva:
    //   undefined = não mexeu | null = remover a capa | 'data:image/...' = nova capa
    let capaPendente;

    /* -----------------------------------------
       UTILITÁRIOS
    ----------------------------------------- */

    function normalizar(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function mostrarMensagem(texto) {
        el.retorno.textContent = texto;
        el.retorno.hidden = !texto;
    }

    function acharAvaliacao(id) {
        return avaliacoes.find(function (a) { return a.id === id; });
    }

    /* -----------------------------------------
       CAPA
    ----------------------------------------- */

    // Mostra no quadrado: a capa nova, a salva ou, se não houver, a inicial do título
    function atualizarPrevia() {
        let imagem;

        if (capaPendente === undefined) {
            imagem = capaSalva;      // não mexeu: mostra a que está salva
        } else {
            imagem = capaPendente;   // mexeu: nova imagem ou null (removida)
        }

        el.previa.src = imagem || V.capaPlaceholder(el.nome.value || '♪');
    }

    // Reduz a imagem para um quadrado de TAMANHO_CAPA px e devolve como texto
    // (mesma técnica da foto de perfil: fica leve e cabe no banco)
    function reduzirImagem(arquivo) {
        return new Promise(function (resolve, reject) {
            if (!arquivo.type || arquivo.type.indexOf('image/') !== 0) {
                return reject(new Error('Escolha um arquivo de imagem (JPG, PNG ou WEBP).'));
            }
            if (arquivo.size > 8 * 1024 * 1024) {
                return reject(new Error('A imagem é muito grande (máximo 8 MB).'));
            }

            const endereco = URL.createObjectURL(arquivo);
            const imagem = new Image();

            imagem.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = TAMANHO_CAPA;
                canvas.height = TAMANHO_CAPA;

                const ctx = canvas.getContext('2d');

                // fundo branco (PNG transparente viraria preto ao salvar em JPEG)
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, TAMANHO_CAPA, TAMANHO_CAPA);

                // recorta o maior quadrado possível do centro da imagem
                const lado = Math.min(imagem.width, imagem.height);
                const origemX = (imagem.width - lado) / 2;
                const origemY = (imagem.height - lado) / 2;
                ctx.drawImage(imagem, origemX, origemY, lado, lado, 0, 0, TAMANHO_CAPA, TAMANHO_CAPA);

                URL.revokeObjectURL(endereco);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };

            imagem.onerror = function () {
                URL.revokeObjectURL(endereco);
                reject(new Error('Não foi possível ler essa imagem.'));
            };

            imagem.src = endereco;
        });
    }

    el.botaoEscolherCapa.addEventListener('click', function () {
        el.inputCapa.click(); // abre a janela de escolher arquivo
    });

    el.inputCapa.addEventListener('change', async function () {
        const arquivo = el.inputCapa.files[0];
        if (!arquivo) return;

        try {
            capaPendente = await reduzirImagem(arquivo);
            atualizarPrevia(); // prévia imediata
            mostrarMensagem('');
        } catch (erro) {
            mostrarMensagem(erro.message);
        }

        el.inputCapa.value = ''; // permite escolher o mesmo arquivo de novo
    });

    el.botaoRemoverCapa.addEventListener('click', function () {
        capaPendente = null; // null = "apague a capa"
        atualizarPrevia();
        mostrarMensagem('');
    });

    // Enquanto não há capa, a inicial do título aparece no quadrado
    el.nome.addEventListener('input', atualizarPrevia);

    /* -----------------------------------------
       MÚSICAS: ADICIONAR / REMOVER
    ----------------------------------------- */

    // Uma linha da lista: nome da música + botão
    function criarLinha(av, naPlaylist) {
        const item = document.createElement('li');
        item.className = 'linha-musica';

        const textos = document.createElement('span');
        textos.className = 'linha-musica-textos';

        const nome = document.createElement('strong');
        nome.textContent = av.musica; // textContent: nunca interpreta HTML

        const detalhe = document.createElement('small');
        detalhe.textContent = av.album ? av.artista + ' • ' + av.album : av.artista;

        textos.appendChild(nome);
        textos.appendChild(detalhe);

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'botao-mini ' + (naPlaylist ? 'botao-remover' : 'botao-adicionar');
        botao.textContent = naPlaylist ? '✕ Remover' : '+ Adicionar';

        botao.addEventListener('click', function () {
            if (naPlaylist) {
                // tira o id da lista de selecionadas
                selecionadas = selecionadas.filter(function (id) { return id !== av.id; });
            } else {
                selecionadas.push(av.id); // entra no final da playlist
            }
            renderizar();
        });

        item.appendChild(textos);
        item.appendChild(botao);
        return item;
    }

    // Redesenha as duas listas a partir do estado (selecionadas + avaliacoes)
    function renderizar() {
        /* --- músicas que estão na playlist --- */
        el.listaNa.innerHTML = '';

        selecionadas.forEach(function (id) {
            const av = acharAvaliacao(id);
            if (av) el.listaNa.appendChild(criarLinha(av, true));
        });

        el.contador.textContent = '(' + selecionadas.length + ')';
        el.vazioNa.hidden = selecionadas.length > 0;

        /* --- avaliações que ainda não estão na playlist (e combinam com o filtro) --- */
        const termo = normalizar(el.filtro.value);

        const disponiveis = avaliacoes.filter(function (av) {
            if (selecionadas.indexOf(av.id) !== -1) return false;

            const texto = normalizar(av.musica + ' ' + av.artista + ' ' + (av.album || ''));
            return texto.indexOf(termo) !== -1;
        });

        el.listaDisp.innerHTML = '';
        disponiveis.forEach(function (av) {
            el.listaDisp.appendChild(criarLinha(av, false));
        });

        el.vazioDisp.hidden = disponiveis.length > 0;
    }

    el.filtro.addEventListener('input', renderizar);

    /* -----------------------------------------
       SALVAR (criar ou editar)
    ----------------------------------------- */

    form.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        mostrarMensagem('');

        const titulo = el.nome.value.trim();

        if (!titulo) {
            mostrarMensagem('Dê um título à playlist.');
            el.nome.focus();
            return;
        }

        const corpo = {
            titulo: titulo,
            descricao: el.descricao.value.trim(),
            avaliacoes: selecionadas
        };

        // só envia a capa se a pessoa mexeu nela (senão o servidor mantém a atual)
        if (capaPendente !== undefined) corpo.capa = capaPendente;

        el.botaoSalvar.disabled = true; // evita enviar duas vezes

        const resultado = editando
            ? await V.editarPlaylist(parametroId, corpo)
            : await V.criarPlaylist(corpo);

        el.botaoSalvar.disabled = false;

        if (!resultado.ok) {
            mostrarMensagem(resultado.erro);
            return;
        }

        location.href = 'playlists.html';
    });

    /* -----------------------------------------
       INÍCIO: carrega avaliações (e a playlist, se estiver editando)
    ----------------------------------------- */

    async function iniciar() {
        const respostaAvaliacoes = await V.listarAvaliacoes();

        if (!respostaAvaliacoes.ok) {
            mostrarMensagem(respostaAvaliacoes.erro);
            return;
        }

        avaliacoes = respostaAvaliacoes.dados;

        if (editando) {
            const resposta = await V.obterPlaylist(parametroId);

            if (!resposta.ok) {
                alert(resposta.erro);
                location.replace('playlists.html');
                return;
            }

            const pl = resposta.dados;

            el.nome.value = pl.titulo;
            el.descricao.value = pl.descricao || '';
            capaSalva = pl.capa || null;
            selecionadas = pl.musicas.map(function (m) { return m.avaliacaoId; });

            el.titulo.textContent = 'Editar playlist';
            el.botaoSalvar.textContent = 'SALVAR ALTERAÇÕES';
            document.title = 'Editar Playlist | V-Side';
        }

        atualizarPrevia();
        renderizar();
    }

    iniciar();
})();