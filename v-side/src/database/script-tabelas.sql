CREATE DATABASE IF NOT EXISTS vside;
USE vside;

CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    foto MEDIUMTEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE musica (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NULL,
    titulo VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
    artista VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    album VARCHAR(150) NULL,
    capa  MEDIUMTEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_musica (titulo, artista),
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id) ON DELETE SET NULL
);

CREATE TABLE avaliacao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    fk_musica INT NULL,
    musica VARCHAR(150) NOT NULL,
    artista VARCHAR(100) NOT NULL,
    album VARCHAR(150),
    nota TINYINT NOT NULL,
    resenha TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_nota CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT fk_avaliacao_musica FOREIGN KEY (fk_musica) REFERENCES musica(id) ON DELETE SET NULL,
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE favorito (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    fk_avaliacao INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fk_usuario, fk_avaliacao),
    FOREIGN KEY (fk_usuario) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (fk_avaliacao) REFERENCES avaliacao(id) ON DELETE CASCADE
);