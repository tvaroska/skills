#!/usr/bin/env python3
"""
Validate environment setup for agent-demo skill.
Checks Python version, installed packages, and Google Cloud configuration.
"""

import sys
import subprocess
from importlib.metadata import version, PackageNotFoundError


def check_python_version():
    """Check if Python version is 3.10+"""
    print("Checking Python version...")
    if sys.version_info < (3, 10):
        print(f"  ✗ Python {sys.version_info.major}.{sys.version_info.minor} detected")
        print(f"  ✓ Python 3.10+ required")
        return False
    print(f"  ✓ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True


def check_package(package_name, import_name=None):
    """Check if a Python package is installed"""
    try:
        import_name = import_name or package_name
        ver = version(import_name)
        print(f"  ✓ {package_name} ({ver})")
        return True
    except PackageNotFoundError:
        print(f"  ✗ {package_name} not installed")
        return False


def check_packages():
    """Check if required packages are installed"""
    print("\nChecking Python packages...")
    required = [
        ("google-genai", "google.genai"),
        ("google-adk", "google.adk"),
        ("google-cloud-aiplatform", "google.cloud.aiplatform"),
        ("a2a-sdk", "a2a"),
    ]

    all_installed = True
    for package, import_name in required:
        if not check_package(package, import_name):
            all_installed = False

    if not all_installed:
        print("\n  Install missing packages:")
        print("  pip install google-genai google-adk google-cloud-aiplatform a2a-sdk")

    return all_installed


def check_gcloud():
    """Check if gcloud is installed and configured"""
    print("\nChecking Google Cloud CLI...")

    # Check if gcloud is installed
    try:
        result = subprocess.run(
            ["gcloud", "version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            print("  ✗ gcloud not found")
            return False
        print("  ✓ gcloud installed")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("  ✗ gcloud not found")
        print("  Install: https://cloud.google.com/sdk/docs/install")
        return False

    # Check project configuration
    try:
        result = subprocess.run(
            ["gcloud", "config", "get-value", "project"],
            capture_output=True,
            text=True,
            timeout=5
        )
        project = result.stdout.strip()
        if project and project != "(unset)":
            print(f"  ✓ Project configured: {project}")
            return True
        else:
            print("  ✗ No project configured")
            print("  Run: gcloud config set project YOUR_PROJECT_ID")
            return False
    except subprocess.TimeoutExpired:
        print("  ✗ Could not check project configuration")
        return False


def main():
    """Run all validation checks"""
    print("=" * 60)
    print("Agent Demo Environment Validation")
    print("=" * 60)

    checks = [
        check_python_version(),
        check_packages(),
        check_gcloud(),
    ]

    print("\n" + "=" * 60)
    if all(checks):
        print("✓ All checks passed! You're ready to start building agents.")
        print("\nNext step: Start with references/basic-sdk-agent.md")
        return 0
    else:
        print("✗ Some checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
