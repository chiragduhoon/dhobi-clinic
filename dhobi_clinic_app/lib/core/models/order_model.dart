import '../constants/app_strings.dart';

class OrderItem {
  final String itemType;
  final String category; // large | small
  final int quantity;
  const OrderItem({required this.itemType, required this.category, required this.quantity});
  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        itemType: j['item_type'] as String,
        category: j['category'] as String? ?? 'large',
        quantity: j['quantity'] as int,
      );
}

class StageEvent {
  final String stage;
  final String kind; // advance | rework | exception
  final String? notes;
  final String? workerName;
  final DateTime at;
  const StageEvent({required this.stage, required this.kind, required this.at, this.notes, this.workerName});
  factory StageEvent.fromJson(Map<String, dynamic> j) => StageEvent(
        stage: j['stage'] as String,
        kind: j['kind'] as String? ?? 'advance',
        notes: j['notes'] as String?,
        workerName: j['worker_name'] as String?,
        at: DateTime.parse(j['completed_at'] as String),
      );
}

class OrderModel {
  final String id;
  final String currentStage;
  final String? exceptionState;
  final String? bagNumber;
  final DateTime? expectedCompletionTime;
  final DateTime? submittedAt;
  final DateTime? deliveredAt;
  final int totalItems;
  final int reworkCount;
  final String? notes;
  final String? collectionOtp;
  final String? currentHandlerName;
  final String? studentName;
  final String? enrollmentNo;
  final String? hostel;
  final String? roomNumber;
  final List<OrderItem> items;
  final List<StageEvent> timeline;

  const OrderModel({
    required this.id,
    required this.currentStage,
    this.exceptionState,
    this.bagNumber,
    this.expectedCompletionTime,
    this.submittedAt,
    this.deliveredAt,
    this.totalItems = 0,
    this.reworkCount = 0,
    this.notes,
    this.collectionOtp,
    this.currentHandlerName,
    this.studentName,
    this.enrollmentNo,
    this.hostel,
    this.roomNumber,
    this.items = const [],
    this.timeline = const [],
  });

  factory OrderModel.fromJson(Map<String, dynamic> j) {
    DateTime? dt(String k) => j[k] != null ? DateTime.tryParse(j[k].toString()) : null;
    return OrderModel(
      id: j['id'] as String,
      currentStage: j['current_stage'] as String,
      exceptionState: j['exception_state'] as String?,
      bagNumber: j['bag_number'] as String?,
      expectedCompletionTime: dt('expected_completion_time'),
      submittedAt: dt('submitted_at'),
      deliveredAt: dt('delivered_at'),
      totalItems: int.tryParse('${j['total_items'] ?? 0}') ?? 0,
      reworkCount: j['rework_count'] as int? ?? 0,
      notes: j['remarks'] as String?,
      collectionOtp: j['collection_otp'] as String?,
      currentHandlerName: j['current_handler_name'] as String?,
      studentName: j['student_name'] as String?,
      enrollmentNo: j['enrollment_no'] as String?,
      hostel: j['hostel'] as String?,
      roomNumber: j['room_number'] as String?,
      items: (j['items'] as List?)?.map((e) => OrderItem.fromJson(e)).toList() ?? const [],
      timeline: (j['timeline'] as List?)?.map((e) => StageEvent.fromJson(e)).toList() ?? const [],
    );
  }

  int get stageIndex => AppStrings.stages.indexOf(currentStage);
  bool get isDelivered => currentStage == 'delivered';
  bool get isReady => currentStage == 'ready_for_collection';
  bool get hasException => exceptionState != null;
}
