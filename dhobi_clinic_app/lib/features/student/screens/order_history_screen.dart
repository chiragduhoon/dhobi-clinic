import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/student_orders_provider.dart';
import '../widgets/order_card.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/widgets/loading_indicator.dart';

class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(laundryHistoryProvider);
    final ordersAsync = ref.watch(myOrdersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Laundry History')),
      body: RefreshIndicator(
        onRefresh: () async { ref.invalidate(laundryHistoryProvider); ref.invalidate(myOrdersProvider); },
        child: ListView(padding: const EdgeInsets.all(16), children: [
          statsAsync.when(
            loading: () => const Padding(padding: EdgeInsets.all(24), child: LoadingIndicator()),
            error: (e, _) => Text('Error: $e'),
            data: (s) => GridView.count(
              shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2, childAspectRatio: 1.7, crossAxisSpacing: 12, mainAxisSpacing: 12,
              children: [
                _stat('Total Orders', '${s['total_orders'] ?? 0}', Icons.receipt_long, AppColors.primary),
                _stat('Clothes Processed', '${s['total_clothes'] ?? 0}', Icons.checkroom, AppColors.accent),
                _stat('Completed', '${s['completed_orders'] ?? 0}', Icons.done_all, AppColors.success),
                _stat('Avg Time', '${s['avg_processing_hours'] ?? 0}h', Icons.timer_outlined, AppColors.warning),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Padding(padding: EdgeInsets.symmetric(vertical: 8),
              child: Text('Past Orders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
          ordersAsync.when(
            loading: () => const LoadingIndicator(),
            error: (e, _) => Text('Error: $e'),
            data: (orders) {
              final past = orders.where((o) => o.isDelivered).toList();
              if (past.isEmpty) {
                return const Padding(padding: EdgeInsets.all(24),
                    child: Center(child: Text('No completed orders yet',
                        style: TextStyle(color: AppColors.textSecondary))));
              }
              return Column(children: past.map((o) => OrderCard(order: o)).toList());
            },
          ),
        ]),
      ),
    );
  }

  Widget _stat(String label, String value, IconData icon, Color color) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.3))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Icon(icon, color: color),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ]),
        ]),
      );
}
