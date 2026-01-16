
function SettingsPage() {
  function handleSettingsClick(e) {
    if (localStorage.getItem("currentPage") !== "settingsPage") return;

    // These clicks are just for focusing the cards, not navigating away
    // The Enter key handler will manage the actual interaction
    if (e.target.closest(".stream-card") || 
        e.target.closest(".time-format-card") || 
        e.target.closest(".parental-control-card") ||
        e.target.closest(".clear-cache-card") ||
        e.target.closest(".general-settings-card")) {
      // Just let the click through, don't change pages
      return;
    }
  }

  setTimeout(() => {
    let rightPanelFocusIndex = 0;
    let isRightPanelActive = false;
  window.isOnClearButton = false; // NEW: Track if we're on Clear button

     let isModalOpen = false;
    let modalFocusIndex = 0; // 0 = input, 1 = confirm, 2 = cancel
    const MODAL_ITEMS_COUNT = 3;


    let rightPanelItems = [];

    function updateRightPanelItems() {
      const activeContainer = document.querySelector('.settings-options-container[style*="display: flex"]') ||
                             document.querySelector('.settings-options-container:not([style*="display: none"])');
      
      if (activeContainer) {
   if (activeContainer.id === 'parentalSettingsOptions') {
  const inputs = Array.from(activeContainer.querySelectorAll('.parental-input'));
  const saveBtn = activeContainer.querySelector('.settings-save-btn.parental-save-btn');
  const clearBtn = activeContainer.querySelector('.clear-parental-btn');
  
  // NEW: Only inputs and save button in vertical navigation
  // Clear button will be accessed horizontally from Save button
  rightPanelItems = [...inputs, saveBtn].filter(el => el !== null);
}else {
          rightPanelItems = [
            ...activeContainer.querySelectorAll('.option-item'),
            activeContainer.querySelector('.settings-save-btn')
          ].filter(el => el !== null);
        }
      }
    }

    function updateRightPanelFocus() {
      if (rightPanelItems.length === 0) {
        updateRightPanelItems();
      }
      
      rightPanelItems.forEach((el) => {
        if (el) {
          el.classList.remove('setting-btn-focused');
          el.classList.remove('option-focused');
          el.classList.remove('parental-input-focused');
          el.classList.remove('eye-focused');
          el.classList.remove('clear-focused');
        }
      });

      if (rightPanelItems[rightPanelFocusIndex]) {
        const focusedEl = rightPanelItems[rightPanelFocusIndex];
        
     if (focusedEl.classList.contains('clear-parental-btn')) {
  focusedEl.classList.add('clear-focused');
} else if (focusedEl.classList.contains('settings-save-btn')) {
  focusedEl.classList.add('setting-btn-focused');
} else if (focusedEl.classList.contains('parental-input')) {
  focusedEl.classList.add('parental-input-focused');
} else if (focusedEl.classList.contains('eye-icon')) {
  focusedEl.classList.add('eye-focused');
} else {
  focusedEl.classList.add('option-focused');
}
      }
    }

    function updateModalFocus() {
  const verifyInput = document.getElementById('verifyPasswordInput');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  
  // Remove all focus classes
  if (verifyInput) verifyInput.classList.remove('modal-input-focused');
  if (confirmBtn) confirmBtn.classList.remove('modal-btn-focused');
  if (cancelBtn) cancelBtn.classList.remove('modal-btn-focused');
  
  // Apply focus based on index
  if (modalFocusIndex === 0 && verifyInput) {
    verifyInput.classList.add('modal-input-focused');
    verifyInput.focus();
  } else if (modalFocusIndex === 1 && confirmBtn) {
    confirmBtn.classList.add('modal-btn-focused');
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      document.activeElement.blur();
    }
  } else if (modalFocusIndex === 2 && cancelBtn) {
    cancelBtn.classList.add('modal-btn-focused');
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      document.activeElement.blur();
    }
  }
}

    function handleRightPanelClick(e) {
      const target = e.target.closest('.option-item');
      
      if (e.target.classList.contains('eye-icon')) {
        const input = e.target.previousElementSibling;
        if (input && input.classList.contains('parental-input')) {
          togglePasswordVisibility(input, e.target);
        }
        return;
      }
if (e.target.id === 'clearParentalBtn' || 
    e.target.classList.contains('clear-parental-btn') ||
    (e.target.closest && e.target.closest('.clear-parental-btn'))) {
  
  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
  
  if (!selectedPlaylist.playlistName) {
    Toaster.showToast("error", "No playlist selected");
    return;
  }

  // Get input values
  const input1 = document.getElementById('parentalPassword1');
  const input2 = document.getElementById('parentalPassword2');
  const hasInputValues = (input1 && input1.value.trim()) || (input2 && input2.value.trim());
  
  // If there are unsaved input values, just clear the inputs without modal
  if (hasInputValues && !selectedPlaylist.parentalPassword) {
    if (input1) input1.value = "";
    if (input2) input2.value = "";
    
    Toaster.showToast("success", "Input fields cleared");
    return;
  }

  // If no saved password exists
  if (!selectedPlaylist.parentalPassword || selectedPlaylist.parentalPassword === "") {
    Toaster.showToast("error", "No saved password to clear");
    return;
  }

// Show modal to verify password before clearing
const modal = document.getElementById('passwordModal');
const verifyInput = document.getElementById('verifyPasswordInput');

if (modal && verifyInput) {
  modal.style.display = 'flex';
  verifyInput.value = '';
  isModalOpen = true;
  modalFocusIndex = 0; // Start at input
  
  // Focus on verify input after a short delay
  setTimeout(() => {
    updateModalFocus();
  }, 100);
}
  
  return;
}
      
      if (target && target.classList.contains('option-item')) {
        const parentContainer = target.closest('.settings-options-container');
        
        parentContainer.querySelectorAll('.option-item').forEach(opt => {
          opt.classList.remove('option-selected');
        });
        
        target.classList.add('option-selected');
        
        const selectedText = target.querySelector('span').textContent;
        
        if (parentContainer.id === 'streamSettingsOptions') {
          const selectedFormat = selectedText.includes('MPEG-TS') ? 'ts' : 
                                selectedText.includes('HLS') ? 'm3u8' : 'm3u8';
          localStorage.setItem('selectedStreamOption', selectedText.toLowerCase());
          localStorage.setItem('selectedStreamFormat', selectedFormat);
        }
        
        if (parentContainer.id === 'timeSettingsOptions') {
          const selectedFormat = selectedText.includes('24') ? '24hrs' : '12hrs';
          localStorage.setItem('selectedTimeFormat', selectedFormat);
        }
      }
      
      if (e.target.classList.contains('settings-save-btn')) {
        const parentContainer = e.target.closest('.settings-options-container');
        
     if (parentContainer.id === 'parentalSettingsOptions') {
  const input1 = document.getElementById('parentalPassword1');
  const input2 = document.getElementById('parentalPassword2');
  
  const pass1 = input1.value.trim() || "";
  const pass2 = input2.value.trim() || "";

  if (!pass1 || !pass2) {
    Toaster.showToast("error", "Please fill both password fields!");
    return;
  }

  if (pass1 !== pass2) {
    Toaster.showToast("error", "Passwords do not match!");
    return;
  }

  if (pass1.length === 0) {
    Toaster.showToast("error", "Password cannot be empty!");
    return;
  }

  const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
  
  if (!selectedPlaylist.playlistName) {
    Toaster.showToast("error", "No playlist selected!");
    return;
  }

  try {
    selectedPlaylist.parentalPassword = pass1;
    localStorage.setItem('selectedPlaylist', JSON.stringify(selectedPlaylist));
    
    const playlists = JSON.parse(localStorage.getItem('playlistsData')) || [];
    const playlistIndex = playlists.findIndex(p => p.playlistName === selectedPlaylist.playlistName);

    if (playlistIndex !== -1) {
      playlists[playlistIndex].parentalPassword = pass1;
      localStorage.setItem('playlistsData', JSON.stringify(playlists));
    }

    // Hide passwords after saving
    if (input1) input1.type = "password";
    if (input2) input2.type = "password";

    Toaster.showToast("success", "Parental Password Saved");
  } catch (error) {
    console.error('Error saving password:', error);
    Toaster.showToast("error", "Failed to save password");
  }
  return;
}
        
        const selectedOption = parentContainer.querySelector('.option-item.option-selected');
        
        if (!selectedOption) {
          Toaster.showToast("error", "Please select an option");
          return;
        }
        
        const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
        
        if (!selectedPlaylist.playlistName) {
          Toaster.showToast("error", "No playlist selected");
          return;
        }
        
        try {
          if (parentContainer.id === 'streamSettingsOptions') {
            const selectedText = selectedOption.querySelector('span').textContent;
            const selectedFormat = selectedText.includes('MPEG-TS') ? 'ts' : 
                                  selectedText.includes('HLS') ? 'm3u8' : 'm3u8';
            
            selectedPlaylist.streamFormat = selectedFormat;
            selectedPlaylist.streamOptionType = selectedText.toLowerCase();
            localStorage.setItem('selectedPlaylist', JSON.stringify(selectedPlaylist));
            
            const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
            const playlistIndex = playlists.findIndex(p => p.playlistName === selectedPlaylist.playlistName);
            
            if (playlistIndex !== -1) {
              playlists[playlistIndex].streamFormat = selectedFormat;
              playlists[playlistIndex].streamOptionType = selectedText.toLowerCase();
              localStorage.setItem('playlists', JSON.stringify(playlists));
            }
            
            Toaster.showToast("success", "Stream Format changed to " + selectedText);
          }
          
          if (parentContainer.id === 'timeSettingsOptions') {
            const selectedText = selectedOption.querySelector('span').textContent;
            const selectedFormat = selectedText.includes('24') ? '24hrs' : '12hrs';
            
            selectedPlaylist.timeFormat = selectedFormat;
            localStorage.setItem('selectedPlaylist', JSON.stringify(selectedPlaylist));
            
            const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
            const playlistIndex = playlists.findIndex(p => p.playlistName === selectedPlaylist.playlistName);
            
            if (playlistIndex !== -1) {
              playlists[playlistIndex].timeFormat = selectedFormat;
              localStorage.setItem('playlists', JSON.stringify(playlists));
            }
            
            Toaster.showToast("success", `Time Format changed to ${selectedFormat}`);
          }
          
        } catch (error) {
          console.error('Error saving settings:', error);
          Toaster.showToast("error", "Failed to update settings");
        }
      }
    }

    const settingsFocusableItems = [
        document.querySelector(".playlist-add-user"),
      document.querySelector(".stream-card"),
      document.querySelector(".time-format-card"),
      document.querySelector(".parental-control-card"),
      document.querySelector(".clear-cache-card"),
      document.querySelector(".general-settings-card"),
    ].filter((el) => el !== null);

    let settingsFocusIndex = 1;

   function settingsUpdateFocus() {
  settingsFocusableItems.forEach((el) => {
    // Handle Add User button
    if (el.classList.contains('playlist-add-user')) {
      el.classList.remove('playlist-card-focused');
      return;
    }
    
    // Remove background focus when in right panel
    if (isRightPanelActive) {
      el.classList.remove("setting-card-focused");
      el.classList.add("setting-card-border-focused");
    } else {
      el.classList.remove("setting-card-focused");
      el.classList.remove("setting-card-border-focused");
    }

    const normalIcon = el.querySelector(".setting-card-icon");
    const filledIcon = el.querySelector(".setting-card-icon-filled");
    if (normalIcon) normalIcon.style.display = "block";
    if (filledIcon) filledIcon.style.display = "none";

    const generalSettingsIcon = el.querySelector(".general-setting-card-icon");
    if (generalSettingsIcon) {
      generalSettingsIcon.style.backgroundColor = "transparent";
    }
  });

  if (settingsFocusableItems[settingsFocusIndex]) {
    const focusedEl = settingsFocusableItems[settingsFocusIndex];
    
    // Add focus to Add User button
    if (focusedEl.classList.contains('playlist-add-user')) {
      focusedEl.classList.add('playlist-card-focused');
      
      // Show stream options on right panel when Add User button is focused
      const streamOptions = document.getElementById('streamSettingsOptions');
      const timeOptions = document.getElementById('timeSettingsOptions');
      const parentalOptions = document.getElementById('parentalSettingsOptions');
      
      if (streamOptions) streamOptions.style.display = 'flex';
      if (timeOptions) timeOptions.style.display = 'none';
      if (parentalOptions) parentalOptions.style.display = 'none';
      
      return;
    }
    
    // Apply appropriate focus style based on panel
    if (isRightPanelActive) {
      focusedEl.classList.add("setting-card-border-focused");
    } else {
      focusedEl.classList.add("setting-card-focused");
    }

    const normalIcon = focusedEl.querySelector(".setting-card-icon");
    const filledIcon = focusedEl.querySelector(".setting-card-icon-filled");
    if (normalIcon) normalIcon.style.display = "none";
    if (filledIcon) filledIcon.style.display = "block";

    if (focusedEl.classList.contains("general-settings-card")) {
      const generalSettingsIcon = focusedEl.querySelector(".general-setting-card-icon");
      if (generalSettingsIcon) {
        generalSettingsIcon.style.backgroundColor = "#E7A101";
      }
    }

    // Show/hide appropriate options in right panel
    const streamOptions = document.getElementById('streamSettingsOptions');
    const timeOptions = document.getElementById('timeSettingsOptions');
    const parentalOptions = document.getElementById('parentalSettingsOptions');
    
    if (streamOptions) streamOptions.style.display = 'none';
    if (timeOptions) timeOptions.style.display = 'none';
    if (parentalOptions) parentalOptions.style.display = 'none';
    
    if (focusedEl.classList.contains('stream-card') && streamOptions) {
      streamOptions.style.display = 'flex';
    } else if (focusedEl.classList.contains('time-format-card') && timeOptions) {
      timeOptions.style.display = 'flex';
    } else if (focusedEl.classList.contains('parental-control-card') && parentalOptions) {
      parentalOptions.style.display = 'flex';
    }
  }
}

    function settingsKeydownHandler(e) {
      if (localStorage.getItem("currentPage") !== "settingsPage") return;


       e.stopPropagation();



       if (isModalOpen) {
    console.log("Modal is open, handling modal navigation");
    
    if (e.key === "ArrowDown") {
      if (modalFocusIndex === 0) {
        // From input to Confirm button
        modalFocusIndex = 1;
        updateModalFocus();
      }
      e.preventDefault();
      return;
    }
    
    if (e.key === "ArrowUp") {
      if (modalFocusIndex === 1 || modalFocusIndex === 2) {
        // From buttons back to input
        modalFocusIndex = 0;
        updateModalFocus();
      }
      e.preventDefault();
      return;
    }
    
    if (e.key === "ArrowRight") {
      if (modalFocusIndex === 1) {
        // From Confirm to Cancel
        modalFocusIndex = 2;
        updateModalFocus();
      }
      e.preventDefault();
      return;
    }
    
    if (e.key === "ArrowLeft") {
      if (modalFocusIndex === 2) {
        // From Cancel to Confirm
        modalFocusIndex = 1;
        updateModalFocus();
      }
      e.preventDefault();
      return;
    }
    
    if (e.key === "Enter") {
      if (modalFocusIndex === 0) {
        // On input, move to Confirm button
        modalFocusIndex = 1;
        updateModalFocus();
      } else if (modalFocusIndex === 1) {
        // Click Confirm button
        const confirmBtn = document.getElementById('modalConfirmBtn');
        if (confirmBtn) confirmBtn.click();
      } else if (modalFocusIndex === 2) {
        // Click Cancel button
        const cancelBtn = document.getElementById('modalCancelBtn');
        if (cancelBtn) cancelBtn.click();
      }
      e.preventDefault();
      return;
    }
    
    if (e.keyCode === 10009 || e.key === "Escape" || e.key === "Back" || 
        e.key === "BrowserBack" || e.key === "XF86Back") {
      // Close modal on back button
      const modal = document.getElementById('passwordModal');
      const verifyInput = document.getElementById('verifyPasswordInput');
      if (modal) modal.style.display = 'none';
      if (verifyInput) verifyInput.value = '';
      isModalOpen = false;
      modalFocusIndex = 0;
      e.preventDefault();
      return;
    }
    
    // Allow typing in input field
    if (modalFocusIndex === 0) {
      // Let input events pass through
      return;
    }
    
    // Block all other keys when modal is open
    e.preventDefault();
    return;
  }

      // ArrowRight - Move to right panel
   // ArrowRight - Move to right panel
if (e.key === "ArrowRight" && !isRightPanelActive) {
  console.log("ArrowRight: Moving from left to right panel");
  const focusedCard = settingsFocusableItems[settingsFocusIndex];
  if (focusedCard.classList.contains('stream-card') || 
      focusedCard.classList.contains('time-format-card') ||
      focusedCard.classList.contains('parental-control-card')) {
    isRightPanelActive = true;
    rightPanelFocusIndex = 0; // NEW: Always start at first item (first input for parental control)
    
    updateRightPanelItems();
    settingsUpdateFocus(); // Update left panel to border focus
    updateRightPanelFocus();
    
    // NEW: Auto-focus first input if it's parental control
    if (focusedCard.classList.contains('parental-control-card')) {
      setTimeout(() => {
        const firstInput = document.getElementById('parentalPassword1');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
    
    e.preventDefault();
    return;
  }
}

    

      // Handle navigation in right panel
    // Handle navigation in right panel
if (isRightPanelActive) {

    console.log("Right panel is active, key:", e.key);
  e.stopPropagation(); // NEW: Stop propagation when in right panel
  


  if (e.key === "ArrowDown") {
    // Before changing rightPanelFocusIndex
    if (document.activeElement && document.activeElement.tagName === "INPUT") {
      document.activeElement.blur();
    }

    rightPanelFocusIndex++;
    if (rightPanelFocusIndex >= rightPanelItems.length) {
      rightPanelFocusIndex = rightPanelItems.length - 1;
    }
    updateRightPanelFocus();
    e.preventDefault();
    return;
  }

if (e.key === "ArrowUp") {
  console.log("ArrowUp in right panel, isOnClearButton:", window.isOnClearButton);
  
  // NEW: If on Clear button, move back to 2nd input
  if (window.isOnClearButton) {
    const parentContainer = document.getElementById('parentalSettingsOptions');
    const clearBtn = parentContainer.querySelector('.clear-parental-btn');
    
    console.log("Moving from Clear to 2nd input via ArrowUp");
    
    if (clearBtn) {
      // Remove focus from Clear button
      clearBtn.classList.remove('clear-focused');
      
      // Clear the flag FIRST
      window.isOnClearButton = false;
      
      // Find the 2nd input (last input) in rightPanelItems
      const inputs = rightPanelItems.filter(item => 
        item && item.classList.contains('parental-input')
      );
      
      if (inputs.length > 0) {
        // Get the last input (2nd input)
        const lastInput = inputs[inputs.length - 1];
        rightPanelFocusIndex = rightPanelItems.indexOf(lastInput);
      } else {
        // Fallback to last item if no inputs found
        rightPanelFocusIndex = rightPanelItems.length - 1;
      }
      
      // Update focus to show 2nd input as focused
      updateRightPanelFocus();
    }
    
    e.preventDefault();
    return;
  }
  
  // Original ArrowUp logic for normal navigation
  // Before changing rightPanelFocusIndex
  if (document.activeElement && document.activeElement.tagName === "INPUT") {
    document.activeElement.blur();
  }

  rightPanelFocusIndex--;
  if (rightPanelFocusIndex < 0) {
    rightPanelFocusIndex = 0;
  }
  updateRightPanelFocus();
  e.preventDefault();
  return;
}
  // NEW: ArrowRight - Navigate from Save to Clear button (horizontal navigation)
// ArrowRight - Navigate from Save to Clear button (horizontal navigation)
if (e.key === "ArrowRight") {
  console.log("ArrowRight pressed in right panel");
  console.log("Current focus index:", rightPanelFocusIndex);
  console.log("Right panel items:", rightPanelItems);
  
  const focusedEl = rightPanelItems[rightPanelFocusIndex];
  console.log("Focused element:", focusedEl);
  
  // Only allow right navigation if on Save Password button
  if (focusedEl && (focusedEl.classList.contains('parental-save-btn') || focusedEl.classList.contains('settings-save-btn'))) {
    console.log("On Save button, looking for Clear button");
    
    const parentContainer = document.getElementById('parentalSettingsOptions');
    
    if (parentContainer && parentContainer.style.display !== 'none') {
      const clearBtn = parentContainer.querySelector('.clear-parental-btn');
      console.log("Clear button found:", clearBtn);
      
      if (clearBtn) {
        // Remove focus from Save button
        focusedEl.classList.remove('setting-btn-focused');
        
        // Add focus to Clear button
        clearBtn.classList.add('clear-focused');
        
        // Store that we're on Clear button
        window.isOnClearButton = true;
        
        console.log("Moved to Clear button");
      }
      
      e.preventDefault();
      return;
    }
  }
  
  e.preventDefault();
  return;
}

  // NEW: ArrowLeft handler - Navigate from Clear back to Save, or back to left panel
// ArrowLeft handler - Navigate from Clear back to Save, or back to left panel
if (e.key === "ArrowLeft") {
  console.log("ArrowLeft pressed, isOnClearButton:", window.isOnClearButton);
  
  // Check if we're on the Clear button
  if (window.isOnClearButton) {
    const parentContainer = document.getElementById('parentalSettingsOptions');
    const clearBtn = parentContainer.querySelector('.clear-parental-btn');
    
    console.log("Moving from Clear to Save via ArrowLeft");
    
    if (clearBtn) {
      // Remove focus from Clear button
      clearBtn.classList.remove('clear-focused');
      
      // Clear the flag FIRST
      window.isOnClearButton = false;
      
      // Find the Save button index in rightPanelItems
      rightPanelFocusIndex = rightPanelItems.findIndex(item => 
        item && (item.classList.contains('parental-save-btn') || item.classList.contains('settings-save-btn'))
      );
      
      // If not found, default to last item
      if (rightPanelFocusIndex === -1) {
        rightPanelFocusIndex = rightPanelItems.length - 1;
      }
      
      // Update focus to show Save button as focused
      updateRightPanelFocus();
    }
    
    e.preventDefault();
    return;
  }
  
  // If not on Clear button, move back to left panel
  isRightPanelActive = false;
  window.isOnClearButton = false; // Reset flag
  
  // Remove all focus from right panel
  rightPanelItems.forEach((el) => {
    if (el) {
      el.classList.remove('setting-btn-focused');
      el.classList.remove('option-focused');
      el.classList.remove('parental-input-focused');
      el.classList.remove('eye-focused');
      el.classList.remove('clear-focused');
    }
  });
  
  // Also remove focus from Clear button if it exists
  const clearBtn = document.querySelector('.clear-parental-btn');
  if (clearBtn) {
    clearBtn.classList.remove('clear-focused');
  }
  
  settingsUpdateFocus(); // Update left panel to background focus
  e.preventDefault();
  return;
}

 if (e.key === "Enter") {
  console.log("Enter pressed, isOnClearButton:", window.isOnClearButton);
  
  // Check if we're on Clear button
  if (window.isOnClearButton) {
    const parentContainer = document.getElementById('parentalSettingsOptions');
    const clearBtn = parentContainer.querySelector('.clear-parental-btn');
    
    console.log("Clicking Clear button");
    
    if (clearBtn) {
      clearBtn.click();
    }
    
    e.preventDefault();
    return;
  }
  
  const focusedEl = rightPanelItems[rightPanelFocusIndex];
  
  if (focusedEl) {
    if (focusedEl.classList.contains('clear-parental-btn')) {
      focusedEl.click();
    }
    else if (focusedEl.classList.contains('eye-icon')) {
      focusedEl.click();
    }
    else if (focusedEl.classList.contains('parental-input')) {
      const input = focusedEl;

      // 🔥 Critical for Tizen: force previous input to release IME
      document.activeElement && document.activeElement.blur();

      setTimeout(() => {
        input.focus();

        // Move cursor to end (IME-safe)
        try {
          const len = input.value.length;
          input.setSelectionRange(len, len);
        } catch (e) {}

      }, 200); // 200ms is safer for older TVs
    }
    else {
      focusedEl.click();
    }
  }
  e.preventDefault();
  return;
}
}

      if (e.key === "ArrowDown") {
        if (settingsFocusIndex == settingsFocusableItems.length - 1) {
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

      if (e.key === "ArrowUp") {
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
    const focusedEl = settingsFocusableItems[settingsFocusIndex];
    
    // If Add User button is focused, check playlists and navigate
    if (focusedEl.classList.contains('playlist-add-user')) {
      const playlistsData = JSON.parse(localStorage.getItem("playlistsData")) || [];
      
      if (playlistsData.length > 0) {
        // If playlists exist, go to playlist page
        localStorage.setItem("currentPage", "login");
        if (SettingsPage.cleanup) SettingsPage.cleanup();
        Router.showPage("login");
      } else {
        // If no playlists, go to login page
        localStorage.removeItem("currentPage");
        if (SettingsPage.cleanup) SettingsPage.cleanup();
        Router.showPage("login");
      }
      e.preventDefault();
      return;
    }
    
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



  const addPlaylistBtn = document.querySelector(".playlist-add-user");
if (addPlaylistBtn) {
  addPlaylistBtn.onclick = () => {
    const playlistsData = JSON.parse(localStorage.getItem("playlistsData")) || [];
    
    if (playlistsData.length > 0) {
      // If playlists exist, go to playlist page
      localStorage.setItem("currentPage", "login");
      if (SettingsPage.cleanup) SettingsPage.cleanup();
      Router.showPage("login");
    } else {
      // If no playlists, go to login page
      localStorage.removeItem("currentPage");
      if (SettingsPage.cleanup) SettingsPage.cleanup();
      Router.showPage("login");
    }
  };
}

   function togglePasswordVisibility(input, eyeIcon) {
  if (input.type === "password") {
    input.type = "text";
    eyeIcon.classList.remove("fa-eye");
    eyeIcon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    eyeIcon.classList.remove("fa-eye-slash");
    eyeIcon.classList.add("fa-eye");
  }
}




// Populate parental password fields on page load
const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
if (selectedPlaylist.parentalPassword) {
  setTimeout(() => {
    const input1 = document.getElementById('parentalPassword1');
    const input2 = document.getElementById('parentalPassword2');
    
    if (input1 && input2) {
      input1.value = selectedPlaylist.parentalPassword;
      input2.value = selectedPlaylist.parentalPassword;
      // Show as password type since it's saved
      input1.type = "password";
      input2.type = "password";
    }
  }, 100);
}


    // Initialize saved stream format selection
 
    const savedStreamFormat = selectedPlaylist.streamFormat;
    const savedOptionType = selectedPlaylist.streamOptionType || localStorage.getItem("selectedStreamOption");
    const savedTimeFormat = selectedPlaylist.timeFormat || localStorage.getItem("selectedTimeFormat") || "12hrs";

    // Remove all selections first
    document.querySelectorAll(".option-item").forEach((opt) => {
      opt.classList.remove("option-selected");
    });

    // Initialize Stream Format Selection
    let matchingStreamOption = null;

    document.querySelectorAll("#streamSettingsOptions .option-item").forEach((option) => {
      const label = option.querySelector("span").textContent.toLowerCase();

      if (savedOptionType && label.includes(savedOptionType)) {
        matchingStreamOption = option;
      } else if (savedStreamFormat === "ts" && label.includes("mpeg-ts")) {
        matchingStreamOption = option;
      } else if (savedStreamFormat === "m3u8" && label.includes("hls")) {
        matchingStreamOption = option;
      }
    });

    if (!matchingStreamOption) {
      matchingStreamOption = document.querySelector("#streamSettingsOptions .option-item");
    }

    if (matchingStreamOption) {
      matchingStreamOption.classList.add("option-selected");
      const selectedText = matchingStreamOption.querySelector("span").textContent.toLowerCase();
      const selectedFormat = selectedText.includes("mpeg-ts") ? "ts" : selectedText.includes("hls") ? "m3u8" : "m3u8";
      localStorage.setItem("selectedStreamOption", selectedText);
      localStorage.setItem("selectedStreamFormat", selectedFormat);
    }

    // Initialize Time Format Selection
    let matchingTimeOption = null;

    document.querySelectorAll("#timeSettingsOptions .option-item").forEach((option) => {
      const label = option.querySelector("span").textContent.toLowerCase();

      if (savedTimeFormat === "24hrs" && label.includes("24")) {
        matchingTimeOption = option;
      } else if (savedTimeFormat === "12hrs" && label.includes("12")) {
        matchingTimeOption = option;
      }
    });

    if (!matchingTimeOption) {
      // Default to 12 hours format
      const timeOptions = document.querySelectorAll("#timeSettingsOptions .option-item");
      matchingTimeOption = Array.from(timeOptions).find(opt => 
        opt.querySelector("span").textContent.includes("12")
      );
    }

    if (matchingTimeOption) {
      matchingTimeOption.classList.add("option-selected");
      const selectedText = matchingTimeOption.querySelector("span").textContent;
      const selectedFormat = selectedText.includes("24") ? "24hrs" : "12hrs";
      localStorage.setItem("selectedTimeFormat", selectedFormat);
      
      // Save to playlist if exists
      if (selectedPlaylist.playlistName) {
        selectedPlaylist.timeFormat = selectedFormat;
        localStorage.setItem('selectedPlaylist', JSON.stringify(selectedPlaylist));
      }
    }

    // Remove previous listeners first
    if (SettingsPage.cleanup) SettingsPage.cleanup();
document.addEventListener("click", handleSettingsClick);
document.addEventListener("click", handleRightPanelClick);
document.addEventListener("keydown", settingsKeydownHandler);

// Modal event handlers
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modal = document.getElementById('passwordModal');
const verifyInput = document.getElementById('verifyPasswordInput');

if (modalConfirmBtn) {
  modalConfirmBtn.onclick = () => {
    const enteredPassword = verifyInput.value.trim();
    const selectedPlaylist = JSON.parse(localStorage.getItem("selectedPlaylist")) || {};
    
    if (!enteredPassword) {
      Toaster.showToast("error", "Please enter the password");
      modalFocusIndex = 0;
      updateModalFocus();
      return;
    }
    
    if (enteredPassword !== selectedPlaylist.parentalPassword) {
      Toaster.showToast("error", "Incorrect password");
      verifyInput.value = '';
      modalFocusIndex = 0;
      updateModalFocus();
      return;
    }
    
    // Password verified, clear it
    try {
      selectedPlaylist.parentalPassword = "";
      localStorage.setItem('selectedPlaylist', JSON.stringify(selectedPlaylist));
      
      const playlists = JSON.parse(localStorage.getItem('playlistsData')) || [];
      const playlistIndex = playlists.findIndex(p => p.playlistName === selectedPlaylist.playlistName);

      if (playlistIndex !== -1) {
        playlists[playlistIndex].parentalPassword = "";
        localStorage.setItem('playlistsData', JSON.stringify(playlists));
      }

      // Clear input fields
      const input1 = document.getElementById('parentalPassword1');
      const input2 = document.getElementById('parentalPassword2');
      if (input1) input1.value = "";
      if (input2) input2.value = "";
      
      // Close modal and reset state
      modal.style.display = 'none';
      verifyInput.value = '';
      isModalOpen = false;
      modalFocusIndex = 0;
      
      // Reset the flag
      window.isOnClearButton = false;
      
      // Return focus to Save button
      const saveBtn = document.querySelector('.parental-save-btn');
      if (saveBtn) {
        saveBtn.classList.add('setting-btn-focused');
      }

      Toaster.showToast("success", "Parental Password cleared");
    } catch (error) {
      console.error('Error clearing password:', error);
      Toaster.showToast("error", "Failed to clear password");
    }
  };
}

if (modalCancelBtn) {
  modalCancelBtn.onclick = () => {
    modal.style.display = 'none';
    verifyInput.value = '';
    isModalOpen = false;
    modalFocusIndex = 0;
  };
}

// Close modal on Escape key
// Close modal on Escape key (backup handler)
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Escape' || e.key === 'Back' || e.keyCode === 10009) && 
      modal && modal.style.display === 'flex') {
    modal.style.display = 'none';
    verifyInput.value = '';
    isModalOpen = false;
    modalFocusIndex = 0;
    e.preventDefault();
  }
});
  SettingsPage.cleanup = function () {
  document.removeEventListener("click", handleSettingsClick);
  document.removeEventListener("click", handleRightPanelClick);
  document.removeEventListener("keydown", settingsKeydownHandler);
};

    settingsUpdateFocus();
  }, 0);

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

            </div>
            
            <div class="settings-right-panel" id="settingsRightPanel">
                <!-- Stream Format Options -->
                <div class="settings-options-container stream-options" id="streamSettingsOptions" style="display: none;">
                    <div class="option-item">
                        <div class="radio-icon"></div>
                        <span>Default</span>
                    </div>
                    
                    <div class="option-item">
                        <div class="radio-icon"></div>
                        <span>MPEG-TS(.TS)</span>
                    </div>
                    
                    <div class="option-item">
                        <div class="radio-icon"></div>
                        <span>HLS(.m3u8)</span>
                    </div>
                    
                    <button class="settings-save-btn">Save</button>
                </div>

                <!-- Time Format Options -->
                <div class="settings-options-container time-options" id="timeSettingsOptions" style="display: none;">
                    <div class="option-item">
                        <div class="radio-icon"></div>
                        <span>24 Hours Format</span>
                    </div>
                    
                    <div class="option-item">
                        <div class="radio-icon"></div>
                        <span>12 Hours Format</span>
                    </div>
                    
                    <button class="settings-save-btn">Save</button>
                </div>

                <!-- Parental Control Options -->
                <div class="settings-options-container parental-options" id="parentalSettingsOptions" style="display: none;">
                   
                    
                   <div class="parental-input-group">
    <div class="password-input-wrapper">
        <input type="text" id="parentalPassword1" class="parental-input" placeholder="Enter Your Password" />
    </div>
</div>

<div class="parental-input-group">
    <div class="password-input-wrapper">
        <input type="text" id="parentalPassword2" class="parental-input" placeholder="Confirm Password" />
    </div>
</div>
                    
                       <div class="parental-buttons-container">
    <button class="settings-save-btn parental-save-btn">Save</button>
    <button class="settings-save-btn clear-parental-btn" id="clearParentalBtn">Clear</button>
</div>
                </div>
            </div>
       


              <div class="password-modal" id="passwordModal" style="display: none;">
            <div class="password-modal-content">
                <div class="password-modal-header">
                    <h3>Verify Password</h3>
                </div>
                <div class="password-modal-body">
                    <p>Please enter the saved password to clear it:</p>
                    <input type="password" id="verifyPasswordInput" class="parental-input" placeholder="Enter Password" />
                </div>
                <div class="password-modal-buttons">
                    <button class="modal-btn modal-confirm-btn" id="modalConfirmBtn">Confirm</button>
                    <button class="modal-btn modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                </div>
            </div>
        </div>
        </div>
    </div>
`;
}