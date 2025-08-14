# 6. Despliegue Portfolio Profesional

## 🎯 **Objetivo del Capítulo**

Documentar el proceso de implementación de un stack web completo para hospedar mi portfolio profesional en Orange Pi 5 Plus. Este capítulo explica las decisiones técnicas, errores cometidos y lecciones aprendidas durante el despliegue de mi plataforma personal de empleabilidad.

---

## 🌐 **¿Por qué Portfolio Propio en Orange Pi?**

### **💼 Motivación Profesional**
El objetivo principal era crear una plataforma que demostrara competencias técnicas reales, no solo teóricas. Un portfolio alojado en mi propio servidor ARM64 ofrece:

- **Demostración práctica**: Evidencia tangible de administración de sistemas
- **Control total**: Libertad para experimentar y personalizar sin restricciones
- **Diferenciador único**: Muy pocos desarrolladores junior tienen infraestructura propia
- **Coste cero**: Inversión única vs gastos mensuales hosting
- **Historia técnica**: El servidor mismo cuenta la historia de mis competencias

### **🎯 Objetivos Específicos del Portfolio**
- **Showcase personal**: Plataforma centralizada para mostrar proyectos y competencias técnicas
- **Proyectos destacados**: IncluyeteEstepon@ y desarrollos Spring Boot
- **Integración técnica**: Demostrar capacidades full-stack y administración sistemas
- **Aprendizaje continuo**: Documentar evolución de conocimientos técnicos

---

## 🚀 **Decisión Stack Tecnológico**

### **🤔 Proceso de Selección**

#### **Análisis de Alternativas**
Evalué tres opciones principales:

1. **LAMP Stack (Elegido)**
   - ✅ Reconocimiento empresarial alto
   - ✅ Documentación extensa, comunidad activa
   - ✅ Integración natural con MySQL Docker existente
   - ❌ Más configuración inicial que alternativas

2. **NGINX + Node.js**
   - ✅ Performance superior, stack moderno
   - ❌ Curva aprendizaje adicional
   - ❌ Menos reconocimiento en entorno empresarial tradicional

3. **Static Site + Netlify**
   - ✅ Simplicidad máxima
   - ❌ No demuestra competencias backend/ops
   - ❌ Dependencia externa, menos control

### **🎯 Stack Final Implementado**
- **Apache 2.4**: Estabilidad probada, amplia adopción empresarial
- **PHP 8.3**: Versión moderna con mejoras performance significativas
- **MySQL 8.0**: Reutilizando container Docker existente
- **Frontend moderno**: HTML5, CSS3, JavaScript ES6+ responsive

---

## 🤦‍♂️ **Errores Cometidos y Lecciones Aprendidas**

### **Error #1: SSL como "Feature Posterior"**
**🚨 El Problema**: Desarrollé inicialmente solo con HTTP, pensando "después configuro SSL"

**💥 Impacto Real**:
- Warnings del navegador inmediatos
- Tiempo perdido reconfigurando después

**✅ Solución Aplicada**: 
Implementé SSL desde el primer día con Let's Encrypt, configurando redirects automáticos HTTP→HTTPS

**📚 Lección Crítica**: 
HTTPS no es opcional en 2024/2025. Es estándar mínimo desde el minuto 1, no "mejora futura"

### **Error #2: Permisos "Fáciles" 777**
**🚨 El Problema**: Por simplicidad inicial, asigné permisos 777 a directorios web

**💥 Impacto Real**:
- Vulnerabilidad de seguridad significativa
- Mala práctica profesional documentada
- Potencial exposición en servidor público

**✅ Solución Aplicada**:
Implementé permisos granulares: 755 directorios, 644 archivos, ownership www-data correcto

**📚 Lección Crítica**:
La seguridad nunca se sacrifica por conveniencia. Los shortcuts crean deuda técnica peligrosa

### **Error #3: Configuración Hardcodeada**
**🚨 El Problema**: Inserté credenciales y configuraciones directamente en código PHP

**💥 Impacto Real**:
- Exposición datos sensibles en repositories
- Dificultad cambios entre entornos
- Mala práctica desarrollo profesional

**✅ Solución Aplicada**:
Variables de entorno desde primer commit, archivo .env con .gitignore adecuado

**📚 Lección Crítica**:
La configuración externa no es "buena práctica futura", es requisito desde día 1

---

## ⚙️ **Proceso de Implementación**

### **🔧 Fase 1: Fundación Stack Web**

#### **Decisiones de Configuración**
- **Puerto personalizado**: Configuré Apache en un puerto alternativo para permitir coexistencia con Nginx como reverse proxy
- **Virtual host específico**: Implementé configuración dedicada para el portfolio con logs separados para troubleshooting
- **Módulos selectivos**: Solo habilité los módulos Apache necesarios para minimizar superficie de ataque
- **Integración Docker**: Establecí conexión directa con el container MySQL existente

#### **Estructura de Aplicación Planificada**
Diseñé una arquitectura web organizada con separación clara de responsabilidades: páginas públicas, API endpoints, configuración centralizada, assets optimizados y dependencias gestionadas profesionalmente.

### **🔧 Fase 2: Desarrollo de Contenido**

#### **Configuración Apache Virtual Host**
```apache
# Configuración base para portfolio
<VirtualHost *:PUERTO_PERSONALIZADO>
    ServerName mi-portfolio.dominio.org
    DocumentRoot /var/www/portfolio
    
    # Logs separados para troubleshooting
    ErrorLog ${APACHE_LOG_DIR}/portfolio_error.log
    CustomLog ${APACHE_LOG_DIR}/portfolio_access.log combined
    
    # Headers de seguridad básicos
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # Configuración PHP
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
    
    # Permisos de directorio
    <Directory /var/www/portfolio>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### **Estrategia de Contenido**
- **Información personal**: Presentación como desarrollador con experiencia en gestión de equipos
- **Experiencia previa**: 6 años de liderazgo como base para competencias organizacionales
- **Proyecto social**: IncluyeteEstepon@ como evidencia de impacto real y capacidad técnica
- **Stack técnico visible**: Java 17, Spring Boot, MySQL claramente expuestos

#### **Funcionalidades Implementadas**
- **Responsive design**: Diseño mobile-first con progressive enhancement
- **API tiempo real**: Endpoint para métricas Orange Pi en vivo como demostración técnica
- **SEO básico**: Meta tags y estructura semántica implementados
- **Performance optimizado**: Objetivo <2 segundos tiempo de carga

#### **API de Monitoreo - Ejemplo Implementación**
```php
<?php
// api/system-status.php - API básica para métricas servidor
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function getBasicSystemInfo() {
    $data = [];
    
    // CPU Load Average
    $load = sys_getloadavg();
    $data['cpu_load'] = round($load[0], 2);
    
    // Memory usage básico
    $memory = shell_exec('free -m | grep "Mem:"');
    if ($memory) {
        $mem_info = preg_split('/\s+/', trim($memory));
        $data['memory'] = [
            'total' => (int)$mem_info[1],
            'used' => (int)$mem_info[2],
            'free' => (int)$mem_info[3]
        ];
    }
    
    // Uptime
    $uptime = shell_exec('uptime -p');
    $data['uptime'] = trim($uptime);
    
    // Timestamp
    $data['timestamp'] = date('Y-m-d H:i:s');
    
    return $data;
}

try {
    $systemInfo = getBasicSystemInfo();
    echo json_encode([
        'success' => true,
        'data' => $systemInfo
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'System information unavailable'
    ]);
}
?>
```

#### **Frontend JavaScript para Métricas Live**
```javascript
// assets/js/live-monitoring.js
class PortfolioMonitoring {
    constructor() {
        this.apiEndpoint = '/api/system-status.php';
        this.updateInterval = 10000; // 10 segundos
        this.init();
    }
    
    async fetchSystemData() {
        try {
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) throw new Error('API response error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching system data:', error);
            return null;
        }
    }
    
    updateUI(data) {
        if (!data || !data.success) return;
        
        const info = data.data;
        
        // Update CPU info
        const cpuElement = document.getElementById('cpu-load');
        if (cpuElement) {
            cpuElement.textContent = `${info.cpu_load}`;
            cpuElement.className = this.getLoadClass(info.cpu_load);
        }
        
        // Update memory info
        if (info.memory) {
            const memUsed = document.getElementById('memory-used');
            const memTotal = document.getElementById('memory-total');
            if (memUsed) memUsed.textContent = `${info.memory.used}MB`;
            if (memTotal) memTotal.textContent = `${info.memory.total}MB`;
        }
        
        // Update uptime
        const uptimeElement = document.getElementById('uptime');
        if (uptimeElement) uptimeElement.textContent = info.uptime;
        
        // Update timestamp
        const timestampElement = document.getElementById('last-update');
        if (timestampElement) timestampElement.textContent = info.timestamp;
    }
    
    getLoadClass(load) {
        if (load < 1.0) return 'load-low';
        if (load < 2.0) return 'load-medium';
        return 'load-high';
    }
    
    async init() {
        // Initial update
        const data = await this.fetchSystemData();
        this.updateUI(data);
        
        // Set up periodic updates
        setInterval(async () => {
            const data = await this.fetchSystemData();
            this.updateUI(data);
        }, this.updateInterval);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioMonitoring();
});
```

---

## 📊 **Resultados Alcanzados**

### **🎯 Objetivos Cumplidos**
- ✅ **Portfolio funcionando**: Plataforma personal activa 24/7
- ✅ **Demostración técnica**: Servidor ARM64 + stack web como evidencia práctica
- ✅ **Aprendizaje aplicado**: Experiencia previa + competencias técnicas modernas
- ✅ **Infraestructura propia**: Control total vs dependencias externas

### **📈 Métricas Observadas**
Durante el desarrollo y deployment, monitoricé:
- **Tiempo de respuesta**: API endpoints responden consistentemente
- **Disponibilidad**: Servidor mantiene uptime estable
- **Compatibilidad móvil**: Diseño responsive verificado en múltiples dispositivos
- **Performance**: Tiempos de carga optimizados para Orange Pi ARM64

*Nota: Métricas específicas serán implementadas en Capítulo 7 con herramientas de monitorización profesional*

---

## 🔗 **Integración con Ecosystem Orange Pi**

### **🐳 Conexión Servicios Docker**
- **MySQL compartido**: Reutilización eficiente del container existente
- **Network bridge**: Comunicación interna optimizada entre servicios
- **Backup integrado**: Datos del portfolio incluidos en rutinas de respaldo automáticas
- **Monitoreo unificado**: Métricas agregadas en dashboard central del servidor

### **🌐 Reverse Proxy Configuration**
- **SSL termination**: Nginx maneja certificados de forma centralizada
- **Static caching**: Assets servidos con optimización Nginx para mejor performance
- **Port routing**: Apache backend transparente para usuarios finales
- **Load balancing ready**: Arquitectura preparada para escalamiento futuro

---



### **📅 Timeline Profesional Claro**
- **Disponibilidad**: Julio 2026 comunicada claramente
- **Progresión**: Documentación del learning path desde gestión a desarrollo
- **Objetivos**: Transición profesional planificada y ejecutada

---

## 🔧 **Preparación Para Monitorización**

### **📊 Baseline Métricas Establecido**
Con el portfolio funcionando, tengo baseline sólido para:
- **Performance web**: Tiempo respuesta, throughput de aplicación
- **Resource usage**: CPU, memoria específico para aplicación web
- **User behavior**: Patrones de acceso, páginas más populares
- **Error tracking**: Logs de aplicación vs sistema operativo

### **🎯 Próximos Pasos Monitoreo**
El Capítulo 7 se centrará en implementar monitorización profesional que permita:
- **Alertas proactivas**: Detectar problemas antes de afectar usuarios
- **Capacity planning**: Escalamiento basado en datos reales de uso
- **Performance optimization**: Identificación de bottlenecks específicos
- **Professional dashboards**: Visualización de métricas para portfolio

---

## 📝 **Reflexión Personal del Proceso**

### **✅ Aciertos Estratégicos**
- **Portfolio como laboratorio**: Plataforma práctica para experimentar y aprender
- **Errores documentados**: Proceso de learning iterativo y mejora continua
- **Integración holística**: Website como parte del ecosystem técnico completo
- **Competencias diversas**: Combinación experiencia gestión + desarrollo técnico

### **🎯 Lecciones Para Futuros Proyectos**
- **Security first**: Estándares de seguridad desde el primer commit
- **Configuration management**: Variables de entorno como práctica estándar
- **Performance focus**: Optimización mobile-first y monitorización continua
- **Documentation driven**: Documentar proceso y decisiones, no solo resultados

### **💡 Valor del Aprendizaje**
Este portfolio representa más que una página web - es evidencia tangible de competencias full-stack aplicadas, desde administración de hardware hasta desarrollo frontend, documentando un journey de aprendizaje real con errores auténticos y soluciones verificadas.

---

## 🔧 **Preparación Siguiente Fase**

### **📋 Portfolio Base Completo**
- ✅ **Stack web** optimizado ARM64 funcionando
- ✅ **Contenido estratégico** enfocado en competencias técnicas
- ✅ **Performance baseline** establecido para optimización
- ✅ **Security basics** implementados desde inicio
- ✅ **Integration** con servicios Docker seamless

### **🎯 Próximo Capítulo: Monitorización Avanzada**
Con portfolio funcionando de forma estable, el siguiente paso lógico es implementar monitorización profesional que demuestre competencias DevOps y permita optimización basada en datos reales.

---

*Capítulo completado: Portfolio profesional desplegado exitosamente como plataforma de aprendizaje técnico, documentando proceso, errores y lecciones para demostrar competencias reales de desarrollo full-stack*

