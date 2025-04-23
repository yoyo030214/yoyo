#!/usr/bin/env python3
# coding: utf-8

import os
import time
import datetime
import subprocess
import requests
import json

# 配置
API_ENDPOINTS = [
    '/api/test',
    '/api/policies',
    '/api/products',
    '/api/orders',
    '/api/users'
]
BASE_URL = 'http://localhost'
LOG_FILE = '/var/log/merchant-admin-monitor.log'

def check_service_status():
    """检查商家管理系统服务状态"""
    try:
        result = subprocess.run(['systemctl', 'is-active', 'merchant-admin'], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True)
        return result.stdout.strip() == 'active'
    except Exception as e:
        return False

def check_nginx_status():
    """检查Nginx服务状态"""
    try:
        result = subprocess.run(['systemctl', 'is-active', 'nginx'], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True)
        return result.stdout.strip() == 'active'
    except Exception as e:
        return False

def check_api_endpoints():
    """检查API端点是否可访问"""
    results = {}
    for endpoint in API_ENDPOINTS:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            results[endpoint] = {
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds(),
                'success': response.status_code == 200
            }
        except Exception as e:
            results[endpoint] = {
                'status_code': None,
                'response_time': None,
                'success': False,
                'error': str(e)
            }
    return results

def check_disk_space():
    """检查磁盘空间"""
    try:
        result = subprocess.run(['df', '-h', '/var/www/merchant-admin'], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True)
        lines = result.stdout.strip().split('\n')
        if len(lines) >= 2:
            # 解析df命令输出的第二行
            parts = lines[1].split()
            if len(parts) >= 5:
                return {
                    'total': parts[1],
                    'used': parts[2],
                    'available': parts[3],
                    'use_percent': parts[4]
                }
    except Exception as e:
        pass
    return {
        'total': 'N/A',
        'used': 'N/A',
        'available': 'N/A',
        'use_percent': 'N/A'
    }

def log_status(message):
    """记录状态到日志文件"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{timestamp}] {message}\n")

def run_monitor():
    """运行监控程序"""
    print("开始监控商家管理系统...")
    log_status("开始监控商家管理系统")
    
    # 检查服务状态
    service_status = check_service_status()
    nginx_status = check_nginx_status()
    
    if not service_status:
        message = "警告: merchant-admin服务未运行! 正在尝试重启..."
        print(message)
        log_status(message)
        subprocess.run(['systemctl', 'restart', 'merchant-admin'])
    else:
        print("商家管理系统服务运行正常")
        log_status("商家管理系统服务运行正常")
    
    if not nginx_status:
        message = "警告: Nginx服务未运行! 正在尝试重启..."
        print(message)
        log_status(message)
        subprocess.run(['systemctl', 'restart', 'nginx'])
    else:
        print("Nginx服务运行正常")
        log_status("Nginx服务运行正常")
    
    # 检查API
    api_results = check_api_endpoints()
    for endpoint, result in api_results.items():
        if result['success']:
            print(f"API {endpoint} 响应正常, 响应时间: {result['response_time']}秒")
            log_status(f"API {endpoint} 响应正常, 响应时间: {result['response_time']}秒")
        else:
            message = f"警告: API {endpoint} 响应异常! 状态码: {result['status_code']}"
            print(message)
            log_status(message)
    
    # 检查磁盘空间
    disk_status = check_disk_space()
    print(f"磁盘空间: 总量 {disk_status['total']}, 已用 {disk_status['used']}, 可用 {disk_status['available']}, 使用率 {disk_status['use_percent']}")
    log_status(f"磁盘空间: 总量 {disk_status['total']}, 已用 {disk_status['used']}, 可用 {disk_status['available']}, 使用率 {disk_status['use_percent']}")
    
    # 如果磁盘使用率超过85%，发出警告
    if disk_status['use_percent'] != 'N/A' and int(disk_status['use_percent'].replace('%', '')) > 85:
        message = f"警告: 磁盘空间使用率高! 当前使用率: {disk_status['use_percent']}"
        print(message)
        log_status(message)

if __name__ == "__main__":
    run_monitor() 