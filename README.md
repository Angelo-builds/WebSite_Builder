# Blockra

A powerful, self-hosted website builder designed to run on Proxmox LXC containers. Built with React, GrapesJS, and Node.js.

![SiteBuilder Preview](https://via.placeholder.com/800x400?text=Proxmox+SiteBuilder)

## 🚀 Quick Installation (Proxmox VE)

To install Blockra on your Proxmox VE node, simply run the following command in your Proxmox shell:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Angelo-builds/WebSite_Builder/main/proxmox_install.sh)"
```

This script will:
1.  Ask for basic configuration (Container ID, Password, Resources).
2.  Download the Debian 12 LXC template.
3.  Create a new LXC container.
4.  Install all dependencies (Node.js, MariaDB).
5.  Build and start the application.

Once installed, access the builder at: `http://<YOUR-CONTAINER-IP>:3000`

## 🛠 Manual Installation

If you prefer to install manually inside an existing Debian/Ubuntu LXC container:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Angelo-builds/WebSite_Builder.git
    cd WebSite_Builder
    ```

2.  **Run the installer:**
    ```bash
    chmod +x install.sh
    ./install.sh
    ```

## ✨ Features

*   **Drag & Drop Builder**: Powered by GrapesJS.
*   **Project Management**: Create and manage multiple websites.
*   **Responsive Design**: Mobile-first editing experience.
*   **Self-Hosted**: Full control over your data.
*   **Proxmox Integration**: Easy deployment on your home lab.

## 💎 Subscription Plans

Blockra offers different tiers to suit your needs, from personal projects to full agency white-labeling.

| Feature | Free | Basic | Pro | Agency |
| :--- | :---: | :---: | :---: | :---: |
| **Projects** | 1 | 5 | Unlimited | Unlimited |
| **Basic Templates** | ✅ | ✅ | ✅ | ✅ |
| **Premium Templates** | ❌ | ❌ | ✅ | ✅ |
| **Color Customization** | ✅ | ✅ | ✅ | ✅ |
| **Advanced UI Customization** | ❌ | ❌ | ✅ | ✅ |
| **Custom Fonts** | ❌ | ❌ | ✅ | ✅ |
| **White-label (Custom Logo)** | ❌ | ❌ | ❌ | ✅ |
| **Team Collaboration** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Community | Standard | Priority | Dedicated |

## 📦 Tech Stack

*   **Frontend**: React, Tailwind CSS, GrapesJS
*   **Backend**: Node.js, Express, MySQL (MariaDB)
*   **Deployment**: LXC (Linux Containers)

## 📝 License

MIT License.
