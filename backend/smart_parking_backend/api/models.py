# api/models.py - FIXED and ERROR-FREE
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import random
import string
from django.core.validators import MinValueValidator

class ParkingSlot(models.Model):
    """Represents a single parking slot with comprehensive details."""
    
    SLOT_TYPES = [
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('valet', 'Valet'),
        ('covered', 'Covered'),
    ]

    SLOT_SIZES = [
        ('compact', 'Compact'),
        ('medium', 'Medium'),
        ('large', 'Large'),
        ('xlarge', 'Extra Large'),
    ]

    SLOT_STATUS = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
    ]

    FLOOR_CHOICES = [
        ('B1', 'Basement 1'),
        ('G', 'Ground Floor'),
        ('1', 'First Floor'),
        ('2', 'Second Floor'),
        ('3', 'Third Floor'),
    ]

    # Basic Information
    slot_number = models.CharField(max_length=20, unique=True)
    floor = models.CharField(max_length=3, choices=FLOOR_CHOICES, default='G')
    zone = models.CharField(max_length=50, blank=True)
    
    # Slot Specifications
    slot_type = models.CharField(max_length=20, choices=SLOT_TYPES, default='standard')
    slot_size = models.CharField(max_length=20, choices=SLOT_SIZES, default='medium')
    status = models.CharField(max_length=20, choices=SLOT_STATUS, default='available')
    
    # Pricing
    base_rate_per_hour = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('3.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    premium_rate_per_hour = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Features and Accessibility
    is_ev_charging = models.BooleanField(default=False)
    is_handicap_accessible = models.BooleanField(default=False)
    is_covered = models.BooleanField(default=False)
    has_security_camera = models.BooleanField(default=False)
    
    # Location Details
    distance_from_elevator = models.IntegerField(default=50)
    distance_from_exit = models.IntegerField(default=100)
    location_notes = models.TextField(blank=True)
    
    # Admin Management
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_slots'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['floor', 'zone', 'slot_number']
        verbose_name = "Parking Slot"
        verbose_name_plural = "Parking Slots"
        db_table = 'api_parkingslot'

    def __str__(self):
        return f"{self.slot_number} - {self.get_slot_type_display()} ({self.get_status_display()})"

    @property
    def total_rate_per_hour(self):
        """Calculate total hourly rate including premium charges."""
        return self.base_rate_per_hour + self.premium_rate_per_hour

    @property
    def is_available(self):
        """Check if slot is currently available for booking."""
        return self.status == 'available' and self.is_active

    @property
    def features_list(self):
        """Return list of available features."""
        features = []
        if self.is_ev_charging:
            features.append("EV Charging")
        if self.is_handicap_accessible:
            features.append("Handicap Accessible")
        if self.is_covered:
            features.append("Covered")
        if self.has_security_camera:
            features.append("Security Camera")
        return features

    def mark_for_maintenance(self, duration_hours=24):
        """Mark slot for maintenance."""
        self.status = 'maintenance'
        self.save()
        # You might want to add maintenance end time logic here

    def complete_maintenance(self):
        """Complete maintenance and make slot available."""
        self.status = 'available'
        self.save()


class Booking(models.Model):
    """Represents a parking slot booking with comprehensive tracking."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]

    VEHICLE_TYPES = [
        ('compact', 'Compact Car'),
        ('sedan', 'Sedan'),
        ('suv', 'SUV'),
        ('truck', 'Truck'),
        ('van', 'Van'),
        ('motorcycle', 'Motorcycle'),
    ]

    # Booking Information
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
    parking_slot = models.ForeignKey(
        ParkingSlot, 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
    booking_reference = models.CharField(max_length=20, unique=True, blank=True)
    
    # Timing Information
    start_time = models.DateTimeField()
    expected_end_time = models.DateTimeField()
    actual_end_time = models.DateTimeField(null=True, blank=True)
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    # Status Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Vehicle Information
    vehicle_number = models.CharField(max_length=20)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default='sedan')
    vehicle_model = models.CharField(max_length=100, blank=True)
    vehicle_color = models.CharField(max_length=50, blank=True)
    
    # Pricing and Payment
    base_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    premium_charges = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Additional Information
    special_requirements = models.TextField(blank=True)
    
    # Cancellation Information
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        db_table = 'api_booking'

    def __str__(self):
        return f"{self.booking_reference} - {self.user.username} - {self.parking_slot.slot_number}"

    def save(self, *args, **kwargs):
        # Generate unique booking reference if missing
        if not self.booking_reference:
            self.booking_reference = self.generate_booking_reference()
        
        # Calculate pricing if not set and parking_slot exists
        if self.parking_slot and (not self.base_rate or self.base_rate == Decimal('0.00')):
            self.base_rate = self.parking_slot.base_rate_per_hour
            self.premium_charges = self.parking_slot.premium_rate_per_hour
        
        # Calculate total amount
        self.calculate_total_amount()
        
        super().save(*args, **kwargs)

    def generate_booking_reference(self):
        """Generate a unique booking reference."""
        while True:
            ref = 'BK' + ''.join(random.choices(string.digits, k=8))
            if not Booking.objects.filter(booking_reference=ref).exists():
                return ref

    def calculate_total_amount(self):
        """Calculate total booking amount based on duration and rates."""
        if self.start_time and self.expected_end_time:
            try:
                duration_hours = Decimal((self.expected_end_time - self.start_time).total_seconds()) / Decimal(3600)
                base_cost = duration_hours * self.base_rate
                premium_cost = duration_hours * self.premium_charges
                self.total_amount = (base_cost + premium_cost).quantize(Decimal('0.01'))
            except (TypeError, ValueError):
                # Fallback if calculation fails
                self.total_amount = Decimal('0.00')

    @property
    def is_active(self):
        """Check if booking is currently active."""
        return self.status == 'active'

    @property
    def can_cancel(self):
        """Check if booking can be cancelled."""
        return self.status in ['pending', 'confirmed'] and timezone.now() < self.start_time

    @property
    def duration_hours(self):
        """Calculate actual duration in hours."""
        if self.actual_end_time and self.start_time:
            try:
                duration = self.actual_end_time - self.start_time
                return round(duration.total_seconds() / 3600, 2)
            except:
                return 0
        return 0


class Payment(models.Model):
    """Handles payment transactions for bookings."""
    
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
        ('digital_wallet', 'Digital Wallet'),
    ]

    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    # Payment Information
    booking = models.ForeignKey(
        Booking, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    payment_reference = models.CharField(max_length=50, unique=True, blank=True)
    
    # Amount Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Timing
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-initiated_at']
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        db_table = 'api_payment'

    def __str__(self):
        return f"Payment {self.payment_reference} - ${self.amount}"

    def save(self, *args, **kwargs):
        # Generate payment reference if missing
        if not self.payment_reference:
            self.payment_reference = self.generate_payment_reference()
        
        super().save(*args, **kwargs)

    def generate_payment_reference(self):
        """Generate a unique payment reference."""
        while True:
            ref = 'PAY' + ''.join(random.choices(string.digits, k=10))
            if not Payment.objects.filter(payment_reference=ref).exists():
                return ref

    @property
    def is_successful(self):
        return self.payment_status == 'completed'


class BookingHistory(models.Model):
    """Historical record of completed bookings for analytics and reporting."""
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='booking_history'
    )
    parking_slot = models.ForeignKey(
        ParkingSlot, 
        on_delete=models.CASCADE, 
        related_name='booking_history'
    )
    booking_reference = models.CharField(max_length=20)
    
    # Timing Information
    booked_at = models.DateTimeField()
    released_at = models.DateTimeField()
    
    # Cost Information
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Duration
    duration_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    
    # Vehicle Information
    vehicle_number = models.CharField(max_length=20)
    
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-released_at']
        verbose_name = "Booking History"
        verbose_name_plural = "Booking Histories"
        db_table = 'api_bookinghistory'

    def __str__(self):
        return f"{self.booking_reference} - {self.user.username} - {self.parking_slot.slot_number}"

    def save(self, *args, **kwargs):
        # Calculate duration
        if self.booked_at and self.released_at:
            try:
                duration_seconds = (self.released_at - self.booked_at).total_seconds()
                self.duration_hours = Decimal(duration_seconds) / Decimal(3600)
            except (TypeError, ValueError):
                self.duration_hours = Decimal('0.00')
        
        super().save(*args, **kwargs)