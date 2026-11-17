/* =========================================
   V-SIDE | playlists.js
   Busca de playlists:
   - barra da própria página (#buscaPlaylist)
   - barra da header (vinda de qualquer página
     via playlists.html?busca=termo)
========================================= */

(function () {
    'use strict';

    const lista = document.getElementById('listaPlaylists');
    const campoPagina = document.getElementById('buscaPlaylist');
    const campoHeader = document.querySelector('.barra-de-pesquisa input[name="busca"]');
    const formHeader = document.querySelector('.barra-de-pesquisa');
    const mensagem = document.getElementById('nenhumaPlaylist');

    if (!lista) return;

    const cards = Array.prototype.slice.call(lista.querySelectorAll('.playlist-card'));

    // "Música" e "musica" são tratados como iguais
    function normalizar(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Texto pesquisável de cada card: título, descrição e duração
    const indice = cards.map(function (card) {
        return { card: card, texto: normalizar(card.textContent) };
    });

    function filtrar(termo) {
        const busca = normalizar(termo);
        const palavras = busca ? busca.split(' ') : [];
        let encontrados = 0;

        indice.forEach(function (item) {
            // todas as palavras digitadas precisam aparecer no card
            const combina = palavras.every(function (p) {
                return item.texto.indexOf(p) !== -1;
            });

            item.card.style.display = combina ? '' : 'none';
            if (combina) encontrados++;
        });

        if (mensagem) {
            mensagem.style.display = encontrados === 0 ? 'block' : '';
        }
    }

    // Mantém as duas barras com o mesmo texto e atualiza o endereço
    function aplicar(termo, origem) {
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

    // Barra da página: filtra enquanto digita
    if (campoPagina) {
        campoPagina.addEventListener('input', function () {
            aplicar(campoPagina.value, campoPagina);
        });
    }

    if (campoHeader) {
        // Barra da header: filtra enquanto digita (aqui nesta página)
        campoHeader.addEventListener('input', function () {
            aplicar(campoHeader.value, campoHeader);
        });

        // Enter não recarrega a página, só filtra
        if (formHeader) {
            formHeader.addEventListener('submit', function (evento) {
                evento.preventDefault();
                aplicar(campoHeader.value, campoHeader);
            });
        }
    }

    // Busca vinda de outra página (header -> playlists.html?busca=...)
    const inicial = new URLSearchParams(window.location.search).get('busca') || '';
    if (inicial) {
        aplicar(inicial, null);
    } else {
        filtrar('');
    }
})();