# api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking, Payment
from decimal import Decimal

@receiver(post_save, sender=Booking)
def create_booking_payment(sender, instance, created, **kwargs):
    """
    Create a payment record when a booking is created
    """
    if created and instance.parking_slot:
        try:
            # FIX: Use the correct field names from ParkingSlot model
            parking_slot = instance.parking_slot
            
            # Calculate estimated cost based on duration and rates
            if instance.start_time and instance.expected_end_time:
                # Calculate duration in hours
                duration = instance.expected_end_time - instance.start_time
                duration_hours = max(Decimal(duration.total_seconds()) / Decimal(3600), Decimal('1.0'))
                
                # Use the correct field names: base_rate_per_hour and premium_rate_per_hour
                base_rate = parking_slot.base_rate_per_hour
                premium_rate = parking_slot.premium_rate_per_hour
                total_hourly_rate = base_rate + premium_rate
                
                estimated_cost = total_hourly_rate * duration_hours
            else:
                # Fallback: use base rate for 1 hour
                base_rate = parking_slot.base_rate_per_hour
                premium_rate = parking_slot.premium_rate_per_hour
                total_hourly_rate = base_rate + premium_rate
                estimated_cost = total_hourly_rate * Decimal('1.0')
            
            # Create payment record
            Payment.objects.create(
                booking=instance,
                amount=estimated_cost,
                payment_method='card',  # Default payment method
                payment_status='pending'
            )
            
            print(f"✅ Created payment record for booking {instance.booking_reference}: ${estimated_cost}")
            
        except Exception as e:
            print(f"❌ Error creating payment record: {e}")