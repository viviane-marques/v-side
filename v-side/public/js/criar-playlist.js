(function () {
    'use strict';

    const V = window.VSide;
    const form = document.getElementById('formPlaylist');

    if (!V || !form) return;
    if (!V.exigirLogin()) return;

    const TAMANHO_CAPA = 320;

    const parametroId = new URLSearchParams(location.search).get('id');
    const editando = parametroId !== null;

    if (editando && !/^\d+$/.test(parametroId)) {
        location.replace('playlists.html');
        return;
    }
    
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

    let avaliacoes = [];
    let selecionadas = [];
    let capaSalva = null;
    let capaPendente;

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

    function atualizarPrevia() {
        let imagem;

        if (capaPendente === undefined) {
            imagem = capaSalva;
        } else {
            imagem = capaPendente;
        }

        el.previa.src = imagem || V.capaPlaceholder(el.nome.value || '♪');
    }

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

                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, TAMANHO_CAPA, TAMANHO_CAPA);

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

        el.inputCapa.value = '';
    });

    el.botaoRemoverCapa.addEventListener('click', function () {
        capaPendente = null;
        atualizarPrevia();
        mostrarMensagem('');
    });

    el.nome.addEventListener('input', atualizarPrevia);

    function criarLinha(av, naPlaylist) {
        const item = document.createElement('li');
        item.className = 'linha-musica';

        const textos = document.createElement('span');
        textos.className = 'linha-musica-textos';

        const nome = document.createElement('strong');
        nome.textContent = av.musica;

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
                selecionadas = selecionadas.filter(function (id) { return id !== av.id; });
            } else {
                selecionadas.push(av.id);
            }
            renderizar();
        });

        item.appendChild(textos);
        item.appendChild(botao);
        return item;
    }

    function renderizar() {
        el.listaNa.innerHTML = '';

        selecionadas.forEach(function (id) {
            const av = acharAvaliacao(id);
            if (av) el.listaNa.appendChild(criarLinha(av, true));
        });

        el.contador.textContent = '(' + selecionadas.length + ')';
        el.vazioNa.hidden = selecionadas.length > 0;

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

        if (capaPendente !== undefined) corpo.capa = capaPendente;

        el.botaoSalvar.disabled = true;

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