import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/student_orders_provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/widgets/loading_indicator.dart';

class PlaceOrderScreen extends ConsumerStatefulWidget {
  const PlaceOrderScreen({super.key});
  @override
  ConsumerState<PlaceOrderScreen> createState() => _PlaceOrderScreenState();
}

class _PlaceOrderScreenState extends ConsumerState<PlaceOrderScreen> {
  final Map<String, int> _qty = {};
  final _notes = TextEditingController();
  bool _ackBleed = false, _ackPockets = false, _loading = false;

  @override
  void dispose() { _notes.dispose(); super.dispose(); }

  int _count(List<Map<String, dynamic>> items, String cat) => items
      .where((i) => i['category'] == cat)
      .fold(0, (s, i) => s + (_qty[i['key']] ?? 0));

  Future<void> _submit(List<Map<String, dynamic>> catalog) async {
    final large = _count(catalog, 'large'), small = _count(catalog, 'small');
    if (large + small == 0) { _snack('Add at least one garment'); return; }
    if (large > AppStrings.maxLarge) { _snack('Max ${AppStrings.maxLarge} large garments'); return; }
    if (small > AppStrings.maxSmall) { _snack('Max ${AppStrings.maxSmall} small garments'); return; }
    if (!_ackBleed || !_ackPockets) { _snack('Please accept both acknowledgements'); return; }

    setState(() => _loading = true);
    try {
      final items = _qty.entries.where((e) => e.value > 0)
          .map((e) => {'item_type': e.key, 'quantity': e.value}).toList();
      final resp = await ref.read(apiServiceProvider).post(ApiConstants.orders, data: {
        'items': items,
        'remarks': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        'ack_color_bleed': _ackBleed, 'ack_pockets_emptied': _ackPockets,
      });
      if (mounted) {
        ref.invalidate(myOrdersProvider);
        _snack('Submitted! Drop your bag at the counter.');
        context.pushReplacement('/student/orders/${resp.data['order_id']}');
      }
    } on DioException catch (e) {
      final msg = (e.response?.data is Map ? e.response?.data['error'] as String? : null) ?? 'Failed to submit';
      if (mounted) _snack(msg);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(itemCatalogProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('New Laundry Request')),
      body: catalogAsync.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (catalog) {
          final large = _count(catalog, 'large'), small = _count(catalog, 'small');
          return Column(children: [
            Expanded(
              child: ListView(padding: const EdgeInsets.all(16), children: [
                _capBar('Large garments', large, AppStrings.maxLarge),
                _grid(catalog.where((i) => i['category'] == 'large').toList()),
                const SizedBox(height: 12),
                _capBar('Small / undergarments', small, AppStrings.maxSmall),
                _grid(catalog.where((i) => i['category'] == 'small').toList()),
                const SizedBox(height: 16),
                TextField(controller: _notes, maxLines: 2,
                    decoration: const InputDecoration(labelText: 'Notes (optional)',
                        hintText: 'e.g. handle whites gently')),
                const SizedBox(height: 8),
                CheckboxListTile(
                  value: _ackBleed, onChanged: (v) => setState(() => _ackBleed = v ?? false),
                  contentPadding: EdgeInsets.zero, dense: true,
                  title: const Text('I understand color-bleeding garments are at my own risk.',
                      style: TextStyle(fontSize: 13)),
                ),
                CheckboxListTile(
                  value: _ackPockets, onChanged: (v) => setState(() => _ackPockets = v ?? false),
                  contentPadding: EdgeInsets.zero, dense: true,
                  title: const Text('I have emptied all pockets.', style: TextStyle(fontSize: 13)),
                ),
              ]),
            ),
            _bottomBar(large + small, catalog),
          ]);
        },
      ),
    );
  }

  Widget _capBar(String label, int count, int max) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text('$count / $max',
              style: TextStyle(fontWeight: FontWeight.bold,
                  color: count > max ? AppColors.error : AppColors.primary)),
        ]),
      );

  Widget _grid(List<Map<String, dynamic>> items) => GridView.builder(
        shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, childAspectRatio: 2.4, crossAxisSpacing: 10, mainAxisSpacing: 10),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final key = items[i]['key'] as String, qty = _qty[key] ?? 0;
          return Container(
            decoration: BoxDecoration(
              color: qty > 0 ? AppColors.primary.withValues(alpha: 0.08) : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: qty > 0 ? AppColors.primary : AppColors.divider),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(children: [
              Expanded(child: Text(items[i]['label'], style: const TextStyle(fontSize: 13))),
              _btn(Icons.remove, qty > 0 ? () => setState(() => _qty[key] = qty - 1) : null),
              SizedBox(width: 26, child: Text('$qty', textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold))),
              _btn(Icons.add, () => setState(() => _qty[key] = qty + 1)),
            ]),
          );
        },
      );

  Widget _btn(IconData icon, VoidCallback? onTap) => GestureDetector(
        onTap: onTap,
        child: Container(width: 24, height: 24,
            decoration: BoxDecoration(
                color: onTap != null ? AppColors.primary : AppColors.divider, shape: BoxShape.circle),
            child: Icon(icon, size: 14, color: Colors.white)),
      );

  Widget _bottomBar(int total, List<Map<String, dynamic>> catalog) => Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))]),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Total garments', style: TextStyle(fontWeight: FontWeight.w600)),
            Text('$total / ${AppStrings.maxTotal}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary)),
          ]),
          const SizedBox(height: 10),
          _loading
              ? const CircularProgressIndicator()
              : SizedBox(width: double.infinity, child: ElevatedButton.icon(
                  onPressed: total > 0 ? () => _submit(catalog) : null,
                  icon: const Icon(Icons.check), label: const Text('Submit Request'))),
        ]),
      );
}
