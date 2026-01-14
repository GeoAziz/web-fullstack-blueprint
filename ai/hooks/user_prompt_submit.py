#!/usr/bin/env python3
"""
User Prompt Submit Hook

Validates incoming requests and injects context needed for the orchestrator.
- Validates request structure
- Injects PRD context
- Injects product constraints
- Injects quality gate requirements
"""

import json
import sys
from typing import Any, Dict
from datetime import datetime


class UserPromptSubmitValidator:
    def __init__(self, prd_path: str = "./product/prd.md"):
        self.prd_path = prd_path
        self.timestamp = datetime.now().isoformat()

    def validate_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate user request structure
        """
        required_fields = ["type", "action", "description"]
        
        for field in required_fields:
            if field not in request:
                return {
                    "valid": False,
                    "error": f"Missing required field: {field}",
                    "timestamp": self.timestamp
                }
        
        # Validate request type
        valid_types = ["feature", "bugfix", "refactor", "documentation"]
        if request["type"] not in valid_types:
            return {
                "valid": False,
                "error": f"Invalid request type. Must be one of: {', '.join(valid_types)}",
                "timestamp": self.timestamp
            }
        
        return {"valid": True, "timestamp": self.timestamp}

    def inject_context(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inject PRD and constraints context
        """
        context = {
            "prd": self._load_prd_summary(),
            "constraints": self._load_constraints(),
            "quality_gates": self._get_quality_gates(),
        }
        
        request["injected_context"] = context
        return request

    def _load_prd_summary(self) -> Dict[str, Any]:
        """Load PRD summary"""
        return {
            "product": "AI Web Full-Stack Blueprint",
            "features": [
                {
                    "name": "Marketing Homepage",
                    "priority": "P0",
                    "status": "planned"
                },
                {
                    "name": "User Authentication",
                    "priority": "P0",
                    "status": "planned"
                },
                {
                    "name": "Real-Time Dashboard",
                    "priority": "P1",
                    "status": "planned"
                },
                {
                    "name": "Blog/Content Management",
                    "priority": "P2",
                    "status": "planned"
                }
            ]
        }

    def _load_constraints(self) -> Dict[str, Any]:
        """Load technical constraints"""
        return {
            "performance": {
                "lighthouse": "> 90",
                "first_contentful_paint": "< 1.5s",
                "largest_contentful_paint": "< 2.5s",
                "time_to_interactive": "< 3.5s",
                "cumulative_layout_shift": "< 0.1"
            },
            "security": {
                "authentication": "JWT",
                "password_min_length": 12,
                "rate_limiting": "100 req/15min",
                "https": "required"
            },
            "accessibility": {
                "wcag": "2.1 AA",
                "touch_target_size": "44x44px minimum"
            },
            "browsers": {
                "chrome": ">= 90",
                "firefox": ">= 88",
                "safari": ">= 14"
            }
        }

    def _get_quality_gates(self) -> list:
        """Get list of quality gates"""
        return [
            "TypeScript compilation",
            "ESLint passing",
            "Jest tests (>80% coverage)",
            "Lighthouse performance",
            "Security scanning",
            "Accessibility validation",
            "SEO requirements",
            "Bundle size limits"
        ]

    def process(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method
        """
        # Validate
        validation = self.validate_request(request)
        if not validation["valid"]:
            return validation
        
        # Inject context
        enriched_request = self.inject_context(request)
        
        return {
            "valid": True,
            "request": enriched_request,
            "timestamp": self.timestamp,
            "ready_for_orchestrator": True
        }


def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python user_prompt_submit.py '<json_request>'", file=sys.stderr)
        sys.exit(1)
    
    try:
        request = json.loads(sys.argv[1])
        validator = UserPromptSubmitValidator()
        result = validator.process(request)
        print(json.dumps(result, indent=2))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
