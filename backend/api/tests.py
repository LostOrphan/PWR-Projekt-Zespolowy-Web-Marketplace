from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
import io
from PIL import Image

from .models import Category, Location, ListingStatus, Listing, DeliveryMethod, ListingImage, Order

User = get_user_model()

class MarketplaceAPITests(APITestCase):
    def setUp(self):
        # Przygotowanie adresów URL
        self.register_url = '/api/users/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/profile/'
        self.listings_url = '/api/listings/'
        self.categories_url = '/api/categories/'
        self.orders_url = '/api/orders/'

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
        
        # Bezpieczne przygotowanie statusów (get_or_create zapobiega błędom w bazie testowej)
        self.status_active, _ = ListingStatus.objects.get_or_create(name="Aktywne")
        self.status_deleted, _ = ListingStatus.objects.get_or_create(name="Usunięte")
        self.status_completed, _ = ListingStatus.objects.get_or_create(name="Zakończone")
        
        # Przygotowanie metody dostawy
        self.delivery_paczkomat = DeliveryMethod.objects.create(
            name="Paczkomat InPost", 
            description="Dostawa do paczkomatu"
        )
        
        # Czyszczenie pamięci podręcznej dla testów limitów (throttling)
        cache.clear()

    # ==========================================
    #           TESTY AUTORYZACJI I PROFILU
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

    def test_get_user_profile(self):
        """Test pobierania danych własnego profilu"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_update_user_profile_without_password(self):
        """Test edycji profilu (np. imienia) bez podawania hasła"""
        self.client.force_authenticate(user=self.user)
        patch_data = {"first_name": "Janusz"}
        response = self.client.patch(self.profile_url, patch_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Janusz")
        self.assertTrue(self.user.check_password(self.user_data["password"]))

    def test_update_user_profile_password(self):
        """Test zmiany hasła z poziomu edycji profilu"""
        self.client.force_authenticate(user=self.user)
        patch_data = {"password": "NoweBezpieczneHaslo123!"}
        response = self.client.patch(self.profile_url, patch_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NoweBezpieczneHaslo123!"))

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
    
    def test_owner_can_update_listing_with_images_and_delivery(self):
        """Właściciel powinien móc zaktualizować ogłoszenie, dodać zdjęcia i metody dostawy"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Original", price="100.00"
        )
        dm_courier = DeliveryMethod.objects.create(name="Kurier")

        self.client.force_authenticate(user=self.user)
        
        image_file = io.BytesIO()
        Image.new('RGB', (1, 1), 'blue').save(image_file, 'JPEG')
        image_file.seek(0)
        mock_image = SimpleUploadedFile(name='new_img.jpg', content=image_file.read(), content_type='image/jpeg')

        patch_data = {
            "title": "Updated", 
            "price": "150.00",
            "delivery_methods": [dm_courier.id],
            "uploaded_images": [mock_image]
        }
        url = f"{self.listings_url}{listing.id}/"
        response = self.client.patch(url, patch_data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        listing.refresh_from_db()
        self.assertEqual(listing.title, "Updated")
        self.assertEqual(str(listing.price), "150.00")
        self.assertIn(dm_courier, listing.delivery_methods.all())
        self.assertEqual(listing.images.count(), 1)

    def test_delete_listing_image(self):
        """Test poprawnego usuwania pojedynczego zdjęcia przez właściciela ogłoszenia"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Test Image Delete", price="10.00"
        )
        image = ListingImage.objects.create(listing=listing, image='dummy.jpg', display_order=0, is_primary=True)

        self.client.force_authenticate(user=self.user)
        url = f"{self.listings_url}{listing.id}/images/{image.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ListingImage.objects.filter(id=image.id).count(), 0)

    def test_non_owner_cannot_delete_listing_image(self):
        """Osoba niebędąca właścicielem ogłoszenia nie może usunąć z niego zdjęcia"""
        other_user = User.objects.create_user(
            email="hacker@student.pwr.edu.pl", password="HackerPass123!", first_name="Hack", last_name="Er"
        )
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Safe Item", price="100.00"
        )
        image = ListingImage.objects.create(listing=listing, image='safe.jpg', display_order=0)

        self.client.force_authenticate(user=other_user)
        url = f"{self.listings_url}{listing.id}/images/{image.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(ListingImage.objects.filter(id=image.id).count(), 1)

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
        
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, "Usunięte")
        
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
        
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, "Aktywne")

    def test_search_listings_by_title_and_description(self):
        """Wyszukiwanie powinno obejmować tytuł i opis"""
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
        """Tworzenie ogłoszenia z przekazanymi delivery_methods powinno zapisywać je w relacji"""
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
        """Przesyłane zdjęcia powinny mieć poprawny numer kolejności i flagę primary"""
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

    # ==========================================
    #        TESTY ZAMÓWIEŃ (Kup Teraz)
    # ==========================================
    def test_create_order_success_and_status_change(self):
        """Test poprawnego zakupu, zamrożenia ceny i zmiany statusu ogłoszenia"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Telefon", price="1200.50"
        )
        
        buyer = User.objects.create_user(
            email="kupujacy@student.pwr.edu.pl", password="Haslo123!", first_name="Kuba", last_name="Kupiec"
        )
        self.client.force_authenticate(user=buyer)
        
        order_data = {
            "listing": listing.id,
            "delivery_method": self.delivery_paczkomat.id,
            "delivery_details": "WRO123A, tel. 987654321"
        }
        
        response = self.client.post(self.orders_url, order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order = Order.objects.first()
        self.assertEqual(str(order.purchase_price), "1200.50")
        self.assertEqual(order.buyer, buyer)
        
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, "Zakończone")

    def test_cannot_buy_own_listing(self):
        """Użytkownik nie może kupić ogłoszenia, które sam wystawił"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_active,
            title="Moja rzecz", price="100.00"
        )
        self.client.force_authenticate(user=self.user)
        
        order_data = {
            "listing": listing.id,
            "delivery_method": self.delivery_paczkomat.id
        }
        response = self.client.post(self.orders_url, order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Nie możesz kupić własnego ogłoszenia.", response.data['listing'][0])

    def test_cannot_buy_inactive_listing(self):
        """Użytkownik nie może kupić ogłoszenia, które ma status inny niż 'Aktywne'"""
        listing = Listing.objects.create(
            seller=self.user, category=self.category_tech, status=self.status_completed,
            title="Sprzedana rzecz", price="100.00"
        )
        buyer = User.objects.create_user(email="buyer2@student.pwr.edu.pl", password="Pass123!")
        self.client.force_authenticate(user=buyer)
        
        order_data = {
            "listing": listing.id,
            "delivery_method": self.delivery_paczkomat.id
        }
        response = self.client.post(self.orders_url, order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("To ogłoszenie nie jest już dostępne do kupienia.", response.data['listing'][0])

    def test_order_history_returns_only_user_purchases(self):
        """Historia zakupów powinna zwracać tylko zamówienia zalogowanego użytkownika"""
        buyer1 = User.objects.create_user(email="buyer1@test.com", password="P1!")
        buyer2 = User.objects.create_user(email="buyer2@test.com", password="P2!")
        
        listing1 = Listing.objects.create(seller=self.user, category=self.category_tech, status=self.status_active, title="L1", price="10.00")
        listing2 = Listing.objects.create(seller=self.user, category=self.category_tech, status=self.status_active, title="L2", price="20.00")
        
        Order.objects.create(listing=listing1, buyer=buyer1, delivery_method=self.delivery_paczkomat, purchase_price="10.00")
        Order.objects.create(listing=listing2, buyer=buyer2, delivery_method=self.delivery_paczkomat, purchase_price="20.00")
        
        self.client.force_authenticate(user=buyer1)
        response = self.client.get(self.orders_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['listing'], listing1.id)

    # ==========================================
    #            TESTY THROTTLINGU 
    # ==========================================
    def test_login_throttling(self):
        """Test blokady logowania po 10 próbach (login: 10/minute)"""
        # 1. Wykonujemy 10 zapytań (wszystkie powinny przejść przez blokadę,
        # zwrócą 401 Unauthorized z powodu złego hasła, ale NIE 429)
        for _ in range(10):
            response = self.client.post(self.login_url, {
                'email': 'nieistniejacy@example.com',
                'password': 'bad_password'
            })
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            
        # 2. Jedenaste zapytanie powinno zostać zablokowane
        response = self.client.post(self.login_url, {
            'email': 'nieistniejacy@example.com',
            'password': 'bad_password'
        })
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_register_throttling(self):
        """Test blokady rejestracji po 3 próbach (register: 3/minute)"""
        # 1. Wykonujemy 3 poprawne żądania rejestracji
        for i in range(3):
            response = self.client.post(self.register_url, {
                'email': f'nowyuser{i}@example.com',
                'password': 'StrongPassword123!',
                'first_name': f'User{i}'
            })
            # Upewniamy się, że nie zwraca kodu 429
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            
        # 2. Czwarte zapytanie powinno zostać zablokowane
        response = self.client.post(self.register_url, {
            'email': 'nowyuser4@example.com',
            'password': 'StrongPassword123!',
            'first_name': 'User4'
        })
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        
    def test_create_offer_throttling(self):
        """Test blokady wystawiania ogłoszeń po 10 próbach (create_offer: 10/hour)"""
        # Autoryzujemy użytkownika zdefiniowanego w setUp
        self.client.force_authenticate(user=self.user) 
        
        listing_data = {
            'title': 'Testowe auto',
            'description': 'Opis auta',
            'price': '1000.00',
            'category': self.category_tech.id, 
            'location': self.location.id  
        }

        # 1. Tworzymy 10 ogłoszeń
        for _ in range(10):
            response = self.client.post(self.listings_url, listing_data)
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # 2. Jedenaste ogłoszenie w ciągu tej samej godziny powinno zwrócić błąd limitu
        response = self.client.post(self.listings_url, listing_data)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)