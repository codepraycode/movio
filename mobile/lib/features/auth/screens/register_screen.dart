import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/utils/input_formatters.dart';
import '../../../shared/utils/validators.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/double_back_to_exit.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../legal/legal_content.dart';
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

    // Build the E.164 phone (+234…) only if the student entered one.
    final local = nigerianLocalDigits(_phone.text);
    final phone = local.isEmpty ? null : '+234$local';

    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      matricNo: _matricNo.text,
      firstName: _firstName.text,
      lastName: _lastName.text,
      email: _email.text,
      password: _password.text,
      phone: phone,
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

    // Small helper to stagger each field's entrance.
    var step = 0;
    Widget field(Widget child) {
      final w = Entrance(delay: Duration(milliseconds: 60 * step), child: child);
      step++;
      return w;
    }

    return DoubleBackToExit(
      child: AuthScaffold(
        title: 'Create your account',
        subtitle: 'Register with your FUTA student details',
        onBack: submitting ? null : () => Navigator.of(context).pop(),
        form: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              field(AppTextField(
                label: 'First name',
                controller: _firstName,
                hint: 'Enter your first name',
                prefixIcon: Icons.person_outline,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                validator: (v) => Validators.required(v, field: 'First name'),
              )),
              const SizedBox(height: AppSpacing.xl),
              field(AppTextField(
                label: 'Last name',
                controller: _lastName,
                hint: 'Enter your last name',
                prefixIcon: Icons.person_outline,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                validator: (v) => Validators.required(v, field: 'Last name'),
              )),
              const SizedBox(height: AppSpacing.xl),
              field(AppTextField(
                label: 'Matric number',
                controller: _matricNo,
                hint: 'ABC/00/0000',
                prefixIcon: Icons.badge_outlined,
                textCapitalization: TextCapitalization.characters,
                textInputAction: TextInputAction.next,
                inputFormatters: [MatricInputFormatter()],
                validator: Validators.matricNo,
              )),
              const SizedBox(height: AppSpacing.xl),
              field(AppTextField(
                label: 'Email',
                controller: _email,
                hint: 'you@futa.edu.ng',
                prefixIcon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                validator: Validators.email,
              )),
              const SizedBox(height: AppSpacing.xl),
              field(AppTextField(
                label: 'Phone (optional)',
                controller: _phone,
                hint: '803 123 4567',
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                inputFormatters: [NigerianPhoneFormatter()],
                validator: Validators.nigerianPhone,
                prefix: Padding(
                  padding: const EdgeInsets.only(left: 16, right: 10),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('🇳🇬', style: AppTypography.bodyLg),
                      const SizedBox(width: 6),
                      Text('+234', style: AppTypography.dataMd),
                      const SizedBox(width: 10),
                      Container(width: 1, height: 22, color: AppColors.line),
                    ],
                  ),
                ),
              )),
              const SizedBox(height: AppSpacing.xl),
              field(AppTextField(
                label: 'Password',
                controller: _password,
                hint: 'At least 6 characters',
                prefixIcon: Icons.lock_outline,
                obscure: true,
                textInputAction: TextInputAction.next,
                validator: Validators.password,
              )),
              const SizedBox(height: AppSpacing.xl),
              field(AppTextField(
                label: 'Confirm password',
                controller: _confirm,
                hint: 'Re-enter your password',
                prefixIcon: Icons.lock_outline,
                obscure: true,
                textInputAction: TextInputAction.done,
                validator: (v) => Validators.confirmPassword(v, _password.text),
                onFieldSubmitted: (_) => _submit(),
              )),
              const SizedBox(height: AppSpacing.xl),
              field(const _ConsentLine()),
              const SizedBox(height: AppSpacing.lg),
              field(PrimaryButton(
                label: 'Create account',
                loading: submitting,
                onPressed: _submit,
              )),
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
      ),
    );
  }
}

/// The "by creating an account you agree…" line, with Terms and Privacy readable
/// *before* signing up (the documents open as pushed screens). Stateful so the
/// tap recognizers are created once and disposed cleanly.
class _ConsentLine extends StatefulWidget {
  const _ConsentLine();

  @override
  State<_ConsentLine> createState() => _ConsentLineState();
}

class _ConsentLineState extends State<_ConsentLine> {
  late final TapGestureRecognizer _terms = TapGestureRecognizer()
    ..onTap = () => _open(LegalContent.terms());
  late final TapGestureRecognizer _privacy = TapGestureRecognizer()
    ..onTap = () => _open(LegalContent.privacy());

  void _open(Widget doc) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => doc));
  }

  @override
  void dispose() {
    _terms.dispose();
    _privacy.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final linkStyle = AppTypography.caption.copyWith(
      color: AppColors.brand700,
      fontWeight: FontWeight.w600,
      decoration: TextDecoration.underline,
      decorationColor: AppColors.brand700,
    );

    return Text.rich(
      TextSpan(
        style: AppTypography.caption,
        children: [
          const TextSpan(text: 'By creating an account, you agree to our '),
          TextSpan(text: 'Terms of Service', style: linkStyle, recognizer: _terms),
          const TextSpan(text: ' and '),
          TextSpan(text: 'Privacy Policy', style: linkStyle, recognizer: _privacy),
          const TextSpan(text: '.'),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }
}
