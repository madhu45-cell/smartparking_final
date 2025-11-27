# api/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenVerifyView
from . import views

urlpatterns = [
    # -----------------------
    # Authentication URLs - FIXED PATHS
    # -----------------------
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/token/refresh/', views.custom_token_refresh, name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # -----------------------
    # Dashboard & User URLs
    # -----------------------
    path('dashboard/', views.get_dashboard_data, name='dashboard'),
    path('user/profile/', views.get_user_profile, name='user_profile'),
    path('user/bookings/', views.get_user_bookings, name='user_bookings'),
    path('user/bookings/active/', views.get_active_bookings, name='active_bookings'),
    path('user/bookings/history/', views.get_booking_history, name='booking_history'),

    # -----------------------
    # Parking Slots URLs - FIXED
    # -----------------------
    path('slots/', views.slots_handler, name='slots_handler'),  # Combined GET/POST
    path('slots/available/', views.get_available_slots, name='available_slots'),
    path('slots/<int:slot_id>/', views.get_slot_detail, name='slot_detail'),

    # -----------------------
    # Admin URLs - FIXED
    # -----------------------
    path('admin/slots/', views.get_admin_slots, name='admin_slots'),
    path('admin/slots/create/', views.create_parking_slot, name='create_slot'),
    path('admin/slots/<int:slot_id>/update/', views.update_parking_slot, name='update_slot'),
    path('admin/slots/<int:slot_id>/delete/', views.delete_parking_slot, name='delete_slot'),
    path('admin/slots/<int:slot_id>/change-status/', views.change_slot_status, name='change_slot_status'),
    path('admin/test-slots/', views.create_test_slots, name='create_test_slots'),

    # -----------------------
    # Booking URLs - FIXED
    # -----------------------
    path('bookings/create/', views.create_booking, name='create_booking'),
    path('bookings/my/', views.get_user_bookings, name='user_bookings'),
    path('bookings/active/', views.get_active_bookings, name='active_bookings'),
    path('bookings/history/', views.get_booking_history, name='booking_history'),
    path('bookings/<int:booking_id>/check-in/', views.check_in_booking, name='check_in_booking'),
    path('bookings/<int:booking_id>/check-out/', views.check_out_booking, name='check_out_booking'),
    path('bookings/<int:booking_id>/cancel/', views.cancel_booking, name='cancel_booking'),
    path('bookings/<int:booking_id>/payment/', views.process_payment, name='process_payment'),

    # -----------------------
    # Parking Info
    # -----------------------
    path('parking/info/', views.get_parking_info, name='parking_info'),
]