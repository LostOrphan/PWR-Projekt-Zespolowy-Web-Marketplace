Webapp marketplace - FRONTEND EDITION

Przed uruchomieniem:
$ npm install
$ npm install react-router-dom

Uruchomienie serwera lokalnego:
$ npm run dev

DONE:
- Prototyp dla strony głównej, logowawnia oraz szczegółów produktów

TODO:
- Cosmetic changes
- Podstrony dla [rejestracja; formularz dodawania produktu; profil użyt; obswerwowane; przeglądanie kategorii; ]
- Logika logowania
- Logika rejestracji
- Logika wyświetlania produktów
- Logika dodawania ogłoszenia

Hierarchia plików:
/frontend
  /src
    App.jsx ("hub" podstron. Podstrony z /pages dodawane tutaj)
    /pages
      Home.jsx (Strona główna)
      Login.jsx (Strona logowania)
      ProductDetail.jsc (Strona produktu)
    /styles
      **[nazwa_strony].css (Stylowanie stron)**

![dog]("/dog.jpg")
