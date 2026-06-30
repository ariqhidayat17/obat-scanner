# Med Scanner (Obat Scanner)

A React Native mobile application built with Expo, integrated with an Express & tRPC backend. This app uses Drizzle ORM for database operations and includes features like camera integration for scanning medications.

## 🚀 Tech Stack

- **Frontend:** React Native, Expo, NativeWind (Tailwind CSS for React Native), Expo Router
- **Backend:** Express, tRPC, Drizzle ORM (MySQL2)
- **Database:** MySQL
- **Language:** TypeScript
- **Package Manager:** pnpm

## 🛡️ Robustness & Safety

- **Graceful Error Handling:** tRPC backend includes try-catch wrappers for all AI model invocations (`invokeLLM`), returning user-friendly `TRPCError`s instead of crashing.
- **Payload Limits:** Strict Zod validations are in place for the image OCR endpoint (max 8MB Base64 string limit) to prevent memory bloat and Out-Of-Memory (OOM) errors.
- **Native Fallbacks:** Comprehensive error catching on the React Native side, ensuring users receive visual Alerts if hardware features (like the Camera) fail to initialize or capture.

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/installation) (Package manager used for this project)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A running MySQL database instance.

## 🛠 Installation & Setup

1. **Clone the repository (if you haven't already):**
   ```bash
   git clone <your-repo-url>
   cd obat-scanner
   ```

2. **Install Dependencies:**
   Since this project uses `pnpm`, run the following command to install all required packages:
   ```bash
   pnpm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example` (if available) or add the necessary environment variables for your database and API configurations:
   ```env
   # Example .env configuration
   DATABASE_URL="mysql://user:password@localhost:3306/your_db_name"
   ```

4. **Database Migration:**
   Generate and push the Drizzle schema to your database:
   ```bash
   pnpm run db:push
   ```

## 🚀 Running the App

This project runs both the Metro bundler (for the Expo frontend) and the Express server concurrently.

To start the development environment, simply run:
```bash
pnpm run dev
```

Alternatively, you can run them separately:
- **Backend Server only:** `pnpm run dev:server`
- **Expo Frontend only:** `pnpm run dev:metro`

Once the Metro bundler starts, you can:
- Press `a` to open on an Android emulator.
- Press `i` to open on an iOS simulator.
- Scan the QR code with the Expo Go app on your physical device.

## 📜 Available Scripts

- `pnpm run dev`: Starts both frontend and backend concurrently.
- `pnpm run build`: Builds the backend server using esbuild.
- `pnpm run start`: Starts the production build of the backend server.
- `pnpm run lint`: Runs the Expo linter.
- `pnpm run format`: Formats code using Prettier.
- `pnpm run test`: Runs tests using Vitest.

## 🤝 Contributing
Contributions are welcome. Please ensure that your code adheres to the existing linting and formatting rules.

## 📄 License
Private (or insert your open source license here).
