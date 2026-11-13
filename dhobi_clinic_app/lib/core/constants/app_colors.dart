import 'package:flutter/material.dart';

class AppColors {
  // Dark blue / white / light gray — professional university management palette
  static const primary = Color(0xFF1E3A8A);       // blue-900
  static const primaryLight = Color(0xFF3B82F6);   // blue-500
  static const primaryDark = Color(0xFF172554);    // blue-950
  static const accent = Color(0xFF2563EB);         // blue-600
  static const background = Color(0xFFF1F5F9);      // slate-100
  static const surface = Colors.white;
  static const error = Color(0xFFDC2626);
  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFD97706);
  static const textPrimary = Color(0xFF0F172A);    // slate-900
  static const textSecondary = Color(0xFF64748B);  // slate-500
  static const divider = Color(0xFFE2E8F0);        // slate-200

  // Stage colors (10-stage workflow)
  static const Map<String, Color> stage = {
    'requested': Color(0xFF94A3B8),
    'submitted': Color(0xFF64748B),
    'accepted': Color(0xFF2563EB),
    'sorting': Color(0xFF7C3AED),
    'washing': Color(0xFF0891B2),
    'drying': Color(0xFF0D9488),
    'ironing': Color(0xFFD97706),
    'quality_check': Color(0xFFCA8A04),
    'ready_for_collection': Color(0xFF16A34A),
    'delivered': Color(0xFF15803D),
  };

  static Color stageColor(String s) => stage[s] ?? textSecondary;

  static const Map<String, Color> exception = {
    'on_hold': Color(0xFFD97706),
    'damaged': Color(0xFFDC2626),
    'reported_missing': Color(0xFFB91C1C),
    'investigation': Color(0xFF9333EA),
  };
}
