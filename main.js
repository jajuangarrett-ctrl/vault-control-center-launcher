"use strict";

const { Notice, Plugin, TFile } = require("obsidian");
const fs = require("fs");
const http = require("http");
const path = require("path");

const DASHBOARD_HTML = "Artifacts/Vault Control Center/vault-control-center.html";
const DASHBOARD_URL = "http://127.0.0.1:8766/vault-control-center.html";
const HTML_VIEWER_TYPE = "html-viewer";
const REFRESH_SERVER_SCRIPT = "Artifacts/Vault Control Center/tools/serve-vault-control-center.js";
const REFRESH_SERVER_HEALTH = "http://127.0.0.1:8766/__vcc_health";

function refreshServerHealthy() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (healthy) => {
      if (settled) return;
      settled = true;
      resolve(healthy);
    };

    const request = http.get(REFRESH_SERVER_HEALTH, (response) => {
      response.resume();
      finish(response.statusCode === 200);
    });
    request.setTimeout(500, () => {
      request.destroy();
      finish(false);
    });
    request.on("error", () => finish(false));
  });
}

module.exports = class VaultControlCenterLauncherPlugin extends Plugin {
  async onload() {
    this.refreshServer = null;
    this.refreshServerStart = null;

    const ribbonIcon = this.addRibbonIcon("home", "Open Vault Control Center", () => {
      this.openDashboard();
    });
    ribbonIcon.addClass("vault-control-center-ribbon-icon");
    this.moveRibbonIconToTop(ribbonIcon);

    this.addCommand({
      id: "open-vault-control-center",
      name: "Open Vault Control Center",
      callback: () => this.openDashboard(),
    });

    this.register(() => this.stopRefreshServer());
    void this.ensureRefreshServer().catch((error) => {
      console.error("Vault Control Center refresh server did not start during plugin load.", error);
    });
  }

  moveRibbonIconToTop(ribbonIcon) {
    const parent = ribbonIcon.parentElement;
    if (parent) parent.prepend(ribbonIcon);
  }

  async openDashboard() {
    try {
      await this.ensureRefreshServer();
    } catch (error) {
      console.error("Vault Control Center refresh server could not start.", error);
      new Notice("Dashboard opened, but its refresh service could not start.");
    }

    const dashboard = this.app.vault.getAbstractFileByPath(DASHBOARD_HTML);
    if (dashboard instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(true);
      try {
        await leaf.setViewState({
          type: HTML_VIEWER_TYPE,
          state: { file: DASHBOARD_HTML },
          active: true,
        });
      } catch (error) {
        await leaf.openFile(dashboard);
      }
      return;
    }

    new Notice("Opening Vault Control Center in browser.");
    window.open(DASHBOARD_URL, "_blank");
  }

  async ensureRefreshServer() {
    if (await refreshServerHealthy()) return true;

    if (!this.refreshServerStart) {
      this.refreshServerStart = this.startRefreshServer().finally(() => {
        this.refreshServerStart = null;
      });
    }

    return this.refreshServerStart;
  }

  async startRefreshServer() {
    const adapter = this.app.vault.adapter;
    const basePath = typeof adapter.getBasePath === "function" ? adapter.getBasePath() : "";
    if (!basePath) {
      throw new Error("Vault Control Center refresh requires a desktop vault path.");
    }

    const serverScript = path.join(basePath, REFRESH_SERVER_SCRIPT);
    if (!fs.existsSync(serverScript)) {
      throw new Error(`Refresh server script not found: ${REFRESH_SERVER_SCRIPT}`);
    }

    if (require.cache?.[serverScript]) delete require.cache[serverScript];
    const serverModule = require(serverScript);
    if (typeof serverModule.startServer !== "function") {
      throw new Error("Refresh server module does not export startServer().");
    }

    try {
      const server = await serverModule.startServer();
      this.refreshServer = server;
      server.once("close", () => {
        if (this.refreshServer === server) this.refreshServer = null;
      });
      if (await refreshServerHealthy()) return true;
      throw new Error("Refresh server started but did not answer its health check.");
    } catch (error) {
      if (await refreshServerHealthy()) return true;
      throw error;
    }
  }

  stopRefreshServer() {
    if (this.refreshServer?.listening) this.refreshServer.close();
    this.refreshServer = null;
  }
};
