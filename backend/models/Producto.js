/**
 * MODELO DE PRODUCTO
 * Define la tabla Producto en la base de datos
 * Almacena los productos
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//Importar instance de squelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Categoria
 */
const Producto = sequelize.define('Producto', {
    //Campos de la tabla
    //ID Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },

    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty:{
                msg:'El nombre del producto no puede estar vacio'
            },
            len:{
                args: [3,200],
                msg: 'El nombre debe tener entre 3 y 200 caracteres'
            }
        }
    },

    /**
     * Descripcion detallada del producto
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    //Precio del producto
    precio:{
        type: DataTypes.DECIMAL(10,2), //hasta 99,999,999.99
        allowNull: false,
        validate:{
            isDecimal:{
                msg: 'El precio debe ser un numero decimal valido'
            },
            min:{
                args:[0],
                msg: 'El precio no puede ser negativo'
            }
        }
    },

        //Stock del producto cantidad disponible en inventario
    stock:{
        type: DataTypes.INTEGER, //hasta 99,999,999.99
        allowNull: false,
        defaultValue: 0,
        validate:{
            isInt:{
                msg: 'El stock debe ser un numero entero'
            },
            min:{
                args:[0],
                msg: 'El stock no puede ser negativo'
            }
        }
    },

    /**
     * imagen Nombre del archivo de imagen
     * se guardara solo el nombre ejemplo: coca-cola-producto.jpg
     * la ruta seria /uploads/coca-cola-productos.jpg
     */
    imagen:{
        type:DataTypes.STRING(255),
        allowNull: true, //la imagen puede ser opcional
        validate: {
            is:{
                args: /\. (jpg|jpeg|png|gif)$/i,
                msg: 'La imagen debe ser un archivo JPG, JPEG, PNG o GIF'
            }
        }
    },
    /**
     * 
     * 
     */

        subcategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'subcategorias', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', //si se actualiza  el id, actializar aca tambien
        onDelete: 'CASCADE', //si se borra la categoria, borrar esta subcategoria
        validate: {
            notNull: {
                msg: ' debe seleccionar una subcategoria'
            }
        }
    },
    
    /**
     * CategoriaId - Id de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la table categoria
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', //si se actualiza  el id, actializar aca tambien
        onDelete: 'CASCADE', //si se borra la categoria, borrar esta subcategoria
        validate: {
            notNull: {
                msg: ' debe seleccionar una categoria'
            }
        }
    },

    /**
     * activo estado de la subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }

}, {
    //opciones del modelo

    tableName: 'productos',
    timestamps: true, //agrega campos createdAt y updatedAt

    /**
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //Indice para buscar Productos por subcategoria
            fields: ['subcategoriaId']
        },
        {
            //Indice para buscar Productos por categoria
            fields: ['categoriaId']
        },
        {
            //indece para buscar productos activos
            fields:['activo']
        },
                {
            //indece para buscar productos por nombre
            fields:['nombre']
        },
    ],

    /**
     * Hooks Acciones automaticas
     */

    hooks: {
        /**
         * beaforeUpdate: se ejecuta despues de actualizar un producto
         * valida que la subcategoria y que la categoria esten activas
         */

        beforeCreate: async (producto) => {
            const Categoria = require('./Categoria');
            const Subcategoria = require('./Subategoria');

            
            //Buscar subcategoria padre
            const subcategoria = await Subategoria.findByPk(producto.subcategoriaId);
            if(!categoria) {
                throw new Error('La subcategoria seleccionada no existe');
            }

            if (!subcategoria.activo){
                throw new Error('No se puede crear una subcategoria en un producto en una subcategoria inactiva');
            }

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(produto.categoriaId);
            if(!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo){
                throw new Error('No se puede crear un producto en una categoria inactiva');
            }

            // validar que la subcategoria pertenezca a una categoria 
            if (subcategoria.categoriaId !== producto.categoriaId) {
                throw new Error('La subcategoria no pertenece a la categoria seleccionada')
            }
        },

        /**
         * beforeDestroy: se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe
         */

        beforeDestroy: async (producto) => {
            if (producto.imagen) {
                const { deleteFile} = require('../config/multer');
                // intenta eliminar la imagen del servidor
                const eliminado = await deleteFile (producto.imagen);

                if (eliminado) {
                    console.log(`Imagen eliminada: ${producto.imagen}`)
                }
            }
        },
        
    }
});

// METODOS DE INSTANCIA
/**
 * Metodo para obtener la url completa de la imagen
 * 
 * @returns {string|null} - url de la imagen
 */
Producto.prototype.obtenerUrlImagen = function(){
    if (this.imagen) {
        return null; 
    }

    const baseUrl = ProcessingInstruction.env.FRONTED_URL || 'http://localhost:500'
    return `${baseUrl}/uploads/${this.imagen}`;
};

/**
 * metodo para verificar si hay stock disponible
 * 
 * @param {number} cantidad - cantidad deseada
 * @returns {boolean} - true si ay stock suficiente false si no 
 */
Producto.prototype.hayStock = function(cantidad) {
    this.stock += cantidad;
    return this.save();
};

/**
 * Metodo para reducir el stock
 * util para despues de una venta
 * @param {number} cantidad - cantidad a reducir
 * @returns {Promise<Producto>} - Producto actualizado
 */

Producto.prototype.aumentarStock = async function (cantidad){
    if (this.hayStock(cantidad)){
        throw new Error('Stock insuficiente');
    }
    this.stock -=cantidad;
    return await this.save();
};


// Exportar el modelo de Categoria
module.exports =  Producto;
