// ===== BASE DE DATOS =====
let asesores = JSON.parse(localStorage.getItem('sarc_asesores')) || [];
let clientes = JSON.parse(localStorage.getItem('sarc_clientes')) || [];
let rutas = JSON.parse(localStorage.getItem('sarc_rutas')) || [];
let satisfacciones = JSON.parse(localStorage.getItem('sarc_satisfacciones')) || [];
let usuarios = JSON.parse(localStorage.getItem('sarc_usuarios')) || [];
let currentUser = JSON.parse(localStorage.getItem('sarc_currentUser')) || null;
let editingId = null;
let editingType = null;
let charts = {};

// ===== USUARIOS POR DEFECTO =====
function initDefaultUsers() {
    if (usuarios.length === 0) {
        usuarios = [
            {
                id: 1,
                username: 'admin',
                password: hashPassword('admin123'),
                nombre: 'Administrador Principal',
                email: 'admin@empresa.com',
                rol: 'admin',
                estado: 'activo',
                fechaRegistro: new Date().toISOString()
            },
            {
                id: 2,
                username: 'supervisor',
                password: hashPassword('super123'),
                nombre: 'Supervisor General',
                email: 'supervisor@empresa.com',
                rol: 'supervisor',
                estado: 'activo',
                fechaRegistro: new Date().toISOString()
            },
            {
                id: 3,
                username: 'asesor1',
                password: hashPassword('asesor123'),
                nombre: 'Carlos Méndez',
                email: 'carlos@empresa.com',
                rol: 'asesor',
                estado: 'activo',
                fechaRegistro: new Date().toISOString()
            }
        ];
        saveUsersToLocalStorage();
    }
}

// ===== HASH SIMPLE (Para demo - en producción usar bcrypt) =====
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
}

// ===== PERSISTENCIA =====
function saveToLocalStorage() {
    localStorage.setItem('sarc_asesores', JSON.stringify(asesores));
    localStorage.setItem('sarc_clientes', JSON.stringify(clientes));
    localStorage.setItem('sarc_rutas', JSON.stringify(rutas));
    localStorage.setItem('sarc_satisfacciones', JSON.stringify(satisfacciones));
}

function saveUsersToLocalStorage() {
    localStorage.setItem('sarc_usuarios', JSON.stringify(usuarios));
}

// ===== AUTHENTICATION =====
function checkAuth() {
    initDefaultUsers();
    if (currentUser) {
        showMainApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateUserInfo();
    checkPermissions();
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.nombre;
        document.getElementById('userRole').textContent = currentUser.rol.toUpperCase();
    }
}

function checkPermissions() {
    const adminTabs = document.querySelectorAll('.admin-only');
    adminTabs.forEach(tab => {
        if (currentUser && currentUser.rol === 'admin') {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });
}

function login(username, password) {
    const user = usuarios.find(u => u.username === username && u.password === hashPassword(password));
    if (user) {
        if (user.estado !== 'activo') {
            showLoginMessage('error', 'Usuario inactivo. Contacte al administrador.');
            return false;
        }
        currentUser = user;
        localStorage.setItem('sarc_currentUser', JSON.stringify(user));
        showLoginMessage('success', 'Inicio de sesión exitoso');
        setTimeout(() => {
            showMainApp();
            initializeApp();
        }, 1000);
        return true;
    } else {
        showLoginMessage('error', 'Usuario o contraseña incorrectos');
        return false;
    }
}

function logout() {
    if (confirm('¿Está seguro de cerrar sesión?')) {
        currentUser = null;
        localStorage.removeItem('sarc_currentUser');
        showLoginScreen();
        showNotification('info', 'Sesión cerrada', 'Ha cerrado sesión correctamente');
    }
}

function showLoginMessage(type, message) {
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');
    const errorText = document.getElementById('loginErrorText');
    const successText = document.getElementById('loginSuccessText');
    if (type === 'error') {
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        successDiv.style.display = 'none';
        setTimeout(() => errorDiv.style.display = 'none', 3000);
    } else {
        successText.textContent = message;
        successDiv.style.display = 'flex';
        errorDiv.style.display = 'none';
        setTimeout(() => successDiv.style.display = 'none', 3000);
    }
}

// ===== MODALES =====
function showRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

function showResetModal() {
    document.getElementById('resetModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== CRUD USUARIOS =====
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const rol = document.getElementById('regRole').value;

    if (password !== confirmPassword) {
        showNotification('error', 'Error', 'Las contraseñas no coinciden');
        return;
    }
    if (usuarios.some(u => u.username === username)) {
        showNotification('error', 'Error', 'El nombre de usuario ya existe');
        return;
    }

    const newUser = {
        id: Date.now(),
        username,
        password: hashPassword(password),
        nombre,
        email,
        rol,
        estado: 'activo',
        fechaRegistro: new Date().toISOString()
    };

    usuarios.push(newUser);
    saveUsersToLocalStorage();
    closeModal('registerModal');
    this.reset();
    renderUsuarios();
    showNotification('success', 'Usuario registrado', `${nombre} ha sido agregado al sistema`);
});

document.getElementById('resetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    const user = usuarios.find(u => u.email === email);
    if (user) {
        document.getElementById('resetSuccess').style.display = 'flex';
        setTimeout(() => {
            closeModal('resetModal');
            document.getElementById('resetSuccess').style.display = 'none';
        }, 2000);
    } else {
        showNotification('warning', 'Email no encontrado', 'No hay usuario registrado con ese email');
    }
});

function renderUsuarios() {
    if (!currentUser || currentUser.rol !== 'admin') return;
    const html = usuarios.length === 0
        ? `<div class="empty-state"><h3>📭 No hay usuarios registrados</h3></div>`
        : `
        <table>
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${usuarios.map(u => `
                    <tr>
                        <td>${u.username}</td>
                        <td>${u.nombre}</td>
                        <td>${u.email}</td>
                        <td><span class="badge badge-${u.rol === 'admin' ? 'danger' : u.rol === 'supervisor' ? 'info' : 'primary'}">${u.rol}</span></td>
                        <td><span class="badge badge-${u.estado === 'activo' ? 'success' : 'danger'}">${u.estado}</span></td>
                        <td>
                            <button class="btn btn-small btn-${u.estado === 'activo' ? 'warning' : 'success'}" onclick="toggleUserStatus(${u.id})">
                                ${u.estado === 'activo' ? '⏸️' : '▶️'}
                            </button>
                            ${u.id !== currentUser.id ? `<button class="btn btn-small btn-danger" onclick="deleteUser(${u.id})">🗑️</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        `;
    document.getElementById('usuariosList').innerHTML = html;
}

function toggleUserStatus(id) {
    const user = usuarios.find(u => u.id === id);
    if (user) {
        user.estado = user.estado === 'activo' ? 'inactivo' : 'activo';
        saveUsersToLocalStorage();
        renderUsuarios();
        showNotification('info', 'Estado actualizado', `Usuario ${user.username} ahora está ${user.estado}`);
    }
}

function deleteUser(id) {
    const user = usuarios.find(u => u.id === id);
    if (user && id !== currentUser.id) {
        if (confirm(`¿Eliminar usuario ${user.username}?`)) {
            usuarios = usuarios.filter(u => u.id !== id);
            saveUsersToLocalStorage();
            renderUsuarios();
            showNotification('info', 'Usuario eliminado', `${user.username} ha sido eliminado`);
        }
    }
}

// ===== NOTIFICACIONES =====
function showNotification(type, title, message) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    container.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
            if (container.children.length === 0) {
                container.innerHTML = '';
            }
        }, 300);
    }, 3000);
}

// ===== UTILIDADES =====
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateStr, timeStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
    }
    return date.toLocaleString('es-ES', options);
}

// ===== NAVEGACIÓN =====
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'dashboard') {
        updateDashboard();
        updateCharts();
    }
    if (tabName === 'reportes') {
        updateReportes();
        updateReportCharts();
    }
    if (tabName === 'satisfaccion') {
        updateSatisfaccionSelects();
        updateSatisfaccionChart();
        renderSatisfacciones();
    }
    if (tabName === 'rutas') {
        updateAsesorSelects();
        updateClienteSelects();
    }
    if (tabName === 'usuarios') {
        renderUsuarios();
    }
}

// ===== LOGIN FORM =====
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    if (login(username, password)) {
        if (rememberMe) {
            localStorage.setItem('sarc_rememberMe', 'true');
        }
        this.reset();
    }
});

// ===== INICIALIZACIÓN =====
function initializeApp() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('routeFecha').value = today;
    document.getElementById('satisfaccionFecha').value = today;
    
    renderAsesores();
    renderClientes();
    renderRutas();
    renderSatisfacciones();
    updateAsesorSelects();
    updateClienteSelects();
    updateSatisfaccionSelects();
    updateDashboard();
    updateCharts();
    updateReportCharts();
    updateSatisfaccionChart();

    setTimeout(() => {
        showNotification('info', '✅ Sistema listo', `Bienvenido, ${currentUser.nombre}`);
    }, 500);

    if (asesores.length === 0 && clientes.length === 0 && rutas.length === 0) {
        asesores = [
            { id: 1, nombre: "Carlos Méndez", email: "carlos@empresa.com", telefono: "+57 300 123 4567", tipo: "senior", zona: "Centro", estado: "activo", fechaRegistro: new Date().toISOString() },
            { id: 2, nombre: "Ana Rodríguez", email: "ana@empresa.com", telefono: "+57 300 765 4321", tipo: "junior", zona: "Norte", estado: "activo", fechaRegistro: new Date().toISOString() }
        ];
        clientes = [
            { id: 1, nombre: "Supermercado Éxito", nit: "900123456-7", tipo: "mayorista", contacto: "Juan Pérez", email: "juan@exito.com", telefono: "+57 601 234 5678", direccion: "Calle 100 #15-20", ciudad: "Medellín", zona: "Centro", estado: "activo", notas: "Prefiere visitas martes y jueves", fechaRegistro: new Date().toISOString() },
            { id: 2, nombre: "Distribuidora Andina", nit: "900987654-3", tipo: "distribuidor", contacto: "María López", email: "maria@andina.com", telefono: "+57 601 876 5432", direccion: "Carrera 50 #80-30", ciudad: "Medellín", zona: "Norte", estado: "activo", notas: "Solicita catálogo digital", fechaRegistro: new Date().toISOString() }
        ];
        saveToLocalStorage();
        renderAsesores();
        renderClientes();
        updateAsesorSelects();
        updateClienteSelects();
    }
}

// Check auth on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// ===== QR CODE =====
function generateQRForRoute(routeId) {
    const ruta = rutas.find(r => r.id === routeId);
    if (!ruta) return;
    const asesor = asesores.find(a => a.id === ruta.asesorId);
    const clientesVisitados = ruta.clientesIds.map(id => clientes.find(c => c.id === id)).filter(c => c);
    const qrData = {
        id: routeId,
        tipo: 'ruta_comercial',
        asesor: asesor?.nombre || 'N/A',
        fecha: ruta.fecha,
        zona: ruta.zona,
        clientes: clientesVisitados.map(c => c.nombre),
        timestamp: new Date().toISOString()
    };
    const qrString = JSON.stringify(qrData);
    document.getElementById('qrContainer').style.display = 'block';
    document.getElementById('qrCode').innerHTML = '';
    new QRCode(document.getElementById('qrCode'), {
        text: qrString,
        width: 180,
        height: 180,
        correctLevel: QRCode.CorrectLevel.H
    });
    showNotification('success', 'QR Generado', 'Código QR listo para compartir con el cliente');
}

// ===== EXPORTACIÓN A EXCEL =====
function exportAsesoresToExcel() {
    if (asesores.length === 0) {
        showNotification('warning', 'Sin datos', 'No hay asesores para exportar');
        return;
    }
    const data = asesores.map(a => ({
        'ID': a.id, 'Nombre': a.nombre, 'Email': a.email, 'Teléfono': a.telefono,
        'Tipo': a.tipo, 'Zona': a.zona, 'Estado': a.estado, 'Fecha Registro': new Date().toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asesores');
    XLSX.writeFile(wb, `Asesores_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('success', 'Exportación exitosa', `✅ ${asesores.length} asesores exportados a Excel`);
}

function exportClientesToExcel() {
    if (clientes.length === 0) {
        showNotification('warning', 'Sin datos', 'No hay clientes para exportar');
        return;
    }
    const data = clientes.map(c => ({
        'ID': c.id, 'Nombre': c.nombre, 'NIT': c.nit, 'Tipo': c.tipo, 'Contacto': c.contacto,
        'Email': c.email, 'Teléfono': c.telefono, 'Dirección': c.direccion, 'Ciudad': c.ciudad,
        'Zona': c.zona, 'Estado': c.estado, 'Notas': c.notas || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('success', 'Exportación exitosa', `✅ ${clientes.length} clientes exportados a Excel`);
}

function exportRutasToExcel() {
    if (rutas.length === 0) {
        showNotification('warning', 'Sin datos', 'No hay rutas para exportar');
        return;
    }
    const data = rutas.map(r => {
        const asesor = asesores.find(a => a.id === r.asesorId);
        const clientesVisitados = r.clientesIds.map(id => clientes.find(c => c.id === id)).filter(c => c);
        const kmRecorridos = r.kmFinal && r.kmInicial ? (parseInt(r.kmFinal) - parseInt(r.kmInicial)) : 0;
        return {
            'ID': r.id, 'Asesor': asesor ? asesor.nombre : 'N/A', 'Fecha': r.fecha,
            'Hora Inicio': r.horaInicio, 'Hora Fin': r.horaFin || '', 'Zona': r.zona, 'Estado': r.estado,
            'Vehículo': r.vehiculo || '', 'Km Inicial': r.kmInicial || '0', 'Km Final': r.kmFinal || '0',
            'Km Recorridos': kmRecorridos, 'Clientes Visitados': clientesVisitados.map(c => c.nombre).join(', '),
            'Total Clientes': clientesVisitados.length, 'Observaciones': r.observaciones || ''
        };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rutas');
    XLSX.writeFile(wb, `Rutas_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('success', 'Exportación exitosa', `✅ ${rutas.length} rutas exportadas a Excel`);
}

function exportReportesToExcel() {
    const reporteAsesoresData = asesores.map(asesor => {
        const rutasAsesor = rutas.filter(r => r.asesorId === asesor.id);
        const rutasCompletadas = rutasAsesor.filter(r => r.estado === 'completada').length;
        const satisfaccionAsesor = satisfacciones.filter(s => {
            const ruta = rutas.find(r => r.id === s.rutaId);
            return ruta && ruta.asesorId === asesor.id;
        });
        const promedioSatisfaccion = satisfaccionAsesor.length > 0
            ? (satisfaccionAsesor.reduce((sum, s) => sum + parseInt(s.calificacion), 0) / satisfaccionAsesor.length).toFixed(1)
            : 'N/A';
        return {
            'Asesor': asesor.nombre, 'Tipo': asesor.tipo, 'Total Rutas': rutasAsesor.length,
            'Completadas': rutasCompletadas, 'Pendientes': rutasAsesor.length - rutasCompletadas,
            'Tasa de Éxito': rutasAsesor.length > 0 ? `${Math.round((rutasCompletadas / rutasAsesor.length) * 100)}%` : '0%',
            'Prom. Satisfacción': promedioSatisfaccion
        };
    });

    const clientesPorTipo = {};
    clientes.forEach(cliente => {
        clientesPorTipo[cliente.tipo] = (clientesPorTipo[cliente.tipo] || 0) + 1;
    });
    const reporteClientesData = Object.entries(clientesPorTipo).map(([tipo, cantidad]) => ({
        'Tipo de Cliente': tipo.charAt(0).toUpperCase() + tipo.slice(1),
        'Cantidad': cantidad,
        'Porcentaje': `${Math.round((cantidad / clientes.length) * 100)}%`
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(reporteAsesoresData);
    const ws2 = XLSX.utils.json_to_sheet(reporteClientesData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Rendimiento Asesores');
    XLSX.utils.book_append_sheet(wb, ws2, 'Clientes por Tipo');
    XLSX.writeFile(wb, `Reporte_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('success', 'Exportación exitosa', '✅ Reporte completo exportado a Excel');
}

// ===== GRÁFICOS =====
function updateCharts() {
    const rutasPorEstado = {
        planificada: rutas.filter(r => r.estado === 'planificada').length,
        'en-progreso': rutas.filter(r => r.estado === 'en-progreso').length,
        completada: rutas.filter(r => r.estado === 'completada').length,
        cancelada: rutas.filter(r => r.estado === 'cancelada').length
    };

    if (charts.rutasChart) charts.rutasChart.destroy();
    const ctx1 = document.getElementById('rutasChart').getContext('2d');
    charts.rutasChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Planificada', 'En Progreso', 'Completada', 'Cancelada'],
            datasets: [{
                data: Object.values(rutasPorEstado),
                backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Distribución de Rutas por Estado', font: { size: 16, weight: 'bold' } },
                legend: { position: 'bottom' }
            }
        }
    });

    const actividadAsesores = asesores.map(asesor => ({
        nombre: asesor.nombre,
        rutas: rutas.filter(r => r.asesorId === asesor.id).length
    })).sort((a, b) => b.rutas - a.rutas).slice(0, 10);

    if (charts.asesoresChart) charts.asesoresChart.destroy();
    const ctx2 = document.getElementById('asesoresChart').getContext('2d');
    charts.asesoresChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: actividadAsesores.map(a => a.nombre.length > 15 ? a.nombre.substring(0, 12) + '...' : a.nombre),
            datasets: [{
                label: 'Rutas Asignadas',
                data: actividadAsesores.map(a => a.rutas),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Top 10 Asesores por Cantidad de Rutas', font: { size: 16, weight: 'bold' } },
                legend: { display: false }
            },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function updateReportCharts() {
    const clientesPorTipo = {};
    clientes.forEach(cliente => {
        clientesPorTipo[cliente.tipo] = (clientesPorTipo[cliente.tipo] || 0) + 1;
    });

    if (charts.clientesTipoChart) charts.clientesTipoChart.destroy();
    const ctx3 = document.getElementById('clientesTipoChart').getContext('2d');
    charts.clientesTipoChart = new Chart(ctx3, {
        type: 'pie',
        data: {
            labels: Object.keys(clientesPorTipo).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
                data: Object.values(clientesPorTipo),
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Distribución de Clientes por Tipo', font: { size: 16, weight: 'bold' } },
                legend: { position: 'bottom' }
            }
        }
    });

    const rendimiento = asesores.map(asesor => {
        const rutasAsesor = rutas.filter(r => r.asesorId === asesor.id);
        const completadas = rutasAsesor.filter(r => r.estado === 'completada').length;
        return { nombre: asesor.nombre, completadas, pendientes: rutasAsesor.length - completadas };
    }).filter(a => a.completadas > 0 || a.pendientes > 0);

    if (charts.rendimientoChart) charts.rendimientoChart.destroy();
    const ctx4 = document.getElementById('rendimientoChart').getContext('2d');
    charts.rendimientoChart = new Chart(ctx4, {
        type: 'bar',
        data: {
            labels: rendimiento.map(a => a.nombre.length > 15 ? a.nombre.substring(0, 12) + '...' : a.nombre),
            datasets: [
                { label: 'Completadas', data: rendimiento.map(a => a.completadas), backgroundColor: 'rgba(40, 167, 69, 0.8)' },
                { label: 'Pendientes', data: rendimiento.map(a => a.pendientes), backgroundColor: 'rgba(255, 193, 7, 0.8)' }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Rendimiento de Asesores', font: { size: 16, weight: 'bold' } },
                legend: { position: 'bottom' }
            },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function updateSatisfaccionChart() {
    if (satisfacciones.length === 0) return;
    const calificaciones = [0, 0, 0, 0, 0];
    satisfacciones.forEach(s => {
        const calif = parseInt(s.calificacion);
        if (calif >= 1 && calif <= 5) calificaciones[calif - 1]++;
    });

    if (charts.satisfaccionChart) charts.satisfaccionChart.destroy();
    const ctx = document.getElementById('satisfaccionChart').getContext('2d');
    charts.satisfaccionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 ⭐', '2 ⭐⭐', '3 ⭐⭐⭐', '4 ⭐⭐⭐⭐', '5 ⭐⭐⭐⭐⭐'],
            datasets: [{
                label: 'Cantidad de Encuestas',
                data: calificaciones,
                backgroundColor: ['rgba(220, 53, 69, 0.8)', 'rgba(255, 193, 7, 0.8)', 'rgba(23, 162, 184, 0.8)', 'rgba(40, 167, 69, 0.8)', 'rgba(40, 167, 69, 1.0)']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Distribución de Calificaciones', font: { size: 16, weight: 'bold' } },
                legend: { display: false }
            },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// ===== CRUD ASESORES =====
document.getElementById('asesorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('asesorNombre').value.trim();
    const email = document.getElementById('asesorEmail').value.trim();
    const telefono = document.getElementById('asesorTelefono').value.trim();

    if (!nombre || nombre.length < 3) {
        showNotification('error', 'Error de validación', 'El nombre debe tener al menos 3 caracteres');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('error', 'Error de validación', 'Email inválido');
        return;
    }

    const asesor = {
        id: editingId && editingType === 'asesor' ? editingId : Date.now(),
        nombre, email, telefono,
        tipo: document.getElementById('asesorTipo').value,
        zona: document.getElementById('asesorZona').value,
        estado: document.getElementById('asesorEstado').value,
        fechaRegistro: new Date().toISOString()
    };

    if (editingId && editingType === 'asesor') {
        const index = asesores.findIndex(a => a.id === editingId);
        asesores[index] = asesor;
        editingId = null;
        editingType = null;
        showNotification('success', '✅ Asesor actualizado', `${asesor.nombre} ha sido actualizado`);
    } else {
        asesores.push(asesor);
        showNotification('success', '✅ Asesor registrado', `${asesor.nombre} ha sido agregado`);
    }
    this.reset();
    renderAsesores();
    updateAsesorSelects();
    saveToLocalStorage();
});

function renderAsesores() {
    const searchTerm = document.getElementById('searchAsesor').value.toLowerCase();
    const filtered = asesores.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm) ||
        a.email.toLowerCase().includes(searchTerm) ||
        a.telefono.includes(searchTerm)
    );
    const html = filtered.length === 0
        ? `<div class="empty-state"><h3>📭 No hay asesores registrados</h3></div>`
        : filtered.map(asesor => `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${asesor.nombre}</div>
                    <div>
                        <span class="badge badge-${asesor.estado === 'activo' ? 'success' : 'danger'}">${asesor.estado}</span>
                        <span class="badge badge-info">${asesor.tipo}</span>
                    </div>
                </div>
                <div class="card-info">
                    <div class="info-item"><span class="info-label">Email</span><span class="info-value">${asesor.email}</span></div>
                    <div class="info-item"><span class="info-label">Teléfono</span><span class="info-value">${asesor.telefono}</span></div>
                    <div class="info-item"><span class="info-label">Zona</span><span class="info-value">${asesor.zona}</span></div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-small btn-primary" onclick="editAsesor(${asesor.id})">✏️ Editar</button>
                    <button class="btn btn-small btn-danger" onclick="deleteAsesor(${asesor.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
    document.getElementById('asesoresList').innerHTML = html;
}

function editAsesor(id) {
    const asesor = asesores.find(a => a.id === id);
    if (!asesor) return;
    document.getElementById('asesorNombre').value = asesor.nombre;
    document.getElementById('asesorEmail').value = asesor.email;
    document.getElementById('asesorTelefono').value = asesor.telefono;
    document.getElementById('asesorTipo').value = asesor.tipo;
    document.getElementById('asesorZona').value = asesor.zona;
    document.getElementById('asesorEstado').value = asesor.estado;
    editingId = id;
    editingType = 'asesor';
    switchTab('asesores');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAsesor(id) {
    const asesor = asesores.find(a => a.id === id);
    if (!asesor) return;
    const rutasAsesor = rutas.filter(r => r.asesorId === id);
    if (rutasAsesor.length > 0) {
        showNotification('warning', '⚠️ Acción restringida', `El asesor tiene ${rutasAsesor.length} rutas asignadas`);
        return;
    }
    if (confirm(`¿Eliminar a ${asesor.nombre}?`)) {
        asesores = asesores.filter(a => a.id !== id);
        renderAsesores();
        updateAsesorSelects();
        saveToLocalStorage();
        showNotification('info', '✅ Asesor eliminado', `${asesor.nombre} ha sido eliminado`);
    }
}

function updateAsesorSelects() {
    const options = asesores.filter(a => a.estado === 'activo').map(a => `<option value="${a.id}">${a.nombre} - ${a.tipo}</option>`).join('');
    document.getElementById('routeAsesor').innerHTML = '<option value="">Seleccione un asesor</option>' + options;
    document.getElementById('filterRouteAsesor').innerHTML = '<option value="">Todos los asesores</option>' + options;
    document.getElementById('satisfaccionRuta').innerHTML = '<option value="">Seleccione una ruta completada</option>' +
        rutas.filter(r => r.estado === 'completada').map(r => {
            const asesor = asesores.find(a => a.id === r.asesorId);
            return `<option value="${r.id}">Ruta #${r.id} - ${asesor?.nombre || 'N/A'} (${formatDate(r.fecha)})</option>`;
        }).join('');
}

// ===== CRUD CLIENTES =====
document.getElementById('clienteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('clienteNombre').value.trim();
    const nit = document.getElementById('clienteNIT').value.trim();

    if (!nombre || nombre.length < 3) {
        showNotification('error', 'Error', 'Nombre inválido');
        return;
    }
    if (!nit || nit.length < 5) {
        showNotification('error', 'Error', 'NIT inválido');
        return;
    }

    const cliente = {
        id: editingId && editingType === 'cliente' ? editingId : Date.now(),
        nombre, nit,
        tipo: document.getElementById('clienteTipo').value,
        contacto: document.getElementById('clienteContacto').value,
        email: document.getElementById('clienteEmail').value,
        telefono: document.getElementById('clienteTelefono').value,
        direccion: document.getElementById('clienteDireccion').value,
        ciudad: document.getElementById('clienteCiudad').value,
        zona: document.getElementById('clienteZona').value,
        estado: document.getElementById('clienteEstado').value,
        notas: document.getElementById('clienteNotas').value || '',
        fechaRegistro: new Date().toISOString()
    };

    if (editingId && editingType === 'cliente') {
        const index = clientes.findIndex(c => c.id === editingId);
        clientes[index] = cliente;
        editingId = null;
        editingType = null;
        showNotification('success', '✅ Cliente actualizado', `${cliente.nombre} actualizado`);
    } else {
        clientes.push(cliente);
        showNotification('success', '✅ Cliente registrado', `${cliente.nombre} agregado`);
    }
    this.reset();
    renderClientes();
    updateClienteSelects();
    saveToLocalStorage();
});

function renderClientes() {
    const searchTerm = document.getElementById('searchCliente').value.toLowerCase();
    const filterTipo = document.getElementById('filterClienteTipo').value;
    const filterEstado = document.getElementById('filterClienteEstado').value;
    const filtered = clientes.filter(c =>
        (c.nombre.toLowerCase().includes(searchTerm) || c.nit.includes(searchTerm)) &&
        (filterTipo === '' || c.tipo === filterTipo) &&
        (filterEstado === '' || c.estado === filterEstado)
    );
    const html = filtered.length === 0
        ? `<div class="empty-state"><h3>📭 No hay clientes registrados</h3></div>`
        : filtered.map(cliente => `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${cliente.nombre}</div>
                    <div>
                        <span class="badge badge-${cliente.estado === 'activo' ? 'success' : 'danger'}">${cliente.estado}</span>
                        <span class="badge badge-primary">${cliente.tipo}</span>
                    </div>
                </div>
                <div class="card-info">
                    <div class="info-item"><span class="info-label">NIT</span><span class="info-value">${cliente.nit}</span></div>
                    <div class="info-item"><span class="info-label">Contacto</span><span class="info-value">${cliente.contacto}</span></div>
                    <div class="info-item"><span class="info-label">Teléfono</span><span class="info-value">${cliente.telefono}</span></div>
                    <div class="info-item"><span class="info-label">Ciudad</span><span class="info-value">${cliente.ciudad}</span></div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-small btn-primary" onclick="editCliente(${cliente.id})">✏️ Editar</button>
                    <button class="btn btn-small btn-danger" onclick="deleteCliente(${cliente.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
    document.getElementById('clientesList').innerHTML = html;
}

function editCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    document.getElementById('clienteNombre').value = cliente.nombre;
    document.getElementById('clienteNIT').value = cliente.nit;
    document.getElementById('clienteTipo').value = cliente.tipo;
    document.getElementById('clienteContacto').value = cliente.contacto;
    document.getElementById('clienteEmail').value = cliente.email;
    document.getElementById('clienteTelefono').value = cliente.telefono;
    document.getElementById('clienteDireccion').value = cliente.direccion;
    document.getElementById('clienteCiudad').value = cliente.ciudad;
    document.getElementById('clienteZona').value = cliente.zona;
    document.getElementById('clienteEstado').value = cliente.estado;
    document.getElementById('clienteNotas').value = cliente.notas;
    editingId = id;
    editingType = 'cliente';
    switchTab('clientes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    const enRutaActiva = rutas.some(r => r.estado !== 'completada' && r.clientesIds.includes(id));
    if (enRutaActiva) {
        showNotification('warning', '⚠️ Acción restringida', 'El cliente está en rutas activas');
        return;
    }
    if (confirm(`¿Eliminar a ${cliente.nombre}?`)) {
        clientes = clientes.filter(c => c.id !== id);
        rutas.forEach(r => { r.clientesIds = r.clientesIds.filter(cid => cid !== id); });
        renderClientes();
        updateClienteSelects();
        saveToLocalStorage();
        showNotification('info', '✅ Cliente eliminado', `${cliente.nombre} eliminado`);
    }
}

function updateClienteSelects() {
    const options = clientes.filter(c => c.estado === 'activo').map(c => `<option value="${c.id}">${c.nombre} - ${c.tipo}</option>`).join('');
    document.getElementById('routeClientes').innerHTML = options;
    document.getElementById('satisfaccionCliente').innerHTML = '<option value="">Seleccione un cliente</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.tipo})</option>`).join('');
}

// ===== CRUD RUTAS =====
document.getElementById('routeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const asesorId = parseInt(document.getElementById('routeAsesor').value);
    const fecha = document.getElementById('routeFecha').value;
    const horaInicio = document.getElementById('routeHoraInicio').value;
    const zona = document.getElementById('routeZona').value.trim();

    if (isNaN(asesorId) || !fecha || !horaInicio || !zona) {
        showNotification('error', 'Error', 'Complete todos los campos requeridos');
        return;
    }

    const selectedClientes = Array.from(document.getElementById('routeClientes').selectedOptions).map(o => parseInt(o.value));
    if (selectedClientes.length === 0) {
        showNotification('warning', '⚠️ Clientes requeridos', 'Seleccione al menos un cliente');
        return;
    }

    const kmInicial = document.getElementById('routeKmInicial').value;
    const kmFinal = document.getElementById('routeKmFinal').value;
    if (kmInicial && kmFinal && parseInt(kmFinal) < parseInt(kmInicial)) {
        showNotification('error', 'Error', 'Km final no puede ser menor que inicial');
        return;
    }

    const ruta = {
        id: editingId && editingType === 'ruta' ? editingId : Date.now(),
        asesorId, fecha, horaInicio,
        horaFin: document.getElementById('routeHoraFin').value || '',
        zona, estado: document.getElementById('routeEstado').value,
        vehiculo: document.getElementById('routeVehiculo').value || '',
        kmInicial: kmInicial || '0', kmFinal: kmFinal || '0',
        clientesIds: selectedClientes,
        observaciones: document.getElementById('routeObservaciones').value || '',
        fechaRegistro: new Date().toISOString()
    };

    if (editingId && editingType === 'ruta') {
        const index = rutas.findIndex(r => r.id === editingId);
        rutas[index] = ruta;
        editingId = null;
        editingType = null;
        showNotification('success', '✅ Ruta actualizada', 'Ruta modificada');
        document.getElementById('qrContainer').style.display = 'none';
    } else {
        rutas.unshift(ruta);
        showNotification('success', '✅ Ruta registrada', `Ruta para ${selectedClientes.length} cliente(s)`);
        document.getElementById('generateQrBtn').style.display = 'block';
        document.getElementById('generateQrBtn').onclick = () => generateQRForRoute(ruta.id);
    }
    this.reset();
    document.getElementById('qrContainer').style.display = 'none';
    renderRutas();
    updateDashboard();
    updateCharts();
    saveToLocalStorage();
});

function renderRutas() {
    const filterAsesor = document.getElementById('filterRouteAsesor').value;
    const filterEstado = document.getElementById('filterRouteEstado').value;
    const filterFecha = document.getElementById('filterRouteFecha').value;
    const filtered = rutas.filter(r =>
        (filterAsesor === '' || r.asesorId === parseInt(filterAsesor)) &&
        (filterEstado === '' || r.estado === filterEstado) &&
        (filterFecha === '' || r.fecha === filterFecha)
    );
    const html = filtered.length === 0
        ? `<div class="empty-state"><h3>📭 No hay rutas registradas</h3></div>`
        : filtered.map(ruta => {
            const asesor = asesores.find(a => a.id === ruta.asesorId);
            const clientesVisitados = ruta.clientesIds.map(id => clientes.find(c => c.id === id)).filter(c => c);
            const kmRecorridos = ruta.kmFinal && ruta.kmInicial ? (parseInt(ruta.kmFinal) - parseInt(ruta.kmInicial)) : 0;
            return `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><strong>${asesor ? asesor.nombre : '⚠️ No encontrado'}</strong></div>
                        <span class="badge badge-${ruta.estado === 'completada' ? 'success' : ruta.estado === 'cancelada' ? 'danger' : 'warning'}">${ruta.estado}</span>
                    </div>
                    <div class="card-info">
                        <div class="info-item"><span class="info-label">Fecha</span><span class="info-value">${formatDate(ruta.fecha)}</span></div>
                        <div class="info-item"><span class="info-label">Zona</span><span class="info-value">${ruta.zona}</span></div>
                        <div class="info-item"><span class="info-label">Clientes</span><span class="info-value">${clientesVisitados.length}</span></div>
                        ${kmRecorridos > 0 ? `<div class="info-item"><span class="info-label">Km</span><span class="info-value">${kmRecorridos} km</span></div>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-small btn-primary" onclick="editRuta(${ruta.id})">✏️ Editar</button>
                        ${ruta.estado !== 'completada' && ruta.estado !== 'cancelada' ? `<button class="btn btn-small btn-success" onclick="completarRuta(${ruta.id})">✅ Completar</button>` : ''}
                        <button class="btn btn-small btn-info" onclick="generateQRForRoute(${ruta.id})">📱 QR</button>
                        <button class="btn btn-small btn-danger" onclick="deleteRuta(${ruta.id})">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');
    document.getElementById('routesList').innerHTML = html;
}

function editRuta(id) {
    const ruta = rutas.find(r => r.id === id);
    if (!ruta) return;
    document.getElementById('routeAsesor').value = ruta.asesorId;
    document.getElementById('routeFecha').value = ruta.fecha;
    document.getElementById('routeHoraInicio').value = ruta.horaInicio;
    document.getElementById('routeHoraFin').value = ruta.horaFin;
    document.getElementById('routeZona').value = ruta.zona;
    document.getElementById('routeEstado').value = ruta.estado;
    document.getElementById('routeVehiculo').value = ruta.vehiculo;
    document.getElementById('routeKmInicial').value = ruta.kmInicial;
    document.getElementById('routeKmFinal').value = ruta.kmFinal;
    document.getElementById('routeObservaciones').value = ruta.observaciones;
    const select = document.getElementById('routeClientes');
    Array.from(select.options).forEach(option => {
        option.selected = ruta.clientesIds.includes(parseInt(option.value));
    });
    editingId = id;
    editingType = 'ruta';
    document.getElementById('generateQrBtn').style.display = 'none';
    switchTab('rutas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function completarRuta(id) {
    const ruta = rutas.find(r => r.id === id);
    if (!ruta) return;
    ruta.estado = 'completada';
    ruta.horaFin = ruta.horaFin || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    renderRutas();
    updateDashboard();
    updateCharts();
    updateSatisfaccionSelects();
    saveToLocalStorage();
    showNotification('success', '✅ Ruta completada', `Ruta #${ruta.id} completada`);
}

function deleteRuta(id) {
    const ruta = rutas.find(r => r.id === id);
    if (!ruta) return;
    if (ruta.estado === 'completada') {
        showNotification('warning', '⚠️ Acción restringida', 'No se pueden eliminar rutas completadas');
        return;
    }
    if (confirm(`¿Eliminar ruta #${ruta.id}?`)) {
        rutas = rutas.filter(r => r.id !== id);
        renderRutas();
        updateDashboard();
        updateCharts();
        saveToLocalStorage();
        showNotification('info', '✅ Ruta eliminada', `Ruta #${ruta.id} eliminada`);
    }
}

// ===== SATISFACCIÓN =====
function updateSatisfaccionSelects() {
    document.getElementById('satisfaccionRuta').innerHTML = '<option value="">Seleccione una ruta completada</option>' +
        rutas.filter(r => r.estado === 'completada').map(r => {
            const asesor = asesores.find(a => a.id === r.asesorId);
            return `<option value="${r.id}">Ruta #${r.id} - ${asesor?.nombre || 'N/A'} (${formatDate(r.fecha)})</option>`;
        }).join('');
    document.getElementById('satisfaccionCliente').innerHTML = '<option value="">Seleccione un cliente</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.tipo})</option>`).join('');
}

document.getElementById('satisfaccionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const rutaId = parseInt(document.getElementById('satisfaccionRuta').value);
    const clienteId = parseInt(document.getElementById('satisfaccionCliente').value);
    const calificacion = document.getElementById('satisfaccionCalificacion').value;
    const fecha = document.getElementById('satisfaccionFecha').value;

    if (isNaN(rutaId) || isNaN(clienteId) || !calificacion || !fecha) {
        showNotification('error', 'Error', 'Todos los campos son obligatorios');
        return;
    }

    const existe = satisfacciones.some(s => s.rutaId === rutaId && s.clienteId === clienteId);
    if (existe) {
        showNotification('warning', '⚠️ Duplicado', 'Ya existe encuesta para este cliente en esta ruta');
        return;
    }

    const satisfaccion = {
        id: Date.now(), rutaId, clienteId, calificacion, fecha,
        comentarios: document.getElementById('satisfaccionComentarios').value || '',
        fechaRegistro: new Date().toISOString()
    };

    satisfacciones.push(satisfaccion);
    this.reset();
    renderSatisfacciones();
    updateSatisfaccionChart();
    saveToLocalStorage();
    const promedio = (satisfacciones.reduce((sum, s) => sum + parseInt(s.calificacion), 0) / satisfacciones.length).toFixed(1);
    showNotification('success', '✅ Satisfacción registrada', `Calificación ${calificacion}⭐ - Promedio: ${promedio}⭐`);
});

function renderSatisfacciones() {
    if (satisfacciones.length === 0) {
        document.getElementById('satisfaccionList').innerHTML = `<div class="empty-state"><h3>📭 No hay encuestas</h3></div>`;
        return;
    }
    const sorted = [...satisfacciones].sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)).slice(0, 10);
    const html = `
        <table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Ruta</th><th>Calificación</th><th>Comentarios</th></tr></thead>
            <tbody>
                ${sorted.map(s => {
                    const cliente = clientes.find(c => c.id === s.clienteId);
                    const ruta = rutas.find(r => r.id === s.rutaId);
                    const asesor = ruta ? asesores.find(a => a.id === ruta.asesorId) : null;
                    const estrellas = '⭐'.repeat(parseInt(s.calificacion)) + '☆'.repeat(5 - parseInt(s.calificacion));
                    return `<tr>
                        <td>${formatDate(s.fecha)}</td>
                        <td>${cliente ? cliente.nombre : 'N/A'}</td>
                        <td>${asesor ? asesor.nombre : 'N/A'}</td>
                        <td><strong style="color: ${parseInt(s.calificacion) >= 4 ? '#28a745' : '#dc3545'}">${estrellas}</strong></td>
                        <td>${s.comentarios || 'Sin comentarios'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('satisfaccionList').innerHTML = html;
}

// ===== DASHBOARD =====
function updateDashboard() {
    const stats = {
        totalAsesores: asesores.length,
        asesoresActivos: asesores.filter(a => a.estado === 'activo').length,
        totalClientes: clientes.length,
        clientesActivos: clientes.filter(c => c.estado === 'activo').length,
        totalRutas: rutas.length,
        rutasCompletadas: rutas.filter(r => r.estado === 'completada').length,
        rutasPendientes: rutas.filter(r => r.estado === 'planificada' || r.estado === 'en-progreso').length,
        promedioSatisfaccion: satisfacciones.length > 0
            ? (satisfacciones.reduce((sum, s) => sum + parseInt(s.calificacion), 0) / satisfacciones.length).toFixed(1)
            : 'N/A'
    };

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card" onclick="switchTab('asesores')"><div class="stat-value">${stats.asesoresActivos}/${stats.totalAsesores}</div><div class="stat-label">Asesores Activos</div></div>
        <div class="stat-card" onclick="switchTab('clientes')"><div class="stat-value">${stats.clientesActivos}/${stats.totalClientes}</div><div class="stat-label">Clientes Activos</div></div>
        <div class="stat-card" onclick="switchTab('rutas')"><div class="stat-value">${stats.rutasCompletadas}</div><div class="stat-label">Rutas Completadas</div></div>
        <div class="stat-card" onclick="switchTab('rutas')"><div class="stat-value">${stats.rutasPendientes}</div><div class="stat-label">Rutas Pendientes</div></div>
        <div class="stat-card" style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);" onclick="switchTab('satisfaccion')"><div class="stat-value">${stats.promedioSatisfaccion}${stats.promedioSatisfaccion !== 'N/A' ? '⭐' : ''}</div><div class="stat-label">Satisfacción Promedio</div></div>
    `;

    const recentRutas = rutas.slice(0, 5);
    const activityHtml = recentRutas.length === 0
        ? `<div class="empty-state"><h3>📭 Sin actividad reciente</h3></div>`
        : recentRutas.map(ruta => {
            const asesor = asesores.find(a => a.id === ruta.asesorId);
            const clientesVisitados = ruta.clientesIds.map(id => clientes.find(c => c.id === id)).filter(c => c);
            return `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">${asesor ? asesor.nombre : 'Desconocido'} - ${formatDate(ruta.fecha)}</div>
                        <span class="badge badge-${ruta.estado === 'completada' ? 'success' : 'warning'}">${ruta.estado}</span>
                    </div>
                    <div class="card-info">
                        <div class="info-item"><span class="info-label">Zona</span><span class="info-value">${ruta.zona}</span></div>
                        <div class="info-item"><span class="info-label">Clientes</span><span class="info-value">${clientesVisitados.length}</span></div>
                    </div>
                </div>
            `;
        }).join('');
    document.getElementById('recentActivity').innerHTML = activityHtml;
}

// ===== REPORTES =====
function updateReportes() {
    const reporteAsesoresData = asesores.map(asesor => {
        const rutasAsesor = rutas.filter(r => r.asesorId === asesor.id);
        const rutasCompletadas = rutasAsesor.filter(r => r.estado === 'completada').length;
        const satisfaccionAsesor = satisfacciones.filter(s => {
            const ruta = rutas.find(r => r.id === s.rutaId);
            return ruta && ruta.asesorId === asesor.id;
        });
        const promedioSatisfaccion = satisfaccionAsesor.length > 0
            ? (satisfaccionAsesor.reduce((sum, s) => sum + parseInt(s.calificacion), 0) / satisfaccionAsesor.length).toFixed(1)
            : 'N/A';
        return { asesor, totalRutas: rutasAsesor.length, completadas: rutasCompletadas, pendientes: rutasAsesor.length - rutasCompletadas, promedioSatisfaccion };
    }).filter(data => data.totalRutas > 0);

    const reporteAsesoresHtml = reporteAsesoresData.length === 0
        ? `<div class="empty-state"><h3>📭 No hay datos</h3></div>`
        : `
            <table>
                <thead><tr><th>Asesor</th><th>Tipo</th><th>Total</th><th>Completadas</th><th>Pendientes</th><th>Éxito</th><th>Satisfacción ⭐</th></tr></thead>
                <tbody>
                    ${reporteAsesoresData.map(data => `
                        <tr>
                            <td>${data.asesor.nombre}</td>
                            <td>${data.asesor.tipo}</td>
                            <td>${data.totalRutas}</td>
                            <td>${data.completadas}</td>
                            <td>${data.pendientes}</td>
                            <td>${data.totalRutas > 0 ? Math.round((data.completadas / data.totalRutas) * 100) : 0}%</td>
                            <td>${data.promedioSatisfaccion}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    document.getElementById('reporteAsesores').innerHTML = reporteAsesoresHtml;

    const clientesPorTipo = {};
    clientes.forEach(cliente => { clientesPorTipo[cliente.tipo] = (clientesPorTipo[cliente.tipo] || 0) + 1; });
    const reporteClientesHtml = Object.keys(clientesPorTipo).length === 0
        ? `<div class="empty-state"><h3>📭 No hay clientes</h3></div>`
        : `
            <table>
                <thead><tr><th>Tipo</th><th>Cantidad</th><th>Porcentaje</th></tr></thead>
                <tbody>
                    ${Object.entries(clientesPorTipo).map(([tipo, cantidad]) => `
                        <tr><td>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</td><td>${cantidad}</td><td>${Math.round((cantidad / clientes.length) * 100)}%</td></tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    document.getElementById('reporteClientes').innerHTML = reporteClientesHtml;
}

// ===== EVENT LISTENERS =====
document.getElementById('searchAsesor').addEventListener('input', renderAsesores);
document.getElementById('searchCliente').addEventListener('input', renderClientes);
document.getElementById('filterClienteTipo').addEventListener('change', renderClientes);
document.getElementById('filterClienteEstado').addEventListener('change', renderClientes);
document.getElementById('filterRouteAsesor').addEventListener('change', renderRutas);
document.getElementById('filterRouteEstado').addEventListener('change', renderRutas);
document.getElementById('filterRouteFecha').addEventListener('change', renderRutas);