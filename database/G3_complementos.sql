-- Complemento del equipo (Grupo 3), no forma parte del script institucional
-- (database/script.sql). Se ejecuta despues de ese script y reune los tres
-- aportes del grupo en un solo archivo:
--
--   1) La tabla G3_logs, para la auditoria que pide el RF07. Se prefija con
--      G3_ para distinguirla del modelo institucional a simple vista.
--   2) El rol Administrador y un usuario de prueba para ese rol: el
--      documento de analisis define 4 actores (Administrador, Coordinador,
--      Docente, Estudiante), pero script.sql solo trae 3 roles.
--   3) El cifrado con bcrypt de las contrasenas de prueba. script.sql las
--      trae en texto plano ('Temporal2026*') porque asi viene el script del
--      curso; el UPDATE de mas abajo las deja ya cifradas al momento de
--      crear la base, para no depender de correr un comando aparte
--      (server/scripts/cifrar-contrasenas.js) despues de levantar el
--      proyecto. Ese script queda solo como respaldo, por si alguna vez se
--      inserta una contrasena en texto plano a mano.

create table G3_logs(
    id int,
    accion varchar(40) not null,
    entidad varchar(40) not null,
    id_entidad varchar(40),
    mistake varchar(255) not null,
    fecha datetime not null default current_timestamp,
    id_usuario int not null,
    constraint pk_G3_logs primary key(id),
    constraint fk_G3_logs_usuario foreign key(id_usuario)
    references usuario(id)
);

insert into rol(id, nombre) values (4, 'Administrador');

insert into usuario(
    id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol
) values (
    2, '10000002', 'admin', 'Temporal2026*', 'Administrador', 'Sistema',
    'admin@iedlavictoria.edu.co', 1, 4
);

-- Cifra con bcrypt (10 rondas, igual que BCRYPT_ROUNDS por defecto en
-- server/src/config/env.js) todas las contrasenas de prueba que hasta aqui
-- siguen en texto plano: las de script.sql y la del admin de arriba. El
-- hash corresponde a 'Temporal2026*'; las credenciales de ingreso no cambian.
update usuario
set contrasena = '$2a$10$ZcAobwBjETvL9QZbnzG6LuBeMLAQ9mOYu.1z3tSOXzV.8HmLWL4c6'
where contrasena = 'Temporal2026*';
