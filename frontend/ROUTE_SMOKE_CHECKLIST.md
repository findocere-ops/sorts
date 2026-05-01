# SORTS Route Smoke Checklist

This checklist verifies that all MVP shell routes load gracefully without 404s or crashes, as required by the Route Architecture Fix.

## Public Gateway
- [ ] \`/\` (Landing Page - visual styling perfectly maintained)
- [ ] \`/role\` (Role Gateway - shows prompt to sign in)
- [ ] \`/auth\` (Auth Gateway - handles Privy login shell)

## Creator Studio (Top-Level)
- [ ] \`/studio\` (Overview - works, shows NoCommunitySelected when empty)
- [ ] \`/studio/communities\` (Community Registry shell)
- [ ] \`/studio/create\` (Create community wizard shell)
- [ ] \`/studio/content\` (Safe fallback - shows NoCommunitySelected)
- [ ] \`/studio/privacy-proof\` (Privacy explanation shell)

## Subscriber/Public Community (Demo)
- [ ] \`/join/demo\` (Join page shell)
- [ ] \`/join/demo/subscribe\` (Subscribe wizard shell)
- [ ] \`/app/demo/feed\` (Feed shell)
- [ ] \`/app/demo/membership\` (Membership management shell)
- [ ] \`/app/demo/privacy\` (Subscriber privacy info shell)

## Account
- [ ] \`/account\` (Subscriber global account management shell)

## Legacy Redirects (next.config.mjs)
- [ ] \`/create\` -> redirects to \`/studio/create\`
- [ ] \`/dashboard\` -> redirects to \`/studio\`
- [ ] \`/community/demo\` -> redirects to \`/app/demo/feed\`
- [ ] \`/link\` -> redirects to \`/role\`
- [ ] \`/discover\` -> redirects to \`/role\`
