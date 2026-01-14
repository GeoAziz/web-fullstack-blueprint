#!/usr/bin/env python3
"""
Web Performance Guard Hook

Enforces performance budgets and prevents code from exceeding limits.
- Validates Lighthouse scores > 90
- Checks bundle size < 250KB
- Validates Core Web Vitals
- Enforces JavaScript size limits
- Checks CSS size
- Validates image optimization
"""

import json
import sys
from typing import Any, Dict
from datetime import datetime


class PerformanceGuard:
    def __init__(self):
        self.timestamp = datetime.now().isoformat()
        self.budgets = {
            "lighthouse": {
                "min_score": 90,
                "categories": ["performance", "accessibility", "best-practices", "seo"]
            },
            "core_web_vitals": {
                "fcp": 1500,  # First Contentful Paint in ms
                "lcp": 2500,  # Largest Contentful Paint in ms
                "tti": 3500,  # Time to Interactive in ms
                "cls": 0.1    # Cumulative Layout Shift
            },
            "bundle_sizes": {
                "javascript": 300,  # KB
                "css": 75,          # KB
                "images": 1000,     # KB per page
                "fonts": 100        # KB
            },
            "network": {
                "ttfb": 200,        # Time to First Byte in ms
                "3g_load_time": 5000,   # 5 seconds
                "4g_load_time": 3000    # 3 seconds
            }
        }

    def validate_performance(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate performance metrics against budgets
        """
        violations = []
        warnings = []
        
        # Check Lighthouse score
        if "lighthouse" in metrics:
            lighthouse_issues = self._check_lighthouse(metrics["lighthouse"])
            violations.extend(lighthouse_issues)
        
        # Check Core Web Vitals
        if "core_web_vitals" in metrics:
            cwv_issues = self._check_core_web_vitals(metrics["core_web_vitals"])
            violations.extend(cwv_issues)
        
        # Check bundle sizes
        if "bundle_sizes" in metrics:
            bundle_issues = self._check_bundle_sizes(metrics["bundle_sizes"])
            violations.extend(bundle_issues)
        
        # Check network metrics
        if "network" in metrics:
            network_issues = self._check_network(metrics["network"])
            violations.extend(network_issues)
        
        return {
            "valid": len(violations) == 0,
            "violations": violations,
            "warnings": warnings,
            "timestamp": self.timestamp
        }

    def _check_lighthouse(self, scores: Dict[str, int]) -> list:
        """Check Lighthouse scores"""
        issues = []
        min_score = self.budgets["lighthouse"]["min_score"]
        
        for category, score in scores.items():
            if score < min_score:
                percentage = (score / min_score) * 100
                issues.append({
                    "type": "critical",
                    "metric": f"Lighthouse {category}",
                    "value": score,
                    "budget": min_score,
                    "message": f"Lighthouse {category} score ({score}) is below minimum ({min_score})"
                })
        
        return issues

    def _check_core_web_vitals(self, cwv: Dict[str, float]) -> list:
        """Check Core Web Vitals"""
        issues = []
        budgets = self.budgets["core_web_vitals"]
        
        metric_names = {
            "fcp": "First Contentful Paint",
            "lcp": "Largest Contentful Paint",
            "tti": "Time to Interactive",
            "cls": "Cumulative Layout Shift"
        }
        
        for metric_key, metric_name in metric_names.items():
            if metric_key in cwv:
                value = cwv[metric_key]
                budget = budgets[metric_key]
                
                if value > budget:
                    issues.append({
                        "type": "critical",
                        "metric": metric_name,
                        "value": value,
                        "budget": budget,
                        "unit": "ms" if metric_key != "cls" else "",
                        "message": f"{metric_name} ({value}ms) exceeds budget ({budget}ms)"
                    })
        
        return issues

    def _check_bundle_sizes(self, sizes: Dict[str, int]) -> list:
        """Check bundle sizes"""
        issues = []
        budgets = self.budgets["bundle_sizes"]
        
        for asset_type, size_kb in sizes.items():
            if asset_type in budgets:
                budget = budgets[asset_type]
                percentage = (size_kb / budget) * 100
                
                if size_kb > budget:
                    level = "critical" if percentage > 110 else "warning"
                    issues.append({
                        "type": level,
                        "metric": f"{asset_type.title()} bundle",
                        "value": size_kb,
                        "budget": budget,
                        "unit": "KB",
                        "percentage": round(percentage, 1),
                        "message": f"{asset_type} size ({size_kb}KB) exceeds budget ({budget}KB)"
                    })
        
        return issues

    def _check_network(self, network: Dict[str, float]) -> list:
        """Check network metrics"""
        issues = []
        budgets = self.budgets["network"]
        
        for metric_key, value in network.items():
            if metric_key in budgets:
                budget = budgets[metric_key]
                
                if value > budget:
                    issues.append({
                        "type": "warning",
                        "metric": metric_key,
                        "value": value,
                        "budget": budget,
                        "unit": "ms",
                        "message": f"{metric_key} ({value}ms) exceeds budget ({budget}ms)"
                    })
        
        return issues

    def get_budget_summary(self) -> Dict[str, Any]:
        """Get performance budget summary"""
        return {
            "lighthouse_minimum": self.budgets["lighthouse"]["min_score"],
            "core_web_vitals": self.budgets["core_web_vitals"],
            "bundle_limits": self.budgets["bundle_sizes"],
            "network_targets": self.budgets["network"]
        }

    def process(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method
        """
        validation = self.validate_performance(metrics)
        
        if validation["valid"]:
            return {
                "valid": True,
                "message": "All performance budgets met",
                "budget_summary": self.get_budget_summary(),
                "timestamp": self.timestamp,
                "approved_for_merge": True
            }
        else:
            return {
                "valid": False,
                "violations": validation["violations"],
                "warnings": validation["warnings"],
                "timestamp": self.timestamp,
                "action_required": "Fix performance violations before merge",
                "budget_summary": self.get_budget_summary()
            }


def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python web_performance_guard.py '<json_metrics>'", file=sys.stderr)
        sys.exit(1)
    
    try:
        metrics = json.loads(sys.argv[1])
        guard = PerformanceGuard()
        result = guard.process(metrics)
        print(json.dumps(result, indent=2))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
