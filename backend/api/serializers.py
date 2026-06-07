from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Category, Location, Listing, ListingImage, ListingStatus
from .models import Address
from .models import Order, DeliveryMethod
import django.contrib.auth.password_validation as validators

User = get_user_model()

# ==========================================
#       AUTORYZACJA I UŻYTKOWNIK
# ==========================================
class UserSerializer(serializers.ModelSerializer):
    # Required=False, aby DRF nie wyrzucił błędu przed wejściem do metody validate.
    password = serializers.CharField(
        write_only=True, 
        required=False,
        validators=[validators.validate_password], 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone_num', 'password', 'date_joined')
        extra_kwargs = {
            'date_joined': {'read_only': True}
        }

    def validate(self, attrs):
        """
        Walidacja logiczna:
        self.instance to obiekt z bazy. Jeśli go nie ma, znaczy że tworzymy (rejestracja).
        """
        # 1. Sprawdzamy czy to REJESTRACJA (brak instancji obiektu)
        if not self.instance:
            if 'password' not in attrs:
                raise serializers.ValidationError({
                    "password": "Hasło jest wymagane podczas rejestracji nowego użytkownika."
                })
        
        # 2. Sprawdzamy unikalność emaila
        email = attrs.get('email')
        if email and User.objects.filter(email=email).exclude(pk=getattr(self.instance, 'pk', None)).exists():
            raise serializers.ValidationError({"email": "Użytkownik z tym adresem email już istnieje."})

        return attrs

    def create(self, validated_data):
        """Metoda wywoływana przy POST (Rejestracja)"""
        # create_user automatycznie zahashuje hasło
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        """Metoda wywoływana przy PUT/PATCH (Edycja profilu)"""
        # Usuwamy hasło z danych (jeśli zostało przesłane)
        password = validated_data.pop('password', None)
        
        # Aktualizujemy pozostałe pola (first_name, last_name, email, phone_num)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Jeśli użytkownik podał nowe hasło w formularzu edycji profilu:
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance
    
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

class DeliveryMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryMethod
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

class PublicSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name']        

class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    seller = SellerSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(),
        required=False,
        allow_null=True
    )
    phone_number = serializers.SerializerMethodField()
    
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
            'phone_number',
            'street', 'building_number', 'apartment_number', 
            'delivery_methods',
            'created_at', 'updated_at', 
            'images', 'uploaded_images'
        )
        read_only_fields = ('seller', 'status', 'created_at', 'updated_at')
        
        # Zapobiega możliwości wpisania samej spacji w polach adresowych
        extra_kwargs = {
            'street': {
                'allow_blank': False,
                'error_messages': {'blank': 'Ulica musi być albo pusta albo zawierać poprawne dane.'}
            },
            'building_number': {
                'allow_blank': False,
                'error_messages': {'blank': 'Numer budynku musi być albo pusta albo zawierać poprawne dane.'}
            },
            'apartment_number': {
                'allow_blank': False,
                'error_messages': {'blank': 'Numer lokalu musi być albo pusta albo zawierać poprawne dane.'}
            }
        }

    def validate_uploaded_images(self, value):
        """Zintegrowana walidacja zdjęć przed wejściem do metody create/update"""
        if len(value) > 10:
            raise serializers.ValidationError('Ogłoszenie może posiadać maksymalnie 10 zdjęć.')
        
        allowed_extensions = ['jpg', 'jpeg', 'png']
        for image in value:
            if hasattr(image, 'name'):
                ext = image.name.split('.')[-1].lower()
                if ext not in allowed_extensions:
                    raise serializers.ValidationError(
                        'Zdjęcia zawierają zły format. Dozwolone formaty to: png, jpg, jpeg.'
                    )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = CategorySerializer(instance.category).data
        data['location'] = LocationSerializer(instance.location).data if instance.location else None
        return data

    def get_phone_number(self, obj):
        """Pobiera numer telefonu sprzedawcy i zwraca go w formacie maskowanym 123-xxx-xxx"""
        phone = obj.seller.phone_num
        
        if not phone:
            return None
            
        clean_phone = ''.join(c for c in str(phone) if c.isdigit())
        
        if len(clean_phone) >= 3:
            return f"{clean_phone[:3]}-xxx-xxx"
            
        return clean_phone  

    def create(self, validated_data):
        delivery_methods = validated_data.pop('delivery_methods', [])
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # 1. Tworzymy samo ogłoszenie
        listing = Listing.objects.create(**validated_data)
        
        # 2. Dodajemy metody dostawy
        if delivery_methods:
            listing.delivery_methods.set(delivery_methods)

        # 3. Zapisujemy prawidłowe zdjęcia
        for index, image in enumerate(uploaded_images):
            ListingImage.objects.create(
                listing=listing,
                image=image,
                display_order=index,
                is_primary=(index == 0)
            )

        return listing

    def update(self, instance, validated_data):
        # 1. Wyciągamy dane specjalne
        delivery_methods = validated_data.pop('delivery_methods', None)
        uploaded_images = validated_data.pop('uploaded_images', [])

        # 2. Aktualizujemy podstawowe pola ogłoszenia
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3. Obsługa metod dostawy
        if delivery_methods is not None:
            instance.delivery_methods.set(delivery_methods)

        # 4. Obsługa nowych zdjęć (dodawanie na końcu kolejki)
        if uploaded_images:
            last_image = instance.images.order_by('display_order').last()
            start_index = (last_image.display_order + 1) if last_image else 0
            
            for index, image in enumerate(uploaded_images):
                ListingImage.objects.create(
                    listing=instance,
                    image=image,
                    display_order=start_index + index,
                    is_primary=False 
                )

        return instance

# ==========================================
#                 ZAMÓWIENIA
# ==========================================
class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id', 'listing', 'buyer', 'delivery_method', 
            'purchase_price', 'status', 'delivery_details', 'created_at'
        ]
        # Te pola backend uzupełni automatycznie, więc frontend nie może ich modyfikować:
        read_only_fields = ['buyer', 'purchase_price', 'status', 'created_at']

    def validate(self, attrs):
        listing = attrs.get('listing')
        user = self.context['request'].user

        # 1. Walidacja: Użytkownik nie może kupić własnego ogłoszenia
        if listing.seller == user:
            raise serializers.ValidationError({"listing": "Nie możesz kupić własnego ogłoszenia."})

        # 2. Walidacja: Ogłoszenie musi być aktywne
        if listing.status.name != "Aktywne":
            raise serializers.ValidationError({"listing": "To ogłoszenie nie jest już dostępne do kupienia."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # 1. Zamiast pobierać listing zwyczajnie, pobieramy go z blokadą wiersza w db
        # Żadne inne zapytanie nie zmodyfikuje tego ogłoszenia, dopóki ta transakcja trwa.
        listing_id = validated_data['listing'].id
        listing = Listing.objects.select_for_update().get(id=listing_id)
        
        # 2. Upewniamy się, że po założeniu blokady ogłoszenie nadal jest aktywne
        if listing.status.name != "Aktywne":
            raise serializers.ValidationError({"listing": "Ogłoszenie zostało właśnie kupione przez kogoś innego."})

        validated_data['listing'] = listing # Nadpisujemy w zwalidowanych danych
        validated_data['buyer'] = self.context['request'].user
        validated_data['purchase_price'] = listing.price
        
        # 3. Zapis i zmiana statusu
        order = super().create(validated_data)
        
        # 4. Zmiana statusu ogłoszenia na "Zakończone"
        try:
            completed_status = ListingStatus.objects.get(name="Zakończone")
        except ListingStatus.DoesNotExist:
            # Fallback, gdyby słownik nie był poprawnie zainicjowany
            completed_status = ListingStatus.objects.create(name="Zakończone")
            
        listing.status = completed_status
        listing.save()
        
        return order