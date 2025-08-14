
# Ubuntu Server Installation

## Ubuntu Server 24.04 LTS ARM64 Setup

This chapter covers the complete installation and initial configuration of Ubuntu Server 24.04 LTS on the Orange Pi 5 Plus, including system optimization specific to ARM64 architecture.

### Pre-installation Requirements

#### Hardware Preparation
- Orange Pi 5 Plus board with adequate cooling
- High-speed microSD card (64GB minimum, Class 10 or better)
- Ethernet cable for network connectivity
- USB-C power supply (65W recommended)
- Monitor and keyboard for initial setup (optional with headless installation)

#### Software Requirements
- Ubuntu Server 24.04 LTS ARM64 image
- Balena Etcher or similar imaging software
- SSH client for remote management

### Image Download and Preparation

#### Official Ubuntu Image
```
# Download official Ubuntu Server 24.04 LTS ARM64
wget https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-arm64.iso

# Verify image integrity
sha256sum ubuntu-24.04-server-arm64.iso
```

#### Image Flashing
1. Insert microSD card into computer
2. Open Balena Etcher
3. Select downloaded Ubuntu image
4. Select target microSD card
5. Flash image and verify

### Initial Installation Process

#### First Boot Configuration
1. Insert flashed microSD into Orange Pi 5 Plus
2. Connect Ethernet cable
3. Connect power supply
4. System boots to Ubuntu installer

#### Installation Steps
1. **Language Selection**: Choose preferred language
2. **Keyboard Layout**: Select appropriate layout
3. **Network Configuration**: 
   - Configure primary Ethernet interface
   - Set static IP or use DHCP
4. **Storage Configuration**:
   - Use entire microSD card
   - Optional: Configure LVM for flexibility
5. **User Account Creation**:
   - Create administrative user
   - Set strong password
6. **SSH Server**: Enable OpenSSH server installation
7. **Package Selection**: Minimal server installation
8. **Installation**: Wait for process completion
9. **Reboot**: Remove installation media and restart

### Post-Installation System Configuration

#### First Login and Updates
```
# SSH into the server
ssh username@server-ip

# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget vim htop tree git
```

#### System Information Verification
```
# Verify ARM64 architecture
uname -m
# Output: aarch64

# Check Ubuntu version
lsb_release -a
# Should show Ubuntu 24.04 LTS

# Verify hardware recognition
lscpu | grep -E "(Architecture|CPU|cores)"
# Should show ARM architecture and 8 cores

# Check memory
free -h
# Should show installed RAM amount

# Verify storage
lsblk
# Shows storage devices and partitions
```

#### Network Configuration Optimization

##### Static IP Configuration
```
# Edit netplan configuration
sudo vim /etc/netplan/50-cloud-init.yaml
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
        addresses: [8.8.8.8, 8.8.4.4]
    eth1:
      dhcp4: false
      addresses:
        - 192.168.1.101/24
```

```
# Apply network configuration
sudo netplan apply

# Verify network interfaces
ip addr show
```

##### Network Performance Tuning
```
# Optimize network buffers
echo 'net.core.rmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_rmem = 4096 12582912 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_wmem = 4096 12582912 16777216' | sudo tee -a /etc/sysctl.conf

# Apply settings
sudo sysctl -p
```

### ARM64-Specific Optimizations

#### CPU Governor Configuration
```
# Install cpufrequtils
sudo apt install -y cpufrequtils

# Check available governors
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors

# Set performance governor for server workloads
echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils

# Apply immediately
sudo cpufreq-set -g performance
```

#### Memory Management Tuning
```
# Optimize memory settings for server use
echo 'vm.swappiness = 10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure = 50' | sudo tee -a /etc/sysctl.conf
echo 'vm.dirty_background_ratio = 5' | sudo tee -a /etc/sysctl.conf
echo 'vm.dirty_ratio = 10' | sudo tee -a /etc/sysctl.conf

# Apply settings
sudo sysctl -p
```

#### Storage Optimization
```
# Install and configure zram for better memory utilization
sudo apt install -y zram-config

# Configure I/O scheduler for better performance
echo 'ACTION=="add|change", KERNEL=="sd[a-z]*", ATTR{queue/scheduler}="deadline"' | sudo tee /etc/udev/rules.d/60-ioschedulers.rules
echo 'ACTION=="add|change", KERNEL=="mmcblk[0-9]*", ATTR{queue/scheduler}="deadline"' | sudo tee -a /etc/udev/rules.d/60-ioschedulers.rules
```

### System Security Hardening

#### SSH Configuration
```
# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo vim /etc/ssh/sshd_config
```

Key security modifications:
```
Port 2222                    # Change default port
PermitRootLogin no          # Disable root login
PasswordAuthentication no   # Use keys only
PubkeyAuthentication yes    # Enable key authentication
MaxAuthTries 3             # Limit authentication attempts
ClientAliveInterval 300    # Session timeout
ClientAliveCountMax 2      # Connection keepalive
```

#### Firewall Configuration
```
# Install and enable UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH on custom port
sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

#### Fail2Ban Installation
```
# Install Fail2Ban
sudo apt install -y fail2ban

# Create custom configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo vim /etc/fail2ban/jail.local
```

Key Fail2Ban settings:
```
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222
logpath = %(sshd_log)s
backend = %(sshd_backend)s
```

### System Monitoring Setup

#### Basic Monitoring Tools
```
# Install monitoring utilities
sudo apt install -y htop iotop nethogs iftop ncdu

# Install system information tools
sudo apt install -y neofetch lshw-gtk

# Install log analysis tools
sudo apt install -y logwatch
```

#### Automated Updates Configuration
```
# Install unattended upgrades
sudo apt install -y unattended-upgrades

# Configure automatic security updates
echo 'APT::Periodic::Update-Package-Lists "1";' | sudo tee /etc/apt/apt.conf.d/20auto-upgrades
echo 'APT::Periodic::Unattended-Upgrade "1";' | sudo tee -a /etc/apt/apt.conf.d/20auto-upgrades
echo 'APT::Periodic::AutocleanInterval "7";' | sudo tee -a /etc/apt/apt.conf.d/20auto-upgrades
```

### Performance Validation

#### CPU Performance Test
```
# Install stress testing tools
sudo apt install -y stress-ng

# CPU stress test
stress-ng --cpu 8 --timeout 60s --metrics-brief

# Monitor during test
htop
```

#### Memory Performance Test
```
# Memory bandwidth test
stress-ng --vm 4 --vm-bytes 75% --timeout 60s --metrics-brief
```

#### Storage Performance Test
```
# Install hdparm for storage testing
sudo apt install -y hdparm

# Test storage read performance
sudo hdparm -t /dev/mmcblk1

# Test with dd command
dd if=/dev/zero of=/tmp/testfile bs=1M count=1024 conv=fdatasync
```

#### Network Performance Test
```
# Install network testing tools
sudo apt install -y iperf3

# Test network throughput (requires iperf3 server)
iperf3 -c server-ip -t 60
```

### Backup and Recovery Setup

#### System Backup Configuration
```
# Create backup directory
sudo mkdir -p /backup

# Create system configuration backup script
sudo vim /usr/local/bin/system-backup.sh
```

```
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup critical configurations
cp -r /etc $BACKUP_DIR/
cp -r /home $BACKUP_DIR/
dpkg --get-selections > $BACKUP_DIR/packages.txt

# Create archive
tar -czf $BACKUP_DIR/system-backup-$(date +%Y%m%d).tar.gz $BACKUP_DIR/etc $BACKUP_DIR/home
```

```
# Make script executable
sudo chmod +x /usr/local/bin/system-backup.sh

# Add to crontab for weekly backups
echo "0 2 * * 0 /usr/local/bin/system-backup.sh" | sudo crontab -
```

### Troubleshooting Common Issues

#### Boot Issues
- Verify power supply adequacy
- Check microSD card integrity
- Ensure proper image flashing
- Review boot logs: `sudo journalctl -b`

#### Network Connectivity
- Verify cable connections
- Check interface status: `ip link show`
- Review network configuration: `cat /etc/netplan/*.yaml`
- Test connectivity: `ping -c 4 8.8.8.8`

#### Performance Issues
- Monitor system resources: `htop`, `iotop`
- Check temperature: `cat /sys/class/thermal/thermal_zone*/temp`
- Review system logs: `sudo journalctl -xe`
- Verify CPU governor: `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor`

### Conclusion

Ubuntu Server 24.04 LTS provides an excellent foundation for ARM64 server deployments on the Orange Pi 5 Plus. The optimizations and security configurations implemented in this chapter create a robust, secure, and performant base system ready for containerized service deployment.

The system is now prepared for Docker installation and service containerization, which will be covered in subsequent chapters.

### Next Steps

- Proceed to Chapter 4: Network and Security for advanced security configurations
- Continue to Chapter 5: Docker Services for container deployment
- Review Chapter 7: Monitoring for comprehensive system monitoring setup
