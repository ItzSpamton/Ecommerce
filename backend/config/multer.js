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
 const fileFilter = (req, file, cb) => {
    //Tipos de archivos permitidos para imagenes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    //verificar si el tipo de archivo esta en la lista de permitidos
    if (allowedTypes.includes(file.mimetype)) {
        //cb(null, true); -> aceptar el archivo
        cb(null, true);
    } else {
        //cb(error) -> rechazar el archivo con un error
        cb(new Error('Archivo no permitido. Solo se permiten imagenes (jpeg, jpg, png, gif).'), false);
    }
};
/** configurar multer con las opciones definidas 
 * 
*/
const upload = multer({
    storage: storage, //configuracion de almacenamiento
    fileFilter: fileFilter, //filtro de tipo de archivo
    limits: {
        //limite de tamaño del archivo en bytes
        //por defecto 5MB (5 * 1024 * 1024 bytes)
        filesize: parseInt(process.env.MAX_FILE_SIZE) || 524288000
    }          
});

/**
 *  Funcion para eliminar el archivo del servidor 
 * Util cuando se actualiza o eliminar el producto 
 * 
 * @param {string} filename - El nombre del archivo a eliminar
 * @returns {Boolean} - True si se elimino, false si hubo error
 */

const deleteFile = (filename) => {
    try {
        //Construir la ruta completa del archivo
        const filePath = path.join(uploadPath, filename);

        //Verificar si el archivo existe antes de eliminarlo
        if (fs.existsSync(filePath)) {
            console.log(`Archivo eliminado: ${filename}`);
            return true;
        } else {
            console.log(`Archivo no encontrado: ${filename}`);
            return false;
        }
    } catch (error) {
        console.error(`Error al eliminar el archivo: ${error.message}`);
        return false;
    }   
};

//Exportar configuracion de multer y la funcion de eliminar archivos
module.exports = {
    upload,
    deleteFile
};