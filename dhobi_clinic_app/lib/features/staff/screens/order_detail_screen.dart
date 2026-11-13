import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/staff_orders_provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/models/order_model.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/widgets/loading_indicator.dart';

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(workerOrderDetailProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('Bag Detail')),
      body: async.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (o) => _Body(order: o, onChanged: () {
          ref.invalidate(workerOrderDetailProvider(orderId));
          ref.invalidate(workloadProvider);
          ref.invalidate(workerHistoryProvider);
        }),
      ),
    );
  }
}

class _Body extends ConsumerStatefulWidget {
  final OrderModel order;
  final VoidCallback onChanged;
  const _Body({required this.order, required this.onChanged});
  @override
  ConsumerState<_Body> createState() => _BodyState();
}

class _BodyState extends ConsumerState<_Body> {
  final _notes = TextEditingController();
  final _otp = TextEditingController();
  bool _loading = false;

  @override
  void dispose() { _notes.dispose(); _otp.dispose(); super.dispose(); }

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _complete() async {
    final o = widget.order;
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).post(ApiConstants.completeStage(o.id),
          data: {'expected_stage': o.currentStage, 'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim()});
      if (mounted) { _snack('Stage completed'); widget.onChanged(); Navigator.of(context).maybePop(); }
    } on DioException catch (e) {
      final msg = (e.response?.data is Map ? e.response?.data['error'] as String? : null) ?? 'Failed';
      if (mounted) _snack(msg);
    } finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _deliver() async {
    if (_otp.text.trim().length != 6) { _snack('Enter the 6-digit OTP'); return; }
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).post(ApiConstants.deliver(widget.order.id), data: {'otp': _otp.text.trim()});
      if (mounted) { _snack('Delivered — collection verified'); widget.onChanged(); Navigator.of(context).maybePop(); }
    } on DioException catch (e) {
      final msg = (e.response?.data is Map ? e.response?.data['error'] as String? : null) ?? 'Failed';
      if (mounted) _snack(msg);
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final color = o.hasException ? AppColors.error : AppColors.stageColor(o.currentStage);
    return Column(children: [
      Expanded(child: ListView(padding: const EdgeInsets.all(16), children: [
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [
          const CircleAvatar(backgroundColor: AppColors.primaryLight,
              child: Icon(Icons.person, color: Colors.white)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(o.bagNumber ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text(o.studentName ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
            if (o.enrollmentNo != null) Text(o.enrollmentNo!, style: const TextStyle(color: AppColors.textSecondary)),
            Text([o.hostel, o.roomNumber].where((e) => e != null).join(' · '),
                style: const TextStyle(color: AppColors.textSecondary)),
          ])),
        ]))),
        Card(child: ListTile(
          leading: Icon(o.hasException ? Icons.warning_amber : Icons.local_laundry_service, color: color),
          title: Text('Current: ${o.hasException ? (AppStrings.exceptionLabel[o.exceptionState] ?? o.exceptionState!) : (AppStrings.stageState[o.currentStage] ?? o.currentStage)}',
              style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          subtitle: o.currentHandlerName != null ? Text('Last handler: ${o.currentHandlerName}') : null,
        )),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${o.totalItems} garments', style: const TextStyle(fontWeight: FontWeight.bold)),
          const Divider(),
          ...o.items.map((it) => Padding(padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(children: [
                Expanded(child: Text(it.itemType.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(fontSize: 13))),
                Text('×${it.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
              ]))),
          if (o.notes != null) ...[const Divider(), Text('Note: ${o.notes}',
              style: const TextStyle(fontStyle: FontStyle.italic, color: AppColors.textSecondary))],
        ]))),
      ])),
      _actionBar(o),
    ]);
  }

  Widget _actionBar(OrderModel o) {
    if (o.hasException) {
      return _bar(Container(padding: const EdgeInsets.all(12),
        child: Text('Locked: ${AppStrings.exceptionLabel[o.exceptionState] ?? o.exceptionState!} — admin must clear.',
            textAlign: TextAlign.center, style: const TextStyle(color: AppColors.error))));
    }
    if (o.isDelivered) {
      return _bar(const Padding(padding: EdgeInsets.all(12),
          child: Text('Delivered ✓', textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold))));
    }
    if (_loading) return _bar(const Padding(padding: EdgeInsets.all(12), child: Center(child: CircularProgressIndicator())));
    if (o.isReady) {
      return _bar(Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: _otp, keyboardType: TextInputType.number, maxLength: 6,
            decoration: const InputDecoration(labelText: 'Student Collection OTP', counterText: '')),
        const SizedBox(height: 8),
        SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _deliver, icon: const Icon(Icons.verified),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            label: const Text('Verify OTP & Deliver'))),
      ]));
    }
    return _bar(Column(mainAxisSize: MainAxisSize.min, children: [
      TextField(controller: _notes,
          decoration: const InputDecoration(labelText: 'Remarks (optional)')),
      const SizedBox(height: 8),
      SizedBox(width: double.infinity, child: ElevatedButton.icon(
          onPressed: _complete, icon: const Icon(Icons.arrow_forward),
          label: Text(AppStrings.completeActionLabel(o.currentStage)))),
    ]));
  }

  Widget _bar(Widget child) => Container(padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))]),
      child: SafeArea(top: false, child: child));
}
