#!/usr/bin/env python3
"""
Advanced deployment monitoring script for SIAM
Uses Render MCP integration for real-time monitoring
"""

import os
import sys
import time
import json
import subprocess
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Configuration
RENDER_SERVICE_ID = "srv-d2f8f0emcj7s73eh647g"
PRODUCTION_URL = "https://iamsiam.ai"
MAX_WAIT_TIME = 600  # 10 minutes
CHECK_INTERVAL = 5  # seconds

# ANSI color codes
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_status(message: str, color: str = Colors.OKBLUE):
    """Print colored status message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}]{Colors.ENDC} {message}")

def run_command(command: str) -> tuple[int, str, str]:
    """Run a shell command and return exit code, stdout, stderr"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except Exception as e:
        return 1, "", str(e)

def get_latest_deploy_id() -> Optional[str]:
    """Get the latest deployment ID from Render"""
    print_status("Fetching latest deployment ID...")
    
    # Use Render CLI to get deployments
    code, stdout, stderr = run_command(
        f"render deploys list -s {RENDER_SERVICE_ID} -o json --limit 1"
    )
    
    if code != 0:
        print_status(f"Failed to fetch deployments: {stderr}", Colors.WARNING)
        return None
    
    try:
        deployments = json.loads(stdout)
        if deployments and len(deployments) > 0:
            deploy_id = deployments[0].get('id')
            print_status(f"Latest deployment: {deploy_id}", Colors.OKCYAN)
            return deploy_id
    except json.JSONDecodeError:
        print_status("Failed to parse deployment data", Colors.WARNING)
    
    return None

def get_deploy_status(deploy_id: str) -> Dict[str, Any]:
    """Get detailed status of a specific deployment"""
    code, stdout, stderr = run_command(
        f"render deploys show -s {RENDER_SERVICE_ID} -d {deploy_id} -o json"
    )
    
    if code != 0:
        return {"status": "unknown", "error": stderr}
    
    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return {"status": "unknown", "error": "Failed to parse response"}

def monitor_deployment(deploy_id: str) -> bool:
    """Monitor a deployment until it completes"""
    print_status(f"Monitoring deployment {deploy_id}...", Colors.HEADER)
    
    start_time = datetime.now()
    timeout = timedelta(seconds=MAX_WAIT_TIME)
    last_status = None
    
    while datetime.now() - start_time < timeout:
        deploy_info = get_deploy_status(deploy_id)
        status = deploy_info.get('status', 'unknown')
        
        # Only print if status changed
        if status != last_status:
            elapsed = (datetime.now() - start_time).total_seconds()
            
            if status == 'live':
                print_status(f"✅ Deployment is LIVE! (took {elapsed:.0f}s)", Colors.OKGREEN)
                return True
            elif status in ['failed', 'canceled']:
                print_status(f"❌ Deployment {status}!", Colors.FAIL)
                
                # Try to get error logs
                print_status("Fetching error logs...", Colors.WARNING)
                code, logs, _ = run_command(
                    f"render logs {RENDER_SERVICE_ID} --tail 100"
                )
                if code == 0:
                    print("\n--- Recent Logs ---")
                    print(logs[-2000:])  # Last 2000 chars
                    print("--- End Logs ---\n")
                
                return False
            elif status == 'build_in_progress':
                print_status(f"🔨 Building... ({elapsed:.0f}s)", Colors.OKCYAN)
            elif status == 'update_in_progress':
                print_status(f"📦 Updating service... ({elapsed:.0f}s)", Colors.OKCYAN)
            elif status == 'pre_deploy_in_progress':
                print_status(f"🔧 Running pre-deploy... ({elapsed:.0f}s)", Colors.OKCYAN)
            else:
                print_status(f"Status: {status} ({elapsed:.0f}s)", Colors.OKBLUE)
            
            last_status = status
        
        time.sleep(CHECK_INTERVAL)
    
    print_status(f"⏱️ Deployment timed out after {MAX_WAIT_TIME}s", Colors.FAIL)
    return False

def check_health() -> bool:
    """Check if the health endpoint is responding"""
    print_status("Checking health endpoint...", Colors.OKBLUE)
    
    max_retries = 30
    for i in range(max_retries):
        code, stdout, stderr = run_command(
            f"curl -s -f -m 10 {PRODUCTION_URL}/api/health"
        )
        
        if code == 0:
            print_status("✅ Health check passed!", Colors.OKGREEN)
            return True
        
        if i < max_retries - 1:
            print_status(f"Health check attempt {i+1}/{max_retries} failed, retrying...", Colors.WARNING)
            time.sleep(10)
    
    print_status("❌ Health check failed!", Colors.FAIL)
    return False

def check_site_accessible() -> bool:
    """Check if the production site is accessible"""
    print_status("Checking site accessibility...", Colors.OKBLUE)
    
    code, stdout, stderr = run_command(
        f"curl -s -I -m 10 {PRODUCTION_URL}"
    )
    
    if code == 0 and ('200' in stdout or '301' in stdout or '302' in stdout):
        print_status("✅ Site is accessible!", Colors.OKGREEN)
        return True
    
    print_status("❌ Site is not accessible!", Colors.FAIL)
    return False

def get_metrics() -> None:
    """Get recent performance metrics"""
    print_status("Fetching performance metrics...", Colors.OKBLUE)
    
    # Get CPU and memory metrics for the last hour
    code, stdout, stderr = run_command(
        f"render metrics {RENDER_SERVICE_ID} --metric cpu_usage --metric memory_usage --duration 1h -o json"
    )
    
    if code == 0:
        try:
            metrics = json.loads(stdout)
            # Process and display metrics
            print_status("📊 Recent Performance:", Colors.OKCYAN)
            # Add metric processing here if needed
        except json.JSONDecodeError:
            pass

def monitor_logs_realtime(duration: int = 30) -> None:
    """Stream logs for a duration"""
    print_status(f"Streaming logs for {duration} seconds...", Colors.OKBLUE)
    
    # Start streaming logs in background
    process = subprocess.Popen(
        f"render logs {RENDER_SERVICE_ID} --tail 100 --follow",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    try:
        # Let it run for specified duration
        time.sleep(duration)
    finally:
        process.terminate()
        process.wait(timeout=5)

def main():
    """Main monitoring function"""
    print_status("🚀 SIAM Deployment Monitor Starting...", Colors.HEADER)
    print_status(f"Service: {RENDER_SERVICE_ID}", Colors.OKCYAN)
    print_status(f"URL: {PRODUCTION_URL}", Colors.OKCYAN)
    print("")
    
    # Get latest deployment
    deploy_id = get_latest_deploy_id()
    
    if not deploy_id:
        print_status("Could not fetch deployment ID", Colors.FAIL)
        sys.exit(1)
    
    # Monitor the deployment
    success = monitor_deployment(deploy_id)
    
    if not success:
        print_status("Deployment failed or timed out", Colors.FAIL)
        sys.exit(1)
    
    # Wait for service to be ready
    print_status("Waiting for service to be fully ready...", Colors.OKBLUE)
    time.sleep(20)
    
    # Verify deployment
    print_status("\n📋 Running verification checks...", Colors.HEADER)
    
    checks_passed = True
    
    if not check_site_accessible():
        checks_passed = False
    
    if not check_health():
        checks_passed = False
    
    # Get metrics
    get_metrics()
    
    # Stream some logs to see if there are any errors
    print_status("\n📜 Recent logs:", Colors.HEADER)
    code, logs, _ = run_command(
        f"render logs {RENDER_SERVICE_ID} --tail 20"
    )
    if code == 0:
        print(logs)
    
    if checks_passed:
        print_status("\n✅ All checks passed! Deployment successful!", Colors.OKGREEN)
        print_status(f"🌐 Site is live at: {PRODUCTION_URL}", Colors.OKGREEN)
        sys.exit(0)
    else:
        print_status("\n⚠️ Some checks failed. Please investigate.", Colors.WARNING)
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_status("\nMonitoring cancelled by user", Colors.WARNING)
        sys.exit(1)
    except Exception as e:
        print_status(f"Unexpected error: {e}", Colors.FAIL)
        sys.exit(1)