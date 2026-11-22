(function () {
    'use strict';

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

// for para o carrossel e as bolinhas em baixo
    for (let i = 0; i < momentos.length; i++) {
        const momento = momentos[i];

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
        titulo.textContent = momento.titulo;

        const descricao = document.createElement('p');
        descricao.textContent = momento.descricao;

        legenda.appendChild(titulo);
        legenda.appendChild(descricao);

        slide.appendChild(moldura);
        slide.appendChild(legenda);
        trilho.appendChild(slide);
        slides.push(slide);

        const ponto = document.createElement('button');
        ponto.type = 'button';
        ponto.className = 'carrossel-ponto';
        ponto.setAttribute('aria-label', 'Ir para a foto ' + (i + 1) + ': ' + momento.titulo);

        ponto.addEventListener('click', function () {
            irPara(i);
        });

        areaPontos.appendChild(ponto);
        pontos.push(ponto);
    }

    function irPara(indice) {
        const total = slides.length;

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

    carrossel.addEventListener('keydown', function (evento) {
        if (evento.key === 'ArrowLeft') {
            irPara(atual - 1);
        } else if (evento.key === 'ArrowRight') {
            irPara(atual + 1);
        }
    });

    let inicioX = null;

    carrossel.addEventListener('touchstart', function (evento) {
        inicioX = evento.touches[0].clientX;
    }, { passive: true });

    carrossel.addEventListener('touchend', function (evento) {
        if (inicioX === null) return;

        const diferenca = evento.changedTouches[0].clientX - inicioX;
        inicioX = null;

        if (Math.abs(diferenca) > 50) {
            irPara(diferenca < 0 ? atual + 1 : atual - 1);
        }
    }, { passive: true });

    if (slides.length < 2) {
        carrossel.classList.add('sem-controles');
    }

    irPara(0);
})();