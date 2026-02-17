/**
 * MODELO DE USUARIO
 * Define la tabla de usuario en la base de datos
 * Almacena la informacion de los usuarios del sistema
 */

//Importar DB de sequelize
const { DataTypes } = require('sequelize');

//Importar bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

//Importar instacia de sequelize
const sequelize = require('../config/database');

/**
 * Definir el modelo de Usuario
 */
const Usuario = sequelize.define('Usuario', {
    //Campos de la tabla 
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre del usuario no puede estar vacio'
            },
            len: {
                args: [3, 100],
                msg: 'El nombre del usuario debe tener entre 3 y 100 caracteres'
            }
        }
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'El email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'El email del usuario no es valido'
            },
            notEmpty: {
                msg: 'El email del usuario no puede estar vacio'
            }
        }
    },

    password: {
        type: DataTypes.STRING(255), // cadena larga para hash
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La contraseña no puede estar vacia'
            },
            len: {
                args: [6, 255],
                msg: 'La contraseña del usuario debe tener entre 6 y 255 caracteres'
            }
        }
    },
    //rol del usuario (cliente, auxiliar o administrador)
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'),// tres roles disponibles
        allowNull: false,
        defaultValue: 'cliente', //por defecto el rol es cliente
        validate: {
            isIn: {
                args: [['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol debe ser cliente, auxiliar o administrador'
            }
        }
    },
    // telefono del usuario (opcional)
  telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,// es opcional
        validate: {
            is: {
                args: [/^\+?[\d\s\-\(\)]+$/],// solo numeros, espacios, guiones y parentesis 
                msg: 'El telefono solo puede contener numeros, espacios, guiones y parentesis'
            }
        }
    },
    
    /**
     * Direccion del usuario (opcional)
     */
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    /**
     * activo estado del usuario
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // por defecto el usuario esta activo
    }
}, {
    //opciones del modelo

    tableName: 'usuarios', 
    timestamps: true, //crea campos createdAt y updatedAt

    /**
     * scopes consultas predefinidas 
     */

    defaultScope: {
        /**
         * por defecto excluir el password de las consultas para mayor seguridad
         */
        attributes: { exclude: ['password'] }
    },

    scopes: {
        // scope para incluir el password cuando sea necesario (ejemplo para login)
        withPassword: {
            attributes: {}//incluye todos los atributos 
        }
    },

    /**
     * hooks funciones que se ejecutan en momentos especificos
     */
    hooks: {
        /**
         * beforeCreate se ejecuta antes de crear un nuevo usuario
         * encripta la contraseña antes de guardarla en la base de datos
         */

        beforeCreate: async (usuario, options) => {
            //generar un salt (semilla aleatoria) con factor de costo 10
            const salt = await bcrypt.genSalt(10);
            //encriptar la contraseña con salt
            usuario.password = await bcrypt.hash(usuario.password, salt);
        },
        /**
         * beforeUpdate se ejecuta antes de actualizar un usuario
         * encripta la contraseña si esta fue modificada
         */

        beforeUpdate: async (usuario) => {
            //Verificar si el campo password cambio 
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
    }
});

// METODOS DE INSTANCIA
/**
 * Metodo para comparar contraseña 
 * compara una contraseña em texto plano con el hash almacenado en la base de datos
 * 
 * @param {string} passwordIngresada - contraseña a comparar
 * @return {Promise<boolean>} - true si coinciden, false si no
 */
Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};


 /**  Metodo para obtener datos publicos del usuario (sin password)
 * @returns {Object} - objeto con los datos publicos del usuario
 */
Usuario.prototype.toJSON = function() {
    const valores = Object.assign({}, this.get());

    //eliminar modelo categoria
    delete valores.password; 
    return valores;
};
// Exportar el modelo de Usuario
module.exports = Usuario;