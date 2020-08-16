export interface BdPlugin {
    // Required Functions

    /**
     * The name for the plugin to be displayed to the user in the plugins page
     * and for internal settings to use.
     * @returns {string} - the name for the plugin.
     */
    getName(): string

    /**
     * The description of the plugin shown in the plugins page.
     * @returns {string} - the description of the plugin.
     */
    getDescription(): string

    /**
     * The version of the plugin displayed in the plugins page.
     * @returns {string} - the version of the plugin.
     */
    getVersion(): string

    /**
     * The author string for the plugin displayed in the plugins page.
     * @returns {string} - the author of the plugin.
     */
    getAuthor(): string

    /**
     * Called when the plugin is enabled or when it is loaded and was previously
     * reloaded (such as discord start or reload).
     */
    start(): void

    /**
     * Called when the plugin is disabled.
     */
    stop(): void

    // Optional Functions

    /**
     * Called when the user clicks on the settings button for the plugin. If 
     * this function is not implemented the button is not shown.
     * 
     * Note: The button will be disabled if the plugin is disabled to avoid 
     * errors with not-started plugins.
     * @returns {String|HTMLElement} - either a valid string containing the html
     * for the panel or an actual element to be injected into the settings panel.
     */
    getSettingsPanel?(): string | HTMLElement

    /**
     * Called when the plugin is loaded regardless of if it is enabled or disabled.
     */
    load?():void

    /**
     * Called on every mutation that occurs on the document. For more information 
     * on observers and mutations take a look at MDN's documentation.
     * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
     * @param changes The mutation that occurred.
     */
    observer?(changes: MutationRecord): void

    /**
     * Called every time the user navigates such as changing channel, 
     * changing servers, changing to friends list, etc.
     */
    onSwitch?(): void
}
