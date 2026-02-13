/**
 * MODELO DE CARRITO
 * Define la tabla de carrito en la base de datos
 * Almacena los productos que cada usuario ha agregado al carrito
 */

//Importar DB de sequelize
const { DataTypes } = require('sequelize');

//Importar instacia de sequelize
const sequelize = require('../config/database');

/**
 * Definir el modelo de Carrito
 */
const Carrito = sequelize.define('Carrito', {
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
        onDelete: 'CASCADE', //Si se elimina usuario, se elimina el carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
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
         * beforeCreate: Antes de crear una subcategoria
         * verifica que la categoria padre esta activa 
         */
        beforeCreate: async (subcategoria) => {
            const Categoria = require('./Categoria');

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(subcategoria.categoriaId);

            if (!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('No se puede crear una subcategoria para una categoria inactiva');
            }
        },

        /**
         * afterUpdate: se ejecuta despues de actualziar una subcategoria
         * si se desactiva una subcategoria, se desactivan todas sus productos relacionados
         */

        afterUpdate: async (subcategoria, options) => {
            //Verificar si el campo activo cambio 
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoria;`, subcategoria.nombre);

                //Importar modelos (aqui para evitar dependencias circulares)
                const Producto = require('./Producto');

                try {
                    //Paso 1 desactivar los productos de esta subcategoria
                    const productos = await Producto.findAll({ where: { subcategoriaId: subcategoria.id } });
                    
                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Producto desactivado:`, producto.nombre);
                    }
                    
                    console.log(`Subcategoria y productos relacionados desactivados correctamente`);
                } catch (error) {
                    console.error(`Error al desactivar subcategoria y productos relacionados:`, error.message);
                    throw error;
                }
            }
            // Si se activa una categoria no se activan automaticamente las subcategorias y producto
        }
    }
});

// MEOTODOS DE INSTANCIA 
/**
 * Metodo para obtener subcategorias activas de esta categoria
 * 
 * @return {Promise<number>} - numero de subcategorias activas
 */
Subcategoria.prototype.getSubcategorias = async function() {
    const Subcategoria = require('./Subcategoria');
    return await Subcategoria.count({ where: { categoriaId: this.id,} });
};

},



    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: "El nombre de la categoria ya existe"
        },
        validate: {
            notEmpty: {
                msg: "El nombre de la categoria no puede estar vacio"
            },
            len: {
                args: [3, 100],
                msg: "El nombre de la categoria debe tener entre 3 y 100 caracteres"
            }
        }
    },

    /**
     * Descripcion de la categoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },