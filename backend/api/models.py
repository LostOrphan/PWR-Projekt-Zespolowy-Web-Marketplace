from django.db import models
import re
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
# Menadżer Użytkownika 
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('Użytkownik musi posiadać adres email.')
        if not password:
            raise ValueError('Użytkownik musi posiadać hasło')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        
        # set_password automatycznie hashuje hasło
        user.set_password(password) 
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser musi mieć is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser musi mieć is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# Model użytkownika
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    
    phone_num = models.CharField(max_length=15, blank=True, null=True)

    # Pola wymagane przez system autoryzacji Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # Czy ma dostęp do panelu admina
    date_joined = models.DateTimeField(auto_now_add=True)

    # Customowy manager
    objects = CustomUserManager()

    # Redefinicja domyślnego pola nazwy użytkownika
    USERNAME_FIELD = 'email'
    
    # Pola wymagane przy tworzeniu superusera z poziomu terminala
    REQUIRED_FIELDS = ['first_name', 'last_name'] 

    def __str__(self):
        return self.email
    
# Model słownika kategorii
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories" # Poprawia nazwę w panelu admina

    def __str__(self):
        return self.name

# Model słownika lokacji
class Location(models.Model):
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100)

    class Meta:
        unique_together = ('city', 'region', 'country')

    def __str__(self):
        if self.region:
            return f"{self.city} ({self.region}), {self.country}"
        return f"{self.city}, {self.country}"
def validate_street(value):
    if value is None:
        return
    stripped = value.strip()
    if not stripped:
        # Zmieniono tekst:
        raise ValidationError("Ulica nie może składać się z samych spacji.")
    if not re.match(r'^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]', stripped):
        raise ValidationError("Ulica musi zaczynać się literą.")


def validate_address_number(value):
    if value is None:
        return
    stripped = value.strip()
    if not stripped:
        # Zmieniono tekst:
        raise ValidationError("Numer budynku/mieszkania nie może składać się z samych spacji.")
    if not re.match(r'^\d+[a-zA-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż]*$', stripped):
        raise ValidationError("Numer musi zaczynać się od cyfry i może zawierać tylko cyfry oraz litery (np. 8, 12A, 15bis). Znaki specjalne i spacje są niedozwolone.")

class Address(models.Model):
    # Relacja OneToOne: Każdy użytkownik może mieć dokładnie jeden domyślny adres
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='address',
        verbose_name="Użytkownik"
    )
    
    # Powiązanie z istniejącym modelem Location (Miasto, Województwo, Kraj)
    location = models.ForeignKey(
        'Location', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Lokalizacja (Miasto)"
    )
    
    # Pola adresowe
    street = models.CharField(
        max_length=255,
        blank=False,
        null=True,
        verbose_name="Ulica",
        validators=[validate_street],
        error_messages={
            'blank': 'Ulica nie może składać się z samych spacji.'
        }
    )
    building_number = models.CharField(
        max_length=20,
        blank=False,
        null=True,
        verbose_name="Numer budynku",
        validators=[validate_address_number],
        error_messages={
            'blank': 'Numer budynku nie może składać się z samych spacji.'
        }
    )
    apartment_number = models.CharField(
        max_length=20,
        blank=False,
        null=True,
        verbose_name="Numer lokalu",
        validators=[validate_address_number],
        error_messages={
            'blank': 'Numer lokalu nie może składać się z samych spacji.'
        }
    )
    
    def __str__(self):
        return f"Adres użytkownika {self.user.email}"



# Model słownika statusów ogłoszenia
class ListingStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name_plural = "Listing statuses"

    def __str__(self):
        return self.name
    
# Model ogłoszeń
class Listing(models.Model):
    # Relacja do CustomUser. settings.AUTH_USER_MODEL 
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    category = models.ForeignKey(Category, on_delete=models.RESTRICT, related_name='listings')
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Miasto")
    street = models.CharField(
        max_length=255,
        blank=False,
        null=True,
        verbose_name="Ulica",
        validators=[validate_street],
        error_messages={
            'blank': 'Ulica nie może składać się z samych spacji.'
        }
    )
    building_number = models.CharField(
        max_length=20,
        blank=False,
        null=True,
        verbose_name="Numer budynku",
        validators=[validate_address_number],
        error_messages={
            'blank': 'Numer budynku nie może składać się z samych spacji.'
        }
    )
    apartment_number = models.CharField(
        max_length=20,
        blank=False,
        null=True,
        verbose_name="Numer lokalu",
        validators=[validate_address_number],
        error_messages={
            'blank': 'Numer lokalu nie może składać się z samych spacji.'
        }
    )
    
    status = models.ForeignKey(ListingStatus, on_delete=models.RESTRICT, default=1)
    
    title = models.CharField(max_length=60)
    description = models.TextField(max_length=5000)
    # Relacja wiele do wielu metod dostaw
    delivery_methods = models.ManyToManyField(
        'DeliveryMethod', 
        blank=True, 
        verbose_name="Metody dostawy"
    )
    # Odpowiednik DECIMAL(10, 2) CHECK (price >= 0)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # Automatycznie aktualizuje czas przy zapisie (ON UPDATE)

    def __str__(self):
        return f"{self.title} - {self.price} zł"


def validate_file_size(value):
    filesize = value.size
    if filesize > 10 * 1024 * 1024: # Limit 10MB
        raise ValidationError("Maksymalny rozmiar pliku to 10MB")
        
# Model przechowywania zdjęć ogłoszeń
class ListingImage(models.Model):
    # related_name='images' pozwala na odpytywanie: listing.images.all()
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    
    # Django samo generuje ścieżkę w folderze media/listings/images/
    image = models.ImageField(
    upload_to='listings/',
    validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']),
            validate_file_size
        ]
    )
    display_order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Sortowanie po kolejnosci 
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return f"Zdjęcie dla: {self.listing.title}"

# Model słownika sposobów dostaw
class DeliveryMethod(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

# Model zamowien

class Order(models.Model):
    # Klasa pomocnicza do statusów zamówienia
    class OrderStatus(models.TextChoices):
        NEW = 'NEW', 'Nowe'
        PAID = 'PAID', 'Opłacone'
        SHIPPED = 'SHIPPED', 'Wysłane'
        COMPLETED = 'COMPLETED', 'Zakończone'
        CANCELLED = 'CANCELLED', 'Anulowane'

    # Relacje
    listing = models.OneToOneField(
        Listing, 
        on_delete=models.RESTRICT, 
        related_name='order'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='orders'
    )
    delivery_method = models.ForeignKey(
        DeliveryMethod, 
        on_delete=models.RESTRICT
    )

    # NOWE POLE: Cena w momencie zakupu. 
    # To kluczowe, by historia zakupów nie zmieniała się, gdy sprzedawca zmieni cenę w ogłoszeniu.
    purchase_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Cena ogłoszenia w momencie kliknięcia 'Kup teraz'"
    )

    # NOWE POLE: Status zamówienia
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.NEW
    )

    delivery_details = models.TextField(
        blank=True, 
        null=True,
        help_text="Dane adresowe, numer paczkomatu itp."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Zamówienie"
        verbose_name_plural = "Zamówienia"
        ordering = ['-created_at']

    def __str__(self):
        return f"Zamówienie {self.id} [{self.get_status_display()}] - {self.listing.title}"