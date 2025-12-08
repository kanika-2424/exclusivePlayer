function SettingsPage() {
  function handleSettingsClick(e) {
    if (localStorage.getItem("currentPage") !== "settingsPage") return;

    if (e.target.classList.contains("stream-card")) {
      localStorage.setItem("currentPage", "streamFormat");
      Router.showPage("streamModal");
      return;
    }
    if (e.target.classList.contains("time-format-card")) {
      localStorage.setItem("currentPage", "timeModal");
      Router.showPage("timeModal");
      return;
    }
    if (e.target.classList.contains("parental-control-card")) {
      localStorage.setItem("currentPage", "parentalModal");
      Router.showPage("parentalModal");
      return;
    }
    if (e.target.classList.contains("clear-cache-card")) {
      localStorage.setItem("currentPage", "nocachePage");
      Router.showPage("cacheModal");
      return;
    }

    if (e.target.classList.contains("general-settings-card")) {
      localStorage.setItem("currentPage", "generalSettingsPage");
      Router.showPage("generalSettingsPage");
      return;
    }
  }

  setTimeout(() => {
    const settingsFocusableItems = [
      document.querySelector(".stream-card"),
      document.querySelector(".time-format-card"),
      document.querySelector(".parental-control-card"),
      document.querySelector(".clear-cache-card"),
      document.querySelector(".general-settings-card"),
    ].filter((el) => el !== null);

    let settingsFocusIndex = 0;

    function settingsUpdateFocus() {
      settingsFocusableItems.forEach((el) => {
        el.classList.remove("setting-card-focused");

        const normalIcon = el.querySelector(".setting-card-icon");
        const filledIcon = el.querySelector(".setting-card-icon-filled");
        if (normalIcon) normalIcon.style.display = "block";
        if (filledIcon) filledIcon.style.display = "none";

        // Reset general settings icon background color for all cards
        const generalSettingsIcon = el.querySelector(
          ".general-setting-card-icon"
        );
        if (generalSettingsIcon) {
          generalSettingsIcon.style.backgroundColor = "transparent";
        }
      });

      if (settingsFocusableItems[settingsFocusIndex]) {
        const focusedEl = settingsFocusableItems[settingsFocusIndex];
        focusedEl.classList.add("setting-card-focused");

        const normalIcon = focusedEl.querySelector(".setting-card-icon");
        const filledIcon = focusedEl.querySelector(".setting-card-icon-filled");
        if (normalIcon) normalIcon.style.display = "none";
        if (filledIcon) filledIcon.style.display = "block";

        // Set background color for general settings card when focused
        if (focusedEl.classList.contains("general-settings-card")) {
          const generalSettingsIcon = focusedEl.querySelector(
            ".general-setting-card-icon"
          );
          if (generalSettingsIcon) {
            generalSettingsIcon.style.backgroundColor = "#E7A101";
          }
        }
      }
    }

    function settingsKeydownHandler(e) {
      if (localStorage.getItem("currentPage") !== "settingsPage") return;

      if (e.key === "ArrowRight") {
        if (settingsFocusIndex == settingsFocusableItems.length - 1) {
          // const settingsIcon=document.querySelector(".general-setting-card-icon");
          // if(settingsIcon){
          //   settingsIcon.style.backgroundColor="#E7A101";
          // }
          return;
        } else {
          settingsFocusIndex++;

          if (settingsFocusIndex >= settingsFocusableItems.length) {
            settingsFocusIndex = 0;
          }
          settingsUpdateFocus();
          e.preventDefault();
        }
      }

      if (e.key === "ArrowLeft") {
        if (settingsFocusIndex == 0) {
          return;
        } else {
          settingsFocusIndex--;
          if (settingsFocusIndex < 0) {
            settingsFocusIndex = settingsFocusableItems.length - 1;
          }
          settingsUpdateFocus();
          e.preventDefault();
        }
      }

      if (e.key === "Enter") {
        if (settingsFocusableItems[settingsFocusIndex]) {
          // Remove focus temporarily to prevent multiple triggers
          settingsFocusableItems[settingsFocusIndex].click();
        }
      }

      if (
        e.keyCode === 10009 ||
        e.key === "Escape" ||
        e.key === "Back" ||
        e.key === "BrowserBack" ||
        e.key === "XF86Back"
      ) {
        localStorage.setItem("currentPage", "dashboard");
        Router.showPage("dashboard");
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "black";
      }
    }

    // Remove previous listeners first
    if (SettingsPage.cleanup) SettingsPage.cleanup();

    document.addEventListener("click", handleSettingsClick);
    document.addEventListener("keydown", settingsKeydownHandler);

    SettingsPage.cleanup = function () {
      document.removeEventListener("click", handleSettingsClick);
      document.removeEventListener("keydown", settingsKeydownHandler);
    };

    settingsUpdateFocus();
  }, 0);



  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });


return `
    <div class="settings-container">
      <div class="playlistpage-header">
        <img src="/assets/logo.png" class="playlistpage-logo" />
        <div class="playlistpage-title">Settings</div>

        <div class="playlistpage-add-btn playlist-add-user">
            <div class="add-icon">
                <img src="/assets/add.png" />
            </div>
        </div>
    </div>
        
        <div class="settings-content-wrapper">
            <div class="settings-left-panel">
                
                <div class="setting-card stream-card">
                    <div class="setting-card-content">
                        <div class="setting-card-icon-wrapper">
                <img src="/assets/stream.png" />
                        </div>
                        <div class="setting-card-label">
                            <div>Stream Format</div>
                        </div>
                    </div>
                </div>

                <div class="setting-card time-format-card">
                    <div class="setting-card-content">
                        <div class="setting-card-icon-wrapper">
                <img src="/assets/time.png" />
                           
                        </div>
                        <div class="setting-card-label">
                            <div>Time Format</div>
                        </div>
                    </div>
                </div>

                <div class="setting-card setting-card-focused parental-control-card">
                    <div class="setting-card-content">
                        <div class="setting-card-icon-wrapper">
                <img src="/assets/parent.png" />
                           
                        </div>
                        <div class="setting-card-label">
                            <div>Parental Control</div>
                        </div>
                    </div>
                </div>

                <div class="setting-card general-settings-card">
                    <div class="setting-card-content">
                        <div class="setting-card-icon-wrapper">
                <img src="/assets/clean.png" />
                           
                        </div>
                        <div class="setting-card-label">
                            <div>Clear App Cache</div>
                        </div>
                    </div>
                </div>

            </div>
            
            <div class="settings-right-panel">
                <div class="settings-options-container" id="settingsOptions">
                    <div class="option-item">
                        <div class="radio-icon">
                         
                        </div>
                        <span>Default</span>
                    </div>
                    
                    <div class="option-item option-selected">
                        <div class="radio-icon">
                         
                        </div>
                        <span>MPEG-TS(.TS)</span>
                    </div>
                    
                    <div class="option-item">
                        <div class="radio-icon">
                       
                        </div>
                        <span>HLS(.m3u8)</span>
                    </div>
                    
                    <button class="settings-save-btn">Save</button>
                </div>
            </div>
        </div>
    </div>
`;
}
