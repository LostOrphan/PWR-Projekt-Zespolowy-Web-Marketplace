from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.conf import settings

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
    street = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ulica")
    building_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Nr budynku")
    apartment_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Nr mieszkania")

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
    street = models.CharField(max_length=255, blank=True, null=True, verbose_name="Ulica")
    building_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Numer budynku")
    apartment_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Numer lokalu")
    
    status = models.ForeignKey(ListingStatus, on_delete=models.RESTRICT, default=1)
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
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

# Model przechowywania zdjęć ogłoszeń
class ListingImage(models.Model):
    # related_name='images' pozwala na odpytywanie: listing.images.all()
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    
    # Django samo generuje ścieżkę w folderze media/listings/images/
    image = models.ImageField(upload_to='listings/images/')
    
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
    # Jedno ogłoszenie może mieć tylko jedno zamówienie
    listing = models.OneToOneField(Listing, on_delete=models.RESTRICT, related_name='order')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    delivery_method = models.ForeignKey(DeliveryMethod, on_delete=models.RESTRICT)
    
    delivery_details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Zamówienie {self.id} na ogłoszenie: {self.listing.title}"