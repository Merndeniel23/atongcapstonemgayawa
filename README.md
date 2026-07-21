# Smart Garbage Monitoring System

A comprehensive, responsive, and highly interactive full-stack civic waste management platform. It bridges the gap between Households, Purok Leaders, and Waste Collectors to ensure real-time garbage bin tracking, seamless payment validation, official Barangay endorsements, and automated collection dispatches.

---

## 🚀 Key Features

### 1. **Pickup Schedule & Live Timelines**
- **Schedules Ledger**: Monitor community collection cycles and active routes.
- **Smart Recommendations**: Real-time evaluation of communal bin fill rates that automatically offers dynamic system alerts (e.g., warning of critical overflow or confirmation of under-budget sanitary thresholds).
- **Automated Reminders**: Push notification simulation 1 hour before scheduled collections start in the user's specific Purok zone.

### 2. **Sanitation Concerns & Action Ledger**
- **Report Hazards**: Households can log complaints (e.g., Overflowing Communal Barrels, Missed Pickups, Illegal Littering) with photos and precise landmarks.
- **Interactive Tracking**: Transparent, multi-stage workflow showing assignments, collector dispatches, and leader resolutions.

### 3. **Digital Endorsement & Certificate Manager**
- **Barangay clearances**: Residents can apply for Official Waste Compliance Certifications.
- **Leader Board**: Purok Leaders can review, electronically endorse, and generate clean PDF-style certificates complete with watermarked security tags and official seals.

### 4. **Civic Payment Portal**
- **Billing History**: Securely view municipal garbage collection fees, monthly dues, and penalties.
- **Secure Simulation**: Integrated GCash and Maya transaction pipelines with instant payment ledger updates upon admin verification.

### 5. **Interactive Garbage Route Map**
- **Live Pin Mapping**: Real-time visual tracking of communal and residential pickup spots.
- **Route Dispatcher**: Collectors can activate routes, calculate travel estimates, and verify collection points with photo-proof uploads.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS (Utility-First)
- **Icons**: Lucide React
- **Animations**: Motion (framer-motion) for polished transitions
- **Development Tooling**: Vite

---

## ⚙️ Running Locally

Follow these steps to run the application on your local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation

1. **Clone the repository or extract the ZIP file**:
   ```bash
   git clone <your-repository-url>
   cd smart-garbage-monitoring
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to view the application.

4. **Build for production**:
   ```bash
   npm run build
   ```
   This compiles the optimized production-ready bundle.

---

## 📁 Project Structure

```text
├── src/
│   ├── components/       # UI Components (Dashboards, MapView, Payments, etc.)
│   ├── context/          # AppStateContext containing local storage sync & state
│   ├── index.css         # Global Styles & Tailwind configuration
│   ├── main.tsx          # App entry-point
│   └── App.tsx           # Layout wrapper & main navigation
├── package.json          # Dependency configurations & scripts
└── tsconfig.json         # TypeScript configuration
```

---

*This system has been built and refined to support cleaner, greener, and more connected smart communities.*

## Manual Purok Leader Bin Inspection Module

The former sensor-based workflow has been replaced with physical inspections performed by a Purok Leader.

### Features
- Record bin ID, Purok, exact location, observed status, remarks, and optional photo evidence.
- Status choices: Empty, Half-full, Full, Overflowing, and Damaged.
- Full and Overflowing inspections automatically create collector notifications and collection requests.
- Inspection history is visible to Purok Leaders and Administrators.
- Records are persisted in the browser using localStorage for this prototype build.

### Test accounts
- Purok Leader: `leader@barangay.gov` / `password123`
- Administrator: `admin@barangay.gov` / `password123`
- Collector: `collector@barangay.gov` / `password123`
- Household: `test@household.com` / `password123`

### Run locally
```bash
npm install
npm run dev
```
Then open `http://localhost:3000`.
