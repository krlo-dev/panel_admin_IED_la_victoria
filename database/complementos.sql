-- Complemento del equipo (no forma parte del script institucional).
-- El documento de analisis define 4 actores (Administrador, Coordinador,
-- Docente, Estudiante), pero el script.sql compartido solo trae 3 roles.
-- Este archivo agrega el rol Administrador y un usuario de prueba para
-- poder iniciar sesion con ese rol.
insert into rol(id, nombre) values (4, 'Administrador');

insert into usuario(
    id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol
) values (
    2, '10000002', 'admin', 'Temporal2026*', 'Administrador', 'Sistema',
    'admin@iedlavictoria.edu.co', 1, 4
);
