/* =========================================
   V-SIDE | nova-avaliacao.js
   Envia a avaliação para a API, que salva
   no MySQL em nome do usuário logado
========================================= */

(function () {
    'use strict';

    const V = window.VSide;
    const form = document.getElementById('formNovaAvaliacao');

    if (!V || !form) return;
    if (!V.exigirLogin()) return;

    const campoResenha = document.getElementById('textoResenha');

    // Limpa o aviso de validação quando a pessoa volta a digitar
    campoResenha.addEventListener('input', function () {
        campoResenha.setCustomValidity('');
    });

    form.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const resenha = campoResenha.value.trim();

        // "required" aceita só espaços, então conferimos aqui
        if (!resenha) {
            campoResenha.setCustomValidity('Escreva sua resenha.');
            campoResenha.reportValidity();
            return;
        }

        const nota = form.querySelector('input[name="nota"]:checked');
        const botao = form.querySelector('button[type="submit"]');

        botao.disabled = true; // evita enviar duas vezes

        const resultado = await V.salvarAvaliacao({
            musica: document.getElementById('nomeMusica').value.trim(),
            artista: document.getElementById('nomeArtista').value.trim(),
            album: document.getElementById('nomeAlbum').value.trim(),
            nota: Number(nota.value),
            resenha: resenha
        });

        botao.disabled = false;

        if (!resultado.ok) {
            alert(resultado.erro);
            return;
        }

        location.href = 'avaliacoes.html';
    });
})();