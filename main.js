"use strict";

const { Notice, Plugin, TFile } = require("obsidian");

const LAUNCHER_NOTE = "Artifacts/Vault Control Center/Open Vault Control Center.md";
const DASHBOARD_URL = "http://127.0.0.1:8766/vault-control-center.html";

module.exports = class VaultControlCenterLauncherPlugin extends Plugin {
  async onload() {
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
  }

  moveRibbonIconToTop(ribbonIcon) {
    const parent = ribbonIcon.parentElement;
    if (parent) parent.prepend(ribbonIcon);
  }

  async openDashboard() {
    const launcher = this.app.vault.getAbstractFileByPath(LAUNCHER_NOTE);
    if (launcher instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(launcher);
      return;
    }

    new Notice("Opening Vault Control Center in browser.");
    window.open(DASHBOARD_URL, "_blank");
  }
};
