# 8. Troubleshooting y Resolución de Problemas

## 🎯 **Objetivo del Capítulo**

Proporcionar un manual práctico de diagnóstico y resolución de problemas críticos en Orange Pi 5 Plus, con procedimientos step-by-step para restaurar servicios rápidamente. **Enfoque operacional**: "¿Qué hacer cuando algo falla?" con comandos específicos y procedimientos de emergencia.

**🔧 Diferencia con Capítulo 9**: Este capítulo es puramente práctico (solve problems now), mientras que Lessons Learned analiza estratégicamente por qué ocurrieron y cómo prevenirlos.

---

## 🚨 **Metodología de Troubleshooting**

### **🔍 Proceso Sistemático**
1. **Identificación**: Síntomas visibles y logs relevantes
2. **Aislamiento**: Determinar componente específico afectado
3. **Diagnóstico**: Análisis root cause con comandos verificados
4. **Resolución**: Pasos de corrección documentados
5. **Verificación**: Validación funcionamiento completo
6. **Prevención**: Medidas para evitar recurrencia

### **🛠️ Herramientas Diagnóstico Esenciales**
```bash
# Sistema
systemctl status service_name
journalctl -u service_name -f
dmesg | tail -20
ps aux | grep process_name

# Red
curl -I http://target_url
netstat -tulnp | grep port_number
ss -tlnp

# Docker
docker ps -a
docker logs container_name
docker exec -it container_name bash

# Performance
top -p PID
iotop
netdata dashboard (puerto 19999)
```

---

## 🐳 **Problemas Docker más Frecuentes**

### **❌ Error 1: Container Won't Start**

#### **🔍 Síntomas**
```bash
# Container aparece como "Exited (1)" constantemente
docker ps -a
# CONTAINER ID   IMAGE     STATUS                     
# xxxxx          seafile   Exited (1) 3 seconds ago   
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Revisar logs específicos del container
docker logs container_name --tail 50

# Error común encontrado:
# "Error: Database connection failed"
# "Permission denied: '/shared/seafile/'"

# 2. Verificar permisos volúmenes
ls -la /path/to/volume/
# Si aparece root:root en lugar de usuario correcto:

# 3. Corregir ownership
sudo chown -R 8000:8000 /opt/seafile-data/
# (8000:8000 es UID:GID común containers)

# 4. Verificar docker-compose.yml
docker-compose config
# Validar sintaxis YAML correcta

# 5. Recrear container limpio
docker-compose down
docker-compose up -d --force-recreate container_name
```

#### **🎯 Lección Aprendida**
**Problema:** Ownership incorrecto en volúmenes persistentes tras restart sistema  
**Impacto:** 45 minutos downtime servicios críticos  
**Prevención:** Script de verificación permisos en startup automático

---

### **❌ Error 2: Docker Daemon Unreachable**

#### **🔍 Síntomas**
```bash
docker ps
# Cannot connect to the Docker daemon at unix:///var/run/docker.sock
# Is the docker daemon running?
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar estado servicio Docker
sudo systemctl status docker
# ● docker.service - Docker Application Container Engine
#    Active: inactive (dead) ❌

# 2. Revisar logs Docker daemon
sudo journalctl -u docker.service --no-pager

# Errores comunes encontrados:
# "failed to start daemon: Error initializing network controller"
# "bridge-nf-call-iptables is disabled"

# 3. Resolver problemas networking
sudo sysctl net.bridge.bridge-nf-call-iptables=1
sudo sysctl net.bridge.bridge-nf-call-ip6tables=1

# 4. Restart limpio Docker
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/tmp/*
sudo systemctl start docker

# 5. Verificar funcionalidad
docker run hello-world
# Hello from Docker! ✅
```

#### **🎯 Lección Aprendida**
**Problema:** Bridge networking disabled tras update kernel  
**Impacto:** Completa pérdida servicios containerizados  
**Prevención:** Añadir sysctls a `/etc/sysctl.conf` permanentemente

---

## 🌐 **Problemas de Red y Conectividad**

### **❌ Error 3: DuckDNS No Resuelve**

#### **🔍 Síntomas**
```bash
# Ping a dominio falla
ping [tu-dominio].[YOUR_DOMAIN].duckdns.org
# ping: [tu-dominio].[YOUR_DOMAIN].duckdns.org: Name or service not known

# Pero IP directa funciona
ping [IP_ESTATICA_RED_LOCAL]
# PING [IP_ESTATICA_RED_LOCAL]: 64 bytes from [IP_ESTATICA_RED_LOCAL] ✅
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar DuckDNS service activo
sudo systemctl status duckdns
# Si no existe o está inactive:

# 2. Recrear servicio DuckDNS
sudo tee /etc/systemd/system/duckdns.service << 'EOF'
[Unit]
Description=DuckDNS Dynamic DNS Update
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -s -k "https://www.[YOUR_DOMAIN].duckdns.org/update?domains=[tu-dominio]&token=[tu-token]&ip="

[Install]
WantedBy=multi-user.target
EOF

# 3. Habilitar timer para updates automáticos
sudo tee /etc/systemd/system/duckdns.timer << 'EOF'
[Unit]
Description=Run DuckDNS every 5 minutes

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 4. Activar servicios
sudo systemctl daemon-reload
sudo systemctl enable duckdns.timer
sudo systemctl start duckdns.timer

# 5. Test manual update
sudo systemctl start duckdns.service

# 6. Verificar resolución DNS
nslookup [tu-dominio].[YOUR_DOMAIN].duckdns.org
# Address: [IP_PUBLICA_ACTUAL] ✅
```

#### **🎯 Lección Aprendida**
**Problema:** Timer DuckDNS no se restauraba automáticamente tras reboot  
**Impacto:** Pérdida acceso externo (observable en logs de conexión)  
**Prevención:** Verificación DNS en health-check script automatizado

---

## 🔒 **Problemas de Seguridad y SSH**

### **❌ Error 4: Google Authenticator SSH Lockout**

#### **🔍 Síntomas**
```bash
# SSH connection con 2FA failing repeatedly
ssh -p [PUERTO_SSH_PERSONALIZADO] [usuario_servidor]@[IP_ESTATICA_RED_LOCAL]
# Password:
# Verification code: 123456
# Permission denied (keyboard-interactive,publickey).

# Multiple failed attempts en logs
sudo tail -f /var/log/auth.log
# Failed keyboard-interactive/pam for [usuario_servidor] from [IP_CLIENTE]
# Failed keyboard-interactive/pam for [usuario_servidor] from [IP_CLIENTE]
# Failed keyboard-interactive/pam for [usuario_servidor] from [IP_CLIENTE]
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar Google Authenticator service
sudo journalctl | grep -i "google-authenticator"
# pam_google_authenticator(sshd:auth): Invalid verification code

# 2. Check time synchronization (causa común)
date
# Mon Aug  5 14:23:45 UTC 2024
# Comparar con phone time - diferencia >30 segundos = failure

# 3. Force time sync
sudo systemctl stop ntp
sudo ntpdate -s time.nist.gov
sudo systemctl start ntp
date

# 4. Test time window Google Auth
# El TOTP code debe funcionar dentro de 30-second window
echo "Test TOTP immediately after generating on phone"

# 5. Emergency disable 2FA (si lockout completo)
# SOLO con physical access al device:
sudo nano /etc/pam.d/sshd
# Comentar línea: #auth required pam_google_authenticator.so

sudo nano /etc/ssh/sshd_config
# Cambiar: ChallengeResponseAuthentication no
# Cambiar: AuthenticationMethods publickey

sudo systemctl restart ssh

# 6. Verificar access restored
ssh -p [PUERTO_SSH_PERSONALIZADO] [usuario_servidor]@[IP_ESTATICA_RED_LOCAL]
# Should work with key-only authentication ✅

# 7. Generate emergency recovery script
sudo tee /opt/scripts/disable-2fa-emergency.sh << 'EOF'
#!/bin/bash
echo "=== EMERGENCY 2FA DISABLE ==="
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.2fa_backup
cp /etc/pam.d/sshd /etc/pam.d/sshd.2fa_backup
sed -i 's/ChallengeResponseAuthentication yes/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
sed -i 's/AuthenticationMethods.*/AuthenticationMethods publickey/' /etc/ssh/sshd_config
sed -i 's/auth required pam_google_authenticator.so/#auth required pam_google_authenticator.so/' /etc/pam.d/sshd
systemctl restart ssh
echo "2FA disabled. SSH works with keys only."
EOF

chmod +x /opt/scripts/disable-2fa-emergency.sh
```

#### **🎯 Lección Aprendida**
**Problema:** Time drift + complex 2FA config = high lockout risk  
**Impacto:** 3 complete lockouts requiring physical access  
**Prevención:** Maintain simple auth (keys + fail2ban + custom port) vs complex 2FA

---

### **❌ Error 5: Network Configuration Conflicts**

#### **🔍 Síntomas**
```bash
# Docker containers running but unreachable
docker ps
# STATUS: Up 2 hours ✅
curl -I http://[IP_ESTATICA_RED_LOCAL]:8080
# curl: (7) Failed to connect: Connection refused ❌

# UFW blocking Docker bridge traffic
sudo ufw status numbered
# [1] [PUERTO_SSH_PERSONALIZADO]/tcp ALLOW IN
# [2] Anywhere on docker0   DENY IN    Anywhere ❌

# Fail2Ban banning Docker internal IPs
sudo fail2ban-client status sshd
# Banned IP list: 172.17.0.1 172.18.0.1 [IP_ESTATICA_RED_LOCAL] ❌
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Identify network conflict root cause
sudo iptables -L -n -v
# Chain FORWARD (policy DROP)
# target     prot opt source               destination
# DROP       all  --  0.0.0.0/0            172.17.0.0/16 ❌

# 2. Stop conflicting services
sudo systemctl stop fail2ban
sudo systemctl stop docker
sudo ufw --force reset

# 3. Clear iptables completely
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT

# 4. Restart networking stack
sudo systemctl restart systemd-networkd
sudo systemctl restart networking

# 5. Configure UFW for Docker compatibility
sudo ufw allow in on docker0
sudo ufw allow out on docker0
sudo ufw allow [PUERTO_SSH_PERSONALIZADO]/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 6. Configure Fail2Ban to ignore internal networks
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8 [IP_ESTATICA_RED_LOCAL] 172.16.0.0/12 192.168.0.0/16

[sshd]
enabled = true
port = [PUERTO_SSH_PERSONALIZADO]
filter = sshd
logpath = /var/log/auth.log
EOF

# 7. Restart services in correct order
sudo systemctl start docker
sudo systemctl start fail2ban

# 8. Verify connectivity restored
docker run --rm -p 8080:80 nginx:alpine &
sleep 5
curl -I http://localhost:8080
docker stop $(docker ps -q --filter ancestor=nginx:alpine)
# HTTP/1.1 200 OK ✅

# 9. Create network diagnostic script
sudo tee /opt/scripts/network-diagnostic.sh << 'EOF'
#!/bin/bash
echo "=== NETWORK DIAGNOSTIC ==="
echo "Docker bridge:"
ip addr show docker0
echo "UFW status:"
ufw status numbered
echo "Fail2Ban status:"
fail2ban-client status
echo "Active containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "Port binding test:"
ss -tlnp | grep -E "(80|443|[PUERTO_SSH_PERSONALIZADO])"
EOF

chmod +x /opt/scripts/network-diagnostic.sh
```

#### **🎯 Lección Aprendida**
**Problema:** Multiple security layers blocking legitimate traffic  
**Impacto:** Complete service unavailability despite healthy containers  
**Prevención:** Configure network security with Docker awareness desde inicio

---

### **❌ Error 6: DuckDNS Update Failing Silently**

#### **🔍 Síntomas**
```bash
# External domain not resolving to current IP
dig [tu-dominio].[YOUR_DOMAIN].duckdns.org
# ;; connection timed out; no servers could be reached

# DuckDNS service appears running but failing
sudo systemctl status duckdns.service
# Active: failed (Result: exit-code) ❌

# Public IP changed but DNS record stale
curl -s ifconfig.me
# [IP_PUBLICA_ACTUAL]
nslookup [tu-dominio].[YOUR_DOMAIN].duckdns.org 8.8.8.8
# Address: [IP_PUBLICA_ANTIGUA] ❌
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Test DuckDNS API connectivity
curl -s -k "https://www.[YOUR_DOMAIN].duckdns.org/update?domains=[tu-dominio]&token=[tu-token]&ip="
# Should return "OK" ✅

# 2. Check firewall blocking outbound HTTPS
sudo ufw status verbose | grep 443
# 443/tcp DENY OUT Anywhere ❌

# 3. Allow outbound HTTPS for DuckDNS updates
sudo ufw allow out 443/tcp
sudo ufw reload

# 4. Create robust DuckDNS update script
sudo tee /opt/scripts/robust-duckdns-update.sh << 'EOF'
#!/bin/bash
DOMAIN="[tu-dominio]"
TOKEN="[tu-token-duckdns]"
LOG_FILE="/var/log/duckdns-update.log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get current public IP with timeout
CURRENT_IP=$(timeout 10 curl -s -4 ifconfig.me)
if [ -z "$CURRENT_IP" ]; then
    log_message "ERROR: Could not determine public IP"
    exit 1
fi

# Get DuckDNS record with retry
for attempt in {1..3}; do
    DUCKDNS_IP=$(timeout 10 nslookup "$DOMAIN.[YOUR_DOMAIN].duckdns.org" 8.8.8.8 | grep 'Address:' | tail -1 | awk '{print $2}')
    if [ -n "$DUCKDNS_IP" ]; then
        break
    fi
    sleep 2
done

# Update if changed
if [ "$CURRENT_IP" != "$DUCKDNS_IP" ]; then
    log_message "IP changed: $DUCKDNS_IP -> $CURRENT_IP"
    
    RESPONSE=$(timeout 30 curl -s -k "https://www.[YOUR_DOMAIN].duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=$CURRENT_IP")
    
    if [ "$RESPONSE" = "OK" ]; then
        log_message "SUCCESS: DuckDNS updated to $CURRENT_IP"
    else
        log_message "ERROR: Update failed (Response: $RESPONSE)"
        exit 1
    fi
else
    log_message "IP unchanged: $CURRENT_IP"
fi
EOF

chmod +x /opt/scripts/robust-duckdns-update.sh

# 5. Update systemd service with robust script
sudo tee /etc/systemd/system/duckdns.service << 'EOF'
[Unit]
Description=DuckDNS Dynamic DNS Update
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/scripts/robust-duckdns-update.sh
User=root

[Install]
WantedBy=multi-user.target
EOF

# 6. Test manual update
sudo systemctl daemon-reload
sudo systemctl start duckdns.service
sudo systemctl status duckdns.service
# Active: exited (code=0) ✅

# 7. Verify DNS propagation
sleep 30
nslookup [tu-dominio].[YOUR_DOMAIN].duckdns.org 8.8.8.8
# Address: [IP_PUBLICA_ACTUAL] ✅
```

#### **🎯 Lección Aprendida**
**Problema:** Silent failures en DNS updates = lost external connectivity  
**Impacto:** Pérdida acceso remoto durante hours sin notification  
**Prevención:** Robust scripts with logging, timeout handling, verification steps

---

### **❌ Error 5: SSH Connection Timeout**

#### **🔍 Síntomas**
```bash
# Conexión SSH falla desde exterior
ssh -p [PUERTO_SSH_PERSONALIZADO] [usuario_servidor]@[tu-dominio].[YOUR_DOMAIN].duckdns.org
# ssh: connect to host [tu-dominio].[YOUR_DOMAIN].duckdns.org port [PUERTO_SSH_PERSONALIZADO]: Connection timed out
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar SSH service local
sudo systemctl status ssh
# Active: active (running) ✅

# 2. Test conexión local
ssh -p [PUERTO_SSH_PERSONALIZADO] [usuario_servidor]@localhost
# Successful local connection ✅

# 3. Verificar UFW rules
sudo ufw status numbered
# [1] [PUERTO_SSH_PERSONALIZADO]/tcp ALLOW IN

# 4. Test port desde interior red
nc -zv [IP_ESTATICA_RED_LOCAL] [PUERTO_SSH_PERSONALIZADO]
# Connection successful ✅

# 5. Verificar port forwarding router (método diagnosis)
# Crear temporary service para test
python3 -m http.server [PUERTO_TEST] --bind 0.0.0.0
# Test acceso externo en navegador: [tu-dominio].[YOUR_DOMAIN].duckdns.org:[PUERTO_TEST]

# 6. Si port forwarding correcto, verificar SSH config
sudo nano /etc/ssh/sshd_config
# Verificar:
# Port [PUERTO_SSH_PERSONALIZADO]
# ListenAddress 0.0.0.0
# PasswordAuthentication no (si usando claves)

# 7. Restart SSH con verbosity
sudo systemctl restart ssh
sudo journalctl -u ssh -f
```

#### **🎯 Lección Aprendida**
**Problema:** Port forwarding router no persistía tras updates firmware  
**Impacto:** Pérdida acceso remoto completo  
**Prevención:** Documentar configuración router, verificación automática conectividad

---

## 📊 **Problemas de Performance y Recursos**

### **❌ Error 6: High Memory Usage Causing OOM**

#### **🔍 Síntomas**
```bash
# Sistema lento, aplicaciones crasheando
dmesg | grep -i "killed process"
# Out of memory: Killed process 1234 (nginx) total-vm:524288kB

# Memory usage crítico
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           7.5Gi       7.2Gi       128Mi       892Mi       1.8Gi        64Mi ❌
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Identificar procesos memory-intensive
ps aux --sort=-%mem | head -10
# USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND

# 2. Análisis específico por container
docker stats --no-stream
# CONTAINER ID   NAME       CPU %     MEM USAGE / LIMIT     MEM %
# abcd1234       seafile    15.23%    2.1GiB / 7.5GiB      28.00%

# 3. Verificar swap disponible
swapon --show
# Si no hay swap configurado:

# 4. Crear swap file (temporal)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 5. Verificar mejora memoria
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           7.5Gi       6.8Gi       345Mi       756Mi       1.9Gi       512Mi ✅

# 6. Hacer swap permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 7. Optimizar swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10
```

#### **🎯 Lección Aprendida**
**Problema:** Múltiples servicios Docker sin límites memoria  
**Impacto:** OOM kills causando indisponibilidad servicios  
**Prevención:** Configurar memory limits en docker-compose, monitoring proactivo

---

## 🔄 **Scripts de Diagnóstico Automatizado**

### **🛡️ Health Check Script Completo**

```bash
#!/bin/bash
# health-check.sh - Sistema diagnóstico automatizado
# Ubicación: /opt/scripts/health-check.sh

echo "=== HEALTH CHECK REPORT ===" 
echo "Timestamp: $(date)"
echo

# 1. Sistema Base
echo "📊 SISTEMA:"
uptime
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2" ("$5" available)"}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')"
echo

# 2. Servicios Críticos
echo "🔧 SERVICIOS:"
for service in ssh nginx docker fail2ban; do
    status=$(systemctl is-active $service)
    echo "$service: $status"
done
echo

# 3. Containers Docker
echo "🐳 CONTAINERS:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

# 4. Red y Conectividad
echo "🌐 CONECTIVIDAD:"
# Test conexión internet
if ping -c 1 google.com >/dev/null 2>&1; then
    echo "Internet: ✅ OK"
else
    echo "Internet: ❌ FAIL"
fi

# Test DuckDNS
if nslookup [tu-dominio].[YOUR_DOMAIN].duckdns.org >/dev/null 2>&1; then
    echo "DuckDNS: ✅ OK"
else
    echo "DuckDNS: ❌ FAIL"
fi

# 5. Puertos Críticos
echo
echo "🔌 PUERTOS:"
for port in [PUERTO_SSH_PERSONALIZADO] 80 443 [PUERTO_PORTAINER]; do
    if ss -tlnp | grep ":$port " >/dev/null; then
        echo "Port $port: ✅ LISTENING"
    else
        echo "Port $port: ❌ NOT LISTENING"
    fi
done

echo
echo "=== END HEALTH CHECK ==="
```

### **📈 Performance Monitoring Script**

```bash
#!/bin/bash
# performance-monitor.sh - Monitoreo recursos críticos
# Ubicación: /opt/scripts/performance-monitor.sh

LOG_FILE="/var/log/performance-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function para logging
log_metric() {
    echo "[$TIMESTAMP] $1" >> $LOG_FILE
}

# CPU Load
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
log_metric "CPU_LOAD:$CPU_LOAD"

# Memory Usage
MEM_USED=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
log_metric "MEM_USAGE:${MEM_USED}%"

# Disk Usage
DISK_USED=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
log_metric "DISK_USAGE:${DISK_USED}%"

# Docker Stats
if docker ps -q > /dev/null 2>&1; then
    DOCKER_COUNT=$(docker ps -q | wc -l)
    log_metric "DOCKER_CONTAINERS:$DOCKER_COUNT"
fi

# Network Connections
CONN_COUNT=$(ss -tun | wc -l)
log_metric "NETWORK_CONNECTIONS:$CONN_COUNT"

# Alert conditions
if (( $(echo "$MEM_USED > 90" | bc -l) )); then
    log_metric "ALERT:HIGH_MEMORY_USAGE"
fi

if [ "$DISK_USED" -gt 85 ]; then
    log_metric "ALERT:HIGH_DISK_USAGE"
fi
```

---

## 🎓 **Competencias Técnicas Desarrolladas**

### **🔧 Habilidades de Diagnóstico Avanzado**
- **Análisis sistemático de logs**: journalctl, dmesg, application logs
- **Network troubleshooting**: netstat, ss, tcpdump basics
- **Container debugging**: docker logs, exec, stats analysis
- **Performance analysis**: top, htop, iotop, memory profiling

### **🛠️ Automatización de Soluciones**
- **Script development**: bash automation para diagnóstico recurrente
- **Service management**: systemd service creation y debugging
- **Monitoring implementation**: health checks y alerting básico
- **Documentation practices**: troubleshooting runbooks detallados

### **💡 Metodología de Resolución**
- **Root cause analysis**: técnicas de investigación sistemática
- **Prevention strategies**: implementación medidas proactivas
- **Recovery procedures**: restauración rápida de servicios críticos
- **Knowledge transfer**: documentación para future troubleshooting

### **📊 Herramientas de Monitoreo**
- **System monitoring**: CPU, memoria, disco, network utilization
- **Application monitoring**: container health, service availability
- **Log aggregation**: centralización y análisis de logs múltiples fuentes
- **Performance tracking**: identificación bottlenecks y optimization opportunities

---

## 🔄 **Procedimientos de Mantenimiento Preventivo**

### **📅 Rutinas Semanales**
```bash
# Script semanal: weekly-maintenance.sh
#!/bin/bash

echo "=== WEEKLY MAINTENANCE ==="
date

# 1. System updates (verificar antes de aplicar)
sudo apt update
sudo apt list --upgradable

# 2. Docker cleanup
docker system prune -f
docker image prune -f

# 3. Log rotation manual si necesario
sudo journalctl --vacuum-time=7d

# 4. Backup configuration files
tar -czf /backups/config-$(date +%Y%m%d).tar.gz \
    /etc/nginx/ \
    /etc/fail2ban/ \
    /etc/ssh/ \
    /opt/docker-compose/

echo "Maintenance completed: $(date)"
```

### **🔍 Health Checks Diarios**
```bash
# Agregar a crontab: 0 8 * * * /opt/scripts/daily-health.sh
#!/bin/bash

/opt/scripts/health-check.sh > /tmp/health-report.txt

# Verificar issues críticos
if grep -q "❌" /tmp/health-report.txt; then
    echo "CRITICAL ISSUES DETECTED" | logger -t health-check
    # Aquí se podría integrar notificación (email, webhook, etc.)
fi

# Cleanup old performance logs
find /var/log/performance-monitor.log* -mtime +30 -delete
```

Este capítulo proporciona una metodología práctica de troubleshooting basada en problemas reales, con scripts automatizados para diagnóstico y prevención, enfocándose en el desarrollo de competencias técnicas sólidas para administración de sistemas y resolución de problemas complejos.

---

### **❌ Error 4: SSL Certificate Expired**

#### **🔍 Síntomas**
```bash
# Browser muestra "Connection not secure"
curl -I https://your-domain.[YOUR_DOMAIN].duckdns.org
# curl: (60) SSL certificate problem: certificate has expired
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar estado certificados
sudo certbot certificates
# Certificate Name: your-domain.[YOUR_DOMAIN].duckdns.org
# Expiry Date: 2024-XX-XX XX:XX:XX+00:00 (EXPIRED) ❌

# 2. Intentar renovación automática
sudo certbot renew --dry-run
# Error: "Challenge failed for domain your-domain.[YOUR_DOMAIN].duckdns.org"

# 3. Verificar puerto 80 disponible para challenge
sudo netstat -tulnp | grep :80
# tcp6 0 0 :::80 :::* LISTEN 1234/nginx ✅

# 4. Renovación manual forzada
sudo certbot renew --force-renewal
# Successfully renewed certificate for your-domain.[YOUR_DOMAIN].duckdns.org ✅

# 5. Restart nginx para aplicar certificado
sudo systemctl restart nginx

# 6. Verificar certificado válido
curl -I https://your-domain.[YOUR_DOMAIN].duckdns.org
# HTTP/2 200 OK ✅

# 7. Verificar auto-renewal timer
sudo systemctl status certbot.timer
# Active: active (waiting) ✅
```

#### **🎯 Lección Aprendida**
**Problema:** Certbot timer fallaba silenciosamente por firewall block  
**Impacto:** 12 horas con HTTPS no funcional  
**Prevención:** Alert Netdata para estado SSL + test mensual manual

---

## 🔧 **Problemas de Servicios del Sistema**

### **❌ Error 5: SSH Connection Refused**

#### **🔍 Síntomas**
```bash
# Desde cliente SSH
ssh -p [SSH_CUSTOM_PORT] user@192.168.0.100
# ssh: connect to host 192.168.0.100 port [SSH_CUSTOM_PORT]: Connection refused
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar servicio SSH activo (consola local)
sudo systemctl status ssh
# ● ssh.service - OpenBSD Secure Shell server
#    Active: inactive (dead) ❌

# 2. Revisar logs SSH
sudo journalctl -u ssh.service --no-pager
# Error común: "sshd: error: could not load host key"

# 3. Regenerar host keys si están corruptas
sudo ssh-keygen -A
# ssh-keygen: generating new host keys: RSA DSA ECDSA ED25519 ✅

# 4. Verificar configuración SSH
sudo sshd -t
# Config valid ✅

# 5. Restart servicio SSH
sudo systemctl start ssh
sudo systemctl enable ssh

# 6. Verificar puerto listening
sudo netstat -tulnp | grep :[SSH_CUSTOM_PORT]
# tcp 0 0 0.0.0.0:[SSH_CUSTOM_PORT] 0.0.0.0:* LISTEN xxx/sshd ✅

# 7. Test conexión
ssh -p [SSH_CUSTOM_PORT] user@192.168.0.100
# Last login: XXX ✅
```

#### **🎯 Lección Aprendida**
**Problema:** Host keys SSH corruptas tras power outage imprevista  
**Impacto:** Pérdida acceso remoto total 2 horas  
**Prevención:** Backup automático `/etc/ssh/` keys + UPS recomendado

---

### **❌ Error 6: Fail2Ban Not Blocking Attacks**

#### **🔍 Síntomas**
```bash
# Logs muestran múltiples intentos login
sudo tail -f /var/log/auth.log
# Failed password for root from XX.XX.XX.XX port 22
# Failed password for admin from XX.XX.XX.XX port 22
# (Sin bans aparentes)
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Verificar Fail2Ban activo
sudo systemctl status fail2ban
# Active: active (running) ✅

# 2. Verificar jails configuradas
sudo fail2ban-client status
# Number of jail: 0 ❌

# 3. Revisar configuración jail SSH
sudo cat /etc/fail2ban/jail.local
# [sshd] section missing o mal configurada

# 4. Configurar jail SSH correctamente
sudo tee -a /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = [SSH_CUSTOM_PORT]
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# 5. Restart Fail2Ban
sudo systemctl restart fail2ban

# 6. Verificar jail activa
sudo fail2ban-client status sshd
# Status for the jail: sshd
# |- Filter
# |  |- Currently failed: 0
# |  |- Total failed:     0
# |  `- File list:        /var/log/auth.log
# `- Actions
#    |- Currently banned: 0
#    |- Total banned:     0
#    `- Banned IP list:   ✅

# 7. Test funcionamiento (usar IP test)
sudo fail2ban-client set sshd banip 192.168.0.100
# Banned 192.168.0.100 ✅
sudo fail2ban-client set sshd unbanip 192.168.0.100
```

#### **🎯 Lección Aprendida**
**Problema:** Puerto SSH cambiado a [SSH_CUSTOM_PORT] pero jail seguía monitoreando puerto 22  
**Impacto:** Ataques brute force sin protección 48 horas  
**Prevención:** Validación jail ports tras cambios configuración SSH

---

## 💾 **Problemas de Almacenamiento y Performance**

### **❌ Error 7: Disk Space Full**

#### **🔍 Síntomas**
```bash
# Servicios fallan con errores write
df -h
# /dev/sda1       XXX       XXX  100% /
# Applications crashing con "No space left on device"
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Identificar directorios que más consumen
sudo du -h --max-depth=1 / | sort -hr
# 15G  /var
# 8G   /home
# 3G   /opt

# 2. Analizar subdirectorios /var (común culprit)
sudo du -h --max-depth=1 /var | sort -hr
# 12G  /var/log
# 2G   /var/lib

# 3. Revisar logs más grandes
sudo ls -lah /var/log/ | sort -k5 -hr
# -rw-r--r-- 1 root root 8.2G date netdata-error.log
# -rw-r--r-- 1 root root 3.1G date syslog

# 4. Limpiar logs antiguos de forma segura
sudo journalctl --vacuum-time=7d
sudo find /var/log -name "*.log" -type f -mtime +7 -delete
sudo find /var/log -name "*.log.*" -type f -delete

# 5. Limpiar Docker system
sudo docker system prune -a -f
# Total reclaimed: 4.2GB ✅

# 6. Configurar logrotate agresivo
sudo tee /etc/logrotate.d/netdata << 'EOF'
/var/log/netdata/*.log {
    daily
    rotate 3
    missingok
    compress
    notifempty
    postrotate
        /bin/kill -HUP `cat /var/run/netdata.pid 2> /dev/null` 2> /dev/null || true
    endscript
}
EOF

# 7. Verificar espacio recuperado
df -h /
# /dev/sda1       XXX       XXX   85% / ✅
```

#### **🎯 Lección Aprendida**
**Problema:** Logs Netdata crecían sin rotación configurada  
**Impacto:** Sistema completo inoperativo 6 horas  
**Prevención:** Alert Netdata cuando disk usage > 80% + logrotate configurado

---

### **❌ Error 8: High Memory Usage**

#### **🔍 Síntomas**
```bash
# Sistema muy lento, aplicaciones crashean
free -h
#              total   used   free   available
# Mem:          16Gi   15Gi   100Mi      200Mi  ❌
```

#### **🔧 Diagnóstico y Resolución**
```bash
# 1. Identificar procesos que más consumen
ps aux --sort=-%mem | head -10
# USER   PID %CPU %MEM    VSZ   RSS TTY  STAT COMMAND
# root   1234  5.0 45.2 8192000 7340000 ? S  container_process

# 2. Identificar containers problemáticos
docker stats --no-stream
# CONTAINER   CPU %   MEM USAGE / LIMIT    MEM %
# seafile     12.5%   7.2GiB / 8GiB       90.00% ❌

# 3. Revisar logs del container problemático
docker logs seafile --tail 100
# Error: "Out of memory" OR memory leaks aparentes

# 4. Restart container problemático
docker restart seafile

# 5. Configurar memory limits en docker-compose.yml
# mem_limit: 2g
# mem_reservation: 1g

# 6. Verificar mejora
free -h
#              total   used   free   available
# Mem:          16Gi   8Gi    4Gi    7Gi       ✅

# 7. Configurar swap si no existe
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 8. Añadir a fstab para persistencia
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### **🎯 Lección Aprendida**
**Problema:** Container sin memory limits consumía toda RAM disponible  
**Impacto:** Sistema completo inutilizable por 2 horas  
**Prevención:** Memory limits obligatorios en todos containers + swap configurado

---

## 🔧 **Procedimientos de Recovery Críticos**

### **🚨 Procedure 1: Complete System Recovery**

#### **📋 Síntomas de Sistema Crítico**
- SSH no responde
- Servicios web inaccesibles
- Multiple containers down
- Sistema extremadamente lento

#### **🔧 Recovery Steps (Acceso Físico Necesario)**
```bash
# 1. Boot en recovery mode (consola física)
# - Reboot sistema
# - Seleccionar "Advanced options" en GRUB
# - Elegir "recovery mode"

# 2. Mount filesystem read-write
mount -o remount,rw /

# 3. Verificar filesystem integrity
fsck -f /dev/sda1

# 4. Verificar espacio disco
df -h

# 5. Si disk full, cleanup emergencia
rm -rf /tmp/*
rm -rf /var/tmp/*
journalctl --vacuum-time=1d

# 6. Restart servicios críticos orden
systemctl start networking
systemctl start ssh
systemctl start docker

# 7. Verificar containers críticos
docker ps -a
docker start $(docker ps -a -q --filter "status=exited")

# 8. Test conectividad SSH
# Desde otro equipo: ssh -p [SSH_CUSTOM_PORT] user@192.168.0.100

# 9. Recovery completo exitoso
systemctl reboot
```

#### **🎯 Tiempo Recovery**
**Target**: Sistema operativo completo en < 30 minutos  
**Verificado**: Recovery completo realizado en 22 minutos  

---

### **🚨 Procedure 2: Docker Stack Recovery**

#### **📋 Para Cuando Solo Docker Falla**
```bash
# 1. Stop all containers
docker stop $(docker ps -aq)

# 2. Prune system completo
docker system prune -a -f --volumes

# 3. Verificar docker daemon
sudo systemctl restart docker

# 4. Recrear stack desde docker-compose
cd /opt/docker-compose/
docker-compose up -d

# 5. Verificar cada servicio individualmente
docker-compose ps
docker-compose logs seafile
docker-compose logs portainer

# 6. Test acceso cada servicio
curl -I http://localhost:8080  # Seafile
curl -I http://localhost:9000  # Portainer
```

---

## 📊 **Scripts de Diagnóstico Automatizado**

### **🔍 Health Check Completo**

```bash
#!/bin/bash
# /home/user/scripts/system-health-check.sh

echo "=== ORANGE PI 5 PLUS HEALTH CHECK ==="
echo "Timestamp: $(date)"
echo "======================================="

# System Status
echo "🖥️  SYSTEM STATUS"
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "CPU Temp: $(cat /sys/class/thermal/thermal_zone0/temp | awk '{print $1/1000 "°C"}')"
echo ""

# Memory Status
echo "💾 MEMORY STATUS"
free -h | grep -E "^Mem:|^Swap:"
echo ""

# Disk Status
echo "💿 DISK STATUS"
df -h / | tail -1
echo ""

# Services Status
echo "🔧 CRITICAL SERVICES"
services=("ssh" "docker" "nginx" "fail2ban" "duckdns.timer")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Failed"
    fi
done
echo ""

# Docker Status
echo "🐳 DOCKER CONTAINERS"
if command -v docker >/dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}" | while read line; do
        if [[ $line == *"Up"* ]]; then
            echo "✅ $line"
        else
            echo "❌ $line"
        fi
    done
else
    echo "❌ Docker not available"
fi
echo ""

# Network Status
echo "🌐 NETWORK STATUS"
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ Internet: Connected"
else
    echo "❌ Internet: Disconnected"
fi

if curl -s -I http://localhost >/dev/null; then
    echo "✅ Web Server: Responding"
else
    echo "❌ Web Server: Not responding"
fi
echo ""

# SSL Certificate Status
echo "🔒 SSL STATUS"
cert_expiry=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.[YOUR_DOMAIN].duckdns.org/cert.pem 2>/dev/null | cut -d= -f2)
if [[ -n "$cert_expiry" ]]; then
    echo "✅ SSL Certificate valid until: $cert_expiry"
else
    echo "❌ SSL Certificate: Not found or invalid"
fi

echo "======================================="
echo "Health check completed"
```

### **🚨 Emergency Alert Script**

```bash
#!/bin/bash
# /home/user/scripts/emergency-alert.sh

LOGFILE="/var/log/emergency-alerts.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log alerts
log_alert() {
    echo "[$TIMESTAMP] EMERGENCY: $1" >> $LOGFILE
    echo "[$TIMESTAMP] EMERGENCY: $1"
}

# Check critical conditions
if ! systemctl is-active --quiet ssh; then
    log_alert "SSH service is down - Remote access lost"
fi

if ! systemctl is-active --quiet docker; then
    log_alert "Docker service is down - All containers stopped"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    log_alert "Disk usage critical: ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 90 ]; then
    log_alert "Memory usage critical: ${MEM_USAGE}%"
fi

# Check CPU temperature
CPU_TEMP=$(cat /sys/class/thermal/thermal_zone0/temp | awk '{print $1/1000}')
if (( $(echo "$CPU_TEMP > 80" | bc -l) )); then
    log_alert "CPU temperature critical: ${CPU_TEMP}°C"
fi
```

---

## ✅ **Checklist de Verificación Post-Resolución**

### **📋 Después de Cualquier Troubleshooting**

```bash
# 1. ✅ Verificar servicios críticos
sudo systemctl status ssh docker nginx fail2ban

# 2. ✅ Verificar containers Docker
docker ps
# Todos containers "Up" estado

# 3. ✅ Test conectividad web
curl -I http://192.168.0.100
curl -I https://your-domain.[YOUR_DOMAIN].duckdns.org

# 4. ✅ Verificar acceso SSH
ssh -p [SSH_CUSTOM_PORT] user@192.168.0.100 "uptime"

# 5. ✅ Verificar monitoreo
curl -I http://192.168.0.100:19999

# 6. ✅ Check logs por errores
sudo journalctl --since "1 hour ago" | grep -i error

# 7. ✅ Backup estado actual si todo OK
sudo rsync -av /etc/ /backup/etc-$(date +%Y%m%d)/
```

### **📊 Métricas Post-Recovery**
- **Services restored**: < 5 minutos para servicios individuales
- **Complete recovery**: < 30 minutos para recovery total sistema
- **Zero data loss**: Configuraciones persistentes en Docker volumes
- **Documentation updated**: Cada incident documentado con resolución

---

## 📝 **Lecciones Aprendidas Consolidadas**

### **✅ Patrones de Problemas Más Frecuentes**

1. **Docker Containers (40% incidentes)**
   - Permissions volúmenes tras restart
   - Memory limits no configurados
   - Network conflicts por updates

2. **SSL/DNS (25% incidentes)**
   - Certificados expirados por timer fail
   - DuckDNS updates interrumpidos
   - Firewall blocking challenges

3. **System Resources (20% incidentes)**
   - Disk space por logs descontrolados
   - Memory leaks en containers
   - CPU throttling por temperatura

4. **Network/SSH (15% incidentes)**
   - Host keys corruptas power outage
   - Fail2Ban jails mal configuradas
   - Port conflicts tras updates

### **🎯 Mejores Prácticas Desarrolladas**

#### **🔧 Preventivo**
- **Health checks automáticos** cada 15 minutos
- **Alertas proactivas** antes que problemas críticos
- **Backups configuraciones** automáticos diarios
- **Memory/disk limits** obligatorios todos containers

#### **⚡ Reactivo**
- **Recovery procedures** documentados y testados
- **Emergency access** siempre disponible (consola física)
- **Rollback plans** para cada change importante
- **Post-incident reviews** documentados

### **📈 Métricas de Mejora**
- **MTTR (Mean Time To Recovery)**: Reducido de 2h → 30min
- **Incident frequency**: Reducido 60% con monitoring proactivo
- **Success rate**: 95% problemas resueltos remotamente
- **Documentation coverage**: 100% incidents con playbook

---

## 🎯 **Preparación para Portfolio**

### **💼 Valor Profesional Demostrado**

#### **🔧 Competencias Técnicas**
- **Troubleshooting sistemático** con metodología probada
- **Docker expertise** en diagnostics y recovery
- **Linux administration** avanzado para production
- **Network diagnostics** desde layer 1 hasta applicación
- **Security hardening** con fail2ban y SSL management

#### **📊 Business Impact**
- **Downtime minimizado**: Recovery procedures < 30min
- **Proactive monitoring**: Issues detectados antes impacto usuarios
- **Documentation complete**: Knowledge transfer preparado
- **Cost efficiency**: Self-healing system reduce intervention manual

#### **🚀 Escalabilidad Demostrada**
- **Playbooks reusables** para cualquier environment similar
- **Automation scripts** para reduce manual intervention
- **Monitoring integration** con business metrics
- **Disaster recovery** tested y documentado

---

*Capítulo completado: Sistema de troubleshooting profesional con procedures verificados, documentation completa y automation para minimize downtime en production environment*

