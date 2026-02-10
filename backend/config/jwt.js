/**
 * CONFIGUTACION DE JWT
 * Este archivo contiene funciones para generar y verificar tokens JWT
 * Los JWT se usan para autenticar a los usuarios sin necesidad de sesiones
 */

//Inportar jsonwebtoken para manejar los tokens JWT
const jwt = require('jsonwebtoken');

//Importar dotenv para acceder a las variables de entorno
require('dotenv').config();

/**
 * Generar un token JWT para un usuario
 * @param {Object} payload - Datos que se incluirán en el token (id, email, rol)
 * @return {string} - El token JWT generado
 */

const generateToken = (payload) => {
    try {
        //jwt.sting() crea y firma un token
        //Parametros:
        // 1. payload: datos a incluir en el token
        // 2. secret: clave secreta para firmar el token (desde .env)
        // 3. options: opciones adicionales (ej. expiración)
        const token = jwt.sign(
            payload, //Datos de usuario 
            process.env.JWT_SECRET, //Clave secreta desde .env
            { expiresIn: process.env.JWT_EXPIRES_IN } //Tiempo de expiracion del token
        );

        return token;
    } catch (error) {
        console.error('Error al generar el token JWT:', error.message);
        throw new Error('No se pudo generar el token');
    }
};
const verifyToken = (token) => {
    try {
        //jwt.verify() verifica la firma del token y decodifica
        //Parametros:
        // 1. token: el token JWT a verificar
        // 2. secret: la misma clave secreta usada para firmar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded; 
        } catch (error) {

            //Difrentes errores
            if (error.name === 'TokenExpiredError') {
                throw new Error('El token ha expirado');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token inválido');
            } else { 
                throw new Error('Error al verificar el token');
            }
        }

};

/**
 * Verificar si un token JWT es válido
 * @param {string} token - El token JWT a verificar
 * @return {Object} - Datos decodificados si el token es válido
 * @throws {Error} - Si el token es inválido o ha expirado
 */

const extractToken = (tokenHeader) => {
    //Verificar que el header exista y empieza con "Bearer "
    if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
        //Extraer solo el token (quitar "Bearer ")
        return tokenHeader.substring(7);
    }
    return null; //Si no hay token o no comienza con "Bearer "
};

//exportar las funciones para usarlas en otros archivos 
module.exports = {
    generateToken,
    verifyToken,
    extractToken
};