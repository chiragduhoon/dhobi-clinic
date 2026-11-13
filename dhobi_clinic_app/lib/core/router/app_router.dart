import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/student/screens/student_home_screen.dart';
import '../../features/student/screens/place_order_screen.dart';
import '../../features/student/screens/order_tracking_screen.dart';
import '../../features/student/screens/order_history_screen.dart';
import '../../features/student/screens/bag_qr_screen.dart';
import '../../features/staff/screens/staff_home_screen.dart';
import '../../features/staff/screens/qr_scan_screen.dart';
import '../../features/staff/screens/order_detail_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../constants/app_colors.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final p = state.uri.path;
      final isAuthScreen = p == '/login' || p == '/register';
      if (auth.status == AuthStatus.loading) return p == '/' ? null : '/';
      if (auth.status == AuthStatus.unauthenticated) return isAuthScreen ? null : '/login';

      final role = auth.user?.role;
      if (p == '/' || isAuthScreen) {
        if (role == 'student') return '/student/home';
        if (role == 'worker') return '/worker/home';
        return '/web-admin';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/web-admin', builder: (_, __) => const _WebAdminNotice()),

      // Student
      GoRoute(path: '/student/home', builder: (_, __) => const StudentHomeScreen()),
      GoRoute(path: '/student/place-order', builder: (_, __) => const PlaceOrderScreen()),
      GoRoute(path: '/student/bag-qr', builder: (_, __) => const BagQrScreen()),
      GoRoute(path: '/student/history', builder: (_, __) => const OrderHistoryScreen()),
      GoRoute(path: '/student/orders/:id',
          builder: (_, s) => OrderTrackingScreen(orderId: s.pathParameters['id']!)),

      // Worker
      GoRoute(path: '/worker/home', builder: (_, __) => const StaffHomeScreen()),
      GoRoute(path: '/worker/scan', builder: (_, __) => const QRScanScreen()),
      GoRoute(path: '/worker/orders/:id',
          builder: (_, s) => OrderDetailScreen(orderId: s.pathParameters['id']!)),

      // Shared
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
    ],
  );
});

class _WebAdminNotice extends ConsumerWidget {
  const _WebAdminNotice();
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
        body: Center(child: Padding(padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.desktop_windows, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text('Admin Dashboard is on the web',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            const Text('Please use the Dhobi Clinic web dashboard to manage bags, orders, and reports.',
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 20),
            OutlinedButton(onPressed: () => ref.read(authProvider.notifier).logout(),
                child: const Text('Logout')),
          ]))),
      );
}
