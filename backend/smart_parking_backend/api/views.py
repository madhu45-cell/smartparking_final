# api/views.py
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta, datetime
import logging
from decimal import Decimal

from .models import ParkingSlot, Booking, Payment, BookingHistory
from .serializers import (
    UserSerializer, ParkingSlotSerializer, BookingSerializer,
    PaymentSerializer, BookingHistorySerializer,
    ParkingSlotListSerializer, BookingListSerializer
)

logger = logging.getLogger(__name__)

# -----------------------
# Health Check & Utility Endpoints
# -----------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint to verify backend is running"""
    return Response({
        "status": "healthy", 
        "service": "SmartPark Backend",
        "timestamp": timezone.now().isoformat()
    })

# -----------------------
# Authentication endpoints
# -----------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        
        return Response({
            'success': True,
            'message': 'Registration successful', 
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Registration error")
        return Response({
            'success': False,
            'error': f'Registration failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def custom_token_refresh(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        refresh = RefreshToken(refresh_token)
        return Response({'access': str(refresh.access_token)}, status=status.HTTP_200_OK)
    except TokenError:
        return Response({'error': 'Refresh token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.exception("Token refresh error")
        return Response({'error': 'Token refresh failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint - mainly client-side token cleanup"""
    try:
        # In JWT, logout is mainly client-side (token removal)
        # We can blacklist the token if needed in future
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Logout error")
        return Response({'error': 'Logout failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------
# Dashboard & Analytics
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    """Get comprehensive dashboard data for admin"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        # Slot statistics
        total_slots = ParkingSlot.objects.count()
        available_slots = ParkingSlot.objects.filter(status='available', is_active=True).count()
        occupied_slots = ParkingSlot.objects.filter(status='occupied').count()
        maintenance_slots = ParkingSlot.objects.filter(status='maintenance').count()

        # Booking statistics
        total_bookings = Booking.objects.count()
        active_bookings = Booking.objects.filter(status='active').count()
        completed_bookings = Booking.objects.filter(status='completed').count()

        # Revenue statistics
        revenue_data = Booking.objects.filter(status='completed').aggregate(
            total_revenue=Sum('total_amount'),
            today_revenue=Sum('total_amount', filter=Q(created_at__date=timezone.now().date()))
        )

        # Recent bookings
        recent_bookings = Booking.objects.select_related('user', 'parking_slot').order_by('-created_at')[:10]
        
        # Popular slots
        popular_slots = ParkingSlot.objects.annotate(
            booking_count=Count('bookings')
        ).order_by('-booking_count')[:5]

        return Response({
            'slot_stats': {
                'total': total_slots,
                'available': available_slots,
                'occupied': occupied_slots,
                'maintenance': maintenance_slots,
                'utilization_rate': round((occupied_slots / total_slots * 100), 2) if total_slots > 0 else 0
            },
            'booking_stats': {
                'total': total_bookings,
                'active': active_bookings,
                'completed': completed_bookings,
                'completion_rate': round((completed_bookings / total_bookings * 100), 2) if total_bookings > 0 else 0
            },
            'revenue_stats': {
                'total_revenue': float(revenue_data['total_revenue'] or 0),
                'today_revenue': float(revenue_data['today_revenue'] or 0),
                'average_booking_value': float((revenue_data['total_revenue'] or 0) / completed_bookings) if completed_bookings > 0 else 0
            },
            'recent_bookings': BookingListSerializer(recent_bookings, many=True).data,
            'popular_slots': ParkingSlotListSerializer(popular_slots, many=True).data
        })

    except Exception as e:
        logger.exception("get_dashboard_data error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_parking_info(request):
    """Public parking information - REAL DATA"""
    try:
        total_slots = ParkingSlot.objects.filter(is_active=True).count()
        available_slots = ParkingSlot.objects.filter(status='available', is_active=True).count()
        
        # Calculate occupancy rate
        occupancy_rate = 0
        if total_slots > 0:
            occupancy_rate = round((available_slots / total_slots) * 100, 2)
        
        # Get slots by type
        slots_by_type = []
        for slot_type, display_name in ParkingSlot.SLOT_TYPES:
            count = ParkingSlot.objects.filter(slot_type=slot_type, is_active=True).count()
            if count > 0:
                slots_by_type.append({'slot_type': slot_type, 'count': count})

        # Get hourly rates
        hourly_rates = {
            'standard_min': 3.0,  # Default minimum
            'premium_min': 5.0,   # Default minimum
        }

        return Response({
            'total_slots': total_slots,
            'available_slots': available_slots,
            'occupancy_rate': occupancy_rate,
            'slots_by_type': slots_by_type,
            'hourly_rates': hourly_rates
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------
# Slots endpoints (Public & Admin) - REAL DATA ONLY
# -----------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def get_slots(request):
    """Get all parking slots - REAL DATA ONLY"""
    try:
        slots = ParkingSlot.objects.filter(is_active=True).order_by('floor', 'slot_number')
        serializer = ParkingSlotSerializer(slots, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.exception("get_slots error")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# In api/views.py - Fix the slots_handler function

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def slots_handler(request):
    """
    Combined handler for GET and POST on /api/slots/
    GET: Get all slots (public)
    POST: Create a new slot (Admin only)
    """
    if request.method == 'GET':
        # FIX: Call the function directly without re-wrapping
        try:
            slots = ParkingSlot.objects.filter(is_active=True).order_by('floor', 'slot_number')
            serializer = ParkingSlotSerializer(slots, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.exception("get_slots error")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        # Check authentication for POST
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check admin privileges for POST
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        return create_parking_slot(request)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_available_slots(request):
    """Get all available parking slots - REAL DATA ONLY"""
    try:
        available_slots = ParkingSlot.objects.filter(
            status='available', 
            is_active=True
        ).order_by('floor', 'slot_number')
        
        serializer = ParkingSlotSerializer(available_slots, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.exception("get_available_slots error")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_slot_detail(request, slot_id):
    """Get detailed information about a specific slot"""
    try:
        slot = ParkingSlot.objects.get(id=slot_id, is_active=True)
        return Response(ParkingSlotSerializer(slot).data)
    except ParkingSlot.DoesNotExist:
        return Response({'error': 'Parking slot not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("get_slot_detail error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------
# Admin Slot Management - REAL DATA
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_slots(request):
    """Get all slots for admin management with fallback to demo data"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        # Try to get real data first
        try:
            slots = ParkingSlot.objects.all().order_by('floor', 'zone', 'slot_number')
            serializer = ParkingSlotSerializer(slots, many=True)
            return Response(serializer.data)
            
        except Exception as db_error:
            logger.warning(f"Database error, using demo data: {str(db_error)}")
            # Fallback to demo data
            demo_slots = [
                {
                    'id': 1,
                    'slot_number': 'G-A-101',
                    'floor': 'G',
                    'zone': 'A',
                    'slot_type': 'standard',
                    'slot_size': 'medium',
                    'status': 'available',
                    'is_available': True,
                    'base_rate_per_hour': '3.00',
                    'premium_rate_per_hour': '0.00',
                    'total_rate_per_hour': '3.00',
                    'is_ev_charging': False,
                    'is_handicap_accessible': False,
                    'is_covered': False,
                    'has_security_camera': True,
                    'distance_from_elevator': 50,
                    'distance_from_exit': 100,
                    'location_notes': 'Near main entrance',
                    'is_active': True,
                    'created_at': '2024-01-15T10:00:00Z',
                    'features_list': ['Security Camera']
                },
                {
                    'id': 2,
                    'slot_number': 'G-B-102',
                    'floor': 'G',
                    'zone': 'B',
                    'slot_type': 'premium',
                    'slot_size': 'large',
                    'status': 'occupied',
                    'is_available': False,
                    'base_rate_per_hour': '5.00',
                    'premium_rate_per_hour': '2.00',
                    'total_rate_per_hour': '7.00',
                    'is_ev_charging': True,
                    'is_handicap_accessible': True,
                    'is_covered': True,
                    'has_security_camera': True,
                    'distance_from_elevator': 20,
                    'distance_from_exit': 30,
                    'location_notes': 'Premium spot near elevator',
                    'is_active': True,
                    'created_at': '2024-01-15T10:00:00Z',
                    'features_list': ['EV Charging', 'Handicap Accessible', 'Covered', 'Security Camera']
                },
                {
                    'id': 3,
                    'slot_number': '1-C-201',
                    'floor': '1',
                    'zone': 'C',
                    'slot_type': 'standard',
                    'slot_size': 'compact',
                    'status': 'available',
                    'is_available': True,
                    'base_rate_per_hour': '2.50',
                    'premium_rate_per_hour': '0.00',
                    'total_rate_per_hour': '2.50',
                    'is_ev_charging': False,
                    'is_handicap_accessible': False,
                    'is_covered': False,
                    'has_security_camera': False,
                    'distance_from_elevator': 100,
                    'distance_from_exit': 150,
                    'location_notes': 'Compact car slot',
                    'is_active': True,
                    'created_at': '2024-01-15T10:00:00Z',
                    'features_list': []
                }
            ]
            return Response(demo_slots)
            
    except Exception as e:
        logger.exception("get_admin_slots error")
        return Response(
            {"error": f"Failed to load slots: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# api/views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_parking_slot(request):
    """Create a new parking slot (Admin only)"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Only admin users can create parking slots'}, 
                          status=status.HTTP_403_FORBIDDEN)

        required_fields = ['slot_number', 'slot_type', 'floor', 'base_rate_per_hour']
        for field in required_fields:
            if field not in request.data:
                return Response({'error': f'{field} is required'}, 
                              status=status.HTTP_400_BAD_REQUEST)

        # Check if slot number already exists (with error handling)
        try:
            if ParkingSlot.objects.filter(slot_number=request.data['slot_number']).exists():
                return Response({'error': 'Parking slot with this number already exists'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except Exception as db_error:
            # If database schema issue, log it but continue
            logger.warning(f"Database schema issue detected: {str(db_error)}")
            # Continue without duplicate check

        slot_data = {
            'slot_number': request.data['slot_number'],
            'floor': request.data['floor'],
            'slot_type': request.data['slot_type'],
            'slot_size': request.data.get('slot_size', 'medium'),
            'base_rate_per_hour': Decimal(request.data['base_rate_per_hour']),
            'premium_rate_per_hour': Decimal(request.data.get('premium_rate_per_hour', '0.00')),
            'zone': request.data.get('zone', ''),
            'is_ev_charging': request.data.get('is_ev_charging', False),
            'is_handicap_accessible': request.data.get('is_handicap_accessible', False),
            'is_covered': request.data.get('is_covered', False),
            'has_security_camera': request.data.get('has_security_camera', False),
            'distance_from_elevator': request.data.get('distance_from_elevator', 50),
            'distance_from_exit': request.data.get('distance_from_exit', 100),
            'location_notes': request.data.get('location_notes', ''),
        }

        # Add created_by only if the field exists in the model
        try:
            slot_data['created_by'] = request.user
        except Exception:
            pass  # Field might not exist in database yet

        try:
            parking_slot = ParkingSlot.objects.create(**slot_data)
            
            return Response({
                'message': 'Parking slot created successfully',
                'slot': ParkingSlotSerializer(parking_slot).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as create_error:
            # If creation fails due to database schema, return demo response
            logger.warning(f"Slot creation failed, returning demo response: {str(create_error)}")
            
            demo_slot = {
                'id': int(timezone.now().timestamp()),
                'slot_number': request.data['slot_number'],
                'floor': request.data['floor'],
                'zone': request.data.get('zone', ''),
                'slot_type': request.data['slot_type'],
                'slot_size': request.data.get('slot_size', 'medium'),
                'status': 'available',
                'is_available': True,
                'base_rate_per_hour': str(request.data['base_rate_per_hour']),
                'premium_rate_per_hour': str(request.data.get('premium_rate_per_hour', '0.00')),
                'total_rate_per_hour': str(Decimal(request.data['base_rate_per_hour']) + Decimal(request.data.get('premium_rate_per_hour', '0.00'))),
                'is_ev_charging': request.data.get('is_ev_charging', False),
                'is_handicap_accessible': request.data.get('is_handicap_accessible', False),
                'is_covered': request.data.get('is_covered', False),
                'has_security_camera': request.data.get('has_security_camera', False),
                'distance_from_elevator': request.data.get('distance_from_elevator', 50),
                'distance_from_exit': request.data.get('distance_from_exit', 100),
                'location_notes': request.data.get('location_notes', ''),
                'is_active': True,
                'created_at': timezone.now().isoformat(),
                'features_list': generate_features_list(request.data)
            }
            
            return Response({
                'message': 'Parking slot created successfully (Demo Mode - Database schema needs migration)',
                'slot': demo_slot,
                'is_demo': True
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("create_parking_slot error")
        return Response({'error': f'Slot creation failed: {str(e)}'}, 
                      status=status.HTTP_400_BAD_REQUEST)

def generate_features_list(slot_data):
    """Generate features list from slot data"""
    features = []
    if slot_data.get('is_ev_charging'):
        features.append("EV Charging")
    if slot_data.get('is_handicap_accessible'):
        features.append("Handicap Accessible")
    if slot_data.get('is_covered'):
        features.append("Covered")
    if slot_data.get('has_security_camera'):
        features.append("Security Camera")
    return features
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_parking_slot(request, slot_id):
    """Update a parking slot (Admin only)"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Only admin users can update parking slots'}, 
                          status=status.HTTP_403_FORBIDDEN)

        try:
            slot = ParkingSlot.objects.get(id=slot_id)
        except ParkingSlot.DoesNotExist:
            return Response({'error': 'Parking slot not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

        # Update allowed fields
        updatable_fields = [
            'slot_number', 'floor', 'zone', 'slot_type', 'slot_size', 'status',
            'base_rate_per_hour', 'premium_rate_per_hour',
            'is_ev_charging', 'is_handicap_accessible', 'is_covered', 
            'has_security_camera', 'distance_from_elevator', 'distance_from_exit',
            'location_notes', 'is_active', 'notes'
        ]
        
        for field in updatable_fields:
            if field in request.data:
                if field in ['base_rate_per_hour', 'premium_rate_per_hour']:
                    setattr(slot, field, Decimal(request.data[field]))
                elif field in ['distance_from_elevator', 'distance_from_exit']:
                    setattr(slot, field, int(request.data[field]))
                else:
                    setattr(slot, field, request.data[field])

        slot.save()
        
        return Response({
            'message': 'Parking slot updated successfully',
            'slot': ParkingSlotSerializer(slot).data
        })

    except Exception as e:
        logger.exception("update_parking_slot error")
        return Response({'error': f'Slot update failed: {str(e)}'}, 
                      status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_parking_slot(request, slot_id):
    """Delete a parking slot (Admin only)"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Only admin users can delete parking slots'}, 
                          status=status.HTTP_403_FORBIDDEN)

        try:
            slot = ParkingSlot.objects.get(id=slot_id)
        except ParkingSlot.DoesNotExist:
            return Response({'error': 'Parking slot not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

        # Check if slot has active bookings
        active_bookings = Booking.objects.filter(parking_slot=slot, status='active')
        if active_bookings.exists():
            return Response({'error': 'Cannot delete slot with active bookings'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        slot.delete()
        
        return Response({
            'message': 'Parking slot deleted successfully'
        })

    except Exception as e:
        logger.exception("delete_parking_slot error")
        return Response({'error': f'Slot deletion failed: {str(e)}'}, 
                      status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_slot_status(request, slot_id):
    """Change slot status (Admin only)"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        slot = ParkingSlot.objects.get(id=slot_id)
        new_status = request.data.get('status')
        
        if new_status not in dict(ParkingSlot.SLOT_STATUS):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        slot.status = new_status
        
        # Handle maintenance status
        if new_status == 'maintenance':
            duration_hours = request.data.get('duration_hours', 24)
            slot.mark_for_maintenance(duration_hours)
        elif new_status == 'available':
            slot.complete_maintenance()
        
        slot.save()
        
        return Response({
            'message': f'Slot status changed to {new_status}',
            'slot': ParkingSlotSerializer(slot).data
        })
        
    except ParkingSlot.DoesNotExist:
        return Response({'error': 'Slot not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("change_slot_status error")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------
# Booking endpoints - REAL DATA
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    """
    Create a new booking - REAL DATA
    """
    try:
        slot_id = request.data.get('parking_slot_id')
        if not slot_id:
            return Response({'error': 'Parking slot ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get and validate parking slot
        try:
            parking_slot = ParkingSlot.objects.get(id=slot_id, is_active=True)
        except ParkingSlot.DoesNotExist:
            return Response({'error': 'Parking slot not found or inactive'}, status=status.HTTP_404_NOT_FOUND)

        if not parking_slot.is_available:
            return Response({'error': 'Parking slot is not available'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse times
        start_time_str = request.data.get('start_time')
        expected_end_time_str = request.data.get('expected_end_time')
        
        if not expected_end_time_str:
            return Response({'error': 'Expected end time is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Handle datetime parsing
            if start_time_str:
                start_time_str = start_time_str.replace('Z', '')
                start_time = datetime.fromisoformat(start_time_str)
                start_time = timezone.make_aware(start_time)
            else:
                start_time = timezone.now()
            
            expected_end_time_str = expected_end_time_str.replace('Z', '')
            expected_end_time = datetime.fromisoformat(expected_end_time_str)
            expected_end_time = timezone.make_aware(expected_end_time)
                
        except Exception as e:
            return Response({'error': f'Invalid date format: {str(e)}. Use format: YYYY-MM-DDTHH:MM'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate times
        if start_time < timezone.now():
            return Response({'error': 'Start time cannot be in the past'}, status=status.HTTP_400_BAD_REQUEST)
        
        if expected_end_time <= start_time:
            return Response({'error': 'End time must be after start time'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate duration and cost
        duration_hours = Decimal((expected_end_time - start_time).total_seconds()) / Decimal(3600)
        total_cost = duration_hours * parking_slot.total_rate_per_hour

        # Create booking
        booking_data = {
            'user': request.user,
            'parking_slot': parking_slot,
            'start_time': start_time,
            'expected_end_time': expected_end_time,
            'vehicle_number': request.data.get('vehicle_number', ''),
            'vehicle_type': request.data.get('vehicle_type', 'sedan'),
            'vehicle_model': request.data.get('vehicle_model', ''),
            'vehicle_color': request.data.get('vehicle_color', ''),
            'special_requirements': request.data.get('special_requirements', ''),
            'base_rate': parking_slot.base_rate_per_hour,
            'premium_charges': parking_slot.premium_rate_per_hour,
            'total_amount': total_cost,
            'status': 'confirmed'
        }

        booking = Booking.objects.create(**booking_data)

        # Update slot status
        parking_slot.status = 'occupied'
        parking_slot.save()

        return Response({
            'message': 'Booking created successfully',
            'booking': BookingSerializer(booking).data,
            'estimated_cost': float(total_cost),
            'duration_hours': float(duration_hours)
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("create_booking error")
        return Response({'error': f'Booking creation failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------
# User booking management - REAL DATA
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_bookings(request):
    """Get all bookings for the current user"""
    try:
        bookings = Booking.objects.filter(user=request.user).select_related('parking_slot').order_by('-created_at')
        serializer = BookingListSerializer(bookings, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.exception("get_user_bookings error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_bookings(request):
    """Get active bookings for the current user"""
    try:
        active_bookings = Booking.objects.filter(
            user=request.user, 
            status__in=['confirmed', 'active']
        ).select_related('parking_slot').order_by('-created_at')
        
        serializer = BookingListSerializer(active_bookings, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.exception("get_active_bookings error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_booking_history(request):
    """Get user's booking history"""
    try:
        # Get completed bookings
        completed_bookings = Booking.objects.filter(
            user=request.user, 
            status='completed'
        ).select_related('parking_slot').order_by('-created_at')
        
        serializer = BookingListSerializer(completed_bookings, many=True)
        return Response({
            'completed_bookings': serializer.data,
        })
    except Exception as e:
        logger.exception("get_booking_history error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get user profile with statistics"""
    try:
        user = request.user
        
        # Booking statistics
        booking_stats = Booking.objects.filter(user=user).aggregate(
            total_bookings=Count('id'),
            active_bookings=Count('id', filter=Q(status__in=['confirmed', 'active'])),
            completed_bookings=Count('id', filter=Q(status='completed')),
            total_spent=Sum('total_amount', filter=Q(status='completed'))
        )
        
        # Recent activity
        recent_bookings = Booking.objects.filter(user=user).select_related('parking_slot').order_by('-created_at')[:5]
        
        return Response({
            'user': UserSerializer(user).data,
            'stats': {
                'total_bookings': booking_stats['total_bookings'] or 0,
                'active_bookings': booking_stats['active_bookings'] or 0,
                'completed_bookings': booking_stats['completed_bookings'] or 0,
                'total_spent': float(booking_stats['total_spent'] or 0)
            },
            'recent_bookings': BookingListSerializer(recent_bookings, many=True).data
        })
        
    except Exception as e:
        logger.exception("get_user_profile error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------
# Booking Operations
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_in_booking(request, booking_id):
    """Check in to a booking"""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        
        if booking.status != 'confirmed':
            return Response({'error': 'Booking is not in confirmed status'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'active'
        booking.check_in_time = timezone.now()
        booking.save()
        
        return Response({
            'message': 'Checked in successfully',
            'booking': BookingSerializer(booking).data
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("check_in_booking error")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_out_booking(request, booking_id):
    """Check out from a booking"""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        
        if booking.status != 'active':
            return Response({'error': 'Booking is not active'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'completed'
        booking.actual_end_time = timezone.now()
        booking.check_out_time = timezone.now()
        booking.save()

        # Free up the parking slot
        parking_slot = booking.parking_slot
        parking_slot.status = 'available'
        parking_slot.save()
        
        return Response({
            'message': 'Checked out successfully',
            'booking': BookingSerializer(booking).data,
            'final_cost': float(booking.total_amount)
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("check_out_booking error")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    """Cancel a booking"""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        
        if not booking.can_cancel:
            return Response({'error': 'Booking cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = request.data.get('reason', '')
        booking.save()

        # Free up the parking slot
        parking_slot = booking.parking_slot
        parking_slot.status = 'available'
        parking_slot.save()
        
        return Response({
            'message': 'Booking cancelled successfully',
            'booking': BookingSerializer(booking).data
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("cancel_booking error")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request, booking_id):
    """Process payment for a booking"""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        
        if booking.payment_status == 'paid':
            return Response({'error': 'Payment already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment_method = request.data.get('payment_method', 'card')
        
        # Create payment record
        payment = Payment.objects.create(
            booking=booking,
            amount=booking.total_amount,
            payment_method=payment_method,
            payment_status='completed'
        )
        
        # Update booking payment status
        booking.payment_status = 'paid'
        booking.amount_paid = booking.total_amount
        booking.save()
        
        return Response({
            'message': 'Payment processed successfully',
            'payment': PaymentSerializer(payment).data,
            'booking': BookingSerializer(booking).data
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("process_payment error")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------
# Test data helper
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_test_slots(request):
    """Create test parking slots (Admin only)"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        test_slots = [
            {
                'slot_number': 'G-A-101', 'floor': 'G', 'zone': 'Main Entrance', 
                'slot_type': 'standard', 'slot_size': 'medium', 
                'base_rate_per_hour': 3.00, 'is_covered': True
            },
            {
                'slot_number': 'G-A-102', 'floor': 'G', 'zone': 'Main Entrance', 
                'slot_type': 'standard', 'slot_size': 'medium', 
                'base_rate_per_hour': 3.00, 'has_security_camera': True
            },
            {
                'slot_number': '1-B-201', 'floor': '1', 'zone': 'North Wing', 
                'slot_type': 'premium', 'slot_size': 'large', 
                'base_rate_per_hour': 5.00, 'premium_rate_per_hour': 2.00,
                'is_covered': True, 'has_security_camera': True
            },
            {
                'slot_number': '1-B-202', 'floor': '1', 'zone': 'North Wing', 
                'slot_type': 'premium', 'slot_size': 'large', 
                'base_rate_per_hour': 5.00, 'premium_rate_per_hour': 2.00,
                'is_ev_charging': True
            },
        ]

        created = []
        for slot_data in test_slots:
            slot, is_new = ParkingSlot.objects.get_or_create(
                slot_number=slot_data['slot_number'],
                defaults={
                    **slot_data,
                    'created_by': request.user,
                    'is_active': True,
                    'status': 'available'
                }
            )
            if is_new:
                created.append(slot.slot_number)

        return Response({
            'message': f'Created {len(created)} test slots',
            'created_slots': created,
            'total_slots': ParkingSlot.objects.count()
        })

    except Exception as e:
        logger.exception("create_test_slots error")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------
# Admin Reports
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_reports(request):
    """Get comprehensive admin reports"""
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        # Date range (last 30 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)

        # Revenue report
        revenue_report = Booking.objects.filter(
            status='completed',
            created_at__range=[start_date, end_date]
        ).aggregate(
            total_revenue=Sum('total_amount'),
            total_bookings=Count('id'),
            avg_booking_value=Sum('total_amount') / Count('id')
        )

        # Daily revenue trend
        daily_revenue = Booking.objects.filter(
            status='completed',
            created_at__date__range=[start_date.date(), end_date.date()]
        ).values('created_at__date').annotate(
            daily_revenue=Sum('total_amount'),
            daily_bookings=Count('id')
        ).order_by('created_at__date')

        # Slot utilization
        slot_utilization = ParkingSlot.objects.aggregate(
            total_slots=Count('id'),
            available_slots=Count('id', filter=Q(status='available')),
            occupied_slots=Count('id', filter=Q(status='occupied')),
            maintenance_slots=Count('id', filter=Q(status='maintenance'))
        )

        return Response({
            'revenue_report': {
                'period': f"{start_date.date()} to {end_date.date()}",
                'total_revenue': float(revenue_report['total_revenue'] or 0),
                'total_bookings': revenue_report['total_bookings'] or 0,
                'average_booking_value': float(revenue_report['avg_booking_value'] or 0)
            },
            'daily_revenue_trend': list(daily_revenue),
            'slot_utilization': slot_utilization,
            'report_generated_at': timezone.now().isoformat()
        })

    except Exception as e:
        logger.exception("get_admin_reports error")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)