import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/models/order_model.dart';
import '../../../core/models/scan_result_model.dart';
import '../../../core/services/api_service.dart';

final workloadProvider = FutureProvider.autoDispose<List<OrderModel>>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.staffWorkload);
  return (resp.data as List).map((e) => OrderModel.fromJson(e)).toList();
});

final workerHistoryProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.staffHistory);
  return (resp.data as List).map((e) => Map<String, dynamic>.from(e)).toList();
});

final workerOrderDetailProvider = FutureProvider.autoDispose.family<OrderModel, String>((ref, id) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.orderById(id));
  return OrderModel.fromJson(resp.data);
});

/// Scan a bag QR token → resolve student + active order
final scanProvider = Provider((ref) => ScanService(ref));

class ScanService {
  final Ref ref;
  ScanService(this.ref);
  Future<ScanResult> scan(String token) async {
    final resp = await ref.read(apiServiceProvider).get(ApiConstants.bagScan(token));
    return ScanResult.fromJson(resp.data);
  }
}
