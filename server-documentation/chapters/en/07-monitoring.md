# Monitoring

## Netdata and System Monitoring Implementation

This chapter covers the comprehensive implementation of system monitoring using Netdata, log analysis, performance metrics, and alerting systems for the Orange Pi 5 Plus server environment.

### Netdata Installation and Configuration

#### Install Netdata Real-time Monitoring
```bash
# Download and install Netdata
bash  $REPORT_FILE
echo "" >> $REPORT_FILE

# System errors
echo "=== SYSTEM ERRORS ===" >> $REPORT_FILE
journalctl --since "24 hours ago" --priority=err --no-pager >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Failed login attempts
echo "=== FAILED LOGIN ATTEMPTS ===" >> $REPORT_FILE
grep "Failed password" /var/log/auth.log | tail -20 >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Docker container issues
echo "=== DOCKER CONTAINER ISSUES ===" >> $REPORT_FILE
docker ps --filter "status=exited" --format "table {{.Names}}\t{{.Status}}" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Apache errors
echo "=== APACHE ERRORS ===" >> $REPORT_FILE
tail -50 /var/log/apache2/error.log >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Disk usage
echo "=== DISK USAGE ===" >> $REPORT_FILE
df -h >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Memory usage
echo "=== MEMORY USAGE ===" >> $REPORT_FILE
free -h >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Network connections
echo "=== NETWORK CONNECTIONS ===" >> $REPORT_FILE
ss -tuln >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Send report if errors found
if grep -q "error\|failed\|critical" $REPORT_FILE; then
    mail -s "Daily System Report - Issues Found" admin@your-domain.com  70
    crit: $this > 80
    info: Orange Pi CPU temperature

# Memory usage alerts  
template: orangepi_memory_usage
      on: system.ram
   hosts: *
   calc: $used * 100 / ($used + $cached + $free + $buffers)
   units: %
   every: 10s
    warn: $this > 80
    crit: $this > 90
    info: Orange Pi memory usage

# Disk space alerts
template: orangepi_disk_usage
      on: disk_space.used
   hosts: *
   calc: $used * 100 / ($avail + $used)
   units: %
   every: 10s
    warn: $this > 80
    crit: $this > 90
    info: Orange Pi disk usage

# Docker container health
template: docker_container_health
      on: docker_engine.container_health_status
   hosts: *
   calc: $unhealthy
   units: containers
   every: 30s
    warn: $this > 0
    crit: $this > 2
    info: Unhealthy Docker containers detected

# Network interface status
template: network_interface_status
      on: net.operstate
   hosts: *
   calc: $up
   units: status
   every: 10s
    crit: $this == 0
    info: Network interface down
```

#### Email Alert Configuration
```bash
# Configure email notifications
sudo vim /etc/netdata/health_alarm_notify.conf
```

```bash
# Email configuration
SEND_EMAIL="YES"
DEFAULT_RECIPIENT_EMAIL="admin@your-domain.com"
EMAIL_SENDER="netdata@your-domain.com"

# Notification methods
SEND_SLACK="NO"
SEND_DISCORD="NO"
SEND_TELEGRAM="NO"

# Alert levels
EMAIL_PLAINTEXT_ONLY="YES"
```

### Grafana Integration (Optional)

#### Install Grafana
```bash
# Add Grafana repository
curl -fsSL https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

# Install Grafana
sudo apt update
sudo apt install -y grafana

# Enable and start Grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

#### Configure Grafana for Netdata
```bash
# Create Grafana dashboard configuration
sudo vim /etc/grafana/provisioning/datasources/netdata.yaml
```

```yaml
apiVersion: 1

datasources:
  - name: Netdata
    type: prometheus
    url: http://localhost:19999/api/v1/allmetrics?format=prometheus
    access: proxy
    isDefault: true
```

### System Health Monitoring Scripts

#### Comprehensive Health Check
```bash
# Create comprehensive health check script
sudo vim /usr/local/bin/system-health-check.sh
```

```bash
#!/bin/bash

HEALTH_LOG="/var/log/system-health.log"
ALERT_EMAIL="admin@your-domain.com"
CRITICAL_ISSUES=0

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $HEALTH_LOG
}

check_temperature() {
    CPU_TEMP=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0")
    CPU_TEMP_C=$((CPU_TEMP / 1000))
    
    if [ $CPU_TEMP_C -gt 80 ]; then
        log_message "CRITICAL: CPU temperature is ${CPU_TEMP_C}°C"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    elif [ $CPU_TEMP_C -gt 70 ]; then
        log_message "WARNING: CPU temperature is ${CPU_TEMP_C}°C"
    fi
}

check_memory() {
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    
    if [ $MEMORY_USAGE -gt 90 ]; then
        log_message "CRITICAL: Memory usage is ${MEMORY_USAGE}%"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    elif [ $MEMORY_USAGE -gt 80 ]; then
        log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
    fi
}

check_disk_space() {
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $DISK_USAGE -gt 90 ]; then
        log_message "CRITICAL: Disk usage is ${DISK_USAGE}%"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    elif [ $DISK_USAGE -gt 80 ]; then
        log_message "WARNING: Disk usage is ${DISK_USAGE}%"
    fi
}

check_services() {
    SERVICES=("apache2" "mysql" "docker" "netdata" "ssh")
    
    for service in "${SERVICES[@]}"; do
        if ! systemctl is-active --quiet $service; then
            log_message "CRITICAL: Service $service is not running"
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        fi
    done
}

check_docker_containers() {
    UNHEALTHY_CONTAINERS=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | wc -l)
    STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | wc -l)
    
    if [ $UNHEALTHY_CONTAINERS -gt 0 ]; then
        log_message "CRITICAL: $UNHEALTHY_CONTAINERS unhealthy containers"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    if [ $STOPPED_CONTAINERS -gt 0 ]; then
        log_message "WARNING: $STOPPED_CONTAINERS stopped containers"
    fi
}

check_network_connectivity() {
    if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log_message "CRITICAL: No internet connectivity"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
}

check_ssl_certificates() {
    CERT_FILE="/etc/letsencrypt/live/your-domain.com/fullchain.pem"
    if [ -f "$CERT_FILE" ]; then
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        if [ $DAYS_LEFT -lt 7 ]; then
            log_message "CRITICAL: SSL certificate expires in $DAYS_LEFT days"
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        elif [ $DAYS_LEFT -lt 30 ]; then
            log_message "WARNING: SSL certificate expires in $DAYS_LEFT days"
        fi
    fi
}

# Run all checks
log_message "Starting system health check"
check_temperature
check_memory
check_disk_space
check_services
check_docker_containers
check_network_connectivity
check_ssl_certificates

# Send alert if critical issues found
if [ $CRITICAL_ISSUES -gt 0 ]; then
    SUBJECT="CRITICAL: System Health Alert - $CRITICAL_ISSUES issues found"
    tail -20 $HEALTH_LOG | mail -s "$SUBJECT" $ALERT_EMAIL
    log_message "Critical issues detected, alert sent"
fi

log_message "System health check completed"
```

```bash
# Make executable and schedule every 5 minutes
sudo chmod +x /usr/local/bin/system-health-check.sh
echo "*/5 * * * * /usr/local/bin/system-health-check.sh" | sudo crontab -
```

### Resource Usage Monitoring

#### Create Resource Monitoring Dashboard
```bash
# Create simple web dashboard
sudo mkdir -p /var/www/monitoring
sudo vim /var/www/monitoring/index.php
```

```php
/dev/null");
    if ($output) {
        $lines = explode("\n", trim($output));
        foreach ($lines as $line) {
            if (!empty($line)) {
                $container = json_decode($line, true);
                $containers[] = [
                    'name' => $container['Names'],
                    'status' => $container['Status'],
                    'image' => $container['Image']
                ];
            }
        }
    }
    return $containers;
}

// Service status
function getServiceStatus() {
    $services = ['apache2', 'mysql', 'docker', 'netdata', 'ssh'];
    $status = [];
    
    foreach ($services as $service) {
        $result = shell_exec("systemctl is-active $service 2>/dev/null");
        $status[$service] = trim($result) === 'active';
    }
    
    return $status;
}

// Compile all information
$response = [
    'timestamp' => time(),
    'system' => getSystemInfo(),
    'docker' => getDockerStatus(),
    'services' => getServiceStatus()
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
```

### Performance Baseline and Trending

#### Create Performance Baseline Script
```bash
# Create baseline performance script
sudo vim /usr/local/bin/performance-baseline.sh
```

```bash
#!/bin/bash

BASELINE_DIR="/var/log/performance"
CURRENT_DATE=$(date +%Y%m%d)
BASELINE_FILE="$BASELINE_DIR/baseline-$CURRENT_DATE.log"

mkdir -p $BASELINE_DIR

echo "=== Performance Baseline - $(date) ===" > $BASELINE_FILE

# CPU information
echo "=== CPU INFORMATION ===" >> $BASELINE_FILE
lscpu >> $BASELINE_FILE
echo "" >> $BASELINE_FILE

# Memory information
echo "=== MEMORY INFORMATION ===" >> $BASELINE_FILE
free -h >> $BASELINE_FILE
cat /proc/meminfo >> $BASELINE_FILE
echo "" >> $BASELINE_FILE

# Disk I/O performance
echo "=== DISK I/O PERFORMANCE ===" >> $BASELINE_FILE
iostat -x 1 5 >> $BASELINE_FILE
echo "" >> $BASELINE_FILE

# Network performance
echo "=== NETWORK PERFORMANCE ===" >> $BASELINE_FILE
for interface in eth0 eth1; do
    if [ -d "/sys/class/net/$interface" ]; then
        echo "Interface: $interface" >> $BASELINE_FILE
        ethtool $interface 2>/dev/null >> $BASELINE_FILE
        echo "" >> $BASELINE_FILE
    fi
done

# Temperature baseline
echo "=== TEMPERATURE BASELINE ===" >> $BASELINE_FILE
for thermal_zone in /sys/class/thermal/thermal_zone*; do
    if [ -f "$thermal_zone/temp" ]; then
        temp=$(cat $thermal_zone/temp 2>/dev/null || echo "0")
        temp_c=$((temp / 1000))
        echo "$(basename $thermal_zone): ${temp_c}°C" >> $BASELINE_FILE
    fi
done
echo "" >> $BASELINE_FILE

# Process baseline
echo "=== TOP PROCESSES ===" >> $BASELINE_FILE
ps aux --sort=-%cpu | head -20 >> $BASELINE_FILE
echo "" >> $BASELINE_FILE

echo "Performance baseline completed: $BASELINE_FILE"
```

```bash
# Schedule weekly baseline collection
sudo chmod +x /usr/local/bin/performance-baseline.sh
echo "0 4 * * 1 /usr/local/bin/performance-baseline.sh" | sudo crontab -
```

### Firewall and Access Configuration

#### Configure Netdata Access
```bash
# Allow Netdata through firewall
sudo ufw allow from 192.168.1.0/24 to any port 19999 comment 'Netdata monitoring'

# Create Netdata Apache virtual host for secure access
sudo vim /etc/apache2/sites-available/monitoring.conf
```

```apache

    ServerName monitoring.your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    
    # Basic Authentication
    
        AuthType Basic
        AuthName "Monitoring Access"
        AuthUserFile /etc/apache2/.htpasswd-monitoring
        Require valid-user
    
    
    # Proxy to Netdata
    ProxyPreserveHost On
    ProxyPass / http://localhost:19999/
    ProxyPassReverse / http://localhost:19999/
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"

```

```bash
# Create monitoring user
sudo htpasswd -c /etc/apache2/.htpasswd-monitoring admin

# Enable monitoring site
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite monitoring.conf
sudo systemctl reload apache2
```

### Maintenance and Cleanup

#### Automated Cleanup Script
```bash
# Create cleanup script
sudo vim /usr/local/bin/monitoring-cleanup.sh
```

```bash
#!/bin/bash

# Clean old log files (keep 30 days)
find /var/log/analysis -name "*.txt" -mtime +30 -delete
find /var/log/performance -name "*.log" -mtime +30 -delete
find /var/log -name "*.log.*.gz" -mtime +90 -delete

# Clean old Netdata logs
find /var/log/netdata -name "*.log" -mtime +7 -delete

# Restart Netdata weekly to prevent memory leaks
if [ $(date +%u) -eq 1 ]; then
    systemctl restart netdata
fi

# Clean up old monitoring data
docker system prune -f --volumes --filter "until=24h" >/dev/null 2>&1

echo "Monitoring cleanup completed: $(date)"
```

```bash
# Schedule daily cleanup
sudo chmod +x /usr/local/bin/monitoring-cleanup.sh
echo "0 2 * * * /usr/local/bin/monitoring-cleanup.sh" | sudo crontab -
```

### Conclusion

This comprehensive monitoring implementation provides real-time visibility into the Orange Pi 5 Plus server performance, resource utilization, and system health. The combination of Netdata, custom scripts, and automated alerting ensures proactive monitoring and rapid response to potential issues.

The monitoring setup includes temperature monitoring specific to ARM64 architecture, container health tracking, and automated reporting that enables efficient maintenance and optimization of the server environment.
