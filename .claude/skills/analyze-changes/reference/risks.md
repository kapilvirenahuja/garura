# Risk Detection Patterns

## Sensitive Files

Filename patterns:
- `.env*`
- `*.pem`
- `*.key`
- `*credentials*`
- `*secrets*`
- `*.p12`
- `*.pfx`

Content patterns (in diff):
- `password\s*=`
- `api_key\s*=`
- `secret\s*=`
- `token\s*=`
- `private_key`
- `BEGIN RSA PRIVATE KEY`
- `BEGIN OPENSSH PRIVATE KEY`

## Breaking Changes

Indicators:
- Removed exports (function/class no longer exported)
- Changed function signatures (parameters added/removed/reordered)
- Schema migrations (database changes)
- API endpoint changes (path, method, response structure)
- Major version bumps in package.json
- Deleted public APIs

## Hotfix Branch Detection

Branch patterns that trigger checkpoint:
- `hotfix/*`
- `hotfix-*`
- `hot-fix/*`
- `emergency/*`
