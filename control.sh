#!/bin/bash
# 商家管理系统控制脚本

ACTION=$1

# 显示用法
usage() {
    echo "用法: $0 {start|stop|restart|status}"
    echo "  start   - 启动服务"
    echo "  stop    - 停止服务"
    echo "  restart - 重启服务"
    echo "  status  - 显示服务状态"
    exit 1
}

# 启动服务
start_services() {
    echo "启动商家管理系统服务..."
    systemctl start merchant-admin
    systemctl start nginx
    echo "服务启动完成。"
    echo "管理后台地址: http://$(hostname -I | awk '{print $1}')/admin/"
}

# 停止服务
stop_services() {
    echo "停止商家管理系统服务..."
    systemctl stop merchant-admin
    systemctl stop nginx
    echo "服务已停止。"
}

# 重启服务
restart_services() {
    echo "重启商家管理系统服务..."
    systemctl restart merchant-admin
    systemctl restart nginx
    echo "服务已重启。"
    echo "管理后台地址: http://$(hostname -I | awk '{print $1}')/admin/"
}

# 显示服务状态
show_status() {
    echo "========== 商家管理系统状态 =========="
    echo "Merchant-Admin服务: $(systemctl is-active merchant-admin)"
    echo "Nginx服务: $(systemctl is-active nginx)"
    
    # 检查API
    echo -n "API测试: "
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/test)
    if [ "$STATUS_CODE" == "200" ]; then
        echo "正常"
    else
        echo "异常 (HTTP状态码: $STATUS_CODE)"
    fi
    
    # 显示磁盘使用情况
    echo "磁盘使用情况:"
    df -h /var/www/merchant-admin
    
    echo "管理后台地址: http://$(hostname -I | awk '{print $1}')/admin/"
}

# 主逻辑
case "$ACTION" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    *)
        usage
        ;;
esac

exit 0 