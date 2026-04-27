from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Category, Location, ListingStatus, Listing, DeliveryMethod
import io
from PIL import Image

User = get_user_model()

class MarketplaceAPITests(APITestCase):
    def setUp(self):
        # Przygotowanie adresów URL
        self.register_url = '/api/users/register/'
        self.login_url = '/api/auth/login/'
        self.listings_url = '/api/listings/'
        self.categories_url = '/api/categories/'

        # Przygotowanie danych testowych użytkownika
        self.user_data = {
            "email": "jan.kowalski@student.pwr.edu.pl",
            "password": "SuperTajneHaslo123!",
            "first_name": "Jan",
            "last_name": "Kowalski"
        }
        self.user = User.objects.create_user(**self.user_data)

        # Przygotowanie słowników w bazie
        self.category_tech = Category.objects.create(name="Elektronika")
        self.category_books = Category.objects.create(name="Książki")
        self.location = Location.objects.create(city="Wrocław", country="Polska")
        
        # Przygotowanie statusów do testów cyklu życia ogłoszenia
        self.status_active = ListingStatus.objects.create(name="Aktywne")
        self.status_deleted = ListingStatus.objects.create(name="Usunięte")
        self.status_completed = ListingStatus.objects.create(name="Zakończone")

    # ==========================================
    #           TESTY AUTORYZACJI
    # ==========================================
    def test_user_registration(self):
        """Test poprawnej rejestracji nowego użytkownika"""
        new_user_data = {
            "email": "nowy@student.pwr.edu.pl",
            "password": "InneHaslo123!",
            "first_name": "Anna",
            "last_name": "Nowak"
        }
        response = self.client.post(self.register_url, new_user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2) 
        self.assertNotIn('password', response.data) 

    def test_user_login(self):
        """Test logowania i poprawnego zwrotu tokenów JWT"""
        login_data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"]
        }
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    # ==========================================
    #       TESTY UPRAWNIEŃ I SŁOWNIKÓW
    # ==========================================
    def test_get_categories_allowed_for_anyone(self):
        """Test pobierania kategorii bez logowania"""
        response = self.client.get(self.categories_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_create_category_blocked(self):
        """Test blokady tworzenia kategorii przez API"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.categories_url, {"name": "Motoryzacja"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    #        TESTY OGŁOSZEŃ (Listings)
    # ==========================================
    def test_create_listing_without_auth_fails(self):
        """Test weryfikujący czy niezalogowany użytkownik dostanie błąd 401"""
        listing_data = {
            "title": "Sprzedam Rower",
            "price": "500.00",
            "category": self.category_tech.id
        }
        response = self.client.post(self.listings_url, listing_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_listing_sets_default_status_active(self):
        """Test czy nowo utworzone ogłoszenie domyślnie otrzymuje status 'Aktywne'"""
        self.client.force_authenticate(user=self.user)
        listing_data = {
            "title": "Konsola",
            "price": "1000.00",
            "category": self.category_tech.id
            # Zauważ: Nie wysyłamy pola status!
        }
        response = self.client.post(self.listings_url, listing_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_listing = Listing.objects.first()
        self.assertEqual(created_listing.status.name, "Aktywne")

    def test_create_listing_with_auth_and_image(self):
        """Test poprawnego dodawania ogłoszenia wraz z przesłaniem zdjęcia"""
        self.client.force_authenticate(user=self.user)
        
        image_file = io.BytesIO()
        image = Image.new('RGB', (1, 1), 'white')
        image.save(image_file, 'JPEG')
        image_file.seek(0) 

        mock_image = SimpleUploadedFile(
            name='test_image.jpg', 
            content=image_file.read(), 
            content_type='image/jpeg'
        )

        listing_data = {
            "title": "Laptop",
            "price": "2500.00",
            "category": self.category_tech.id,
            "uploaded_images": [mock_image]
        }
        
        response = self.client.post(self.listings_url, listing_data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Listing.objects.count(), 1)
        
        created_listing = Listing.objects.first()
        self.assertEqual(created_listing.seller, self.user)
        self.assertEqual(created_listing.images.count(), 1)

    def test_get_listing_returns_nested_seller(self):
        """Test sprawdzający zagnieżdżony serializator sprzedawcy"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Biurko", price="150.00"
        )
        url = f"{self.listings_url}{listing.id}/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['seller'], dict)
        self.assertEqual(response.data['seller']['first_name'], "Jan")
        self.assertEqual(response.data['seller']['email'], "jan.kowalski@student.pwr.edu.pl")

    def test_listing_filtering_by_category(self):
        """Test filtrowania ogłoszeń po ID kategorii"""
        Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Myszka", price="100.00"
        )
        Listing.objects.create(
            seller=self.user, category=self.category_books, status=self.status_active,
            title="Wiedźmin", price="40.00"
        )

        url = f"{self.listings_url}?category={self.category_books.id}"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], "Wiedźmin")
    
    def test_owner_can_update_listing(self):
        """Właściciel powinien móc zaktualizować swoje ogłoszenie"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Original", price="100.00"
        )
        self.client.force_authenticate(user=self.user)
        patch_data = {"title": "Updated", "price": "150.00"}
        url = f"{self.listings_url}{listing.id}/"
        response = self.client.patch(url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        listing.refresh_from_db()
        self.assertEqual(listing.title, "Updated")
        self.assertEqual(str(listing.price), "150.00")

    def test_non_owner_cannot_update_listing(self):
        """Osoba niebędąca właścicielem nie może zaktualizować obcego ogłoszenia"""
        other = User.objects.create_user(
            email="other@student.pwr.edu.pl", password="OtherPass123!", first_name="Other", last_name="User"
        )
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Not yours", price="50.00"
        )
        self.client.force_authenticate(user=other)
        patch_data = {"title": "Hacked"}
        url = f"{self.listings_url}{listing.id}/"
        response = self.client.patch(url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_change_status_via_custom_endpoint(self):
        """Właściciel może zmienić status ogłoszenia używając customowej akcji change_status"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Sprzedany towar", price="50.00"
        )
        self.client.force_authenticate(user=self.user)
        
        url = f"{self.listings_url}{listing.id}/change_status/"
        patch_data = {"status": "Zakończone"}
        
        response = self.client.patch(url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, "Zakończone")

    def test_owner_can_delete_listing_soft_delete(self):
        """Właściciel powinien móc usunąć ogłoszenie (Soft Delete)"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="DeleteMe", price="20.00"
        )
        self.client.force_authenticate(user=self.user)
        url = f"{self.listings_url}{listing.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Obiekt nadal powinien być w bazie, ale ze zmienionym statusem
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, "Usunięte")
        
        # Obiekt nie powinien być widoczny w standardowym listowaniu (wymaga filtra .exclude w widoku)
        get_response = self.client.get(self.listings_url)
        titles = [item['title'] for item in get_response.data['results']]
        self.assertNotIn("DeleteMe", titles)

    def test_non_owner_cannot_delete_listing(self):
        """Osoba niebędąca właścicielem nie może usunąć ogłoszenia"""
        other = User.objects.create_user(
            email="deleter@student.pwr.edu.pl", password="DelPass123!", first_name="Deleter", last_name="User"
        )
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Protected", price="75.00"
        )
        self.client.force_authenticate(user=other)
        url = f"{self.listings_url}{listing.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Upewniamy się, że obiekt nadal ma status Aktywne
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, "Aktywne")

    def test_search_listings_by_title_and_description(self):
        """Wyszukiwanie powinno obejmować tytuł i opis (nie zwracając uwagi na wielkość liter)"""
        Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Red Bike", description="A fast red bicycle", price="100.00"
        )
        Listing.objects.create(
            seller=self.user, category=self.category_books, status=self.status_active,
            title="Blue Book", description="A blue story", price="10.00"
        )
        Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Old Laptop", description="Red casing", price="200.00"
        )
        
        response = self.client.get(f"{self.listings_url}?search=red")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        titles = [r['title'] for r in response.data['results']]
        self.assertIn("Red Bike", titles)
        self.assertIn("Old Laptop", titles)
        self.assertNotIn("Blue Book", titles)

    def test_create_listing_with_delivery_methods_sets_m2m(self):
        """Tworzenie ogłoszenia z przekazanymi delivery_methods powinno zapisywać je w relacji ManyToMany"""
        dm1 = DeliveryMethod.objects.create(name="Pickup")
        dm2 = DeliveryMethod.objects.create(name="Courier")
        self.client.force_authenticate(user=self.user)
        
        listing_data = {
            "title": "Item with delivery",
            "price": "15.00",
            "category": self.category_tech.id,
            "delivery_methods": [dm1.id, dm2.id]
        }
        response = self.client.post(self.listings_url, listing_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        listing = Listing.objects.first()
        self.assertEqual(list(listing.delivery_methods.order_by('id').values_list('id', flat=True)), [dm1.id, dm2.id])

    def test_uploaded_images_primary_assignment_and_order(self):
        """Przesyłane zdjęcia powinny mieć poprawny numer kolejności i ustawioną flagę primary dla pierwszego"""
        self.client.force_authenticate(user=self.user)
        image_files = []
        for i in range(2):
            b = io.BytesIO()
            Image.new('RGB', (1, 1), 'white').save(b, 'JPEG')
            b.seek(0)
            image_files.append(SimpleUploadedFile(name=f'test_{i}.jpg', content=b.read(), content_type='image/jpeg'))

        listing_data = {
            "title": "With images",
            "price": "300.00",
            "category": self.category_tech.id,
            "uploaded_images": image_files
        }
        response = self.client.post(self.listings_url, listing_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        listing = Listing.objects.first()
        self.assertEqual(listing.images.count(), 2)
        ordered = list(listing.images.order_by('display_order').values_list('is_primary', flat=True))
        self.assertTrue(ordered[0])
        self.assertFalse(ordered[1])

    def test_listings_pagination_default(self):
        """Paginacja powinna domyślnie zwracać PAGE_SIZE (10) wyników"""
        for i in range(12):
            Listing.objects.create(
                seller=self.user, category=self.category_tech, status=self.status_active,
                title=f"Item {i}", price="1.00"
            )
        response = self.client.get(self.listings_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 12)
        self.assertEqual(len(response.data['results']), 10)