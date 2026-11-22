(function () {
    'use strict';

    const V = window.VSide;
    const lista = document.getElementById('listaPlaylists');
    const campoPagina = document.getElementById('buscaPlaylist');
    const campoHeader = document.querySelector('.barra-de-pesquisa input[name="busca"]');
    const formHeader = document.querySelector('.barra-de-pesquisa');
    const mensagem = document.getElementById('nenhumaPlaylist');
    const vazia = document.getElementById('playlistsVazia');

    if (!V || !lista) return;
    if (!V.exigirLogin()) return;

    let playlists = [];
    let indice = [];
    let termoAtual = '';

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function normalizar(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function criarCard(pl) {
        const card = el('article', 'playlist-card');
        card.dataset.id = pl.id;

        const capa = el('img', 'capa-playlist');
        capa.src = pl.capa || V.capaPlaceholder(pl.titulo);
        capa.alt = 'Capa da playlist ' + pl.titulo;
        card.appendChild(capa);

        const info = el('div', 'playlist-informacoes');

        const linha = el('div', 'playlist-titulo-linha');
        linha.appendChild(el('h2', '', pl.titulo));
        linha.appendChild(el('span', 'playlist-duracao',
            pl.musicas.length + (pl.musicas.length === 1 ? ' música' : ' músicas')));
        info.appendChild(linha);

        if (pl.descricao) {
            info.appendChild(el('p', '', pl.descricao));
        }

        const faixas = el('ol', 'playlist-faixas');
        faixas.hidden = true;

        pl.musicas.forEach(function (m) {
            const item = el('li');
            item.appendChild(el('strong', '', m.musica));
            item.appendChild(el('span', '', ' — ' + (m.album ? m.artista + ' • ' + m.album : m.artista)));
            faixas.appendChild(item);
        });

        if (pl.musicas.length > 0) {
            const botaoVer = el('button', 'botao-ver-musicas', 'Ver músicas');
            botaoVer.type = 'button';
            botaoVer.setAttribute('aria-expanded', 'false');
            info.appendChild(botaoVer);
        } else {
            info.appendChild(el('span', 'playlist-sem-musicas', 'Playlist vazia. Clique em Editar para adicionar músicas.'));
        }

        card.appendChild(info);

        const acoes = el('div', 'playlist-acoes');

        const editar = el('a', 'botao-playlist-acao', '✎ Editar');
        editar.href = 'criar-playlist.html?id=' + encodeURIComponent(pl.id);
        acoes.appendChild(editar);

        const excluir = el('button', 'botao-playlist-acao botao-excluir', 'Excluir');
        excluir.type = 'button';
        acoes.appendChild(excluir);

        card.appendChild(acoes);
        card.appendChild(faixas);

        const texto = [pl.titulo, pl.descricao].concat(
            pl.musicas.map(function (m) { return m.musica + ' ' + m.artista + ' ' + (m.album || ''); })
        ).join(' ');

        indice.push({ card: card, texto: normalizar(texto) });

        return card;
    }

    function renderizar() {
        lista.querySelectorAll('.playlist-card').forEach(function (c) { c.remove(); });
        indice = [];

        playlists.forEach(function (pl) {
            lista.insertBefore(criarCard(pl), mensagem);
        });

        vazia.hidden = playlists.length > 0;
        filtrar(termoAtual);
    }

    function filtrar(termo) {
        const palavras = normalizar(termo) ? normalizar(termo).split(' ') : [];
        let encontrados = 0;

        indice.forEach(function (item) {
            const combina = palavras.every(function (p) {
                return item.texto.indexOf(p) !== -1;
            });

            item.card.style.display = combina ? '' : 'none';
            if (combina) encontrados++;
        });

        mensagem.style.display = (playlists.length > 0 && encontrados === 0) ? 'block' : '';
    }

    function aplicar(termo, origem) {
        termoAtual = termo;

        if (campoPagina && origem !== campoPagina) campoPagina.value = termo;
        if (campoHeader && origem !== campoHeader) campoHeader.value = termo;

        filtrar(termo);

        try {
            const url = new URL(window.location.href);
            if (termo.trim()) {
                url.searchParams.set('busca', termo.trim());
            } else {
                url.searchParams.delete('busca');
            }
            window.history.replaceState(null, '', url);
        } catch (erro) { /* sem ação */ }
    }

    if (campoPagina) {
        campoPagina.addEventListener('input', function () {
            aplicar(campoPagina.value, campoPagina);
        });
    }

    if (campoHeader) {
        campoHeader.addEventListener('input', function () {
            aplicar(campoHeader.value, campoHeader);
        });

        if (formHeader) {
            formHeader.addEventListener('submit', function (evento) {
                evento.preventDefault();
                aplicar(campoHeader.value, campoHeader);
            });
        }
    }

    lista.addEventListener('click', async function (evento) {
        const card = evento.target.closest('.playlist-card');
        if (!card) return;

        const botaoVer = evento.target.closest('.botao-ver-musicas');
        if (botaoVer) {
            const faixas = card.querySelector('.playlist-faixas');
            faixas.hidden = !faixas.hidden;

            botaoVer.textContent = faixas.hidden ? 'Ver músicas' : 'Ocultar músicas';
            botaoVer.setAttribute('aria-expanded', String(!faixas.hidden));
            return;
        }

        const botaoExcluir = evento.target.closest('.botao-excluir');
        if (botaoExcluir) {
            const pl = playlists.find(function (p) { return String(p.id) === card.dataset.id; });
            if (!pl) return;

            if (!confirm('Excluir a playlist "' + pl.titulo + '"? Suas avaliações não serão apagadas.')) {
                return;
            }

            botaoExcluir.disabled = true;
            const resultado = await V.excluirPlaylist(pl.id);

            if (!resultado.ok) {
                botaoExcluir.disabled = false;
                alert(resultado.erro);
                return;
            }

            playlists = playlists.filter(function (p) { return p.id !== pl.id; });
            renderizar();
        }
    });

    async function carregar() {
        const resultado = await V.listarPlaylists();

        if (!resultado.ok) {
            mensagem.textContent = resultado.erro;
            mensagem.style.display = 'block';
            return;
        }

        playlists = resultado.dados;
        renderizar();

        const inicial = new URLSearchParams(window.location.search).get('busca') || '';
        if (inicial) aplicar(inicial, null);
    }

    carregar();
})();