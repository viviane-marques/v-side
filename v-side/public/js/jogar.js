/* =========================================
   V-SIDE | jogar.js
   Jogo estilo ouça um trecho curto e adivinhe a música.
   Etapas: 0,5s -> 1s -> 5s -> 10s -> 15s (cada erro ou "Pular" libera a próxima).
   O servidor guarda a resposta; aqui só tocamos o áudio e mostramos a tela.
========================================= */

(function () {
    'use strict';

    const V = window.VSide;
    if (!V) return;

    // Tamanho de cada trecho liberado, em segundos. MUDE AQUI se quiser outras etapas
    // (se mudar a quantidade, ajuste também os rótulos no HTML e MAX_TENTATIVAS no controller).
    const ETAPAS = [0.5, 1, 5, 10, 15];

    // Pontos de corte da barra: [0, 0.5, 1, 5, 10, 15]
    const PONTOS = [0].concat(ETAPAS);

    /* ---------- Elementos da tela ---------- */
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

    /* ---------- Estado da rodada ---------- */
    let etapa = 0;          // etapa atual (0 = 0,5s ... 4 = 15s)
    let encerrada = true;   // true enquanto não há rodada em andamento
    let tocando = false;
    let enviando = false;   // true enquanto espera o servidor responder
    let dicaUsada = false;
    let historico = [];     // [{ tipo: 'erro' | 'pulo' | 'acerto', texto }]
    let idAnimacao = null;  // id do requestAnimationFrame

    /* -----------------------------------------
       UTILITÁRIOS
    ----------------------------------------- */

    // 0.5 -> "0,5s" | 5 -> "5s"
    function formatarTempo(seg) {
        return String(seg).replace('.', ',') + 's';
    }

    function mostrarMensagem(texto) {
        el.mensagem.textContent = texto;
        el.mensagem.hidden = !texto;
    }

    // Até onde o áudio pode tocar agora. Com a rodada encerrada, vai até o fim (30s)
    function limiteAtual() {
        return encerrada ? Infinity : ETAPAS[etapa];
    }

    /* -----------------------------------------
       BARRA DE PROGRESSO
       Cada etapa ocupa 20% da barra (senão 0,5s e 1s ficariam espremidos).
       Esta função converte o tempo (segundos) na posição (0 a 100).
    ----------------------------------------- */

    function posicaoNaBarra(t) {
        for (let k = 0; k < ETAPAS.length; k++) {
            if (t <= PONTOS[k + 1]) {
                // quanto já andamos dentro da etapa k (0 a 1)
                const fracao = Math.max(0, (t - PONTOS[k]) / (PONTOS[k + 1] - PONTOS[k]));
                return ((k + fracao) / ETAPAS.length) * 100;
            }
        }
        return 100; // passou dos 15s (só acontece depois que a rodada acaba)
    }

    function atualizarBarra(t) {
        const pos = posicaoNaBarra(t);
        el.barra.value = pos;
        el.barra.style.setProperty('--progresso', pos + '%'); // o CSS usa esta variável
    }

    /* -----------------------------------------
       ÁUDIO
       Em vez de setTimeout, conferimos audio.currentTime a cada quadro da tela.
       Assim o tempo de carregar o áudio NÃO é descontado do trecho: os 0,5s
       só começam a contar quando o som realmente começa.
    ----------------------------------------- */

    function tocar() {
        // clicar de novo enquanto toca = pausa
        if (tocando) {
            parar();
            return;
        }

        el.audio.currentTime = 0; // todo trecho começa do zero
        const promessa = el.audio.play();

        // o navegador pode recusar tocar (ex.: áudio ainda indisponível)
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

    // Roda a cada quadro: atualiza a barra e para quando chega no limite da etapa
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

    /* -----------------------------------------
       INTERFACE
    ----------------------------------------- */

    // Desenha as 5 caixinhas: tempo da etapa, ou o que a pessoa chutou
    function desenharTentativas() {
        el.tentativas.innerHTML = '';

        for (let i = 0; i < ETAPAS.length; i++) {
            const li = document.createElement('li');
            const h = historico[i];

            if (h) {
                li.className = h.tipo;
                // textContent: o que a pessoa digitou nunca é interpretado como HTML
                li.textContent = h.tipo === 'pulo' ? 'Pulou' : h.texto;
            } else {
                li.textContent = formatarTempo(ETAPAS[i]);
                if (i === etapa && !encerrada) li.className = 'atual';
            }

            el.tentativas.appendChild(li);
        }
    }

    function atualizarInterface() {
        // quantas etapas estão liberadas (tudo, quando a rodada acaba)
        const liberado = encerrada ? ETAPAS.length : etapa + 1;

        el.marcadores.forEach(function (rotulo, i) {
            rotulo.classList.toggle('liberada', i < liberado);
        });

        // o CSS escurece a parte da barra que ainda está bloqueada
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

    /* -----------------------------------------
       RODADAS
    ----------------------------------------- */

    async function novaRodada() {
        parar();

        // volta tudo ao começo
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

        // POST /jogo/nova -> o servidor sorteia e devolve SÓ o endereço do áudio
        const r = await V.chamarApi('/jogo/nova', { method: 'POST' });

        if (!r.ok) {
            // deixa a pessoa tentar de novo pelo botão do resultado
            encerrada = true;
            mostrarMensagem('');
            el.botaoProxima.textContent = 'Tentar de novo';
            el.tituloResultado.textContent = 'Ops!';
            el.descricaoResultado.textContent = r.erro;
            el.resultado.hidden = false;
            return;
        }

        el.audio.src = r.dados.preview;
        el.audio.preload = 'auto'; // já baixa o áudio, para o 0,5s sair sem atraso
        el.audio.load();

        el.botaoProxima.textContent = 'Próxima música';
        el.botaoPlay.disabled = false;
        travarControles(false);
        mostrarMensagem('');
        el.resposta.focus();
    }

    // Fim da rodada (acertou, errou tudo ou desistiu): revela capa, artista e álbum
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

    // Envia um chute ou um "pular" ao servidor e reage à resposta
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

        // acertou
        if (d.acertou) {
            historico.push({ tipo: 'acerto', texto: texto });
            etapa = d.tentativas - 1;
            finalizar(true, d);
            return;
        }

        historico.push({ tipo: tipoErro, texto: texto });
        etapa = d.tentativas; // próxima etapa = quantidade de tentativas já usadas

        // acabaram as tentativas
        if (d.encerrada) {
            etapa = ETAPAS.length - 1;
            finalizar(false, d);
            return;
        }

        // errou ou pulou, mas ainda tem tentativas: libera o trecho maior
        travarControles(false);
        el.resposta.value = '';
        el.resposta.focus();
        mostrarMensagem(
            (tipoErro === 'pulo' ? '' : 'Não é essa. ') +
            'Trecho aumentado para ' + formatarTempo(ETAPAS[etapa]) + '.'
        );
        atualizarInterface();
    }

    /* -----------------------------------------
       EVENTOS
    ----------------------------------------- */

    el.botaoPlay.addEventListener('click', tocar);

    // Enter ou botão "Adivinhar"
    el.form.addEventListener('submit', function (evento) {
        evento.preventDefault();

        const texto = el.resposta.value.trim();
        if (!texto) return;

        enviar('/jogo/chutar', { resposta: texto }, 'erro', texto);
    });

    el.botaoPular.addEventListener('click', function () {
        enviar('/jogo/pular', {}, 'pulo', '');
    });

    // Botão de dica: 1º clique revela o artista e vira "Desistir"; 2º clique desiste
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
            el.botaoDica.classList.add('desistir'); // estilo do CSS já existente
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

    // Se o endereço do áudio falhar, avisa em vez de ficar mudo sem explicação
    el.audio.addEventListener('error', function () {
        if (!el.audio.getAttribute('src')) return; // ignora o "src vazio" do reset
        parar();
        mostrarMensagem('Não foi possível carregar o áudio desta música. Clique em "Pular" ou comece outra rodada.');
    });

    novaRodada(); // começa a primeira rodada ao abrir a página
})();