#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTPS和IPv6功能测试脚本
"""

import requests
import socket
import ssl
import sys
import urllib3
from urllib3.exceptions import InsecureRequestWarning

# 禁用SSL警告（仅用于测试自签名证书）
urllib3.disable_warnings(InsecureRequestWarning)

def test_http_ipv4():
    """测试HTTP IPv4连接"""
    try:
        response = requests.get('http://127.0.0.1:5002', timeout=5)
        print(f"✅ HTTP IPv4: {response.status_code} - {response.reason}")
        return True
    except Exception as e:
        print(f"❌ HTTP IPv4: {e}")
        return False

def test_http_ipv6():
    """测试HTTP IPv6连接"""
    try:
        response = requests.get('http://[::1]:5002', timeout=5)
        print(f"✅ HTTP IPv6: {response.status_code} - {response.reason}")
        return True
    except Exception as e:
        print(f"❌ HTTP IPv6: {e}")
        return False

def test_https_ipv4():
    """测试HTTPS IPv4连接"""
    try:
        response = requests.get('https://127.0.0.1:5002', verify=False, timeout=5)
        print(f"✅ HTTPS IPv4: {response.status_code} - {response.reason}")
        return True
    except Exception as e:
        print(f"❌ HTTPS IPv4: {e}")
        return False

def test_https_ipv6():
    """测试HTTPS IPv6连接"""
    try:
        response = requests.get('https://[::1]:5002', verify=False, timeout=5)
        print(f"✅ HTTPS IPv6: {response.status_code} - {response.reason}")
        return True
    except Exception as e:
        print(f"❌ HTTPS IPv6: {e}")
        return False

def test_ssl_certificate():
    """测试SSL证书"""
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        with socket.create_connection(('127.0.0.1', 5002), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname='localhost') as ssock:
                cert = ssock.getpeercert()
                print(f"✅ SSL证书: {cert.get('subject', 'Unknown')}")
                return True
    except Exception as e:
        print(f"❌ SSL证书: {e}")
        return False

def test_ipv6_support():
    """测试系统IPv6支持"""
    try:
        socket.socket(socket.AF_INET6, socket.SOCK_STREAM).close()
        print("✅ 系统IPv6支持: 可用")
        return True
    except Exception as e:
        print(f"❌ 系统IPv6支持: {e}")
        return False

def test_api_endpoints():
    """测试API端点"""
    endpoints = [
        '/api/ai-models',
        '/api/customers',
        '/api/folders'
    ]
    
    success_count = 0
    for endpoint in endpoints:
        try:
            response = requests.get(f'http://127.0.0.1:5002{endpoint}', timeout=5)
            if response.status_code == 200:
                print(f"✅ API {endpoint}: 正常")
                success_count += 1
            else:
                print(f"⚠️ API {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"❌ API {endpoint}: {e}")
    
    return success_count == len(endpoints)

def main():
    """主测试函数"""
    print("=" * 60)
    print("AI CRM - HTTPS & IPv6 功能测试")
    print("=" * 60)
    
    tests = [
        ("系统IPv6支持", test_ipv6_support),
        ("HTTP IPv4连接", test_http_ipv4),
        ("HTTP IPv6连接", test_http_ipv6),
        ("HTTPS IPv4连接", test_https_ipv4),
        ("HTTPS IPv6连接", test_https_ipv6),
        ("SSL证书验证", test_ssl_certificate),
        ("API端点测试", test_api_endpoints)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 测试: {test_name}")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 60)
    print("测试结果汇总:")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print(f"\n总计: {passed}/{len(results)} 项测试通过")
    
    if passed == len(results):
        print("🎉 所有测试通过！HTTPS和IPv6功能正常工作。")
    elif passed >= len(results) // 2:
        print("⚠️ 部分测试通过，请检查失败的项目。")
    else:
        print("❌ 大部分测试失败，请检查服务器配置。")
    
    print("\n" + "=" * 60)
    print("使用说明:")
    print("1. 启用HTTPS: export ENABLE_HTTPS=true && python app.py")
    print("2. 启用IPv6: export ENABLE_IPV6=true && python app.py")
    print("3. 同时启用: python start_https.py")
    print("4. 查看详细指南: cat HTTPS_IPv6_GUIDE.md")
    print("=" * 60)

if __name__ == '__main__':
    main()