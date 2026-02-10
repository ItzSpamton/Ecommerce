/**
 * Configuracion de subida de archivos 
 * 
 * Multer es un middleware para manejar subida de archivos 
 * Este archivo configuracion MUlter como y donde se guardan las imagenes subidas
 */

//Importar multer para manejar la subida de archivos
const multer = require('multer');

//Importar path para manejar rutas de archivos
const path = require('path');

//Importar fs para verificar /crear directorios
const fs = require('fs');

//Importar dotenv para variables de entorno
require('dotenv').config();

//Obtener la ruta donde se guardan los archivos 
const uploadPath = process.env.UPLOAD_DIR || './uploads';

//Verificar si la carpeta uploads existe, si no, crearla
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath} creada`);
}

/**
 * Configuracion de almacenamiento de Multer
 * Define donde y como se guardan los archivos
 */

const storage = multer.diskStorage({
    /**Destination: Define la carpeta destino donde se guardara el archivo 
     * 
     * @param {Object} req - El objeto de solicitud HTTP
     * @param {Object} file - El archivo subido
     * @param {Function} cb - Callback que se llama con (error, destination)
    */
    destination: function (req, file, cb) {
        //cb(null, ruta) -> sin errro, ruta = carpeTA destino
        cb(null, uploadPath);
    },

    /**filename: Define el nombre del archivo guardado
     * formato: timestamp-originalname para evitar colisiones
     * 
     * @param {Object} req - El objeto de solicitud HTTP
     * @param {Object} file - El archivo subido
     * @param {Function} cb - Callback que se llama con (error, filename)
    */
    filename: function (req, file, cb) {
        //genera nombre unico con timestamp + nombre original
        //date.now() genera un timestamp unico
        //path.extname() extrae la extension del archivo (.jpg, .png, etc)
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

/**
 * Filtro para validar el tipo de archivo
 * solo permite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req - El objeto de solicitud HTTP
 * @param {Object} file - El archivo subido
 * @param {Function} cb - Callback que se llama con (error, acceptFile)
 */
   