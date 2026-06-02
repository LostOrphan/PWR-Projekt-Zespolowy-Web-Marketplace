from django.shortcuts import render
from rest_framework import generics, viewsets, permissions
from django.contrib.auth import get_user_model
from .models import Listing, Category, Location, ListingImage
from .serializers import (
    UserSerializer, ListingSerializer, CategorySerializer, LocationSerializer
)
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .permissions import IsListingOwnerOrReadOnly, IsOwnerOrReadOnly
from .models import ListingStatus
from rest_framework import filters  
from django_filters.rest_framework import DjangoFilterBackend 
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as http_status 
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
from rest_framework.throttling import ScopedRateThrottle
from .models import Order
from .serializers import OrderSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.throttling import AnonRateThrottle
User = get_user_model()

# ==========================================
# 1. REJESTRACJA UŻYTKOWNIKA
# ==========================================
class ThrottledLoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'
@extend_schema_view(
    post=extend_schema(
        summary="Zarejestruj nowego użytkownika",
        description="Tworzy nowe konto w systemie na podstawie przesłanych danych (np. email, hasło). Zwraca kod 201 przy sukcesie lub 400 z listą błędów walidacji.",
        responses={
            201: UserSerializer,
            400: OpenApiResponse(description="Błąd walidacji danych (np. email jest już zajęty, brak wymaganego pola).")
        }
    )
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Ten widok zawsze zwraca dane aktualnie zalogowanego użytkownika
        return self.request.user

    @extend_schema(
        summary="Pobierz lub edytuj profil zalogowanego użytkownika",
        description="Zwraca dane zalogowanego użytkownika (GET) lub pozwala na ich zmianę (PATCH/PUT).",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
# ==========================================
# 2. SŁOWNIKI (Kategorie, Lokalizacje)
# ==========================================
@extend_schema_view(
    list=extend_schema(
        summary="Pobierz listę kategorii",
        description="Zwraca pełną, posortowaną listę wszystkich dostępnych kategorii dla ogłoszeń.",
        responses={
            200: CategorySerializer(many=True)
        }
    ),
    retrieve=extend_schema(
        summary="Pobierz szczegóły kategorii",
        description="Zwraca informacje o konkretnej kategorii na podstawie podanego ID.",
        responses={
            200: CategorySerializer,
            404: OpenApiResponse(description="Kategoria o podanym ID nie istnieje.")
        }
    )
)
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('id')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)


@extend_schema_view(
    list=extend_schema(
        summary="Pobierz listę lokalizacji",
        description="Zwraca listę wszystkich dostępnych lokalizacji (np. miast lub regionów) przypisywanych do ogłoszeń.",
        responses={
            200: LocationSerializer(many=True)
        }
    ),
    retrieve=extend_schema(
        summary="Pobierz szczegóły lokalizacji",
        description="Zwraca szczegółowe dane konkretnej lokalizacji na podstawie ID.",
        responses={
            200: LocationSerializer,
            404: OpenApiResponse(description="Lokalizacja o podanym ID nie istnieje.")
        }
    )
)
class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = (permissions.AllowAny,)


# ==========================================
# 3. OGŁOSZENIA (Listingi)
# ==========================================
@extend_schema_view(
    list=extend_schema(
        summary="Przeglądaj ogłoszenia",
        description="Zwraca listę aktywnych ogłoszeń (ukrywa te ze statusem 'Usunięte'). Obsługuje filtrowanie po polach: `category`, `location`, `status` (np. `?category=1`) oraz wyszukiwanie tekstowe (`?search=słowo`).",
        responses={
            200: ListingSerializer(many=True)
        }
    ),
    retrieve=extend_schema(
        summary="Pobierz szczegóły ogłoszenia",
        description="Zwraca pełne dane konkretnego ogłoszenia, w tym powiązanego sprzedawcę i metody dostawy.",
        responses={
            200: ListingSerializer,
            404: OpenApiResponse(description="Ogłoszenie nie istnieje lub zostało usunięte.")
        }
    ),
    create=extend_schema(
        summary="Dodaj nowe ogłoszenie",
        description="**Wymaga autoryzacji (Token JWT).** Zalogowany użytkownik jest automatycznie przypisywany jako `seller`. Status ogłoszenia jest domyślnie ustawiany na 'Aktywne'.",
        responses={
            201: ListingSerializer,
            400: OpenApiResponse(description="Błąd walidacji danych (np. brak wymaganych pól, zły format ceny)."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT (niezalogowany).")
        }
    ),
    update=extend_schema(
        summary="Zaktualizuj całe ogłoszenie",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Nadpisuje wszystkie pola w ogłoszeniu.",
        responses={
            200: ListingSerializer,
            400: OpenApiResponse(description="Błąd walidacji danych."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT."),
            403: OpenApiResponse(description="Zabronione - nie jesteś właścicielem ogłoszenia."),
            404: OpenApiResponse(description="Ogłoszenie nie istnieje.")
        }
    ),
    partial_update=extend_schema(
        summary="Zaktualizuj częściowo ogłoszenie",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Służy do modyfikacji wybranych pól (np. tylko zmiana ceny lub opisu, metodą PATCH).",
        responses={
            200: ListingSerializer,
            400: OpenApiResponse(description="Błąd walidacji przesłanych danych."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT."),
            403: OpenApiResponse(description="Zabronione - nie jesteś właścicielem ogłoszenia."),
            404: OpenApiResponse(description="Ogłoszenie nie istnieje.")
        }
    ),
    destroy=extend_schema(
        summary="Usuń ogłoszenie (Soft Delete)",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Zamiast fizycznego usunięcia z bazy danych, endpoint ten oznacza ogłoszenie statusem 'Usunięte'. Zwraca kod 204.",
        responses={
            204: OpenApiResponse(description="Pomyślnie usunięto (status zmieniony na Usunięte)."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT."),
            403: OpenApiResponse(description="Zabronione - nie jesteś właścicielem ogłoszenia."),
            404: OpenApiResponse(description="Ogłoszenie nie istnieje.")
        }
    )
)
class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().order_by('-created_at')
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'location', 'status']
    search_fields = ['title', 'description']
    def get_throttles(self):
            if self.action == 'create':
                # Przypisujemy konkretny limit ze słownika w settings.py
                self.throttle_scope = 'create_offer'
                return [ScopedRateThrottle()]
            # Dla reszty akcji (list, retrieve, update) zwracamy domyślne, globalne limity
            elif self.action == 'reveal_phone':
                self.throttle_scope = 'phoneNumReveal'
                return [ScopedRateThrottle()]
            return super().get_throttles()
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def perform_create(self, serializer):
        active_status, _ = ListingStatus.objects.get_or_create(name="Aktywne")
        serializer.save(seller=self.request.user, status=active_status)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object() 
        deleted_status, _ = ListingStatus.objects.get_or_create(name="Usunięte")
        instance.status = deleted_status
        instance.save()
        return Response(status=http_status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.exclude(status__name="Usunięte")

    @extend_schema(
        summary="Zmień status ogłoszenia",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Szybki endpoint do zmiany samego statusu. Oczekuje JSON-a: `{\"status\": \"Nowa nazwa statusu\"}`.",
        responses={
            200: OpenApiResponse(description="Pomyślnie zmieniono status ogłoszenia."),
            400: OpenApiResponse(description="Brak podanego statusu lub podany status nie istnieje w słowniku."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT."),
            403: OpenApiResponse(description="Zabronione - próbujesz zmienić status ogłoszenia, którego nie jesteś właścicielem."),
            404: OpenApiResponse(description="Ogłoszenie nie istnieje.")
        }
    )
    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        listing = self.get_object() 
        new_status_name = request.data.get('status')
        
        if not new_status_name:
            return Response(
                {"error": "Musisz podać nowy status (np. 'Zakończone')."}, 
                status=http_status.HTTP_400_BAD_REQUEST
            )
            
        try:
            new_status = ListingStatus.objects.get(name=new_status_name)
            listing.status = new_status
            listing.save()
            return Response({"message": f"Pomyślnie zmieniono status na: {new_status_name}"})
            
        except ListingStatus.DoesNotExist:
            return Response(
                {"error": "Podany status nie istnieje w słowniku."}, 
                status=http_status.HTTP_400_BAD_REQUEST
            )
    @extend_schema(
        summary="Usuń konkretne zdjęcie z ogłoszenia",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Usuwa wybrane zdjęcie przypisane do ogłoszenia na podstawie jego ID.",
        responses={
            204: OpenApiResponse(description="Zdjęcie zostało pomyślnie usunięte."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT."),
            403: OpenApiResponse(description="Zabronione - nie jesteś właścicielem tego ogłoszenia."),
            404: OpenApiResponse(description="Zdjęcie nie istnieje lub nie należy do tego ogłoszenia.")
        }
    )
    # url_path pozwala na złapanie ID zdjęcia bezpośrednio z adresu URL
    @action(detail=True, methods=['delete'], url_path=r'images/(?P<image_pk>[^/.]+)')
    def delete_image(self, request, pk=None, image_pk=None):
        # 1. Pobieramy ogłoszenie. Użycie get_object() automatycznie uruchamia 
        # walidację uprawnień (IsOwnerOrReadOnly), więc nikt obcy tu nie wejdzie.
        listing = self.get_object()
        
        try:
            # 2. Szukamy zdjęcia, upewniając się, że należy ono do TEGO ogłoszenia
            image_to_delete = ListingImage.objects.get(pk=image_pk, listing=listing)
            
            # 3. Usuwamy zdjęcie z bazy danych (i z dysku, jeśli masz odpowiednio 
            # skonfigurowany model lub używasz biblioteki django-cleanup)
            image_to_delete.delete()
            
            # (Opcjonalnie) Jeśli usunięte zdjęcie było główne (is_primary=True), 
            # możesz dodać logikę ustawiającą is_primary=True dla pierwszego z pozostałych zdjęć
            
            return Response(status=http_status.HTTP_204_NO_CONTENT)
            
        except ListingImage.DoesNotExist:
            return Response(
                {"error": "Wskazane zdjęcie nie istnieje lub zostało już usunięte."},
                status=http_status.HTTP_404_NOT_FOUND
            )
    @extend_schema(
        summary="Odkryj pełny numer telefonu sprzedawcy",
        description="**Wymaga autoryzacji (Token JWT).** Zwraca pełny, niezamaskowany numer telefonu sprzedawcy przypisanego do danego ogłoszenia. Używane na frontendzie po kliknięciu 'Pokaż numer'.",
        responses={
            200: OpenApiResponse(description="Zwraca pełny numer telefonu, np. {\"phone_number\": \"123456789\"}."),
            401: OpenApiResponse(description="Brak poprawnego tokenu JWT (użytkownik niezalogowany)."),
            404: OpenApiResponse(description="Ogłoszenie nie istnieje lub sprzedawca nie podał numeru telefonu.")
        }
    )
    @action(detail=True, methods=['get'], url_path='phone', permission_classes=[permissions.IsAuthenticated])
    def reveal_phone(self, request, pk=None):
        listing = self.get_object()

        # Pobieramy pełny numer telefonu z modelu CustomUser
        full_phone = listing.seller.phone_num
        
        if not full_phone:
            return Response(
                {"error": "Ten sprzedawca nie udostępnił swojego numeru telefonu."}, 
                status=http_status.HTTP_404_NOT_FOUND
            )
            
        return Response({"phone_number": full_phone}, status=http_status.HTTP_200_OK)
# ==========================================
# 3. OGŁOSZENIA (Orders)
# ==========================================
class OrderViewSet(viewsets.ModelViewSet):
    """
    Zarządzanie zamówieniami (Kup Teraz oraz Historia Zakupów).
    Dostęp tylko dla zalogowanych użytkowników.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Najważniejsza linijka dla historii zakupów!
        # Zalogowany użytkownik po wejściu pod GET /api/orders/ 
        # zobaczy TYLKO swoje zakupy, posortowane od najnowszego.
        return Order.objects.filter(buyer=self.request.user).select_related('listing', 'delivery_method')