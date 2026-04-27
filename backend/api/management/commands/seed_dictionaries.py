from django.core.management.base import BaseCommand
from api.models import Category, ListingStatus, DeliveryMethod 

class Command(BaseCommand):
    help = 'Wypełnia bazę danych podstawowymi słownikami: Kategoriami, Statusami i Metodami Dostawy wraz z ich opisami'

    def handle(self, *args, **kwargs):
        # Definicja kategorii jako słownik name,description
        categories = [
            {
                "name": "Elektronika", 
                "description": "Telefony, laptopy, sprzęt RTV i AGD oraz gadżety technologiczne."
            },
            {
                "name": "Motoryzacja", 
                "description": "Samochody osobowe, motocykle, części zamienne i akcesoria."
            },
            {
                "name": "Nieruchomości", 
                "description": "Mieszkania, domy i działki na sprzedaż oraz wynajem."
            },
            {
                "name": "Dom i Ogród", 
                "description": "Meble, wyposażenie wnętrz, narzędzia oraz materiały budowlane."
            },
            {
                "name": "Moda", 
                "description": "Ubrania damskie, męskie, obuwie, biżuteria i dodatki."
            }
        ]
        
        # Definicja statusów
        statuses = [
            "Aktywne","Usunięte" , "Zakończone", "Szkic", "Ukryte", "Zablokowane"
        ]
        
        # Definicja sposobów dostawy jako słowniki name,description
        delivery_methods = [
            {
                "name": "Odbiór osobisty", 
                "description": "Kupujący odbiera przedmiot bezpośrednio od sprzedającego."
            },
            {
                "name": "Paczkomat InPost", 
                "description": "Szybka wysyłka do wybranego automatu paczkowego InPost."
            },
            {
                "name": "Kurier DPD", 
                "description": "Dostawa kurierska realizowana bezpośrednio pod wskazany adres."
            },
            {
                "name": "Poczta Polska", 
                "description": "Wysyłka listem poleconym lub paczką pocztową."
            }
        ]

        # Wgranie kategorii
        self.stdout.write('Wgrywanie kategorii...')
        for cat in categories:
            # if not exists, create
            obj, created = Category.objects.get_or_create(
                name=cat["name"],
                defaults={"description": cat["description"]}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f' + Dodano kategorię: {cat["name"]}'))

        # Wgranie statusów
        self.stdout.write('\nWgrywanie statusów...')
        for index, status_name in enumerate(statuses, start=1):
            obj, created = ListingStatus.objects.get_or_create(
                id=index, 
                defaults={'name': status_name}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f' + Dodano status: {status_name} (ID: {index})'))

        # Wgranie metod dostawy
        self.stdout.write('\nWgrywanie metod dostawy...')
        for method in delivery_methods:
            obj, created = DeliveryMethod.objects.get_or_create(
                name=method["name"],
                defaults={"description": method["description"]}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f' + Dodano metodę: {method["name"]}'))

        self.stdout.write(self.style.SUCCESS('\nPomyślnie załadowano wszystkie podstawowe słowniki wraz z opisami!'))