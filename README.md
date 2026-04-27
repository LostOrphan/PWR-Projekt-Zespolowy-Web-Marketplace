# Webapp marketplace
---
## Frontend
---
### Frontend setup:
> 1. Przed uruchomieniem:
> 1.1. $ npm install
> 1.2. $ npm install react-router-dom
>
> 2. Uruchomienie serwera lokalnego:
> 2.1. $ npm run dev
---
## Backend
---
### Backend API dostępne pod endpointem address:port/api/docs
---
### Backend setup:
> 1.1. Zainstaluj PostgreSQL + interpreter Python (zależnie od systemu używanego :) )
>
> 1.2.1. Utwórz przeznaczoną dla programu pustą bazę danych
> 
> 1.2.2. Przygotuj użytkownika PostgreSQL zabezpieczonego hasłem (niektóre instalacje PostgreSQL akceptują wszystkich bez hasła)
>
> 2. `cd backend`
>
> 3. Utwórz środowisko wirtualne Pythona (opcj.): `python -m venv venv`
> 
> 3.1. Uruchom środowisko:
> - dla Windows: `backend\venv\Scripts\activate`
> - dla Linux: `. venv/bin/activate`
> (Wyjście z `venv` wykonuje się poprzez komendę `deactivate`)
>
> 4. Instalacja wszystkich koniecznych bibliotek: `pip install -r requirements.txt`
>
> 5. Utwórz i uzupełnij plik `.env`:
> - `cp .env_example .env`
> - `vim .env`
> 
> 6. Wykonaj migrację bazy: `python manage.py migrate`
>
> 6.1. Uzupełnij teblice słownikowe:
> ```
> python manage.py seed_dictionaries
> python manage.py seed_locations <absolutna ścieżka do pliku miasta_polska.csv ponieważ python xd>
> ```
> 
> Opcjonalnie: Utworzenie konta administratora (daje dostęp do panelu admina pod adresem /admin/)
> ```python manage.py createsuperuser```
> 
> 7. Uruchomienie servera: `python manage.py runserver`
