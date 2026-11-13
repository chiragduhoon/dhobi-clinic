import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService(ref.read(apiServiceProvider));
});

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background messages are handled by the OS notification system automatically
}

class FcmService {
  final ApiService _api;
  final _localNotifications = FlutterLocalNotificationsPlugin();

  FcmService(this._api);

  bool _firebaseAvailable() {
    try {
      FirebaseMessaging.instance.toString();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> init() async {
    if (!_firebaseAvailable()) return;
    try {
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    } catch (_) {
      return;
    }

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
    );

    // Request iOS permission
    await FirebaseMessaging.instance.requestPermission();

    // Foreground notification channel for Android
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          'laundry_channel',
          'Laundry Updates',
          description: 'Notifications about your laundry order status',
          importance: Importance.high,
        ));

    FirebaseMessaging.onMessage.listen(_handleForeground);
    FirebaseMessaging.instance.onTokenRefresh.listen(uploadToken);
  }

  void _handleForeground(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'laundry_channel',
          'Laundry Updates',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  Future<void> getAndUploadToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await uploadToken(token);
    } catch (_) {}
  }

  Future<void> uploadToken(String token) async {
    try {
      await _api.post(ApiConstants.deviceToken, data: {'token': token});
    } catch (_) {}
  }

  Future<void> removeToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _api.delete(ApiConstants.deviceToken, data: {'token': token});
      }
    } catch (_) {}
  }
}
