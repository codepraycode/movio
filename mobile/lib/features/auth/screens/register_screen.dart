import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/utils/validators.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../state/auth_provider.dart';
import '../widgets/auth_scaffold.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _matricNo = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    for (final c in [_firstName, _lastName, _matricNo, _email, _phone, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      matricNo: _matricNo.text,
      firstName: _firstName.text,
      lastName: _lastName.text,
      email: _email.text,
      password: _password.text,
      phone: _phone.text,
    );

    if (!mounted) return;
    if (!ok) {
      AppSnackbar.error(context, auth.errorMessage ?? 'Registration failed');
    }
    // On success, AuthProvider flips to authenticated and AuthGate swaps to home.
  }

  @override
  Widget build(BuildContext context) {
    final submitting = context.watch<AuthProvider>().submitting;

    return AuthScaffold(
      title: 'Create your account',
      subtitle: 'Register with your FUTA student details',
      form: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: AppTextField(
                    label: 'First name',
                    controller: _firstName,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    validator: (v) => Validators.required(v, field: 'First name'),
                  ),
                ),
                const SizedBox(width: AppSpacing.lg),
                Expanded(
                  child: AppTextField(
                    label: 'Last name',
                    controller: _lastName,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    validator: (v) => Validators.required(v, field: 'Last name'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              label: 'Matric number',
              controller: _matricNo,
              hint: 'e.g. CSC/18/1234',
              prefixIcon: Icons.badge_outlined,
              textCapitalization: TextCapitalization.characters,
              textInputAction: TextInputAction.next,
              validator: Validators.matricNo,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              label: 'Email',
              controller: _email,
              hint: 'you@futa.edu.ng',
              prefixIcon: Icons.mail_outline,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              validator: Validators.email,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              label: 'Phone (optional)',
              controller: _phone,
              hint: '0803 000 0000',
              prefixIcon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              validator: Validators.optionalPhone,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              label: 'Password',
              controller: _password,
              hint: 'At least 6 characters',
              prefixIcon: Icons.lock_outline,
              obscure: true,
              textInputAction: TextInputAction.next,
              validator: Validators.password,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppTextField(
              label: 'Confirm password',
              controller: _confirm,
              hint: 'Re-enter your password',
              prefixIcon: Icons.lock_outline,
              obscure: true,
              textInputAction: TextInputAction.done,
              validator: (v) => Validators.confirmPassword(v, _password.text),
              onFieldSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: AppSpacing.xxl),
            PrimaryButton(
              label: 'Create account',
              loading: submitting,
              onPressed: _submit,
            ),
          ],
        ),
      ),
      footer: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Already have an account?', style: AppTypography.bodyMd),
          TextButton(
            onPressed: submitting ? null : () => Navigator.of(context).pop(),
            child: Text(
              'Sign in',
              style: AppTypography.button.copyWith(
                fontSize: 14,
                color: AppColors.brand700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
