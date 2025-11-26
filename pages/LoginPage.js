
// function LoginPage() {
//   // --- Define key blocking functions GLOBALLY (before setTimeout) ---
//   let keyBlockCallback = null;
  
//   window.enableKeyBlock = function(callback) {
//     keyBlockCallback = callback;
//     console.log("🔒 Key blocking enabled");
//   };
  
//   window.disableKeyBlock = function() {
//     keyBlockCallback = null;
//     console.log("🔓 Key blocking disabled");
//   };

//   setTimeout(() => {
//     console.log("Login Page Loaded");

//     // Collect DOM elements
//     const inputs = Array.from(document.querySelectorAll(".input-group input"));
//     const passwordToggle = document.querySelector(".toggle-password");
//     const addUserBtn = document.querySelector(".add-user-btn");
//     const listUsersBtn = document.querySelector(".list-users-btn");

//     // Order matters – this defines navigation flow
//     const focusable = [
//       inputs[0],      // Name
//       inputs[1],      // Username
//       inputs[2],      // Password
//       passwordToggle, // Eye toggle
//       addUserBtn,     // Add user
//       listUsersBtn,   // List users
//     ];

//     let focusIndex = 0;

//     // --- FOCUS HELPERS -------------------------------------------------------
//     function removeFocus(el) {
//       if (!el) return;
//       el.classList.remove("login-input-focused");
//       el.classList.remove("login-btn-focused");
//       el.classList.remove("login-icon-focused");
//       el.classList.remove("list-users-btn-focused");
//     }

//     function addFocus(el) {
//       if (!el) return;

//       if (el.tagName === "INPUT") {
//         el.classList.add("login-input-focused");
//       }
//       else if (el.classList.contains("list-users-btn")) {
//         el.classList.add("list-users-btn-focused");
//       }
//       else if (el.tagName === "BUTTON") {
//         el.classList.add("login-btn-focused");
//       } else if (el.classList.contains("toggle-password")) {
//         el.classList.add("login-icon-focused");
//       }
//     }

//     function isPasswordInput(el) {
//       return el === inputs[2];
//     }

//     function isToggle(el) {
//       return el === passwordToggle;
//     }

//     // Set initial visual focus
//     addFocus(focusable[0]);

//     // --- CLICK HANDLER -------------------------------------------------------
//     function handleClick(e) {
//       if (e.target.closest(".toggle-password")) {
//         togglePassword();
//       }

//       if (e.target.classList.contains("add-user-btn")) {
//         const name = inputs[0].value.trim();
//         const username = inputs[1].value.trim();
//         const password = inputs[2].value.trim();

//         // Validate inputs
//         if (!name || !username || !password) {
//           if (typeof Toaster !== 'undefined') {
//             Toaster.showToast("error", "Please complete all fields!");
//           } else {
//             alert("Please complete all fields!");
//           }
//           return;
//         }

//         console.log("Attempting login:", { name, username, password });

//         // Check if loginApi exists
//         if (typeof loginApi !== 'function') {
//           console.error("❌ loginApi function not found in global scope");
//           alert("Login system not initialized! Please check if API file is loaded.");
//           return;
//         }

//         // Call the login API
//         console.log("🚀 Calling loginApi...");
//         loginApi(username, password, name, false, "").then((response) => {
//           console.log("✅ Login API response:", response);
//           if (response) {
//             console.log("Login successful");
//             LoginPage.cleanup();
//           } else {
//             console.log("❌ Login failed - no response");
//           }
//         }).catch((error) => {
//           console.error("❌ Login API error:", error);
//           if (typeof Toaster !== 'undefined') {
//             Toaster.showToast("error", "Login failed: " + error.message);
//           } else {
//             alert("Login failed: " + error.message);
//           }
//         });
//       }

//       if (e.target.classList.contains("list-users-btn")) {
//         console.log("Open Playlists Page");
        
//         const playlistsData = JSON.parse(localStorage.getItem("playlistsData")) || [];

//         if (playlistsData.length === 0) {
//           if (typeof Toaster !== 'undefined') {
//             Toaster.showToast("error", "No Playlists Available! Please Add One.");
//           } else {
//             alert("No Playlists Available! Please Add One.");
//           }
//           return;
//         }

//         localStorage.setItem("currentPage", "playlistPage");
//         LoginPage.cleanup();
        
//         if (typeof Router !== 'undefined' && Router.showPage) {
//           Router.showPage("playlistPage");
//         } else if (typeof navigateTo === 'function') {
//           navigateTo("playlist-page");
//         } else {
//           console.error("Navigation function not found");
//         }
//       }
//     }

//     // --- REMOTE / KEYBOARD HANDLER ------------------------------------------
//     function handleKeydown(e) {
//       // Check if key blocking is active (during login)
//       if (keyBlockCallback) {
//         e.preventDefault();
//         e.stopPropagation();
//         // If Back button or specific key pressed, trigger callback
//         if (e.key === "Escape" || e.key === "Backspace" || e.keyCode === 10009) {
//           keyBlockCallback();
//         }
//         return;
//       }

//       const current = focusable[focusIndex];

//       // MOVE DOWN
//       if (e.key === "ArrowDown") {
//         e.preventDefault();
        
//         if (current === inputs[0]) {
//           removeFocus(current);
//           focusIndex = 1;
//           addFocus(inputs[1]);
//           inputs[1].focus();
//         }
//         else if (current === inputs[1]) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//         else if (current === inputs[2]) {
//           removeFocus(current);
//           current.blur();
//           focusIndex = focusable.indexOf(addUserBtn);
//           addFocus(addUserBtn);
//         }
//         else if (isToggle(current)) {
//           removeFocus(current);
//           inputs[2].blur();
//           focusIndex = focusable.indexOf(addUserBtn);
//           addFocus(addUserBtn);
//         }
//         else if (current === addUserBtn) {
//           removeFocus(current);
//           focusIndex = focusable.indexOf(listUsersBtn);
//           addFocus(listUsersBtn);
//         }
//       }

//       // MOVE UP
//       else if (e.key === "ArrowUp") {
//         e.preventDefault();
        
//         if (current === inputs[1]) {
//           removeFocus(current);
//           focusIndex = 0;
//           addFocus(inputs[0]);
//           inputs[0].focus();
//         }
//         else if (current === inputs[2]) {
//           removeFocus(current);
//           focusIndex = 1;
//           addFocus(inputs[1]);
//           inputs[1].focus();
//         }
//         else if (current === addUserBtn) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//         else if (current === listUsersBtn) {
//           removeFocus(current);
//           focusIndex = focusable.indexOf(addUserBtn);
//           addFocus(addUserBtn);
//         }
//       }

//       // MOVE LEFT
//       else if (e.key === "ArrowLeft") {
//         e.preventDefault();
        
//         if (isToggle(current)) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//         else {
//           if (current.tagName === "INPUT") {
//             current.blur();
//           }
//           removeFocus(current);
//           focusIndex = focusable.indexOf(listUsersBtn);
//           addFocus(listUsersBtn);
//         }
//       }

//       // MOVE RIGHT
//       else if (e.key === "ArrowRight") {
//         e.preventDefault();
        
//         if (current === listUsersBtn) {
//           removeFocus(current);
//           focusIndex = 0;
//           addFocus(inputs[0]);
//           inputs[0].focus();
//         }
//         else if (isPasswordInput(current)) {
//           removeFocus(current);
//           focusIndex = focusable.indexOf(passwordToggle);
//           addFocus(passwordToggle);
//         }
//         else if (isToggle(current)) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//       }

//       // ENTER to activate
//       else if (e.key === "Enter") {
//         e.preventDefault();
        
//         if (current === addUserBtn) {
//           current.click();
//           return;
//         }

//         if (current === listUsersBtn) {
//           current.click();
//           return;
//         }

//         if (current.tagName === "INPUT") {
//           current.focus();
//         }
//         else if (isToggle(current)) {
//           togglePassword();
//         }
//       }
//     }

//     // --- PASSWORD TOGGLE -----------------------------------------------------
//     function togglePassword() {
//       const passwordInput = inputs[2];
//       const icon = passwordToggle.querySelector("i") || passwordToggle.querySelector("img");

//       const isHidden = passwordInput.type === "password";
//       passwordInput.type = isHidden ? "text" : "password";

//       if (icon && icon.classList) {
//         icon.classList.toggle("fa-eye", isHidden);
//         icon.classList.toggle("fa-eye-slash", !isHidden);
//       }
      
//       passwordToggle.setAttribute("aria-pressed", String(isHidden));
//     }

//     // --- REGISTER EVENTS -----------------------------------------------------
//     document.addEventListener("click", handleClick);
//     document.addEventListener("keydown", handleKeydown);

//     // --- CLEANUP -----------------------------------------------------
//     LoginPage.cleanup = function () {
//       document.removeEventListener("click", handleClick);
//       document.removeEventListener("keydown", handleKeydown);
//     };

//     // Set up accessibility attributes for password toggle
//     if (passwordToggle) {
//       passwordToggle.setAttribute("tabindex", "0");
//       passwordToggle.setAttribute("role", "button");
//       passwordToggle.setAttribute("aria-label", "Show or hide password");
//       passwordToggle.setAttribute("aria-pressed", "false");
//     }

//   }, 0);

//   // --- RETURN HTML -----------------------------------------------------------
//   return `
//     <div class="login-wrapper">

//       <div class="left-section">
//         <img src="assets/logo.png" class="brand-logo" />
//         <button class="list-users-btn">
//           <img src="/assets/list.svg" alt="List Users" />
//           List Users
//         </button>
//       </div>

//       <div class="right-section">
//         <div class="login-card">
//           <h1>Login Details</h1>

//           <div class="input-group">
//             <img src="/assets/name.svg" alt="name" />
//             <input type="text" placeholder="Any Name" autocomplete="off">
//           </div>

//           <div class="input-group">
//             <img src="/assets/profile.svg" alt="username" />
//             <input type="text" placeholder="Username" autocomplete="off">
//           </div>

//           <div class="input-group">
//             <img src="/assets/lock.svg" alt="password" />
//             <input type="password" placeholder="Password" autocomplete="new-password">

//             <div class="toggle-password">
//               <img src="/assets/eye.svg" alt="toggle" />
//             </div>
//           </div>

//           <button class="add-user-btn">ADD USER</button>
//         </div>
//       </div>

//       <div id="loading-overlay" class="hidden" style="position: fixed; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">
//    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">

//           <div class="spinner"></div>

//           <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">Loading...</div>
//           <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>
//         </div>
//       </div>

//     </div>
//   `;
// }




function LoginPage() {
  // --- Define key blocking functions GLOBALLY (before setTimeout) ---
  var keyBlockCallback = null;



  
  function blurAllInputs() {
  try {
    var all = qsa(".input-group input");
    all.forEach(function(i){
      try { i.blur(); } catch(e){}
    });
  } catch(e){}
}

  window.enableKeyBlock = function(callback) {
    keyBlockCallback = callback;
    try { console.log("🔒 Key blocking enabled"); } catch (e) {}
  };

  window.disableKeyBlock = function() {
    keyBlockCallback = null;
    try { console.log("🔓 Key blocking disabled"); } catch (e) {}
  };

  // DOM helpers
  function qs(selector) {
    try { return document.querySelector(selector); } catch (e) { return null; }
  }
  function qsa(selector) {
    try { return Array.prototype.slice.call(document.querySelectorAll(selector)); } catch (e) { return []; }
  }


  function blurAllInputs() {
  try {
    var all = qsa(".input-group input");
    all.forEach(function(i){
      try { i.blur(); } catch(e){}
    });
  } catch(e){}
}

  // Delay actual wiring so the template is in DOM
  setTimeout(function () {
    try {
      console.log("Login Page Loaded");

      // Collect DOM elements
      var inputs = qsa(".input-group input");
      // Ensure we have at least 3 inputs (Name, Username, Password)
      inputs[0] = inputs[0] || null;
      inputs[1] = inputs[1] || null;
      inputs[2] = inputs[2] || null;

      var passwordToggle = qs(".toggle-password");
      var addUserBtn = qs(".add-user-btn");
      var listUsersBtn = qs(".list-users-btn");

      // Order matters – this defines navigation flow
      var focusable = [
        inputs[0],      // Name
        inputs[1],      // Username
        inputs[2],      // Password
        passwordToggle, // Eye toggle
        addUserBtn,     // Add user
        listUsersBtn    // List users
      ];

      // normalize focusable array (remove nulls but keep indices stable)
      // We'll keep nulls so indexes match your earlier logic; checks will ignore nulls.

      var focusIndex = 0; // which item is visually focused

      // --- FOCUS HELPERS -------------------------------------------------------
   function removeFocus(el) {
  if (!el) return;

  // Remove visual classes
  try {
    el.classList.remove("login-input-focused");
    el.classList.remove("login-btn-focused");
    el.classList.remove("login-icon-focused");
    el.classList.remove("list-users-btn-focused");
  } catch(e){}

  // IMPORTANT FOR SAMSUNG TV
  if (el.tagName === "INPUT") {
    try { el.blur(); } catch(e){}
  }
}


      function addFocus(el) {
        if (!el || !el.classList) return;
        try {
          if (el.tagName === "INPUT") {
            el.classList.add("login-input-focused");
          } else if (el.classList && el.classList.contains("list-users-btn")) {
            el.classList.add("list-users-btn-focused");
          } else if (el.tagName === "BUTTON") {
            el.classList.add("login-btn-focused");
          } else if (el.classList && el.classList.contains("toggle-password")) {
            el.classList.add("login-icon-focused");
          } else {
            // fallback
            el.classList.add("login-btn-focused");
          }
        } catch (e) { /* ignore */ }
      }

      function clearAllVisualFocus() {
        var allInputs = qsa(".input-group input");
        for (var i = 0; i < allInputs.length; i++) removeFocus(allInputs[i]);
        var allCats = qsa(".movies-category-item"); // harmless if not present
        for (var j = 0; j < allCats.length; j++) removeFocus(allCats[j]);
        removeFocus(addUserBtn);
        removeFocus(listUsersBtn);
        removeFocus(passwordToggle);
      }

      function visuallyFocusIndex(newIndex) {
        // remove current
        try {
          var cur = focusable[focusIndex];
          if (cur) removeFocus(cur);
        } catch (e) {}
        // clamp
        if (typeof newIndex !== "number" || newIndex < 0) newIndex = 0;
        if (newIndex >= focusable.length) newIndex = focusable.length - 1;
        focusIndex = newIndex;
        var next = focusable[focusIndex];
        if (next) addFocus(next);
      }

      function isPasswordInput(el) {
        return el === inputs[2];
      }

      function isToggle(el) {
        return el === passwordToggle;
      }

      // Set initial visual focus (avoid .focus())
      try { clearAllVisualFocus(); } catch (e) {}
      if (focusable[0]) addFocus(focusable[0]);

      // --- CLICK HANDLER -------------------------------------------------------
      function handleClick(e) {
        try {
          var t = e && e.target ? e.target : null;
          if (!t) return;

          // If toggle was clicked -> toggle password (do not focus input)
          var toggleEl = t.closest ? t.closest(".toggle-password") : null;
          if (toggleEl) {
            togglePassword();
            return;
          }

          // If Add User clicked
          if (t.closest && t.closest(".add-user-btn")) {
            // Use visible inputs values (they may not be focused)
            var name = inputs[0] ? (inputs[0].value || "").trim() : "";
            var username = inputs[1] ? (inputs[1].value || "").trim() : "";
            var password = inputs[2] ? (inputs[2].value || "").trim() : "";

            if (!name || !username || !password) {
              if (typeof Toaster !== "undefined") {
                Toaster.showToast("error", "Please complete all fields!");
              } else {
                alert("Please complete all fields!");
              }
              return;
            }

            if (typeof loginApi !== "function") {
              console.error("❌ loginApi function not found in global scope");
              alert("Login system not initialized! Please check if API file is loaded.");
              return;
            }

            try {
              console.log("🚀 Calling loginApi...");
              loginApi(username, password, name, false, "").then(function (response) {
                try {
                  console.log("✅ Login API response:", response);
                  if (response) {
                    console.log("Login successful");
                    if (typeof LoginPage.cleanup === "function") LoginPage.cleanup();
                  } else {
                    console.log("❌ Login failed - no response");
                  }
                } catch (e) {}
              }).catch(function (err) {
                console.error("❌ Login API error:", err);
                if (typeof Toaster !== "undefined") {
                  Toaster.showToast("error", "Login failed: " + (err && err.message ? err.message : "error"));
                } else {
                  alert("Login failed: " + (err && err.message ? err.message : "error"));
                }
              });
            } catch (ex) {
              console.error("loginApi call failed:", ex);
            }
            return;
          }

          // List users button
          if (t.closest && t.closest(".list-users-btn")) {
            try {
              var playlistsData = [];
              try { playlistsData = JSON.parse(localStorage.getItem("playlistsData") || "[]"); } catch (e) { playlistsData = []; }
              if (playlistsData.length === 0) {
                if (typeof Toaster !== "undefined") {
                  Toaster.showToast("error", "No Playlists Available! Please Add One.");
                } else {
                  alert("No Playlists Available! Please Add One.");
                }
                return;
              }
              try { localStorage.setItem("currentPage", "playlistPage"); } catch (e) {}
              if (typeof LoginPage.cleanup === "function") LoginPage.cleanup();
              if (typeof Router !== "undefined" && Router.showPage) {
                Router.showPage("playlistPage");
              } else if (typeof navigateTo === "function") {
                navigateTo("playlist-page");
              } else {
                console.error("Navigation function not found");
              }
            } catch (err) {}
            return;
          }

          // If an input is clicked, visually focus it but DO NOT call .focus() (prevents keyboard)
          var inputClicked = t.closest ? t.closest(".input-group input") : null;
          if (inputClicked) {
            // Find the index of this input in focusable
            for (var i = 0; i < focusable.length; i++) {
              if (focusable[i] === inputClicked) {
                visuallyFocusIndex(i);
                break;
              }
            }
            return;
          }
        } catch (outer) {
          // swallow
          try { console.warn("handleClick error", outer && outer.message); } catch (e) {}
        }
      }

      // --- REMOTE / KEYBOARD HANDLER ------------------------------------------
      function handleKeydown(e) {
        try {
          // Check if key blocking is active (during login)
          if (keyBlockCallback) {
            try { e.preventDefault(); e.stopPropagation(); } catch (pe) {}
            if (e.key === "Escape" || e.key === "Backspace" || e.keyCode === 10009) {
              try { keyBlockCallback(); } catch (cbErr) {}
            }
            return;
          }

          var current = focusable[focusIndex];

          // MOVE DOWN
          if (e.key === "ArrowDown" || e.keyCode === 40) {
            try { e.preventDefault(); } catch (pe) {}
            if (current === inputs[0]) {
              visuallyFocusIndex(1);
            } else if (current === inputs[1]) {
              visuallyFocusIndex(2);
            } else if (current === inputs[2] || isToggle(current)) {
              visuallyFocusIndex(focusable.indexOf(addUserBtn));
            } else if (current === addUserBtn) {
              visuallyFocusIndex(focusable.indexOf(listUsersBtn));
            }
            return;
          }

          // MOVE UP
          if (e.key === "ArrowUp" || e.keyCode === 38) {
            try { e.preventDefault(); } catch (pe) {}
            if (current === inputs[1]) {
              visuallyFocusIndex(0);
            } else if (current === inputs[2]) {
              visuallyFocusIndex(1);
            } else if (current === addUserBtn) {
              visuallyFocusIndex(2);
            } else if (current === listUsersBtn) {
              visuallyFocusIndex(focusable.indexOf(addUserBtn));
            }
            return;
          }

          // MOVE LEFT
          if (e.key === "ArrowLeft" || e.keyCode === 37) {
            try { e.preventDefault(); } catch (pe) {}
            if (isToggle(current)) {
              visuallyFocusIndex(2);
            } else {
              // move focus to listUsersBtn as a fallback
              visuallyFocusIndex(focusable.indexOf(listUsersBtn));
            }
            return;
          }

          // MOVE RIGHT
          if (e.key === "ArrowRight" || e.keyCode === 39) {
            try { e.preventDefault(); } catch (pe) {}
            if (current === listUsersBtn) {
              visuallyFocusIndex(0);
            } else if (isPasswordInput(current)) {
              visuallyFocusIndex(focusable.indexOf(passwordToggle));
            } else if (isToggle(current)) {
              visuallyFocusIndex(2);
            } else {
              // default to next available
              var next = focusIndex + 1;
              if (next < focusable.length) visuallyFocusIndex(next);
            }
            return;
          }

          // ENTER to activate
          if (e.key === "Enter" || e.keyCode === 13) {
            try { e.preventDefault(); } catch (pe) {}
            var cur = focusable[focusIndex];

            // If current is an input -> now actually focus it (this will open keyboard on TV)
     if (cur && cur.tagName === "INPUT") {
    try {
        let target = cur;

        // 1️⃣ Force IME to detach from currently-focused input
        try { document.activeElement.blur(); } catch(e) {}
        try { blurAllInputs(); } catch(e) {}

        // 2️⃣ Temporarily disable the input so Samsung TV IME must reattach
        target.setAttribute("disabled", "true");

        // 3️⃣ Now wait long enough for Samsung TV to register blur
        setTimeout(function () {
            try {
                // Re-enable so IME can attach fresh
                target.removeAttribute("disabled");

                // 4️⃣ Now focus FOR REAL
                target.focus();

                // 5️⃣ Force cursor to end (Samsung bug)
                let len = target.value.length;
                setTimeout(() => {
                    try { target.setSelectionRange(len, len); } catch(e){}
                }, 60);

            } catch(e){}
        }, 180); // ← Samsung TVs need 150–250ms delay
    } catch(e){}

    return;
}




            // Toggle password if icon
            if (isToggle(cur)) {
              togglePassword();
              return;
            }

            // Buttons
            if (cur === addUserBtn) {
              try { addUserBtn.click(); } catch (errClick) {}
              return;
            }
            if (cur === listUsersBtn) {
              try { listUsersBtn.click(); } catch (errClick) {}
              return;
            }
          }

          // BACK keys - optional behavior
          var backKeys = [10009, "Escape", "Back", "BrowserBack", "XF86Back"];
          if (backKeys.indexOf(e.key) !== -1 || backKeys.indexOf(e.keyCode) !== -1) {
            try { e.preventDefault(); } catch (pe) {}
            // You may want to navigate back here
            // Example: navigateTo('dashboard-page') or do nothing
          }
        } catch (outerErr) {
          try { console.warn("handleKeydown error:", outerErr && outerErr.message); } catch (z) {}
        }
      }

      // --- PASSWORD TOGGLE -----------------------------------------------------
      function togglePassword() {
        var passwordInput = inputs[2];
        if (!passwordInput) return;
        var icon = null;
        try { icon = passwordToggle.querySelector("i") || passwordToggle.querySelector("img"); } catch (e) {}
        var isHidden = (passwordInput.type === "password");
        try { passwordInput.type = isHidden ? "text" : "password"; } catch (e) {}
        if (icon && icon.classList) {
          try {
            if (isHidden) {
              icon.classList.remove("fa-eye-slash");
              icon.classList.add("fa-eye");
            } else {
              icon.classList.remove("fa-eye");
              icon.classList.add("fa-eye-slash");
            }
          } catch (e) {}
        }
        try { if (passwordToggle) passwordToggle.setAttribute("aria-pressed", String(isHidden)); } catch (e) {}
      }

      // --- REGISTER EVENTS -----------------------------------------------------
      try {
        document.addEventListener("click", handleClick);
        document.addEventListener("keydown", handleKeydown);
      } catch (e) {}

      // --- CLEANUP -----------------------------------------------------
      LoginPage.cleanup = function () {
        try { document.removeEventListener("click", handleClick); } catch (e) {}
        try { document.removeEventListener("keydown", handleKeydown); } catch (e) {}
      };

      // Set up accessibility attributes for password toggle
      if (passwordToggle) {
        try { passwordToggle.setAttribute("tabindex", "0"); } catch (e) {}
        try { passwordToggle.setAttribute("role", "button"); } catch (e) {}
        try { passwordToggle.setAttribute("aria-label", "Show or hide password"); } catch (e) {}
        try { passwordToggle.setAttribute("aria-pressed", "false"); } catch (e) {}
      }

    } catch (initErr) {
      try { console.error("LoginPage init error:", initErr && initErr.message); } catch (e) {}
    }
  }, 0);

  // --- RETURN HTML -----------------------------------------------------------
  return '\
    <div class="login-wrapper">\
\
      <div class="left-section">\
        <img src="assets/logo.png" class="brand-logo" />\
        <button class="list-users-btn">\
          <img src="/assets/list.svg" alt="List Users" />\
          List Users\
        </button>\
      </div>\
\
      <div class="right-section">\
        <div class="login-card">\
          <h1>Login Details</h1>\
\
          <div class="input-group">\
            <img src="/assets/name.svg" alt="name" />\
            <input type="text" placeholder="Any Name" autocomplete="off">\
          </div>\
\
          <div class="input-group">\
            <img src="/assets/profile.svg" alt="username" />\
            <input type="text" placeholder="Username" autocomplete="off">\
          </div>\
\
          <div class="input-group">\
            <img src="/assets/lock.svg" alt="password" />\
            <input type="password" placeholder="Password" autocomplete="new-password">\
\
            <div class="toggle-password">\
              <img src="/assets/eye.svg" alt="toggle" />\
            </div>\
          </div>\
\
          <button class="add-user-btn">ADD USER</button>\
        </div>\
      </div>\
\
      <div id="loading-overlay" class="hidden" style="position: fixed; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">\
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">\
          <div class="spinner"></div>\
          <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">Loading...</div>\
          <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>\
        </div>\
      </div>\
\
    </div>\
  ';
}
