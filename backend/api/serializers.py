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
    # Ustawiamy required=False, aby DRF nie wyrzucił błędu przed wejściem do metody validate.
    # Bezpieczeństwo zapewnimy wewnątrz metody validate() poniżej.
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
        
        # 2. Sprawdzamy unikalność emaila (opcjonalne, Django zazwyczaj robi to samo, 
        # ale warto to mieć tutaj dla czytelnych komunikatów)
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
        # Wyciągamy hasło z danych (jeśli zostało przesłane)
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
    # Zagnieżdżoną lista w formacie JSON (tylko do odczytu)
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
        required=False,
        max_length=10
    )

    def validate_uploaded_images(self, value):
        if len(value) > 10:
            raise serializers.ValidationError('Ogłoszenie może posiadać maksymalnie 10 zdjęć.')
        return value

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
        
        extra_kwargs = {
            'street': {
                'allow_blank': False,
                'error_messages': {
                    'blank': 'Ulica nie może składać się z samych spacji.'
                }
            },
            'building_number': {
                'allow_blank': False,
                'error_messages': {
                    'blank': 'Numer budynku nie może składać się z samych spacji.'
                }
            },
            'apartment_number': {
                'allow_blank': False,
                'error_messages': {
                    'blank': 'Numer lokalu nie może składać się z samych spacji.'
                }
            }
        }

    def to_representation(self, instance):
        """Nadpisanie outputu by dla powiązań zwracać obiekty zamiast ID"""
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

        with transaction.atomic():
            listing = Listing.objects.create(**validated_data)
            if delivery_methods:
                listing.delivery_methods.set(delivery_methods)
                
            for index, image in enumerate(uploaded_images):
                is_primary = True if index == 0 else False
                listing_image = ListingImage(
                    listing=listing,
                    image=image,
                    display_order=index,
                    is_primary=is_primary
                )
                try:
                    listing_image.full_clean()
                except DjangoValidationError as exc:
                    raise serializers.ValidationError({'uploaded_images': exc.message_dict if hasattr(exc, 'message_dict') else exc.messages})
                listing_image.save()

        return listing

    def update(self, instance, validated_data):
        delivery_methods = validated_data.pop('delivery_methods', None)
        uploaded_images = validated_data.pop('uploaded_images', [])

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if delivery_methods is not None:
                instance.delivery_methods.set(delivery_methods)

            if uploaded_images:
                # Upewniamy się, że nowe zdjęcia dodają się NA KOŃCU, a nie od indexu 0
                last_image = instance.images.order_by('display_order').last()
                start_index = (last_image.display_order + 1) if last_image else 0
                
                for index, image in enumerate(uploaded_images):
                    listing_image = ListingImage(
                        listing=instance,
                        image=image,
                        display_order=start_index + index,
                        is_primary=False
                    )
                    try:
                        listing_image.full_clean()
                    except DjangoValidationError as exc:
                        raise serializers.ValidationError({'uploaded_images': exc.message_dict if hasattr(exc, 'message_dict') else exc.messages})
                    
                    listing_image.save() # Zostawiony jeden zapis (usunięty duplikat Objects.create)

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
        # 1. Zamiast pobierać listing zwyczajnie, pobieramy go z bazodanową blokadą wiersza!
        # Żadne inne zapytanie nie zmodyfikuje tego ogłoszenia, dopóki ta transakcja trwa.
        listing_id = validated_data['listing'].id
        listing = Listing.objects.select_for_update().get(id=listing_id)
        
        # 2. Upewniamy się PONOWNIE, że po założeniu blokady ogłoszenie nadal jest aktywne
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
            # Fallback (bezpiecznik), gdyby słownik nie był poprawnie zainicjowany
            completed_status = ListingStatus.objects.create(name="Zakończone")
            
        listing.status = completed_status
        listing.save()
        
        return order