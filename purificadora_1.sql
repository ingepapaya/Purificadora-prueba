-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS GestionVentas
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;
USE GestionVentas;

-- Tabla para registrar los clientes
CREATE TABLE Clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(15),
    email VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email),
    CHECK (telefono REGEXP '^[0-9]+$' OR telefono IS NULL)
);

-- Tabla para registrar los empleados
CREATE TABLE Empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    salario DECIMAL(10, 2) NOT NULL CHECK (salario >= 0),
    fecha_contratacion DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para registrar los proveedores
CREATE TABLE Proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email)
);

-- Tabla para registrar los productos
CREATE TABLE Productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor INT NOT NULL,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(10, 2) NOT NULL CHECK (precio_venta >= 0),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Tabla para registrar las ventas
CREATE TABLE Ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_empleado INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_empleado) REFERENCES Empleados(id_empleado)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Tabla para registrar los detalles de cada venta
CREATE TABLE DetalleVentas (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES Ventas(id_venta)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Nueva tabla para estadísticas de productos
CREATE TABLE EstadisticasProductos (
    id_producto INT PRIMARY KEY,
    total_vendido INT DEFAULT 0,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Procedimiento almacenado para agregar o actualizar una venta
DELIMITER $$
CREATE PROCEDURE AddOrUpdateVenta (
    IN p_id_venta INT,
    IN p_id_producto INT,
    IN p_cantidad INT,
    IN p_subtotal DECIMAL(10, 2)
)
BEGIN
    DECLARE existing_cantidad INT;

    -- Verificar si el producto ya está en DetalleVentas
    SELECT cantidad INTO existing_cantidad
    FROM DetalleVentas
    WHERE id_venta = p_id_venta AND id_producto = p_id_producto;

    IF existing_cantidad IS NOT NULL THEN
        -- Actualizar cantidad y subtotal si ya existe
        UPDATE DetalleVentas
        SET cantidad = cantidad + p_cantidad,
            subtotal = subtotal + p_subtotal
        WHERE id_venta = p_id_venta AND id_producto = p_id_producto;
    ELSE
        -- Insertar nuevo detalle si no existe
        INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, subtotal)
        VALUES (p_id_venta, p_id_producto, p_cantidad, p_subtotal);
    END IF;

    -- Actualizar estadísticas de productos
    INSERT INTO EstadisticasProductos (id_producto, total_vendido)
    VALUES (p_id_producto, p_cantidad)
    ON DUPLICATE KEY UPDATE total_vendido = total_vendido + p_cantidad;
END$$
DELIMITER ;

-- Tabla para manejar el inventario
CREATE TABLE Inventario (
    id_producto INT PRIMARY KEY,
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0), -- Validar que el stock no sea negativo
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Procedimiento para actualizar el inventario
DELIMITER //
CREATE PROCEDURE ActualizarInventario (
    IN p_id_producto INT,
    IN p_cantidad INT
)
BEGIN
    DECLARE stock_actual INT;

    -- Obtener el stock actual del producto
    SELECT stock_actual INTO stock_actual
    FROM Inventario
    WHERE id_producto = p_id_producto;

    -- Actualizar el stock
    UPDATE Inventario
    SET stock_actual = stock_actual - p_cantidad
    WHERE id_producto = p_id_producto;

    -- Validar que no haya stock negativo
    IF stock_actual - p_cantidad < 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Stock insuficiente';
    END IF;
END //
DELIMITER ;


-- Vista para identificar el producto más vendido
CREATE VIEW ProductoMasVendido AS
SELECT 
    P.id_producto,
    P.nombre_producto,
    EP.total_vendido
FROM Productos P
INNER JOIN EstadisticasProductos EP ON P.id_producto = EP.id_producto
ORDER BY EP.total_vendido DESC
LIMIT 1;

