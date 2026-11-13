class AppStrings {
  static const appName = 'Dhobi Clinic';
  static const tagline = 'Bennett University Laundry';

  // Ordered workflow stages + display labels
  static const stages = [
    'requested', 'submitted', 'accepted', 'sorting', 'washing',
    'drying', 'ironing', 'quality_check', 'ready_for_collection', 'delivered',
  ];

  static const Map<String, String> stageLabel = {
    'requested': 'Order Created',
    'submitted': 'Bag Submitted',
    'accepted': 'Accepted',
    'sorting': 'Sorted',
    'washing': 'Washed',
    'drying': 'Dried',
    'ironing': 'Ironed',
    'quality_check': 'Quality Checked',
    'ready_for_collection': 'Ready for Collection',
    'delivered': 'Delivered',
  };

  // Short labels for chips / current-state display
  static const Map<String, String> stageState = {
    'requested': 'Created',
    'submitted': 'Submitted',
    'accepted': 'Accepted',
    'sorting': 'Sorting',
    'washing': 'Washing',
    'drying': 'Drying',
    'ironing': 'Ironing',
    'quality_check': 'Quality Check',
    'ready_for_collection': 'Ready',
    'delivered': 'Delivered',
  };

  static const Map<String, String> exceptionLabel = {
    'on_hold': 'On Hold',
    'damaged': 'Damaged',
    'reported_missing': 'Reported Missing',
    'investigation': 'Under Investigation',
  };

  // Action label a worker sees for completing the CURRENT stage
  static String completeActionLabel(String currentStage) {
    const map = {
      'submitted': 'Accept Bag',
      'accepted': 'Mark Sorted',
      'sorting': 'Mark Washed',
      'washing': 'Mark Dried',
      'drying': 'Mark Ironed',
      'ironing': 'Mark Quality Checked',
      'quality_check': 'Mark Ready for Collection',
    };
    return map[currentStage] ?? 'Complete Stage';
  }

  // Daily caps (Bennett rule)
  static const maxLarge = 10, maxSmall = 5, maxTotal = 15;
}
