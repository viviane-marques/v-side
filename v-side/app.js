// Escolha do ambiente: deixe só UMA das duas linhas abaixo ativa.
// var ambiente_processo = 'producao';
var ambiente_processo = 'desenvolvimento';

// Operador ternário: se for produção usa o arquivo .env, senão usa o .env.dev
var caminho_env = ambiente_processo === 'producao' ? '.env': '.env.dev';

// Lê o arquivo escolhido e coloca os valores em process.env
require("dotenv").config({path: caminho_env});

var express = require("express");
var cors = require("cors");
var path = require("path");
var session = require("express-session");

var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

var app = express();

// Rotas do V-Side (cada arquivo cuida de um recurso)
var usuarioRouter = require("./src/routes/usuarios");
var avaliacaoRouter = require("./src/routes/avaliacoes");
var favoritoRouter = require("./src/routes/favoritos");
var dashboardRouter = require("./src/routes/dashboard");
var testeRouter = require("./src/routes/teste"); // provisória: apague no fim do projeto

app.use(express.json({limit: "1mb"})); // entende JSON enviado pelo fetch
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); // serve o site (pasta public)
app.use(cors());

// SESSÃO: depois do login, o servidor guarda "quem é você" e entrega ao navegador
// um cookie com um código. Em cada requisição o cookie volta, e o servidor
// descobre o usuário SEM confiar em nada que o navegador diga sobre ele.
app.use(session({
    secret: process.env.SESSION_SECRET || "troque-este-segredo-no-env", // assina o cookie
    resave: false,             // não regrava a sessão se nada mudou
    saveUninitialized: false,  // não cria sessão para quem não logou
    cookie: {
        httpOnly: true,                    // o JavaScript do navegador não consegue ler o cookie
        sameSite: "lax",                   // o cookie não vai em requisições de outros sites
        maxAge: 1000 * 60 * 60 * 24 * 7    // dura 7 dias
    }
}));

app.use("/usuarios", usuarioRouter);
app.use("/avaliacoes", avaliacaoRouter);
app.use("/favoritos", favoritoRouter);
app.use("/dashboard", dashboardRouter);
app.use("/teste", testeRouter);

app.listen(PORTA_APP, function () {
    console.log(`\n    V-Side no ar! Acesse: http://${HOST_APP}:${PORTA_APP}`);
    console.log(`    Ambiente: ${process.env.AMBIENTE_PROCESSO}`);
    console.log(`    (desenvolvimento = banco local | producao = banco remoto)\n`);
});