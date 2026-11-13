class NotificationModel {
  final String id;
  final String? orderId;
  final String category;
  final String title;
  final String body;
  final bool isRead;
  final DateTime sentAt;

  const NotificationModel({
    required this.id,
    required this.category,
    required this.title,
    required this.body,
    required this.isRead,
    required this.sentAt,
    this.orderId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> j) => NotificationModel(
        id: j['id'] as String,
        orderId: j['order_id'] as String?,
        category: j['category'] as String? ?? '',
        title: j['title'] as String,
        body: j['body'] as String,
        isRead: j['is_read'] as bool,
        sentAt: DateTime.parse(j['sent_at'] as String),
      );
}
