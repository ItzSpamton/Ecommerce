/**
 * Script de inicialización de la base de datos.
 * este script crea la base de datos si no existe 
 * dene ejecutarse una sola vez antes de iniciar el sv
 */

//Importar mysql2 para la conexion directa
const mysql = require('mysql2/promise');

//Importar dotenv para cargar las variables de entorno
require('dotenv').config();

//Funcion para crear la base de datos
const createDatabase = async () => {
    let connection;

    try {
        //Conectarse al servidor MySQL sin especificar la base de datos
        console.log('Iniciando creacion de la base de datos...\n');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

         console.log('Conexión a MySQL establecida.\n');

         //Crear la base de datos si no existe
         const dbName = process.env.DB_NAME || 'ecommerce_db';
         console.log(`Creando la base de datos ${dbName}...`
         );

         await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` creada/verificada exitosamente;\n`);

         //Cerrar la conexión
            await connection.end();

            console.log('Proceso completado ahora puedes iniciar el servidor con: npm start\n');
    } catch (error) {
        console.error('Error al crear la base de datos:', error.message);
        console.error(' Verifica que');
        console.error('  1. XAMPP este corriendo');
        console.error('  2. MySQL este iniciado en XAMPP');
        console.error('  3. Las credenciales en el archivo .env sean correctas\n');

        if (connection) {
            await connection.end();
        }

        process.exit(1);
    }
};

//Ejecutar la funcion
createDatabase();