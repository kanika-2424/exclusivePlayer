function SidebarCategories(categories = []) {
  return `
    <div class="sidebar-container">

      <!-- Search Box -->
      <div class="sidebar-search-box">
        <input
          type="text"
          placeholder="Search Categories"
          class="sidebar-search-input"
        />
        <i class="fa fa-search sidebar-search-icon"></i>
      </div>

      <!-- List -->
      <div class="sidebar-list">
        ${categories
          .map(
            (item) => `
          <div class="sidebar-item ${item.selected ? "selected" : ""}">
            <span>${item.name}</span>
            <span>${item.count}</span>
          </div>
        `
          )
          .join("")}
      </div>

    </div>
  `;
}
