import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController(), _email = TextEditingController(),
      _pass = TextEditingController(), _enroll = TextEditingController(),
      _hostel = TextEditingController(), _room = TextEditingController(),
      _phone = TextEditingController();
  bool _loading = false, _obscure = true;

  @override
  void dispose() {
    for (final c in [_name, _email, _pass, _enroll, _hostel, _room, _phone]) { c.dispose(); }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    final err = await ref.read(authProvider.notifier).register({
      'name': _name.text.trim(), 'email': _email.text.trim(), 'password': _pass.text,
      'enrollment_no': _enroll.text.trim(), 'hostel': _hostel.text.trim(),
      'room_number': _room.text.trim(), 'phone': _phone.text.trim(),
    });
    if (mounted) setState(() => _loading = false);
    if (err != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Registration'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/login')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _form,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Create your account', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('Your bag will be issued at the laundry counter.',
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              _field(_name, 'Full Name', Icons.person_outline,
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null, cap: TextCapitalization.words),
              _field(_email, 'Email', Icons.email_outlined, keyboard: TextInputType.emailAddress,
                  validator: (v) => !v!.contains('@') ? 'Invalid email' : null),
              _field(_pass, 'Password', Icons.lock_outline, obscure: _obscure,
                  validator: (v) => v!.length < 6 ? 'Min 6 characters' : null,
                  suffix: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure))),
              _field(_enroll, 'Enrollment Number', Icons.badge_outlined, cap: TextCapitalization.characters,
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null),
              Row(children: [
                Expanded(child: _field(_hostel, 'Hostel', Icons.apartment, hint: 'BH-1')),
                const SizedBox(width: 12),
                Expanded(child: _field(_room, 'Room', Icons.meeting_room_outlined, hint: 'A-204')),
              ]),
              _field(_phone, 'Phone (optional)', Icons.phone_outlined, keyboard: TextInputType.phone),
              const SizedBox(height: 16),
              _loading
                  ? const Center(child: CircularProgressIndicator())
                  : ElevatedButton(onPressed: _submit, child: const Text('Create Account')),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Already have an account? Login'),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label, IconData icon,
      {bool obscure = false, TextInputType? keyboard, String? hint, Widget? suffix,
      String? Function(String?)? validator, TextCapitalization cap = TextCapitalization.none}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: c, obscureText: obscure, keyboardType: keyboard, textCapitalization: cap,
        decoration: InputDecoration(labelText: label, hintText: hint, prefixIcon: Icon(icon), suffixIcon: suffix),
        validator: validator,
      ),
    );
  }
}
