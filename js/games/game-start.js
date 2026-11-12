export const gameStartIntro =
  'Pred začetkom lahko prilagodiš nastavitve naloge zgoraj, nato pritisni Začni.';

export function renderStartCard(detailText, startId, startLabel = '▶ Začni', title = '') {
  return `
    <div class="start-screen w-full flex items-center justify-center p-2 sm:p-4">
      <div class="stage-card start-card brutal-card bg-white border-4 border-black p-6 sm:p-8 shadow-brutal-xl max-w-lg w-full text-center flex flex-col items-center gap-4">
        ${title ? `<h2 class="font-heading font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">${title}</h2>` : ''}
        <p class="text-xs sm:text-sm font-semibold text-slate-600">${gameStartIntro}</p>
        <div class="start-detail bg-brutal-bg border-3 border-black p-4 w-full text-sm font-bold text-black shadow-brutal-sm leading-relaxed whitespace-pre-line">${detailText}</div>
        <button id="${startId}" class="brutal-btn start-btn w-full py-3 sm:py-3.5 bg-brutal-green text-black font-heading font-black text-base sm:text-lg border-3 border-black shadow-brutal hover:bg-brutal-yellow transition-colors mt-2" data-primary-action="true">${startLabel}</button>
      </div>
    </div>
  `;
}
