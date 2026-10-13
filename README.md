# Paweł Batura — Wunderkammer

Interaktywne muzeum 18 oryginalnych obrazów olejnych. Trzy połączone przestrzenie: Gabinet osobliwości, Obserwatorium form i Archiwum granic. Zachowane portfolio, biografia, kontakt Formspree, mapa dźwiękowa, języki PL/EN i odnośniki Saatchi Art.

## Uruchomienie

Node.js 22.12+ lub 24. `npm ci`, następnie `npm run dev`. Otwórz adres podany przez Vite. Produkcja: `npm run build`, następnie `npm run preview`. Publikuj zawartość `dist`, nie surowy TypeScript. Ścieżki względne wspierają domenę własną i podkatalog repozytorium.

`npm test` sprawdza oryginalne dane, obrazy, kolizje, podłoża i efekty. `npm run test:browser` wymaga lokalnego Chrome i Edge oraz serwera na `http://127.0.0.1:5174` (`npm run dev -- --port 5174`). Firefox jest opcjonalny: po `npx playwright install firefox` ustaw `TEST_FIREFOX=1`. W tym środowisku pobrany Firefox nie dał się uruchomić (spawn UNKNOWN); Chrome i Edge zostały rzeczywiście przetestowane.

`/?demo` uruchamia wyłącznie kompletną pierwszą salę i korytarz. Widok bez parametru zawiera całą kolekcję.

## Sterowanie i dostępność

WASD / strzałki: marsz; mysz: rozglądanie; Shift: szybszy marsz; E lub kliknięcie: szczegóły pracy; Esc: pauza / zamknięcie panelu. Ponowne kliknięcie „Wróć do zwiedzania” odzyskuje blokadę kursora. Plan muzeum umożliwia przeniesienie do sali. Brak skakania i kołysania kamery. Ustawienia obejmują czułość, ograniczenie animacji, dwa profile grafiki, cztery poziomy głośności, wyciszenie i pomiary.

Na telefonie polecany jest katalog HTML. `gallery.html` działa także bez JavaScript, z metadanymi, pełnymi obrazami i oryginalnymi linkami. Nie wymaga WebGL ani Pointer Lock. Strona artysty dostępna jest pod `artist.html`; jej oryginalna treść została zachowana.

## Moduły

| Plik | Odpowiedzialność |
|---|---|
| `src/scene.ts` | sceny, oświetlenie, selektywny bloom, profile jakości, pomiary, sprzątanie zasobów |
| `src/world/architecture.ts` | architektura, gabloty, instrumenty, instalacje, scalanie statycznej geometrii |
| `src/world/controller.ts` | FPP, Pointer Lock, przyspieszenie i ruch zależny od czasu |
| `src/world/collision.ts` | przeszkody, ślizganie przy ścianie, podłoża i stopnie |
| `src/effects/materialization.ts` | voxel assembly, shaderowy digital dissolve, structural reconstruction |
| `src/art/exhibits.ts` | proporcje obrazów, ramy, leniwe ładowanie tekstur, maksymalnie trzy równoczesne żądania |
| `src/art/interaction.ts` | raycasting, pojedyncza etykieta, linia od krawędzi obrazu |
| `src/audio/sound.ts` | Web Audio, cztery zestawy syntezy kroków, odległość, pogłos, dźwięki pozycyjne |
| `src/ui/ui.ts` | modalne panele, fokus, katalog, mapa, PL/EN, ustawienia |
| `src/data/artworks.json` | rzeczywiste dzieła, metadane, położenia i oryginalne adresy |
| `src/config.ts` | sale, kamera, prędkości, profile i parametry efektów |

## Dodawanie prac i sal

Dodaj plik oryginalny do `img/full`, miniaturę do `img/thumbs`, a rekord do `src/data/artworks.json`. Wprowadź niezmieniony tytuł i rzeczywisty URL, rozmiar pikseli, proporcje, wymiary wystawowe, położenie, obrót i `room`. `description: null` oznacza brak opisu w źródle. Nie dopisuj fikcyjnych informacji. Suma kontrolna `sha256` identyfikuje zachowany oryginał; dla nowych prac uzupełnij ją z pliku. Uruchom `npm run textures`, aby utworzyć WebP bez przycinania.

Dodaj definicję sali do `rooms` w `src/config.ts`, jej przestrzeń i połączenie w `Architecture`, granice kolizji i materiał podłogi w `floorAt`. Przypisz prace do nowego `room`. Modele GLB/glTF można później dołączyć w module architektury; w tej wersji geometria jest proceduralna, bez zbędnych modeli do pobierania. KTX2 nie jest potrzebne dla 18 umiarkowanych tekstur WebP.

Nie uruchamiaj ponownie `npm run audit` po ręcznych zmianach danych: to narzędzie migracji z zachowanego `gallery.html`, które regeneruje dane i oryginalną inwentaryzację. [Inwentaryzacja](docs/inventory.md), [oryginalne linki](docs/original-links.json) i [raport](docs/REPORT.md) opisują zakres migracji.

## Publikacja i przywrócenie

Dotychczasowe Pages publikowało `main` / root; Vite wymaga publikacji `dist`. Workflow w `.github/workflows/pages.yml` buduje sprawdzoną wersję na `main`; źródło Pages musi wskazywać GitHub Actions. Domena `pawelbatura.art` i CNAME pozostają zachowane. Workflow weryfikacji PR przechowuje też artefakt `museum-build`.

Oryginalna witryna: commit `a0356b4f723a00f423f349090f7da2521dc3aa39`. Lokalny tag `museum-original` zabezpiecza początek prac wraz z instrukcją. Przywracanie: utwórz gałąź od oryginalnego commitu i przeglądaj ją oddzielnie; nie wykonuj `reset --hard` na katalogu z niezapisanymi zmianami. Do przywrócenia oryginalnej publikacji wybierz ponownie Pages / Deploy from a branch / main / root po przywróceniu oryginalnych plików przez PR.

## Zachowane dane i ograniczenia

Wszystkie 18 oryginalnych JPG, 10 MP3, tytuły, metadane oraz adresy dzieł zachowano. Źródło zawiera błąd: Emergence ma URL Fractures. Pozostaje dokładnie taki sam i jest oznaczony w panelu oraz inwentaryzacji; nie znaleziono wiarygodnego zastępczego adresu. Przed korektą wymaga potwierdzenia artysty.

Dźwięki muzeum są własną syntezą; oryginalne MP3 wykorzystuje wyłącznie zachowana mapa dźwiękowa. Działanie Formularza jest zachowane, ale testy nie wysyłają rzeczywistych wiadomości. Automatyczne testy audio weryfikują stan kontekstu i synchronizację, nie subiektywne brzmienie. Szacunek pamięci tekstur nie jest rzeczywistym pomiarem VRAM; czas CPU nie oznacza czasu GPU. 60 FPS pozostaje celem zależnym od urządzenia. Safari i rzeczywiste telefony wymagają dodatkowego sprawdzenia.
