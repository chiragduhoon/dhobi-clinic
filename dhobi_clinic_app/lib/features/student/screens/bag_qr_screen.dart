import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../providers/student_orders_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/loading_indicator.dart';

class BagQrScreen extends ConsumerWidget {
  const BagQrScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final bagAsync = ref.watch(myBagProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Bag QR')),
      body: bagAsync.when(
        loading: () => const LoadingIndicator(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (bag) {
          if (bag == null) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.shopping_bag_outlined, size: 64, color: AppColors.textSecondary),
                  SizedBox(height: 12),
                  Text('No bag assigned yet',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Please collect your permanent laundry bag from the laundry counter. '
                      'Once issued, your QR will appear here.',
                      textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
                ]),
              ),
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(children: [
              const Text('Show this QR at the laundry counter',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(16),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 12)],
                ),
                child: Column(children: [
                  QrImageView(
                    data: bag.qrToken, version: QrVersions.auto, size: 240,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppColors.primary),
                    dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square, color: AppColors.primaryDark),
                  ),
                  const SizedBox(height: 16),
                  Text(bag.bagNumber,
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  if (user != null) ...[
                    const SizedBox(height: 4),
                    Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    if (user.enrollmentNo != null)
                      Text(user.enrollmentNo!, style: const TextStyle(color: AppColors.textSecondary)),
                    if (user.hostel != null || user.roomNumber != null)
                      Text([user.hostel, user.roomNumber].where((e) => e != null).join(' · '),
                          style: const TextStyle(color: AppColors.textSecondary)),
                  ],
                ]),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12)),
                child: const Row(children: [
                  Icon(Icons.verified_user_outlined, color: AppColors.primary),
                  SizedBox(width: 10),
                  Expanded(child: Text(
                    'This QR is permanent and tied to your bag. Staff scan it at every stage to track your laundry.',
                    style: TextStyle(fontSize: 13))),
                ]),
              ),
            ]),
          );
        },
      ),
    );
  }
}
