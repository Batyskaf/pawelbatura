import { artworks } from '../art/exhibits';
import { rooms } from '../config';
import type { Artwork, Settings } from '../types';
export class UI {
  lang: 'pl' | 'en' = 'pl'; panel: HTMLDialogElement; private restoreFocus: HTMLElement | null = null;
  onPause = () => {}; onEnter = () => {}; onSettings = () => {}; onTour = (_id: string) => {};
  constructor(public settings: Settings) {
    this.panel = document.querySelector('#panel')!;
    try { this.lang = localStorage.getItem('lang') === 'en' ? 'en' : 'pl'; } catch { /* storage unavailable */ }
    this.translate();
    document.querySelector('#language')!.addEventListener('click', () => {
      this.lang = this.lang === 'pl' ? 'en' : 'pl'; try { localStorage.setItem('lang', this.lang); } catch { /* private browser */ }
      this.translate();
    });
    document.querySelectorAll('[data-enter]').forEach(el => el.addEventListener('click', () => this.onEnter()));
    document.querySelectorAll('[data-panel]').forEach(el => el.addEventListener('click', () => this.open(el.getAttribute('data-panel')!)));
    document.querySelector('#close-panel')!.addEventListener('click', () => this.close());
    this.panel.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
    document.querySelector('#mute')!.addEventListener('click', () => { settings.muted = !settings.muted; this.save(); document.querySelector('#mute')!.setAttribute('aria-pressed', String(settings.muted)); });
    window.addEventListener('keydown', e => { if (e.code === 'Escape' && !this.panel.open) this.onPause(); });
  }
  text(pl: string, en: string) { return this.lang === 'pl' ? pl : en; }
  translate() {
    document.documentElement.lang = this.lang;
    document.querySelectorAll<HTMLElement>('[data-pl]').forEach(el => { el.textContent = el.dataset[this.lang] || el.dataset.pl!; });
    document.querySelector('#language')!.textContent = this.lang === 'pl' ? 'EN' : 'PL';
  }
  save() { try { localStorage.setItem('museum-settings', JSON.stringify(this.settings)); } catch { /* storage unavailable */ } this.onSettings(); }
  setMode(mode: 'welcome' | 'exploring' | 'paused' | 'failed') {
    document.body.dataset.mode = mode;
    const status = document.querySelector('#load-status')!;
    if (mode === 'failed') status.textContent = this.text('Tryb 3D jest niedostępny. Wszystkie prace znajdziesz w katalogu.', '3D is unavailable. All works remain available in the catalogue.');
    else status.textContent = this.text('18 oryginalnych prac · 3 przestrzenie · bez instalacji', '18 original works · 3 spaces · no installation');
  }
  close() {
    this.panel.close(); this.restoreFocus?.focus();
    if (document.body.dataset.mode !== 'failed') this.setMode('paused');
  }
  open(kind: string) {
    this.onPause(); this.restoreFocus = document.activeElement as HTMLElement;
    const content = document.querySelector('#panel-content')!; content.replaceChildren();
    if (kind === 'settings') this.settingsPanel(content);
    if (kind === 'help') content.innerHTML = `<p class="eyebrow">${this.text('Przewodnik', 'Visitor guide')}</p><h2>${this.text('Zatrzymaj się. Rozejrzyj.', 'Pause. Look around.')}</h2><p>${this.text('WASD / strzałki — marsz · mysz — rozglądanie · Shift — szybszy marsz · E lub kliknięcie — szczegóły obrazu · Esc — uwolnij kursor.', 'WASD / arrows — walk · mouse — look · Shift — walk faster · E or click — artwork details · Esc — release cursor.')}</p><p>${this.text('Spójrz na obraz z odległości do 8,5 m. Podpis rozwinie się z jego krawędzi. Po zamknięciu panelu kliknij „Wróć do zwiedzania”.', 'Look at a painting within 8.5 m. Its label unfolds from the edge. Close a panel and click “Resume visit” to continue.')}</p><p>${this.text('Katalog działa również bez grafiki 3D. W ustawieniach można wyłączyć animacje i dźwięk.', 'The catalogue works without 3D. You can disable animations and sound in settings.')}</p>`;
    if (kind === 'collection') this.collection(content);
    if (kind === 'map') {
      content.innerHTML = `<p class="eyebrow">${this.text('Plan muzeum', 'Museum plan')}</p><h2>${this.text('Trzy stany materii', 'Three states of matter')}</h2><div class="museum-map" aria-hidden="true">Ⅰ ━━━ Ⅱ ━━━ Ⅲ</div>`;
      rooms.forEach((room, i) => { const b = document.createElement('button'); b.className = 'room-link'; b.textContent = `${['Ⅰ', 'Ⅱ', 'Ⅲ'][i]}   ${room.name[this.lang]} →`; b.addEventListener('click', () => { this.close(); this.onTour(room.id); }); content.append(b); });
      const note = document.createElement('p'); note.textContent = this.text('Wybierz salę, aby przenieść punkt zwiedzania. Między salami możesz także przejść korytarzami.', 'Choose a room to relocate your viewpoint. Corridors also connect all rooms.'); content.append(note);
    }
    if (!this.panel.open) this.panel.showModal();
  }
  artwork(work: Artwork) {
    this.open('artwork'); const content = document.querySelector('#panel-content')!;
    const image = document.createElement('img'); image.className = 'detail-image'; image.src = work.image; image.alt = work.title; content.append(image);
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = work.author; content.append(eyebrow);
    const heading = document.createElement('h2'); heading.textContent = work.title; content.append(heading);
    const meta = document.createElement('p'); meta.textContent = work.metadata[this.lang]; content.append(meta);
    if (work.description) { const description = document.createElement('p'); description.textContent = work.description; content.append(description); }
    if (work.linkStatus === 'source-mismatch') {
      const note = document.createElement('p'); note.className = 'source-note'; note.textContent = this.text('Uwaga archiwalna: w oryginalnej witrynie do tej pracy przypisano link „Fractures”. Zachowano adres źródłowy; wymaga potwierdzenia przez artystę.', 'Archive note: the original website assigns the “Fractures” link to this work. The source URL is preserved and awaits confirmation by the artist.'); content.append(note);
    }
    const link = document.createElement('a'); link.className = 'primary-button'; link.href = work.externalUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = this.text('Zobacz na Saatchi Art ↗', 'View on Saatchi Art ↗'); content.append(link);
    if (work.id === 'emergence') { const map = document.createElement('a'); map.href = 'sound-map.html'; map.className = 'text-link'; map.textContent = this.text('Posłuchaj mapy dźwiękowej →', 'Listen to the sound map →'); content.append(map); }
  }
  collection(content: Element) {
    content.innerHTML = `<p class="eyebrow">${this.text('Katalog / 18 prac', 'Catalogue / 18 works')}</p><h2>${this.text('Obrazy jako otwarte pola', 'Paintings as open fields')}</h2>`;
    const grid = document.createElement('div'); grid.className = 'collection-grid';
    for (const work of artworks) {
      const b = document.createElement('button'); b.className = 'work-card';
      const img = document.createElement('img'); img.src = work.thumbnail; img.alt = ''; img.loading = 'lazy';
      const title = document.createElement('span'); title.textContent = work.title; b.append(img, title); b.addEventListener('click', () => this.artwork(work)); grid.append(b);
    }
    content.append(grid);
  }
  settingsPanel(content: Element) {
    content.innerHTML = `<p class="eyebrow">${this.text('Ustawienia wizyty', 'Visit settings')}</p><h2>${this.text('W swoim tempie', 'At your own pace')}</h2>`;
    const row = (title: string, input: HTMLElement) => { const label = document.createElement('label'); label.className = 'setting'; const text = document.createElement('span'); text.textContent = title; label.append(text, input); content.append(label); };
    const quality = document.createElement('select');
    quality.innerHTML = `<option value="high">${this.text('Wysoka', 'High')}</option><option value="low">${this.text('Oszczędna', 'Economy')}</option>`;
    quality.value = this.settings.quality; quality.addEventListener('change', () => { this.settings.quality = quality.value as Settings['quality']; this.save(); }); row(this.text('Jakość grafiki', 'Graphics quality'), quality);
    for (const [key, pl, en, max] of [ ['master', 'Głośność główna', 'Master volume', 1], ['steps', 'Kroki', 'Footsteps', 1], ['ambient', 'Otoczenie', 'Ambience', 1], ['fx', 'Efekty dźwiękowe', 'Sound effects', 1], ['sensitivity', 'Czułość myszy', 'Mouse sensitivity', 2.5] ] as const) {
      const input = document.createElement('input'); input.type = 'range'; input.min = key === 'sensitivity' ? '.2' : '0'; input.max = String(max); input.step = '.05'; input.value = String(this.settings[key]); input.addEventListener('input', () => { this.settings[key] = Number(input.value); this.save(); }); row(this.text(pl, en), input);
    }
    for (const [key, pl, en] of [ ['muted', 'Wycisz wszystko', 'Mute all'], ['effects', 'Rekonstrukcje architektury', 'Architecture reconstruction'], ['reducedMotion', 'Ogranicz ruch i animacje', 'Reduce motion and animation'], ['diagnostics', 'Pokaż pomiary wydajności', 'Show performance metrics'] ] as const) {
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = this.settings[key]; input.addEventListener('change', () => { this.settings[key] = input.checked; this.save(); }); row(this.text(pl, en), input);
    }
  }
}
