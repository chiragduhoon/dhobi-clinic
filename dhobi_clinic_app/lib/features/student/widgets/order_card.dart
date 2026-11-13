import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/models/order_model.dart';

class OrderCard extends StatelessWidget {
  final OrderModel order;
  final String routePrefix;
  const OrderCard({super.key, required this.order, this.routePrefix = '/student'});

  @override
  Widget build(BuildContext context) {
    final color = order.hasException ? AppColors.error : AppColors.stageColor(order.currentStage);
    final label = order.hasException
        ? (AppStrings.exceptionLabel[order.exceptionState] ?? order.exceptionState!)
        : (AppStrings.stageState[order.currentStage] ?? order.currentStage);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('$routePrefix/orders/${order.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(order.bagNumber ?? 'Order',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20)),
                child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12)),
              ),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.checkroom, size: 15, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text('${order.totalItems} items', style: const TextStyle(color: AppColors.textSecondary)),
              if (order.currentHandlerName != null) ...[
                const Spacer(),
                const Icon(Icons.person_outline, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 3),
                Text(order.currentHandlerName!,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ]),
            if (order.studentName != null) ...[
              const SizedBox(height: 4),
              Text('${order.studentName}${order.hostel != null ? ' · ${order.hostel}' : ''}'
                  '${order.roomNumber != null ? ' · ${order.roomNumber}' : ''}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ],
          ]),
        ),
      ),
    );
  }
}
