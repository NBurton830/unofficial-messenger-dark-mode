const themes = {
  charcoal: {
    name: "Charcoal",
    background: "#2d2d2d",
    surface: "#3a3a3a",
    text: "#e0e0e0",
    secondaryText: "#b0b0b0",
    accent: "#0084ff",
  },
  midnight: {
    name: "Midnight",
    background: "#121212",
    surface: "#1e1e1e",
    text: "#ffffff",
    secondaryText: "#b0b0b0",
    accent: "#0084ff",
  },
  deepBlue: {
    name: "Deep Blue",
    background: "#0a1929",
    surface: "#132f4c",
    text: "#e6f0ff",
    secondaryText: "#b0c9e6",
    accent: "#0084ff",
  },
}

// Default settings
let settings = {
  darkMode: true,
  theme: "charcoal",
  followSystem: false,
}

// Load saved settings
function loadSettings() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(["messengerDarkMode"], (result) => {
      if (result.messengerDarkMode) {
        settings = { ...settings, ...result.messengerDarkMode }
      }
      applyTheme()
      checkSystemPreference()
    })
  } else {
    console.warn("Chrome storage API not available. Settings will not be loaded or saved.")
    applyTheme()
    checkSystemPreference()
  }
}

// Save settings
function saveSettings() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.set({ messengerDarkMode: settings })
  } else {
    console.warn("Chrome storage API not available. Settings will not be saved.")
  }
}

// Apply the current theme
function applyTheme() {
  // Remove all theme classes
  document.body.classList.remove("charcoal-theme", "midnight-theme", "deep-blue-theme")

  if (settings.darkMode) {
    document.body.classList.add("dark-mode")
    document.body.classList.add(`${settings.theme}-theme`)
  } else {
    document.body.classList.remove("dark-mode")
  }
}

// Check system dark mode preference
function checkSystemPreference() {
  if (settings.followSystem) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    settings.darkMode = prefersDark
    applyTheme()

    // Listen for changes in system preference
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (settings.followSystem) {
        settings.darkMode = e.matches
        applyTheme()
      }
    })
  }
}

// Create and inject the toggle button
function createToggleButton() {
  // Wait for the header to be available
  const checkForHeader = setInterval(() => {
    const header = document.querySelector('[role="banner"]')
    if (header) {
      clearInterval(checkForHeader)

      // Create toggle button
      const toggleButton = document.createElement("div")
      toggleButton.className = "charcoal-toggle"
      toggleButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12,18C11.11,18 10.26,17.8 9.5,17.45C11.56,16.5 13,14.42 13,12C13,9.58 11.56,7.5 9.5,6.55C10.26,6.2 11.11,6 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"></path>
        </svg>
      `

      // Insert at the beginning of the header
      header.insertBefore(toggleButton, header.firstChild)

      // Add click event to toggle button
      toggleButton.addEventListener("click", showPreferencesMenu)
    }
  }, 500)
}

// Create and show preferences menu
function showPreferencesMenu() {
  // Remove existing menu if present
  const existingMenu = document.querySelector(".charcoal-preferences")
  if (existingMenu) {
    existingMenu.remove()
    return
  }

  // Create preferences menu
  const menu = document.createElement("div")
  menu.className = "charcoal-preferences"

  menu.innerHTML = `
    <div class="charcoal-preferences-header">
      <h3>Charcoal Preferences</h3>
      <button class="charcoal-close-btn">×</button>
    </div>
    <div class="charcoal-preferences-content">
      <div class="charcoal-preference-item">
        <label>Dark Mode</label>
        <label class="charcoal-switch">
          <input type="checkbox" id="darkModeToggle" ${settings.darkMode ? "checked" : ""}>
          <span class="charcoal-slider"></span>
        </label>
      </div>
      
      <div class="charcoal-preference-item">
        <label>Follow System</label>
        <label class="charcoal-switch">
          <input type="checkbox" id="followSystemToggle" ${settings.followSystem ? "checked" : ""}>
          <span class="charcoal-slider"></span>
        </label>
      </div>
      
      <div class="charcoal-preference-item">
        <label>Theme</label>
        <select id="themeSelect">
          <option value="charcoal" ${settings.theme === "charcoal" ? "selected" : ""}>Charcoal</option>
          <option value="midnight" ${settings.theme === "midnight" ? "selected" : ""}>Midnight</option>
          <option value="deepBlue" ${settings.theme === "deepBlue" ? "selected" : ""}>Deep Blue</option>
        </select>
      </div>
    </div>
  `

  // Append to body
  document.body.appendChild(menu)

  // Add event listeners
  document.querySelector(".charcoal-close-btn").addEventListener("click", () => {
    menu.remove()
  })

  document.getElementById("darkModeToggle").addEventListener("change", (e) => {
    settings.darkMode = e.target.checked
    applyTheme()
    saveSettings()
  })

  document.getElementById("followSystemToggle").addEventListener("change", (e) => {
    settings.followSystem = e.target.checked
    if (settings.followSystem) {
      checkSystemPreference()
    }
    saveSettings()
  })

  document.getElementById("themeSelect").addEventListener("change", (e) => {
    settings.theme = e.target.value
    applyTheme()
    saveSettings()
  })

  // Position the menu
  const toggleButton = document.querySelector(".charcoal-toggle")
  const toggleRect = toggleButton.getBoundingClientRect()

  menu.style.top = `${toggleRect.bottom + window.scrollY + 10}px`
  menu.style.left = `${toggleRect.left + window.scrollX}px`

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggleButton.contains(e.target)) {
      menu.remove()
    }
  })
}

// Initialize the extension
function init() {
  loadSettings()
  createToggleButton()

  // Re-inject toggle button when navigation happens (SPA)
  const observer = new MutationObserver((mutations) => {
    if (!document.querySelector(".charcoal-toggle")) {
      createToggleButton()
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

// Start the extension
init()

