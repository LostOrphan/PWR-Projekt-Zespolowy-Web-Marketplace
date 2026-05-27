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
    LocationViewSet,
    UserProfileView,
    OrderViewSet,
    ThrottledLoginView
)

# Inicjacja routera, który automatycznie stworzy ścieżki dla ViewSetów
router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    
    # Rejestracja użytkownika (/api/users/register/)
    path('users/register/', RegisterView.as_view(), name='register'),
    
    # Autoryzacja JWT (/api/auth/login/ oraz /api/auth/refresh/)
    # Wykorzystane biblioteki simplejwt
    path('auth/login/', ThrottledLoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]
