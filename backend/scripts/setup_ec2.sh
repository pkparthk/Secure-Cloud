#!/bin/bash
# EC2 instance setup script

# Update package repositories
sudo apt-get update -y || sudo yum update -y

# Install required packages
sudo apt-get install -y docker.io docker-compose python3 python3-pip || \
sudo yum install -y docker docker-compose python3 python3-pip

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Install MongoDB
sudo docker pull mongo
sudo docker run -d --name mongodb -p 27017:27017 mongo

# Create directories for application
sudo mkdir -p /opt/secure-cloud-access
sudo chmod 755 /opt/secure-cloud-access

# Create a user for the application
sudo useradd -m -d /home/scauser -s /bin/bash scauser
sudo usermod -aG docker scauser

echo "EC2 instance setup completed successfully"