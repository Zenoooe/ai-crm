# AI-Driven CRM Deployment Guide

## Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **Git**: Latest version
- **MongoDB**: 6.0+ (if running locally)
- **Redis**: 7.0+ (if running locally)

### Environment Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ai-crm
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

3. **Required API Keys**
   - OpenAI API Key (for AI features)
   - Google Vision API Key (for OCR)
   - Baidu API Key (optional, for Chinese market)
   - Tianyancha API Key (optional, for business data)

## Development Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services Available:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs
- MongoDB: localhost:27017
- Redis: localhost:6379
- Mongo Express: http://localhost:8081 (admin/admin123)
- Redis Commander: http://localhost:8082

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start MongoDB and Redis locally
# MongoDB: mongod --dbpath /path/to/data
# Redis: redis-server

# Run development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Production Deployment

### Option 1: Docker Swarm

1. **Initialize Swarm**
   ```bash
   docker swarm init
   ```

2. **Deploy Stack**
   ```bash
   docker stack deploy -c docker-compose.prod.yml ai-crm
   ```

3. **Scale Services**
   ```bash
   docker service scale ai-crm_backend=3
   docker service scale ai-crm_frontend=2
   ```

### Option 2: Kubernetes

1. **Create Namespace**
   ```bash
   kubectl create namespace ai-crm
   ```

2. **Apply Configurations**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Check Status**
   ```bash
   kubectl get pods -n ai-crm
   kubectl get services -n ai-crm
   ```

### Option 3: Cloud Deployment

#### AWS Deployment

1. **ECS with Fargate**
   ```bash
   # Build and push images
   docker build -t ai-crm-backend ./backend
   docker build -t ai-crm-frontend ./frontend
   
   # Tag and push to ECR
   docker tag ai-crm-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/ai-crm-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/ai-crm-backend:latest
   ```

2. **Infrastructure as Code**
   ```bash
   # Using Terraform
   cd infrastructure/aws
   terraform init
   terraform plan
   terraform apply
   ```

#### Azure Deployment

1. **Container Instances**
   ```bash
   # Create resource group
   az group create --name ai-crm-rg --location eastus
   
   # Deploy container group
   az container create --resource-group ai-crm-rg --file azure-container-group.yaml
   ```

#### Google Cloud Deployment

1. **Cloud Run**
   ```bash
   # Build and deploy backend
   gcloud builds submit --tag gcr.io/PROJECT-ID/ai-crm-backend ./backend
   gcloud run deploy --image gcr.io/PROJECT-ID/ai-crm-backend --platform managed
   
   # Build and deploy frontend
   gcloud builds submit --tag gcr.io/PROJECT-ID/ai-crm-frontend ./frontend
   gcloud run deploy --image gcr.io/PROJECT-ID/ai-crm-frontend --platform managed
   ```

## Database Setup

### MongoDB Configuration

1. **Local MongoDB**
   ```bash
   # Install MongoDB
   brew install mongodb/brew/mongodb-community
   
   # Start MongoDB
   brew services start mongodb/brew/mongodb-community
   
   # Create database and user
   mongo
   use ai-crm
   db.createUser({
     user: "crmuser",
     pwd: "password",
     roles: [{ role: "readWrite", db: "ai-crm" }]
   })
   ```

2. **MongoDB Atlas (Cloud)**
   ```bash
   # Connection string format:
   # mongodb+srv://username:password@cluster.mongodb.net/ai-crm?retryWrites=true&w=majority
   ```

3. **Database Migration**
   ```bash
   cd backend
   npm run migrate
   npm run seed  # Optional: seed with sample data
   ```

### Redis Configuration

1. **Local Redis**
   ```bash
   # Install Redis
   brew install redis
   
   # Start Redis
   brew services start redis
   
   # Test connection
   redis-cli ping
   ```

2. **Redis Cloud**
   ```bash
   # Use Redis Cloud, ElastiCache, or Azure Cache for Redis
   # Update REDIS_URL in .env
   ```

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Generate Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Custom SSL Certificate

1. **Place certificates**
   ```bash
   mkdir -p nginx/ssl
   cp your-cert.pem nginx/ssl/
   cp your-private-key.pem nginx/ssl/
   ```

2. **Update Nginx configuration**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/ssl/your-cert.pem;
       ssl_certificate_key /etc/nginx/ssl/your-private-key.pem;
   }
   ```

## Monitoring Setup

### Prometheus + Grafana

1. **Deploy monitoring stack**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access dashboards**
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090

### Application Monitoring

1. **Health Checks**
   ```bash
   # Backend health
   curl http://localhost:5000/health
   
   # Frontend health
   curl http://localhost:3000/health
   ```

2. **Log Monitoring**
   ```bash
   # View application logs
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

## Backup Strategy

### Database Backup

1. **MongoDB Backup**
   ```bash
   # Create backup
   mongodump --uri="mongodb://localhost:27017/ai-crm" --out=/backup/$(date +%Y%m%d)
   
   # Restore backup
   mongorestore --uri="mongodb://localhost:27017/ai-crm" /backup/20231201/ai-crm
   ```

2. **Automated Backup Script**
   ```bash
   #!/bin/bash
   # backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backup/$DATE"
   
   # MongoDB backup
   mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR"
   
   # Upload to S3
   aws s3 sync "$BACKUP_DIR" "s3://your-backup-bucket/$DATE"
   
   # Cleanup old backups (keep 30 days)
   find /backup -type d -mtime +30 -exec rm -rf {} +
   ```

3. **Cron Job Setup**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup.sh
   ```

### File Backup

1. **Upload Directory Backup**
   ```bash
   # Sync uploads to S3
   aws s3 sync ./uploads s3://your-backup-bucket/uploads
   ```

## Security Configuration

### Firewall Setup

1. **UFW (Ubuntu)**
   ```bash
   sudo ufw enable
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw deny 27017  # MongoDB (internal only)
   sudo ufw deny 6379   # Redis (internal only)
   ```

### Environment Security

1. **Secure Environment Variables**
   ```bash
   # Use Docker secrets in production
   echo "your-secret-key" | docker secret create jwt_secret -
   ```

2. **File Permissions**
   ```bash
   chmod 600 .env
   chmod 600 nginx/ssl/*
   ```

## Performance Optimization

### Database Optimization

1. **MongoDB Indexes**
   ```javascript
   // Run in MongoDB shell
   db.contacts.createIndex({ "userId": 1, "updatedAt": -1 })
   db.contacts.createIndex({ "userId": 1, "basicInfo.name": "text" })
   db.interactions.createIndex({ "contactId": 1, "createdAt": -1 })
   ```

2. **Redis Configuration**
   ```bash
   # redis.conf optimizations
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   save 900 1
   save 300 10
   save 60 10000
   ```

### Application Optimization

1. **Node.js Optimization**
   ```bash
   # Production environment variables
   NODE_ENV=production
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Nginx Optimization**
   ```nginx
   # nginx.conf optimizations
   worker_processes auto;
   worker_connections 1024;
   
   gzip on;
   gzip_comp_level 6;
   gzip_types text/plain text/css application/json application/javascript;
   ```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   ```bash
   # Check service status
   docker-compose ps
   
   # Check logs
   docker-compose logs backend
   
   # Test database connection
   docker-compose exec backend npm run test:db
   ```

2. **Memory Issues**
   ```bash
   # Monitor memory usage
   docker stats
   
   # Increase memory limits
   # In docker-compose.yml:
   deploy:
     resources:
       limits:
         memory: 1G
   ```

3. **Performance Issues**
   ```bash
   # Monitor application performance
   docker-compose exec backend npm run monitor
   
   # Check database performance
   db.runCommand({"profile": 2})
   db.system.profile.find().sort({"ts": -1}).limit(5)
   ```

### Debug Mode

1. **Enable Debug Logging**
   ```bash
   # Set in .env
   LOG_LEVEL=debug
   NODE_ENV=development
   ```

2. **Database Debug**
   ```bash
   # MongoDB debug
   db.setLogLevel(2)
   
   # Redis debug
   redis-cli monitor
   ```

## Scaling Guidelines

### Horizontal Scaling

1. **Load Balancer Setup**
   ```nginx
   upstream backend {
       server backend1:5000;
       server backend2:5000;
       server backend3:5000;
   }
   ```

2. **Database Scaling**
   ```bash
   # MongoDB Replica Set
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "mongo1:27017" },
       { _id: 1, host: "mongo2:27017" },
       { _id: 2, host: "mongo3:27017" }
     ]
   })
   ```

### Vertical Scaling

1. **Resource Allocation**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '2.0'
             memory: 4G
           reservations:
             cpus: '1.0'
             memory: 2G
   ```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   # Backend updates
   cd backend && npm audit && npm update
   
   # Frontend updates
   cd frontend && npm audit && npm update
   ```

2. **Database Maintenance**
   ```bash
   # MongoDB maintenance
   db.runCommand({"compact": "contacts"})
   db.runCommand({"reIndex": "contacts"})
   
   # Redis maintenance
   redis-cli BGREWRITEAOF
   ```

3. **Log Rotation**
   ```bash
   # Setup logrotate
   sudo nano /etc/logrotate.d/ai-crm
   
   /var/log/ai-crm/*.log {
       daily
       rotate 30
       compress
       delaycompress
       missingok
       notifempty
       create 644 www-data www-data
   }
   ```

### Health Monitoring

1. **Automated Health Checks**
   ```bash
   #!/bin/bash
   # health-check.sh
   
   # Check backend health
   if ! curl -f http://localhost:5000/health; then
       echo "Backend health check failed"
       # Send alert
   fi
   
   # Check database connection
   if ! mongo --eval "db.adminCommand('ping')"; then
       echo "Database health check failed"
       # Send alert
   fi
   ```

2. **Monitoring Alerts**
   ```yaml
   # prometheus/alerts.yml
   groups:
   - name: ai-crm
     rules:
     - alert: HighMemoryUsage
       expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.8
       for: 5m
       annotations:
         summary: "High memory usage detected"
   ```

This deployment guide provides comprehensive instructions for setting up, deploying, and maintaining the AI-driven CRM system in various environments from development to production.