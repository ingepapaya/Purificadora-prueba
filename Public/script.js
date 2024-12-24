document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = `${window.location.origin}`;


    // Utilidad para realizar peticiones
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        } catch (error) {
            console.error('Error:', error.message);
            alert(`Error: ${error.message}`);
        }
    }

    // Clientes
    document.getElementById('fetchClients').addEventListener('click', async () => {
        const clients = await apiRequest('/clientes');
        const clientList = document.getElementById('clientList');
        clientList.innerHTML = clients ? clients.map(c => `<li>${c.nombre} (${c.email})</li>`).join('') : 'No hay clientes';
    });

    document.getElementById('addClientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        const response = await apiRequest('/clientes', 'POST', body);
        if (response) alert('Cliente agregado exitosamente');
        e.target.reset();
    });

    // Productos
    document.getElementById('fetchProducts').addEventListener('click', async () => {
        const products = await apiRequest('/productos');
        const productList = document.getElementById('productList');
        productList.innerHTML = products ? products.map(p => `<li>${p.nombre_producto} - ${p.precio_venta} Q</li>`).join('') : 'No hay productos';
    });

    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        const response = await apiRequest('/productos', 'POST', body);
        if (response) alert('Producto agregado exitosamente');
        e.target.reset();
    });
});

// Ventas
document.getElementById('fetchVentas').addEventListener('click', async () => {
    const ventas = await apiRequest('/ventas');
    const ventasList = document.getElementById('ventasList');
    ventasList.innerHTML = ventas
        ? ventas.map(v => `<li>ID Venta: ${v.id_venta}, Total: ${v.total}</li>`).join('')
        : 'No hay ventas registradas';
});

document.getElementById('addVentaDetalleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    const response = await apiRequest('/ventas/detalle', 'POST', body);
    if (response) alert('Detalle de venta agregado exitosamente');
    e.target.reset();
});

// Inventario
document.getElementById('fetchInventario').addEventListener('click', async () => {
    const inventario = await apiRequest('/inventario');
    const inventarioList = document.getElementById('inventarioList');
    inventarioList.innerHTML = inventario
        ? inventario.map(i => `<li>${i.nombre_producto} - Stock: ${i.stock_actual}</li>`).join('')
        : 'No hay inventario registrado';
});

document.getElementById('addInventarioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    const response = await apiRequest('/inventario', 'POST', body);
    if (response) alert('Inventario inicializado exitosamente');
    e.target.reset();
});

// Empleados
document.getElementById('fetchEmpleados').addEventListener('click', async () => {
    const empleados = await apiRequest('/empleados');
    const empleadosList = document.getElementById('empleadosList');
    empleadosList.innerHTML = empleados
        ? empleados.map(e => `<li>${e.nombre} - ${e.cargo}</li>`).join('')
        : 'No hay empleados registrados';
});

document.getElementById('addEmpleadoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    const response = await apiRequest('/empleados', 'POST', body);
    if (response) alert('Empleado agregado exitosamente');
    e.target.reset();
});
