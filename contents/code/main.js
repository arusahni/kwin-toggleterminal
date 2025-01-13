// Configuration
const config = {
    windowNamePrefix: null,
    windowNameSuffix: null,
    windowClassName: null,
    command: null,
    skipSwitcher: null,
    skipTaskbar: null,
    loggingEnabled: true,
};

function log(...params) {
    if (config.loggingEnabled) {
        console.log(...params);
    }
}

function loadConfiguration() {
    config.windowNamePrefix = readConfig("windowNamePrefix", "foot").toString();
    config.windowNameSuffix = readConfig("windowNameSuffix", "").toString();
    config.windowClassName = readConfig("windowClassName", "").toString();
    config.launchCommand = readConfig("launchCommand", "/usr/bin/foot").toString();
    const skipTaskbarEnabled = readConfig("skipTaskbarSettingEnabled", "false").toString() === "true";
    config.skipTaskbar = skipTaskbarEnabled ?
        readConfig("skipTaskbar", "false").toString() === "true"
        : null;
    const skipSwitcherEnabled = readConfig("skipSwitcherSettingEnabled", "false").toString() === "true";
    config.skipSwitcher = skipSwitcherEnabled ?
        readConfig("skipSwitcher", "false").toString() === "true"
        : null;
    config.loggingEnabled = readConfig("debugLoggingEnabled", "false").toString() === "true";
    console.log("Starting with logging enabled?", config.loggingEnabled);
}
options.configChanged.connect(loadConfiguration);
loadConfiguration();
log("Config", JSON.stringify(config));

// Helper functions for detecting and launching terminal based on configuration
function isTerminal(window) {
    return (
        window.caption.substr(0, config.windowNamePrefix.length) === config.windowNamePrefix
            &&
            window.caption.substr(-1 * config.windowNameSuffix.length, config.windowNameSuffix.length) === config.windowNameSuffix
            && config.windowClassName.trim() !== '' ? window.resourceClass === config.windowClassName : true
    );
}

function launchTerminal() {
    log("Launching");
    callDBus(
        "net.arusahni.DbusExecutor",
        "/net/arusahni/DbusExecutor",
        "net.arusahni.DbusExecutor.Exec",
        "Cmd",
        config.launchCommand,
    );
}

// Functions for showing / hiding terminal
function showTerminal(window) {
    log("Show terminal");
    const windowWasOnAllDesktops = window.onAllDesktops;
    workspace.sendClientToScreen(window, workspace.activeScreen);
    window.onAllDesktops = true;
    window.minimized = false;
    workspace.activeWindow = window;
    window.onAllDesktops = windowWasOnAllDesktops;
}

function hideTerminal(window) {
    log("Hide terminal");
    window.minimized = true;
}

// State: currently detected terminal
let currentTerminal = null;

// Callback for hiding the terminal if focus is lost
function onCurrentTerminalActiveChanged() {
    if (currentTerminal !== null && !currentTerminal.active) {
        hideTerminal(currentTerminal);
    }
}

function onCurrentTerminalWindowClosed(_topLevel, _deleted) {
    currentTerminal = null;
}

// Getters/setters for the currently detected terminal
function setTerminal(window) {
    log("Setting terminal", window);
    currentTerminal = window;
    currentTerminal.activeChanged.connect(onCurrentTerminalActiveChanged);
    currentTerminal.closed.connect(onCurrentTerminalWindowClosed);
    if (config.skipTaskbar !== null) {
        currentTerminal.skipTaskbar = config.skipTaskbar;
    }
    if (config.skipSwitcher !== null) {
        currentTerminal.skipSwitcher = config.skipSwitcher;
    }
    placeTerminal();
}


function placeTerminal() {
    if (currentTerminal === null) {
        log("No terminal tracked");
        return;
    }
    try {
        const workspaceSize = workspace.clientArea(
            KWin.WorkArea,
            workspace.activeScreen,
            workspace.currentDesktop,
        );
        const { width: screenWidth, height: screenHeight } = workspaceSize;
        log("Dims", JSON.stringify(workspaceSize));
        const width = Math.floor(screenWidth * 0.66);
        const height = Math.floor(screenHeight * 0.5);
        log("<= geo", JSON.stringify(currentTerminal.frameGeometry));
        currentTerminal.frameGeometry.width = width;
        currentTerminal.frameGeometry.x = Math.floor((screenWidth - width) / 2);
        currentTerminal.frameGeometry.y = 0;
        currentTerminal.frameGeometry.height = height;
        currentTerminal.noBorder = true;
        currentTerminal.skipsCloseAnimation = true;
        log("=> geo", JSON.stringify(currentTerminal.frameGeometry));
    } catch (e) {
        log(e);
        return;
    }
}

function getTerminal() {
    if (currentTerminal !== null) {
        log("Existing terminal...");
        if (currentTerminal.deleted || !isTerminal(currentTerminal)) {
            log("Terminal deleted");
            currentTerminal = null;
        }
    }
    if (currentTerminal === null) {
        // Fallback: try to find terminal amongst open windows
        for (const window of workspace.windowList()) {
            if (isTerminal(window)) {
                log("Found terminal", window);
                setTerminal(window);
                break;
            }
        }
    }
    return currentTerminal;
}

// Handle window added and removed events
function onWindowAdded(window) {
    log("On window added", window);
    if (currentTerminal === null && isTerminal(window)) {
        setTerminal(window);
    }
}
function onWindowRemoved(window) {
    log("On window removed", window);
    if (currentTerminal === window) {
        currentTerminal = null;
    }
}
workspace.windowAdded.connect(onWindowAdded);
workspace.windowRemoved.connect(onWindowRemoved);

// Callback for the terminal hotkey
function toggleTerminal() {
    log("Toggle");
    const window = getTerminal();
    if (!window) {
        log("No window, launching");
        launchTerminal();
        getTerminal();
        placeTerminal();
    } else {
        if (window.minimized) {
            log("Window minimized");
            showTerminal(window);
            placeTerminal();
        } else {
            log("Window maximized");
            hideTerminal(window);
        }
    }
}
registerShortcut('ToggleTerminalDev', 'Toggle Terminal Dev', 'Meta+`', toggleTerminal);
