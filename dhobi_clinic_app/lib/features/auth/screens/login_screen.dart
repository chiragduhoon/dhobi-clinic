import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController(), _pass = TextEditingController();
  bool _loading = false, _obscure = true;

  @override
  void dispose() { _email.dispose(); _pass.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    final err = await ref.read(authProvider.notifier).login(_email.text.trim(), _pass.text);
    if (mounted) setState(() => _loading = false);
    if (err != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.local_laundry_service, size: 72, color: AppColors.primary),
              const SizedBox(height: 12),
              Text(AppStrings.appName,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.primary, fontWeight: FontWeight.bold)),
              const Text(AppStrings.tagline, style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 40),
              Form(
                key: _form,
                child: Column(children: [
                  TextFormField(
                    controller: _email, keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                    validator: (v) => v == null || !v.contains('@') ? 'Enter a valid email' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _pass, obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: 'Password', prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscure = !_obscure)),
                    ),
                    validator: (v) => v == null || v.length < 6 ? 'Password too short' : null,
                  ),
                  const SizedBox(height: 28),
                  _loading
                      ? const CircularProgressIndicator()
                      : ElevatedButton(onPressed: _submit, child: const Text('Login')),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => context.go('/register'),
                    child: const Text("Don't have an account? Register"),
                  ),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
