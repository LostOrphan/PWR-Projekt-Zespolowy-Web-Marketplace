from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Location, Listing, ListingImage, ListingStatus
from .models import Address
import django.contrib.auth.password_validation as validators
User = get_user_model()

# ==========================================
#       AUTORYZACJA I UŻYTKOWNIK
# ==========================================
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True,
        validators=[validators.validate_password], 
        style={'input_type': 'password'}
    )
    class Meta:
        model = User
        
        fields = ('id', 'email', 'first_name', 'last_name', 'phone_num', 'password', 'date_joined')
        # Zabezpieczenie: API nigdy nie zwróci hasła
        extra_kwargs = {
            'date_joined': {'read_only': True}
        }

    def create(self, validated_data):
        # Hasło hashowane
        user = User.objects.create_user(**validated_data)
        return user
    
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('location', 'street', 'building_number', 'apartment_number')

# ==========================================
#     SŁOWNIKI (Kategorie, Lokalizacje)
# ==========================================
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class ListingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingStatus
        fields = '__all__'


# ==========================================
#           OGŁOSZENIA I ZDJĘCIA
# ==========================================
class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ('id', 'image', 'display_order', 'is_primary')

class SellerSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    class Meta:
        model = User
        # Zwracamy tylko bezpieczne dane kontaktowe
        fields = ('id', 'first_name', 'last_name', 'email', 'phone_num', 'address')
class ListingSerializer(serializers.ModelSerializer):
    # Zagnieżdżoną lista w formacie JSON (tylko do odczytu)
    images = ListingImageSerializer(many=True, read_only=True)
    seller = SellerSerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    
    # Dodatkowe pole do przyjmowania plików zdjęć z frontendu (FormData)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Listing
        fields = (
            'id', 'seller', 'category', 'location', 'status', 
            'title', 'description', 'price', 
            'street', 'building_number', 'apartment_number', 
            'delivery_methods',
            'created_at', 'updated_at', 
            'images', 'uploaded_images'
        )
        read_only_fields = ('seller', 'status', 'created_at', 'updated_at')

    def create(self, validated_data):
        # Wyciągamy zdjęcia z danych, zanim zapis
        delivery_methods = validated_data.pop('delivery_methods', [])
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Tworzenie ogłoszenia
        listing = Listing.objects.create(**validated_data)
        if delivery_methods:
            listing.delivery_methods.set(delivery_methods)
        # Zapisujemy przesłane zdjęcia i przypisujemy je do ogłoszenia
        for index, image in enumerate(uploaded_images):
            # Pierwsze dodane zdjęcie oznaczamy jako główne 
            is_primary = True if index == 0 else False
            ListingImage.objects.create(
                listing=listing, 
                image=image, 
                display_order=index, 
                is_primary=is_primary
            )
            
        return listing