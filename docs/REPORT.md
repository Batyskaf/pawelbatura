# Raport przebudowy

## Audyt

Oryginał: commit `a0356b4f723a00f423f349090f7da2521dc3aa39` repozytorium Batyskaf/pawelbatura. Struktura płaska: cztery strony HTML, wspólny CSS i JS, mapa dźwiękowa, `img/full`, `img/thumbs`, `img/hero`, `audio`. Bez CMS, zależności npm, skryptów budowania i testów. GitHub Pages: main / root, domena pawelbatura.art; ustawienie potwierdzono w zalogowanym Chrome. Brak istniejących AGENTS.md. Oryginalne URL i metadane znajdują się w inwentaryzacji. Brak opisów indywidualnych prac i modeli 3D został zapisany jako brak, bez generowania fikcyjnych danych.

## Zmiany

Nowy ekran wejścia i pełny muzealny spacer FPP. Kamienny gabinet z łukami, boazerią, kolumnadą i sferą armilarną; drewniany korytarz; mosiężne obserwatorium z narożnikami ośmiokątnymi, teleskopem, sklepieniem i podestem ze schodami; cyfrowe archiwum z instalacją przestrzenną, siatką i konstrukcjami podwieszonymi. Wszystkie prace rozmieszczono w trzech salach po sześć.

Prace są eksponowane w ramie bez przycinania i z proporcjami wyliczonymi z rzeczywistych plików, w przestrzeni sRGB, bez zmiany kolorów przez lampy lub postprocessing. Selektywny bloom obejmuje wyłącznie elementy emisyjne. Etykieta jest pojedyncza, połączona linią z krawędzią i wyzwalana spojrzeniem; panele zwalniają Pointer Lock. Linki mają target=_blank i rel=noopener noreferrer.

Materializacja: instancjonowane woksele składają się z rozproszenia w powierzchnię; shader odrzuca fragmenty według szumu i postępu; konstrukcja odbudowuje się kolejno z belek. Progi mają histerezę. Kolizje nigdy nie zależą od stanu efektów. Stałe podłoże i świetlne brzegi korytarzy zapewniają orientację.

Web Audio tworzy cztery zestawy wariantów kroków (stone/wood/metal/digital), mierzy przebytą odległość i dodaje niewielkie różnice stroju oraz głośności. Pogłos, przestrzenny rezonans i impulsy rekonstrukcji mają osobne kanały. Audio uruchamia się po wejściu, menu i utrata fokusu je wstrzymują. Można wszystko wyciszyć.

Optymalizacja: współdzielone geometrie i materiały, scalenie architektury według materiału, instancjonowanie posadzki i cząsteczek, frustum culling Three.js, ukrywanie dalekich sal, leniwe ładowanie tekstur z ograniczeniem równoczesnych żądań, WebP o maksymalnym boku 1536 px, dwa profile grafiki, automatyczne obniżanie rozdzielczości, cieni, cząsteczek i bloom przy utrzymującym się niskim FPS. Panel pomiarów pokazuje FPS, CPU ms, draw calls, trójkąty, geometrie, tekstury i ich szacowaną pamięć, liczbę efektów oraz cząsteczek.

Technologie: Three.js 0.180, TypeScript, Vite, WebGL2, GLSL, Web Audio, HTML/CSS. React nie dodawałby korzyści do oryginalnej witryny. Proceduralna geometria nie wymaga GLB/KTX2; modułowa architektura pozostawia miejsce na takie zasoby.

## Weryfikacja

- TypeScript i produkcyjne budowanie Vite: zaliczone.
- Osiem testów jednostkowych/integracyjnych: zaliczone. Potwierdzone 18 prac, identyczne źródłowe URL, sumy kontrolne oryginalnych JPG, proporcje, dostępność zasobów, kolizje i brak tunelowania, podłoża, progi histerezy, niezależność animacji od FPS i umieszczanie etykiet poza obrazem.
- Dwanaście testów E2E w Chrome i Edge: zaliczone. Rzeczywiste zdarzenia klawiatury i Pointer Lock; chodzenie, zatrzymanie i blokowanie kroków, pauza i odzyskanie sterowania, ograniczenie ruchu, etykieta, panel i oryginalny link, przejście do archiwum, lazy loading, katalog, PL/EN, 390 × 844 i portfolio bez JavaScript. Dodatkowo: brak WebGL i obciążenie wielu efektów bez zmiany kolizji.
- Oględziny sali demonstracyjnej i ekranu wejścia w Chrome oraz zrzutów archiwum i widoku mobilnego: wykonane.
- npm audit po aktualizacji sharp: zero zgłoszonych podatności.
- Firefox: pobranie powiodło się, uruchomienie procesu nie powiodło się (`spawn UNKNOWN`), więc testów Firefox nie zaliczono.
- Automatyczna weryfikacja HTTP wszystkich 17 unikalnych adresów dzieł: serwis Saatchi Art odpowiedział 403 na każde żądanie HEAD. Nie deklarujemy ich dostępności ani poprawności tożsamości na podstawie tych odpowiedzi. Dokładna zgodność z oryginalnymi URL jest potwierdzona osobno. Wyniki: `docs/external-link-check.json`.
- W próbie obciążenia Chrome: 294 draw calls, 70 315 trójkątów, 720 widocznych cząsteczek, około 56 FPS i 1,7 ms CPU. Wynik dotyczy jednego środowiska i pojedynczej próbki, nie gwarantuje podobnych wyników na innych urządzeniach.

## Znane ograniczenia

Źródłowy link Emergence prowadzi do Fractures. Zachowano go wraz z czytelną informacją; nie wymyślono zamiennika. Zewnętrzny serwis może blokować automatyczne sprawdzanie URL. Nie wysłano wiadomości przez rzeczywisty formularz. Nie testowano Safari ani fizycznego telefonu. Profil wydajności w jednym środowisku nie dowodzi 60 FPS na wszystkich urządzeniach. CPU ms i oszacowanie VRAM są oznaczone zgodnie z rzeczywistym zakresem pomiaru. Synteza audio ma warianty, ale nie jest zestawem profesjonalnych nagrań foley.

## Obsługa i dalsza rozbudowa

Instrukcje uruchomienia, dodawania prac i sal, modułów i publikacji są w README. Kolejne kroki: zatwierdzenie właściwego adresu Emergence przez artystę, testy Safari i urządzeń mobilnych, jakościowe odsłuchy kroków, opcjonalne autorskie modele GLB i wypieczone materiały architektury, dalsze wystawy tematyczne. Nie jest potrzebny panel administracyjny; dane są niezależne od renderowania.
