# 1. Introducción al Proyecto

## 🎯 **Objetivo Personal y Profesional**

Este proyecto surge de la necesidad de crear una **plataforma de desarrollo personal** que sirviera como:

- **Portfolio técnico**: Demostración práctica de habilidades en administración de sistemas
- **Entorno de desarrollo**: Stack completo para proyectos web (PHP, Java, Node.js)
- **Laboratorio de aprendizaje**: Experimentación con tecnologías modernas
- **Servidor doméstico**: Servicios 24/7 con acceso remoto seguro

## 🚀 **Motivación del Proyecto**

Como desarrollador en formación, buscaba una solución que me permitiera:

1. **Experiencia práctica** con administración de servidores Linux
2. **Stack de desarrollo completo** accesible desde cualquier ubicación
3. **Portfolio técnico** para demostrar competencias de desarrollo y DevOps
4. **Plataforma de experimentación** sin limitaciones de hosting tradicional

## 📋 **Alcance y Objetivos**

### **Objetivos Principales**

- ✅ **Servidor estable 24/7** con alta disponibilidad y uptime excelente
- ✅ **Stack de desarrollo completo** (Apache, PHP 8.3, MySQL 8.0, Java 17, Node.js)
- ✅ **Acceso remoto seguro** vía SSH con autenticación por claves
- ✅ **Servicios en la nube** (Seafile para almacenamiento privado)
- ✅ **Monitorización en tiempo real** con alertas automáticas
- ✅ **Portfolio web desplegado** y accesible públicamente

### **Objetivos Secundarios**

- ⚡ **Optimización de rendimiento** para hardware ARM64
- 🔒 **Seguridad avanzada** con Fail2Ban y SSL/TLS
- 🐳 **Containerización** de servicios con Docker
- 📊 **Documentación completa** del proceso y decisiones técnicas

## 🎨 **Arquitectura del Proyecto**

### **Stack Tecnológico Seleccionado**

```
┌─────────────────────────────────────────┐
│           Hardware Layer                │
│    Orange Pi 5 Plus (RK3588 ARM64)     │
│      16GB RAM + NVMe SSD + microSD     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        Operating System                 │
│      Ubuntu Server 24.04.2 LTS         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│         Core Services                   │
│   SSH + Nginx + Docker + MySQL 8.0     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│       Development Stack                 │
│  Apache + PHP 8.3 + Java 17 + Node.js  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│      Application Services               │
│  Seafile + Portainer + Portfolio Web    │
└─────────────────────────────────────────┘
```

### **Servicios Implementados**

| Servicio | Puerto | Propósito | Estado |
|----------|--------|-----------|---------|
| **SSH** | [SSH_CUSTOM_PORT] | Acceso remoto seguro | ✅ Activo |
| **HTTP/HTTPS** | 80/443 | Proxy reverso Nginx | ✅ Activo |
| **Seafile** | 8080 | Almacenamiento nube privado | ✅ Activo |
| **Portainer** | 9000 | Gestión contenedores Docker | ✅ Activo |
| **Portfolio** | 80 | Aplicación web PHP personal | ✅ Activo |
| **Netdata** | 19999 | Monitorización en tiempo real | ✅ Activo |
| **MySQL** | 3306 | Base de datos (solo local) | ✅ Activo |

## 🌟 **Características Destacadas**

### **Rendimiento Optimizado**
- **ARM64 nativo**: Compilaciones y optimizaciones específicas
- **NVMe SSD**: Almacenamiento de alta velocidad para aplicaciones
- **16GB RAM**: Capacidad suficiente para múltiples servicios concurrentes
- **Red Gigabit**: Conectividad estable para servicios remotos

### **Seguridad Implementada**
- **SSH con claves ED25519**: Autenticación sin contraseñas
- **Puerto SSH no estándar** ([SSH_CUSTOM_PORT]): Reducción de ataques automatizados
- **Fail2Ban activo**: Protección contra ataques de fuerza bruta
- **SSL/TLS Let's Encrypt**: Cifrado en todas las comunicaciones web
- **Firewall UFW**: Control granular de acceso a puertos

### **Alta Disponibilidad**
- **Uptime 24/7**: Servidor diseñado para funcionamiento continuo
- **Backups automatizados**: Sistema Borg para recuperación de datos
- **Monitorización**: Netdata con métricas en tiempo real
- **DNS dinámico**: DuckDNS para acceso externo estable

## 📈 **Resultados Esperados**

Al completar este proyecto, se habrá logrado:

1. **✅ Servidor funcional**: Orange Pi 5 Plus operativo como servidor de desarrollo
2. **✅ Portfolio desplegado**: Aplicación web personal accesible públicamente  
3. **✅ Experiencia técnica**: Conocimientos prácticos en administración Linux
4. **✅ Documentación**: Guía completa replicable por otros desarrolladores
5. **✅ Plataforma escalable**: Base sólida para futuros proyectos y servicios

## 🔄 **Próximos Capítulos**

Esta guía está estructurada para seguir el proceso completo paso a paso:

- **Capítulo 2**: Especificaciones y justificación del hardware elegido
- **Capítulo 3**: Instalación y configuración inicial de Ubuntu Server
- **Capítulo 4**: Configuración de red, seguridad y acceso remoto
- **Capítulo 5**: Implementación de servicios Docker y containerización
- **Capítulo 6**: Despliegue del portfolio web y stack de desarrollo
- **Capítulo 7**: Monitorización, logs y mantenimiento del sistema
- **Capítulo 8**: Resolución de problemas comunes y troubleshooting
- **Capítulo 9**: Lecciones aprendidas, errores y mejores prácticas
- **Capítulo 10**: Futuras mejoras y optimizaciones

---

> **💡 Nota**: Este proyecto está diseñado para ser completamente replicable. Todos los comandos, configuraciones y decisiones técnicas están documentadas para facilitar la implementación por parte de otros desarrolladores.

