import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/fcm_service.dart';
import '../../../core/constants/api_constants.dart';

enum AuthStatus { loading, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  const AuthState({required this.status, this.user});
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _api;
  final AuthService _authService;
  final FcmService _fcm;

  AuthNotifier(this._api, this._authService, this._fcm)
      : super(const AuthState(status: AuthStatus.loading)) {
    _check();
  }

  Future<void> _check() async {
    if (!await _authService.hasToken()) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final resp = await _api.get(ApiConstants.me);
      state = AuthState(status: AuthStatus.authenticated, user: UserModel.fromJson(resp.data));
    } catch (_) {
      await _authService.deleteToken();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<String?> login(String email, String password) async {
    try {
      final resp = await _api.post(ApiConstants.login, data: {'email': email, 'password': password});
      await _authService.saveToken(resp.data['token']);
      state = AuthState(status: AuthStatus.authenticated, user: UserModel.fromJson(resp.data['user']));
      _fcm.getAndUploadToken();
      return null;
    } catch (_) {
      return 'Invalid email or password';
    }
  }

  Future<String?> register(Map<String, dynamic> body) async {
    try {
      final resp = await _api.post(ApiConstants.register, data: body);
      await _authService.saveToken(resp.data['token']);
      state = AuthState(status: AuthStatus.authenticated, user: UserModel.fromJson(resp.data['user']));
      _fcm.getAndUploadToken();
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      return (data is Map ? data['error'] as String? : null) ?? 'Registration failed';
    } catch (_) {
      return 'Registration failed';
    }
  }

  void refreshUser(UserModel user) => state = AuthState(status: AuthStatus.authenticated, user: user);

  Future<void> logout() async {
    await _fcm.removeToken();
    await _authService.deleteToken();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(
      ref.read(apiServiceProvider), ref.read(authServiceProvider), ref.read(fcmServiceProvider),
    ));
