import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_laundry_service, size: 80, color: Colors.white),
            SizedBox(height: 16),
            Text(
              AppStrings.appName,
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            SizedBox(height: 8),
            Text('University Laundry', style: TextStyle(color: Colors.white70, fontSize: 16)),
            SizedBox(height: 48),
            CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
