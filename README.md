# Blockra

A powerful, self-hosted website builder designed to run on Proxmox LXC containers or any Node.js environment. Built with React, GrapesJS, and Appwrite.

![SiteBuilder Preview](https://via.placeholder.com/800x400?text=Blockra+SiteBuilder)

## ✨ Features

*   **Drag & Drop Builder**: Powered by GrapesJS, allowing you to build responsive websites visually.
*   **Project Management**: Create, manage, and publish multiple websites.
*   **Appwrite Backend**: Secure authentication, database, and storage powered by Appwrite.
*   **Real-time Publishing**: Publish your websites directly to an Appwrite Storage Bucket with a single click.
*   **Responsive Design**: Mobile-first editing experience with desktop, tablet, and mobile views.
*   **Role-Based Access**: Support for Admin, Pro, Basic, Free, and Guest users.
*   **Customization**: Dark/Light mode, custom theme colors, and UI density settings.
*   **Non-Intrusive Updates**: The system checks for updates automatically but leaves you in full control. A simple notification dot lets you know an update is available, and you can choose to "Update Now" or "Update Later" from the settings.

## 📦 Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, GrapesJS, Framer Motion, Lucide React
*   **Backend**: Appwrite (Authentication, Databases, Storage)
*   **Deployment**: Node.js, Express (for serving the built app and handling updates)

## 🚀 Quick Installation (Proxmox VE)

To install Blockra on your Proxmox VE node, simply run the following command in your Proxmox shell:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Angelo-builds/WebSite_Builder/main/proxmox_install.sh)"
```

This script will:
1.  Ask for basic configuration (Container ID, Password, Resources).
2.  Download the Debian 12 LXC template.
3.  Create a new LXC container.
4.  Install all dependencies (Node.js).
5.  Build and start the application.

Once installed, access the builder at: `http://<YOUR-CONTAINER-IP>:3000`

## 🛠 Manual Installation

If you prefer to install manually:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Angelo-builds/WebSite_Builder.git
    cd WebSite_Builder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file based on `.env.example` and add your Appwrite credentials:
    ```env
    VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    VITE_APPWRITE_PROJECT_ID=your_project_id
    VITE_APPWRITE_DATABASE_ID=your_database_id
    VITE_APPWRITE_SITES_COLLECTION_ID=your_collection_id
    VITE_APPWRITE_PUBLISHED_SITES_BUCKET_ID=your_bucket_id
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 💎 Subscription Plans

Blockra offers different tiers to suit your needs, from personal projects to full agency white-labeling.

| Feature | Guest | Free | Basic | Pro |
| :--- | :---: | :---: | :---: | :---: |
| **Projects** | 0 | 1 | 5 | Unlimited |
| **Basic Templates** | ✅ | ✅ | ✅ | ✅ |
| **Premium Templates** | ❌ | ❌ | ❌ | ✅ |
| **Color Customization** | ❌ | ✅ | ✅ | ✅ |
| **Advanced UI Customization** | ❌ | ❌ | ❌ | ✅ |
| **Publishing** | ❌ | ✅ | ✅ | ✅ |
| **Support** | None | Community | Standard | Priority |

## 📝 License

MIT License.
