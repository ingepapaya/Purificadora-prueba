const express = require('express');
const mysql = require('mysql2/promise'); // Usar mysql2/promise para promesas
const app = express();
require('dotenv').config(); // Usar dotenv para la configuración

app.use(express.static('public'));

// Configuración del servidor
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a la base de datos
const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'C4rl0sh3rc4s55', // Cambiar por la contraseña correspondiente
    database: process.env.DB_NAME || 'GestionVentas'
};

// Middleware para parsear JSON
app.use(express.json());

// Conexión a la base de datos
let connection;
mysql.createConnection(connectionConfig)
    .then(conn => {
        connection = conn;
        console.log('Conexión exitosa a la base de datos');
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err);
    });

const cors = require('cors');
app.use(cors());

// Endpoints para Clientes
app.get('/clientes', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM Clientes');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).send('Error al obtener clientes');
    }
});

app.post('/clientes', async (req, res) => {
    const { nombre, direccion, telefono, email } = req.body;
    const query = 'INSERT INTO Clientes (nombre, direccion, telefono, email) VALUES (?, ?, ?, ?)';
    try {
        await connection.query(query, [nombre, direccion, telefono, email]);
        res.status(201).send('Cliente agregado exitosamente');
    } catch (err) {
        console.error('Error al agregar cliente:', err);
        res.status(500).send('Error al agregar cliente');
    }
});

app.delete('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Clientes WHERE id_cliente = ?';
    try {
        const [results] = await connection.query(query, [id]);
        if (results.affectedRows === 0) {
            res.status(404).send('Cliente no encontrado');
        } else {
            res.status(200).send('Cliente eliminado exitosamente');
        }
    } catch (err) {
        console.error('Error al eliminar cliente:', err);
        res.status(500).send('Error al eliminar cliente');
    }
});

// Endpoints para Productos
app.get('/productos', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM Productos');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
});

app.post('/productos', async (req, res) => {
    const { id_proveedor, nombre_producto, descripcion, precio_venta, stock } = req.body;
    const query = 'INSERT INTO Productos (id_proveedor, nombre_producto, descripcion, precio_venta, stock) VALUES (?, ?, ?, ?, ?)';
    try {
        await connection.query(query, [id_proveedor, nombre_producto, descripcion, precio_venta, stock]);
        res.status(201).send('Producto agregado exitosamente');
    } catch (err) {
        console.error('Error al agregar producto:', err);
        res.status(500).send('Error al agregar producto');
    }
});

app.delete('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Productos WHERE id_producto = ?';
    try {
        const [results] = await connection.query(query, [id]);
        if (results.affectedRows === 0) {
            res.status(404).send('Producto no encontrado');
        } else {
            res.status(200).send('Producto eliminado exitosamente');
        }
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).send('Error al eliminar producto');
    }
});

// Endpoints para Ventas
app.get('/ventas', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM Ventas');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener ventas:', err);
        res.status(500).send('Error al obtener ventas');
    }
});

app.post('/ventas/detalle', async (req, res) => {
    const { id_venta, id_producto, cantidad, subtotal } = req.body;

    try {
        await connection.beginTransaction();

        const ventaQuery = 'CALL AddOrUpdateVenta(?, ?, ?, ?)';
        await connection.query(ventaQuery, [id_venta, id_producto, cantidad, subtotal]);

        const inventarioQuery = 'CALL ActualizarInventario(?, ?)';
        await connection.query(inventarioQuery, [id_producto, cantidad]);

        await connection.commit();
        res.status(200).send('Detalle de venta e inventario actualizado exitosamente');
    } catch (err) {
        await connection.rollback();
        console.error('Error al manejar venta:', err);
        res.status(500).send('Error al manejar venta');
    }
});

// Endpoints para Inventario
app.post('/inventario', async (req, res) => {
    const { id_producto, stock_inicial } = req.body;
    const query = 'INSERT INTO Inventario (id_producto, stock_actual) VALUES (?, ?)';

    try {
        await connection.query(query, [id_producto, stock_inicial]);
        res.status(201).send('Inventario inicializado exitosamente');
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            res.status(400).send('El producto especificado no existe');
        } else if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).send('El inventario para este producto ya está inicializado');
        } else {
            res.status(500).send('Error al inicializar inventario');
        }
    }
});

app.get('/inventario', async (req, res) => {
    const query = `
        SELECT P.id_producto, P.nombre_producto, I.stock_actual, I.ultima_actualizacion
        FROM Inventario I
        JOIN Productos P ON I.id_producto = P.id_producto;
    `;

    try {
        const [results] = await connection.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener inventario:', err);
        res.status(500).send('Error al obtener inventario');
    }
});

// Endpoints para Empleados
app.get('/empleados', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM Empleados');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener empleados:', err);
        res.status(500).send('Error al obtener empleados');
    }
});

app.post('/empleados', async (req, res) => {
    const { nombre, cargo, telefono, email, salario, fecha_contratacion } = req.body;
    const query = 'INSERT INTO Empleados (nombre, cargo, telefono, email, salario, fecha_contratacion) VALUES (?, ?, ?, ?, ?, ?)';
    try {
        await connection.query(query, [nombre, cargo, telefono, email, salario, fecha_contratacion]);
        res.status(201).send('Empleado agregado exitosamente');
    } catch (err) {
        console.error('Error al agregar empleado:', err);
        res.status(500).send('Error al agregar empleado');
    }
});

app.delete('/empleados/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Empleados WHERE id_empleado = ?';
    try {
        const [results] = await connection.query(query, [id]);
        if (results.affectedRows === 0) {
            res.status(404).send('Empleado no encontrado');
        } else {
            res.status(200).send('Empleado eliminado exitosamente');
        }
    } catch (err) {
        console.error('Error al eliminar empleado:', err);
        res.status(500).send('Error al eliminar empleado');
    }
});

// Endpoints para Proveedores
app.get('/proveedores', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM Proveedores');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).send('Error al obtener proveedores');
    }
});

app.post('/proveedores', async (req, res) => {
    const { nombre, contacto, telefono, email, direccion } = req.body;
    const query = 'INSERT INTO Proveedores (nombre, contacto, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)';
    try {
        await connection.query(query, [nombre, contacto, telefono, email, direccion]);
        res.status(201).send('Proveedor agregado exitosamente');
    } catch (err) {
        console.error('Error al agregar proveedor:', err);
        res.status(500).send('Error al agregar proveedor');
    }
});

app.delete('/proveedores/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Proveedores WHERE id_proveedor = ?';
    try {
        const [results] = await connection.query(query, [id]);
        if (results.affectedRows === 0) {
            res.status(404).send('Proveedor no encontrado');
        } else {
            res.status(200).send('Proveedor eliminado exitosamente');
        }
    } catch (err) {
        console.error('Error al eliminar proveedor:', err);
        res.status(500).send('Error al eliminar proveedor');
    }
});

// Endpoints para EstadisticasProductos
app.get('/estadisticas/productos', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM EstadisticasProductos');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener estadísticas de productos:', err);
        res.status(500).send('Error al obtener estadísticas de productos');
    }
});

// Endpoint para ProductoMasVendido
app.get('/producto-mas-vendido', async (req, res) => {
    try {
        const [results] = await connection.query('SELECT * FROM ProductoMasVendido');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener el producto más vendido:', err);
        res.status(500).send('Error al obtener el producto más vendido');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});