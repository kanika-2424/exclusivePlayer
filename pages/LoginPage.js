// function LoginPage() {
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

//         console.log("User added:", { name, username, password });

//         localStorage.setItem("currentPage", "dashboard");
//         LoginPage.cleanup();
//         navigateTo("dashboard-page");
//       }

//       if (e.target.classList.contains("list-users-btn")) {
//         console.log("Open Users Page");
//         LoginPage.cleanup();
//         navigateTo("users-page");
//       }
//     }

//     // --- REMOTE / KEYBOARD HANDLER ------------------------------------------
//     function handleKeydown(e) {
//       const current = focusable[focusIndex];

//       // MOVE DOWN
//       if (e.key === "ArrowDown") {
//         e.preventDefault(); // Prevent default scrolling
        
//         // Name → Username
//         if (current === inputs[0]) {
//           removeFocus(current);
//           focusIndex = 1;
//           addFocus(inputs[1]);
//           inputs[1].focus();
//         }
//         // Username → Password
//         else if (current === inputs[1]) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//         // Password → Add User button
//         else if (current === inputs[2]) {
//           removeFocus(current);
//           current.blur(); // Remove browser focus from input
//           focusIndex = focusable.indexOf(addUserBtn);
//           addFocus(addUserBtn);
//         }
//         // Toggle (eye) → Add User button
//         else if (isToggle(current)) {
//           removeFocus(current);
//           inputs[2].blur(); // Also blur the password input
//           focusIndex = focusable.indexOf(addUserBtn);
//           addFocus(addUserBtn);
//         }
//         // Add User → List Users
//         else if (current === addUserBtn) {
//           removeFocus(current);
//           focusIndex = focusable.indexOf(listUsersBtn);
//           addFocus(listUsersBtn);
//         }
//       }

//       // MOVE UP
//       else if (e.key === "ArrowUp") {
//         e.preventDefault();
        
//         // Username → Name
//         if (current === inputs[1]) {
//           removeFocus(current);
//           focusIndex = 0;
//           addFocus(inputs[0]);
//           inputs[0].focus();
//         }
//         // Password → Username
//         else if (current === inputs[2]) {
//           removeFocus(current);
//           focusIndex = 1;
//           addFocus(inputs[1]);
//           inputs[1].focus();
//         }
//         // Add User → Password
//         else if (current === addUserBtn) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//         // List Users → Add User
//         else if (current === listUsersBtn) {
//           removeFocus(current);
//           focusIndex = focusable.indexOf(addUserBtn);
//           addFocus(addUserBtn);
//         }
//       }

//       // MOVE LEFT → Always go to List Users button
//       else if (e.key === "ArrowLeft") {
//         e.preventDefault();
        
//         // Exception: if on eye toggle, go back to password input
//         if (isToggle(current)) {
//           removeFocus(current);
//           focusIndex = 2;
//           addFocus(inputs[2]);
//           inputs[2].focus();
//         }
//         // Otherwise, go to List Users button
//         else {
//           // Blur any active input
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
        
//         // From List Users → go to Name input
//         if (current === listUsersBtn) {
//           removeFocus(current);
//           focusIndex = 0;
//           addFocus(inputs[0]);
//           inputs[0].focus();
//         }
//         // From password input → go to password toggle
//         else if (isPasswordInput(current)) {
//           removeFocus(current);
//           focusIndex = focusable.indexOf(passwordToggle);
//           addFocus(passwordToggle);
//         }
//         // From toggle → back to password
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
        
//         // If on Add User button → trigger click
//         if (current === addUserBtn) {
//           current.click();
//           return;
//         }

//         // If on List Users button → trigger click
//         if (current === listUsersBtn) {
//           current.click();
//           return;
//         }

//         // If on inputs → give cursor focus
//         if (current.tagName === "INPUT") {
//           current.focus();
//         }

//         // If toggle → toggle password
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

//       // Change icon if using FontAwesome
//       if (icon && icon.classList) {
//         icon.classList.toggle("fa-eye", isHidden);
//         icon.classList.toggle("fa-eye-slash", !isHidden);
//       }
//     }

//     // --- REGISTER EVENTS -----------------------------------------------------
//     document.addEventListener("click", handleClick);
//     document.addEventListener("keydown", handleKeydown);

//     // --- CLEANUP -------------------------------------------------------------
//     LoginPage.cleanup = function () {
//       document.removeEventListener("click", handleClick);
//       document.removeEventListener("keydown", handleKeydown);
//     };

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
//             <input type="text" placeholder="Any Name">
//           </div>

//           <div class="input-group">
//             <img src="/assets/profile.svg" alt="username" />
//             <input type="text" placeholder="Username">
//           </div>

//           <div class="input-group">
//             <img src="/assets/lock.svg" alt="password" />
//             <input type="password" placeholder="Password">

//             <div class="toggle-password">
//               <img src="/assets/eye.svg" alt="toggle" />
//             </div>
//           </div>

//           <button class="add-user-btn">ADD USER</button>
//         </div>
//       </div>

//     </div>
//   `;
// }


function LoginPage() {
  // --- Define key blocking functions GLOBALLY (before setTimeout) ---
  let keyBlockCallback = null;
  
  window.enableKeyBlock = function(callback) {
    keyBlockCallback = callback;
    console.log("🔒 Key blocking enabled");
  };
  
  window.disableKeyBlock = function() {
    keyBlockCallback = null;
    console.log("🔓 Key blocking disabled");
  };

  setTimeout(() => {
    console.log("Login Page Loaded");

    // Collect DOM elements
    const inputs = Array.from(document.querySelectorAll(".input-group input"));
    const passwordToggle = document.querySelector(".toggle-password");
    const addUserBtn = document.querySelector(".add-user-btn");
    const listUsersBtn = document.querySelector(".list-users-btn");

    // Order matters – this defines navigation flow
    const focusable = [
      inputs[0],      // Name
      inputs[1],      // Username
      inputs[2],      // Password
      passwordToggle, // Eye toggle
      addUserBtn,     // Add user
      listUsersBtn,   // List users
    ];

    let focusIndex = 0;

    // --- FOCUS HELPERS -------------------------------------------------------
    function removeFocus(el) {
      if (!el) return;
      el.classList.remove("login-input-focused");
      el.classList.remove("login-btn-focused");
      el.classList.remove("login-icon-focused");
      el.classList.remove("list-users-btn-focused");
    }

    function addFocus(el) {
      if (!el) return;

      if (el.tagName === "INPUT") {
        el.classList.add("login-input-focused");
      }
      else if (el.classList.contains("list-users-btn")) {
        el.classList.add("list-users-btn-focused");
      }
      else if (el.tagName === "BUTTON") {
        el.classList.add("login-btn-focused");
      } else if (el.classList.contains("toggle-password")) {
        el.classList.add("login-icon-focused");
      }
    }

    function isPasswordInput(el) {
      return el === inputs[2];
    }

    function isToggle(el) {
      return el === passwordToggle;
    }

    // Set initial visual focus
    addFocus(focusable[0]);

    // --- CLICK HANDLER -------------------------------------------------------
    function handleClick(e) {
      if (e.target.closest(".toggle-password")) {
        togglePassword();
      }

      if (e.target.classList.contains("add-user-btn")) {
        const name = inputs[0].value.trim();
        const username = inputs[1].value.trim();
        const password = inputs[2].value.trim();

        // Validate inputs
        if (!name || !username || !password) {
          if (typeof Toaster !== 'undefined') {
            Toaster.showToast("error", "Please complete all fields!");
          } else {
            alert("Please complete all fields!");
          }
          return;
        }

        console.log("Attempting login:", { name, username, password });

        // Check if loginApi exists
        if (typeof loginApi !== 'function') {
          console.error("❌ loginApi function not found in global scope");
          alert("Login system not initialized! Please check if API file is loaded.");
          return;
        }

        // Call the login API
        console.log("🚀 Calling loginApi...");
        loginApi(username, password, name, false, "").then((response) => {
          console.log("✅ Login API response:", response);
          if (response) {
            console.log("Login successful");
            LoginPage.cleanup();
          } else {
            console.log("❌ Login failed - no response");
          }
        }).catch((error) => {
          console.error("❌ Login API error:", error);
          if (typeof Toaster !== 'undefined') {
            Toaster.showToast("error", "Login failed: " + error.message);
          } else {
            alert("Login failed: " + error.message);
          }
        });
      }

      if (e.target.classList.contains("list-users-btn")) {
        console.log("Open Playlists Page");
        
        const playlistsData = JSON.parse(localStorage.getItem("playlistsData")) || [];

        if (playlistsData.length === 0) {
          if (typeof Toaster !== 'undefined') {
            Toaster.showToast("error", "No Playlists Available! Please Add One.");
          } else {
            alert("No Playlists Available! Please Add One.");
          }
          return;
        }

        localStorage.setItem("currentPage", "playlistPage");
        LoginPage.cleanup();
        
        if (typeof Router !== 'undefined' && Router.showPage) {
          Router.showPage("playlistPage");
        } else if (typeof navigateTo === 'function') {
          navigateTo("playlist-page");
        } else {
          console.error("Navigation function not found");
        }
      }
    }

    // --- REMOTE / KEYBOARD HANDLER ------------------------------------------
    function handleKeydown(e) {
      // Check if key blocking is active (during login)
      if (keyBlockCallback) {
        e.preventDefault();
        e.stopPropagation();
        // If Back button or specific key pressed, trigger callback
        if (e.key === "Escape" || e.key === "Backspace" || e.keyCode === 10009) {
          keyBlockCallback();
        }
        return;
      }

      const current = focusable[focusIndex];

      // MOVE DOWN
      if (e.key === "ArrowDown") {
        e.preventDefault();
        
        if (current === inputs[0]) {
          removeFocus(current);
          focusIndex = 1;
          addFocus(inputs[1]);
          inputs[1].focus();
        }
        else if (current === inputs[1]) {
          removeFocus(current);
          focusIndex = 2;
          addFocus(inputs[2]);
          inputs[2].focus();
        }
        else if (current === inputs[2]) {
          removeFocus(current);
          current.blur();
          focusIndex = focusable.indexOf(addUserBtn);
          addFocus(addUserBtn);
        }
        else if (isToggle(current)) {
          removeFocus(current);
          inputs[2].blur();
          focusIndex = focusable.indexOf(addUserBtn);
          addFocus(addUserBtn);
        }
        else if (current === addUserBtn) {
          removeFocus(current);
          focusIndex = focusable.indexOf(listUsersBtn);
          addFocus(listUsersBtn);
        }
      }

      // MOVE UP
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        
        if (current === inputs[1]) {
          removeFocus(current);
          focusIndex = 0;
          addFocus(inputs[0]);
          inputs[0].focus();
        }
        else if (current === inputs[2]) {
          removeFocus(current);
          focusIndex = 1;
          addFocus(inputs[1]);
          inputs[1].focus();
        }
        else if (current === addUserBtn) {
          removeFocus(current);
          focusIndex = 2;
          addFocus(inputs[2]);
          inputs[2].focus();
        }
        else if (current === listUsersBtn) {
          removeFocus(current);
          focusIndex = focusable.indexOf(addUserBtn);
          addFocus(addUserBtn);
        }
      }

      // MOVE LEFT
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        
        if (isToggle(current)) {
          removeFocus(current);
          focusIndex = 2;
          addFocus(inputs[2]);
          inputs[2].focus();
        }
        else {
          if (current.tagName === "INPUT") {
            current.blur();
          }
          removeFocus(current);
          focusIndex = focusable.indexOf(listUsersBtn);
          addFocus(listUsersBtn);
        }
      }

      // MOVE RIGHT
      else if (e.key === "ArrowRight") {
        e.preventDefault();
        
        if (current === listUsersBtn) {
          removeFocus(current);
          focusIndex = 0;
          addFocus(inputs[0]);
          inputs[0].focus();
        }
        else if (isPasswordInput(current)) {
          removeFocus(current);
          focusIndex = focusable.indexOf(passwordToggle);
          addFocus(passwordToggle);
        }
        else if (isToggle(current)) {
          removeFocus(current);
          focusIndex = 2;
          addFocus(inputs[2]);
          inputs[2].focus();
        }
      }

      // ENTER to activate
      else if (e.key === "Enter") {
        e.preventDefault();
        
        if (current === addUserBtn) {
          current.click();
          return;
        }

        if (current === listUsersBtn) {
          current.click();
          return;
        }

        if (current.tagName === "INPUT") {
          current.focus();
        }
        else if (isToggle(current)) {
          togglePassword();
        }
      }
    }

    // --- PASSWORD TOGGLE -----------------------------------------------------
    function togglePassword() {
      const passwordInput = inputs[2];
      const icon = passwordToggle.querySelector("i") || passwordToggle.querySelector("img");

      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";

      if (icon && icon.classList) {
        icon.classList.toggle("fa-eye", isHidden);
        icon.classList.toggle("fa-eye-slash", !isHidden);
      }
      
      passwordToggle.setAttribute("aria-pressed", String(isHidden));
    }

    // --- REGISTER EVENTS -----------------------------------------------------
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    // --- CLEANUP -----------------------------------------------------
    LoginPage.cleanup = function () {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };

    // Set up accessibility attributes for password toggle
    if (passwordToggle) {
      passwordToggle.setAttribute("tabindex", "0");
      passwordToggle.setAttribute("role", "button");
      passwordToggle.setAttribute("aria-label", "Show or hide password");
      passwordToggle.setAttribute("aria-pressed", "false");
    }

  }, 0);

  // --- RETURN HTML -----------------------------------------------------------
  return `
    <div class="login-wrapper">

      <div class="left-section">
        <img src="assets/logo.png" class="brand-logo" />
        <button class="list-users-btn">
          <img src="/assets/list.svg" alt="List Users" />
          List Users
        </button>
      </div>

      <div class="right-section">
        <div class="login-card">
          <h1>Login Details</h1>

          <div class="input-group">
            <img src="/assets/name.svg" alt="name" />
            <input type="text" placeholder="Any Name" autocomplete="off">
          </div>

          <div class="input-group">
            <img src="/assets/profile.svg" alt="username" />
            <input type="text" placeholder="Username" autocomplete="off">
          </div>

          <div class="input-group">
            <img src="/assets/lock.svg" alt="password" />
            <input type="password" placeholder="Password" autocomplete="new-password">

            <div class="toggle-password">
              <img src="/assets/eye.svg" alt="toggle" />
            </div>
          </div>

          <button class="add-user-btn">ADD USER</button>
        </div>
      </div>

      <div id="loading-overlay" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="text-align: center; color: white;">
          <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Loading...</div>
          <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>
        </div>
      </div>

    </div>
  `;
}




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
            
//             // Store auth data in localStorage (compatible with your system)
//             localStorage.setItem("currentUser", username);
//             localStorage.setItem("authToken", "token_" + Date.now());
//             localStorage.setItem("userName", name);
//             localStorage.setItem("isLogin", "true");
//             localStorage.setItem("currentPage", "dashboard");
            
//             LoginPage.cleanup();
            
//             // Navigate to dashboard page
//             if (typeof Router !== 'undefined' && Router.showPage) {
//               Router.showPage("dashboard");
//             }
//           } else {
//             console.log("❌ Login failed - no response");
//             if (typeof Toaster !== 'undefined') {
//               Toaster.showToast("error", "Login failed!");
//             } else {
//               alert("Login failed!");
//             }
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
//         console.log("Open Movies Page");
        
//         localStorage.setItem("currentPage", "movies");
//         LoginPage.cleanup();
        
//         if (typeof Router !== 'undefined' && Router.showPage) {
//           Router.showPage("movies");
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

//       <div id="loading-overlay" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">
//         <div style="text-align: center; color: white;">
//           <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
//           <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Loading...</div>
//           <div id="loading-progress" style="font-size: 32px; font-weight: bold;">0%</div>
//         </div>
//       </div>

//     </div>
//   `;
// }