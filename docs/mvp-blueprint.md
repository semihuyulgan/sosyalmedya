# AI Social Media Autopilot MVP Blueprint

## Product Positioning

This product is a hybrid system for restaurants and small businesses:

- Web app for visibility, management, history, reporting, and configuration
- Telegram bot for approvals, quick commands, and urgent changes
- Instagram-first publishing workflow
- High-touch onboarding done by the operator team

Core promise:

> We set up the brand once, then the system continuously generates, routes, approves, schedules, and improves social content.

## Primary User Roles

### 1. Platform Admin

Internal team that manages all clients, onboarding, assets, content quality, and publishing.

### 2. Operator

Content/operations person who uploads assets, reviews AI outputs, updates campaigns, and manages approval queues.

### 3. Client

Business owner or manager who reviews content, gives approval, requests changes, and occasionally adds new products or campaigns.

## Product Surface

### Web App

Used for:

- onboarding
- business profile management
- brand memory
- asset management
- content calendar
- content editing
- campaign setup
- analytics
- approval history

### Telegram Bot

Used for:

- content approval
- quick revision requests
- new product submission
- campaign creation
- publish mode control
- urgent schedule changes
- publishing failure alerts

## End-to-End UX Flow

### Flow 1: Internal Onboarding

1. Admin creates a new business workspace.
2. Operator fills business details.
3. Operator uploads photos/videos from the initial shoot.
4. Operator tags assets and marks hero assets.
5. System generates draft brand memory.
6. Operator edits and confirms brand memory.
7. System generates a 7-day and 30-day content strategy.
8. Operator reviews generated content queue.
9. Client is invited to the workspace and Telegram is connected.
10. Publish mode is selected:
   - manual approval
   - smart approval
   - auto publish

### Flow 2: Weekly Content Production

1. Scheduler starts weekly content generation.
2. Content engine reads brand memory, campaign state, asset availability, and recent performance.
3. System creates proposed posts/reels/stories for the target week.
4. Operator reviews and adjusts queue if needed.
5. Approval service sends eligible items to client on Telegram.
6. Client approves or requests revision.
7. Approved content is scheduled.
8. Publishing service publishes to Instagram.
9. Analytics service ingests post-performance data.
10. Optimization signals are stored for next cycle.

### Flow 3: Client Adds a New Product

1. Client sends `/newproduct` in Telegram or uses the web panel.
2. Bot asks for:
   - product name
   - short description
   - optional price
   - optional launch date
   - image/video
3. Backend creates a `product_submission`.
4. Operator is notified if review is required.
5. Approved product is stored in asset and product catalogs.
6. Content strategy engine adds it to the next content cycle.

### Flow 4: Client Requests a Revision from Telegram

1. Client receives content preview.
2. Client taps `Revise`.
3. Bot shows quick actions:
   - shorter caption
   - more premium tone
   - stronger CTA
   - remove price mention
   - reschedule
4. Client can also send free text.
5. Revision request is attached to the content item.
6. Operator or AI regenerates the content variant.
7. Updated version is resent for approval.

### Flow 5: Auto Publish Mode

1. Weekly content is generated and reviewed internally.
2. Items that do not match smart-approval rules are auto-approved.
3. Telegram sends an FYI notification instead of approval request.
4. If the client pauses publishing, future jobs move to hold state.

## Wireframe-Level Screen Design

## 1. Login / Workspace Selection

### Purpose

Entry point for operators and clients.

### Main UI Blocks

- email/password or magic link
- workspace list
- role badge
- quick link to Telegram setup

### Primary Actions

- sign in
- switch workspace
- connect Telegram

## 2. Dashboard

### Purpose

Fast operational visibility.

### Main UI Blocks

- top KPI strip
  - items scheduled this week
  - approvals pending
  - posts published this month
  - publishing failures
- next scheduled content card
- approval queue preview
- campaign spotlight
- recent performance snapshot
- quick actions
  - add campaign
  - upload assets
  - generate next week

### Notes

This should feel like an operations command center, not a deep analytics page.

## 3. Business Profile

### Purpose

The structured source of truth for the business.

### Main UI Blocks

- business identity
  - name
  - category
  - address
  - location tags
  - contact info
- commercial context
  - price segment
  - average order value
  - reservation/sales channel
  - target action
- brand tone
  - tone sliders or preset chips
  - forbidden phrases
  - preferred CTAs
- operational metadata
  - working hours
  - peak hours
  - seasonal notes

### Primary Actions

- edit business data
- save as source-of-truth
- regenerate brand memory

## 4. Asset Library

### Purpose

Manage all uploaded photos/videos and make them reusable for content generation.

### Main UI Blocks

- upload area
- asset grid
- filter chips
  - product
  - space
  - team
  - process
  - campaign
  - hero-shot
  - reel-broll
- asset detail drawer
  - preview
  - tags
  - quality score
  - last used date
  - usage count
  - linked products/campaigns

### Primary Actions

- upload
- tag
- archive
- mark as featured
- attach to campaign

## 5. Brand Memory

### Purpose

Show the AI-understood business identity and let operators refine it.

### Main UI Blocks

- brand summary
- customer personas
- content pillars
- high-priority products
- tone guidance
- visual guidance
- CTA strategy
- seasonal opportunities
- do-not-say rules

### Primary Actions

- edit section
- regenerate section
- lock section

### Notes

This is one of the highest-trust screens because it proves the system understands the business.

## 6. Content Strategy

### Purpose

Translate brand memory into a weekly or monthly plan.

### Main UI Blocks

- date range picker
- target mix
  - posts
  - reels
  - stories
- strategy lanes
  - product spotlight
  - atmosphere
  - offer/campaign
  - social proof
  - behind the scenes
  - conversion push
- best times recommendation
- CTA distribution plan

### Primary Actions

- generate strategy
- rebalance mix
- pin a theme
- exclude a theme

## 7. Content Calendar

### Purpose

Main execution screen for planned content.

### Main UI Blocks

- calendar view
  - month
  - week
  - list
- content cards
  - platform
  - type
  - date/time
  - status
  - target action
- right-side queue
  - drafts
  - needs review
  - waiting approval
  - scheduled

### Statuses

- draft
- generated
- needs_review
- waiting_approval
- approved
- scheduled
- published
- failed
- archived

### Primary Actions

- drag to reschedule
- open content detail
- bulk approve
- trigger Telegram approval

## 8. Content Detail / Editor

### Purpose

Review and fine-tune a single content item.

### Main UI Blocks

- media preview
- content metadata
  - type
  - pillar
  - campaign
  - target action
- caption editor
- hook editor
- CTA editor
- hashtag suggestions
- story adaptation
- reel shot list / script
- variation tabs
  - v1
  - v2
  - v3
- approval timeline

### Primary Actions

- regenerate copy
- request different media
- send for approval
- approve internally
- schedule

### Notes

Do not make this a heavy design tool. It should optimize speed and approval confidence.

## 9. Campaigns

### Purpose

Manage time-bound promotions and launches.

### Main UI Blocks

- campaign list
- campaign status
- linked products
- campaign date range
- offer details
- priority level
- generated campaign content count

### Primary Actions

- create campaign
- attach assets
- generate campaign pack
- pause campaign

## 10. Approval Queue

### Purpose

Central review surface for all content pending client or internal decision.

### Main UI Blocks

- tabs
  - internal review
  - client approval
  - revision requested
- preview cards
- Telegram delivery status
- SLA / pending time

### Primary Actions

- resend Telegram approval
- mark approved
- assign operator
- batch revise

## 11. Analytics

### Purpose

Show what is working, not vanity dashboard overload.

### Main UI Blocks

- KPI strip
  - reach
  - saves
  - shares
  - profile visits
  - DM clicks
  - WhatsApp clicks
- top content list
- best posting times
- best-performing pillars
- best CTA patterns
- poor performers
- AI insights panel

### Primary Actions

- compare periods
- export report
- generate next-week recommendations

## 12. Settings / Integrations

### Purpose

Configure channels and automation behavior.

### Main UI Blocks

- Instagram connection
- Telegram connection
- publish mode
  - manual
  - smart
  - auto
- notification settings
- team members
- permissions
- audit log

### Primary Actions

- reconnect channel
- change publish mode
- invite user
- pause publishing

## Telegram UX Design

### Core Commands

- `/start`
- `/help`
- `/approve`
- `/calendar`
- `/newproduct`
- `/campaign`
- `/pause`
- `/resume`
- `/status`

### Approval Message Format

- media preview
- content type
- planned publish date
- short caption preview
- target action
- buttons:
  - Approve
  - Revise
  - Reschedule
  - Cancel

### Revision Flow

Buttons:

- Shorter
- More premium
- More casual
- Stronger CTA
- Remove price
- Custom note

### Smart Approval Rules

Send for approval only when:

- campaign content
- price mention exists
- new product launch
- sensitive promotion
- manually flagged by operator

## Recommended Information Architecture

### Left Navigation

- Dashboard
- Calendar
- Content
- Assets
- Campaigns
- Analytics
- Business Profile
- Settings

### Top Context Bar

- workspace selector
- publish mode badge
- Telegram status
- approval count
- quick add

## Suggested MVP Stack

- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui
- Backend API: NestJS + TypeScript
- Database: PostgreSQL
- Cache/queue: Redis
- Background jobs: BullMQ
- File storage: S3-compatible object storage
- Auth: Clerk or custom JWT auth
- Telegram: Telegram Bot API
- AI orchestration: provider-agnostic service layer
- Analytics ingestion: webhook/polling worker layer

## Delivery Phases

### Phase 1

Internal operator-first MVP:

- business profile
- asset library
- brand memory
- calendar
- content detail
- Telegram approval

### Phase 2

Client-facing portal:

- client login
- approval queue
- analytics
- campaign management

### Phase 3

Optimization layer:

- smarter approval routing
- AI recommendations
- content performance loops
- multi-branch support

## Build Order

1. Authentication and multi-tenant workspace model
2. Business profile and brand memory
3. Asset upload and tagging
4. Content calendar and content item model
5. Telegram approval workflow
6. Scheduler and publishing pipeline
7. Analytics ingestion and insights

