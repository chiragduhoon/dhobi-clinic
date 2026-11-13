import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/models/notification_model.dart';
import '../../../core/services/api_service.dart';

final notificationsProvider = FutureProvider.autoDispose<List<NotificationModel>>((ref) async {
  final resp = await ref.read(apiServiceProvider).get(ApiConstants.notifications);
  return (resp.data as List).map((e) => NotificationModel.fromJson(e)).toList();
});

final unreadCountProvider = Provider.autoDispose<int>((ref) {
  return ref.watch(notificationsProvider).maybeWhen(
        data: (list) => list.where((n) => !n.isRead).length,
        orElse: () => 0,
      );
});
