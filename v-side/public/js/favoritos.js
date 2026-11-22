(function () {
    'use strict';

    const V = window.VSide;
    const lista = document.querySelector('.lista-favoritos');
    const vazia = lista && lista.querySelector('.mensagem-favoritos-vazia');

    if (!V || !lista || !vazia) return;
    if (!V.exigirLogin()) return;

    vazia.hidden = true;

    const ICONE_CORACAO =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>' +
        '</svg>';

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function criarCard(artista) {
        const idPainel = 'resenha-' + artista.id.replace(/[^a-z0-9]+/g, '-');
        const total = artista.musicas.length;

        const card = el('article', 'card-favorito');
        card.dataset.favoritoId = artista.id;

        /* Capa */
        const capa = el('img', 'capa-album');
        capa.src = V.capaPlaceholder(artista.artista);
        capa.alt = artista.artista;
        card.appendChild(capa);

        /* Informações */
        const info = el('div', 'informacoes-album');
        info.appendChild(el('h2', '', artista.artista));
        info.appendChild(el('p', 'artistas-album',
            total === 1 ? '1 música favoritada' : total + ' músicas favoritadas'));

        const botaoResenha = el('button', 'link-resenha', 'Clique para ver suas músicas favoritas');
        botaoResenha.type = 'button';
        botaoResenha.setAttribute('aria-expanded', 'false');
        botaoResenha.setAttribute('aria-controls', idPainel);
        info.appendChild(botaoResenha);
        card.appendChild(info);

        /* Painel: qual música foi favoritada */
        const painel = el('div', 'painel-resenha');
        painel.id = idPainel;
        painel.setAttribute('aria-hidden', 'true');

        const conteudo = el('div', 'conteudo-resenha');
        conteudo.appendChild(el('h3', '', total === 1 ? 'Música favoritada' : 'Músicas favoritadas'));

        const ul = el('ul', 'lista-musicas-favoritadas');
        artista.musicas.forEach(function (m) {
            const li = el('li');
            li.appendChild(el('strong', '', m.musica));
            if (m.album) li.appendChild(document.createTextNode(' — ' + m.album));
            ul.appendChild(li);
        });
        conteudo.appendChild(ul);
        painel.appendChild(conteudo);
        card.appendChild(painel);

        /* Ações */
        const acoes = el('div', 'acoes-favorito');

        const remover = el('button', 'botao-remover-favorito');
        remover.type = 'button';
        remover.innerHTML = ICONE_CORACAO;
        remover.setAttribute('aria-label', 'Remover ' + artista.artista + ' dos favoritos');
        remover.title = 'Remover dos favoritos';
        acoes.appendChild(remover);

        const spotify = el('a', 'botao-spotify');
        spotify.href = V.spotifyBusca(artista.artista);
        spotify.target = '_blank';
        spotify.rel = 'noopener noreferrer';

        const iconeSpotify = el('img');
        iconeSpotify.src = 'assets/icons/ic-spotify.png';
        iconeSpotify.alt = '';
        spotify.appendChild(iconeSpotify);
        spotify.appendChild(document.createTextNode('Ouça no Spotify'));
        acoes.appendChild(spotify);

        card.appendChild(acoes);

        return card;
    }
    
    async function carregar() {
        const resultado = await V.listarArtistasFavoritos();

        lista.querySelectorAll('.card-favorito').forEach(function (c) { c.remove(); });

        if (!resultado.ok) {
            vazia.querySelector('h2').textContent = 'Não foi possível carregar seus favoritos.';
            vazia.querySelector('p').textContent = resultado.erro;
            vazia.hidden = false;
            return;
        }

        const artistas = resultado.dados;
        vazia.hidden = artistas.length > 0;

        artistas.forEach(function (a) {
            lista.insertBefore(criarCard(a), vazia);
        });
    }

    lista.addEventListener('click', async function (evento) {
        const card = evento.target.closest('.card-favorito');
        if (!card) return;

        /* Ver resenha */
        const botaoResenha = evento.target.closest('.link-resenha');
        if (botaoResenha) {
            const aberto = card.classList.toggle('resenha-aberta');

            botaoResenha.setAttribute('aria-expanded', String(aberto));
            card.querySelector('.painel-resenha').setAttribute('aria-hidden', String(!aberto));
            return;
        }

        /* Remover artista */
        const botaoRemover = evento.target.closest('.botao-remover-favorito');
        if (botaoRemover) {
            if (botaoRemover.disabled) return;
            botaoRemover.disabled = true;

            const resultado = await V.removerArtistaFavorito(card.dataset.favoritoId);

            if (!resultado.ok) {
                botaoRemover.disabled = false;
                alert(resultado.erro);
                return;
            }

            card.classList.add('card-removendo');
            setTimeout(carregar, 250);
        }
    });

    carregar();
})();