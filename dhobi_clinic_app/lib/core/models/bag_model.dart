class BagModel {
  final String id;
  final String bagNumber;
  final String qrToken;
  final DateTime? issueDate;
  final bool isActive;

  const BagModel({
    required this.id,
    required this.bagNumber,
    required this.qrToken,
    this.issueDate,
    this.isActive = true,
  });

  factory BagModel.fromJson(Map<String, dynamic> j) => BagModel(
        id: j['id'] as String,
        bagNumber: j['bag_number'] as String,
        qrToken: j['qr_token'] as String,
        issueDate: j['issue_date'] != null ? DateTime.tryParse(j['issue_date'].toString()) : null,
        isActive: j['is_active'] as bool? ?? true,
      );
}
