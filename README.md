# ✦ V-Side
### Música de outro ângulo.

<p align="center">
  <img src="assets/logos/logo-fundo-escuro-v2.svg" alt="Logo V-Side" width="280">
</p>

<p align="center">
  Um espaço para descobrir, compartilhar, avaliar e explorar o universo da música.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20desenvolvimento-B56B78?style=for-the-badge" alt="Status do projeto">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
</p>

---

## 🎧 Sobre o projeto

O **V-Side** é um projeto pessoal desenvolvido com a proposta de proporcionar uma experiência diferente para quem gosta de música.

A plataforma reúne funcionalidades que permitem aos usuários explorar artistas, conhecer álbuns, compartilhar opiniões e descobrir novas músicas.

Mais do que ouvir, a ideia é enxergar a música por diferentes perspectivas, incentivando a descoberta e a troca de experiências entre os apaixonados por esse universo.

## ✨ Funcionalidades

O projeto conta com diferentes páginas e recursos:

| Página | Descrição |
|---|---|
| 🏠 Início | Página principal com destaques e acessos às funcionalidades. |
| ℹ️ Sobre | Apresentação da proposta e identidade do V-Side. |
| 🎵 Playlists | Área de playlists e recomendações musicais. |
| ⭐ Avaliações | Espaço para publicar e consultar resenhas musicais. |
| ❤️ Favoritos | Lista de artistas favoritados pelo usuário. |
| 🎮 Jogar | Jogo de adivinhação musical baseado em trechos de músicas e dicas. |
| 📝 Nova avaliação | Formulário para cadastrar uma resenha musical. |
| ➕ Cadastro de música | Área para sugerir o cadastro de músicas, álbuns e artistas. |
| 📊 Dashboard | Área destinada ao acompanhamento de informações do usuário. |
| 🔐 Login e cadastro | Páginas de acesso e criação de conta. |

### 🎮 Jogo musical

Uma das funcionalidades especiais do V-Side é o jogo de adivinhação musical.

O objetivo é descobrir qual música está tocando no menor tempo possível, utilizando dicas progressivas:

1. Revelação do nome do álbum.
2. Revelação da capa do álbum.
3. Revelação do nome do artista.
4. Possibilidade de desistir e revelar a resposta.

A proposta é tornar a descoberta musical uma experiência interativa e divertida.

## 🎨 Identidade visual

A identidade do V-Side utiliza uma combinação de cores que busca transmitir personalidade, elegância e criatividade.

| Cor | Código | Aplicação |
|---|---|---|
| Azul-marinho | `#171E32` | Fundos e elementos principais. |
| Bege | `#E8D9C2` | Textos, botões e destaques. |
| Rosa queimado | `#B56B78` | Botões e elementos de destaque. |
| Vinho | `#722F37` | Cards e áreas de interação. |
| Off-white | `#F8F4EE` | Superfícies e textos claros. |

A interface utiliza tipografia serifada nos títulos e tipografia sem serifa nos textos e elementos de navegação.

## 🛠️ Tecnologias utilizadas

- **HTML5:** estruturação das páginas.
- **CSS3:** estilização, identidade visual e responsividade.
- **JavaScript:** interatividade e funcionalidades da plataforma.
- **LocalStorage:** armazenamento local de informações, como avaliações e favoritos, durante o desenvolvimento do protótipo.

## 📁 Organização do projeto

```text
V-Side/
│
├── index.html
├── sobre.html
├── favoritos.html
├── playlists.html
├── avaliacoes.html
├── nova-avaliacao.html
├── cadastro-musica.html
├── jogar.html
├── dashboard.html
├── login.html
├── cadastro.html
│
├── css/
│   ├── global.css
│   ├── index.css
│   ├── sobre.css
│   ├── favoritos.css
│   ├── playlists.css
│   ├── avaliacoes.css
│   ├── jogar.css
│   └── formularios.css
│
├── js/
│   ├── global.js
│   ├── favoritos.js
│   ├── avaliacoes.js
│   └── jogar.js
│
└── assets/
    │
    ├── logos/
    │   ├── logo-fundo-escuro-v2.svg
    │   ├── logo-slogan.svg
    │   └── monograma-fundo-escuro.svg
    │
    ├── banners/
    │
    ├── capas/
    │
    ├── icons/
    │
    └── musicas/
```

*Observação: a estrutura acima representa a organização prevista para o projeto. Algumas páginas, arquivos e pastas podem ser adicionados conforme o desenvolvimento avançar.*

## 🖼️ Personalizando imagens e logos

Para facilitar futuras alterações, os arquivos visuais ficam organizados dentro da pasta `assets`.

**1. Logo da header**

No HTML das páginas, procure por:

```html
<img
    class="logo-header"
    src="assets/logos/logo-fundo-escuro-v2.svg"
    alt="V-Side">
```

Para alterar, substitua o valor de `src` pelo caminho da nova logo.

**2. Logo do footer**

```html
<img
    class="footer-logo"
    src="assets/logos/logo-slogan.svg"
    alt="Logo V-Side">
```

**3. Ícone da aba do navegador (favicon)**

Dentro do `<head>`:

```html
<link
    rel="icon"
    href="assets/logos/monograma-fundo-escuro.svg">
```

**4. Banners das páginas**

Os banners são configurados nos arquivos CSS específicos de cada página.

Exemplo:

```css
/* BANNER DA PÁGINA JOGAR */
.banner-jogo {
    background-image:
        url("../assets/banners/banner-jogar.png");

    background-size: cover;
    background-position: center;
}
```

**5. Capas de álbuns e imagens de artistas**

Nas páginas que apresentam cards musicais, procure pela propriedade `src` das imagens:

```html
<img
    src="assets/capas/minha-capa.jpg"
    alt="Capa do álbum">
```

**6. Ícones das redes sociais**

Os ícones do Instagram, TikTok e Spotify podem ser substituídos no footer:

```html
<!-- ÍCONE DO INSTAGRAM -->
<img src="assets/icons/ic-instagram.png" alt="">

<!-- ÍCONE DO TIKTOK -->
<img src="assets/icons/ic-tiktok.png" alt="">

<!-- ÍCONE DO SPOTIFY -->
<img src="assets/icons/ic-spotify.png" alt="">
```

> **Dica:** sempre que substituir uma imagem, confira se o caminho informado corresponde exatamente ao nome e à extensão do arquivo.

## 🚀 Como executar o projeto

Você pode executar o V-Side localmente utilizando o Visual Studio Code.

1. Faça o download ou clone este repositório.
2. Abra a pasta do projeto no Visual Studio Code.
3. Instale a extensão **Live Server**, caso ainda não tenha.
4. Abra o arquivo `index.html`.
5. Clique em **Open with Live Server**.
6. O projeto será aberto automaticamente no navegador.

```bash
git clone URL_DO_SEU_REPOSITORIO
```

**Importante:** utilize um servidor local para executar o projeto, especialmente nas páginas que utilizam recursos JavaScript dependentes de carregamento de arquivos.

## 📱 Responsividade

O V-Side está sendo desenvolvido para proporcionar uma experiência agradável em diferentes dispositivos:

- 💻 Computadores e notebooks.
- 📱 Smartphones.
- 📲 Tablets.

Os layouts são adaptados utilizando CSS e media queries.

## 🔮 Próximas etapas

Algumas melhorias previstas para a evolução do projeto:

- [ ] Aprimorar o sistema de avaliações.
- [ ] Implementar autenticação de usuários.
- [ ] Integrar o armazenamento a um banco de dados.
- [ ] Desenvolver o ranking do jogo musical.
- [ ] Ampliar o catálogo de músicas, artistas e álbuns.
- [ ] Aprimorar o sistema de recomendações.
- [ ] Expandir a dashboard do usuário.
- [ ] Melhorar continuamente a responsividade.

## 👩‍💻 Desenvolvido por

Projeto pessoal desenvolvido com dedicação ao universo da música, tecnologia e desenvolvimento web.

**V-Side — Música de outro ângulo.**

---

<p align="center">
  Feito com ♡ e muita música.
</p>
