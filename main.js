"use strict";

const { Notice, Plugin } = require("obsidian");

const NATIVE_DASHBOARD_COMMAND = "vault-control-center:open-vault-control-center";

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
    const opened = this.app.commands.executeCommandById(NATIVE_DASHBOARD_COMMAND);
    if (!opened) {
      new Notice("Enable or install the Vault Control Center plugin to use this home button.");
    }
  }
};
