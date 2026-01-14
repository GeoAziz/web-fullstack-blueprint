#!/usr/bin/env python3
"""
PRD Validator Hook

Validates that the product requirements document is complete before proceeding.
- Checks required sections exist
- Validates feature specifications
- Ensures success metrics defined
- Verifies constraints documented
"""

import json
import sys
from typing import Any, Dict, List
from datetime import datetime


class PRDValidator:
    def __init__(self, prd_path: str = "./product/prd.md"):
        self.prd_path = prd_path
        self.timestamp = datetime.now().isoformat()
        self.required_sections = [
            "Executive Summary",
            "Problem Statement",
            "Target Users/Personas",
            "Core Features",
            "Success Metrics",
            "Constraints",
            "Timeline",
            "Non-Goals"
        ]

    def validate_prd(self, prd_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate PRD structure and content
        """
        issues = []
        
        # Check required sections
        for section in self.required_sections:
            if section not in prd_content:
                issues.append(f"Missing section: {section}")
        
        # Validate features
        if "features" in prd_content:
            feature_issues = self._validate_features(prd_content["features"])
            issues.extend(feature_issues)
        
        # Validate success metrics
        if "success_metrics" in prd_content:
            metric_issues = self._validate_metrics(prd_content["success_metrics"])
            issues.extend(metric_issues)
        
        # Validate constraints
        if "constraints" in prd_content:
            constraint_issues = self._validate_constraints(prd_content["constraints"])
            issues.extend(constraint_issues)
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "timestamp": self.timestamp
        }

    def _validate_features(self, features: List[Dict[str, Any]]) -> List[str]:
        """Validate features list"""
        issues = []
        
        if not features or len(features) == 0:
            issues.append("No features defined")
            return issues
        
        for idx, feature in enumerate(features):
            required_feature_fields = ["name", "priority", "description", "acceptance_criteria"]
            for field in required_feature_fields:
                if field not in feature:
                    issues.append(f"Feature {idx}: missing field '{field}'")
        
        return issues

    def _validate_metrics(self, metrics: Dict[str, Any]) -> List[str]:
        """Validate success metrics"""
        issues = []
        
        required_metric_categories = [
            "development",
            "quality",
            "performance",
            "security",
            "accessibility"
        ]
        
        for category in required_metric_categories:
            if category not in metrics:
                issues.append(f"Missing metric category: {category}")
        
        return issues

    def _validate_constraints(self, constraints: Dict[str, Any]) -> List[str]:
        """Validate constraints"""
        issues = []
        
        required_constraint_categories = [
            "technical",
            "performance",
            "security",
            "compliance"
        ]
        
        for category in required_constraint_categories:
            if category not in constraints:
                issues.append(f"Missing constraint category: {category}")
        
        return issues

    def get_prd_summary(self) -> Dict[str, Any]:
        """Get summary of PRD"""
        return {
            "product": "AI Web Full-Stack Blueprint",
            "version": "1.0.0",
            "status": "active",
            "features_count": 4,
            "success_metrics": [
                "13X development velocity",
                "> 80% code coverage",
                "Lighthouse > 90",
                "Zero security vulnerabilities",
                "WCAG 2.1 AA compliance"
            ]
        }

    def process(self, prd_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method
        """
        validation = self.validate_prd(prd_content)
        
        if validation["valid"]:
            summary = self.get_prd_summary()
            return {
                "valid": True,
                "prd_summary": summary,
                "timestamp": self.timestamp,
                "ready_for_implementation": True
            }
        else:
            return {
                "valid": False,
                "issues": validation["issues"],
                "timestamp": self.timestamp,
                "action_required": "Fix PRD issues before proceeding"
            }


def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python prd_validator.py '<json_prd>'", file=sys.stderr)
        sys.exit(1)
    
    try:
        prd = json.loads(sys.argv[1])
        validator = PRDValidator()
        result = validator.process(prd)
        print(json.dumps(result, indent=2))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
