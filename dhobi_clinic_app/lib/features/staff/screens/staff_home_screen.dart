import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/staff_orders_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class StaffHomeScreen extends ConsumerWidget {
  const StaffHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Laundry Worker'),
            if (user != null) Text(user.name, style: const TextStyle(fontSize: 12, color: Colors.white70)),
          ]),
          actions: [IconButton(icon: const Icon(Icons.logout),
              onPressed: () => ref.read(authProvider.notifier).logout())],
          bottom: const TabBar(indicatorColor: Colors.white, labelColor: Colors.white,
              unselectedLabelColor: Colors.white60,
              tabs: [Tab(text: 'My Workload'), Tab(text: 'My History')]),
        ),
        body: TabBarView(children: [_Workload(), _History()]),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.push('/worker/scan'),
          icon: const Icon(Icons.qr_code_scanner), label: const Text('Scan Bag'),
        ),
      ),
    );
  }
}

class _Workload extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(workloadProvider);
    return async.when(
      loading: () => const LoadingIndicator(),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (orders) => orders.isEmpty
          ? const EmptyStateWidget(message: 'No bags assigned to you', icon: Icons.assignment_outlined)
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(workloadProvider),
              child: ListView(padding: const EdgeInsets.symmetric(vertical: 8),
                children: orders.map((o) => Card(child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.stageColor(o.currentStage).withValues(alpha: 0.15),
                    child: Icon(Icons.local_laundry_service,
                        color: AppColors.stageColor(o.currentStage), size: 20)),
                  title: Text('${o.bagNumber}  ·  ${AppStrings.stageState[o.currentStage] ?? o.currentStage}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${o.studentName ?? ''}'
                      '${o.hostel != null ? ' · ${o.hostel}' : ''}'
                      '${o.roomNumber != null ? ' · ${o.roomNumber}' : ''}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/worker/orders/${o.id}'),
                ))).toList()),
            ),
    );
  }
}

class _History extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(workerHistoryProvider);
    return async.when(
      loading: () => const LoadingIndicator(),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (rows) => rows.isEmpty
          ? const EmptyStateWidget(message: 'No completed stages yet', icon: Icons.history)
          : ListView.separated(
              itemCount: rows.length, separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final r = rows[i];
                return ListTile(
                  dense: true,
                  leading: const Icon(Icons.check_circle_outline, color: AppColors.success),
                  title: Text('${r['bag_number']} — ${AppStrings.stageLabel[r['stage']] ?? r['stage']}'),
                  subtitle: Text('${DateTime.parse(r['completed_at']).toLocal()}'),
                );
              },
            ),
    );
  }
}
