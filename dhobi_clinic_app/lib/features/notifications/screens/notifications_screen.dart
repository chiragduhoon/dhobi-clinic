import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/notifications_provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/api_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  static const _prefLabels = {
    'accepted': 'Bag accepted', 'ready_for_collection': 'Ready for collection',
    'delivered': 'Delivered', 'exception': 'Exceptions / issues',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications'), actions: [
        IconButton(icon: const Icon(Icons.tune), tooltip: 'Preferences',
            onPressed: () => _prefsSheet(context, ref)),
        TextButton(
          onPressed: () async {
            await ref.read(apiServiceProvider).patch(ApiConstants.notificationsReadAll);
            ref.invalidate(notificationsProvider);
          },
          child: const Text('Read all', style: TextStyle(color: Colors.white)),
        ),
      ]),
      body: async.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (list) => list.isEmpty
            ? const EmptyStateWidget(message: 'No notifications yet', icon: Icons.notifications_none)
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(notificationsProvider),
                child: ListView.separated(
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final n = list[i];
                    return Container(
                      color: n.isRead ? null : AppColors.primary.withValues(alpha: 0.05),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                          child: const Icon(Icons.local_laundry_service, color: AppColors.primary, size: 20)),
                        title: Text(n.title, style: TextStyle(
                            fontWeight: n.isRead ? FontWeight.normal : FontWeight.bold)),
                        subtitle: Text(n.body),
                        onTap: () async {
                          if (!n.isRead) {
                            await ref.read(apiServiceProvider).patch(ApiConstants.notificationRead(n.id));
                            ref.invalidate(notificationsProvider);
                          }
                          if (n.orderId != null && context.mounted) {
                            context.push('/student/orders/${n.orderId}');
                          }
                        },
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }

  void _prefsSheet(BuildContext context, WidgetRef ref) {
    final user = ref.read(authProvider).user;
    final prefs = Map<String, dynamic>.from(user?.notificationPrefs ?? {});
    showModalBottomSheet(context: context, builder: (_) => StatefulBuilder(
      builder: (ctx, setSheet) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Notification Preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._prefLabels.entries.map((e) => SwitchListTile(
            title: Text(e.value),
            value: prefs[e.key] != false,
            onChanged: (v) async {
              setSheet(() => prefs[e.key] = v);
              await ref.read(apiServiceProvider).patch(ApiConstants.notificationPrefs, data: {e.key: v});
              final me = await ref.read(apiServiceProvider).get(ApiConstants.me);
              ref.read(authProvider.notifier).refreshUser(UserModel.fromJson(me.data));
            },
          )),
        ]),
      ),
    ));
  }
}
