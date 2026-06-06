import random
import requests
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from faker import Faker

# Zaimportuj swoje modele
from api.models import Listing, ListingImage, Category, Location, DeliveryMethod, ListingStatus

User = get_user_model()

class Command(BaseCommand):
    help = 'Generuje przykładowe ogłoszenia ze zdjęciami.'

    def add_arguments(self, parser):
        parser.add_argument('count', type=int, help='Liczba ogłoszeń do wygenerowania') #1arg
        parser.add_argument('width', type=int, help='Szerokość pobieranych zdjęć (w pikselach)') #2arg
        parser.add_argument('height', type=int, help='Wysokość pobieranych zdjęć (w pikselach)') #3arg

    def handle(self, *args, **kwargs):
        count = kwargs['count']
        fake = Faker('pl_PL')
        count = kwargs['count']
        width = kwargs['width']
        height = kwargs['height']
        self.stdout.write(self.style.WARNING("Sprawdzanie dostępności słowników..."))
        
        categories = list(Category.objects.all())
        locations = list(Location.objects.all())
        delivery_methods = list(DeliveryMethod.objects.all())
        
        status_active, _ = ListingStatus.objects.get_or_create(name="Aktywne")

        if not categories or not locations or not delivery_methods:
            self.stderr.write(self.style.ERROR(
                "Błąd: Baza słowników jest pusta! "
                "Uruchom najpierw skrypty seedujące słowniki, metody dostawy i lokacje."
            ))
            return

        self.stdout.write(self.style.SUCCESS("Słowniki wczytane poprawnie."))
        self.stdout.write("Generowanie (lub wczytywanie) 5 przykładowych użytkowników...")

        users = []
        for i in range(1, 6): 
            email = f"seed_user_{i}@example.com"
            
            user = User.objects.filter(email=email).first()
            
            if not user:
                user = User.objects.create_user(
                    email=email,
                    password="SeedPassword123!",
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    phone_num=fake.phone_number()
                )
                self.stdout.write(f" -> Utworzono nowego użytkownika: {email}")
            else:
                self.stdout.write(f" -> Znaleziono użytkownika w bazie: {email} (pomijam tworzenie)")
                
            users.append(user)

        self.stdout.write(self.style.SUCCESS("Baza użytkowników gotowa."))
        self.stdout.write(f"Rozpoczynam pobieranie zdjęć i tworzenie {count} ogłoszeń...")

        for i in range(count):
            listing = Listing.objects.create(
                seller=random.choice(users),
                category=random.choice(categories),
                location=random.choice(locations),
                status=status_active,
                title=fake.catch_phrase().capitalize(), 
                description=fake.text(max_nb_chars=800), 
                price=Decimal(str(round(random.uniform(10.00, 5000.00), 2)))
            )

            random_delivery = random.choice(delivery_methods)
            listing.delivery_methods.add(random_delivery)

            try:
                # Wstrzykujemy zmienne width i height prosto do linku URL
                image_url = f'https://picsum.photos/{width}/{height}'
                response = requests.get(image_url, timeout=5)
                response.raise_for_status() 
                
                image_name = f"seed_img_{listing.id}_{width}x{height}.jpg"
                image_file = ContentFile(response.content, name=image_name)

                ListingImage.objects.create(
                    listing=listing,
                    image=image_file,
                    is_primary=True,
                    display_order=0
                )
            except requests.exceptions.RequestException as e:
                self.stderr.write(self.style.WARNING(
                    f"-> Ostrzeżenie: Nie udało się pobrać zdjęcia dla ogłoszenia '{listing.title}'. Powód: {e}"
                ))

            if (i + 1) % 5 == 0 or (i + 1) == count:
                self.stdout.write(f"Przetworzono {i + 1}/{count} ogłoszeń...")

        self.stdout.write(self.style.SUCCESS(
            f"\n Zakończono sukcesem! Utworzono {count} ogłoszeń przypisanych do testowych użytkowników."
        ))