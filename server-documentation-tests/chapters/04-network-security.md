# 🔒 Configuración de Red y Seguridad

## Contextualización del Problema

Un servidor expuesto a internet requiere múltiples capas de seguridad para prevenir accesos no autorizados. En proyectos empresariales, la seguridad no es opcional: es un requisito fundamental que demuestra comprensión de buenas prácticas profesionales.

## Implementación de Seguridad Multicapa

### Configuración SSH Segura
Reemplacé la configuración SSH por defecto con:
- **Puerto no estándar**: Cambiado del puerto por defecto para reducir ataques automatizados
- **Autenticación por clave**: Eliminé autenticación por contraseña, implementando claves asimétricas
- **Restricciones de acceso**: Configuré white-list de usuarios autorizados

Esta configuración produjo una notable reducción en los intentos de intrusión, observada a través del análisis de logs del sistema con comandos como `journalctl -u ssh` y `grep "Failed password" /var/log/auth.log`.

### Firewall con UFW
Implementé una política de firewall restrictiva:
- **Deny por defecto**: Todo el tráfico bloqueado inicialmente
- **Allow específico**: Solo servicios necesarios habilitados
- **Logging activado**: Registro de intentos de conexión para monitoreo

### Fail2Ban para Protección Activa
Configuré Fail2Ban para protección automática contra ataques persistentes:

```bash
# Instalación y configuración básica
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Configuración para SSH (ejemplo genérico)
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verificación de bans activos
sudo fail2ban-client status sshd
```

**Resultado**: Significativa reducción en intentos de fuerza bruta tras implementación, verificable mediante análisis de logs con `fail2ban-client status sshd`.

## Gestión de Certificados SSL

### Let's Encrypt para HTTPS
Implementé certificados SSL gratuitos y automatizados:
- **Renovación automática**: Evita expiración de certificados
- **Múltiples dominios**: Soporte para varios subdominios
- **Grado A+ de seguridad**: Validado mediante herramientas de testing SSL

## Errores Cometidos y Correcciones

### Error #1: Configuración SSH por Defecto
**Problema**: Inicialmente mantuve SSH en puerto estándar con autenticación por contraseña.
**Impacto**: Múltiples intentos de intrusión detectados en las primeras 24 horas (verificables en `/var/log/auth.log`).

```bash
# MAL - Configuración inicial insegura
# Puerto: 22, PasswordAuthentication: yes

# BIEN - Configuración endurecida
sudo sed -i 's/#Port 22/Port [PUERTO_PERSONALIZADO]/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

**Lección**: Nunca mantener configuraciones por defecto en servicios expuestos.

### Error #2: Firewall Permisivo Inicial
**Problema**: Dejé UFW con política ALLOW por defecto durante configuración.
**Impacto**: Exposición innecesaria de servicios durante desarrollo.

```bash
# Configuración correcta de firewall restrictivo
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh/tcp
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

# Verificación de reglas
sudo ufw status numbered
```

**Lección**: Implementar "deny by default" desde el primer momento.

### Error #3: Certificados Manuales
**Problema**: Intenté configurar certificados SSL autofirmados inicialmente.
**Impacto**: Warnings del navegador y pérdida de confianza profesional.

```bash
# Automatización con Let's Encrypt
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d [tu-dominio.com]
sudo certbot renew --dry-run

# Renovación automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

**Lección**: Las soluciones automatizadas son más confiables que procesos manuales.

## Resultados de Seguridad

- **Reducción de ataques**: Significativa disminución de intentos de intrusión tras hardening (verificable en logs)
- **Calificación SSL**: A+ en tests de seguridad
- **Disponibilidad**: Excelente uptime sin incidentes de seguridad reportados
- **Respuesta automatizada**: Bloqueo de amenazas sin intervención manual

## Competencias Técnicas Desarrolladas

Esta implementación demuestra comprensión de:
- **Principios de seguridad**: Defensa en profundidad y mínimo privilegio
- **Automatización**: Herramientas que reducen carga operacional
- **Monitoreo proactivo**: Detección temprana de amenazas
- **Buenas prácticas**: Configuraciones alineadas con estándares de la industria

