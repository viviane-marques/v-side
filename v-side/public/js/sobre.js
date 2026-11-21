/* =========================================
   V-SIDE | sobre.js
   Carrossel de fotos da página "Sobre".
   Para adicionar uma foto nova, basta incluir
   mais um objeto na lista "momentos" abaixo:
   o FOR cria os slides e as bolinhas sozinho.
========================================= */

(function () {
    'use strict';

    /* -----------------------------------------
       1. DADOS: uma foto + textos por momento
    ----------------------------------------- */

    const momentos = [
        {
            imagem: 'assets/img/primeiro-setup.png',
            alt: 'Meu primeiro setup para tocar guitarra',
            titulo: 'Meu primeiro setup',
            descricao: 'O primeiro cantinho montado para tocar guitarra. ' +
                       'Foi aqui que a curiosidade pelos instrumentos ganhou ' +
                       'espaço para crescer.'
        },
        {
            imagem: 'assets/img/foto-banda.png',
            alt: 'Eu em uma das minhas apresentações em banda',
            titulo: 'Em cima do palco',
            descricao: 'Em uma das minhas apresentações em banda. Tocar com ' +
                       'outras pessoas é uma das melhores formas de sentir a ' +
                       'música de perto.'
        },
        {
            imagem: 'assets/img/mini-eu.png',
            alt: 'Eu aos 3 anos de idade com meu primeiro violão',
            titulo: 'Meu primeiro violão',
            descricao: 'Aos 3 anos de idade, com meu primeiro violão. ' +
                       'A música já fazia parte da minha vida desde bem ' +
                       'pequenininha.'
        }
    ];

    /* -----------------------------------------
       2. ELEMENTOS DA TELA
    ----------------------------------------- */

    const carrossel = document.getElementById('carrosselSobre');
    const trilho = document.getElementById('carrosselTrilho');
    const areaPontos = document.getElementById('carrosselPontos');
    const botaoAnterior = document.getElementById('carrosselAnterior');
    const botaoProximo = document.getElementById('carrosselProximo');
    const contador = document.getElementById('carrosselContador');

    if (!carrossel || !trilho || !areaPontos) return;

    const slides = [];
    const pontos = [];
    let atual = 0;

    /* -----------------------------------------
       3. CRIA SLIDES E BOLINHAS COM FOR
    ----------------------------------------- */

    for (let i = 0; i < momentos.length; i++) {
        const momento = momentos[i];

        // --- slide: foto + título + descrição ---
        const slide = document.createElement('figure');
        slide.className = 'carrossel-slide';

        const moldura = document.createElement('div');
        moldura.className = 'carrossel-moldura';

        const foto = document.createElement('img');
        foto.src = momento.imagem;
        foto.alt = momento.alt;
        foto.draggable = false;
        foto.loading = i === 0 ? 'eager' : 'lazy';

        moldura.appendChild(foto);

        const legenda = document.createElement('figcaption');
        legenda.className = 'carrossel-legenda';

        const titulo = document.createElement('h3');
        titulo.textContent = momento.titulo; // textContent: nunca interpreta HTML

        const descricao = document.createElement('p');
        descricao.textContent = momento.descricao;

        legenda.appendChild(titulo);
        legenda.appendChild(descricao);

        slide.appendChild(moldura);
        slide.appendChild(legenda);
        trilho.appendChild(slide);
        slides.push(slide);

        // --- bolinha de navegação ---
        const ponto = document.createElement('button');
        ponto.type = 'button';
        ponto.className = 'carrossel-ponto';
        ponto.setAttribute('aria-label', 'Ir para a foto ' + (i + 1) + ': ' + momento.titulo);

        // "let i" cria uma variável nova a cada volta do for,
        // por isso cada bolinha lembra o próprio número
        ponto.addEventListener('click', function () {
            irPara(i);
        });

        areaPontos.appendChild(ponto);
        pontos.push(ponto);
    }

    /* -----------------------------------------
       4. NAVEGAÇÃO
    ----------------------------------------- */

    function irPara(indice) {
        const total = slides.length;

        // volta ao começo depois da última foto (e vice-versa)
        atual = (indice + total) % total;

        trilho.style.transform = 'translateX(-' + (atual * 100) + '%)';

        for (let i = 0; i < total; i++) {
            const ativo = i === atual;

            slides[i].classList.toggle('ativo', ativo);
            slides[i].setAttribute('aria-hidden', ativo ? 'false' : 'true');

            pontos[i].classList.toggle('ativo', ativo);
            pontos[i].setAttribute('aria-current', ativo ? 'true' : 'false');
        }

        contador.textContent = (atual + 1) + ' / ' + total;
    }

    botaoAnterior.addEventListener('click', function () {
        irPara(atual - 1);
    });

    botaoProximo.addEventListener('click', function () {
        irPara(atual + 1);
    });

    // Setas do teclado quando o carrossel está em foco
    carrossel.addEventListener('keydown', function (evento) {
        if (evento.key === 'ArrowLeft') {
            irPara(atual - 1);
        } else if (evento.key === 'ArrowRight') {
            irPara(atual + 1);
        }
    });

    // Arrastar o dedo no celular
    let inicioX = null;

    carrossel.addEventListener('touchstart', function (evento) {
        inicioX = evento.touches[0].clientX;
    }, { passive: true });

    carrossel.addEventListener('touchend', function (evento) {
        if (inicioX === null) return;

        const diferenca = evento.changedTouches[0].clientX - inicioX;
        inicioX = null;

        // só conta se o dedo andou o bastante (evita confundir com um toque)
        if (Math.abs(diferenca) > 50) {
            irPara(diferenca < 0 ? atual + 1 : atual - 1);
        }
    }, { passive: true });

    // Se só houver uma foto, esconde os controles
    if (slides.length < 2) {
        carrossel.classList.add('sem-controles');
    }

    irPara(0);
})();