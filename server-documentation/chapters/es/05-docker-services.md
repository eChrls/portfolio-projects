# 🐳 Servicios Docker - Contenerización de Aplicaciones

## Contextualización del Problema

Para demostrar competencias en tecnologías modernas de desarrollo, necesitaba implementar servicios containerizados que simularan un entorno empresarial real. Docker se ha convertido en estándar de la industria para deployment y escalabilidad.

## Decisión Técnica: Stack Docker Completo

Implementé una arquitectura de microservicios usando Docker para:
- **Portainer**: Gestión visual de contenedores
- **MySQL**: Base de datos relacional para aplicaciones
- **Seafile**: Sistema de archivos distribuido como PoC cloud storage
- **Monitoring**: Contenedores de métricas y logging

## Proceso de Implementación

### Instalación Docker Engine
```bash
# Instalación oficial Docker para ARM64
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Configuración usuario sin sudo
sudo usermod -aG docker $USER
newgrp docker

# Verificación de instalación
docker --version
docker run hello-world
```

### Docker Compose para Orquestación
```bash
# Instalación Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificación
docker-compose --version
```

## Errores Cometidos y Correcciones

### Error #1: Instalación sin Consideraciones ARM64
**Problema**: Intenté usar imágenes x86 inicialmente, resultando en errores de arquitectura.
**Impacto**: Contenedores fallando constantemente con "exec format error".

```bash
# MAL - Sin especificar arquitectura
docker run mysql:latest

# BIEN - Especificando arquitectura ARM64
docker run --platform linux/arm64 mysql:latest
# O usando imágenes nativas ARM64
docker run mysql/mysql-server:latest
```

**Lección**: Siempre verificar compatibilidad de arquitectura en entornos no-x86.

### Error #2: Gestión de Volúmenes Inadecuada
**Problema**: Inicialmente usé bind mounts sin planificación, causando pérdida de datos.
**Impacto**: Pérdida completa de base de datos tras reinicio de contenedor.

```bash
# MAL - Bind mount sin backup
docker run -v /tmp/mysql:/var/lib/mysql mysql

# BIEN - Volúmenes named con backup strategy
docker volume create mysql_data
docker volume create mysql_config

# Compose con volúmenes persistentes
version: '3.8'
services:
  mysql:
    image: mysql:latest
    volumes:
      - mysql_data:/var/lib/mysql
      - mysql_config:/etc/mysql/conf.d
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
volumes:
  mysql_data:
  mysql_config:
```

**Lección**: Los datos críticos requieren estrategia de persistencia desde el diseño inicial.

### Error #3: Networking Sin Planificación
**Problema**: Contenedores en red por defecto sin aislamiento ni comunicación controlada.
**Impacto**: Exposición innecesaria de servicios y problemas de conectividad.

```bash
# Creación de red personalizada
docker network create --driver bridge app_network

# Compose con red aislada
version: '3.8'
services:
  mysql:
    networks:
      - backend
  web:
    networks:
      - frontend
      - backend
    ports:
      - "XX:XX"

networks:
  frontend:
  backend:
    internal: true
```

**Lección**: El aislamiento de red es crucial para seguridad en microservicios.

## Implementación de Servicios Críticos

### Portainer para Gestión Visual
```bash
# Deployment Portainer
docker volume create portainer_data
docker run -d -p [PUERTO_PORTAINER]:9000 \
  --name portainer \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Acceso web: http://[IP_SERVIDOR]:[PUERTO_PORTAINER]
```

### MySQL con Configuración Optimizada
```bash
# Variables de entorno para seguridad
echo "MYSQL_ROOT_PASSWORD=[contraseña_segura_aquí]" > .env
echo "MYSQL_DATABASE=app_database" >> .env

# Compose con optimización ARM64
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    platform: linux/arm64
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    command: --default-authentication-plugin=mysql_native_password --bind-address=0.0.0.0
```

## Docker Compose: La Herramienta Clave

Docker Compose se convirtió en la pieza fundamental del proyecto. Permite definir toda la infraestructura como código:

```yaml
# docker-compose.yml - Stack completo
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    platform: linux/arm64
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - mysql_config:/etc/mysql/conf.d
    networks:
      - backend
    ports:
      - "3306:3306"

  portainer:
    image: portainer/portainer-ce:latest
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - frontend
    ports:
      - "[PUERTO_PORTAINER]:9000"

  web:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./web:/usr/share/nginx/html
    networks:
      - frontend
    ports:
      - "80:80"
    depends_on:
      - mysql

volumes:
  mysql_data:
  mysql_config:
  portainer_data:

networks:
  frontend:
  backend:
    internal: true
```

### Comandos de Gestión Diaria
```bash
# Levantar todo el stack
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Actualizar servicios
docker-compose pull && docker-compose up -d

# Backup de volúmenes
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data
```

## Competencias Técnicas Desarrolladas

Esta implementación demuestra competencias específicas en desarrollo moderno:

**Infrastructure as Code**: Todo el entorno es reproducible con un solo comando `docker-compose up`.

**Arquitectura de Sistemas**: Separación de redes, gestión de secretos, y estrategias de persistencia muestran comprensión de sistemas complejos.

**Resolución de Problemas**: Los errores documentados (ARM64, volúmenes, networking) son problemas reales que enfrentan los desarrolladores.

**Escalabilidad**: La arquitectura permite añadir nuevos servicios modificando solo el compose file, sin interrumpir servicios existentes.

## Resultados Obtenidos

- **Tiempo de despliegue**: Stack completo operacional en pocos minutos
- **Gestión unificada**: Un solo archivo YAML para toda la infraestructura  
- **Backup automatizado**: Scripts de respaldo integrados en el workflow
- **Monitoreo visual**: Portainer proporciona visibilidad completa del estado

Esta implementación Docker constituye la base técnica sobre la cual se construyó todo el proyecto de servidor personal.
```
