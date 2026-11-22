// Escolha do ambiente: deixe só UMA das duas linhas abaixo ativa.
// var ambiente_processo = 'producao';
var ambiente_processo = 'desenvolvimento';

var caminho_env = ambiente_processo === 'producao' ? '.env': '.env.dev';
// Acima, temos o uso do operador ternário para definir o caminho do arquivo .env
// A sintaxe do operador ternário é: condição ? valor_se_verdadeiro : valor_se_falso

require("dotenv").config({path: caminho_env});

var express = require("express");
var cors = require("cors");
var path = require("path");
var session = require("express-session"); // sessão do usuario
var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

// chama a biblioteca express pelo nome app
var app = express();

//rotas do site
var usuarioRouter = require("./src/routes/usuarios");
var avaliacaoRouter = require("./src/routes/avaliacoes");
var favoritoRouter = require("./src/routes/favoritos");
var dashboardRouter = require("./src/routes/dashboard");
var playlistRouter = require("./src/routes/playlists");
var jogoRouter = require('./src/routes/jogo');
var musicaRouter = require('./src/routes/musicas');

app.use(express.json({limit: "1mb"}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

//guarda o cookie do usuario
app.use(session({
    secret: process.env.SESSION_SECRET || "troque-este-segredo-no-env", // assina o cookie
    resave: false,  
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use("/usuarios", usuarioRouter);
app.use("/avaliacoes", avaliacaoRouter);
app.use("/favoritos", favoritoRouter);
app.use("/dashboard", dashboardRouter);
app.use("/playlists", playlistRouter);
app.use("/jogo", jogoRouter);
app.use("/musicas", musicaRouter);

// liga o servidor (mudei a mensagem do webdataviz)
app.listen(PORTA_APP, function () {
    console.log(`\n    V-Side no ar! Acesse: http://${HOST_APP}:${PORTA_APP}`);
    console.log(`    Ambiente: ${process.env.AMBIENTE_PROCESSO}`);
    console.log(`    (desenvolvimento = banco local | producao = banco remoto)\n`);
});