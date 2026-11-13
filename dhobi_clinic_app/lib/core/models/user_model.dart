class UserModel {
  final String id;
  final String name;
  final String email;
  final String role; // student | worker | admin
  final String? enrollmentNo;
  final String? hostel;
  final String? roomNumber;
  final String? phone;
  final String? staffCode;
  final String? specialtyRole;
  final Map<String, dynamic> notificationPrefs;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.enrollmentNo,
    this.hostel,
    this.roomNumber,
    this.phone,
    this.staffCode,
    this.specialtyRole,
    this.notificationPrefs = const {},
  });

  factory UserModel.fromJson(Map<String, dynamic> j) => UserModel(
        id: j['id'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
        role: j['role'] as String,
        enrollmentNo: j['enrollment_no'] as String?,
        hostel: j['hostel'] as String?,
        roomNumber: j['room_number'] as String?,
        phone: j['phone'] as String?,
        staffCode: j['staff_code'] as String?,
        specialtyRole: j['specialty_role'] as String?,
        notificationPrefs:
            (j['notification_prefs'] as Map?)?.cast<String, dynamic>() ?? const {},
      );
}
