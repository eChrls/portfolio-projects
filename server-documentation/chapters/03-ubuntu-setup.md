# 🐧 Instalación Ubuntu Server 24.04 LTS

## Contextualización del Problema

Al iniciar este proyecto, necesitaba un sistema operativo servidor estable y optimizado para arquitectura ARM64 que soportara todas las tecnologías del stack de desarrollo moderno. La elección del sistema operativo era crítica para el rendimiento y la estabilidad a largo plazo.

## Decisión Técnica: Ubuntu Server 24.04 LTS

Seleccioné Ubuntu Server 24.04 LTS por varias razones estratégicas:

- **Soporte LTS**: 5 años de actualizaciones de seguridad garantizadas
- **Optimización ARM64**: Rendimiento nativo para el procesador RK3588
- **Ecosistema de desarrollo**: Compatibilidad completa con Docker, PHP 8.3, Java 17
- **Documentación extensa**: Comunidad activa y recursos abundantes

## Proceso de Implementación

### Preparación del Hardware
Configuré el arranque dual utilizando tanto NVMe como microSD para garantizar redundancia. Esta decisión me permitió tener un sistema de respaldo automático y recovery en caso de fallos del almacenamiento principal.

### Instalación Base
Durante la instalación, opté por una configuración mínima del servidor para optimizar recursos. Esto incluyó:
- Instalación headless (sin interfaz gráfica)
- Configuración de red estática
- Hardening básico de seguridad desde el primer arranque

## Resultados Obtenidos

La instalación resultó en un sistema base eficiente que consume aproximadamente **1GB de RAM** en reposo (verificable con `free -h`), dejando recursos abundantes para servicios y aplicaciones. El tiempo de arranque es rápido, desde el encendido hasta servicios completamente operacionales.

### Métricas de Rendimiento Observadas
- **Uso de CPU en reposo**: Bajo (verificable con `htop`)
- **Tiempo de respuesta SSH**: Muy rápido (medible con `time ssh [servidor] exit`)
- **Estabilidad**: Excelente estabilidad desde la implementación

## Lecciones Aprendidas

**Error inicial**: Intenté instalar la versión desktop inicialmente, lo que consumía recursos innecesarios.

**Corrección aplicada**: Reinstalación con servidor puro, resultando en una notable reducción de uso de recursos y mayor estabilidad (medible comparando `free -h` y `systemctl list-units --type=service`).

**Aprendizaje clave**: La selección correcta de la distribución base es fundamental para el rendimiento del proyecto completo. Una decisión aparentemente simple puede impactar significativamente en la escalabilidad futura.

## Desarrollo de Competencias Técnicas

Esta configuración base permitió posteriormente el despliegue exitoso de múltiples servicios simultáneos sin degradación del rendimiento, demostrando capacidad de planificación técnica y optimización de recursos en entornos limitados.

**Lección crítica**: Una verificación básica inicial puede ahorrar considerable tiempo de troubleshooting posterior.

### Preparación del Medio de Instalación

Para Orange Pi 5 Plus, experimentamos con diferentes métodos de instalación:

```bash
# Opción 1: Instalación desde microSD (recomendado para principiantes)
sudo dd if=ubuntu-24.04-live-server-arm64.iso of=/dev/sdX bs=4M status=progress conv=fsync

# Opción 2: Flash directo a NVMe (nuestro método final)
sudo dd if=ubuntu-24.04-live-server-arm64.iso of=/dev/nvme0n1 bs=4M status=progress conv=fsync
```

**Decisión técnica**: Elegimos instalación directa en NVMe para:
- **Velocidad**: 4-5x más rápido que microSD en operaciones I/O
- **Durabilidad**: Mayor vida útil para un servidor 24/7
- **Simplicidad**: Elimina el dual-boot complexity

## Proceso de Instalación

### Configuración Inicial del Sistema

Durante el proceso de instalación, Ubuntu Server presenta varias decisiones críticas:

#### Configuración de Usuario

```bash
# Usuario del sistema (configuración genérica para documentación)
Username: [usuario_servidor]
Password: [contraseña_segura]
Hostname: orangepi-server
```

**Consideración de seguridad**: Evitamos usernames predecibles como 'admin' o 'orangepi'. Un nombre neutro reduce la superficie de ataque en SSH.

#### Configuración de Red

La configuración de red requiere planificación previa para integración con la infraestructura doméstica:

```bash
# Configuración estática recomendada
IP Address: [IP_ESTATICA_RED_LOCAL]
Netmask: 255.255.255.0
Gateway: [IP_GATEWAY_ROUTER]
DNS: 8.8.8.8, 1.1.1.1
```

**Decisión de red estática vs DHCP**: 
- **Ventaja**: IP predecible para servicios y SSH
- **Desventaja**: Requiere coordinación con router doméstico
- **Nuestra elección**: Estática por simplicidad de gestión

### Particionado del Almacenamiento

El esquema de particiones fue diseñado para maximizar el rendimiento y permitir crecimiento futuro:

```bash
# Esquema de particiones implementado
/dev/nvme0n1p1: 512MB  (boot - FAT32)
/dev/nvme0n1p2: 100GB  (root - ext4)
/dev/nvme0n1p3: 800GB  (home/data - ext4)
swap: 4GB (archivo, no partición)
```

**Justificación del esquema**:
- **Boot separado**: Facilita actualizaciones del kernel
- **Root limitado**: Previene que logs llenen el sistema
- **Data grande**: Espacio para proyectos y Docker volumes
- **Swap archivo**: Más flexible que partición fija

### Instalación de Software Base

Ubuntu Server permite seleccionar perfiles de software durante la instalación:

```bash
# Paquetes seleccionados en instalación inicial
- OpenSSH Server (✓ Esencial para administración remota)
- Docker (✓ Para containerización de servicios)  
- Basic Ubuntu Server (✓ Herramientas de administración)
```

**Error inicial**: Intentamos instalar todo después. Es más eficiente seleccionar componentes durante la instalación inicial para evitar resolución de dependencias posterior.

## Primera Configuración Post-Instalación

### Actualización del Sistema

Inmediatamente después del primer boot, es crítico actualizar el sistema:

```bash
# Actualización de paquetes - primera prioridad
sudo apt update && sudo apt upgrade -y

# Instalación de herramientas esenciales identificadas como necesarias
sudo apt install -y htop tree curl wget git vim ufw fail2ban

# Configuración de timezone
sudo timedatectl set-timezone Europe/Madrid
```

**Consideración de seguridad**: Actualizaciones inmediatas cierran vulnerabilidades conocidas antes de exponer servicios.

### Configuración SSH Segura

La configuración SSH por defecto de Ubuntu requiere endurecimiento para uso en producción:

```bash
# Edición de configuración SSH
sudo vim /etc/ssh/sshd_config

# Cambios de seguridad implementados:
Port [PUERTO_SSH_PERSONALIZADO]         # Puerto no estándar
PermitRootLogin no          # Deshabilitar root login
PasswordAuthentication no   # Solo claves SSH
PubkeyAuthentication yes    # Habilitar autenticación por clave
AuthorizedKeysFile /home/[usuario]/.ssh/authorized_keys
```

**Decisión de puerto no estándar**: 
- **Ventaja**: Reduce intentos de login automáticos
- **Desventaja**: Requiere recordar puerto personalizado
- **Nuestra implementación**: Puerto personalizado no estándar

### Configuración de Firewall

Ubuntu incluye UFW (Uncomplicated Firewall) que simplifica la gestión de iptables:

```bash
# Habilitación y configuración inicial de firewall
sudo ufw enable

# Reglas básicas de seguridad
sudo ufw default deny incoming     # Denegar todo por defecto
sudo ufw default allow outgoing    # Permitir salida
sudo ufw allow [PUERTO_SSH]/tcp            # SSH en puerto personalizado
sudo ufw allow 80/tcp                     # HTTP
sudo ufw allow 443/tcp                    # HTTPS

# Verificación de reglas
sudo ufw status verbose
```

## Optimizaciones Específicas para ARM64

### Configuración de Performance

El RK3588 permite varios modos de performance que afectan el consumo y rendimiento:

```bash
# Verificación de governors de CPU disponibles
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors

# Configuración para servidor (balance performance/consumo)
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Persistencia del governor
echo 'GOVERNOR="performance"' | sudo tee -a /etc/default/cpufrequtils
```

**Decisión de governor**: 'performance' vs 'ondemand' vs 'powersave'
- **Performance**: CPU siempre a máxima frecuencia
- **Ondemand**: Escala según demanda (nuestra elección)
- **Powersave**: Mínimo consumo, menor rendimiento

### Optimización de Memoria

Con 16GB de RAM, configuramos el sistema para aprovechar la memoria disponible:

```bash
# Configuración de swappiness (reducir uso de swap)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Configuración de cache pressure
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

# Aplicar cambios sin reinicio
sudo sysctl -p
```

**Justificación**: Con RAM abundante, preferimos mantener datos en memoria antes que swappear.

## Errores Comunes y Soluciones

### Problema: Boot Loop después de Instalación

**Síntoma**: El sistema no arranca después de la instalación inicial
**Causa**: Orden de boot incorrecto en UEFI
**Solución**:
```bash
# Verificar en consola de Orange Pi
efibootmgr -v
# Cambiar orden si es necesario
sudo efibootmgr -o 0001,0000
```

### Problema: SSH Connection Refused

**Síntoma**: No se puede conectar via SSH después de configuración
**Causa**: Firewall bloqueando puerto personalizado
**Solución**:
```bash
# Verificar servicio SSH activo
sudo systemctl status ssh

# Verificar puerto en uso
sudo ss -tlnp | grep ssh

# Abrir puerto en firewall
sudo ufw allow XXXX/tcp
```

### Problema: Performance Degradado

**Síntoma**: El sistema responde lentamente
**Causa**: Governor de CPU en modo powersave
**Diagnóstico y solución**:
```bash
# Verificar frequency actual
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq

# Cambiar a performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## Verificación Final del Sistema

### Tests de Funcionamiento

Después de la instalación, ejecutamos una batería de tests para verificar el correcto funcionamiento:

```bash
# Test de CPU (todos los cores)
nproc
lscpu

# Test de memoria
free -h
cat /proc/meminfo | grep MemTotal

# Test de almacenamiento
df -h
lsblk

# Test de red
ip addr show
ping -c 4 8.8.8.8

# Test de servicios básicos
sudo systemctl status ssh
sudo systemctl status networking
```

### Benchmark Básico

Para establecer una línea base de performance:

```bash
# Instalación de herramientas de benchmark
sudo apt install -y sysbench

# Test de CPU
sysbench cpu --threads=8 run

# Test de memoria
sysbench memory run

# Test de I/O (NVMe)
sysbench fileio --file-test-mode=seqwr run
```

**Resultados esperados en Orange Pi 5 Plus**:
- CPU: ~2000 events/second (8 threads)
- Memoria: ~15GB/s throughput
- NVMe: ~400MB/s sequential write

## Conclusiones y Próximos Pasos

La instalación de Ubuntu Server 24.04 LTS en Orange Pi 5 Plus resulta en una plataforma sólida para desarrollo y hosting de servicios. Los puntos clave aprendidos:

**Éxitos**:
- ARM64 performance adecuada para desarrollo web
- Compatibilidad excelente con software empresarial
- Consumo energético muy bajo (~15W total)

**Desafíos**:
- Requiere configuraciones específicas para optimizar performance
- Documentación ARM64 menos abundante que x86_64
- Algunos paquetes requieren compilación manual

**Próximo capítulo**: Configuración de red avanzada y seguridad, incluyendo fail2ban, certificados SSL y configuración de servicios básicos.
- **Hostname**: `orangepi-server`
- **Timezone**: `Europe/Madrid`
- **Keyboard**: Spanish (es)

#### **🌐 Configuración Red Inicial**
```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true  # Temporal durante instalación
```

---

## 🔧 **Configuración Post-Instalación**

### **1. 🔄 Actualización Sistema Completa**

```bash
# Actualización repositorios y sistema
sudo apt update && sudo apt upgrade -y

# Instalación herramientas esenciales
sudo apt install -y \
    curl wget git nano htop \
    net-tools openssh-server \
    ufw fail2ban \
    build-essential
```

### **2. 🌐 Configuración Red Estática**

```yaml
# /etc/netplan/01-netcfg.yaml - Configuración final
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - [IP_ESTATICA_SERVIDOR]
      gateway4: [IP_GATEWAY_ROUTER]
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
```

```bash
# Aplicar configuración
sudo netplan apply

# Verificación conectividad
ip addr show eth0
ping -c 4 8.8.8.8
```

### **3. 🔐 Configuración SSH Avanzada**

#### **Cambio Puerto Seguridad**
```bash
# /etc/ssh/sshd_config
Port [PUERTO_PERSONALIZADO]        # Puerto no estándar
PermitRootLogin no          # Deshabilitar root
PasswordAuthentication yes   # Temporal para setup inicial
PubkeyAuthentication yes    # Preparar para claves
```

#### **Generación Claves SSH**
```bash
# En cliente Windows
ssh-keygen -t edXXXX -C "orangepi-server-key"

# Copiar clave pública al servidor
ssh-copy-id -p [PUERTO_SSH] [usuario]@[IP_SERVIDOR]
```

---

## 🎯 **Optimizaciones Específicas ARM64**

### **🚀 Rendimiento CPU**
```bash
# Verificar frequency scaling
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Configurar para rendimiento
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### **💾 Optimización Memoria**
```bash
# /etc/sysctl.conf - Ajustes para 16GB RAM
vm.swappiness=10           # Reducir uso swap
vm.dirty_ratio=5           # Optimizar escritura disco
vm.dirty_background_ratio=3
```

### **📊 Monitoring ARM64**
```bash
# Instalación herramientas específicas
sudo apt install -y \
    lm-sensors \
    iotop iftop \
    htop btop

# Configuración sensores temperatura
sudo sensors-detect --auto
```

---

## 🛡️ **Configuración Seguridad Básica**

### **🔥 Firewall UFW**
```bash
# Configuración inicial UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Puertos esenciales
sudo ufw allow XXXX/tcp     # SSH
sudo ufw allow YY/tcp       # HTTP
sudo ufw allow ZZZ/tcp      # HTTPS

# Activar firewall
sudo ufw enable
sudo ufw status verbose
```

### **🛡️ Fail2Ban Anti-Brute Force**
```bash
# Instalación y configuración
sudo apt install -y fail2ban

# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = XXXX
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

---

## ⚡ **Verificación Sistema Completo**

### **📊 Estado Final Verificado**
```bash
# Información sistema
uname -a
# Output: Linux orangepi-server 6.8.0-35-generic #35-Ubuntu SMP PREEMPT_DYNAMIC aarch64

# Recursos disponibles
free -h
# Total RAM: 16GB disponible

# Almacenamiento
df -h
# NVMe: 916GB disponible

# Red configurada
ip route show
# default via [IP_GATEWAY] dev eth0 proto static
```

### **🎯 Servicios Activos**
```bash
# Verificación servicios críticos
sudo systemctl status ssh          # ✅ SSH puerto personalizado
sudo systemctl status ufw          # ✅ Firewall activo
sudo systemctl status fail2ban     # ✅ Protección brute force
```

---

## 🔧 **Preparación para Siguiente Fase**

### **📋 Lista Verificación Pre-Docker**
- [x] Sistema actualizado y estable
- [x] Red estática configurada
- [x] SSH seguro con claves ED25519
- [x] Firewall y fail2ban configurados
- [x] Herramientas monitoreo instaladas
- [x] Optimizaciones ARM64 aplicadas

### **🎯 Próximo Capítulo**
En el **Capítulo 4: Red y Seguridad**, profundizaremos en:
- Configuración DuckDNS para acceso externo
- Certificados SSL/TLS con Let's Encrypt
- Reverse proxy con Nginx
- Monitoreo avanzado de seguridad

---

## 📝 **Lecciones Aprendidas**

### **✅ Aciertos**
- **Ubuntu Server 24.04 LTS ARM64**: Compatibilidad perfecta con RK3588
- **IP estática desde inicio**: Evita problemas configuración servicios
- **SSH puerto no estándar**: Primera línea defensa contra bots
- **Fail2ban desde inicio**: Protección proactiva

### **⚠️ Consideraciones**
- **Temperatura ARM64**: Monitoreo constante recomendado
- **Memoria 16GB**: Suficiente para desarrollo, monitorear uso con Docker
- **microSD backup**: Imagen sistema limpio para recovery rápido

---

*Capítulo completado: Ubuntu Server 24.04 LTS ARM64 instalado y configurado como base sólida para servidor desarrollo personal*

