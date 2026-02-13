/**
 * MODELO DE PRODUCTO
 * Define la tabla de subcategoria en la base de datos
 * Almacena los producytos

//Importar datatype
**/
const { DataTypes } = require('sequelize');

//Importar instacia de sequelize
const sequelize = require('../config/database');
const { before } = require('node:test');

/**
 * Definir el modelo de Subcategoria
 */
const Subcategoria = sequelize.define('Subcategoria', {
    //Campos de la tabla 
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    /**
     * categoriaId - ID de la categoria a la que pertenece esta subcategoria (FOREIGN KEY)
     * esta es la relacion con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla relacionada
            key: 'id' //campo id de la tabla relacionada
        },
        onUpdate: 'CASCADE', //si se actualiza el id de la categoria, se actualiza en esta tabla
        onDelete: 'CASCADE', //si se elimina la categoria, se eliminan las subcategorias relacionadas
        validate: {
            notNull: {
                msg: "Debe seleccionar la categoria"
            },
    },
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: "El nombre de la subcategoria ya existe"
        },
        validate: {
            notEmpty: {
                msg: "El nombre de la subcategoria no puede estar vacio"
            },
            len: {
                args: [3, 100],
                msg: "El nombre de la subcategoria debe tener entre 3 y 100 caracteres"
            }
        }
    },

    /**
     * Descripcion de la subcategoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    /**activo estado de la subcategoria
     * si es false la subcategoria y sus productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    //opciones del modelo

    tableName: 'subcategorias', 
    timestamps: true, //crea campos createdAt y updatedAt

    /**indices compuestos para optimizar busqueda
     * 
     */
    indexes: [
        { 
            //Indice para buscar subcategorias por categoria
            fields: ['categoriaId']
        },
        {
            //indice compuesto: nombre unico por categoria
            //Permite que dos categorias diferentes tengan subcategorias con el mismo nombre
            unique: true,
            fields: ['nombre', 'categoriaId'],
            name: 'unique_subcategoria_nombre_categoria'
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

/**
 * Metodo para obtener subcategorias activas de esta categoria
 * 
 * @return {Promise<number>} - numero de productos activos
 */
Subcategoria.prototype.getproductos = async function() {
    const producto = require('./Producto');
    return await producto.count({ where: { categoriaId: this.id,} });
};

/**
 * Metodo para obtener la categoria padre
 * 
 * @return {Promise<Categoria>} - objeto categoria padre
 */
Subcategoria.prototype.getCategoria = async function() {
    const Categoria = require('./Categoria');
    return await Categoria.findByPk(this.categoriaId);
};

//Exportar el modelo de Subcategoria
module.exports = Subcategoria;