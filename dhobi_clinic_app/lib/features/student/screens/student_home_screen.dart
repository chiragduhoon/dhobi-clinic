import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/student_orders_provider.dart';
import '../widgets/order_card.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/notifications/providers/notifications_provider.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class StudentHomeScreen extends ConsumerWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final ordersAsync = ref.watch(myOrdersProvider);
    final unread = ref.watch(unreadCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text(AppStrings.appName),
          if (user != null)
            Text('Hi, ${user.name.split(' ').first}',
                style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ]),
        actions: [
          IconButton(tooltip: 'My Bag QR', icon: const Icon(Icons.qr_code_2),
              onPressed: () => context.push('/student/bag-qr')),
          Stack(alignment: Alignment.center, children: [
            IconButton(icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push('/notifications')),
            if (unread > 0) Positioned(right: 8, top: 8, child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 9)))),
          ]),
          IconButton(icon: const Icon(Icons.logout),
              onPressed: () => ref.read(authProvider.notifier).logout()),
        ],
      ),
      body: ordersAsync.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (orders) {
          final active = orders.where((o) => !o.isDelivered).toList();
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myOrdersProvider),
            child: active.isEmpty
                ? ListView(children: const [SizedBox(height: 120),
                    EmptyStateWidget(message: 'No active laundry', icon: Icons.local_laundry_service)])
                : ListView(padding: const EdgeInsets.symmetric(vertical: 8),
                    children: active.map((o) => OrderCard(order: o)).toList()),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/student/place-order'),
        icon: const Icon(Icons.add), label: const Text('New Request'),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          if (i == 1) context.push('/student/bag-qr');
          if (i == 2) context.push('/student/history');
          if (i == 3) context.push('/notifications');
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_2), label: 'Bag QR'),
          BottomNavigationBarItem(icon: Icon(Icons.insights_outlined), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications_outlined), label: 'Alerts'),
        ],
      ),
    );
  }
}
