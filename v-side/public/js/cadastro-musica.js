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

    form.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const titulo = document.getElementById('nomeMusica').value.trim();
        const artista = document.getElementById('artistaMusica').value.trim();
        const album = document.getElementById('albumMusica').value.trim();
        const duracao = document.getElementById('duracaoMusica').value.trim();
        const linkSpotify = document.getElementById('linkMusica').value.trim();

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
            duracao: duracao,
            linkSpotify: linkSpotify
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