import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/models/bag_model.dart';
import '../../../core/models/order_model.dart';
import '../../../core/services/api_service.dart';

final myOrdersProvider = FutureProvider.autoDispose<List<OrderModel>>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.myOrders);
  return (resp.data as List).map((e) => OrderModel.fromJson(e)).toList();
});

final orderDetailProvider = FutureProvider.autoDispose.family<OrderModel, String>((ref, id) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.orderById(id));
  return OrderModel.fromJson(resp.data);
});

final myBagProvider = FutureProvider.autoDispose<BagModel?>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.bagMine);
  if (resp.data == null) return null;
  return BagModel.fromJson(resp.data);
});

final itemCatalogProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.items);
  return (resp.data as List).map((e) => Map<String, dynamic>.from(e)).toList();
});

final laundryHistoryProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.laundryHistory);
  return Map<String, dynamic>.from(resp.data);
});
