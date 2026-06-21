import io
import shutil
import tempfile

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, DeliveryMethod, Listing, ListingImage, ListingStatus, Location, Order


User = get_user_model()


class MarketplaceAPITests(APITestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp(prefix='marketplace-test-media-')
        self.media_override = override_settings(MEDIA_ROOT=self.media_root)
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)
        self.addCleanup(shutil.rmtree, self.media_root, ignore_errors=True)

        self.register_url = '/api/users/register/'
        self.login_url = '/api/auth/login/'
        self.refresh_url = '/api/auth/refresh/'
        self.profile_url = '/api/profile/'
        self.listings_url = '/api/listings/'
        self.categories_url = '/api/categories/'
        self.locations_url = '/api/locations/'
        self.delivery_methods_url = '/api/delivery-methods/'
        self.orders_url = '/api/orders/'

        self.user_password = 'SuperTajneHaslo123!'
        self.other_password = 'OtherPassword123!'
        self.buyer_password = 'BuyerPassword123!'

        self.user = User.objects.create_user(
            email='jan.kowalski@student.pwr.edu.pl',
            password=self.user_password,
            first_name='Jan',
            last_name='Kowalski',
            phone_num='123456789',
        )
        self.other_user = User.objects.create_user(
            email='other.user@student.pwr.edu.pl',
            password=self.other_password,
            first_name='Other',
            last_name='User',
            phone_num='987654321',
        )
        self.buyer_user = User.objects.create_user(
            email='buyer.user@student.pwr.edu.pl',
            password=self.buyer_password,
            first_name='Buyer',
            last_name='User',
            phone_num='555444333',
        )

        self.category_tech = Category.objects.create(name='Elektronika', description='Sprzęt elektroniczny')
        self.category_books = Category.objects.create(name='Książki', description='Książki i publikacje')
        self.location = Location.objects.create(city='Wrocław', region='Dolnośląskie', country='Polska')

        self.status_active, _ = ListingStatus.objects.get_or_create(name='Aktywne')
        self.status_deleted, _ = ListingStatus.objects.get_or_create(name='Usunięte')
        self.status_completed, _ = ListingStatus.objects.get_or_create(name='Zakończone')

        self.delivery_pickup = DeliveryMethod.objects.create(
            name='Odbiór osobisty',
            description='Odbiór osobisty u sprzedawcy',
        )
        self.delivery_courier = DeliveryMethod.objects.create(
            name='Kurier',
            description='Dostawa kurierska',
        )

    def _auth_headers(self, user):
        access_token = str(RefreshToken.for_user(user).access_token)
        return {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}

    def _make_image_file(self, name='test.jpg', color='white'):
        image_buffer = io.BytesIO()
        Image.new('RGB', (1, 1), color=color).save(image_buffer, format='JPEG')
        image_buffer.seek(0)
        return SimpleUploadedFile(name=name, content=image_buffer.read(), content_type='image/jpeg')

    def _base_listing_payload(self, **overrides):
        payload = {
            'title': 'Sprzedam biurko',
            'description': 'Solidne biurko w bardzo dobrym stanie',
            'price': '199.99',
            'category': str(self.category_tech.id),
            'location': str(self.location.id),
            'street': 'Kwiatowa 1',
            'building_number': '12A',
            'apartment_number': '4',
        }
        payload.update(overrides)
        return payload

    def _create_listing_model(self, seller=None, title='Listing', status=None, with_delivery_methods=True, location=None):
        seller = seller or self.user
        status = status or self.status_active
        listing = Listing.objects.create(
            seller=seller,
            category=self.category_tech,
            location=location or self.location,
            status=status,
            title=title,
            description='Opis ogłoszenia',
            street='Kwiatowa 1',
            building_number='12A',
            apartment_number='4',
            price='199.99',
        )
        if with_delivery_methods:
            listing.delivery_methods.set([self.delivery_pickup])
        return listing

    def _extract_items(self, response):
        if isinstance(response.data, list):
            return response.data
        if isinstance(response.data, dict) and 'results' in response.data:
            return response.data['results']
        return response.data

    def _create_listing_image(self, listing, name='listing.jpg', color='red', display_order=0, is_primary=True):
        return ListingImage.objects.create(
            listing=listing,
            image=self._make_image_file(name=name, color=color),
            display_order=display_order,
            is_primary=is_primary,
        )

    # ----------------------
    # Auth and profile
    # ----------------------
    def test_user_registration_success(self):
        payload = {
            'email': 'nowy.student@student.pwr.edu.pl',
            'password': 'InneHaslo123!',
            'first_name': 'Anna',
            'last_name': 'Nowak',
            'phone_num': '111222333',
        }

        response = self.client.post(self.register_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(User.objects.filter(email=payload['email']).exists())
        self.assertNotIn('password', response.data)

    def test_user_registration_requires_password(self):
        payload = {
            'email': 'brak.hasla@student.pwr.edu.pl',
            'first_name': 'Brak',
            'last_name': 'Hasla',
            'phone_num': '111222444',
        }

        response = self.client.post(self.register_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_user_registration_rejects_duplicate_email(self):
        payload = {
            'email': self.user.email,
            'password': 'DuplicatePassword123!',
            'first_name': 'Duplicate',
            'last_name': 'User',
            'phone_num': '999888777',
        }

        response = self.client.post(self.register_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login_returns_tokens(self):
        response = self.client.post(
            self.login_url,
            {'email': self.user.email, 'password': self.user_password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_rejects_wrong_password(self):
        response = self.client.post(
            self.login_url,
            {'email': self.user.email, 'password': 'wrong-password'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_returns_new_access_token(self):
        login_response = self.client.post(
            self.login_url,
            {'email': self.user.email, 'password': self.user_password},
            format='json',
        )

        response = self.client.post(self.refresh_url, {'refresh': login_response.data['refresh']}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn('access', response.data)

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_get_with_jwt(self):
        response = self.client.get(self.profile_url, **self._auth_headers(self.user))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_profile_patch_updates_fields(self):
        payload = {
            'first_name': 'Janusz',
            'last_name': 'Kowalski',
            'email': self.user.email,
            'phone_num': '999888777',
        }
        response = self.client.patch(self.profile_url, payload, format='json', **self._auth_headers(self.user))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Janusz')
        self.assertEqual(self.user.phone_num, '999888777')

    def test_profile_patch_changes_password(self):
        new_password = 'NoweBezpieczneHaslo123!'
        response = self.client.patch(
            self.profile_url,
            {'password': new_password},
            format='json',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

    # ----------------------
    # Public dictionary APIs
    # ----------------------
    def test_categories_are_public(self):
        response = self.client.get(self.categories_url)
        items = self._extract_items(response)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(items), 2)

    def test_locations_are_public(self):
        response = self.client.get(self.locations_url)
        items = self._extract_items(response)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(items), 1)

    def test_delivery_methods_are_public(self):
        response = self.client.get(self.delivery_methods_url)
        items = self._extract_items(response)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(items), 2)

    # ----------------------
    # Listings and permissions
    # ----------------------
    def test_public_listing_list_excludes_deleted_items(self):
        active_listing = self._create_listing_model(title='Widoczny')
        self._create_listing_model(title='Usunięty', status=self.status_deleted)

        response = self.client.get(self.listings_url)
        items = self._extract_items(response)
        titles = [item['title'] for item in items]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(active_listing.title, titles)
        self.assertNotIn('Usunięty', titles)

    def test_listing_retrieve_is_public_and_masks_phone_number(self):
        listing = self._create_listing_model(title='Krzeslo')
        self._create_listing_image(listing, name='chair.jpg', color='blue', display_order=0, is_primary=True)

        response = self.client.get(f'{self.listings_url}{listing.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['seller'], dict)
        self.assertEqual(response.data['seller']['email'], self.user.email)
        self.assertEqual(response.data['phone_number'], '123-xxx-xxx')
        self.assertIsInstance(response.data['category'], dict)
        self.assertIsInstance(response.data['location'], dict)
        self.assertEqual(len(response.data['images']), 1)

    def test_unauthenticated_user_cannot_create_listing(self):
        response = self.client.post(self.listings_url, self._base_listing_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_owner_can_create_listing_with_images(self):
        payload = self._base_listing_payload()
        payload['delivery_methods'] = [str(self.delivery_pickup.id)]
        payload['uploaded_images'] = [self._make_image_file(name='create.jpg', color='green')]

        response = self.client.post(self.listings_url, payload, format='multipart', **self._auth_headers(self.user))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        listing = Listing.objects.get(id=response.data['id'])
        self.assertEqual(listing.seller, self.user)
        self.assertEqual(listing.status.name, 'Aktywne')
        self.assertEqual(listing.images.count(), 1)
        self.assertEqual(listing.delivery_methods.count(), 1)

    def test_owner_can_update_listing_and_delete_images_via_patch(self):
        listing = self._create_listing_model(title='Do edycji')
        old_image = self._create_listing_image(listing, name='old.jpg', color='yellow', display_order=0, is_primary=True)

        payload = {
            'title': 'Po edycji',
            'deleted_image_ids': str([old_image.id]),
            'uploaded_images': [self._make_image_file(name='new.jpg', color='purple')],
            'delivery_methods': [str(self.delivery_courier.id)],
        }
        response = self.client.patch(
            f'{self.listings_url}{listing.id}/',
            payload,
            format='multipart',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        listing.refresh_from_db()
        self.assertEqual(listing.title, 'Po edycji')
        self.assertEqual(listing.images.count(), 1)
        self.assertEqual(listing.delivery_methods.count(), 1)
        self.assertTrue(listing.delivery_methods.filter(id=self.delivery_courier.id).exists())
        self.assertFalse(ListingImage.objects.filter(id=old_image.id).exists())

    def test_owner_can_delete_single_listing_image_via_endpoint(self):
        listing = self._create_listing_model(title='Usuwanie obrazu')
        image = self._create_listing_image(listing, name='delete-me.jpg', color='orange', display_order=0, is_primary=True)

        response = self.client.delete(
            f'{self.listings_url}{listing.id}/images/{image.id}/',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ListingImage.objects.filter(id=image.id).count(), 0)

    def test_non_owner_cannot_update_listing(self):
        listing = self._create_listing_model(title='Nie twoje')
        response = self.client.patch(
            f'{self.listings_url}{listing.id}/',
            {'title': 'Zmiana przez obcego'},
            format='json',
            **self._auth_headers(self.other_user),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_delete_listing_image(self):
        listing = self._create_listing_model(title='Obcy obraz')
        image = self._create_listing_image(listing, name='foreign.jpg', color='pink', display_order=0, is_primary=True)

        response = self.client.delete(
            f'{self.listings_url}{listing.id}/images/{image.id}/',
            **self._auth_headers(self.other_user),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(ListingImage.objects.filter(id=image.id).count(), 1)

    def test_owner_can_change_status_via_custom_action(self):
        listing = self._create_listing_model(title='Status change')
        response = self.client.patch(
            f'{self.listings_url}{listing.id}/change_status/',
            {'status': 'Zakończone'},
            format='json',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, 'Zakończone')

    def test_non_owner_cannot_change_status(self):
        listing = self._create_listing_model(title='Status blocked')
        response = self.client.patch(
            f'{self.listings_url}{listing.id}/change_status/',
            {'status': 'Zakończone'},
            format='json',
            **self._auth_headers(self.other_user),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_soft_delete_listing(self):
        listing = self._create_listing_model(title='Do usuniecia')
        response = self.client.delete(
            f'{self.listings_url}{listing.id}/',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        listing.refresh_from_db()
        self.assertEqual(listing.status.name, 'Usunięte')

        list_response = self.client.get(self.listings_url)
        titles = [item['title'] for item in self._extract_items(list_response)]
        self.assertNotIn('Do usuniecia', titles)

    def test_non_owner_cannot_delete_listing(self):
        listing = self._create_listing_model(title='Protected')
        response = self.client.delete(
            f'{self.listings_url}{listing.id}/',
            **self._auth_headers(self.other_user),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ----------------------
    # Phone reveal endpoint
    # ----------------------
    def test_reveal_phone_requires_authentication(self):
        listing = self._create_listing_model(title='Phone protected')
        response = self.client.get(f'{self.listings_url}{listing.id}/phone/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_reveal_phone_number(self):
        listing = self._create_listing_model(title='Phone visible')
        response = self.client.get(
            f'{self.listings_url}{listing.id}/phone/',
            **self._auth_headers(self.buyer_user),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone_number'], self.user.phone_num)

    def test_reveal_phone_returns_404_when_seller_has_no_phone(self):
        seller_without_phone = User.objects.create_user(
            email='no.phone@student.pwr.edu.pl',
            password='Password123!',
            first_name='No',
            last_name='Phone',
            phone_num='',
        )
        listing = self._create_listing_model(seller=seller_without_phone, title='No phone listing')
        response = self.client.get(
            f'{self.listings_url}{listing.id}/phone/',
            **self._auth_headers(self.buyer_user),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)

    # ----------------------
    # Orders
    # ----------------------
    def test_authenticated_buyer_can_create_order_and_listing_becomes_completed(self):
        listing = self._create_listing_model(title='Buy me', with_delivery_methods=True)

        response = self.client.post(
            self.orders_url,
            {
                'listing': listing.id,
                'delivery_method': self.delivery_pickup.id,
                'delivery_details': 'Kontakt przy odbiorze',
            },
            format='json',
            **self._auth_headers(self.buyer_user),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        order = Order.objects.get(id=response.data['id'])
        listing.refresh_from_db()
        self.assertEqual(order.buyer, self.buyer_user)
        self.assertEqual(str(order.purchase_price), '199.99')
        self.assertEqual(listing.status.name, 'Zakończone')

    def test_user_cannot_buy_own_listing(self):
        listing = self._create_listing_model(title='Own listing')

        response = self.client.post(
            self.orders_url,
            {
                'listing': listing.id,
                'delivery_method': self.delivery_pickup.id,
            },
            format='json',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('listing', response.data)

    def test_user_cannot_buy_inactive_listing(self):
        listing = self._create_listing_model(title='Inactive listing', status=self.status_completed)

        response = self.client.post(
            self.orders_url,
            {
                'listing': listing.id,
                'delivery_method': self.delivery_pickup.id,
            },
            format='json',
            **self._auth_headers(self.buyer_user),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('listing', response.data)

    def test_orders_list_only_returns_current_users_orders(self):
        buyer_listing = self._create_listing_model(title='Buyer order listing')
        other_listing = self._create_listing_model(seller=self.other_user, title='Other order listing')

        self.client.post(
            self.orders_url,
            {
                'listing': buyer_listing.id,
                'delivery_method': self.delivery_pickup.id,
            },
            format='json',
            **self._auth_headers(self.buyer_user),
        )
        self.client.post(
            self.orders_url,
            {
                'listing': other_listing.id,
                'delivery_method': self.delivery_pickup.id,
            },
            format='json',
            **self._auth_headers(self.other_user),
        )

        response = self.client.get(self.orders_url, **self._auth_headers(self.buyer_user))
        items = self._extract_items(response)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['listing'], buyer_listing.id)