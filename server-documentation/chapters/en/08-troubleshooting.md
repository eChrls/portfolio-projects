# Troubleshooting

## Common Issues and Solutions

This chapter provides comprehensive troubleshooting guides for common problems encountered when running services on the Orange Pi 5 Plus server, including system issues, container problems, network connectivity, and performance bottlenecks.

### System-Level Troubleshooting

#### Boot and Hardware Issues

##### Orange Pi Won't Boot
```bash
# Check power supply
# Ensure 65W USB-C PD adapter is used
# Verify power LED status

# Check microSD card integrity
# On another computer:
fsck -f /dev/sdX1  # Replace X with your SD card device

# Verify image integrity
sha256sum ubuntu-24.04-server-arm64.img

# Check boot logs via serial console
# Connect USB-TTL adapter to GPIO pins 8 (TX) and 10 (RX)
sudo minicom -D /dev/ttyUSB0 -b 115200
```

##### System Overheating
```bash
# Monitor temperatures
watch -n 1 'cat /sys/class/thermal/thermal_zone*/temp | while read temp; do echo "scale=1; $temp/1000" | bc; done'

# Check cooling solution
# Ensure heatsink is properly mounted
# Verify thermal paste application

# Reduce CPU frequency temporarily
echo powersave | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Install additional cooling
sudo apt install -y fancontrol
sudo sensors-detect
sudo pwmconfig
```

##### Memory Issues
```bash
# Test memory
sudo apt install -y memtester
sudo memtester 1G 1

# Check memory usage
free -h
sudo swapon --show

# Clear memory caches
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'

# Check for memory leaks
sudo ps aux --sort=-%mem | head -10
```

#### Storage Problems

##### SD Card Corruption
```bash
# Check filesystem integrity
sudo fsck -f /dev/mmcblk1p1
sudo fsck -f /dev/mmcblk1p2

# Monitor SD card health
sudo smartctl -a /dev/mmcblk1

# Check for bad blocks
sudo badblocks -v /dev/mmcblk1

# Backup critical data immediately if corruption detected
sudo dd if=/dev/mmcblk1 of=/backup/sdcard-backup.img bs=4M status=progress
```

##### Disk Space Issues
```bash
# Identify large files and directories
sudo du -h --max-depth=1 / | sort -hr
sudo find / -type f -size +100M 2>/dev/null | head -20

# Clean system logs
sudo journalctl --vacuum-size=100M
sudo logrotate -f /etc/logrotate.conf

# Clean package cache
sudo apt autoremove -y
sudo apt autoclean

# Clean Docker resources
docker system prune -af --volumes
docker image prune -af
```

##### Performance Issues
```bash
# Monitor I/O wait
iostat -x 1 5

# Check for high I/O processes
sudo iotop -a

# Optimize SD card performance
echo mq-deadline | sudo tee /sys/block/mmcblk1/queue/scheduler

# Check mount options
mount | grep mmcblk1
# Consider adding noatime,nodiratime to /etc/fstab
```

### Network Troubleshooting

#### Connectivity Issues

##### No Network Connection
```bash
# Check physical connection
ip link show

# Verify interface status
nmcli device status

# Check IP configuration
ip addr show
ip route show

# Test DNS resolution
nslookup google.com
dig google.com

# Check network services
sudo systemctl status networking
sudo systemctl status NetworkManager
```

##### Slow Network Performance
```bash
# Test network speed
sudo apt install -y iperf3
iperf3 -c speedtest.serverius.net -p 5002

# Check network statistics
cat /proc/net/dev
ss -i

# Monitor network usage
sudo nethogs eth0
sudo iftop -i eth0

# Check for packet loss
ping -c 100 8.8.8.8 | grep loss
mtr google.com
```

##### Ethernet Interface Problems
```bash
# Check interface configuration
ethtool eth0
ethtool eth1

# Reset network interface
sudo ip link set eth0 down
sudo ip link set eth0 up

# Check network cable
ethtool eth0 | grep "Link detected"

# Test with different cables/ports
# Check switch/router logs
```

#### Firewall and Security Issues

##### UFW Blocking Legitimate Traffic
```bash
# Check UFW status and rules
sudo ufw status numbered verbose

# Check UFW logs
sudo tail -f /var/log/ufw.log

# Temporarily disable UFW for testing
sudo ufw disable
# Test connectivity
sudo ufw enable

# Add specific rules
sudo ufw allow from 192.168.1.0/24
sudo ufw allow out 53  # DNS
```

##### Fail2Ban Issues
```bash
# Check Fail2Ban status
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Unban IP address
sudo fail2ban-client set sshd unbanip 192.168.1.100

# Check Fail2Ban logs
sudo tail -f /var/log/fail2ban.log

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### Docker Container Troubleshooting

#### Container Startup Issues

##### Container Won't Start
```bash
# Check container status
docker ps -a
docker logs container-name

# Inspect container configuration
docker inspect container-name

# Check resource usage
docker stats container-name

# Verify image integrity
docker pull image-name

# Check for port conflicts
sudo netstat -tulpn | grep :8080
```

##### Container Health Check Failures
```bash
# Check health status
docker ps --filter health=unhealthy

# View health check logs
docker inspect container-name | grep -A 10 Health

# Manual health check
docker exec container-name curl -f http://localhost:8080/health || exit 1

# Update health check configuration
# In docker-compose.yml:
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

##### Database Connection Issues
```bash
# Check MySQL container
docker logs mysql-server

# Test database connectivity
docker exec -it mysql-server mysql -u root -p -e "SHOW DATABASES;"

# Check database configuration
docker exec mysql-server cat /etc/mysql/conf.d/custom.cnf

# Verify network connectivity between containers
docker exec seafile-server ping mysql-server
docker network inspect backend
```

#### Performance Issues

##### High Memory Usage
```bash
# Monitor container memory usage
docker stats --no-stream

# Check container limits
docker inspect container-name | grep -A 10 Memory

# Add memory limits to docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

##### Slow Container Performance
```bash
# Check container I/O
docker exec container-name iostat -x 1 5

# Monitor container processes
docker exec container-name top

# Check container logs for errors
docker logs --tail 100 container-name

# Optimize container startup
# Use multi-stage builds
# Minimize image layers
# Use .dockerignore
```

### Web Server Troubleshooting

#### Apache Issues

##### Apache Won't Start
```bash
# Check Apache status
sudo systemctl status apache2

# Test configuration
sudo apache2ctl configtest

# Check error logs
sudo tail -f /var/log/apache2/error.log

# Check port conflicts
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Verify SSL certificates
sudo certbot certificates
openssl x509 -in /etc/letsencrypt/live/domain/fullchain.pem -text -noout
```

##### 500 Internal Server Error
```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/error.log

# Check PHP error logs
sudo tail -f /var/log/php/error.log

# Verify file permissions
ls -la /var/www/portfolio/
sudo chown -R www-data:www-data /var/www/portfolio/
sudo chmod -R 755 /var/www/portfolio/

# Test PHP configuration
php -m  # Check loaded modules
php -i | grep error  # Check error settings
```

##### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/domain/cert.pem -text -noout

# Test SSL configuration
openssl s_client -connect your-domain.com:443

# Renew certificates
sudo certbot renew --dry-run
sudo certbot renew

# Check certificate auto-renewal
sudo systemctl status certbot.timer
sudo systemctl list-timers | grep certbot
```

#### PHP Issues

##### PHP Errors and Warnings
```bash
# Enable PHP error logging
sudo vim /etc/php/8.3/apache2/php.ini
# Set: log_errors = On
# Set: error_log = /var/log/php/error.log

# Check PHP-FPM status (if using FPM)
sudo systemctl status php8.3-fpm

# Test PHP configuration
php -l index.php  # Syntax check
php --ini  # Show configuration files

# Memory and execution issues
# Increase memory_limit
# Increase max_execution_time
# Check for infinite loops
```

##### Database Connection Issues
```bash
# Test MySQL connection from PHP
php -r "
$pdo = new PDO('mysql:host=localhost;dbname=portfolio_db', 'portfolio_user', 'password');
echo 'Connection successful!';
"

# Check MySQL service
sudo systemctl status mysql

# Verify MySQL user permissions
mysql -u root -p
SHOW GRANTS FOR 'portfolio_user'@'localhost';

# Test network connectivity
telnet localhost 3306
```

### Monitoring and Logging Issues

#### Netdata Issues

##### Netdata Not Collecting Data
```bash
# Check Netdata status
sudo systemctl status netdata

# Check Netdata configuration
sudo netdata -W set

# Test configuration
sudo /usr/sbin/netdata -D

# Check permissions
ls -la /etc/netdata/
sudo chown -R netdata:netdata /etc/netdata/
```

##### High Resource Usage by Monitoring
```bash
# Check monitoring overhead
ps aux | grep netdata
ps aux | grep prometheus

# Optimize Netdata configuration
sudo vim /etc/netdata/netdata.conf
# Reduce update frequency
# Disable unnecessary plugins

# Limit historical data
[global]
history = 3600  # 1 hour instead of default
```

#### Log Analysis Problems

##### Log Files Growing Too Large
```bash
# Check log sizes
sudo du -sh /var/log/*

# Configure log rotation
sudo vim /etc/logrotate.d/custom-logs

/var/log/custom/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
}

# Force log rotation
sudo logrotate -f /etc/logrotate.conf
```

##### Missing or Incomplete Logs
```bash
# Check rsyslog configuration
sudo systemctl status rsyslog

# Test log generation
logger "Test message"
tail /var/log/syslog

# Check log permissions
ls -la /var/log/
sudo chmod 644 /var/log/*.log
```

### Performance Optimization

#### System Performance Tuning

##### High CPU Usage
```bash
# Identify CPU-intensive processes
top -c
htop
ps aux --sort=-%cpu

# Check CPU frequency scaling
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
cat /sys/devices/system/cpu/cpu*/cpufreq/cpuinfo_cur_freq

# Optimize CPU governor
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Limit problematic processes
sudo cpulimit -p PID -l 50  # Limit to 50% CPU
```

##### Memory Optimization
```bash
# Analyze memory usage
sudo smem -t -k
cat /proc/meminfo

# Configure swap
sudo swapon --show
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Optimize swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

##### I/O Performance Issues
```bash
# Monitor I/O
sudo iotop -a
iostat -x 1

# Check filesystem
sudo tune2fs -l /dev/mmcblk1p1

# Optimize mount options
# Add to /etc/fstab:
/dev/mmcblk1p1 / ext4 defaults,noatime,nodiratime 0 1

# Use faster I/O scheduler
echo mq-deadline | sudo tee /sys/block/mmcblk1/queue/scheduler
```

### Backup and Recovery

#### Backup Failures

##### Backup Script Issues
```bash
# Test backup script manually
sudo bash -x /usr/local/bin/backup-script.sh

# Check backup destination space
df -h /backup/

# Verify backup integrity
tar -tzf backup-file.tar.gz | head -20

# Test restore procedure
mkdir /tmp/test-restore
tar -xzf backup-file.tar.gz -C /tmp/test-restore
```

##### Database Backup Issues
```bash
# Test MySQL backup
mysqldump -u root -p --all-databases > test-backup.sql

# Check MySQL binary logs
mysql -u root -p -e "SHOW BINARY LOGS;"

# Verify backup consistency
mysql -u root -p  /tmp/emergency-network.sh  /etc/resolv.conf
service ssh start
EOF

chmod +x /tmp/emergency-network.sh
/tmp/emergency-network.sh
```

### Preventive Measures

#### Monitoring Scripts for Early Detection
```bash
# Create early warning system
cat > /usr/local/bin/early-warning.sh /dev/null | head -c 2)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

# Early warning thresholds
if [ $CPU_TEMP -gt 65 ]; then
    echo "WARNING: CPU temperature trending high: ${CPU_TEMP}°C"
fi

if [ $MEMORY_USAGE -gt 70 ]; then
    echo "WARNING: Memory usage trending high: ${MEMORY_USAGE}%"
fi

if [ $DISK_USAGE -gt 75 ]; then
    echo "WARNING: Disk usage trending high: ${DISK_USAGE}%"
fi
EOF

chmod +x /usr/local/bin/early-warning.sh
echo "*/2 * * * * /usr/local/bin/early-warning.sh" | crontab -
```

#### Automated Health Checks
```bash
# Create comprehensive health check
cat > /usr/local/bin/health-monitor.sh  $HEALTH_FILE

# Check all critical services
CRITICAL_SERVICES=("apache2" "mysql" "docker" "ssh")
for service in "${CRITICAL_SERVICES[@]}"; do
    if ! systemctl is-active --quiet $service; then
        echo "UNHEALTHY: $service down" > $HEALTH_FILE
        echo "Critical service $service is down" | mail -s "Service Alert" $ALERT_EMAIL
    fi
done

# Check container health
UNHEALTHY_CONTAINERS=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")
if [ -n "$UNHEALTHY_CONTAINERS" ]; then
    echo "UNHEALTHY: containers $UNHEALTHY_CONTAINERS" > $HEALTH_FILE
fi

# Report status
cat $HEALTH_FILE
EOF

chmod +x /usr/local/bin/health-monitor.sh
echo "* * * * * /usr/local/bin/health-monitor.sh" | crontab -
```

### Documentation and Knowledge Base

#### Create Problem Database
```bash
# Create issue tracking log
cat > /var/log/issues-resolved.log  /usr/local/bin/log-issue-resolution.sh > /var/log/issues-resolved.log
echo "Issue resolution logged: $1"
EOF

chmod +x /usr/local/bin/log-issue-resolution.sh
```

### Conclusion

This troubleshooting guide provides systematic approaches to diagnose and resolve common issues in the Orange Pi 5 Plus server environment. The emphasis on preventive monitoring, early warning systems, and documented resolution procedures ensures rapid recovery and minimal downtime.

Regular application of these troubleshooting procedures, combined with proactive monitoring, creates a robust and maintainable server infrastructure capable of handling both predictable and unexpected issues.

