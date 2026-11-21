CREATE DATABASE IF NOT EXISTS vside;
USE vside;

CREATE TABLE IF NOT EXISTS usuario (
  id         INT          NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(50)  NOT NULL,
  email      VARCHAR(100) NOT NULL,
  senha      VARCHAR(100) NOT NULL,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  foto       MEDIUMTEXT   NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
);

CREATE TABLE IF NOT EXISTS musica (
  id            INT               NOT NULL AUTO_INCREMENT,
  fk_usuario    INT               NULL,
  titulo        VARCHAR(150)      NOT NULL,
  artista       VARCHAR(100)      NOT NULL,
  album         VARCHAR(150)      NULL,
  duracao_seg   SMALLINT UNSIGNED NULL,
  link_spotify  VARCHAR(300)      NULL,
  criado_em     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  capa          MEDIUMTEXT        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_musica (titulo, artista),
  KEY fk_usuario (fk_usuario),
  CONSTRAINT musica_ibfk_1
    FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS avaliacao (
  id          INT          NOT NULL AUTO_INCREMENT,
  fk_usuario  INT          NOT NULL,
  fk_musica   INT          NULL,
  musica      VARCHAR(150) NOT NULL,
  artista     VARCHAR(100) NOT NULL,
  album       VARCHAR(150) NULL,
  nota        TINYINT      NOT NULL,
  resenha     TEXT         NOT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_usuario (fk_usuario),
  KEY fk_avaliacao_musica (fk_musica),
  CONSTRAINT avaliacao_ibfk_1
    FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_musica
    FOREIGN KEY (fk_musica) REFERENCES musica (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS favorito (
  id            INT      NOT NULL AUTO_INCREMENT,
  fk_usuario    INT      NOT NULL,
  fk_avaliacao  INT      NOT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY fk_usuario (fk_usuario, fk_avaliacao),
  KEY fk_avaliacao (fk_avaliacao),
  CONSTRAINT favorito_ibfk_1
    FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
    ON DELETE CASCADE,
  CONSTRAINT favorito_ibfk_2
    FOREIGN KEY (fk_avaliacao) REFERENCES avaliacao (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partida (
  id          INT        NOT NULL AUTO_INCREMENT,
  fk_usuario  INT        NOT NULL,
  acertou     TINYINT(1) NOT NULL,
  tentativas  TINYINT    NOT NULL,
  criado_em   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_usuario (fk_usuario),
  CONSTRAINT partida_ibfk_1
    FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist (
  id             INT          NOT NULL AUTO_INCREMENT,
  fk_usuario     INT          NOT NULL,
  titulo         VARCHAR(80)  NOT NULL,
  descricao      VARCHAR(300) NULL,
  capa           MEDIUMTEXT   NULL,
  criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_usuario (fk_usuario),
  CONSTRAINT playlist_ibfk_1
    FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist_musica (
  fk_playlist   INT NOT NULL,
  fk_avaliacao  INT NOT NULL,
  posicao       INT NOT NULL,
  PRIMARY KEY (fk_playlist, fk_avaliacao),
  KEY fk_avaliacao (fk_avaliacao),
  CONSTRAINT playlist_musica_ibfk_1
    FOREIGN KEY (fk_playlist) REFERENCES playlist (id)
    ON DELETE CASCADE,
  CONSTRAINT playlist_musica_ibfk_2
    FOREIGN KEY (fk_avaliacao) REFERENCES avaliacao (id)
    ON DELETE CASCADE
);