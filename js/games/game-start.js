export const gameStartIntro =
  'Pred začetkom lahko prilagodiš nastavitve naloge zgoraj, nato pritisni Začni.';

export function renderStartCard(detailText, startId, startLabel = '▶ Začni', title = '') {
  return `
    <div class="start-screen">
      <div class="stage-card start-card">
        ${title ? `<h2 class="title title-compact">${title}</h2>` : ''}
        <p>${gameStartIntro}</p>
        <p class="start-detail">${detailText}</p>
        <button id="${startId}" class="btn start-btn">${startLabel}</button>
      </div>
    </div>
  `;
}
