(function () {
    'use strict';

    const V = window.VSide;
    const form = document.getElementById('formCadastroCatalogo');

    if (!V || !form) return;
    if (!V.exigirLogin()) return;

    const botaoEnviar = document.getElementById('botaoEnviarCadastro');
    const previa = document.getElementById('previaCapaMusica');
    const inputCapa = document.getElementById('inputCapaMusica');
    const botaoEscolherCapa = document.getElementById('botaoEscolherCapa');
    const botaoRemoverCapa = document.getElementById('botaoRemoverCapa');
    const campoNome = document.getElementById('nomeMusica');
    const campoAlbum = document.getElementById('albumMusica');

    const TAMANHO_CAPA = 240;
    let capa = null;

    // mostra a capa escolhida ou a inicial
    function atualizarPrevia() {
        previa.src = capa || V.capaPlaceholder(campoAlbum.value || campoNome.value || '♪');
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

    botaoEscolherCapa.addEventListener('click', function () {
        inputCapa.click();
    });

    inputCapa.addEventListener('change', async function () {
        const arquivo = inputCapa.files[0];
        if (!arquivo) return;

        try {
            capa = await reduzirImagem(arquivo);
            atualizarPrevia();
        } catch (erro) {
            alert(erro.message);
        }

        inputCapa.value = '';
    });

    botaoRemoverCapa.addEventListener('click', function () {
        capa = null;
        atualizarPrevia();
    });

    // se o usuario nao colocar capa a inicial do nome do artista ou nome do album vira a capa
    campoNome.addEventListener('input', atualizarPrevia);
    campoAlbum.addEventListener('input', atualizarPrevia);

    atualizarPrevia();

    form.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const titulo = document.getElementById('nomeMusica').value.trim();
        const artista = document.getElementById('artistaMusica').value.trim();
        const album = document.getElementById('albumMusica').value.trim();

        if (!titulo || !artista) {
            alert('Informe o nome da música e o artista.');
            return;
        }

        botaoEnviar.disabled = true;

        const resultado = await V.cadastrarMusica({
            titulo: titulo,
            artista: artista,
            album: album,
            capa: capa
        });

        botaoEnviar.disabled = false;

        if (resultado.ok) {
            location.href = 'nova-avaliacao.html?musica=' + resultado.dados.id;
            return;
        }

        if (resultado.status === 409 && resultado.dados && resultado.dados.id) {
            alert('Essa música já estava no catálogo! Vamos avaliá-la.');
            location.href = 'nova-avaliacao.html?musica=' + resultado.dados.id;
            return;
        }

        alert(resultado.erro);
    });
})();