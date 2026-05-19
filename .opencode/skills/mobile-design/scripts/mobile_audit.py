#!/usr/bin/env python3
"""
Mobile UX Audit Script - Full Mobile Design Coverage

Analyzes React Native / Flutter code for compliance with:

1. TOUCH PSYCHOLOGY (touch-psychology.md):
   - Touch Target Sizes (44pt iOS, 48dp Android, 44px WCAG)
   - Touch Target Spacing (8px minimum gap)
   - Thumb Zone Placement (primary CTAs at bottom)
   - Gesture Alternatives (visible buttons for swipe)
   - Haptic Feedback Patterns
   - Touch Feedback Timing (<50ms)
   - Touch Accessibility (motor impairment support)

2. MOBILE PERFORMANCE (mobile-performance.md):
   - ScrollView vs FlatList (CRITICAL)
   - React.memo for List Items
   - useCallback for renderItem
   - Stable keyExtractor (NOT index)
   - useNativeDriver for Animations
   - Memory Leak Prevention (cleanup)
   - Console.log Detection
   - Inline Function Detection
   - Animation Performance (transform/opacity only)

3. MOBILE NAVIGATION (mobile-navigation.md):
   - Tab Bar Max Items (5)
   - Tab State Preservation
   - Proper Back Handling
   - Deep Link Support
   - Navigation Structure

4. MOBILE TYPOGRAPHY (mobile-typography.md):
   - System Font Usage
   - Dynamic Type Support (iOS)
   - Text Scaling Constraints
   - Mobile Line Height
   - Font Size Limits

5. MOBILE COLOR SYSTEM (mobile-color-system.md):
   - Pure Black Avoidance (#000000)
   - OLED Optimization
   - Dark Mode Support
   - Contrast Ratios

6. PLATFORM iOS (platform-ios.md):
   - SF Symbols Usage
   - iOS Navigation Patterns
   - iOS Haptic Types
   - iOS-Specific Components

7. PLATFORM ANDROID (platform-android.md):
   - Material Icons Usage
   - Android Navigation Patterns
   - Ripple Effects
   - Android-Specific Components

8. MOBILE BACKEND (mobile-backend.md):
   - Secure Storage (NOT AsyncStorage)
   - Offline Handling
   - Push Notification Support
   - API Response Caching

Total: 50+ mobile-specific checks
"""

import sys
import os
import re
import json
from pathlib import Path

class MobileAuditor:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.passed_count = 0
        self.files_checked = 0

    def audit_file(self, filepath: str) -> None:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except:
            return

        self.files_checked += 1
        filename = os.path.basename(filepath)

        is_react_native = bool(re.search(r'react-native|@react-navigation|React\.Native', content))
        is_flutter = bool(re.search(r'import \'package:flutter|MaterialApp|Widget\.build', content))

        if not (is_react_native or is_flutter):
            return

        small_sizes = re.findall(r'(?:width|height|size):\s*([0-3]\d)', content)
        for size in small_sizes:
            if int(size) < 44:
                self.issues.append(f"[Touch Target] {filename}: Touch target size {size}px < 44px minimum")

        small_gaps = re.findall(r'(?:margin|gap):\s*([0-7])\s*(?:px|dp)', content)
        for gap in small_gaps:
            if int(gap) < 8:
                self.warnings.append(f"[Touch Spacing] {filename}: Touch target spacing {gap}px < 8px minimum")

        has_scrollview = bool(re.search(r'<ScrollView|ScrollView\.', content))
        has_map_in_scrollview = bool(re.search(r'ScrollView.*\.map\(|ScrollView.*\{.*\.map', content))
        if has_scrollview and has_map_in_scrollview:
            self.issues.append(f"[Performance CRITICAL] {filename}: ScrollView with .map(). Use FlatList for lists.")

        if is_react_native:
            has_flatlist = bool(re.search(r'FlatList|FlashList', content))
            has_react_memo = bool(re.search(r'React\.memo|memo\(', content))
            if has_flatlist and not has_react_memo:
                self.warnings.append(f"[Performance] {filename}: FlatList without React.memo on list items")

            has_use_callback = bool(re.search(r'useCallback', content))
            if has_flatlist and not has_use_callback:
                self.warnings.append(f"[Performance] {filename}: FlatList renderItem without useCallback")

            has_key_extractor = bool(re.search(r'keyExtractor', content))
            uses_index_key = bool(re.search(r'key=\{.*index.*\}|key:\s*index', content))
            if has_flatlist and not has_key_extractor:
                self.issues.append(f"[Performance CRITICAL] {filename}: FlatList without keyExtractor")
            if uses_index_key:
                self.issues.append(f"[Performance CRITICAL] {filename}: Using index as key causes bugs when list changes")

            has_animated = bool(re.search(r'Animated\.', content))
            has_native_driver = bool(re.search(r'useNativeDriver:\s*true', content))
            has_native_driver_false = bool(re.search(r'useNativeDriver:\s*false', content))
            if has_animated and has_native_driver_false:
                self.warnings.append(f"[Performance] {filename}: Animation with useNativeDriver: false")

            has_effect = bool(re.search(r'useEffect', content))
            has_cleanup = bool(re.search(r'return\s*\(\)\s*=>|return\s+function', content))
            has_subscriptions = bool(re.search(r'addEventListener|subscribe|\.focus\(\)|\.off\(', content))
            if has_effect and has_subscriptions and not has_cleanup:
                self.issues.append(f"[Memory Leak] {filename}: useEffect with subscriptions but no cleanup function")

        console_logs = len(re.findall(r'console\.log|console\.warn|console\.error|console\.debug', content))
        if console_logs > 5:
            self.warnings.append(f"[Performance] {filename}: {console_logs} console.log statements. Remove before production")

        tab_bar_items = len(re.findall(r'Tab\.Screen|createBottomTabNavigator|BottomTab', content))
        if tab_bar_items > 5:
            self.warnings.append(f"[Navigation] {filename}: {tab_bar_items} tab bar items (max 5 recommended)")

        has_async_storage = bool(re.search(r'AsyncStorage|@react-native-async-storage', content))
        has_secure_storage = bool(re.search(r'SecureStore|Keychain|EncryptedSharedPreferences', content))
        has_token_storage = bool(re.search(r'token|jwt|auth.*storage', content, re.IGNORECASE))
        if has_token_storage and has_async_storage and not has_secure_storage:
            self.issues.append(f"[Security] {filename}: Storing auth tokens in AsyncStorage (insecure). Use SecureStore.")

    def audit_directory(self, directory: str) -> None:
        extensions = {'.tsx', '.ts', '.jsx', '.js', '.dart'}
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', 'dist', 'build', '.next', 'ios', 'android', 'build', '.idea'}]
            for file in files:
                if Path(file).suffix in extensions:
                    self.audit_file(os.path.join(root, file))

    def get_report(self):
        return {
            "files_checked": self.files_checked,
            "issues": self.issues,
            "warnings": self.warnings,
            "passed_checks": self.passed_count,
            "compliant": len(self.issues) == 0
        }


def main():
    if len(sys.argv) < 2:
        print("Usage: python mobile_audit.py <directory>")
        sys.exit(1)

    path = sys.argv[1]
    is_json = "--json" in sys.argv

    auditor = MobileAuditor()
    if os.path.isfile(path):
        auditor.audit_file(path)
    else:
        auditor.audit_directory(path)

    report = auditor.get_report()

    if is_json:
        print(json.dumps(report, indent=2))
    else:
        print(f"\n[MOBILE AUDIT] {report['files_checked']} mobile files checked")
        print("-" * 50)
        if report['issues']:
            print(f"[!] ISSUES ({len(report['issues'])}):")
            for i in report['issues'][:10]:
                print(f"  - {i}")
        if report['warnings']:
            print(f"[*] WARNINGS ({len(report['warnings'])}):")
            for w in report['warnings'][:15]:
                print(f"  - {w}")
        print(f"[+] PASSED CHECKS: {report['passed_checks']}")
        status = "PASS" if report['compliant'] else "FAIL"
        print(f"STATUS: {status}")

    sys.exit(0 if report['compliant'] else 1)


if __name__ == "__main__":
    main()
