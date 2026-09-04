Manual checks for per-game settings and panel

1. Open the app in browser and navigate to a game (e.g., `racunanje`, `stroop`, `zaporedje`).

2. Verify settings button:
   - Click the ⚙ button in the game header. The settings UI should move into the stage (right side panel) and become visible.
   - Click outside the panel to close it. Click the button again to open.

3. Stroop checks:
   - Open `Stroopov test`. Change `Runde` and `Število barv`. Click `Začni`.
   - Game should use selected number of rounds and color pool.
   - Reopen settings: previously chosen values should persist.

4. Zaporedje checks:
   - Open `Zaporedje števil`. Toggle `Način` to `Cilj` — `Ciljna raven` input should appear.
   - Set different `Začetna dolžina` and `Hitrost`, start game and verify sequence length/speed.
   - Settings persist across navigation.

5. Racunanje checks (already present):
   - Switch modes (time/count), digits (custom), answer mode (options/input) and verify options hide/show accordingly.

6. If anything misbehaves, open browser console and inspect errors.

Quick console helper to inspect saved settings:

```
// in browser console
localStorage.getItem('miselni_settings_game.stroop')
localStorage.getItem('miselni_settings_game.zaporedje')
```
