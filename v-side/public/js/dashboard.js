(function () {
    'use strict';

    const V = window.VSide;
    if (!V) return;
    if (!V.exigirLogin()) return;

    const FOTO_PADRAO = 'assets/icons/user.svg';
    const TAMANHO_FOTO = 256;
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const ICONE_ESTRELA =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/>' +
        '</svg>';

    const ICONE_CORACAO =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>' +
        '</svg>';

    const el = {
        foto: document.getElementById('fotoPerfil'),
        nome: document.getElementById('nomeUsuario'),
        botaoEditar: document.getElementById('editarPerfil'),
        form: document.getElementById('formPerfil'),
        inputFoto: document.getElementById('inputFoto'),
        botaoEscolherFoto: document.getElementById('botaoTrocarFoto'),
        botaoRemoverFoto: document.getElementById('botaoRemoverFoto'),
        campoNome: document.getElementById('campoNome'),
        mensagemPerfil: document.getElementById('mensagemPerfil'),
        botaoCancelar: document.getElementById('cancelarPerfil'),
        totalAvaliacoes: document.getElementById('totalAvaliacoes'),
        mediaNotas: document.getElementById('mediaNotas'),
        totalFavoritos: document.getElementById('totalFavoritos'),
        totalPlaylists: document.getElementById('totalPlaylists'),
        taxaJogo: document.getElementById('taxaJogo'),
        detalheJogo: document.getElementById('detalheJogo'),
        grafico: document.getElementById('graficoAvaliacoes'),
        mensagemGrafico: document.getElementById('mensagemGrafico'),
        atividades: document.getElementById('listaAtividades')
    };

    let dados = null;
    let fotoPendente;

    function formatarDecimal(numero) {
        return numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    function haQuantoTempo(segundos) {
        if (segundos < 60) return 'agora mesmo';

        const minutos = Math.floor(segundos / 60);
        if (minutos < 60) return 'há ' + minutos + (minutos === 1 ? ' minuto' : ' minutos');

        const horas = Math.floor(minutos / 60);
        if (horas < 24) return 'há ' + horas + (horas === 1 ? ' hora' : ' horas');

        const dias = Math.floor(horas / 24);
        if (dias < 30) return 'há ' + dias + (dias === 1 ? ' dia' : ' dias');

        const meses = Math.floor(dias / 30);
        if (meses < 12) return 'há ' + meses + (meses === 1 ? ' mês' : ' meses');

        const anos = Math.floor(dias / 365);
        return 'há ' + anos + (anos === 1 ? ' ano' : ' anos');
    }

    function criar(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function mostrarPerfil(usuario) {
        el.nome.textContent = usuario.nome;
        el.foto.src = usuario.foto || FOTO_PADRAO;
    }

    function mostrarIndicadores(kpis) {
        el.totalAvaliacoes.textContent = kpis.avaliacoes;
        el.mediaNotas.textContent = kpis.media === null ? '–' : formatarDecimal(kpis.media);
        el.totalFavoritos.textContent = kpis.favoritos;
        el.totalPlaylists.textContent = kpis.playlists;
    }

    function mostrarJogo(jogo) {
        if (!jogo || jogo.partidas === 0) {
            el.taxaJogo.textContent = '–';
            el.detalheJogo.textContent = 'Nenhuma rodada ainda';
            return;
        }

        el.taxaJogo.textContent = jogo.taxa + '%';
        el.detalheJogo.textContent = jogo.acertos + ' de ' + jogo.partidas +
            (jogo.partidas === 1 ? ' rodada' : ' rodadas');
    }

    function desenharGrafico() {
        if (!dados) return;

        const serie = dados.serie;
        const largura = el.grafico.clientWidth;
        const altura = el.grafico.clientHeight;

        if (largura === 0 || altura === 0) return;

        const margem = { topo: 14, direita: 16, base: 34, esquerda: 42 };
        const areaLargura = largura - margem.esquerda - margem.direita;
        const areaAltura = altura - margem.topo - margem.base;

        const x = function (indice) {
            return margem.esquerda + (areaLargura * (indice + 0.5)) / 12;
        };

        const y = function (nota) {
            return margem.topo + areaAltura - ((nota - 1) / 4) * areaAltura;
        };

        let svg = '<svg width="' + largura + '" height="' + altura + '" ' +
            'viewBox="0 0 ' + largura + ' ' + altura + '" role="img" ' +
            'aria-label="Média das suas notas por mês">';

        for (let nota = 1; nota <= 5; nota++) {
            svg += '<line x1="' + margem.esquerda + '" x2="' + (largura - margem.direita) + '" ' +
                'y1="' + y(nota) + '" y2="' + y(nota) + '" stroke="#fff" stroke-opacity="0.75" stroke-width="1"/>';

            svg += '<text x="' + (margem.esquerda - 10) + '" y="' + (y(nota) + 4) + '" ' +
                'text-anchor="end" font-size="12" fill="#fff">' + formatarDecimal(nota) + '</text>';
        }

        MESES.forEach(function (nomeMes, i) {
            svg += '<text x="' + x(i) + '" y="' + (altura - 10) + '" ' +
                'text-anchor="middle" font-size="12" fill="#fff">' + nomeMes + '</text>';
        });

        let trecho = '';

        serie.forEach(function (ponto, i) {
            if (ponto.media === null) {
                if (trecho) svg += '<path d="' + trecho + '" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>';
                trecho = '';
                return;
            }

            trecho += (trecho ? ' L ' : 'M ') + x(i) + ' ' + y(ponto.media);
        });

        if (trecho) svg += '<path d="' + trecho + '" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>';

        serie.forEach(function (ponto, i) {
            if (ponto.media === null) return;

            const dica = MESES[i] + ': média ' + formatarDecimal(ponto.media) + ' (' +
                ponto.quantidade + (ponto.quantidade === 1 ? ' avaliação)' : ' avaliações)');

            svg += '<g><title>' + dica + '</title>' +
                '<circle cx="' + x(i) + '" cy="' + y(ponto.media) + '" r="4.5" fill="#fff"/>' +
                '<circle cx="' + x(i) + '" cy="' + y(ponto.media) + '" r="12" fill="transparent"/></g>';
        });

        svg += '</svg>';
        el.grafico.innerHTML = svg;

        const temDados = serie.some(function (ponto) { return ponto.media !== null; });
        el.mensagemGrafico.hidden = temDados;
    }

    function mostrarAtividades(atividades) {
        el.atividades.textContent = '';

        if (atividades.length === 0) {
            el.atividades.appendChild(criar('p', 'sem-atividades',
                'Nada por aqui ainda. Faça sua primeira avaliação!'));
            return;
        }

        atividades.forEach(function (a) {
            const item = criar('div', 'atividade');

            const icone = criar('div', 'atividade-icone');
            icone.innerHTML = a.tipo === 'avaliacao' ? ICONE_ESTRELA : ICONE_CORACAO;
            item.appendChild(icone);

            const info = criar('div', 'atividade-info');

            if (a.tipo === 'avaliacao') {
                info.appendChild(criar('strong', '', 'Avaliação de música'));
                info.appendChild(criar('span', '', '"' + a.musica + '" – ' + a.artista + ' — ' + a.nota + '★'));
            } else {
                info.appendChild(criar('strong', '', 'Música favoritada'));
                info.appendChild(criar('span', '', '"' + a.musica + '" – ' + a.artista));
            }

            info.appendChild(criar('small', '', haQuantoTempo(a.segundos)));
            item.appendChild(info);

            el.atividades.appendChild(item);
        });

        ajustarAtividades();
    }

    function ajustarAtividades() {
        const itens = Array.from(el.atividades.querySelectorAll('.atividade'));
        if (itens.length === 0) return;

        itens.forEach(function (item) { item.hidden = false; });

        const limitada = getComputedStyle(el.atividades).overflow === 'hidden';
        if (!limitada) return;

        for (let i = itens.length - 1; i > 0; i--) {
            if (el.atividades.scrollHeight <= el.atividades.clientHeight) break;
            itens[i].hidden = true;
        }
    }

    function mostrarMensagemPerfil(texto, sucesso) {
        el.mensagemPerfil.textContent = texto;
        el.mensagemPerfil.classList.toggle('sucesso', !!sucesso);
        el.mensagemPerfil.hidden = !texto;
    }

    function abrirEdicao() {
        el.campoNome.value = dados ? dados.usuario.nome : el.nome.textContent;
        fotoPendente = undefined;
        mostrarMensagemPerfil('');

        el.form.hidden = false;
        el.botaoEditar.setAttribute('aria-expanded', 'true');
        el.campoNome.focus();
    }

    function fecharEdicao() {
        el.form.hidden = true;
        el.botaoEditar.setAttribute('aria-expanded', 'false');

        fotoPendente = undefined;
        el.inputFoto.value = '';

        if (dados) mostrarPerfil(dados.usuario);
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
                canvas.width = TAMANHO_FOTO;
                canvas.height = TAMANHO_FOTO;

                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, TAMANHO_FOTO, TAMANHO_FOTO);

                const lado = Math.min(imagem.width, imagem.height);
                const origemX = (imagem.width - lado) / 2;
                const origemY = (imagem.height - lado) / 2;

                ctx.drawImage(imagem, origemX, origemY, lado, lado, 0, 0, TAMANHO_FOTO, TAMANHO_FOTO);

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

    el.botaoEditar.addEventListener('click', function () {
        if (el.form.hidden) {
            abrirEdicao();
        } else {
            fecharEdicao();
        }
    });

    el.botaoCancelar.addEventListener('click', fecharEdicao);

    el.botaoEscolherFoto.addEventListener('click', function () {
        el.inputFoto.click();
    });

    el.inputFoto.addEventListener('change', async function () {
        const arquivo = el.inputFoto.files[0];
        if (!arquivo) return;

        try {
            fotoPendente = await reduzirImagem(arquivo);
            el.foto.src = fotoPendente;
            mostrarMensagemPerfil('');
        } catch (erro) {
            mostrarMensagemPerfil(erro.message);
        }

        el.inputFoto.value = '';
    });

    el.botaoRemoverFoto.addEventListener('click', function () {
        fotoPendente = null;
        el.foto.src = FOTO_PADRAO;
        mostrarMensagemPerfil('');
    });

    el.form.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const nome = el.campoNome.value.trim();

        if (nome.length < 2) {
            mostrarMensagemPerfil('Digite um nome com pelo menos 2 caracteres.');
            return;
        }

        const corpo = { nome: nome };
        if (fotoPendente !== undefined) corpo.foto = fotoPendente;

        const botaoSalvar = el.form.querySelector('button[type="submit"]');
        botaoSalvar.disabled = true;

        const resultado = await V.chamarApi('/usuarios/perfil', {
            method: 'PUT',
            body: JSON.stringify(corpo)
        });

        botaoSalvar.disabled = false;

        if (!resultado.ok) {
            mostrarMensagemPerfil(resultado.erro);
            return;
        }

        dados.usuario.nome = resultado.dados.nome;
        if (fotoPendente !== undefined) dados.usuario.foto = fotoPendente;

        fecharEdicao();
        mostrarPerfil(dados.usuario);
    });

    async function carregar() {
        const resultado = await V.chamarApi('/dashboard');

        if (!resultado.ok) {
            el.atividades.textContent = '';
            el.atividades.appendChild(criar('p', 'sem-atividades', resultado.erro));
            return;
        }

        dados = resultado.dados;

        mostrarPerfil(dados.usuario);
        mostrarIndicadores(dados.kpis);
        mostrarJogo(dados.jogo);
        mostrarAtividades(dados.atividades);
        desenharGrafico();
    }

    let temporizador;

    function aoMudarTamanho() {
        clearTimeout(temporizador);

        temporizador = setTimeout(function () {
            desenharGrafico();
            ajustarAtividades();
        }, 120);
    }

    window.addEventListener('resize', aoMudarTamanho);

    if (window.ResizeObserver) {
        new ResizeObserver(aoMudarTamanho).observe(el.grafico);
    }

    carregar();
})();