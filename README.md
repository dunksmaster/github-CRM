# Gumroad Auditor Enterprise

A comprehensive suite of tools designed to empower Gumroad creators. This application helps you audit your products, optimize your pricing and descriptions, and generate marketing materials to boost your sales.

## Who is this for?

This tool is for Gumroad creators of all levels who want to:
*   Get objective, AI-powered feedback on their products.
*   Improve their product listings for better conversion.
*   Save time on creating marketing content.
*   Understand their sales data to make informed decisions.
*   Streamline their workflow with a single, powerful dashboard.

## Screenshots

*(Please add screenshots of the application here to showcase the features.)*

*   *Screenshot of the main dashboard.*
*   *Screenshot of an AI Audit result.*
*   *Screenshot of the Social Media Generator.*
*   *Screenshot of the PDF Export.*

## Features

### 🤖 AI-Powered Audits
Get a detailed analysis of each of your Gumroad products. The AI audit provides:
*   **Overall Score:** A 0-100 score to quickly assess a product's strength.
*   **Actionable Verdict:** A clear summary of the product's standing.
*   **Identified Issues:** A list of critical, warning, and good points, so you know exactly what to improve.
*   **AI-Generated Rewrites:** Get suggestions for a more compelling title and a completely rewritten, benefit-focused product description.

### 📈 Smart Pricing & Analytics
Make data-driven decisions with powerful analytics:
*   **Store Health Score:** Get a single metric to understand the overall health of your Gumroad store.
*   **Smart Pricing Suggestions:** Receive intelligent price recommendations based on similar products in your catalog.
*   **Funnel Analytics:** Analyze your sales with metrics like Lifetime Value (LTV) and cohort analysis to understand customer behavior.
*   **Description Quality Grade:** See how your product descriptions stack up against best practices.

### 📝 Content Generation Suite
Save hours of work by automatically generating marketing content:
*   **Social Media Generator:** Instantly create posts for Twitter, LinkedIn, Instagram, Facebook, and TikTok, tailored to your products.
*   **Email Campaign Suite:** Generate a series of emails for your marketing funnel, including welcome, abandoned cart, post-purchase, and re-engagement emails.
*   **QR Code Generator:** Create and download QR codes to easily link your physical and digital marketing efforts to your product pages.

### 📄 Reporting & Exporting
Keep track of your data and create professional reports:
*   **PDF Export:** Generate a clean, printable PDF report of your products, perfect for sharing or offline review.
*   **CSV & JSON Export:** Export your product data and audit cache for use in other applications or for your own records.
*   **Cloud Backup:** Download a full backup of your session data.

## How to Use

1.  **Open the Application:** Open the `public/index.html` file in your web browser.

2.  **Get your Gumroad Data:**
    *   You need to provide your Gumroad **Access Token**. You can get this from your Gumroad account settings under "Advanced".
    *   Paste your Access Token into the "Your Gumroad Access Token" field.
    *   The "Open API URL" button is a convenience link. Clicking it will open a new tab with the correct Gumroad API URL, including your token. This URL will display your product data in JSON format.
    *   Copy the entire JSON output from that new tab.
    *   Paste the copied JSON into the "PASTE JSON RESPONSE HERE" text area in the application.

3.  **Add your AI Key:**
    *   You need a Google Gemini API Key. You can get a free one from [Google AI Studio](https://aistudio.google.com/apikey).
    *   Paste your Gemini API key into the "GOOGLE GEMINI API KEY" field.

4.  **Import & Audit:**
    *   Click the "Import Products" button. Your products will now appear on the dashboard.
    *   Click the "🤖 Run AI Audit →" button on any product to get a detailed analysis.
    *   Use the other features like "Generate Social Posts" or "Export to PDF" from the action bar.
    *   Alternatively, you can click "📝 Load Example JSON" to test the application with sample data without connecting your own account.

## Files

*   `public/index.html`: The main file for the application.
*   `.idx/dev.nix`: A development environment configuration file.
