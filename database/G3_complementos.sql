-- Complemento del equipo (Grupo 3), no forma parte del script institucional
-- (database/script.sql). Se ejecuta despues de ese script y reune los dos
-- aportes del grupo en un solo archivo:
--
--   1) La tabla G3_logs, para la auditoria que pide el RF07. Se prefija con
--      G3_ para distinguirla del modelo institucional a simple vista.
--   2) El rol Administrador y un usuario de prueba para ese rol: el
--      documento de analisis define 4 actores (Administrador, Coordinador,
--      Docente, Estudiante), pero script.sql solo trae 3 roles.
--
 

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
