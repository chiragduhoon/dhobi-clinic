import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

class AuthService {
  static const _tokenKey = 'jwt_token';
  final _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> deleteToken() => _storage.delete(key: _tokenKey);

  Future<bool> hasToken() async => (await getToken()) != null;
}
