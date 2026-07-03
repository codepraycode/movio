import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/utils/validators.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/double_back_to_exit.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/primary_button.dart';
import '../state/auth_provider.dart';
import '../widgets/auth_scaffold.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final ok = await auth.login(email: _email.text, password: _password.text);

    if (!mounted) return;
    if (!ok) {
      AppSnackbar.error(context, auth.errorMessage ?? 'Login failed');
    }
    // On success, AuthProvider flips to authenticated and AuthGate swaps to home.
  }

  void _goToRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const RegisterScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final submitting = context.watch<AuthProvider>().submitting;

    return DoubleBackToExit(
      child: AuthScaffold(
        title: 'Welcome back',
        subtitle: 'Sign in to continue with MovIO',
        form: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Entrance(
                child: AppTextField(
                  label: 'Email',
                  controller: _email,
                  hint: 'you@futa.edu.ng',
                  prefixIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: Validators.email,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Entrance(
                delay: const Duration(milliseconds: 80),
                child: AppTextField(
                  label: 'Password',
                  controller: _password,
                  hint: 'Your password',
                  prefixIcon: Icons.lock_outline,
                  obscure: true,
                  textInputAction: TextInputAction.done,
                  validator: Validators.password,
                  onFieldSubmitted: (_) => _submit(),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Entrance(
                delay: const Duration(milliseconds: 160),
                child: PrimaryButton(
                  label: 'Sign in',
                  loading: submitting,
                  onPressed: _submit,
                ),
              ),
            ],
          ),
        ),
        footer: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Don't have an account?", style: AppTypography.bodyMd),
            TextButton(
              onPressed: submitting ? null : _goToRegister,
              child: Text(
                'Create one',
                style: AppTypography.button.copyWith(
                  fontSize: 14,
                  color: AppColors.brand700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
