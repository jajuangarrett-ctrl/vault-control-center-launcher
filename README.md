# Vault Control Center Launcher

Adds a home icon to Obsidian's left ribbon. Clicking it opens the dashboard HTML file directly through the HTML Viewer tab:

`Artifacts/Vault Control Center/vault-control-center.html`

While Obsidian is running, the plugin automatically starts the dashboard's local refresh service. The **Refresh index**, **Show all**, and server-backed folder controls therefore work without a separate Terminal command. The service stops when the plugin unloads or Obsidian closes.

If the HTML file is missing, the plugin falls back to the local server URL:

`http://127.0.0.1:8766/vault-control-center.html`
