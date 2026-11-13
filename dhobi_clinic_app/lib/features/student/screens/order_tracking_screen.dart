import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/student_orders_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/models/order_model.dart';
import '../../../shared/widgets/loading_indicator.dart';

class OrderTrackingScreen extends ConsumerWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  String _fmt(DateTime d) {
    final l = d.toLocal();
    return '${l.day}/${l.month} ${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(orderDetailProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('Track Laundry'), actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: () => ref.invalidate(orderDetailProvider(orderId))),
      ]),
      body: async.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (o) => ListView(padding: const EdgeInsets.all(16), children: [
          _statusBanner(o),
          if (o.isReady && o.collectionOtp != null) _otpCard(o),
          _etaCard(o),
          _itemsCard(o),
          _timelineCard(o),
        ]),
      ),
    );
  }

  Widget _statusBanner(OrderModel o) {
    final color = o.hasException ? AppColors.error : AppColors.stageColor(o.currentStage);
    final label = o.hasException
        ? (AppStrings.exceptionLabel[o.exceptionState] ?? o.exceptionState!)
        : (AppStrings.stageState[o.currentStage] ?? o.currentStage);
    return Card(
      color: color.withValues(alpha: 0.1),
      child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [
        Icon(o.hasException ? Icons.warning_amber : Icons.local_laundry_service, color: color),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(o.bagNumber ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          Text('Current: $label', style: TextStyle(color: color, fontWeight: FontWeight.w600)),
          if (o.currentHandlerName != null)
            Text('Handler: ${o.currentHandlerName}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ]),
      ])),
    );
  }

  Widget _otpCard(OrderModel o) => Card(
        color: AppColors.success.withValues(alpha: 0.1),
        child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          const Text('Collection OTP', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(o.collectionOtp!,
              style: const TextStyle(fontSize: 34, fontWeight: FontWeight.bold,
                  letterSpacing: 8, color: AppColors.success)),
          const Text('Show this at the counter to collect your bag.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ])),
      );

  Widget _etaCard(OrderModel o) {
    if (o.isDelivered || o.expectedCompletionTime == null) return const SizedBox.shrink();
    return Card(
      child: ListTile(
        leading: const Icon(Icons.schedule, color: AppColors.primary),
        title: const Text('Estimated Ready Time'),
        subtitle: Text('${_fmt(o.expectedCompletionTime!)}  (within 48–60h of submission)'),
      ),
    );
  }

  Widget _itemsCard(OrderModel o) => Card(
        child: Padding(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${o.totalItems} garments', style: const TextStyle(fontWeight: FontWeight.bold)),
          const Divider(),
          ...o.items.map((it) => Padding(padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(children: [
                Icon(it.category == 'small' ? Icons.style : Icons.checkroom,
                    size: 15, color: AppColors.textSecondary),
                const SizedBox(width: 8),
                Expanded(child: Text(it.itemType.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(fontSize: 13))),
                Text('×${it.quantity}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
              ]))),
          if (o.notes != null) ...[const Divider(),
            Text('Note: ${o.notes}', style: const TextStyle(
                fontStyle: FontStyle.italic, color: AppColors.textSecondary))],
        ])),
      );

  Widget _timelineCard(OrderModel o) => Card(
        child: Padding(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Handling History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...o.timeline.asMap().entries.map((e) {
            final ev = e.value; final last = e.key == o.timeline.length - 1;
            final color = ev.kind == 'exception' ? AppColors.error
                : ev.kind == 'rework' ? AppColors.warning
                : AppColors.stageColor(ev.stage);
            return IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Column(children: [
                Container(width: 14, height: 14, decoration: BoxDecoration(
                    color: color, shape: BoxShape.circle)),
                if (!last) Expanded(child: Container(width: 2, color: AppColors.divider)),
              ]),
              const SizedBox(width: 12),
              Expanded(child: Padding(padding: const EdgeInsets.only(bottom: 14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(AppStrings.stageLabel[ev.stage] ?? ev.stage,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(ev.workerName != null ? 'by ${ev.workerName}'
                      : (ev.kind == 'exception' ? (ev.notes ?? 'Admin update') : 'You'),
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  Text(_fmt(ev.at), style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                ]))),
            ]));
          }),
        ])),
      );
}
