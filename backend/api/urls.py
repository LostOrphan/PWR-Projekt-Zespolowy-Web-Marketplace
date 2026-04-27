from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, 
    ListingViewSet, 
    CategoryViewSet, 
    LocationViewSet
)

# Inicjacja routera, który automatycznie stworzy ścieżki dla ViewSetów
router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')

urlpatterns = [
    path('', include(router.urls)),
    
    # Rejestracja użytkownika (/api/users/register/)
    path('users/register/', RegisterView.as_view(), name='register'),
    
    # Autoryzacja JWT (/api/auth/login/ oraz /api/auth/refresh/)
    # Wykorzystane biblioteki simplejwt
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]