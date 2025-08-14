# Portfolio Deployment

## Apache Web Server and PHP 8.3 Application Deployment

This chapter covers the complete deployment of a portfolio web application using Apache HTTP Server with PHP 8.3, including SSL configuration, performance optimization, and security hardening on the Orange Pi 5 Plus.

### Apache HTTP Server Installation

#### Install Apache and PHP 8.3
```bash
# Update package repository
sudo apt update

# Install Apache HTTP Server
sudo apt install -y apache2

# Install PHP 8.3 and required modules
sudo apt install -y php8.3 php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-gd php8.3-zip php8.3-intl php8.3-bcmath

# Install additional Apache modules
sudo apt install -y libapache2-mod-php8.3

# Enable required Apache modules
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires
sudo a2enmod php8.3

# Start and enable Apache
sudo systemctl start apache2
sudo systemctl enable apache2
```

#### Apache Configuration Optimization
```bash
# Backup original Apache configuration
sudo cp /etc/apache2/apache2.conf /etc/apache2/apache2.conf.backup

# Configure Apache for ARM64 optimization
sudo vim /etc/apache2/apache2.conf
```

Add these optimizations:
```
# Performance optimizations for ARM64
ServerTokens Prod
ServerSignature Off

# MPM Prefork configuration for PHP

    StartServers 2
    MinSpareServers 2
    MaxSpareServers 5
    MaxRequestWorkers 150
    MaxConnectionsPerChild 1000


# Security settings
ServerRoot /etc/apache2
PidFile ${APACHE_PID_FILE}
Timeout 300
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5

# Directory permissions

    Options -Indexes
    AllowOverride None
    Require all denied



    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted


# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

### PHP 8.3 Configuration

#### PHP Performance Optimization
```bash
# Backup PHP configuration
sudo cp /etc/php/8.3/apache2/php.ini /etc/php/8.3/apache2/php.ini.backup

# Edit PHP configuration
sudo vim /etc/php/8.3/apache2/php.ini
```

Key PHP optimizations:
```
; Memory and execution limits
memory_limit = 512M
max_execution_time = 300
max_input_time = 300
post_max_size = 64M
upload_max_filesize = 64M

; Error handling
display_errors = Off
log_errors = On
error_log = /var/log/php/error.log

; Session configuration
session.cookie_secure = 1
session.cookie_httponly = 1
session.use_strict_mode = 1

; OPcache configuration
opcache.enable = 1
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 4000
opcache.revalidate_freq = 2
opcache.fast_shutdown = 1

; Security settings
expose_php = Off
allow_url_fopen = Off
allow_url_include = Off
```

```bash
# Create PHP error log directory
sudo mkdir -p /var/log/php
sudo chown www-data:www-data /var/log/php

# Restart Apache to apply changes
sudo systemctl restart apache2
```

### SSL Certificate Configuration

#### Configure SSL Virtual Host
```bash
# Create SSL virtual host configuration
sudo vim /etc/apache2/sites-available/portfolio-ssl.conf
```

```

    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/portfolio

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    
    # SSL Security
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    SSLSessionTickets off

    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Directory Configuration
    
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # PHP Configuration
        
            SetHandler application/x-httpd-php
        
    

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/portfolio_error.log
    CustomLog ${APACHE_LOG_DIR}/portfolio_access.log combined

    # Performance optimizations
    
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    

    
        ExpiresActive on
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/ico "access plus 1 year"
        ExpiresByType image/icon "access plus 1 year"
        ExpiresByType text/plain "access plus 1 month"
        ExpiresByType application/x-shockwave-flash "access plus 1 month"
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/pdf "access plus 1 month"
        ExpiresByType text/javascript "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType text/html "access plus 600 seconds"
    

```

#### HTTP to HTTPS Redirect
```bash
# Create HTTP virtual host for redirect
sudo vim /etc/apache2/sites-available/portfolio-redirect.conf
```

```

    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    # Redirect all HTTP traffic to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/portfolio_redirect_error.log
    CustomLog ${APACHE_LOG_DIR}/portfolio_redirect_access.log combined

```

### Portfolio Application Deployment

#### Create Application Directory Structure
```bash
# Create portfolio directory
sudo mkdir -p /var/www/portfolio

# Set proper ownership
sudo chown -R www-data:www-data /var/www/portfolio
sudo chmod -R 755 /var/www/portfolio

# Create application structure
sudo -u www-data mkdir -p /var/www/portfolio/{assets,includes,uploads,logs}
sudo -u www-data mkdir -p /var/www/portfolio/assets/{css,js,images,fonts}
```

#### Sample Portfolio Application
```bash
# Create main index.php
sudo -u www-data vim /var/www/portfolio/index.php
```

```php




    
    
    
    
    
    
    
    
    
    
    ">
    
    
    


    
        
            
                
            
            
                ">Home
                ">About
                ">Portfolio
                ">Contact
            
        
    

    
        
    

    
        &copy;  . All rights reserved.
        Powered by Orange Pi 5 Plus | Ubuntu Server 24.04 | Apache  | PHP 
    

    
    ">


```

#### Configuration Files
```bash
# Create configuration file
sudo -u www-data vim /var/www/portfolio/includes/config.php
```

```php

```

#### Security Functions
```bash
# Create security functions
sudo -u www-data vim /var/www/portfolio/includes/functions.php
```

```php
 0, 'start_time' => $current_time];
    }
    
    $rate_data = $_SESSION[$key];
    
    if ($current_time - $rate_data['start_time'] > $time_window) {
        $_SESSION[$key] = ['count' => 1, 'start_time' => $current_time];
        return true;
    }
    
    if ($rate_data['count'] >= $max_attempts) {
        return false;
    }
    
    $_SESSION[$key]['count']++;
    return true;
}

function validate_file_upload($file) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }
    
    if ($file['size'] > MAX_UPLOAD_SIZE) {
        return false;
    }
    
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        return false;
    }
    
    return true;
}
?>
```

### Database Integration

#### Create Portfolio Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE portfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portfolio_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON portfolio_db.* TO 'portfolio_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Database Schema
```bash
# Create database schema
sudo -u www-data vim /var/www/portfolio/database/schema.sql
```

```sql
-- Portfolio database schema
USE portfolio_db;

-- Projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    technologies JSON,
    image_url VARCHAR(255),
    project_url VARCHAR(255),
    github_url VARCHAR(255),
    status ENUM('completed', 'in_progress', 'planned') DEFAULT 'completed',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency INT CHECK (proficiency >= 1 AND proficiency  /dev/null; then
    echo "$(date): Portfolio website is unreachable" >> $LOG_FILE
    echo "Portfolio Alert: Website unreachable" | mail -s "Portfolio Down" admin@your-domain.com
fi

# Check Apache error logs for recent errors
ERROR_COUNT=$(tail -100 /var/log/apache2/portfolio_error.log | grep "$(date '+%Y-%m-%d')" | wc -l)
if [ $ERROR_COUNT -gt $ERROR_THRESHOLD ]; then
    echo "$(date): High error count detected: $ERROR_COUNT" >> $LOG_FILE
fi

# Check PHP error logs
PHP_ERRORS=$(tail -100 /var/log/php/error.log | grep "$(date '+%Y-%m-%d')" | wc -l)
if [ $PHP_ERRORS -gt $ERROR_THRESHOLD ]; then
    echo "$(date): High PHP error count: $PHP_ERRORS" >> $LOG_FILE
fi

# Check disk space for uploads
UPLOAD_USAGE=$(du -sh /var/www/portfolio/uploads | cut -f1)
echo "$(date): Upload directory usage: $UPLOAD_USAGE" >> $LOG_FILE
```

```bash
# Make script executable and schedule
sudo chmod +x /usr/local/bin/portfolio-monitor.sh
echo "*/10 * * * * /usr/local/bin/portfolio-monitor.sh" | sudo crontab -
```

### Performance Optimization

#### Enable Apache Modules for Performance
```bash
# Enable performance modules
sudo a2enmod cache
sudo a2enmod cache_disk
sudo a2enmod expires
sudo a2enmod headers

# Configure caching
sudo vim /etc/apache2/conf-available/cache.conf
```

```apache

    CacheEnable disk /
    CacheRoot /var/cache/apache2/mod_cache_disk
    CacheDirLevels 2
    CacheDirLength 1
    CacheDefaultExpire 3600
    CacheMaxExpire 86400
    CacheLastModifiedFactor 0.1
    CacheIgnoreHeaders Set-Cookie

```

```bash
# Enable cache configuration
sudo a2enconf cache

# Create cache directory
sudo mkdir -p /var/cache/apache2/mod_cache_disk
sudo chown www-data:www-data /var/cache/apache2/mod_cache_disk
```

### Security Hardening

#### Configure mod_security (Optional)
```bash
# Install ModSecurity
sudo apt install -y libapache2-mod-security2

# Enable ModSecurity
sudo a2enmod security2

# Configure ModSecurity
sudo cp /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf

# Edit configuration
sudo vim /etc/modsecurity/modsecurity.conf
```

Change `SecRuleEngine DetectionOnly` to `SecRuleEngine On`

#### Backup and Recovery

```bash
# Create backup script for portfolio
sudo vim /usr/local/bin/backup-portfolio.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/backup/portfolio/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup web files
tar -czf "$BACKUP_DIR/web-files.tar.gz" -C /var/www portfolio

# Backup database
mysqldump -u portfolio_user -p'your_secure_password' portfolio_db > "$BACKUP_DIR/portfolio_db.sql"

# Backup Apache configuration
tar -czf "$BACKUP_DIR/apache-config.tar.gz" -C /etc/apache2 sites-available sites-enabled

echo "Portfolio backup completed: $BACKUP_DIR"
```

```bash
# Make executable and schedule weekly backups
sudo chmod +x /usr/local/bin/backup-portfolio.sh
echo "0 3 * * 0 /usr/local/bin/backup-portfolio.sh" | sudo crontab -
```

### Conclusion

This comprehensive portfolio deployment provides a secure, optimized, and maintainable web application environment on the Orange Pi 5 Plus. The configuration includes modern PHP 8.3 features, SSL/TLS security, performance optimizations, and robust monitoring capabilities.

The deployment demonstrates the capabilities of ARM64 architecture for web hosting while maintaining professional standards for security and performance.
