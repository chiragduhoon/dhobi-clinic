import 'bag_model.dart';
import 'order_model.dart';

class ScanStudent {
  final String? id, name, enrollmentNo, hostel, roomNumber, phone;
  const ScanStudent({this.id, this.name, this.enrollmentNo, this.hostel, this.roomNumber, this.phone});
  factory ScanStudent.fromJson(Map<String, dynamic> j) => ScanStudent(
        id: j['id'] as String?, name: j['name'] as String?,
        enrollmentNo: j['enrollment_no'] as String?, hostel: j['hostel'] as String?,
        roomNumber: j['room_number'] as String?, phone: j['phone'] as String?,
      );
}

class ScanResult {
  final BagModel bag;
  final ScanStudent? student;
  final OrderModel? activeOrder;
  const ScanResult({required this.bag, this.student, this.activeOrder});

  factory ScanResult.fromJson(Map<String, dynamic> j) => ScanResult(
        bag: BagModel.fromJson(j['bag'] as Map<String, dynamic>),
        student: j['student'] != null ? ScanStudent.fromJson(j['student']) : null,
        activeOrder: j['active_order'] != null ? OrderModel.fromJson(j['active_order']) : null,
      );
}
