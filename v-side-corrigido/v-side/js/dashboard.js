
/* =========================================
   V-SIDE - DASHBOARD
========================================= */


/* =========================================
   1. CONFIGURAÇÕES
========================================= */

// ALTERE PARA O ENDEREÇO DA SUA API
const API_URL = "http://localhost:3333";

// ID DO USUÁRIO LOGADO
// ADAPTE A CHAVE AO PADRÃO UTILIZADO
// NO SEU LOGIN E NO SEU GLOBAL.JS.

const idUsuario = sessionStorage.getItem("ID_USUARIO");


/* =========================================
   2. ELEMENTOS HTML
========================================= */

const totalAvaliacoes =
    document.getElementById("totalAvaliacoes");

const mediaNotas =
    document.getElementById("mediaNotas");

const totalComentarios =
    document.getElementById("totalComentarios");

const totalPlaylists =
    document.getElementById("totalPlaylists");

const nomeUsuario =
    document.getElementById("nomeUsuario");

const fotoPerfil =
    document.getElementById("fotoPerfil");

const listaAtividades =
    document.getElementById("listaAtividades");

const mensagemGrafico =
    document.getElementById("mensagemGrafico");


/* =========================================
   3. GRÁFICO
========================================= */

let graficoAvaliacoes = null;


function criarGrafico(dados) {

    const contexto = document
        .getElementById("graficoAvaliacoes")
        .getContext("2d");

    if (graficoAvaliacoes) {
        graficoAvaliacoes.destroy();
    }

    const meses = [
        "Jan", "Fev", "Mar", "Abr",
        "Mai", "Jun", "Jul", "Ago",
        "Set", "Out", "Nov", "Dez"
    ];

    const valores = Array(12).fill(null);

    dados.forEach(item => {

        // mês deve ser um número de 1 a 12
        valores[Number(item.mes) - 1] =
            Number(item.media);

    });

    const possuiAvaliacoes =
        valores.some(valor => valor !== null);

    mensagemGrafico.hidden = possuiAvaliacoes;

    graficoAvaliacoes = new Chart(contexto, {

        type: "line",

        data: {

            labels: meses,

            datasets: [{

                label: "Média das notas",

                data: valores,

                borderColor: "#F8F4EE",

                backgroundColor: "rgba(248,244,238,0.12)",

                borderWidth: 3,

                pointBackgroundColor: "#F8F4EE",

                pointRadius: 3,

                tension: 0.25,

                spanGaps: false,

                fill: false

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                y: {

                    min: 1,

                    max: 5,

                    ticks: {
                        color: "#F8F4EE",
                        stepSize: 1
                    },

                    grid: {
                        color: "rgba(255,255,255,0.35)"
                    }

                },

                x: {

                    ticks: {
                        color: "#F8F4EE"
                    },

                    grid: {
                        display: false
                    }

                }

            }

        }

    });

}


/* =========================================
   4. CARREGAR INFORMAÇÕES DO USUÁRIO
========================================= */

async function carregarPerfil() {

    try {

        const resposta = await fetch(
            `${API_URL}/dashboard/perfil/${idUsuario}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao carregar perfil.");
        }

        const dados = await resposta.json();

        nomeUsuario.textContent = dados.nome;

        // Se não houver foto, utiliza o avatar padrão.
        fotoPerfil.src =
            dados.foto || "assets/images/avatar-padrao.png";

    } catch (erro) {

        console.error(erro);

    }

}


/* =========================================
   5. CARREGAR KPIs
========================================= */

async function carregarIndicadores() {

    try {

        const resposta = await fetch(
            `${API_URL}/dashboard/resumo/${idUsuario}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao carregar indicadores.");
        }

        const dados = await resposta.json();

        totalAvaliacoes.textContent =
            dados.totalAvaliacoes ?? 0;

        mediaNotas.textContent =
            Number(dados.mediaNotas ?? 0).toFixed(1);

        totalComentarios.textContent =
            dados.totalComentarios ?? 0;

        totalPlaylists.textContent =
            dados.totalPlaylists ?? 0;

    } catch (erro) {

        console.error(erro);

    }

}


/* =========================================
   6. CARREGAR GRÁFICO
========================================= */

async function carregarAvaliacoes() {

    try {

        const resposta = await fetch(
            `${API_URL}/dashboard/avaliacoes-mensais/${idUsuario}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao carregar avaliações.");
        }

        const dados = await resposta.json();

        criarGrafico(dados);

    } catch (erro) {

        console.error(erro);

        mensagemGrafico.hidden = false;

    }

}


/* =========================================
   7. CARREGAR ATIVIDADES RECENTES
========================================= */

async function carregarAtividades() {

    try {

        const resposta = await fetch(
            `${API_URL}/dashboard/atividades/${idUsuario}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao carregar atividades.");
        }

        const atividades = await resposta.json();

        listaAtividades.innerHTML = "";

        if (atividades.length === 0) {

            listaAtividades.innerHTML = `
                <p class="sem-atividades">
                    Você ainda não possui atividades.
                </p>
            `;

            return;

        }

        atividades.forEach(atividade => {

            let icone = "●";

            if (atividade.tipo === "avaliacao") {
                icone = "★";
            }

            if (atividade.tipo === "playlist") {
                icone = "♫";
            }

            if (atividade.tipo === "comentario") {
                icone = "●";
            }

            const elemento = document.createElement("div");

            elemento.className = "atividade";

            const iconeElemento =
                document.createElement("div");

            iconeElemento.className = "atividade-icone";
            iconeElemento.textContent = icone;

            const informacoes =
                document.createElement("div");

            informacoes.className = "atividade-info";

            const titulo =
                document.createElement("strong");

            titulo.textContent = atividade.titulo;

            const descricao =
                document.createElement("span");

            descricao.textContent = atividade.descricao;

            const data =
                document.createElement("small");

            data.textContent = atividade.data
                ? new Date(atividade.data).toLocaleDateString("pt-BR")
                : "";

            informacoes.append(titulo, descricao, data);

            elemento.append(iconeElemento, informacoes);

            listaAtividades.appendChild(elemento);

        });

    } catch (erro) {

        console.error(erro);

        listaAtividades.innerHTML = `
            <p class="sem-atividades">
                Não foi possível carregar suas atividades.
            </p>
        `;

    }

}


/* =========================================
   8. INICIALIZAR DASHBOARD
========================================= */

async function iniciarDashboard() {

    if (!idUsuario) {

        alert("Faça login para acessar sua dashboard.");

        window.location.href = "login.html";

        return;

    }

    await Promise.all([

        carregarPerfil(),

        carregarIndicadores(),

        carregarAvaliacoes(),

        carregarAtividades()

    ]);

}


document.addEventListener(
    "DOMContentLoaded",
    iniciarDashboard
);
