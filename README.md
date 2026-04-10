# White Gloves Sales CRM

A robust, mobile-first Sales CRM built to handle commission-based agents. It is designed dynamically to route users into separate operational silos: an Admin Command Center (for analytics, bulk lead management, and agent oversight) and an Agent Pipeline (for highly responsive, on-the-go follow-ups).

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Built-in Shadcn-like Radix Primitives
- **Backend:** Next.js API Routes (Serverless)
- **Database:** MongoDB via Mongoose
- **Authentication:** Custom JWT stateless authentication (with HTTP-only cookies)
- **Icons & UI:** Lucide React, Class-Variance Authority, Tailwind-Merge

---

## 📂 Project Structure

```text
agent-crm/
│
├── app/                  # Next.js App Router Core
│   ├── (admin)/          # Group route for Admin portal
│   │   ├── admin/        # Admin Dashboard Page
│   │   ├── admin/agents/ # Agent Create & Manage Page
│   │   ├── admin/leads/  # Lead Table & Edit Page
│   │   └── admin/upload/ # Excel Data Upload & Mapping Engine
│   │
│   ├── (agent)/          # Group route for Field Agents
│   │   ├── agent/        # Agent Dashboard View
│   │   └── agent/leads/  # One-tap interactive leads pipeline
│   │
│   ├── (auth)/login/     # Universal JWT Login Portal
│   ├── api/              # Restful APIs Backend
│   └── layout.tsx        # Global Layout config & Error boundaries
│
├── components/           
│   ├── shared/           # Sticky navbars, AuthProvider context wrapper
│   └── ui/               # Radix-UI accessible components (Cards, Tables, Modals)
│
├── lib/                  # Utilities (db.ts connector, Auth jwt helpers)
└── models/               # MongoDB Database Schemas
```

---

## 🔐 Authentication Flow

The app utilizes a fully customized JWT architecture rather than heavy libraries. 
**How it works:**
1. A user logs in through `POST /api/auth/login`.
2. The server compares the password using `bcryptjs`.
3. An access token is encoded with their `userId`, `role`, and `name`.
4. It's stored in a secure `httpOnly` cookie (`crm_token`).
5. A client-side wrapper `AuthProvider.tsx` fetches the signed-in user and determines global redirects (Admin -> `/admin`, Agent -> `/agent`).

---

## 📊 Database Models

**1. User (`models/User.ts`)**
Holds credential information. Agents are dynamically evaluated based on role (`admin` or `agent`). Tracks `isActive` statuses to easily disable an employee without deletion.

**2. Lead (`models/Lead.ts`)**
Holds prospective client details.
- Tracks static values: `name`, `phone`, `city`, `source`
- Has fixed pipeline statuses: `New Lead | Contacted | DNP | Interested | Follow-up | Converted | Not Interested`.
- Maintains the `assignedAgentId` (Foreign Key referencing the User) and the expected `commissionAmount`.

**3. Activity (`models/Activity.ts`)**
The operational audit log.
- Maps multiple Activities to a single Lead (`leadId`).
- Maps who made the activity (`agentId`).
- Supports types string: `Call`, `WhatsApp`, `Note`.
- Safely handles `nextFollowUpDate` timestamps.

---

## 🛠 Features & Capabilities

### **The Admin Persona**
The Administrator has full omniscient control over the CRM data.

- **KPI Dashboard (`/admin`)**: Shows raw revenue indicators. Groups leads by MongoDB Aggregation to determine overall conversion metrics. It parses "Killer vs Time-waster" matrices automatically (Killers have >10% win rate).
- **Excel Smart Mapping Upload (`/admin/upload`)**: A robust parser using front-end `xlsx`. It reads `.csv` or `.xlsx` files into JSON, allows the admin to visually map Excel column names to Database constraints, and safely transmits only mapped data via POST to populate the database bulk.
- **Lead Controller (`/admin/leads`)**: An expansive table to modify individual leads, associate specific agents, and designate the flat commission bounty on a given lead.
- **Agent Governance (`/admin/agents`)**: Creates secure credentials for mobile personnel.

### **The Agent Persona**
The Agent interface is strictly optimized for thumb-reachability and cellular performance constraints.

- **Dashboard (`/agent`)**: Quick financial overview of converted leads, expected bounty, and a to-do list mapping specifically to "Follow-up" appointments scheduled for today's Date.
- **Lead Pipeline (`/agent/leads`)**: The primary workspace. Focuses on minimal-click environments. 
   - **One-Tap Dialing:** Immediately launches `tel:` protocols internally.
   - **One-Tap WhatsApp:** Instantly launches `wa.me/` routing.
   - **Action Dialogs:** A fast pop-up that dynamically alters Lead Status, adds plaintext auditing nodes, and sets futuristic Follow-up alarms, all committed seamlessly to MongoDB with a single "Save" stroke.
