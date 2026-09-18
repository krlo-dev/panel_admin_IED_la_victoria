create table logs(
    id int,
    accion varchar(40) not null,
    entidad varchar(40) not null,
    id_entidad varchar(40),
    mistake varchar(255) not null,
    fecha datetime not null default current_timestamp,
    id_usuario int not null,
    constraint pk_logs primary key(id),
    constraint fk_logs_usuario foreign key(id_usuario)
    references usuario(id)
);
