/* =========================================
   V-SIDE | cadastro-musica.js
   Cadastra a MÚSICA no catálogo compartilhado:
   depois de cadastrada, todos os usuários poderão avaliá-la
   (cada pessoa vê só as PRÓPRIAS avaliações).
========================================= */

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

    // Tamanho (px) da capa depois de reduzida, antes de enviar ao servidor
    const TAMANHO_CAPA = 240;

    // capa escolhida ('data:image/...') ou null quando não há capa
    let capa = null;

    // Mostra a capa escolhida; sem capa, mostra a inicial do álbum (ou da música)
    function atualizarPrevia() {
        previa.src = capa || V.capaPlaceholder(campoAlbum.value || campoNome.value || '♪');
    }

    // Reduz a imagem para um quadrado de TAMANHO_CAPA px e devolve como texto
    // (mesma técnica da capa de playlist: fica leve e cabe no banco)
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

                // fundo branco (PNG transparente viraria preto ao salvar em JPEG)
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, TAMANHO_CAPA, TAMANHO_CAPA);

                // recorta o maior quadrado possível do centro da imagem
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
        inputCapa.click(); // abre a janela de escolher arquivo
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

        inputCapa.value = ''; // permite escolher o mesmo arquivo de novo
    });

    botaoRemoverCapa.addEventListener('click', function () {
        capa = null;
        atualizarPrevia();
    });

    // Enquanto não há capa, a inicial do álbum/música aparece no quadrado
    campoNome.addEventListener('input', atualizarPrevia);
    campoAlbum.addEventListener('input', atualizarPrevia);

    atualizarPrevia();

    form.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const titulo = document.getElementById('nomeMusica').value.trim();
        const artista = document.getElementById('artistaMusica').value.trim();
        const album = document.getElementById('albumMusica').value.trim();

        // O servidor valida tudo de novo; aqui só avisamos rápido
        if (!titulo || !artista) {
            alert('Informe o nome da música e o artista.');
            return;
        }

        botaoEnviar.disabled = true; // evita enviar duas vezes

        const resultado = await V.cadastrarMusica({
            titulo: titulo,
            artista: artista,
            album: album,
            capa: capa
        });

        botaoEnviar.disabled = false;

        // Cadastrou: leva a pessoa direto para avaliar a música que acabou de criar
        if (resultado.ok) {
            location.href = 'nova-avaliacao.html?musica=' + resultado.dados.id;
            return;
        }

        // Já existia (alguém cadastrou antes): em vez de só recusar, leva para avaliar a existente
        if (resultado.status === 409 && resultado.dados && resultado.dados.id) {
            alert('Essa música já estava no catálogo! Vamos avaliá-la.');
            location.href = 'nova-avaliacao.html?musica=' + resultado.dados.id;
            return;
        }

        alert(resultado.erro);
    });
})();