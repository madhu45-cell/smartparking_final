# api/admin.py
from django.contrib import admin
from .models import ParkingSlot, Booking, Payment, BookingHistory

@admin.register(ParkingSlot)
class ParkingSlotAdmin(admin.ModelAdmin):
    list_display = ['slot_number', 'floor', 'zone', 'slot_type', 'slot_size', 'status', 'base_rate_per_hour', 'is_available']
    list_filter = ['slot_type', 'slot_size', 'status', 'floor', 'is_active']
    search_fields = ['slot_number', 'zone']
    list_editable = ['status', 'base_rate_per_hour']
    actions = ['mark_available', 'mark_maintenance']

    def mark_available(self, request, queryset):
        updated = queryset.update(status='available')
        self.message_user(request, f'{updated} slots marked as available')
    mark_available.short_description = "Mark selected slots as available"

    def mark_maintenance(self, request, queryset):
        updated = queryset.update(status='maintenance')
        self.message_user(request, f'{updated} slots marked for maintenance')
    mark_maintenance.short_description = "Mark selected slots for maintenance"

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_reference', 'user', 'parking_slot', 'start_time', 'expected_end_time', 'status', 'payment_status', 'total_amount']
    list_filter = ['status', 'payment_status', 'vehicle_type', 'created_at']
    search_fields = ['booking_reference', 'user__username', 'vehicle_number']
    readonly_fields = ['booking_reference', 'created_at', 'updated_at']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_reference', 'booking', 'amount', 'payment_method', 'payment_status', 'initiated_at']
    list_filter = ['payment_status', 'payment_method']
    search_fields = ['payment_reference', 'booking__booking_reference']

@admin.register(BookingHistory)
class BookingHistoryAdmin(admin.ModelAdmin):
    list_display = ['booking_reference', 'user', 'parking_slot', 'booked_at', 'released_at', 'total_cost']
    list_filter = ['released_at']
    search_fields = ['booking_reference', 'user__username']
    readonly_fields = ['recorded_at']