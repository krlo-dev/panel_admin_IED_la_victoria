set -e

BD="${BD_NOMBRE:-bdiedlavictoria}"

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" --database="${BD}" < /seed/logs.sql

if [ -n "${MYSQL_USER}" ]; then
  mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e \
    "GRANT ALL PRIVILEGES ON \`${BD}\`.* TO '${MYSQL_USER}'@'%'; FLUSH PRIVILEGES;"
fi

echo "Base ${BD} inicializada con script.sql y logs.sql"
