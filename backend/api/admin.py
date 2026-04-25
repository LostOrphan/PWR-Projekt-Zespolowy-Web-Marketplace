from django.contrib import admin
from .models import CustomUser, Category, Location, Listing, ListingImage, ListingStatus


admin.site.register(CustomUser)
admin.site.register(Category)
admin.site.register(Location)
admin.site.register(Listing)
admin.site.register(ListingImage)
admin.site.register(ListingStatus)