-- Cria o banco do V-Side e passa a usá-lo
CREATE DATABASE IF NOT EXISTS vside;
USE vside;

-- USUÁRIOS
-- senha tem 100 caracteres porque o hash do bcrypt tem 60 (o template usava 50 e cortaria o hash)
-- email é UNIQUE: o banco impede dois cadastros com o mesmo email
CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    foto MEDIUMTEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AVALIAÇÕES
-- fk_usuario liga a avaliação ao seu autor: é isso que garante que
-- cada pessoa só enxergue as próprias avaliações (WHERE fk_usuario = ...)
-- ON DELETE CASCADE: se o usuário for apagado, as avaliações dele vão junto
CREATE TABLE avaliacao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    musica VARCHAR(150) NOT NULL,
    artista VARCHAR(100) NOT NULL,
    album VARCHAR(150),
    nota TINYINT NOT NULL,
    resenha TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_nota CHECK (nota BETWEEN 1 AND 5),
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- FAVORITOS
-- Cada linha = "este usuário favoritou esta música (avaliação)".
-- UNIQUE (fk_usuario, fk_avaliacao): impede favoritar a mesma música duas vezes.
-- O artista que aparece em "Favoritos" vem do campo artista da avaliação.
CREATE TABLE favorito (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    fk_avaliacao INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fk_usuario, fk_avaliacao),
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (fk_avaliacao) REFERENCES avaliacao(id) ON DELETE CASCADE
);

-- PLAYLIST: pertence a um usuário. capa guarda a imagem como texto (igual à foto do perfil).
CREATE TABLE playlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    titulo VARCHAR(80) NOT NULL,
    descricao VARCHAR(300) NULL,
    capa MEDIUMTEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- se o usuário for apagado, as playlists dele vão junto
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- PLAYLIST_MUSICA: tabela de ligação (uma playlist tem várias avaliações;
-- uma avaliação pode estar em várias playlists).
-- PRIMARY KEY composta: impede a mesma avaliação duas vezes na mesma playlist.
-- posicao: guarda a ordem em que as músicas foram adicionadas.
CREATE TABLE playlist_musica (
    fk_playlist INT NOT NULL,
    fk_avaliacao INT NOT NULL,
    posicao INT NOT NULL,
    PRIMARY KEY (fk_playlist, fk_avaliacao),
    FOREIGN KEY (fk_playlist) REFERENCES playlist(id) ON DELETE CASCADE,
    FOREIGN KEY (fk_avaliacao) REFERENCES avaliacao(id) ON DELETE CASCADE
);