# Webapp marketplace



## Backend

### Backend API dostępne pod endpointem address:port/api/docs

### Backend setup:
> 1. Instalacja PSQL 17.9 oraz utworzenie pustej bazy danych oraz użytkownika z hasłem + posiadanie pythona (3.12+)
>   
>   Linux:
>   Utworzenie użytkownika z hasłem
>   ```sudo -u postgres psql -c "CREATE USER nazwa_uzytkownika WITH PASSWORD 'TwojeSuperHaslo123';"```
>
>   Utworzenie bazy danych z przypisaniem właściciela
>  ``` sudo -u postgres psql -c "CREATE DATABASE nazwa_bazy OWNER nazwa_uzytkownika;"```
>
>   Windows:
>   Utworzenie użytkownika z hasłem
>   ```psql -U postgres -c "CREATE USER nazwa_uzytkownika WITH PASSWORD 'TwojeSuperHaslo123';"```
>
>   Utworzenie bazy danych z przypisaniem właściciela
>   ```psql -U postgres -c "CREATE DATABASE nazwa_bazy OWNER nazwa_uzytkownika;"```
> 2. Przejście do katalogu ```backend```
> ```cd backend```
>
> 3. Utworzenie środowiska Python:
> ``` python -m venv venv ```
>
>   Jeśli domyślnie nie uruchomiło się środowisko, należy uruchomić je poprzez uruchomienie:
>
>   Windows: ```backend\venv\Scripts\activate```
>
>   Linux: ```source venv/bin/activate```
>
> (wyłączenie venv wykonuje się poprzez wpisanie deactivate)
>
> 3. Instalacja wszystkich używanych bibliotek:
> ``` pip install -r requirements.txt```
>
> 4. Utworzenie w folderze backend pliku .env zgodnie z .env_example + wypełnienie danymi
> 5. Migracja bazy:
> ``` python manage.py migrate ```
>
> 6. Wykonanie poleceń zapełniających tabele słownikowe
> ``` 
> python manage.py seed_dictionaries
> python.exe manage.py seed_locations [pełna ścieżka do pliku]\miasta_polska.csv
> ```
> Opcjonalnie: Utworzenie konta administratora (daje dostęp do panelu admina pod adresem /admin/)
> 
> ```python manage.py createsuperuser```
> 
> 7. Uruchomienie servera:
> ```python manage.py runserver```
