<div align="center">
  <h1><strong>Blockra — The Ultimate Cloud-Native Website Builder</strong></h1>
  <p><em>No-code, Appwrite-powered, Proxmox-ready.</em></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Appwrite-F02E65?style=for-the-badge&logo=Appwrite&logoColor=white" alt="Appwrite" />
    <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## 🚀 One-Click Installation

For a professional, automated setup on any clean Ubuntu/Debian node (including Proxmox LXC), run the following command:

```bash
curl -sSL https://raw.githubusercontent.com/Angelo-builds/WebSite_Builder/main/install.sh | sudo bash
```

This script will:
1.  Verify root permissions.
2.  Install Docker and Docker Compose if missing.
3.  Clone the Blockra repository.
4.  Guide you through an **interactive setup** for your Appwrite credentials.
5.  Build and launch the application via Docker.

---

**Blockra** is a high-end, self-hosted website builder designed to bring professional web design to any infrastructure. Whether you are a solo creator, an agency, or an enterprise, Blockra provides a seamless, drag-and-drop experience backed by a robust cloud architecture.

![Blockra Dashboard Preview](https://via.placeholder.com/1200x600?text=Blockra+Dashboard+Preview)

## ✨ Key Features

*   🌍 **Multi-page Support**: Build complex websites with unlimited pages, seamless navigation, and shared assets.
*   ⚡ **Real-time Dashboard**: Manage your projects, monitor storage usage, and configure your workspace instantly.
*   🔍 **Smart SEO**: Built-in metadata management, automatic favicon injection, and optimized HTML output.
*   ☁️ **Asset Cloud Storage**: Integrated media manager with quota enforcement, powered by Appwrite Storage.
*   🎨 **Premium Templates**: Start from scratch or use one of our high-converting, responsive templates.
*   🐳 **Proxmox & Docker Ready**: Deploy in seconds on your own infrastructure with zero configuration overhead.

## 📦 Tech Stack

Blockra is built on a modern, scalable stack:

*   **Frontend**: React, Vite, Tailwind CSS, Framer Motion
*   **Editor Engine**: GrapesJS
*   **Backend & Auth**: Appwrite (Authentication, Databases, Storage)
*   **Deployment**: Docker, Proxmox LXC

## 💎 Pricing Tiers

Blockra offers flexible plans designed to scale with your business.

| Plan | Price | Projects | Pages | Storage | Features |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Starter** | **$0** | 1 | 3 | 100MB | Basic Templates, 'Built with Blockra' Badge |
| **Basic** | **$8.99/mo** | 5 | Unlimited | 1GB | Premium Templates, No Badge |
| **Pro** | **$18.99/mo** | Unlimited | Unlimited | 5GB | Custom Fonts, Advanced SEO |
| **Team** | **$9.99/user/mo** | Unlimited | Unlimited | 10GB Shared | White-labeling, Shared Workspace, Priority Support |

## 🛠 Manual Installation

### Docker Installation

If you prefer to set up manually using Docker:

```bash
git clone https://github.com/Angelo-builds/WebSite_Builder.git
cd WebSite_Builder
# Create your .env file based on .env.example
docker-compose up -d --build
```

### Proxmox VE Installation (LXC Script)

To install Blockra on your Proxmox VE node using a dedicated LXC script:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Angelo-builds/WebSite_Builder/main/proxmox_install.sh)"
```

Once installed, access the builder at: `http://<YOUR-IP>:3000`

## ⚖️ License

**PROPRIETARY SOFTWARE LICENSE**

This software is **NOT Open Source**. 

Redistribution, forking for commercial use, reselling the code, or using it to build competing products is strictly prohibited. The code is made public solely for portfolio and educational review purposes. 

All rights are reserved by the author (Angelo). The software is provided "as is", without warranty of any kind. 

For full details, please read the [LICENSE](./LICENSE) file included in this repository.
