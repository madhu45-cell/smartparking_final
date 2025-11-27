# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ParkingSlot, Booking, Payment, BookingHistory
from django.utils import timezone
from decimal import Decimal

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser']
        read_only_fields = ['is_staff', 'is_superuser']

class ParkingSlotSerializer(serializers.ModelSerializer):
    total_rate_per_hour = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    features_list = serializers.ListField(read_only=True)
    
    class Meta:
        model = ParkingSlot
        fields = [
            'id', 'slot_number', 'floor', 'zone', 'slot_type', 'slot_size', 'status',
            'base_rate_per_hour', 'premium_rate_per_hour', 'total_rate_per_hour',
            'is_ev_charging', 'is_handicap_accessible', 'is_covered', 'has_security_camera',
            'distance_from_elevator', 'distance_from_exit', 'location_notes',
            'is_active', 'is_available', 'features_list', 'notes',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parking_slot = ParkingSlotSerializer(read_only=True)
    parking_slot_id = serializers.PrimaryKeyRelatedField(
        queryset=ParkingSlot.objects.filter(status='available', is_active=True),
        write_only=True,
        source='parking_slot'
    )
    is_active = serializers.BooleanField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'parking_slot', 'parking_slot_id',
            'start_time', 'expected_end_time', 'actual_end_time',
            'check_in_time', 'check_out_time', 'status', 'payment_status',
            'vehicle_number', 'vehicle_type', 'vehicle_model', 'vehicle_color',
            'base_rate', 'premium_charges', 'total_amount', 'amount_paid',
            'special_requirements', 'cancelled_at', 'cancellation_reason',
            'is_active', 'can_cancel', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'booking_reference', 'created_at', 'updated_at',
            'base_rate', 'premium_charges', 'total_amount', 'status',
            'payment_status', 'amount_paid', 'cancelled_at', 'actual_end_time',
            'check_in_time', 'check_out_time'
        ]

    def validate(self, data):
        start_time = data.get('start_time')
        expected_end_time = data.get('expected_end_time')
        
        if start_time and expected_end_time:
            if start_time >= expected_end_time:
                raise serializers.ValidationError("End time must be after start time")
            
            if start_time < timezone.now():
                raise serializers.ValidationError("Start time cannot be in the past")
        
        # Validate vehicle number
        vehicle_number = data.get('vehicle_number', '')
        if not vehicle_number:
            raise serializers.ValidationError("Vehicle number is required")
        
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        parking_slot = validated_data['parking_slot']
        
        # Check if slot is available
        if not parking_slot.is_available:
            raise serializers.ValidationError("This parking slot is not available")
        
        # Set user and calculate rates
        validated_data['user'] = user
        validated_data['base_rate'] = parking_slot.base_rate_per_hour
        validated_data['premium_charges'] = parking_slot.premium_rate_per_hour
        
        # Calculate total amount
        start_time = validated_data['start_time']
        expected_end_time = validated_data['expected_end_time']
        duration_hours = Decimal((expected_end_time - start_time).total_seconds()) / Decimal(3600)
        total_cost = duration_hours * parking_slot.total_rate_per_hour
        validated_data['total_amount'] = total_cost
        
        # Set initial status
        validated_data['status'] = 'confirmed'
        
        booking = super().create(validated_data)
        
        # Update slot status
        parking_slot.status = 'occupied'
        parking_slot.save()
        
        return booking

class PaymentSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)
    is_successful = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_reference', 'booking', 'amount', 'payment_method',
            'payment_status', 'is_successful', 'initiated_at', 'completed_at'
        ]
        read_only_fields = [
            'payment_reference', 'initiated_at', 'completed_at'
        ]

    def validate(self, data):
        amount = data.get('amount')
        if amount and amount <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return data

    def create(self, validated_data):
        payment = super().create(validated_data)
        
        # Update booking payment status if payment is completed
        if payment.payment_status == 'completed':
            booking = payment.booking
            booking.payment_status = 'paid'
            booking.amount_paid = payment.amount
            booking.save()
            
            payment.completed_at = timezone.now()
            payment.save()
        
        return payment

class BookingHistorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parking_slot = ParkingSlotSerializer(read_only=True)
    
    class Meta:
        model = BookingHistory
        fields = [
            'id', 'user', 'parking_slot', 'booking_reference',
            'booked_at', 'released_at', 'total_cost', 'duration_hours',
            'vehicle_number', 'recorded_at'
        ]
        read_only_fields = ['recorded_at']

# Simplified serializers for list views
class ParkingSlotListSerializer(serializers.ModelSerializer):
    total_rate_per_hour = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    features_list = serializers.ListField(read_only=True)
    
    class Meta:
        model = ParkingSlot
        fields = [
            'id', 'slot_number', 'floor', 'zone', 'slot_type', 'slot_size', 'status',
            'base_rate_per_hour', 'premium_rate_per_hour', 'total_rate_per_hour',
            'is_available', 'features_list'
        ]

class BookingListSerializer(serializers.ModelSerializer):
    parking_slot = ParkingSlotListSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'parking_slot', 'start_time', 'expected_end_time',
            'status', 'payment_status', 'vehicle_number', 'vehicle_type',
            'total_amount', 'is_active', 'can_cancel', 'created_at'
        ]

class PaymentListSerializer(serializers.ModelSerializer):
    is_successful = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_reference', 'amount', 'payment_method',
            'payment_status', 'is_successful', 'initiated_at', 'completed_at'
        ]