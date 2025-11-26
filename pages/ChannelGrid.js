function ChannelGrid(channels) {
  return `
    <div class="channel-grid">
      ${channels
        .map(
          ch => `
            <div class="channel-card">
                <img src="${ch.logo}" class="channel-logo" />
                <div class="channel-names">${ch.name}</div>
            </div>
        `
        )
        .join("")}
    </div>
  `;
}
