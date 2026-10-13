# Raport przebudowy

## Audyt

Oryginał: commit `a0356b4f723a00f423f349090f7da2521dc3aa39` repozytorium Batyskaf/pawelbatura. Struktura płaska: cztery strony HTML, wspólny CSS i JS, mapa dźwiękowa, `img/full`, `img/thumbs`, `img/hero`, `audio`. Bez CMS, zależności npm, skryptów budowania i testów. GitHub Pages: main / root, domena pawelbatura.art; ustawienie potwierdzono w zalogowanym Chrome. Brak istniejących AGENTS.md. Oryginalne URL i metadane znajdują się w inwentaryzacji. Brak opisów indywidualnych prac i modeli 3D został zapisany jako brak, bez generowania fikcyjnych danych.

## Zmiany

Nowy ekran wejścia i pełny muzealny spacer FPP. Kamienny gabinet z łukami, boazerią, kolumnadą i sferą armilarną; drewniany korytarz; mosiężne obserwatorium z narożnikami ośmiokątnymi, teleskopem, sklepieniem i podestem ze schodami; cyfrowe archiwum z instalacją przestrzenną, siatką i konstrukcjami podwieszonymi. Wszystkie prace rozmieszczono w trzech salach po sześć.

Prace mają autentyczne wymiary płócien: 1 metr sceny = 100 cm obrazu. Wielkości pochodzą z zachowanych metadanych, np. 40 × 60 cm = 0,4 × 0,6 m, a 140 × 100 cm = 1,4 × 1 m. Rama jest poza płótnem. Środki obrazów są na wysokości 1,70 m, a ramy mają co najmniej 8 cm odstępu ponad obniżoną listwą. Fotografia o innych proporcjach otrzymuje dopasowane wewnętrzne obramowanie i passe-partout. Fotografia mieści się w płótnie bez przycinania ani zmiany proporcji, w sRGB. Selektywny bloom obejmuje wyłącznie elementy emisyjne. Etykieta jest pojedyncza, połączona linią z krawędzią i wyzwalana spojrzeniem; panele zwalniają Pointer Lock. Linki mają target=_blank i rel=noopener noreferrer.

Materializacja jest przypisana do rzeczywistych całych obiektów: ścian korytarzy i archiwum, portali z łukami i kolumnami oraz podestu ze schodami. Nie są to zastępcze panele na stałych ścianach. Cząsteczki pochodzą z powierzchni prawdziwej geometrii, shader przekształca wszystkie jej części i ich cienie, a konstrukcje odtwarzają kolejne rzeczywiste elementy. Progi mają histerezę; kolizje nie zależą od efektów. Stałe podłoże, świetlne brzegi i trwały obrys schodów zapewniają orientację.

Druga komnata: trzy nakładające się, pulsujące pola tworzą wzory interferencyjne. Najpierw stabilizują się całe ściany, następnie ramy. Po przekroczeniu progu 0,84 następuje krytyczne wyłonienie sześciu obrazów; ich reveal trwa 1,2 s i nie zmienia kolorów ani wymiarów. Histereza 0,84/0,66 zapobiega migotaniu stanu. To artystyczna interpretacja idei pól i superpozycji, nie model kwantowej dynamiki.

Web Audio odtwarza pięć nagrań kamienia i pięć drewna dostarczonych przez użytkownika. Metal i podłoże cyfrowe pozostają syntetyczne. Rytm został zmniejszony do około 1,7 kroku/s podczas zwykłego marszu, najwyżej około 2,2 przy szybszym; zależy od czasu i rzeczywistego dystansu. Bez natychmiastowego powtarzania tej samej próbki. Pogłos, przestrzenny rezonans i impulsy rekonstrukcji mają osobne kanały. Audio uruchamia się po wejściu, menu i utrata fokusu je wstrzymują. Można wszystko wyciszyć.

Optymalizacja: współdzielone geometrie i materiały, scalenie architektury według materiału, instancjonowanie posadzki i cząsteczek, frustum culling Three.js, ukrywanie dalekich sal, leniwe ładowanie tekstur z ograniczeniem równoczesnych żądań, WebP o maksymalnym boku 1536 px, dwa profile grafiki, automatyczne obniżanie rozdzielczości, cieni, cząsteczek i bloom przy utrzymującym się niskim FPS. Panel pomiarów pokazuje FPS, CPU ms, draw calls, trójkąty, geometrie, tekstury i ich szacowaną pamięć, liczbę efektów oraz cząsteczek.

Technologie: Three.js 0.180, TypeScript, Vite, WebGL2, GLSL, Web Audio, HTML/CSS. React nie dodawałby korzyści do oryginalnej witryny. Proceduralna geometria nie wymaga GLB/KTX2; modułowa architektura pozostawia miejsce na takie zasoby.

## Weryfikacja

- TypeScript i produkcyjne budowanie Vite: zaliczone.
- Dziesięć testów jednostkowych/integracyjnych: zaliczone. Potwierdzone 18 prac, źródłowe URL, sumy kontrolne JPG, autentyczne centymetry i metry, zasoby, kolizje, podłoża, histereza, niezależność od FPS, etykiety, rytm kroków oraz odstęp nad listwą.
- Osiemnaście testów E2E w Chrome i Edge: zaliczone. Rzeczywiste zdarzenia klawiatury i Pointer Lock; chodzenie, zatrzymanie i blokowanie kroków, pauza i odzyskanie sterowania, dekodowanie 15 nagrań, ograniczenie ruchu, etykieta, panel i link, przejście do archiwum, lazy loading, katalog, PL/EN, 390 × 844 i portfolio bez JavaScript. Dodatkowo: brak WebGL, rekonstrukcja całych obiektów bez zmiany kolizji, skala w cm oraz kolejność stabilizacji ścian, ram i krytycznego wyłonienia obrazów.
- Oględziny sali demonstracyjnej i ekranu wejścia w Chrome oraz zrzutów archiwum i widoku mobilnego: wykonane.
- npm audit po aktualizacji sharp: zero zgłoszonych podatności.
- Firefox: pobranie powiodło się, uruchomienie procesu nie powiodło się (`spawn UNKNOWN`), więc testów Firefox nie zaliczono.
- Automatyczna weryfikacja HTTP wszystkich 17 unikalnych adresów dzieł: serwis Saatchi Art odpowiedział 403 na każde żądanie HEAD. Nie deklarujemy ich dostępności ani poprawności tożsamości na podstawie tych odpowiedzi. Dokładna zgodność z oryginalnymi URL jest potwierdzona osobno. Wyniki: `docs/external-link-check.json`.
- Po rozszerzeniu efektów na całe obiekty, próba Chrome: 319 draw calls, 100 897 trójkątów, 2048 widocznych cząsteczek, około 58 FPS i 4,4 ms CPU. Wynik dotyczy jednego środowiska i pojedynczej próbki, nie gwarantuje podobnych wyników na innych urządzeniach.

## Znane ograniczenia

Źródłowy link Emergence prowadzi do Fractures. Zachowano go z informacją; nie wymyślono zamiennika. Saatchi blokuje automatyczne sprawdzanie URL. Nie wysłano rzeczywistej wiadomości przez formularz. Nie testowano Safari ani fizycznego telefonu. Wynik w jednym środowisku nie dowodzi 60 FPS na każdym urządzeniu. CPU ms i oszacowanie VRAM są oznaczone zgodnie z zakresem pomiaru. Kroki na każdym podłożu korzystają wyłącznie z dostarczonych MP3. Metal używa Stone, podłoże cyfrowe Dirt.

## Obsługa i dalsza rozbudowa

Instrukcje uruchomienia, dodawania prac i sal, modułów i publikacji są w README. Kolejne kroki: zatwierdzenie właściwego adresu Emergence przez artystę, testy Safari i urządzeń mobilnych, jakościowe odsłuchy kroków, opcjonalne autorskie modele GLB i wypieczone materiały architektury, dalsze wystawy tematyczne. Nie jest potrzebny panel administracyjny; dane są niezależne od renderowania.


Aktualizacja 13.10.2026: pełne ściany wszystkich sal (boczne, czołowe, narożne) i sufity mają efekty krystalizacji. Przy stanie 0 nie renderują powierzchni ani cząsteczek, kolizje pozostają stałe. Półsfera 0,45 i światło kierunkowe 0,65 zastępują wcześniejsze natężenia 2. Środki obecnych prac: 1,70 m; listwa: górna krawędź 1,02 m. Ciągłe ramy i passe-partout w przypadku sprzecznych proporcji fotografii/metadanych. Exaltation ma źródłową fotografię 4:3 i metadane 60 × 70 cm; oba zachowano. Wszystkie kroki są odtwarzane wyłącznie z 15 dostarczonych MP3. 18 przypadków E2E zaliczono w Chrome/Edge; jeden przypadek Chrome powtórzono po zakończeniu zapisu danych, który przeładował podgląd w trakcie pierwszego przebiegu. Próbka obciążenia: 290 wywołań rysowania, 239155 trójkątów, 8192 aktywne cząsteczki, około 58 FPS.
