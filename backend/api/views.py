from django.shortcuts import render
from rest_framework import generics, viewsets, permissions
from django.contrib.auth import get_user_model
from .models import Listing, Category, Location
from .serializers import (
    UserSerializer, ListingSerializer, CategorySerializer, LocationSerializer
)
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .permissions import IsListingOwnerOrReadOnly, IsOwnerOrReadOnly
from api.models import ListingStatus
from rest_framework import filters  
from django_filters.rest_framework import DjangoFilterBackend 
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as http_status 
from drf_spectacular.utils import extend_schema, extend_schema_view # <-- Nowy import

User = get_user_model()

# ==========================================
# 1. REJESTRACJA UŻYTKOWNIKA
# ==========================================
@extend_schema_view(
    post=extend_schema(
        summary="Zarejestruj nowego użytkownika",
        description="Tworzy nowe konto w systemie na podstawie przesłanych danych (np. email, hasło). Zwraca kod 201 przy sukcesie lub 400 z listą błędów walidacji."
    )
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


# ==========================================
# 2. SŁOWNIKI (Kategorie, Lokalizacje)
# ==========================================
@extend_schema_view(
    list=extend_schema(
        summary="Pobierz listę kategorii",
        description="Zwraca pełną, posortowaną listę wszystkich dostępnych kategorii dla ogłoszeń."
    ),
    retrieve=extend_schema(
        summary="Pobierz szczegóły kategorii",
        description="Zwraca informacje o konkretnej kategorii na podstawie podanego ID."
    )
)
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('id')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)


@extend_schema_view(
    list=extend_schema(
        summary="Pobierz listę lokalizacji",
        description="Zwraca listę wszystkich dostępnych lokalizacji (np. miast lub regionów) przypisywanych do ogłoszeń."
    ),
    retrieve=extend_schema(
        summary="Pobierz szczegóły lokalizacji",
        description="Zwraca szczegółowe dane konkretnej lokalizacji na podstawie ID."
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
        description="Zwraca listę aktywnych ogłoszeń (ukrywa te ze statusem 'Usunięte'). Obsługuje filtrowanie po polach: `category`, `location`, `status` (np. `?category=1`) oraz wyszukiwanie tekstowe (`?search=słowo`)."
    ),
    retrieve=extend_schema(
        summary="Pobierz szczegóły ogłoszenia",
        description="Zwraca pełne dane konkretnego ogłoszenia, w tym powiązanego sprzedawcę i metody dostawy."
    ),
    create=extend_schema(
        summary="Dodaj nowe ogłoszenie",
        description="**Wymaga autoryzacji (Token JWT).** Zalogowany użytkownik jest automatycznie przypisywany jako `seller`. Status ogłoszenia jest domyślnie ustawiany na 'Aktywne'."
    ),
    update=extend_schema(
        summary="Zaktualizuj całe ogłoszenie",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Nadpisuje wszystkie pola w ogłoszeniu."
    ),
    partial_update=extend_schema(
        summary="Zaktualizuj częściowo ogłoszenie",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Służy do modyfikacji wybranych pól (np. tylko zmiana ceny lub opisu, metodą PATCH)."
    ),
    destroy=extend_schema(
        summary="Usuń ogłoszenie (Soft Delete)",
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Zamiast fizycznego usunięcia z bazy danych, endpoint ten oznacza ogłoszenie statusem 'Usunięte'. Zwraca kod 204."
    )
)
class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().order_by('-created_at')
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'location', 'status']
    search_fields = ['title', 'description']

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
        description="**Wymaga autoryzacji i bycia właścicielem (IsOwner).** Szybki endpoint do zmiany samego statusu. Oczekuje JSON-a: `{\"status\": \"Nowa nazwa statusu\"}`."
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