function AccountPage() {
  const currentPlaylistData=JSON.parse(localStorage.getItem("currentPlaylistData")) || {}
  const existingModal = document.querySelector(".account-page-container");
  if (existingModal) {
    existingModal.remove();
    if (AccountPage.cleanup) AccountPage.cleanup();
  }

  function accountPageClick(target) {
    if (localStorage.getItem("currentPage") !== "accountPage") return;
    if (target instanceof Event) target = target.target;
    if (!target) return;

    const accountBackBtn = document.querySelector("#accountBackBtn");

    if (target === accountBackBtn) {
      closeModal();
    }
  }

  console.log("currentPlaylistData" , currentPlaylistData);
  
  function closeModal() {
    if (AccountPage.cleanup) AccountPage.cleanup();

    const modal = document.querySelector(".account-page-container");
    if (modal) modal.remove();

    localStorage.setItem("currentPage", "dashboard");
    Router.showPage("dashboard");
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "black";
  }

  setTimeout(() => {
    if (AccountPage.cleanup) AccountPage.cleanup();

    let focusIndex = 0;
    const buttons = [document.querySelector("#accountBackBtn")].filter(Boolean);

    function setFocus(index) {
      buttons.forEach((btn, i) => {
        btn.classList.toggle("nocache-focused", i === index);
        if (i === index) btn.focus();
      });
    }

    function accountPageKeydownHandler(e) {
      if (localStorage.getItem("currentPage") !== "accountPage") return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "39":
        case "40":
          if (focusIndex < buttons.length - 1) focusIndex++;
          setFocus(focusIndex);
          e.preventDefault();
          break;

        case "ArrowLeft":
        case "ArrowUp":
        case "37":
        case "38":
          if (focusIndex > 0) focusIndex--;
          setFocus(focusIndex);
          e.preventDefault();
          break;

        case "Enter":
        case "13":
          accountPageClick(buttons[focusIndex]);
          break;

     case "Escape":
case "Back":
case "BrowserBack":
case "XF86Back":
case "SoftLeft":
  closeModal();
  e.preventDefault();
  break;
      }
    }

    const modalContainer = document.querySelector(".account-page-container");
    modalContainer.addEventListener("click", accountPageClick);
    document.addEventListener("keydown", accountPageKeydownHandler);

    // NoCacheModal.cleanup = function () {
    //   modalContainer.removeEventListener("click", accountPageClick);
    //   document.removeEventListener("keydown", accountPageKeydownHandler);
    // };

    setFocus(focusIndex);
  }, 0);

  const playlistData = JSON.parse(localStorage.getItem("currentPlaylistData")) || {};


let expDate;

if (
  playlistData &&
  playlistData.userInfo &&
  playlistData.userInfo.exp_date
) {
  expDate = playlistData.userInfo.exp_date;
} else {
  expDate = null;
}


  return `
    <div class="account-page-container">

       <div class="playlistpage-header">
        <img src="/assets/logo.png" class="playlistpage-logo" />

       
    </div>

      <div class="settings-header">
        <div class="setting-login-header">
        </div>
      </div>

      <div class="clear-wrap">
    
<div class="account-page-content">
        <div class="playlistpage-title">Account Page</div>
  
  <div class="account-details-box">
    <div class="account-item">
      <p class="account-label">Username</p>
      <p class="account-value">${(JSON.parse(localStorage.getItem("currentPlaylistData")) || {}).user_info.username || "N/A"}</p>
    </div>

    <div class="account-item">
      <p class="account-label">Account Status</p>
      <p class="account-status">${(JSON.parse(localStorage.getItem("currentPlaylistData")) || {}).user_info.status || "N/A"}</p>
    </div>

    <div class="account-item">
      <p class="account-label">Expiry Date</p>
<p class="account-value">
  ${formatUnixDate(expDate) || "N/A"}
</p>   </div>

    <div class="account-item">
      <p class="account-label">Active Connections</p>
      <p class="account-value">${(JSON.parse(localStorage.getItem("currentPlaylistData")) || {}).user_info.active_cons || "N/A"}</p>
    </div>
  </div>

  <div class="account-back-btn-wrapper">
    <button class="account-back-btn" id="accountBackBtn">Back</button>
  </div>
</div>

      
        </div>
           
      </div>
    </div>
  `;
}
