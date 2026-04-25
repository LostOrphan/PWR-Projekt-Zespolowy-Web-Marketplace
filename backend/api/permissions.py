from rest_framework import permissions

class IsListingOwnerOrReadOnly(permissions.BasePermission):
    """
    Customowe uprawnienie, które pozwala na edycję/usunięcie ogłoszenia
    tylko jego właścicielowi (sprzedawcy).
    """

    def has_object_permission(self, request, view, obj):
        # Metody bezpieczne (GET, HEAD, OPTIONS) są dozwolone dla każdego.
        # Każdy może przeglądać ogłoszenia.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Metody modyfikujące (PUT, PATCH, DELETE) wymagają bycia właścicielem.
        # Zwracamy True, jeśli zalogowany użytkownik to autor ogłoszenia.
        return obj.seller == request.user
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Pozwala na przeglądanie każdemu, ale na edycję/usuwanie tylko właścicielowi.
    """
    def has_object_permission(self, request, view, obj):
        # Metody bezpieczne (GET, HEAD, OPTIONS) są dozwolone dla każdego
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Pisanie (PUT, PATCH, DELETE) dozwolone tylko, gdy użytkownik jest sprzedawcą
        return obj.seller == request.user