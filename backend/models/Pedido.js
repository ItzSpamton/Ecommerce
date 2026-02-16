/**
 * MODELO DE PEDIDO
 * Define la tabla de pedido en la base de datos
 * Almacena la informacion de los pedidos realizados por los usuarios 
 */

//Importar DB de sequelize
const { DataTypes } = require('sequelize');

//Importar instacia de sequelize
const sequelize = require('../config/database');
const e = require('express');

/**
 * Definir el modelo de Carrito
 */
const Pedido = sequelize.define('Pedido', {
    //Campos de la tabla 
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    //UsuarioId ID del usuario dueño del carrrito
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', 
        onDelete: 'RESTRICT', //no se puede eliminar un usuario con pedidos
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },

    //total monto total del pedido
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'el precio debe ser un numero decimal valido'
            },
            min: {
                arg: [0],
                msg: 'el precio no puede der negativo'
            }
        }
    },

    /**
     * Estado - estado del pedido
     * valores posibles:
     * pendiente: pedido creado, esperando pago
     * pagado: pedido pagado, en preparacion
     * enviado: pedido enviado, en camino
     * cancelado: pedido cancelado
     */
    estado: {
        type: DataTypes.ENUM('pendiente', 'pagado', 'enviado', 'cancelado'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [['pendiente', 'pagado', 'enviado', 'cancelado']],
                msg: 'El estado debe ser pendiente, pagado, enviado o cancelado'
            }
        }
    },

    //direccion de envio del pedido 
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La direccion de envio es obligatoria'
            }
        }
    },

    //telefono de contacto para el envio
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono de contacto es obligatorio'
            }
        }
    },

    //notas adicionales del pedido(opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //ProductoId ID del producto del usuario dueño del carrrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE', //Si se elimina usuario, se elimina el producto
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    //Cantidad de este producto en el carrito
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },

    /**
     * Precio Unitario del producto en el carrito
     * se guarda para mantener el precio aunque el producto cambie de precio 
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio unitario debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio unitario debe ser al menos 0'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    },
}, {
    //Opciones del modelo
    tableName: 'carritos',
    timestamps: true,
    //Indices para mejorar las busquedas
    indexes: [
        {
            //Indice para buscar carritos por usuario
            fields: ['usuarioId']
        },
        {
            //Indice compuesto: un uusuario no puede tener el mismo producto duplicado en su carrito
            unique: true,
            fields: ['usuarioId, productoId'],
            name: 'usuario_producto_unique'
        }
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate: se ejecuta antes de crear un item en el carrito
         * valida q este esta activo y tenga stock suficiente 
         */
        beforeCreate: async (itemCarrito) => {
            const Categoria = require('./Producto');

            //Buscar el producto
            const producto = await Producto.findByPk(itemCarrito.productoId);

            if (!producto) {
                throw new Error('El producto no existe');
            }

            if (!producto.activo) {
                throw new Error('No se puede agregar un producto inactivo al carrito');
            }

            if (!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error(`Stock insuficiente, solo hay ${producto.stock} unidades disponibles`);
            }
            //guardar el precio unitario
            itemCarrito.precioUnitario = producto.precio;
        },


        /**
         * beforeUpdate: se ejecuta antes de actualziar una carrito
         * valida que haya stock suficiente so aumenta la cantidad
         */

        beforeUpdate: async (itemCarrito) => {
             
            if (itemCarrito.changed('cantidad')) {
                const Producto = require('./Producto');
                const producto = await Producto.findByPk(itemCarrito.productoId);

                if (!producto) {
                    throw new Error('El producto no existe');
                }

                if ((!producto.hayStock(itemCarrito.cantidad))) {
                    throw new Error(`Stock insuficiente, solo hay ${producto.stock} unidades disponibles`);
                }
            }
        }
    },
});
// MEOTODOS DE INSTANCIA 
/**
 * Metodo para calcular el subtotal de este item 
 * 
 * @return {number} - subtotal (precio * cantidad)
 */
Carrito.prototype.calcularSubtotal = function() {
    return parseFloat(this.precioUnitario) * this.cantidad; 
};

/**Metodo para actualizar la cantidad de un producto en el carrito
 * 
 * @param {number} nuevaCantidad - nueva cantidad
 * @returns {Promise} - Item actualizado
**/
Carrito.prototype.actualizarCantidad = async function (nuevaCantidad) {
    const Producto = require('./Producto');

    if (producto.hayStock(nuevaCantidad)) {
        this.cantidad = nuevaCantidad;   
        throw new Error(`Stock insuficiente solo hay ${producto.stock} unidades disponibles`);
}
    this.cantidad = nuevaCantidad;
    return await this.save();

};

/**
 * Metodo cpara obtener cel carrito completo de un usuario
 * incluye informacion de los productos
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<Array>} - items del carrito con productos
 */
Carrito.obtenerCarritoUsuario = async function (usuarioId) {
    const Producto = require('./Producto');

    return await this.findAll({
        where: { usuarioId },
        include: {
            model: Producto,
            as: 'producto'
        },
        order: [['createdAt', 'DESC']]
    })
};

/**
 * Metodo para calcular el total del carrito de un usuario
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<number>} - total del carrito
 */
Carrito.obtenerTotalCarrito = async function (usuarioId) {
    const items = await this.findAll({
        where: { usuarioId }
    });
    for (const item of items) {
        total += item.calcularSubtotal();
    }
    return total;
};

/**
 * Metodo para vaciar el carrito de un usuario 
 * util despues de realizar un pedido
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<number>} - cantidad de items eliminadosx|
 */
Carrito.vaciarCarrito = async function (usuarioId) {
    return await this.destroy({
        where: { usuarioId }
    });
};
//Exportar modelo
module.exports = Carrito;
