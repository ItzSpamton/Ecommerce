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

    //fecha de pago
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },

    //fecha de envio
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true
    },

    //fecha de entrega
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true
    },


}, {
    //Opciones del modelo
    tableName: 'pedidos',
    timestamps: true,
    //Indices para mejorar las busquedas
    indexes: [
        {
            //Indice para buscar carrito por usuario
            fields: ['usuarioId']
        },

        {
            //Indice para buscar pedido por usuario
            fields: ['estado']
        },

        {
            //Indice para buscar pedido por fecha
            fields: ['createdAt']
        },
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate: se ejecuta antes de crear un item en el carrito
         * valida q este esta activo y tenga stock suficiente 
         */
        /**beforeCreate: async (itemCarrito) => {
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
        },*/


        /**
         * afterUpdate: se ejecuta despues de actualizar una carrito
         * actualiza las fechas segun el estado del pedido
         */

        beforeUpdate: async (pedido) => {
            if (pedido.changed('estado') && pedido.estado === 'pagado') {
                pedido.fechaPago = new Date();
                await pedido.save({hooks: false}); // Guardar sin ejecutar hooks para evitar bucles
            }

            if (pedido.changed('estado') && pedido.estado === 'enviado') {
                pedido.fechaEnvio = new Date();
                await pedido.save({hooks: false}); // Guardar sin ejecutar hooks para evitar bucles
            }

            if (pedido.changed('estado') && pedido.estado === 'entregado') {
                pedido.fechaEntrega = new Date();
                await pedido.save({hooks: false}); // Guardar sin ejecutar hooks para evitar bucles
            }
        },

        /**
         * beforeDestroy: se ejecuta antes de eliminar un pedido
         */
            beforeDestroy: async () => {
                throw new Error('No se pueden eliminar pedidos, solo se pueden cancelar');
        },
    }
});

// MEOTODOS DE INSTANCIA 
/**
 * Metodo para calcular el subtotal de este item 
 * 
 * @param {string} nuevoEstado - estado del pedido
 * @return {number} subtotal del item (precio unitario * cantidad)
 */

Pedido.prototype.cambiarEstado = async function(nuevoEstado) {
    const estadosValidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];

    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('Estado no valido, debe ser pendiente, pagado, enviado o cancelado');
    }
    
    this.estado = nuevoEstado;
    return await this.save();
};


/**
 * metodo para verificar si el pedido puede ser cancelado
 * solo se pueden cancelar pedidos pendientes o pagados
 * @returns {boolean} true si se puede cancelar, false si no
 */
Pedido.prototype.puedeSerCancelado = function() {
    return ['pendiente', 'pagado'].includes(this.estado);
 };


/**Metodo para cancelar pedido
 * @returns {Promise<Pedido>} - Pedido actualizado
**/
Pedido.prototype.cancelar = async function() {
    if (!this.puedeSerCancelado()) {
        throw new Error('No se puede cancelar este pedido');
    }

    //importar modelos
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    //obtener detalles del pedido
    const detalles = await DetallePedido.findAll({
        where: { pedidoId: this.id }
    });

    //devolver stock de los productos
    for (const detalle of detalles) {
        const producto = await Producto.findByPk(detalle.productoId);
        if (producto) {
            await producto.aumentarStock(detalle.cantidad);
            console.log(`Stock devuelto: ${detalle.cantidad} X ${producto.nombre}`);
        }
    }

    //cambiar estado a cancelado
    this.estado = 'cancelado';
    return await this.save();
};

/**
 * Metodo para obtener detalle del pedido con productos incluidos
 * @returns {Promise<Array>} - detalle del pedido
 */
Pedido.prototype.obtenerDetalle = async function () {
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    return await DetallePedido.findAll({
        where: { pedidoId: this.id },
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ]
    });
};

/**
 * Metodo para obtener pedidos por estado 
 * @param {string} estado - estado a filtrar
 * @returns {Promise<Array>} - pedidos filtrados 
 */
Pedido.obtenerPorEstado = async function (estado) {
    const Usuario = require('./Usuario');
    return await this.findAll({
        where: { estado },
        include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email', 'telefono']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Metodo para obtener historial de pedidos de un usuario
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<number>} - pedidos del usuario 
 */
Pedido.obtenerHistorialUsuario = async function (usuarioId) {
    return await this.findAll({
        where: { usuarioId },
        order: [['createdAt', 'DESC']]
    });;
};

//Exportar modelo
module.exports = Pedido;
