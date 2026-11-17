/* =========================================
   V-SIDE | avaliacoes.js
   - Busca na API as avaliações do usuário logado
     (o servidor só devolve as DELE)
   - Coração: favorita / desfavorita a música
   - "Clique para ver a resenha": expande o card
========================================= */

(function () {
    'use strict';

    const V = window.VSide;
    const lista = document.getElementById('listaAvaliacoes');
    const vazia = document.getElementById('mensagemAvaliacoesVazia');

    if (!V || !lista || !vazia) return;
    if (!V.exigirLogin()) return;

    // Esconde a mensagem de "lista vazia" até a API responder
    vazia.hidden = true;

    // Avaliações carregadas da API (usadas pelos cliques nos cards)
    let avaliacoes = [];

    const ICONE_CORACAO =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>' +
        '</svg>';

    // Cria um elemento já com classe e texto (textContent evita injeção de HTML)
    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function atualizarCoracao(botao, favoritado, artista) {
        botao.classList.toggle('favoritado', favoritado);
        botao.setAttribute('aria-pressed', String(favoritado));

        const rotulo = favoritado
            ? 'Remover ' + artista + ' dos favoritos'
            : 'Favoritar ' + artista;

        botao.setAttribute('aria-label', rotulo);
        botao.title = rotulo;
    }

    function criarCard(av) {
        const card = el('article', 'card-avaliacao');
        card.dataset.id = av.id;

        /* ---------- Parte principal ---------- */
        const principal = el('div', 'avaliacao-principal');

        const capa = el('img', 'capa-avaliacao');
        capa.src = V.capaPlaceholder(av.musica);
        capa.alt = 'Capa de ' + av.musica;
        principal.appendChild(capa);

        const info = el('div', 'avaliacao-informacoes');
        info.appendChild(el('h2', '', av.musica));
        info.appendChild(el('p', '', av.album ? av.artista + ' • ' + av.album : av.artista));
        principal.appendChild(info);

        /* ---------- Ações: coração + Spotify, nota e resenha ---------- */
        const acoes = el('div', 'avaliacao-acoes');

        const linha = el('div', 'linha-acoes-superior');

        const coracao = el('button', 'botao-favoritar-artista');
        coracao.type = 'button';
        coracao.innerHTML = ICONE_CORACAO;
        atualizarCoracao(coracao, av.favoritada, av.artista); // av.favoritada vem do banco
        linha.appendChild(coracao);

        const spotify = el('a', 'botao-spotify');
        spotify.href = V.spotifyBusca(av.musica + ' ' + av.artista);
        spotify.target = '_blank';
        spotify.rel = 'noopener noreferrer';

        const iconeSpotify = el('img');
        iconeSpotify.src = 'assets/icons/ic-spotify.png';
        iconeSpotify.alt = '';
        spotify.appendChild(iconeSpotify);
        spotify.appendChild(document.createTextNode('Ouça no Spotify'));
        linha.appendChild(spotify);

        acoes.appendChild(linha);

        const nota = el('div', 'avaliacao-nota');

        const estrelas = el('div', 'estrelas');
        estrelas.setAttribute('aria-label', 'Nota ' + av.nota + ' de 5');
        estrelas.appendChild(document.createTextNode('★'.repeat(av.nota)));
        if (av.nota < 5) {
            estrelas.appendChild(el('span', 'estrela-vazia', '★'.repeat(5 - av.nota)));
        }
        nota.appendChild(estrelas);

        const botaoResenha = el('button', 'botao-resenha', 'Clique para ver a resenha');
        botaoResenha.type = 'button';
        botaoResenha.setAttribute('aria-expanded', 'false');
        botaoResenha.setAttribute('aria-controls', 'resenha-' + av.id);
        nota.appendChild(botaoResenha);

        acoes.appendChild(nota);
        principal.appendChild(acoes);
        card.appendChild(principal);

        /* ---------- Área expansível da resenha ---------- */
        const detalhe = el('div', 'resenha-detalhe');
        detalhe.id = 'resenha-' + av.id;
        detalhe.setAttribute('aria-hidden', 'true');

        const interno = el('div', 'resenha-detalhe-interno');
        const texto = el('div', 'resenha-texto');
        texto.appendChild(el('h3', '', 'Sua resenha'));
        texto.appendChild(el('p', '', av.resenha));
        interno.appendChild(texto);
        detalhe.appendChild(interno);
        card.appendChild(detalhe);

        return card;
    }

    function renderizar() {
        lista.querySelectorAll('.card-avaliacao').forEach(function (c) { c.remove(); });

        vazia.hidden = avaliacoes.length > 0;

        avaliacoes.forEach(function (av) {
            lista.appendChild(criarCard(av));
        });
    }

    // Reaproveita o bloco "lista vazia" para mostrar um erro de carregamento
    function mostrarErro(texto) {
        vazia.querySelector('h2').textContent = 'Não foi possível carregar suas avaliações.';
        vazia.querySelector('p').textContent = texto;
        vazia.hidden = false;
    }

    async function carregar() {
        const resultado = await V.listarAvaliacoes();

        if (!resultado.ok) {
            mostrarErro(resultado.erro);
            return;
        }

        avaliacoes = resultado.dados;
        renderizar();
    }

    /* Cliques (delegação: funciona para todos os cards criados) */
    lista.addEventListener('click', async function (evento) {
        const card = evento.target.closest('.card-avaliacao');
        if (!card) return;

        /* Coração */
        const coracao = evento.target.closest('.botao-favoritar-artista');
        if (coracao) {
            const av = avaliacoes.find(function (a) { return String(a.id) === card.dataset.id; });
            if (!av || coracao.disabled) return;

            coracao.disabled = true; // evita clique duplo enquanto o servidor responde

            const resultado = av.favoritada
                ? await V.desfavoritar(av.id)
                : await V.favoritar(av.id);

            coracao.disabled = false;

            if (!resultado.ok) {
                alert(resultado.erro);
                return;
            }

            av.favoritada = !av.favoritada;
            atualizarCoracao(coracao, av.favoritada, av.artista);
            return;
        }

        /* Resenha */
        const botaoResenha = evento.target.closest('.botao-resenha');
        if (botaoResenha) {
            const aberto = card.classList.toggle('aberto');

            botaoResenha.setAttribute('aria-expanded', String(aberto));
            botaoResenha.textContent = aberto ? 'Ocultar resenha' : 'Clique para ver a resenha';
            card.querySelector('.resenha-detalhe').setAttribute('aria-hidden', String(!aberto));
        }
    });

    carregar();
})();