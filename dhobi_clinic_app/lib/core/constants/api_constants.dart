import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // Web/desktop → localhost; Android emulator → 10.0.2.2. Real device → machine IP.
  static final String baseUrl =
      kIsWeb ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api';

  // Auth
  static const register = '/auth/register';
  static const login = '/auth/login';
  static const me = '/auth/me';
  static const notificationPrefs = '/auth/me/notification-prefs';

  // Catalog
  static const items = '/items';

  // Bags
  static const bagMine = '/bags/mine';
  static String bagScan(String token) => '/bags/scan/$token';

  // Orders (student)
  static const orders = '/orders';
  static const myOrders = '/orders/mine';
  static const laundryHistory = '/orders/laundry-history';
  static String orderById(String id) => '/orders/$id';

  // Orders (worker)
  static const staffWorkload = '/orders/staff/workload';
  static const staffHistory = '/orders/staff/history';
  static String completeStage(String id) => '/orders/$id/complete-stage';
  static String deliver(String id) => '/orders/$id/deliver';

  // Notifications
  static const notifications = '/notifications';
  static const notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const deviceToken = '/devices/token';
}
