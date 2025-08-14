# 7. Monitorización Avanzada

## 🎯 **Objetivo del Capítulo**

Implementar un sistema de monitorización profesional en Orange Pi 5 Plus usando Netdata, configurado específicamente para arquitectura ARM64. Este capítulo documenta el proceso de setup, configuraciones aplicadas, y lecciones aprendidas sobre monitorización de sistemas en tiempo real.

---

## 📊 **¿Por qué Netdata para Orange Pi 5 Plus?**

### **🚀 Ventajas Técnicas ARM64**
- **Performance nativo**: Binarios optimizados para arquitectura RK3588
- **Footprint ligero**: Consumo memoria mínimo en sistemas embebidos
- **Real-time monitoring**: Métricas cada segundo sin overhead significativo
- **Auto-discovery**: Detección automática servicios Docker y sistema
- **Web interface**: Dashboard accesible remotamente

### **🎯 Objetivos de Aprendizaje**
- **Competencias DevOps**: Implementar monitorización profesional
- **Troubleshooting**: Herramientas diagnóstico de performance
- **Optimización**: Identificar bottlenecks y patrones de uso
- **Alertas proactivas**: Detección temprana de problemas

---

## 🚀 **Instalación Netdata ARM64**

### **📦 Método Script Oficial**

#### **1. 🔄 Preparación Sistema**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Dependencias para compilación ARM64
sudo apt install -y \
    curl \
    git \
    build-essential \
    autoconf \
    automake \
    pkg-config \
    zlib1g-dev \
    uuid-dev \
    libmnl-dev \
    gcc \
    make \
    libuv1-dev \
    liblz4-dev \
    libjudy-dev \
    libssl-dev \
    libelf-dev
```

#### **2. 🎯 Instalación Automática**
```bash
# Script oficial Netdata (detecta ARM64 automáticamente)
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --stable-channel

# Instalación interactiva:
# - Channel: stable
# - Anonymous statistics: Yes (para mejorar Netdata)
# - Auto-update: Yes
# - Install path: /opt/netdata
```

#### **3. ✅ Verificación Instalación**
```bash
# Verificar servicio activo
sudo systemctl status netdata
# ● netdata.service - Real time performance monitoring
#    Loaded: loaded (/etc/systemd/system/netdata.service; enabled; vendor preset: enabled)
#    Active: active (running) ✅

# Verificar puerto
sudo netstat -tlnp | grep 19999
# tcp6  0  0  :::19999  :::*  LISTEN  xxx/netdata ✅

# Test acceso web
curl -I http://localhost:19999
# HTTP/1.1 200 OK ✅
```

---

## ⚙️ **Configuración Personalizada Orange Pi**

### **🔧 Configuración Principal**

#### **1. 📝 Configuración Netdata Optimizada**
```ini
# /etc/netdata/netdata.conf - Configuración base
[global]
    # Identificación del servidor
    hostname = mi-orangepi-server
    
    # Optimización para ARM64
    run as user = netdata
    web files owner = root
    web files group = netdata
    
    # Gestión memoria (ajustado para 16GB disponible)
    page cache size = 32
    history = 3600          # 1 hora de historial
    update every = 1        # Actualización cada segundo
    
    # Configuración red
    bind socket to IP = 0.0.0.0
    default port = 19999
    allow connections from = localhost 192.168.*.*
    
[web]
    # Interfaz web
    web files directory = /usr/share/netdata/web
    respect do not track policy = yes
    allow dashboard from = localhost 192.168.*.*
    
[plugins]
    # Habilitar plugins principales
    go.d = yes
    python.d = yes
    proc = yes
    diskspace = yes
    cgroups = yes
    
[plugin:proc]
    # Métricas sistema detalladas
    /proc/net/dev = yes
    /proc/diskstats = yes
    /proc/stat = yes
    /proc/meminfo = yes
    /proc/loadavg = yes
```
    
    # Memoria optimizada (16GB disponible)
    page cache size = 32
    history = 3600
    
    # Seguridad
    bind socket to IP = 0.0.0.0
    default port = 19999
    allow connections from = localhost 192.168.0.*
    
    # Update frequency
    update every = 1
    
[web]
    # Interfaz web
    web files directory = /usr/share/netdata/web
    respect do not track policy = yes
    allow dashboard from = localhost 192.168.0.*
    
[plugins]
    # Habilitar plugins específicos
    enable running pid file = yes
    
    # Docker monitoring
    go.d = yes
    python.d = yes
    node.d = yes
    
    # System monitoring
    proc = yes
    diskspace = yes
    cgroups = yes
    
[plugin:proc]
    # Métricas sistema detalladas
    /proc/net/dev = yes
    /proc/diskstats = yes
    /proc/stat = yes
    /proc/meminfo = yes
    /proc/loadavg = yes
```

#### **2. 🔄 Aplicar Configuración**
```bash
# Verificar configuración válida
sudo netdata -t

# Reiniciar con nueva configuración
sudo systemctl restart netdata

# Verificar logs
sudo journalctl -u netdata -f
```

---

## 🐳 **Monitoreo Docker Integrado**

### **🎯 Configuración Docker Plugin**

#### **1. 📊 Docker Metrics Automáticas**
```yaml
# /etc/netdata/go.d/docker.conf
jobs:
  - name: local_docker
    url: unix:///var/run/docker.sock
    timeout: 5
    
    # Métricas específicas
    collect_container_size: yes
    collect_container_logs: yes
    
    # Filtros containers
    container_name_include:
      - "*"
    container_name_exclude:
      - "netdata"
```

#### **2. 🔍 Verificar Detección Docker**
```bash
# Verificar plugin Docker activo
sudo grep -i docker /var/log/netdata/error.log

# Ver containers detectados
curl -s "http://localhost:19999/api/v1/charts" | grep docker

# Dashboard Docker específico
# URL: http://IP_LOCAL:19999/#menu_docker
```

### **📈 Métricas Docker Monitoreadas**
A través de la integración automática, Netdata proporciona:
- **Container Status**: Estado running/stopped/paused por container
- **CPU Usage**: Consumo CPU individual por container
- **Memory Usage**: RAM + Swap utilizada por container
- **Network I/O**: Tráfico red entrante/saliente por container
- **Disk I/O**: Operaciones lectura/escritura por container
- **Logs Volume**: Tamaño y crecimiento logs por container

#### **Configuración Personalizada Docker Monitoring**
```yaml
# /etc/netdata/go.d/docker_custom.conf
jobs:
  - name: local_docker_extended
    url: unix:///var/run/docker.sock
    timeout: 5
    
    # Métricas extendidas
    collect_container_size: yes
    collect_container_logs: yes
    collect_networks: yes
    collect_volumes: yes
    
    # Filtrado inteligente
    container_name_include:
      - "mysql*"
      - "web*"
      - "app*"
    container_name_exclude:
      - "netdata"
      - "*_test"
```

---

## 🌡️ **Monitoreo Hardware ARM64 Específico**

### **🔧 Sensores Temperatura RK3588**

#### **1. 📊 Configuración Sensores**
```bash
# Verificar sensores disponibles
sudo sensors-detect --auto

# Ver temperatura actual
sensors
# acpi-0
# Adapter: ACPI interface
# temp1:        +45.0°C  (crit = +105.0°C)

# rk3588-thermal
# Adapter: Virtual device
# temp1:        +42.8°C  
```

#### **2. 🌡️ Plugin Temperatura Personalizado**
```python
# /etc/netdata/python.d/rk3588_temp.chart.py
# -*- coding: utf-8 -*-

from bases.FrameworkServices.SimpleService import SimpleService
import glob

ORDER = ['temperature']

CHARTS = {
    'temperature': {
        'options': [None, 'RK3588 Temperature', 'Celsius', 'temperature', 'rk3588.temperature', 'line'],
        'lines': [
            ['cpu_temp', 'CPU Temperature', 'absolute', 1, 1000],
            ['gpu_temp', 'GPU Temperature', 'absolute', 1, 1000]
        ]
    }
}

class Service(SimpleService):
    def __init__(self, configuration=None, name=None):
        SimpleService.__init__(self, configuration=configuration, name=name)
        
    def check(self):
        return True
        
    def get_data(self):
        data = {}
        
        # Leer temperatura CPU
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                cpu_temp = int(f.read().strip())
                data['cpu_temp'] = cpu_temp
        except:
            data['cpu_temp'] = 0
            
        # Leer temperatura GPU si disponible
        try:
            with open('/sys/class/thermal/thermal_zone1/temp', 'r') as f:
                gpu_temp = int(f.read().strip())
                data['gpu_temp'] = gpu_temp
        except:
            data['gpu_temp'] = 0
            
        return data
```

---

## 🚨 **Sistema Alertas Personalizado**

### **⚙️ Configuración Alertas Health**

#### **1. 📝 Alertas Críticas Sistema**
```bash
# /etc/netdata/health.d/orangepi_custom.conf

# CPU Temperature Alert
template: rk3588_cpu_temp_high
      on: rk3588.temperature.cpu_temp
   every: 10s
    warn: $this > 70000  # 70°C
    crit: $this > 85000  # 85°C
   units: milliCelsius
    info: RK3588 CPU temperature is high
      to: sysadmin

# Memory Usage Alert  
template: memory_usage_high
      on: system.ram
   every: 10s
    warn: $this > 80
    crit: $this > 90
   units: %
    info: Memory usage is high on Orange Pi
      to: sysadmin

# Docker Container Down
template: docker_container_down
      on: docker.container_state
   every: 30s
    crit: $this != 1
   units: boolean
    info: Docker container is not running
      to: sysadmin

# Disk Space Alert
template: disk_space_usage
      on: disk_space.usage
   every: 60s
    warn: $this > 80
    crit: $this > 90
   units: %
    info: Disk space usage is high
      to: sysadmin

# Network Interface Down
template: network_interface_down
      on: net.operstate
   every: 10s
    crit: $this != 1
   units: boolean
    info: Network interface is down
      to: sysadmin
```

#### **2. 📧 Notificaciones Email**
```bash
# /etc/netdata/health_alarm_notify.conf

# Email configuration
SEND_EMAIL="YES"
DEFAULT_RECIPIENT_EMAIL="admin@orangepi.local"

# Configuración SMTP (usando Gmail como ejemplo)
EMAIL_SENDER="orangepi.alerts@gmail.com"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="orangepi.alerts@gmail.com"
SMTP_PASS="app_password_here"

# Custom notification script
custom_sender() {
    # Log local
    echo "$(date): ALERT - $3" >> /var/log/netdata_alerts.log
    
    # Notification to system journal
    logger -t "NetdataAlert" "Status: $1, Host: $2, Alert: $3"
}
```

---

## 📱 **Dashboard Personalizado Orange Pi**

### **🎨 Custom Dashboard Desarrollo**

#### **1. 📊 Dashboard Específico Desarrollo**


// Integration with Orange Pi API
async function updateMetrics() {
    try {
        const response = await fetch('/api/monitoring.php');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            
            // Update display elements
            document.getElementById('cpu-usage').textContent = `${stats.cpu_usage}%`;
            document.getElementById('memory-usage').textContent = `${stats.memory.usage_percent}%`;
            document.getElementById('uptime').textContent = stats.uptime;
            
            // Update Docker services
            updateDockerServices(stats.docker_services);
        }
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
}

function updateDockerServices(services) {
    const container = document.getElementById('docker-services');
    if (!services) return;
    
    let html = '<div class="row">';
    services.forEach(service => {
        const statusClass = service.status === 'running' ? 'status-good' : 'status-critical';
        const icon = service.status === 'running' ? 'fa-check-circle' : 'fa-times-circle';
        
        html += `
            <div class="col-md-4 mb-3">
                <div class="d-flex align-items-center">
                    <i class="fas ${icon} ${statusClass} fa-2x me-3"></i>
                    <div>
                        <h6 class="mb-0">${service.name}</h6>
                        <small class="text-muted">${service.details}</small>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Update every 5 seconds
setInterval(updateMetrics, 5000);
updateMetrics(); // Initial load
</script>

</body>
</html>
```

---

## 📈 **Métricas Personalizadas Desarrollo**

### **🔍 Plugin Desarrollo Web**

#### **1. 📊 Monitor Apache + PHP**
```python
# /etc/netdata/python.d/webdev_monitor.chart.py
from bases.FrameworkServices.UrlService import UrlService
import json

ORDER = ['apache_requests', 'php_processes', 'mysql_connections']

CHARTS = {
    'apache_requests': {
        'options': [None, 'Apache Requests/s', 'requests/s', 'apache', 'webdev.apache', 'line'],
        'lines': [
            ['requests_per_sec', 'Requests', 'absolute'],
        ]
    },
    'php_processes': {
        'options': [None, 'PHP-FPM Processes', 'processes', 'php', 'webdev.php', 'line'],
        'lines': [
            ['active_processes', 'Active', 'absolute'],
            ['idle_processes', 'Idle', 'absolute'],
        ]
    },
    'mysql_connections': {
        'options': [None, 'MySQL Connections', 'connections', 'mysql', 'webdev.mysql', 'line'],
        'lines': [
            ['threads_connected', 'Connected', 'absolute'],
        ]
    }
}

class Service(UrlService):
    def __init__(self, configuration=None, name=None):
        UrlService.__init__(self, configuration=configuration, name=name)
        self.url = "http://localhost:8080/api/monitoring.php"
        
    def _get_data(self):
        try:
            raw = self._get_raw_data()
            if not raw:
                return None
                
            data = json.loads(raw)
            if not data.get('success'):
                return None
                
            # Extract relevant metrics
            stats = data['data']
            
            return {
                'requests_per_sec': self.get_apache_requests(),
                'active_processes': self.get_php_processes(),
                'idle_processes': 5,  # Mock data
                'threads_connected': self.get_mysql_connections(),
            }
        except Exception:
            return None
            
    def get_apache_requests(self):
        # Implementation to get Apache requests/sec
        return 10  # Mock value
        
    def get_php_processes(self):
        # Implementation to get PHP-FPM processes
        return 3  # Mock value
        
    def get_mysql_connections(self):
        # Implementation to get MySQL connections
        return 2  # Mock value
```

---

## 🔧 **Optimización Performance Netdata**

### **⚡ Configuración ARM64 Específica**

#### **1. 📝 Memory Optimization**
```ini
# /etc/netdata/netdata.conf - Memory tuning
[global]
    # Reduced memory footprint for ARM64
    page cache size = 32
    history = 1800          # 30 minutes history (vs default 1 hour)
    update every = 2        # 2 second intervals (vs 1 second)
    
[plugin:proc]
    # Reduce CPU overhead
    /proc/stat = yes
    /proc/meminfo = yes
    /proc/loadavg = yes
    /proc/net/dev = yes
    
    # Disable heavy plugins if not needed
    /proc/vmstat = no
    /proc/slabinfo = no
```

#### **2. 🚀 Startup Optimization**
```bash
# /etc/systemd/system/netdata.service.d/override.conf
[Service]
# Nice priority for better responsiveness
Nice=10

# Memory limit
MemoryMax=256M

# CPU limit
CPUQuota=50%

# Restart policy
Restart=always
RestartSec=5s
```

## ✅ **Validación Final del Sistema**

### **📊 Verificación Netdata Operativo**
```bash
# Verificar servicio activo
sudo systemctl status netdata
# ● netdata.service - Real time performance monitoring
#    Active: active (running) ✅

# Verificar acceso web local
curl -I http://localhost:19999
# HTTP/1.1 200 OK ✅

# Test API de métricas
curl -s "http://localhost:19999/api/v1/info" | jq .version
# "v1.44.0" ✅
```

### **🌐 Acceso y Funcionalidades Verificadas**
- **Dashboard principal**: Accesible vía navegador web ✅
- **Métricas tiempo real**: Actualizaciones cada segundo ✅
- **Docker integration**: Containers detectados automáticamente ✅
- **Sistema monitoring**: CPU, memoria, disco, red funcionando ✅
- **Alertas configuradas**: Health monitoring activo ✅

### **📈 Métricas Principales Monitoreadas**
- [x] **Sistema**: CPU usage, load average, memoria, swap
- [x] **Hardware**: Temperatura (si disponible), sensors
- [x] **Docker**: Estado containers, recursos por servicio
- [x] **Red**: Tráfico interfaces, conexiones activas
- [x] **Almacenamiento**: Uso disk space, I/O operations

---

## 📝 **Lecciones del Proceso de Monitorización**

### **✅ Aciertos en la Implementación**
- **Netdata ARM64**: Excelente performance en Orange Pi 5 Plus
- **Auto-discovery**: Detección automática de servicios sin configuración manual
- **Configuración modular**: Plugins específicos según necesidades
- **Resource efficiency**: Impacto mínimo en sistema host

### **🎯 Aprendizajes Técnicos Clave**
- **Monitoring real-time**: Importancia de métricas en tiempo real para troubleshooting
- **Docker integration**: Visibilidad granular de containers individual
- **Alert configuration**: Balance entre sensibilidad y false positives
- **Performance baseline**: Establecer métricas normales para comparación

### **⚠️ Desafíos Encontrados**
- **Configuración inicial**: Ajuste parámetros para arquitectura ARM64
- **Alert tuning**: Calibrar thresholds apropiados para el hardware
- **Network access**: Configurar acceso remoto manteniendo seguridad
- **Resource management**: Limitar consumo Netdata sin perder funcionalidad

### **💡 Valor del Aprendizaje**
La implementación de monitorización profesional demuestra competencias DevOps prácticas y capacidad de mantener sistemas en producción con visibilidad completa de performance y salud del sistema.

---

## 🔧 **Preparación Siguiente Fase**

### **📋 Sistema Monitorización Completo**
- ✅ **Netdata funcionando** con optimizaciones ARM64
- ✅ **Docker monitoring** integrado automáticamente
- ✅ **Alertas configuradas** para métricas críticas
- ✅ **Dashboard accesible** vía web interface
- ✅ **API disponible** para integraciones futuras

### **🎯 Próximo Capítulo: Troubleshooting**
Con monitorización establecida, el siguiente paso es documentar procedimientos de troubleshooting y resolución de problemas comunes en el entorno Orange Pi + Docker.

---

*Capítulo completado: Sistema de monitorización profesional implementado con Netdata, proporcionando visibilidad completa de performance y salud del sistema Orange Pi 5 Plus*

