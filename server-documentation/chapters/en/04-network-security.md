# Network and Security

## Advanced Network Configuration and Security Hardening

This chapter covers comprehensive network configuration, SSL/TLS implementation, advanced firewall rules, and intrusion detection systems for the Orange Pi 5 Plus server.

### Network Interface Optimization

#### Dual Ethernet Configuration
```
# Configure both Ethernet interfaces for redundancy
sudo vim /etc/netplan/01-netcfg.yaml
```

```
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
      routes:
        - to: 0.0.0.0/0
          via: 192.168.1.1
          metric: 100
    eth1:
      dhcp4: false
      addresses:
        - 192.168.1.101/24
      routes:
        - to: 0.0.0.0/0
          via: 192.168.1.1
          metric: 200
```

```
# Apply configuration
sudo netplan apply

# Verify interface status
ip route show
```

#### Network Bonding for High Availability
```
# Install ifenslave for bonding support
sudo apt install -y ifenslave

# Configure network bonding
sudo vim /etc/netplan/02-bond.yaml
```

```
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
    eth1:
      dhcp4: false
  bonds:
    bond0:
      dhcp4: false
      interfaces: [eth0, eth1]
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
      parameters:
        mode: active-backup
        primary: eth0
        mii-monitor-interval: 100
```

### Advanced Firewall Configuration

#### UFW Rule Sets
```
# Reset UFW to defaults
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH access (custom port)
sudo ufw allow 2222/tcp comment 'SSH access'

# Web services
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Custom application ports
sudo ufw allow 8080/tcp comment 'Portainer'
sudo ufw allow 8000/tcp comment 'Seafile'

# Allow specific IP ranges for management
sudo ufw allow from 192.168.1.0/24 to any port 22 comment 'Local SSH'

# Rate limiting for SSH
sudo ufw limit 2222/tcp comment 'SSH rate limiting'

# Enable logging
sudo ufw logging on

# Enable firewall
sudo ufw enable

# Show detailed status
sudo ufw status numbered verbose
```

#### Custom UFW Application Profiles
```
# Create custom application profiles
sudo vim /etc/ufw/applications.d/custom
```

```
[Seafile]
title=Seafile Cloud Storage
description=Open source cloud storage system
ports=8000/tcp

[Portainer]
title=Portainer Docker Management
description=Docker container management interface
ports=8080/tcp|9000/tcp

[Netdata]
title=Netdata System Monitoring
description=Real-time system monitoring
ports=19999/tcp
```

```
# Reload UFW applications
sudo ufw app update all

# Allow applications
sudo ufw allow Seafile
sudo ufw allow Portainer
sudo ufw allow Netdata
```

### SSL/TLS Certificate Management

#### Install Certbot for Let's Encrypt
```
# Install Certbot and Apache plugin
sudo apt install -y certbot python3-certbot-apache

# Install snap version (alternative)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

#### Domain Preparation
```
# Update system hostname
sudo hostnamectl set-hostname your-domain.com

# Verify hostname
hostnamectl

# Update /etc/hosts
echo "192.168.1.100 your-domain.com" | sudo tee -a /etc/hosts
```

#### SSL Certificate Generation
```
# Generate SSL certificate (standalone mode)
sudo certbot certonly --standalone \
  --preferred-challenges http \
  -d your-domain.com \
  -d www.your-domain.com

# Generate certificate with Apache integration
sudo certbot --apache \
  -d your-domain.com \
  -d www.your-domain.com
```

#### Automatic Certificate Renewal
```
# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal cron job
echo "0 2 * * 0 /usr/bin/certbot renew --quiet" | sudo crontab -

# Create renewal hook script
sudo vim /etc/letsencrypt/renewal-hooks/post/restart-services.sh
```

```
#!/bin/bash
systemctl reload apache2
systemctl restart docker
```

```
# Make script executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/restart-services.sh
```

### SSH Security Hardening

#### SSH Key Generation and Management
```
# Generate SSH key pair (on client)
ssh-keygen -t ed25519 -b 4096 -C "your-email@domain.com"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server-ip

# Verify key-based authentication
ssh -i ~/.ssh/id_ed25519 user@server-ip
```

#### Advanced SSH Configuration
```
# Edit SSH daemon configuration
sudo vim /etc/ssh/sshd_config
```

```
# Network and protocol settings
Port 2222
Protocol 2
AddressFamily inet
ListenAddress 0.0.0.0

# Authentication settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Session settings
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 4
MaxStartups 10:30:60

# Security settings
AllowUsers your-username
DenyUsers root
AllowGroups ssh-users
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitTunnel no

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Disable unused authentication methods
KerberosAuthentication no
GSSAPIAuthentication no
```

```
# Create SSH users group
sudo groupadd ssh-users
sudo usermod -a -G ssh-users your-username

# Restart SSH service
sudo systemctl restart ssh
sudo systemctl status ssh
```

### Fail2Ban Advanced Configuration

#### Enhanced Fail2Ban Setup
```
# Create custom Fail2Ban configuration
sudo vim /etc/fail2ban/jail.local
```

```
[DEFAULT]
# Ban settings
bantime = 3600
findtime = 600
maxretry = 5

# Email notifications
destemail = admin@your-domain.com
sendername = Fail2Ban-Server
mta = sendmail

# Action settings
action = %(action_mwl)s

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[apache-auth]
enabled = true
port = http,https
filter = apache-auth
logpath = /var/log/apache2/*error.log
maxretry = 3

[apache-badbots]
enabled = true
port = http,https
filter = apache-badbots
logpath = /var/log/apache2/*access.log
maxretry = 2

[apache-noscript]
enabled = true
port = http,https
filter = apache-noscript
logpath = /var/log/apache2/*access.log
maxretry = 3

[apache-overflows]
enabled = true
port = http,https
filter = apache-overflows
logpath = /var/log/apache2/*error.log
maxretry = 2
```

#### Custom Fail2Ban Filters
```
# Create custom filter for repeated GET requests
sudo vim /etc/fail2ban/filter.d/apache-get-dos.conf
```

```
[Definition]
failregex = ^ -.*"(GET|POST).*HTTP.*" 200 .*$
ignoreregex =
```

```
# Add custom filter to jail.local
[apache-get-dos]
enabled = true
port = http,https
filter = apache-get-dos
logpath = /var/log/apache2/*access.log
maxretry = 300
findtime = 300
bantime = 600
```

#### Fail2Ban Monitoring
```
# Check Fail2Ban status
sudo fail2ban-client status

# Check specific jail status
sudo fail2ban-client status sshd

# Unban an IP address
sudo fail2ban-client set sshd unbanip 192.168.1.10

# Monitor Fail2Ban logs
sudo tail -f /var/log/fail2ban.log
```

### Network Monitoring and Analysis

#### Install Network Monitoring Tools
```
# Install network analysis tools
sudo apt install -y nmap tcpdump wireshark-common tshark

# Install bandwidth monitoring
sudo apt install -y vnstat iftop nethogs

# Install network scanner
sudo apt install -y nmap zenmap

# Install intrusion detection
sudo apt install -y rkhunter chkrootkit
```

#### Network Traffic Analysis
```
# Monitor network interfaces
sudo iftop -i eth0

# Monitor per-process network usage
sudo nethogs eth0

# Capture network packets
sudo tcpdump -i eth0 -w capture.pcap

# Analyze captured packets
tshark -r capture.pcap
```

#### Bandwidth Monitoring Setup
```
# Initialize vnstat for interfaces
sudo vnstat -u -i eth0
sudo vnstat -u -i eth1

# Enable vnstat service
sudo systemctl enable vnstat
sudo systemctl start vnstat

# View bandwidth statistics
vnstat -i eth0 -d
vnstat -i eth0 -m
```

### Intrusion Detection System

#### AIDE Installation and Configuration
```
# Install AIDE (Advanced Intrusion Detection Environment)
sudo apt install -y aide

# Initialize AIDE database
sudo aide --init

# Move database to production location
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Create daily check script
sudo vim /usr/local/bin/aide-check.sh
```

```
#!/bin/bash
AIDE_CHECK="/usr/bin/aide --check"
AIDE_UPDATE="/usr/bin/aide --update"

# Run AIDE check
$AIDE_CHECK

# If changes detected, send email and update database
if [ $? -eq 1 ]; then
    echo "AIDE detected changes on $(hostname)" | mail -s "AIDE Alert" admin@your-domain.com
    $AIDE_UPDATE
    mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
fi
```

```
# Make script executable
sudo chmod +x /usr/local/bin/aide-check.sh

# Add to crontab for daily execution
echo "0 3 * * * /usr/local/bin/aide-check.sh" | sudo crontab -
```

#### Rootkit Detection
```
# Configure rkhunter
sudo vim /etc/rkhunter.conf
```

```
# Update configuration
MIRRORS_MODE=0
UPDATE_MIRRORS=1
SCRIPTWHITELIST=/usr/bin/egrep
SCRIPTWHITELIST=/usr/bin/fgrep
SCRIPTWHITELIST=/usr/bin/which
ALLOWHIDDENDIR=/etc/.java
ALLOWHIDDENFILE=/etc/.pwd.lock
ALLOWHIDDENFILE=/etc/.init.state
```

```
# Update rkhunter database
sudo rkhunter --update

# Run initial scan
sudo rkhunter --checkall --skip-keypress

# Schedule daily scans
echo "0 4 * * * /usr/bin/rkhunter --checkall --skip-keypress --report-warnings-only" | sudo crontab -
```

### Network Security Best Practices

#### Disable Unused Services
```
# List running services
sudo systemctl list-unit-files --type=service --state=enabled

# Disable unused services
sudo systemctl disable bluetooth
sudo systemctl disable cups
sudo systemctl disable avahi-daemon

# Remove unnecessary packages
sudo apt remove --purge bluetooth bluez cups-* avahi-*
sudo apt autoremove
```

#### Kernel Security Parameters
```
# Configure kernel security parameters
sudo vim /etc/sysctl.d/99-security.conf
```

```
# IP forwarding and redirects
net.ipv4.ip_forward = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# ICMP redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Martian packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Ignore ping requests
net.ipv4.icmp_echo_ignore_all = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable IPv6 if not used
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
```

```
# Apply kernel parameters
sudo sysctl -p /etc/sysctl.d/99-security.conf
```

### VPN Setup (Optional)

#### WireGuard VPN Server
```
# Install WireGuard
sudo apt install -y wireguard

# Generate server keys
cd /etc/wireguard
sudo wg genkey | sudo tee server_private.key
sudo cat server_private.key | wg pubkey | sudo tee server_public.key

# Create server configuration
sudo vim /etc/wireguard/wg0.conf
```

```
[Interface]
PrivateKey = 
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

# Enable IP forwarding
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = 
AllowedIPs = 10.0.0.2/32
```

```
# Enable and start WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Allow WireGuard through firewall
sudo ufw allow 51820/udp
```

### Security Monitoring and Alerting

#### Log Monitoring with Logwatch
```
# Configure Logwatch
sudo vim /etc/logwatch/conf/logwatch.conf
```

```
# Email settings
MailTo = admin@your-domain.com
MailFrom = logwatch@your-domain.com

# Report settings
Detail = High
Service = All
Range = yesterday
Format = html
```

#### System Integrity Monitoring
```
# Create system integrity check script
sudo vim /usr/local/bin/security-check.sh
```

```
#!/bin/bash
LOG_FILE="/var/log/security-check.log"
EMAIL="admin@your-domain.com"

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "$(date): High number of failed logins detected: $FAILED_LOGINS" >> $LOG_FILE
    echo "Security Alert: High number of failed logins on $(hostname)" | mail -s "Security Alert" $EMAIL
fi

# Check for root access attempts
ROOT_ATTEMPTS=$(grep "su: FAILED" /var/log/auth.log | wc -l)
if [ $ROOT_ATTEMPTS -gt 0 ]; then
    echo "$(date): Root access attempts detected: $ROOT_ATTEMPTS" >> $LOG_FILE
    echo "Security Alert: Root access attempts on $(hostname)" | mail -s "Security Alert" $EMAIL
fi

# Check system load
LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | sed 's/^ *//')
if (( $(echo "$LOAD > 4.0" | bc -l) )); then
    echo "$(date): High system load detected: $LOAD" >> $LOG_FILE
fi
```

```
# Make script executable and schedule
sudo chmod +x /usr/local/bin/security-check.sh
echo "*/15 * * * * /usr/local/bin/security-check.sh" | sudo crontab -
```

### Conclusion

This comprehensive network and security configuration provides multiple layers of protection for the Orange Pi 5 Plus server. The implementation includes advanced firewall rules, SSL/TLS encryption, intrusion detection, and continuous monitoring to ensure robust security posture.

The security measures implemented create a hardened server environment suitable for production use, with automated monitoring and alerting to detect potential security threats.

### Next Steps

- Proceed to Chapter 5: Docker Services for containerized application deployment
- Review Chapter 7: Monitoring for enhanced system monitoring
- Consider Chapter 8: Troubleshooting for security-related issue resolution
