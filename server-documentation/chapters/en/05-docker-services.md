# Docker Services

## Docker and Container Deployment

This chapter covers the complete setup of Docker Engine, Docker Compose, and deployment of essential containerized services including Seafile, Portainer, MySQL, and supporting infrastructure on the Orange Pi 5 Plus.

### Docker Installation and Setup

#### Docker Engine Installation
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository for ARM64
echo "deb [arch=arm64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
sudo apt update

# Install Docker Engine
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Docker Post-Installation Setup
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker installation
docker --version
docker compose version

# Test Docker with hello-world
docker run hello-world
```

#### Docker Daemon Configuration
```bash
# Create Docker daemon configuration
sudo mkdir -p /etc/docker

# Configure Docker daemon for ARM64 optimization
sudo tee /etc/docker/daemon.json  ~/containers/mysql/docker-compose.yml  ~/containers/mysql/conf/custom.cnf  ~/containers/seafile/docker-compose.yml  conf/seafile.conf  conf/seahub_settings.py  ~/containers/portainer/docker-compose.yml  portainer_password.txt

# Deploy Portainer
docker compose up -d

# Verify Portainer deployment
docker compose logs -f portainer
```

### Redis Cache Service

#### Redis Docker Compose Configuration
```bash
# Create Redis service configuration
cat > ~/containers/redis/docker-compose.yml  ~/containers/redis/redis.conf  ~/containers/nginx/docker-compose.yml  ~/containers/nginx/conf/seafile.conf  ~/containers/docker-compose.yml  ~/containers/manage-services.sh  ~/containers/backup-containers.sh  ~/containers/health-check.sh > $LOG_FILE
    echo "Container Health Alert: Unhealthy containers on $(hostname)" | mail -s "Container Alert" admin@your-domain.com
fi

# Check container resource usage
HIGH_CPU_CONTAINERS=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}" | awk 'NR>1 && $2+0 > 80 {print $1}')
if [ -n "$HIGH_CPU_CONTAINERS" ]; then
    echo "$(date): High CPU usage containers: $HIGH_CPU_CONTAINERS" >> $LOG_FILE
fi

HIGH_MEMORY_CONTAINERS=$(docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | awk 'NR>1 && $2 ~ /G/ && $2+0 > 2 {print $1}')
if [ -n "$HIGH_MEMORY_CONTAINERS" ]; then
    echo "$(date): High memory usage containers: $HIGH_MEMORY_CONTAINERS" >> $LOG_FILE
fi
EOF

# Make script executable and schedule
chmod +x ~/containers/health-check.sh
echo "*/5 * * * * ~/containers/health-check.sh" | crontab -
```

### Container Network Security

#### Network Isolation Rules
```bash
# Create network security rules
sudo ufw allow from 172.17.0.0/12 to any port 3306 comment 'Docker MySQL'
sudo ufw allow from 172.17.0.0/12 to any port 6379 comment 'Docker Redis'

# Block external access to internal services
sudo ufw deny 3306
sudo ufw deny 6379
sudo ufw deny 8082
```

### Performance Optimization

#### Container Resource Limits
```bash
# Add resource limits to docker-compose.yml services
# Example for Seafile service:
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### Troubleshooting Common Issues

#### Container Startup Issues
```bash
# Check container logs
docker compose logs [service_name]

# Check container resource usage
docker stats

# Verify network connectivity
docker network ls
docker network inspect frontend
docker network inspect backend
```

#### Performance Issues
```bash
# Monitor container performance
docker exec -it [container_name] top
docker exec -it [container_name] df -h
docker exec -it [container_name] free -m
```

### Conclusion

This comprehensive Docker services deployment provides a robust, scalable, and secure containerized infrastructure on the Orange Pi 5 Plus. The configuration includes essential services like cloud storage, database management, container orchestration, and reverse proxy with SSL termination.

The containerized approach offers improved resource utilization, easy service management, and simplified maintenance procedures while maintaining security and performance standards suitable for production environments.
