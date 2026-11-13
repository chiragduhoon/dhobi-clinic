import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../providers/staff_orders_provider.dart';
import '../../../core/constants/app_colors.dart';

class QRScanScreen extends ConsumerStatefulWidget {
  const QRScanScreen({super.key});
  @override
  ConsumerState<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends ConsumerState<QRScanScreen> {
  final _ctrl = MobileScannerController();
  bool _busy = false;

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _onDetect(BarcodeCapture cap) async {
    if (_busy) return;
    final code = cap.barcodes.firstOrNull?.rawValue;
    if (code == null) return;
    setState(() => _busy = true);
    await _ctrl.stop();
    try {
      final result = await ref.read(scanProvider).scan(code);
      if (!mounted) return;
      if (result.activeOrder == null) {
        await _info('Bag ${result.bag.bagNumber}',
            'No active laundry request found for this bag.');
        await _resume();
      } else {
        // Go to detail (holds complete/deliver actions); resume scan on return
        await context.push('/worker/orders/${result.activeOrder!.id}');
        await _resume();
      }
    } catch (_) {
      if (mounted) {
        await _info('Not recognised', 'This QR is not a valid bag code.');
        await _resume();
      }
    }
  }

  Future<void> _resume() async {
    if (!mounted) return;
    setState(() => _busy = false);
    await _ctrl.start();
  }

  Future<void> _info(String title, String body) => showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: Text(title), content: Text(body),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Bag QR')),
      body: Stack(children: [
        MobileScanner(controller: _ctrl, onDetect: _onDetect),
        Center(child: Container(width: 240, height: 240,
            decoration: BoxDecoration(border: Border.all(color: AppColors.primaryLight, width: 3),
                borderRadius: BorderRadius.circular(12)))),
        Positioned(bottom: 40, left: 0, right: 0, child: Center(
          child: _busy
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text('Point at the QR on the bag',
                  style: TextStyle(color: Colors.white, fontSize: 15,
                      shadows: [Shadow(color: Colors.black54, blurRadius: 8)])),
        )),
      ]),
    );
  }
}
