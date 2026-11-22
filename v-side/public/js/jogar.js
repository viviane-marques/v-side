(function () {
    'use strict';

    const V = window.VSide;
    if (!V) return;

    const ETAPAS = [0.5, 1, 5, 10, 15];

    const PONTOS = [0].concat(ETAPAS);

    // elementos da tela
    const el = {
        capa: document.getElementById('capaAlbum'),
        interrogacao: document.getElementById('interrogacaoCapa'),
        artista: document.getElementById('artistaRevelado'),
        albumLinha: document.getElementById('albumRevelado'),
        albumNome: document.getElementById('nomeAlbumRevelado'),
        botaoDica: document.getElementById('botaoDica'),
        iconeDica: document.getElementById('iconeDica'),
        textoDica: document.getElementById('textoBotaoDica'),
        botaoPlay: document.getElementById('botaoPlay'),
        marcadores: document.querySelectorAll('#marcadoresTempo span'),
        barra: document.getElementById('barraAudio'),
        barraWrapper: document.getElementById('barraWrapper'),
        tempoLiberado: document.getElementById('tempoDecorrido'),
        tentativaTexto: document.getElementById('tempoRestante'),
        tentativas: document.getElementById('listaTentativas'),
        audio: document.getElementById('audioMusica'),
        form: document.getElementById('formResposta'),
        resposta: document.getElementById('respostaMusica'),
        botaoPular: document.getElementById('botaoPular'),
        botaoAdivinhar: document.getElementById('botaoAdivinhar'),
        mensagem: document.getElementById('mensagemJogo'),
        resultado: document.getElementById('resultadoJogo'),
        tituloResultado: document.getElementById('tituloResultado'),
        descricaoResultado: document.getElementById('descricaoResultado'),
        botaoProxima: document.getElementById('botaoProximaRodada')
    };

    let etapa = 0;
    let encerrada = true;
    let tocando = false;
    let enviando = false;
    let dicaUsada = false;
    let historico = []; 
    let idAnimacao = null;

    function formatarTempo(seg) {
        return String(seg).replace('.', ',') + 's';
    }

    function mostrarMensagem(texto) {
        el.mensagem.textContent = texto;
        el.mensagem.hidden = !texto;
    }
function limiteAtual() {
        return encerrada ? Infinity : ETAPAS[etapa];
    }

    function posicaoNaBarra(t) {
        for (let k = 0; k < ETAPAS.length; k++) {
            if (t <= PONTOS[k + 1]) {
                const fracao = Math.max(0, (t - PONTOS[k]) / (PONTOS[k + 1] - PONTOS[k]));
                return ((k + fracao) / ETAPAS.length) * 100;
            }
        }
        return 100;
    }

    function atualizarBarra(t) {
        const pos = posicaoNaBarra(t);
        el.barra.value = pos;
        el.barra.style.setProperty('--progresso', pos + '%');
    }

    function tocar() {
        if (tocando) {
            parar();
            return;
        }

        el.audio.currentTime = 0;
        const promessa = el.audio.play();

        if (promessa) {
            promessa.catch(function () {
                mostrarMensagem('Não foi possível tocar o áudio. Clique em ▶ de novo.');
                parar();
            });
        }

        tocando = true;
        el.botaoPlay.textContent = '❚❚';
        idAnimacao = requestAnimationFrame(acompanhar);
    }

    function acompanhar() {
        const t = el.audio.currentTime;
        atualizarBarra(t);

        if (t >= limiteAtual() || el.audio.ended) {
            parar();
            return;
        }
        idAnimacao = requestAnimationFrame(acompanhar);
    }

    function parar() {
        cancelAnimationFrame(idAnimacao);
        el.audio.pause();
        tocando = false;
        el.botaoPlay.textContent = '▶';
    }

    function desenharTentativas() {
        el.tentativas.innerHTML = '';

        for (let i = 0; i < ETAPAS.length; i++) {
            const li = document.createElement('li');
            const h = historico[i];

            if (h) {
                li.className = h.tipo;
                li.textContent = h.tipo === 'pulo' ? 'Pulou' : h.texto;
            } else {
                li.textContent = formatarTempo(ETAPAS[i]);
                if (i === etapa && !encerrada) li.className = 'atual';
            }

            el.tentativas.appendChild(li);
        }
    }

    function atualizarInterface() {
        const liberado = encerrada ? ETAPAS.length : etapa + 1;

        el.marcadores.forEach(function (rotulo, i) {
            rotulo.classList.toggle('liberada', i < liberado);
        });

        el.barraWrapper.style.setProperty('--liberado', (liberado / ETAPAS.length) * 100 + '%');

        el.tempoLiberado.textContent = 'Trecho liberado: ' + formatarTempo(ETAPAS[Math.min(etapa, ETAPAS.length - 1)]);
        el.tentativaTexto.textContent = 'Tentativa ' + Math.min(etapa + 1, ETAPAS.length) + ' de ' + ETAPAS.length;

        el.botaoPular.textContent = etapa < ETAPAS.length - 1
            ? 'Pular → ' + formatarTempo(ETAPAS[etapa + 1])
            : 'Pular e encerrar';

        desenharTentativas();
    }

    function travarControles(travar) {
        el.resposta.disabled = travar;
        el.botaoAdivinhar.disabled = travar;
        el.botaoPular.disabled = travar;
        el.botaoDica.disabled = travar;
    }

    async function novaRodada() {
        parar();
        etapa = 0;
        encerrada = false;
        dicaUsada = false;
        historico = [];

        el.capa.hidden = true;
        el.capa.src = '';
        el.interrogacao.hidden = false;
        el.artista.textContent = '????';
        el.albumLinha.hidden = true;
        el.resultado.hidden = true;

        el.botaoDica.classList.remove('desistir');
        el.iconeDica.textContent = '💡';
        el.textoDica.textContent = 'Pedir dica';

        el.resposta.value = '';
        atualizarBarra(0);
        travarControles(true);
        el.botaoPlay.disabled = true;
        atualizarInterface();
        mostrarMensagem('Sorteando uma música...');

        const r = await V.chamarApi('/jogo/nova', { method: 'POST' });

        if (!r.ok) {
            encerrada = true;
            mostrarMensagem('');
            el.botaoProxima.textContent = 'Tentar de novo';
            el.tituloResultado.textContent = 'Ops!';
            el.descricaoResultado.textContent = r.erro;
            el.resultado.hidden = false;
            return;
        }

        el.audio.src = r.dados.preview;
        el.audio.preload = 'auto';
        el.audio.load();

        el.botaoProxima.textContent = 'Próxima música';
        el.botaoPlay.disabled = false;
        travarControles(false);
        mostrarMensagem('');
        el.resposta.focus();
    }

    function finalizar(ganhou, dados) {
        encerrada = true;
        parar();

        const rev = dados.revelacao;

        if (rev.capa) {
            el.capa.src = rev.capa;
            el.capa.hidden = false;
            el.interrogacao.hidden = true;
        }

        el.artista.textContent = rev.artista;
        el.albumNome.textContent = rev.album || '';
        el.albumLinha.hidden = !rev.album;

        el.tituloResultado.textContent = ganhou ? 'Acertou! 🎉' : 'Não foi dessa vez';
        el.descricaoResultado.textContent =
            (ganhou ? 'Você acertou na tentativa ' + dados.tentativas + ' de ' + ETAPAS.length + '. ' : '') +
            'A música era "' + rev.titulo + '" de ' + rev.artista + '. Clique em ▶ para ouvir o trecho completo.';
        el.resultado.hidden = false;

        mostrarMensagem('');
        travarControles(true);
        atualizarInterface();
    }

    async function enviar(url, corpo, tipoErro, texto) {
        if (enviando || encerrada) return;

        enviando = true;
        travarControles(true);

        const r = await V.chamarApi(url, { method: 'POST', body: JSON.stringify(corpo || {}) });

        enviando = false;

        if (!r.ok) {
            travarControles(false);
            mostrarMensagem(r.erro);
            return;
        }

        const d = r.dados;

        if (d.acertou) {
            historico.push({ tipo: 'acerto', texto: texto });
            etapa = d.tentativas - 1;
            finalizar(true, d);
            return;
        }

        historico.push({ tipo: tipoErro, texto: texto });
        etapa = d.tentativas;

        if (d.encerrada) {
            etapa = ETAPAS.length - 1;
            finalizar(false, d);
            return;
        }

        travarControles(false);
        el.resposta.value = '';
        el.resposta.focus();
        mostrarMensagem(
            (tipoErro === 'pulo' ? '' : 'Não é essa. ') +
            'Trecho aumentado para ' + formatarTempo(ETAPAS[etapa]) + '.'
        );
        atualizarInterface();
    }

    el.botaoPlay.addEventListener('click', tocar);

    el.form.addEventListener('submit', function (evento) {
        evento.preventDefault();

        const texto = el.resposta.value.trim();
        if (!texto) return;

        enviar('/jogo/chutar', { resposta: texto }, 'erro', texto);
    });

    el.botaoPular.addEventListener('click', function () {
        enviar('/jogo/pular', {}, 'pulo', '');
    });

    el.botaoDica.addEventListener('click', async function () {
        if (encerrada || enviando) return;

        if (!dicaUsada) {
            const r = await V.chamarApi('/jogo/dica', { method: 'POST' });
            if (!r.ok) {
                mostrarMensagem(r.erro);
                return;
            }

            el.artista.textContent = r.dados.artista;
            dicaUsada = true;
            el.botaoDica.classList.add('desistir');
            el.iconeDica.textContent = '🏳️';
            el.textoDica.textContent = 'Desistir';
            return;
        }

        if (!confirm('Desistir e ver a resposta?')) return;

        const r = await V.chamarApi('/jogo/desistir', { method: 'POST' });
        if (!r.ok) {
            mostrarMensagem(r.erro);
            return;
        }
        finalizar(false, r.dados);
    });

    el.botaoProxima.addEventListener('click', novaRodada);

    el.audio.addEventListener('error', function () {
        if (!el.audio.getAttribute('src')) return;
        parar();
        mostrarMensagem('Não foi possível carregar o áudio desta música. Clique em "Pular" ou comece outra rodada.');
    });

    novaRodada();
})();