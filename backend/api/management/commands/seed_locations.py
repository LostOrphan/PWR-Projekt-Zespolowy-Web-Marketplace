import csv
import os
from django.core.management.base import BaseCommand
from api.models import Location

class Command(BaseCommand):
    help = 'Wgrywa listę miast z pliku CSV do bazy danych'

    def add_arguments(self, parser):
        # Jeden argument, ścieżka do pliku csv
        parser.add_argument('csv_file', type=str, help='Pełna ścieżka do pliku CSV z miastami')

    def handle(self, *args, **kwargs):
        csv_path = kwargs['csv_file']
        
        # Czy plik istnieje
        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f'Błąd: Plik {csv_path} nie istnieje!'))
            return

        self.stdout.write(self.style.WARNING('Rozpoczynam wgrywanie miast z pliku...'))
        
        created_count = 0
        
        # Otwieramy plik CSV
        with open(csv_path, newline='', encoding='utf-8') as f:
            # delimeter == ,
            reader = csv.reader(f, delimiter=',') 
            
            # pominięcie nagłówków
            next(reader, None) 
            
            for row in reader:
                if row:
                    city_name = row[0].strip()   # Pierwsza kolumna
                    województwo = row[1].strip() # Druga kolumna
                    country_name = row[2].strip() # Trzecia kolumna

                    location, created = Location.objects.get_or_create(
                        city=city_name,
                        region=województwo,
                        defaults={'country': country_name}
                    )
                    
                    if created:
                        created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Zakończono sukcesem! Dodano {created_count} nowych miast do bazy.'))