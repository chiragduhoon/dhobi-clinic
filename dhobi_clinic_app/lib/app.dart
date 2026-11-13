import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/services/fcm_service.dart';

class DhobiClinicApp extends ConsumerStatefulWidget {
  const DhobiClinicApp({super.key});

  @override
  ConsumerState<DhobiClinicApp> createState() => _DhobiClinicAppState();
}

class _DhobiClinicAppState extends ConsumerState<DhobiClinicApp> {
  @override
  void initState() {
    super.initState();
    ref.read(fcmServiceProvider).init();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Dhobi Clinic',
      theme: AppTheme.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
