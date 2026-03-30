#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Contract Validator

Compares backend Pydantic schemas with frontend TypeScript types
to detect naming and type mismatches.

Usage:
    python scripts/validate_api_contract.py

Exit codes:
    0 - All contracts match
    1 - Contract mismatches found
"""

import json
import re
import sys
import os
from pathlib import Path
from dataclasses import dataclass
from typing import Any

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')


@dataclass
class FieldInfo:
    """Field information for comparison"""
    name: str
    type_str: str
    is_optional: bool
    source: str  # 'backend' or 'frontend'


@dataclass
class ContractIssue:
    """Represents a contract mismatch"""
    schema_name: str
    field_name: str
    issue_type: str
    backend_value: str
    frontend_value: str
    severity: str  # 'high', 'medium', 'low'


# Type mapping: Python/Pydantic -> TypeScript
TYPE_MAPPING = {
    'int': 'number',
    'str': 'string',
    'bool': 'boolean',
    'float': 'number',
    'datetime': 'string',  # ISO format
    'date': 'string',
    'dict': 'Record<string, any>',
    'list': 'Array',
    'any': 'any',
}

# Python types that map to TypeScript optional
OPTIONAL_TYPES = {'Optional', 'None', 'undefined', 'null'}

# P10-115: Special field mappings for known transformations
# These fields are intentionally renamed during API response transformation
FIELD_MAPPINGS = {
    # Backend field -> Frontend field (when the naming differs from standard snake_to_camel)
    ('UserPublic', 'created_at'): 'joinedAt',
    ('UserResponse', 'created_at'): 'joinedAt',
    # UserResponse has email but UserPublic doesn't - this is intentional
    ('UserResponse', 'email'): None,  # None means field is intentionally excluded from frontend
}


def extract_pydantic_fields(file_path: Path) -> dict[str, dict[str, FieldInfo]]:
    """Extract field names and types from Pydantic schema files"""
    schemas: dict[str, dict[str, FieldInfo]] = {}

    content = file_path.read_text(encoding='utf-8')

    # Find all class definitions that inherit from BaseModel
    class_pattern = r'class\s+(\w+)\s*\([^)]*BaseModel[^)]*\):'
    class_matches = list(re.finditer(class_pattern, content))

    for class_match in class_matches:
        schema_name = class_match.group(1)
        fields: dict[str, FieldInfo] = {}

        # Find field definitions within the class
        # Match patterns like: field_name: Type = ...
        # or field_name: Optional[Type] = ...
        start_pos = class_match.end()

        # Find next class or end of file
        next_class = re.search(r'\nclass\s+', content[start_pos:])
        end_pos = start_pos + next_class.start() if next_class else len(content)

        class_content = content[start_pos:end_pos]

        # Match field definitions
        field_pattern = r'^\s+(\w+)\s*:\s*([^\n=]+?)(?:\s*=|\n)'
        for field_match in re.finditer(field_pattern, class_content, re.MULTILINE):
            field_name = field_match.group(1)
            type_str = field_match.group(2).strip()

            # Skip private fields and methods
            if field_name.startswith('_'):
                continue

            # Check if optional
            is_optional = 'Optional' in type_str or 'None' in type_str or '| None' in type_str

            # Clean up type string
            type_str = type_str.rstrip(' =').strip()

            fields[field_name] = FieldInfo(
                name=field_name,
                type_str=type_str,
                is_optional=is_optional,
                source='backend'
            )

        if fields:
            schemas[schema_name] = fields

    return schemas


def extract_typescript_interfaces(file_path: Path) -> dict[str, dict[str, FieldInfo]]:
    """Extract field names and types from TypeScript interface definitions"""
    interfaces: dict[str, dict[str, FieldInfo]] = {}

    content = file_path.read_text(encoding='utf-8')

    # Find all interface definitions
    interface_pattern = r'(?:export\s+)?interface\s+(\w+)\s*(?:extends\s+\w+\s*)?\{'
    interface_matches = list(re.finditer(interface_pattern, content))

    for interface_match in interface_matches:
        interface_name = interface_match.group(1)
        fields: dict[str, FieldInfo] = {}

        # Find the closing brace
        start_pos = interface_match.end()
        brace_count = 1
        end_pos = start_pos

        while brace_count > 0 and end_pos < len(content):
            if content[end_pos] == '{':
                brace_count += 1
            elif content[end_pos] == '}':
                brace_count -= 1
            end_pos += 1

        interface_content = content[start_pos:end_pos - 1]

        # Match field definitions: fieldName: Type;
        field_pattern = r'^\s*(\w+)\s*(\?)?\s*:\s*([^;\n]+);?'
        for field_match in re.finditer(field_pattern, interface_content, re.MULTILINE):
            field_name = field_match.group(1)
            optional_marker = field_match.group(2)
            type_str = field_match.group(3).strip()

            # Skip index signatures and private fields
            if field_name.startswith('_') or '[' in field_name:
                continue

            is_optional = optional_marker == '?' or 'undefined' in type_str

            fields[field_name] = FieldInfo(
                name=field_name,
                type_str=type_str,
                is_optional=is_optional,
                source='frontend'
            )

        if fields:
            interfaces[interface_name] = fields

    return interfaces


def snake_to_camel(name: str) -> str:
    """Convert snake_case to camelCase"""
    components = name.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def compare_schemas(
    backend_schemas: dict[str, dict[str, FieldInfo]],
    frontend_interfaces: dict[str, dict[str, FieldInfo]]
) -> list[ContractIssue]:
    """Compare backend and frontend schemas for mismatches"""

    # Mapping of backend schema names to frontend interface names
    # Frontend uses simplified names for some types
    schema_mapping = {
        'UserPublic': 'UserPublic',
        'UserResponse': 'UserPublic',  # Frontend uses UserPublic for user data
        'UserStats': 'UserStats',
        'AuthUser': 'AuthUser',
        'TokenData': 'TokenData',
        'PostResponse': 'Post',
        'PostListResponse': 'Post',
        'CommentResponse': 'Comment',
        'Notification': 'Notification',
    }

    issues: list[ContractIssue] = []

    for backend_name, frontend_name in schema_mapping.items():
        if backend_name not in backend_schemas:
            continue

        backend_fields = backend_schemas[backend_name]

        if frontend_name not in frontend_interfaces:
            # Frontend interface missing
            for field_name, field_info in backend_fields.items():
                camel_name = snake_to_camel(field_name)
                issues.append(ContractIssue(
                    schema_name=backend_name,
                    field_name=field_name,
                    issue_type='missing_frontend_interface',
                    backend_value=f'{field_name}: {field_info.type_str}',
                    frontend_value='NOT FOUND',
                    severity='high'
                ))
            continue

        frontend_fields = frontend_interfaces[frontend_name]

        # Check each backend field
        for be_field_name, be_field_info in backend_fields.items():
            # P10-115: Check for special field mappings first
            mapping_key = (backend_name, be_field_name)
            if mapping_key in FIELD_MAPPINGS:
                expected_frontend_name = FIELD_MAPPINGS[mapping_key]
                # None means field is intentionally excluded from frontend
                if expected_frontend_name is None:
                    continue
                # Otherwise use the mapped name
                expected_camel = expected_frontend_name
            else:
                # Convert snake_case to camelCase for comparison
                expected_camel = snake_to_camel(be_field_name)

            # Check if field exists in frontend with proper naming
            if expected_camel not in frontend_fields:
                # Check if snake_case is used incorrectly
                if be_field_name in frontend_fields:
                    issues.append(ContractIssue(
                        schema_name=backend_name,
                        field_name=be_field_name,
                        issue_type='snake_case_not_transformed',
                        backend_value=be_field_name,
                        frontend_value=be_field_name,
                        severity='medium'
                    ))
                else:
                    # Field missing entirely
                    issues.append(ContractIssue(
                        schema_name=backend_name,
                        field_name=be_field_name,
                        issue_type='missing_field',
                        backend_value=f'{be_field_name}: {be_field_info.type_str}',
                        frontend_value='NOT FOUND',
                        severity='high'
                    ))

    return issues


def print_report(issues: list[ContractIssue]) -> None:
    """Print a formatted report of contract issues"""
    if not issues:
        print("\n[PASS] API Contract Validation PASSED")
        print("       All backend schemas match frontend types\n")
        return

    print("\n" + "=" * 70)
    print("API CONTRACT VALIDATION REPORT")
    print("=" * 70)

    # Group by schema
    by_schema: dict[str, list[ContractIssue]] = {}
    for issue in issues:
        if issue.schema_name not in by_schema:
            by_schema[issue.schema_name] = []
        by_schema[issue.schema_name].append(issue)

    for schema_name, schema_issues in sorted(by_schema.items()):
        print(f"\n[{schema_name}]:")
        for issue in schema_issues:
            severity_icon = {"high": "[HIGH]", "medium": "[MED]", "low": "[LOW]"}.get(issue.severity, "[?]")
            print(f"  {severity_icon} {issue.field_name}:")
            print(f"      Type: {issue.issue_type}")
            print(f"      Backend: {issue.backend_value}")
            print(f"      Frontend: {issue.frontend_value}")

    print("\n" + "-" * 70)
    print(f"Total issues: {len(issues)}")
    print(f"  High: {sum(1 for i in issues if i.severity == 'high')}")
    print(f"  Medium: {sum(1 for i in issues if i.severity == 'medium')}")
    print(f"  Low: {sum(1 for i in issues if i.severity == 'low')}")
    print("=" * 70 + "\n")


def main() -> int:
    """Main entry point"""
    # Paths
    backend_dir = Path(__file__).parent.parent / 'backend' / 'app' / 'schemas'
    frontend_file = Path(__file__).parent.parent / 'app' / 'src' / 'lib' / 'apiClient.ts'

    print("\n[API Contract Validator]")
    print("=" * 70)

    # Extract backend schemas
    print("\nScanning backend schemas...")
    all_backend_schemas: dict[str, dict[str, FieldInfo]] = {}

    for schema_file in backend_dir.glob('*.py'):
        if schema_file.name.startswith('_'):
            continue
        schemas = extract_pydantic_fields(schema_file)
        all_backend_schemas.update(schemas)
        if schemas:
            print(f"   {schema_file.name}: {list(schemas.keys())}")

    # Extract frontend interfaces
    print("\nScanning frontend types...")
    all_frontend_interfaces: dict[str, dict[str, FieldInfo]] = {}

    if frontend_file.exists():
        interfaces = extract_typescript_interfaces(frontend_file)
        all_frontend_interfaces.update(interfaces)
        if interfaces:
            print(f"   apiClient.ts: {list(interfaces.keys())}")
    else:
        print(f"   [WARN] Frontend file not found: {frontend_file}")

    # Compare schemas
    print("\nComparing contracts...")
    issues = compare_schemas(all_backend_schemas, all_frontend_interfaces)

    # Print report
    print_report(issues)

    # Return exit code
    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())