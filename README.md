# Ledger-Logic

Ledger-Logic is a mobile-first financial management web application for small business owners in Nigeria/Africa. It is built as a pnpm workspace monorepo with TypeScript.

## Project Structure

- **API Server**: Located in `artifacts/api-server`, this is an Express 5 API server handling all business logic and data persistence.
- **Frontend**: Located in `artifacts/ledger-lite`, this is a React application built with Vite, utilizing TailwindCSS and shadcn/ui components for the user interface.
- **Database**: The project uses PostgreSQL with Drizzle ORM for database interactions. The schema definitions are found in `lib/db/src/schema/`.
- **API Specification**: The API is defined using OpenAPI in `lib/api-spec/openapi.yaml`, which is used to generate the API client.
- **API Client**: The React API client is auto-generated from the OpenAPI specification and is located in `lib/api-client-react/`.

## Setup and Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/SenMich01/Ledger-Logic.git
    cd Ledger-Logic
    ```

2.  **Install dependencies**:
    This project uses `pnpm` as its package manager.
    ```bash
    pnpm install
    ```

3.  **Database Setup (PostgreSQL)**:
    You will need a running PostgreSQL instance. Set up your database connection string in an environment variable (e.g., `.env` file).
    
    *   **Environment Variables**: Create a `.env` file in the root directory with your database URL:
        ```
        DATABASE_URL="postgresql://user:password@host:port/database"
        ```
    *   **Apply Migrations**: Push the database schema changes to your PostgreSQL database:
        ```bash
        pnpm --filter @workspace/db run push
        ```

4.  **Generate API Client (if changes are made to `openapi.yaml`)**:
    ```bash
    pnpm --filter @workspace/api-spec run codegen
    ```

5.  **Run the API Server**:
    ```bash
    pnpm --filter @workspace/api-server run dev
    ```
    The API server will typically run on `http://localhost:3000` (or another port specified in its configuration).

6.  **Run the Frontend Application**:
    ```bash
    pnpm --filter @workspace/ledger-lite run dev
    ```
    The frontend application will start a development server, usually accessible at `http://localhost:5173` (or another port). You can then open this URL in your web browser.

## Deployment to Render

To deploy Ledger-Logic to Render, you will need to configure two separate services: one for the API server and one for the frontend.

### 1. PostgreSQL Database on Render

1.  **Create a new PostgreSQL database** on Render.
2.  **Note down the internal database URL**. This will be used by your API server.

### 2. API Server Deployment (Render Web Service)

1.  **Create a new Web Service** on Render.
2.  **Connect your GitHub repository** (`https://github.com/SenMich01/Ledger-Logic.git`).
3.  **Configuration**:
    *   **Root Directory**: `artifacts/api-server`
    *   **Build Command**: `pnpm install --store=node_modules/.pnpm && pnpm run build`
    *   **Start Command**: `pnpm run start`
    *   **Environment Variables**: Add your `DATABASE_URL` environment variable, using the internal database URL from your Render PostgreSQL instance.

### 3. Frontend Deployment (Render Static Site)

1.  **Create a new Static Site** on Render.
2.  **Connect your GitHub repository** (`https://github.com/SenMich01/Ledger-Logic.git`).
3.  **Configuration**:
    *   **Root Directory**: `artifacts/ledger-lite`
    *   **Build Command**: `pnpm install --store=node_modules/.pnpm && pnpm run build`
    *   **Publish Directory**: `dist`
    *   **Environment Variables**: You will need to set `VITE_API_BASE_URL` to the public URL of your deployed Render API server.

Once both services are deployed, your frontend will communicate with your API server, and Ledger-Logic will be live!

## Making Changes

1.  Make your desired changes in your local repository.
2.  Commit your changes:
    ```bash
    git add .
    git commit -m "Your meaningful commit message"
    ```
3.  Push your changes to GitHub:
    ```bash
    git push origin main
    ```
4.  Render will automatically redeploy your services based on changes to your `main` branch (assuming you have configured auto-deploy).