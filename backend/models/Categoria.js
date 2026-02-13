/**
 * MODELO DE CATEGORIA
 * Define la tabla de categoria en la base de datos
 * Almacena las categorias principales de los prodctos
 */

//Importar DB de sequelize
const { DataTypes } = require('sequelize');

//Importar instacia de sequelize
const sequelize = require('../config/database');

/**
 * Definir el modelo de Categoria
 */
const Categoria = sequelize.define('Categoria', {
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

    /**
     * activo estado de la categoria
     * si es false la categoria y todas sus subcategirias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    //opciones del modelo

    tableName: 'categorias', 
    timestamps: true, //crea campos createdAt y updatedAt

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * afterUpdate: se ejecuta despues de actualziar una categoria
         * si se desactiva una categoria, se desactivan todas sus subcategorias y productos relacionados
         */
        afterUpdate: async (categoria, options) => {
            //Verificar si el campo activo cambio 
            if (categoria.changed('activo') && !categoria.activo) {
                console.log(`Desactivando categoria ${categoria.nombre}`);

                //Importar modelos (aqui para evitar dependencias circulares)
                const Subcategoria = require('./Subcategoria');
                const Producto = require('./Producto');

                try {
                    //Paso 1 desactivar las subcategorias de esta categoria
                    const subcategorias = await Subcategoria.findAll({ where: { categoriaId: categoria.id } });
                    for (const subcategoria of subcategorias) {
                        await subcategoria.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Subcategoria desactivada: ${subcategoria.nombre}`);
                    }

                    //paso 2 desactivar los productos de esta categoria 
                    const productos = await Producto.findAll({ where: { categoriaId: categoria.id } });
                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`Categoria y elementos relacionados desactivados correctamente`);
                } catch (error) {
                    console.error(`Error al desactivar categoria y elementos relacionados: ${error.message}`);
                    throw error;
                }
            }
            // Si se activa una categoria no se activan automaticamente las subcategorias y producto
        }
    }
});

// METODOS DE INSTANCIA
/**
 * Metodo para obtener subcategorias activas de esta categoria
 * 
 * @return {Promise<number>} - numero de subcategorias activas
 */
Categoria.prototype.getSubcategorias = async function() {
    const Subcategoria = require('./Subcategoria');
    return await Subcategoria.count({ where: { categoriaId: this.id } });
};

/**
 * Metodo para obtener productos activos de esta categoria
 * 
 * @return {Promise<number>} - numero de productos activos
 */
Categoria.prototype.getProductos = async function() {
    const Producto = require('./Producto');
    return await Producto.count({ where: { categoriaId: this.id } });
};

// Exportar el modelo de Categoria
module.exports = Categoria;