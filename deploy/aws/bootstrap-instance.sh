#!/bin/sh
set -eu

export DEBIAN_FRONTEND=noninteractive

if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update
apt-get install -y docker.io docker-compose-v2 rsync
systemctl enable --now docker
usermod -aG docker ubuntu
mkdir -p /opt/bevory
chown ubuntu:ubuntu /opt/bevory
